/**
 * Wedding Recap request — sent to recently married couples asking for
 * photos, vendor credits, and a short story for a real-wedding feature.
 */

import { renderEmailLayout } from "./layout";

export interface WeddingRecapParams {
  vendorName?: string;
  formUrl: string;
  personalNote?: string;
}

export function generateWeddingRecapEmail(params: WeddingRecapParams): {
  subject: string;
  html: string;
} {
  const subject = "Your wedding was beautiful — let's share it 🌼";
  const greeting = params.vendorName?.trim()
    ? `Hi ${params.vendorName.trim()} —`
    : "Hi there —";
  const body = `Congratulations on your wedding! We'd love to feature your celebration on The Marigold — your photos, your story, your vendor recommendations.

It helps other brides find great vendors and venues, and honestly, your wedding deserves to be seen.

Upload your favorite photos, share the vendors who made it happen, and tell us your favorite moment.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Share Your Wedding",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "📸", text: "Photos and a short story — about 10 minutes total" },
      { icon: "🙏", text: "Vendors get full credit and a free spotlight on our feed" },
      { icon: "💍", text: "Helps the next bride find her dream team" },
    ],
    signoffLine: "Here's to the next chapter,",
    signoffName: "— The Marigold Team",
    preheader: "A 10-minute share that helps the next bride.",
  });

  return { subject, html };
}
