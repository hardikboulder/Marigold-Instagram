/**
 * Shared HTML email layout for The Marigold's outreach emails.
 *
 * Email clients are stuck in 2005, so this is table-based with inline CSS
 * only — no <style> blocks, no Google Fonts, no external assets. Web-safe
 * font fallbacks pick up the spirit of Instrument Serif (Georgia) and
 * Space Grotesk (system sans-serif). Caveat-style asides use Georgia italic.
 *
 * Every outreach email goes through `renderEmailLayout` so the brand
 * frame — header, button, "what to expect" strip, sign-off, footer —
 * stays consistent across all seven templates.
 */

export interface WhatToExpectItem {
  /** Single emoji or short symbol. Rendered larger to act as an icon. */
  icon: string;
  /** Plain text — short sentence. */
  text: string;
}

export interface RenderEmailLayoutInput {
  /** Recipient greeting line — e.g. "Hi Priya —". */
  greeting: string;
  /** Body paragraphs (plain text — line breaks become <p> blocks). */
  body: string;
  /** Optional personal note shown in italic Georgia under the body. */
  personalNote?: string;
  ctaText: string;
  ctaUrl: string;
  whatToExpect: WhatToExpectItem[];
  /** Sign-off line, e.g. "With love and good lighting,". */
  signoffLine: string;
  /** Sender attribution, e.g. "— The Marigold Team". */
  signoffName: string;
  /** Optional preview text shown by mail clients (Gmail, Outlook) before opening. */
  preheader?: string;
}

export const BRAND = {
  wine: "#4B1528",
  pink: "#D4537E",
  hotPink: "#ED93B1",
  cream: "#FFF8F2",
  gold: "#D4A853",
  blush: "#FBEAF0",
  mauve: "#9C7783",
} as const;

const FONT_SERIF =
  "Georgia, 'Times New Roman', 'Cambria', serif";
const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Convert a plain-text body into <p> paragraphs. Blank lines become
 * paragraph breaks; single newlines become <br>.
 */
function bodyToParagraphs(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  const paragraphStyle = `margin: 0 0 18px; font-family: ${FONT_SANS}; font-size: 16px; line-height: 1.65; color: ${BRAND.wine};`;
  return trimmed
    .split(/\n\s*\n/)
    .map((block) => {
      const inner = escapeHtml(block).replace(/\n/g, "<br>");
      return `<p style="${paragraphStyle}">${inner}</p>`;
    })
    .join("");
}

