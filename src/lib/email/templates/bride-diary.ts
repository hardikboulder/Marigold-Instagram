/**
 * Bride Diary submission — invites a bride to submit a journal entry
 * about where she is in planning right now.
 */

import { renderEmailLayout } from "./layout";

export interface BrideDiaryParams {
  vendorName?: string;
  formUrl: string;
  personalNote?: string;
}

export function generateBrideDiaryEmail(params: BrideDiaryParams): {
  subject: string;
  html: string;
} {
  const subject = "Your planning story deserves to be heard 🌼";
  const greeting = params.vendorName?.trim()
    ? `Hi ${params.vendorName.trim()} —`
    : "Hi there —";
  const body = `We run a series called Real Bride Diaries on our Instagram — first-person snippets from brides at every stage of planning. The raw, real, unfiltered experience.

If you've got something to share — a win, a rant, a realization, a meltdown, a moment of clarity — we'd love to feature it.

It can be 3 sentences or 30. Whatever feels right.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Write Your Entry",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "📖", text: "Long or short — your call. The honesty is what matters" },
      { icon: "🪞", text: "Optional name — go by your initial if you'd rather stay private" },
      { icon: "💌", text: "Your entry will help another bride feel seen" },
    ],
    signoffLine: "Every bride's story matters,",
    signoffName: "— The Marigold Team",
    preheader: "A 3-sentence story can change another bride's whole week.",
  });

  return { subject, html };
}
