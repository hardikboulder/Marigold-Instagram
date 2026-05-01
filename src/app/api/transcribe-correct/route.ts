/**
 * POST /api/transcribe-correct
 *
 * Takes a raw word-timestamp array from Groq Whisper and runs an NVIDIA NIM
 * LLM correction pass (llama-3.2-3b-instruct) to fix typos, homophones, and
 * hallucinations — preserving original timestamps exactly.
 *
 * Body (JSON):
 *   { words: Array<{ text: string; start: number; end: number }>, script?: string }
 *
 * Returns:
 *   { ok: true, words: Array<{ text: string; start: number; end: number }> }
 *   { ok: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WordToken {
  text: string;
  start: number;
  end: number;
}

const NIM_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.1-8b-instruct";

export async function POST(req: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY?.replace(/^"|"$/g, "").trim();
  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json(
      { ok: false, error: "NVIDIA_API_KEY not configured." },
      { status: 500 }
    );
  }

  let body: { words: WordToken[]; script?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { words, script } = body;
  if (!Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing words array." }, { status: 400 });
  }

  const rawTranscript = words.map((w) => w.text).join(" ");
  const wordCount = words.length;

  const systemPrompt = `You are a transcript correction assistant for an English-only speech-to-text system. Fix:
1. Spelling errors and wrong homophones (e.g. "their" vs "there")
2. Whisper hallucinations: any non-English word, foreign script (Korean/Russian/CJK/Arabic), or nonsense word — replace with the most likely English word given context, OR with the previous word if context is unclear.
3. Garbled fragments (single letters, weird symbols) — replace with the most likely English word.

RULES:
- Return EXACTLY ${wordCount} strings in the same order
- Do NOT add, remove, or reorder words
- Do NOT rephrase clean English words
- Output ONLY the JSON array — no markdown, no commentary, no code fences`;

  const userPrompt = `Correct this ${wordCount}-word English speech transcript. Return exactly ${wordCount} strings as a JSON array.${script ? `\n\nReference script the speaker is reading from:\n"""${script.slice(0, 1500)}"""\n\nUse this script to align corrections.\n` : ""}

Raw transcript:
${rawTranscript}

JSON array of ${wordCount} corrected words:`;

  try {
    const res = await fetch(NIM_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: Math.max(1024, wordCount * 12),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("NVIDIA NIM correction error:", res.status, errText);
      // Non-fatal — return original words
      return NextResponse.json({ ok: true, words, correctionSkipped: true });
    }

    const data = await res.json();
    const responseText: string = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON array from response — greedy match to capture the full array
    // even if the model adds prose around it
    const firstBracket = responseText.indexOf("[");
    const lastBracket = responseText.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
      console.warn("NVIDIA correction: no JSON array in response, skipping correction");
      return NextResponse.json({ ok: true, words, correctionSkipped: true });
    }
    const jsonText = responseText.slice(firstBracket, lastBracket + 1);

    let correctedTexts: string[];
    try {
      correctedTexts = JSON.parse(jsonText);
    } catch {
      console.warn("NVIDIA correction: failed to parse JSON, skipping");
      return NextResponse.json({ ok: true, words, correctionSkipped: true });
    }

    // Validate — must be same length and all strings
    if (
      !Array.isArray(correctedTexts) ||
      correctedTexts.length !== wordCount ||
      !correctedTexts.every((t) => typeof t === "string")
    ) {
      console.warn("NVIDIA correction: length mismatch, skipping");
      return NextResponse.json({ ok: true, words, correctionSkipped: true });
    }

    // Merge corrected text back onto original timestamps
    const correctedWords: WordToken[] = words.map((w, i) => ({
      ...w,
      text: correctedTexts[i].trim() || w.text,
    }));

    return NextResponse.json({ ok: true, words: correctedWords });
  } catch (err) {
    console.error("NVIDIA correction fetch error:", err);
    // Non-fatal — return original words unchanged
    return NextResponse.json({ ok: true, words, correctionSkipped: true });
  }
}
