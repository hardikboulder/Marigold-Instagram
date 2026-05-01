/**
 * Shared NVIDIA NIM chat client.
 *
 * Replaces the previous Anthropic Claude client. All AI text generation in
 * the app routes through this — calendar planning, single-post generation,
 * caption writing, variations, blog posts, template concepts.
 *
 * Reads NVIDIA_API_KEY from env (the .env.local.example value is wrapped in
 * quotes, so we strip them defensively).
 */

const NIM_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export const NVIDIA_MODELS = {
  /** Best general-quality 70B model — used for content generation + concepts. */
  general: "meta/llama-3.3-70b-instruct",
  /** Tuned for instruction-following + structured JSON — used for blog posts. */
  reasoning: "nvidia/llama-3.3-nemotron-super-49b-v1",
} as const;

export interface NvidiaCallOpts {
  system: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

function getApiKey(): string {
  const raw = process.env.NVIDIA_API_KEY?.replace(/^"|"$/g, "").trim();
  if (!raw || raw.length < 10) {
    throw new Error(
      "NVIDIA_API_KEY is not set. Add it to .env.local before calling the AI engine.",
    );
  }
  return raw;
}

export async function callNvidia(opts: NvidiaCallOpts): Promise<string> {
  const apiKey = getApiKey();
  const res = await fetch(NIM_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? NVIDIA_MODELS.general,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.userMessage },
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NVIDIA NIM error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text: string = (data?.choices?.[0]?.message?.content ?? "").trim();
  if (!text) {
    throw new Error("NVIDIA NIM returned an empty response.");
  }
  return text;
}
