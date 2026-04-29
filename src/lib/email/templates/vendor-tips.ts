/**
 * Vendor Tips request — sent to vendors asking for 3-5 quick tips for
 * brides about working with their category.
 */

import { renderEmailLayout } from "./layout";

export interface VendorTipsParams {
  vendorName: string;
  formUrl: string;
  category?: string;
  personalNote?: string;
}

export function generateVendorTipsEmail(params: VendorTipsParams): {
  subject: string;
  html: string;
} {
  const subject = "Your expertise, our audience — let's collaborate 🌼";
  const greeting = `Hi ${params.vendorName?.trim() || "there"} —`;
  const role = params.category?.trim()
    ? params.category.trim().toLowerCase()
    : "vendor";
  const body = `We're putting together a "Tips From Your ${capitalize(role)}" series for our Instagram — and your perspective would be perfect.

We're looking for 3–5 tips you wish every bride knew before hiring a ${role}. The kind of real, honest advice that saves everyone time and makes the working relationship better.

Punchy and practical beats long and thorough — think one-liners with substance.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Share Your Tips",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "⏱", text: "Takes 5 minutes — 3 to 5 short tips, that's it" },
      { icon: "📣", text: "You'll be tagged and credited on every card we publish" },
      { icon: "💛", text: "Helps brides arrive prepared — better experience for everyone" },
    ],
    signoffLine: "Cheers and no more midnight inquiry emails,",
    signoffName: "— The Marigold Team",
    preheader: "3–5 short tips that will save brides (and you) so much time.",
  });

  return { subject, html };
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
