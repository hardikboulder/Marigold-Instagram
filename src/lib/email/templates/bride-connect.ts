/**
 * Bride Connect Profile request — invites brides to fill in a planning
 * profile so we can match them with another bride in the same city /
 * timeline.
 */

import { renderEmailLayout } from "./layout";

export interface BrideConnectParams {
  vendorName?: string;
  formUrl: string;
  personalNote?: string;
}

export function generateBrideConnectEmail(params: BrideConnectParams): {
  subject: string;
  html: string;
} {
  const subject = "Find your wedding planning bestie on The Marigold 💛";
  const greeting = params.vendorName?.trim()
    ? `Hi ${params.vendorName.trim()} —`
    : "Hi there —";
  const body = `Planning a desi wedding can feel lonely — especially when your friends' eyes glaze over at the words "mandap décor options."

The Marigold matches you with other brides planning in the same city, around the same time, with the same energy. Think of it as Hinge, but for finding someone who actually wants to discuss centerpieces.

Fill in your details, tell us what you're looking for, and we'll help you find your planning person.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Create Your Profile",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "🧠", text: "We match by city, wedding date, and what you're stressed about" },
      { icon: "🤝", text: "Real introductions — not just another DM black hole" },
      { icon: "✨", text: "Your info stays private until you opt to share with a match" },
    ],
    signoffLine: "Your wedding bestie is out there,",
    signoffName: "— The Marigold Team",
    preheader: "A match-made wedding planning friend who actually gets it.",
  });

  return { subject, html };
}
