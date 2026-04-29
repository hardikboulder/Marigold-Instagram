/**
 * Outreach log — tracks every time the studio sends a form link out.
 *
 * Powers the "Sent" tab in Settings → Submission Forms and the
 * "Request Content" quick-send modal in the Submissions inbox. When a
 * submission lands, we look back through the log to try to match the
 * submission to the outreach (by form type + recency) so the user can
 * see "Priya filled out the link you sent her on Tuesday".
 */

import {
  getStore,
  setStore,
  updateStore,
} from "@/lib/db/local-store";
import type { FormSubmission, FormTemplateType } from "@/lib/types";

const STORE_KEY_OUTREACH_LOG = "form-outreach-log";

export type OutreachChannel = "email" | "copy-link" | "whatsapp" | "dm" | "qr";

export interface OutreachEntry {
  id: string;
  /** Form id used for the link — may be the template slug or a custom form id. */
  formId: string;
  /** Template type — used to match incoming submissions back to the outreach. */
  templateType: FormTemplateType;
  /** Where the link was sent. Free-form so users can drop in vendor names. */
  recipient: string;
  channel: OutreachChannel;
  /** ISO timestamp of when the outreach was logged. */
  sentAt: string;
  /** Pre-computed display URL for the form, useful when the form is later renamed. */
  url: string;
  /** When a submission later matches this outreach, the submission id is recorded here. */
  matchedSubmissionId?: string;
  /** Optional free-form note (e.g. subject line, the friend who introduced them). */
  note?: string;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `out_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readAll(): OutreachEntry[] {
  return getStore<OutreachEntry[]>(STORE_KEY_OUTREACH_LOG, []);
}

function writeAll(items: OutreachEntry[]): void {
  setStore(STORE_KEY_OUTREACH_LOG, items);
}

function sortItems(items: OutreachEntry[]): OutreachEntry[] {
  return [...items].sort((a, b) =>
    a.sentAt < b.sentAt ? 1 : a.sentAt > b.sentAt ? -1 : 0,
  );
}

export function getAllOutreach(): OutreachEntry[] {
  return sortItems(readAll());
}

export function getOutreachForForm(formId: string): OutreachEntry[] {
  return sortItems(readAll().filter((o) => o.formId === formId));
}

export interface LogOutreachInput {
  formId: string;
  templateType: FormTemplateType;
  recipient: string;
  channel: OutreachChannel;
  url: string;
  note?: string;
}

export function logOutreach(input: LogOutreachInput): OutreachEntry {
  const entry: OutreachEntry = {
    id: newId(),
    formId: input.formId,
    templateType: input.templateType,
    recipient: input.recipient.trim(),
    channel: input.channel,
    sentAt: new Date().toISOString(),
    url: input.url,
    note: input.note?.trim() || undefined,
  };
  updateStore<OutreachEntry[]>(STORE_KEY_OUTREACH_LOG, [], (current) => [
    entry,
    ...current,
  ]);
  return entry;
}

export function deleteOutreach(id: string): void {
  updateStore<OutreachEntry[]>(STORE_KEY_OUTREACH_LOG, [], (current) =>
    current.filter((o) => o.id !== id),
  );
}

/**
 * Match a submission back to the most likely outreach. Heuristic:
 * same template type, sent within the last 30 days, no existing match.
 * Returns the matched entry (and persists the match) if found.
 */
export function findAndMatchOutreach(
  submission: FormSubmission,
): OutreachEntry | null {
  const all = readAll();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const submittedAt = Date.parse(submission.submittedAt);

  const candidates = all.filter(
    (o) =>
      !o.matchedSubmissionId &&
      o.templateType === submission.templateType &&
      Date.parse(o.sentAt) >= cutoff &&
      Date.parse(o.sentAt) <= submittedAt,
  );
  if (candidates.length === 0) return null;

  // Pick the most recent outreach before the submission landed — that's the
  // most likely link they clicked.
  const best = candidates.sort((a, b) =>
    a.sentAt < b.sentAt ? 1 : a.sentAt > b.sentAt ? -1 : 0,
  )[0];

  writeAll(
    all.map((o) =>
      o.id === best.id
        ? { ...o, matchedSubmissionId: submission.id }
        : o,
    ),
  );
  return best;
}

export function channelLabel(channel: OutreachChannel): string {
  switch (channel) {
    case "email":
      return "Email";
    case "copy-link":
      return "Copied link";
    case "whatsapp":
      return "WhatsApp";
    case "dm":
      return "DM / SMS";
    case "qr":
      return "QR code";
    default:
      return channel;
  }
}
