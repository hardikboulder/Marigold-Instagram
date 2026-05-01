/**
 * POST /api/transcribe
 *
 * Accepts multipart/form-data:
 *   audio       — single audio chunk (MP3/WAV/M4A, max 25 MB)
 *   script      — optional reference text used as Whisper prompt for accuracy
 *   offsetSec   — float, time offset of this chunk within the full audio (default 0)
 *
 * Chunking is handled client-side. The caller splits long audio into ~60s WAV
 * blobs using the Web Audio API and calls this endpoint once per chunk, passing
 * the running time offset so timestamps are absolute.
 *
 * Returns:
 *   { ok: true, words: Array<{ text: string; start: number; end: number }> }
 *   { ok: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperResponse {
  text?: string;
  words?: WhisperWord[];
  segments?: Array<{ words?: WhisperWord[] }>;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY?.replace(/^"|"$/g, "").trim();
  if (!apiKey || apiKey === "gsk_..." || apiKey.length < 10) {
    return NextResponse.json(
      { ok: false, error: "GROQ_API_KEY is not set. Get a free key at https://console.groq.com and add it to .env.local." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart form data." }, { status: 400 });
  }

  const audioEntry = formData.get("audio");
  if (!audioEntry || !(audioEntry instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "Missing audio field." }, { status: 400 });
  }

  if (audioEntry.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Audio chunk exceeds 25 MB. Split into smaller chunks." },
      { status: 413 }
    );
  }

  // Time offset of this chunk within the full recording (seconds)
  const offsetSec = parseFloat((formData.get("offsetSec") as string) ?? "0") || 0;

  const groqForm = new FormData();
  groqForm.append("file", audioEntry, (audioEntry as File).name ?? "audio.wav");
  // whisper-large-v3 (not turbo) handles the full file in a single call —
  // higher accuracy and no chunk-boundary issues. Free tier same as turbo.
  groqForm.append("model", "whisper-large-v3");
  groqForm.append("response_format", "verbose_json");
  groqForm.append("timestamp_granularities[]", "word");
  groqForm.append("language", "en");
  // temperature=0 dramatically reduces hallucinations during music/silence
  groqForm.append("temperature", "0");

  // Send last ~224 tokens of prior context as Whisper prompt for cross-chunk continuity
  const script = formData.get("script");
  if (script && typeof script === "string" && script.trim()) {
    groqForm.append("prompt", script.trim().slice(-500).slice(0, 224));
  }

  let raw: WhisperResponse;
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq Whisper error:", res.status, errText);
      return NextResponse.json(
        { ok: false, error: `Groq API returned ${res.status}: ${errText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    raw = (await res.json()) as WhisperResponse;
  } catch (err) {
    console.error("Transcribe fetch error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not reach Groq API. Check your network connection." },
      { status: 502 }
    );
  }

  const rawWords: WhisperWord[] =
    raw.words ?? raw.segments?.flatMap((s) => s.words ?? []) ?? [];

  if (rawWords.length === 0) {
    const tokens = (raw.text ?? "").trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Groq returned an empty transcript for this chunk." },
        { status: 422 }
      );
    }
    // Evenly distribute over the chunk duration (fallback, no timestamps)
    const chunkDur = 60;
    const step = chunkDur / tokens.length;
    const words = tokens.map((t, i) => ({
      text: t,
      start: parseFloat((offsetSec + i * step).toFixed(3)),
      end: parseFloat((offsetSec + (i + 1) * step).toFixed(3)),
    }));
    return NextResponse.json({ ok: true, words, fallback: true });
  }

  // Shift timestamps by chunk offset so they are absolute within the full audio
  // and drop hallucinated non-Latin tokens (Korean, Cyrillic, CJK, etc.)
  // since this template targets English content.
  const NON_LATIN = /[^\x00-\x7F]/;
  const words = rawWords
    .map((w) => ({
      text: w.word.trim(),
      start: parseFloat((w.start + offsetSec).toFixed(3)),
      end: parseFloat((w.end + offsetSec).toFixed(3)),
    }))
    .filter((w) => w.text.length > 0 && !NON_LATIN.test(w.text));

  return NextResponse.json({ ok: true, words });
}