function renderWhatToExpect(items: WhatToExpectItem[]): string {
  if (!items.length) return "";
  const rows = items
    .map(
      (item) => `
        <tr>
          <td valign="top" style="padding: 6px 14px 6px 0; width: 28px; font-size: 18px; line-height: 1.4; color: ${BRAND.gold};">${escapeHtml(item.icon)}</td>
          <td valign="top" style="padding: 6px 0; font-family: ${FONT_SANS}; font-size: 14px; line-height: 1.55; color: ${BRAND.wine};">${escapeHtml(item.text)}</td>
        </tr>`,
    )
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 8px 0 24px; background-color: ${BRAND.blush}; border-radius: 10px;">
      <tr>
        <td style="padding: 18px 22px;">
          <div style="font-family: ${FONT_SANS}; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${BRAND.pink}; margin-bottom: 10px;">
            What to expect
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${rows}
          </table>
        </td>
      </tr>
    </table>`;
}

export function renderEmailLayout(input: RenderEmailLayoutInput): string {
  const {
    greeting,
    body,
    personalNote,
    ctaText,
    ctaUrl,
    whatToExpect,
    signoffLine,
    signoffName,
    preheader,
  } = input;

  const safeCtaUrl = ctaUrl || "#";
  const safeCtaText = escapeHtml(ctaText || "Open Form");

  const personalNoteHtml = personalNote && personalNote.trim()
    ? `<p style="margin: -4px 0 24px; padding: 14px 18px; background-color: rgba(212,168,83,0.08); border-left: 3px solid ${BRAND.gold}; font-family: ${FONT_SERIF}; font-style: italic; font-size: 16px; line-height: 1.55; color: ${BRAND.wine};">${escapeHtml(personalNote.trim()).replace(/\n/g, "<br>")}</p>`
    : "";

  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${BRAND.cream};">${escapeHtml(preheader)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>The Marigold</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.blush}; font-family: ${FONT_SANS};">
  ${preheaderHtml}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${BRAND.blush};">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: ${BRAND.cream}; border-radius: 18px; box-shadow: 0 4px 24px rgba(75,21,40,0.08); overflow: hidden;">

          <tr>
            <td align="center" style="padding: 36px 32px 18px;">
              <div style="font-family: ${FONT_SERIF}; font-style: italic; font-size: 32px; color: ${BRAND.wine}; letter-spacing: 0.5px; line-height: 1;">The Marigold</div>
              <div style="font-family: ${FONT_SANS}; font-size: 9px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: ${BRAND.pink}; margin-top: 8px;">South Asian Wedding Studio</div>
              <div style="margin: 16px auto 0; height: 1px; width: 64px; background-color: ${BRAND.gold};"></div>
            </td>
          </tr>

          <tr>
            <td style="padding: 6px 40px 0;">
              <p style="margin: 0 0 18px; font-family: ${FONT_SERIF}; font-size: 22px; color: ${BRAND.wine}; line-height: 1.3;">${escapeHtml(greeting)}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px;">
              ${bodyToParagraphs(body)}
              ${personalNoteHtml}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 8px 40px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${BRAND.wine}" style="background-color: ${BRAND.wine}; border-radius: 8px;">
                    <a href="${safeCtaUrl}" target="_blank" style="
                      display: inline-block;
                      padding: 16px 40px;
                      color: ${BRAND.cream};
                      font-family: ${FONT_SANS};
                      font-size: 14px;
                      font-weight: 700;
                      letter-spacing: 0.12em;
                      text-transform: uppercase;
                      text-decoration: none;
                    ">${safeCtaText} &rarr;</a>
                  </td>
                </tr>
              </table>
              <div style="font-family: ${FONT_SERIF}; font-style: italic; font-size: 14px; color: ${BRAND.mauve}; margin-top: 14px;">no account needed &middot; takes a few minutes</div>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 40px 0;">
              ${renderWhatToExpect(whatToExpect)}
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 28px;">
              <p style="margin: 0; font-family: ${FONT_SERIF}; font-style: italic; font-size: 18px; color: ${BRAND.wine}; line-height: 1.4;">${escapeHtml(signoffLine)}</p>
              <p style="margin: 4px 0 0; font-family: ${FONT_SANS}; font-size: 14px; font-weight: 600; color: ${BRAND.wine};">${escapeHtml(signoffName)}</p>
            </td>
          </tr>

          <tr>
            <td style="background-color: ${BRAND.wine}; padding: 22px 40px;" align="center">
              <div style="font-family: ${FONT_SERIF}; font-style: italic; font-size: 16px; color: ${BRAND.cream}; margin-bottom: 6px;">The Marigold</div>
              <div style="font-family: ${FONT_SANS}; font-size: 12px; color: ${BRAND.hotPink}; letter-spacing: 0.04em;">
                <a href="https://instagram.com/themarigold" style="color: ${BRAND.hotPink}; text-decoration: none;">@themarigold</a>
                &nbsp;&middot;&nbsp;
                <a href="https://themarigold.in" style="color: ${BRAND.hotPink}; text-decoration: none;">themarigold.in</a>
              </div>
              <div style="font-family: ${FONT_SANS}; font-size: 10px; color: rgba(255,248,242,0.6); margin-top: 14px; line-height: 1.5;">
                You're receiving this because we'd love to feature your work on our platform. Reply to this email to opt out and we won't reach out again.
              </div>
            </td>
          </tr>

        </table>
        <div style="font-family: ${FONT_SERIF}; font-style: italic; font-size: 13px; color: ${BRAND.mauve}; margin-top: 18px;">made with marigolds &amp; chai &middot; mumbai</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
