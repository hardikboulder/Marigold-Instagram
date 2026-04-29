/**
 * Vendor Portfolio request — sent to photographers, decorators, planners,
 * etc. asking them to upload a few photos and a short bio.
 */

import { renderEmailLayout } from "./layout";

export interface VendorPortfolioParams {
  vendorName: string;
  formUrl: string;
  category?: string;
  personalNote?: string;
}

export function generateVendorPortfolioEmail(params: VendorPortfolioParams): {
  subject: string;
  html: string;
} {
  const subject = "We'd love to feature your work on The Marigold 🌼";
  const greeting = `Hi ${params.vendorName?.trim() || "there"} —`;
  const categoryLine = params.category
    ? `your ${params.category.toLowerCase()} work caught our eye and `
    : "";
  const body = `We've been admiring your work and ${categoryLine}we think our audience would love it.

The Marigold is a wedding planning platform built for South Asian weddings — and we're building an Instagram community around the vendors, planners, and creatives who make desi weddings unforgettable.

We'd love to feature you. Just upload a few of your favorite shots, share a quick quote, and we'll handle the rest.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Share Your Portfolio",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "⏱", text: "Takes 3 minutes — upload photos, write a quick bio" },
      { icon: "📸", text: "Full credit — you'll be tagged and linked in every post" },
      { icon: "👰", text: "Reach — our audience is brides actively planning their weddings" },
    ],
    signoffLine: "With love and good lighting,",
    signoffName: "— The Marigold Team",
    preheader: "A 3-minute portfolio share — full credit, real reach.",
  });

  return { subject, html };
}
