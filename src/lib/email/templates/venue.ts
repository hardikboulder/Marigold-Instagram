/**
 * Venue Submission request — sent to venue owners / sales managers
 * asking them to submit photos, capacity, and pricing for a feature.
 */

import { renderEmailLayout } from "./layout";

export interface VenueParams {
  vendorName: string;
  formUrl: string;
  personalNote?: string;
}

export function generateVenueEmail(params: VenueParams): {
  subject: string;
  html: string;
} {
  const subject = "Showcase your venue to brides planning right now 🌼";
  const greeting = `Hi ${params.vendorName?.trim() || "there"} —`;
  const body = `We're featuring standout wedding venues on The Marigold — and your space caught our eye.

Our audience is South Asian brides actively searching for venues. A feature on our platform puts your venue in front of the right people at the right time.

Just upload your best photos, share the basics (capacity, style, pricing), and we'll create a beautiful feature for you.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Submit Your Venue",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "🏛", text: "Photos, capacity, vibe, ballpark price — that's it" },
      { icon: "📍", text: "Linked from our venue features and Instagram posts" },
      { icon: "💍", text: "Reach brides booking right now, in your city" },
    ],
    signoffLine: "Here's to fully booked wedding seasons,",
    signoffName: "— The Marigold Team",
    preheader: "Your venue, in front of brides booking this season.",
  });

  return { subject, html };
}
