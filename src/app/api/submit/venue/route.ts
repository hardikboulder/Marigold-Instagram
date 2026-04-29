/**
 * POST /api/submit/venue
 *
 * Venue-specific submission endpoint. Overrides the generic
 * /api/submit/[formId] route for the venue form because we do extra work
 * on submit:
 *
 *   1. Persist the submission record (matching the generic shape so the
 *      studio inbox / submissions list picks it up automatically).
 *   2. Auto-generate a `venueProfile` object that maps the form values
 *      onto the editable_fields of the VenueFeaturePost template — so
 *      the studio can spawn a venue spotlight post in one click.
 *   3. Tag every uploaded photo with: source: "venue-submission", venue
 *      name, venue type, city. Stored alongside the file record on the
 *      submission for downstream tagging when files are pulled into the
 *      media library.
 *   4. Auto-tag the submission as "experienced" when the venue has hosted
 *      16+ South Asian weddings — used by the studio for priority review.
 *   5. Clean up the matching draft file if a draft token was supplied.
 *
 * ─── PRODUCTION SWAP (Supabase) ──────────────────────────────────────────
 *   - Replace fs writes with supabase.storage + supabase.from(...).insert.
 *   - Replace the in-memory rate limiter with Upstash/Redis.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { FormSubmission, SubmissionFile } from "@/lib/types";
import { mapVenueTypeToTemplate } from "@/app/submit/venue/venue-form-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const SUBMISSIONS_ROOT = path.join(PUBLIC_ROOT, "submissions");
const INDEX_PATH = path.join(SUBMISSIONS_ROOT, "_index.json");
const DRAFT_ROOT = path.join(SUBMISSIONS_ROOT, "_venue-drafts");

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_BYTES = 50 * 1024;
const RATE_LIMIT_PER_HOUR = 5;
const ALLOWED_MIME_PREFIXES = ["image/", "video/"];
const TOKEN_RE = /^[a-zA-Z0-9_-]{8,80}$/;

type RateBucket = { firstAt: number; count: number };
const rateBuckets = new Map<string, RateBucket>();

function rateLimit(ip: string): { allowed: boolean; retryInMs: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.firstAt > windowMs) {
    rateBuckets.set(ip, { firstAt: now, count: 1 });
    return { allowed: true, retryInMs: 0 };
  }
  if (bucket.count >= RATE_LIMIT_PER_HOUR) {
    return { allowed: false, retryInMs: windowMs - (now - bucket.firstAt) };
  }
  bucket.count += 1;
  return { allowed: true, retryInMs: 0 };
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  if (Buffer.byteLength(value, "utf8") > MAX_TEXT_BYTES) {
    return value.slice(0, MAX_TEXT_BYTES);
  }
  return value.replace(/<script[\s\S]*?<\/script>/gi, "");
}

function sanitizeFileName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .slice(0, 100) || "file"
  );
}

function isAcceptedMime(type: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => type.startsWith(p));
}

function looksLikeAcceptedMedia(buf: Buffer, fileName: string): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return true;
  const gifHead = buf.slice(0, 6).toString("ascii");
  if (gifHead === "GIF87a" || gifHead === "GIF89a") return true;
  const riff = buf.slice(0, 4).toString("ascii");
  const webp = buf.slice(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") return true;
  const ftyp = buf.slice(4, 8).toString("ascii");
  if (ftyp === "ftyp") return true;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return true;
  return false;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function readIndex(): Promise<{ submissions: FormSubmission[] }> {
  try {
    const buf = await fs.readFile(INDEX_PATH, "utf8");
    const parsed = JSON.parse(buf) as { submissions?: FormSubmission[] };
    return {
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
    };
  } catch {
    return { submissions: [] };
  }
}

async function writeIndex(data: { submissions: FormSubmission[] }): Promise<void> {
  await ensureDir(SUBMISSIONS_ROOT);
  await fs.writeFile(INDEX_PATH, JSON.stringify(data, null, 2));
}

interface VenueProfile {
  venueType: string;
  venueName: string;
  venueLocation: string;
  capacity: number;
  bestFor: string;
  startingPriceText?: string;
}

function buildVenueProfile(
  data: Record<string, unknown>,
  firstPhotoPath?: string,
): VenueProfile & { imageUrl?: string } {
  const rawType = typeof data.venue_type === "string" ? data.venue_type : "";
  const venueType = mapVenueTypeToTemplate(rawType);
  const cityState =
    typeof data.city_state === "string" ? data.city_state : "";
  const oneLine =
    typeof data.one_line_pitch === "string" ? data.one_line_pitch : "";
  const capacityRaw = typeof data.max_capacity === "string" ? data.max_capacity : "";
  const capacity = parseInt(capacityRaw, 10);
  return {
    venueType,
    venueName: typeof data.venue_name === "string" ? data.venue_name : "",
    venueLocation: cityState,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 0,
    bestFor: oneLine,
    startingPriceText:
      typeof data.starting_price_range === "string" && data.starting_price_range
        ? data.starting_price_range
        : undefined,
    imageUrl: firstPhotoPath,
  };
}

function isExperiencedVenue(data: Record<string, unknown>): boolean {
  const v = data.sa_weddings_hosted;
  if (typeof v !== "string") return false;
  return (
    v === "16-30" ||
    v === "30+" ||
    v === "We specialize in South Asian weddings"
  );
}

interface TaggedSubmissionFile extends SubmissionFile {
  tags?: string[];
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    const minutes = Math.ceil(rl.retryInMs / 60000);
    return NextResponse.json(
      {
        ok: false,
        error: `Too many submissions from this network. Try again in ~${minutes} min.`,
      },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't read form data." },
      { status: 400 },
    );
  }

  const honeypot = formData.get("_company");
  if (honeypot && String(honeypot).trim().length > 0) {
    return NextResponse.json({ ok: true, id: "honeypot" }, { status: 200 });
  }

  const draftToken = sanitizeText(formData.get("_draft_token") ?? "");
  const submissionId = newId();
  const submittedAt = new Date().toISOString();
  const folderName = `${submittedAt.replace(/[:.]/g, "-")}_${submissionId.slice(0, 8)}`;
  const submissionDir = path.join(SUBMISSIONS_ROOT, "venue", folderName);

  const data: Record<string, unknown> = {};
  const fileEntries: { fieldId: string; file: File }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("_")) continue;
    if (typeof value === "string") {
      const sanitized = sanitizeText(value);
      if (key in data) {
        const existing = data[key];
        data[key] = Array.isArray(existing)
          ? [...existing, sanitized]
          : [existing, sanitized];
      } else {
        data[key] = sanitized;
      }
    } else if (value instanceof File) {
      if (value.size === 0) continue;
      fileEntries.push({ fieldId: key, file: value });
    }
  }

  if (fileEntries.length > 30) {
    return NextResponse.json(
      { ok: false, error: "Too many files in this submission." },
      { status: 413 },
    );
  }

  // Photo tags — derived once so we can apply them to every saved file.
  const venueName = typeof data.venue_name === "string" ? data.venue_name : "";
  const venueTypeRaw = typeof data.venue_type === "string" ? data.venue_type : "";
  const cityState = typeof data.city_state === "string" ? data.city_state : "";
  const photoTags = [
    "source:venue-submission",
    venueName ? `venue:${venueName}` : "",
    venueTypeRaw ? `type:${venueTypeRaw}` : "",
    cityState ? `city:${cityState}` : "",
  ].filter(Boolean);

  const files: TaggedSubmissionFile[] = [];

  if (fileEntries.length > 0) {
    await ensureDir(submissionDir);
  }

  for (const { fieldId, file } of fileEntries) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${file.name}" is larger than 25 MB. Resize and try again.`,
        },
        { status: 413 },
      );
    }
    const mimeType = file.type || "application/octet-stream";
    if (mimeType !== "application/octet-stream" && !isAcceptedMime(mimeType)) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${file.name}" isn't an image or video — only those types are accepted.`,
        },
        { status: 415 },
      );
    }
    const safeName = sanitizeFileName(file.name);
    const filePath = path.join(submissionDir, safeName);
    const buf = Buffer.from(await file.arrayBuffer());
    if (!looksLikeAcceptedMedia(buf, safeName)) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${file.name}" doesn't look like a real image or video file.`,
        },
        { status: 415 },
      );
    }
    await fs.writeFile(filePath, buf);
    files.push({
      fieldId,
      fileName: safeName,
      mimeType,
      fileSize: file.size,
      filePath: `/submissions/venue/${folderName}/${safeName}`,
      tags: photoTags,
    });
  }

  const firstPhotoPath = files.find((f) => f.fieldId === "venue_photos")?.filePath;
  const venueProfile = buildVenueProfile(data, firstPhotoPath);
  const experienced = isExperiencedVenue(data);

  // Stash the venue-specific extras inside `data` so the generic submission
  // viewer keeps working and the studio can pull them out by key.
  data._venue_profile = venueProfile;
  data._photo_tags = photoTags;
  if (experienced) data._priority_tag = "experienced";

  const submission: FormSubmission = {
    id: submissionId,
    formId: "venue",
    formTitle: "Submit your venue",
    templateType: "venue",
    data,
    files,
    submittedAt,
    status: "new",
    notes: experienced ? "Auto-tagged: experienced (16+ SA weddings)" : "",
  };

  const index = await readIndex();
  index.submissions = [submission, ...index.submissions].slice(0, 5000);
  await writeIndex(index);

  // Best-effort cleanup of the resume token — a leftover file isn't harmful
  // but it's cleaner not to leave drafts around once they've been submitted.
  if (draftToken && TOKEN_RE.test(draftToken)) {
    try {
      await fs.unlink(path.join(DRAFT_ROOT, `${draftToken}.json`));
    } catch {
      // ignore — the file may not exist
    }
  }

  return NextResponse.json(
    {
      ok: true,
      id: submissionId,
      venueProfile,
      experienced,
    },
    { status: 200 },
  );
}
