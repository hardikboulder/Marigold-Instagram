/**
 * Central dispatcher for all branded outreach emails.
 *
 * `generateEmail` takes a form template type and parameters, returns the
 * subject + HTML for that template. Used by the API route, the in-app
 * EmailComposerModal preview, and the "Preview Email" buttons in Settings.
 *
 * For form types that don't have a dedicated branded template (general /
 * any future custom type) we fall back to a generic "we'd love to feature
 * you" email so no flow ever produces a plain mailto.
 */

import type { FormTemplateType } from "@/lib/types";
import { renderEmailLayout } from "./layout";
import { generateVendorPortfolioEmail } from "./vendor-portfolio";
import { generateVendorTipsEmail } from "./vendor-tips";
import { generateVenueEmail } from "./venue";
import { generateConfessionEmail } from "./confession";
import { generateBrideConnectEmail } from "./bride-connect";
import { generateBrideDiaryEmail } from "./bride-diary";
import { generateWeddingRecapEmail } from "./wedding-recap";

export interface GenerateEmailParams {
  formType: FormTemplateType;
  vendorName: string;
  formUrl: string;
  category?: string;
  personalNote?: string;
}

export interface GeneratedEmail {
  subject: string;
  html: string;
}

export function generateEmail(params: GenerateEmailParams): GeneratedEmail {
  const { formType } = params;
  switch (formType) {
    case "vendor":
    case "vendor-portfolio":
      return generateVendorPortfolioEmail(params);
    case "vendor-tips":
      return generateVendorTipsEmail(params);
    case "venue":
      return generateVenueEmail(params);
    case "bride-confession":
      return generateConfessionEmail(params);
    case "bride-connect":
      return generateBrideConnectEmail(params);
    case "bride-diary":
      return generateBrideDiaryEmail(params);
    case "wedding-recap":
      return generateWeddingRecapEmail(params);
    case "general":
    default:
      return generateGenericEmail(params);
  }
}

function generateGenericEmail(params: GenerateEmailParams): GeneratedEmail {
  const subject = "We'd love to hear from you 🌼";
  const greeting = params.vendorName?.trim()
    ? `Hi ${params.vendorName.trim()} —`
    : "Hi there —";
  const body = `We're The Marigold — a wedding planning platform built for South Asian weddings. We'd love to connect.

Fill out this short form and we'll be in touch with the next steps.`;

  const html = renderEmailLayout({
    greeting,
    body,
    personalNote: params.personalNote,
    ctaText: "Open the Form",
    ctaUrl: params.formUrl,
    whatToExpect: [
      { icon: "⏱", text: "Takes a few minutes — short and to the point" },
      { icon: "💌", text: "We read every submission" },
      { icon: "🌼", text: "We'll reply personally if there's a fit" },
    ],
    signoffLine: "Looking forward to hearing from you,",
    signoffName: "— The Marigold Team",
    preheader: "A short form, a real reply.",
  });

  return { subject, html };
}

/**
 * Plain-text fallback for the "Open in Mail Client" button when the user
 * doesn't have a Resend API key configured.
 */
export function generatePlainTextFallback(params: GenerateEmailParams): {
  subject: string;
  body: string;
} {
  const { subject } = generateEmail(params);
  const greeting = params.vendorName?.trim()
    ? `Hi ${params.vendorName.trim()} —`
    : "Hi there —";
  const body = [
    greeting,
    "",
    `We're The Marigold — a wedding planning platform for South Asian weddings.`,
    `We'd love to feature you. Here's the link:`,
    "",
    params.formUrl,
    "",
    params.personalNote?.trim() ? `${params.personalNote.trim()}\n` : "",
    "Looking forward to hearing from you!",
    "— The Marigold Team",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
  return { subject, body };
}
