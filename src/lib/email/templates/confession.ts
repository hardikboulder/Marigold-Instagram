/**
 * Bride Confession request — anonymous confession submissions for the
 * Confessional series. The tone here leans irreverent and warm.
 */

import { renderEmailLayout } from "./layout";

export interface ConfessionParams {
  vendorName?: string;
  formUrl: string;
  personalNote?: string;
}

export function generateConfessionEmail(params: ConfessionParams): {
  subject: string;
  html: string;
} {
  const subject = "Got a wedding planning confession? We won't tell. 🤫";
  const greeting = params.vendorName?.trim()
    ? `Hey ${params.vendorName.trim()} —`
    : "Hey —";
  const body = `The Marigold runs an anonymous confession series on our Instagram called The Confessional. Real brides. Real chaos. Zero judgment.

If you've got a secret, a rant, or a moment you can't tell anyone else about — we want to hear it.

It's completely anonymous. We'll never share your name, your handle, or any identifying details. Just the confession, in all its glory.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Confess Anonymously",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "🤐", text: "100% anonymous — no name, no handle, nothing identifiable" },
      { icon: "✍️", text: "Takes 2 minutes — just type and submit" },
      { icon: "💛", text: "Other brides will read it and feel less alone" },
    ],
    signoffLine: "Your secret is safe with us (and 10,000 followers),",
    signoffName: "— The Marigold Team",
    preheader: "Anonymous, judgement-free, takes 2 minutes.",
  });

  return { subject, html };
}
