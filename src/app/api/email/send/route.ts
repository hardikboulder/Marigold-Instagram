/**
 * POST /api/email/send
 *
 * Sends a branded outreach email via Resend (https://resend.com).
 *
 * Request body:
 *   {
 *     to: string | string[],
 *     subject: string,
 *     htmlBody: string,
 *     formType: FormTemplateType,
 *     vendorName?: string,
 *   }
 *
 * Response:
 *   { ok: true,  id: string }            on success
 *   { ok: false, error: string,
 *     reason?: "missing-api-key" | "invalid-input" | "send-failed" } on failure
 *
 * Configuration (.env.local):
 *   RESEND_API_KEY        — required to actually send. When absent, the
 *                            route 503's so the UI can switch to fallback.
 *   RESEND_FROM           — optional. Defaults to Resend's onboarding sender.
 *   RESEND_REPLY_TO       — optional reply-to address.
 *
 * The route also checks GET /api/email/send to surface whether sending is
 * configured — used by the EmailComposerModal to disable / enable the
 * Send button on mount.
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_FROM = "The Marigold <onboarding@resend.dev>";

interface SendEmailBody {
  to: string | string[];
  subject: string;
  htmlBody: string;
  formType: string;
  vendorName?: string;
}

function isStringOrArrayOfString(value: unknown): value is string | string[] {
  if (typeof value === "string") return true;
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function normalizeRecipients(value: string | string[]): string[] {
  const list = Array.isArray(value) ? value : value.split(",");
  return list.map((s) => s.trim()).filter(Boolean);
}

export async function GET() {
  const configured = Boolean(process.env.RESEND_API_KEY);
  return NextResponse.json({
    configured,
    from: process.env.RESEND_FROM ?? DEFAULT_FROM,
    replyTo: process.env.RESEND_REPLY_TO ?? null,
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing-api-key",
        error:
          "Resend is not configured. Add RESEND_API_KEY to .env.local to enable sending.",
      },
      { status: 503 },
    );
  }

  let body: SendEmailBody;
  try {
    body = (await req.json()) as SendEmailBody;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid-input", error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, reason: "invalid-input", error: "Missing body." },
      { status: 400 },
    );
  }
  if (!isStringOrArrayOfString(body.to)) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid-input",
        error: "`to` must be a string or array of strings.",
      },
      { status: 400 },
    );
  }
  if (typeof body.subject !== "string" || !body.subject.trim()) {
    return NextResponse.json(
      { ok: false, reason: "invalid-input", error: "`subject` is required." },
      { status: 400 },
    );
  }
  if (typeof body.htmlBody !== "string" || !body.htmlBody.trim()) {
    return NextResponse.json(
      { ok: false, reason: "invalid-input", error: "`htmlBody` is required." },
      { status: 400 },
    );
  }

  const recipients = normalizeRecipients(body.to);
  if (recipients.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "invalid-input", error: "No valid recipients." },
      { status: 400 },
    );
  }

  const from = process.env.RESEND_FROM ?? DEFAULT_FROM;
  const replyTo = process.env.RESEND_REPLY_TO || undefined;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject: body.subject,
      html: body.htmlBody,
      replyTo,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          reason: "send-failed",
          error: error.message ?? "Resend rejected the request.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: data?.id ?? null,
      from,
      recipients,
      formType: body.formType,
      vendorName: body.vendorName ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected send error.";
    return NextResponse.json(
      { ok: false, reason: "send-failed", error: message },
      { status: 500 },
    );
  }
}
