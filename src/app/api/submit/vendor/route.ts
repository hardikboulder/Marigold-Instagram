/**
 * POST /api/submit/vendor
 *
 * Vendor-specific submission endpoint. Mirrors the venue route's shape so
 * the studio inbox / submissions list picks up vendor entries automatically.
 *
 * Extra work performed on submit:
 *   1. Persist the submission record (matching the generic FormSubmission
 *      shape from src/lib/types.ts).
 *   2. Auto-derive a `vendorProfile` mapped onto the editable_fields of
 *      the VendorFeaturePost template — so the studio can spawn a vendor
 *      spotlight in one click.
 *   3. Tag every uploaded photo with: source:"vendor-submission", vendor
 *      name, vendor category, and city. Stored on the file record so the
 *      media library picks them up downstream.
 *   4. Cross-reference the "planners you've worked with" field against
 *      the venue submissions index — surface matches as a notes line so
 *      The Marigold can spot a real network.
 *   5. Best-effort cleanup of the draft file when a draft token comes in.
 *
 * ─── PRODUCTION SWAP (Supabase) ──────────────────────────────────────────
 *   - Swap fs reads/writes for supabase.storage + supabase.from(...).insert
 *   - Replace the in-memory rate limiter with Upstash/Redis
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { FormSubmission, SubmissionFile } from "@/lib/types";
import {
  getCategoryById,
  type VendorCategory,
} from "@/app/submit/vendor/vendor-form-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const SUBMISSIONS_ROOT = path.join(PUBLIC_ROOT, "submissions");
const INDEX_PATH = path.join(SUBMISSIONS_ROOT, "_index.json");
const DRAFT_ROOT = path.join(SUBMISSIONS_ROOT, "_vendor-drafts");

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

interface VendorProfile {
  vendorCategory: string;
  vendorName: string;
  vendorLocation: string;
  vendorQuote: string;
  startingPriceText?: string;
  imageUrl?: string;
}

function buildVendorProfile(
  category: VendorCategory | undefined,
  data: Record<string, unknown>,
  firstPhotoPath?: string,
): VendorProfile {
  const businessName =
    typeof data.business_name === "string" ? data.business_name : "";
  const cities =
    typeof data.cities_served === "string" ? data.cities_served : "";
  const quote =
    typeof data.feature_quote === "string" ? data.feature_quote : "";
  const price =
    typeof data.starting_price === "string" ? data.starting_price : "";

  // Use the friendly category label, uppercased, as the kicker on the
  // VendorFeaturePost template. For "other" we fall back to the
  // free-text description's category.
  const categoryLabel =
    category && category.id !== "other"
      ? category.label.toUpperCase()
      : "WEDDING VENDOR";

  return {
    vendorCategory: categoryLabel,
    vendorName: businessName,
    vendorLocation: cities,
    vendorQuote: quote,
    startingPriceText: price || undefined,
    imageUrl: firstPhotoPath,
  };
}

/**
 * Cross-reference the planner names this vendor mentions against the
 * submission index. Returns a deduped list of business/contact names
 * that already exist in the system. Best-effort and case-insensitive.
 */
function findKnownPlanners(
  plannersRaw: string,
  index: { submissions: FormSubmission[] },
): string[] {
  if (!plannersRaw.trim()) return [];
  const candidates = plannersRaw
    .split(/[\n,;•·]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && s.length <= 80);
  if (candidates.length === 0) return [];

  const known = new Set<string>();
  for (const submission of index.submissions) {
    const data = submission.data as Record<string, unknown>;
    const name =
      (typeof data.business_name === "string" && data.business_name) ||
      (typeof data.venue_name === "string" && data.venue_name) ||
      (typeof data.contact_name === "string" && data.contact_name) ||
      "";
    if (typeof name === "string" && name.trim()) known.add(name.trim());
  }

  const matches = new Set<string>();
  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    for (const name of known) {
      const n = name.toLowerCase();
      if (n === c || n.includes(c) || c.includes(n)) {
        matches.add(name);
      }
    }
  }
  return Array.from(matches);
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
  const submissionDir = path.join(SUBMISSIONS_ROOT, "vendor", folderName);

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

  if (fileEntries.length > 20) {
    return NextResponse.json(
      { ok: false, error: "Too many files in this submission." },
      { status: 413 },
    );
  }

  const categoryId = typeof data.category === "string" ? data.category : "";
  const category = getCategoryById(categoryId);
  const businessName =
    typeof data.business_name === "string" ? data.business_name : "";
  const cities =
    typeof data.cities_served === "string" ? data.cities_served : "";

  const photoTags = [
    "source:vendor-submission",
    businessName ? `vendor:${businessName}` : "",
    category ? `category:${category.label}` : "",
    cities ? `city:${cities}` : "",
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
      filePath: `/submissions/vendor/${folderName}/${safeName}`,
      tags: photoTags,
    });
  }

  const firstPortfolioPhoto = files.find(
    (f) => f.fieldId === "portfolio_photos",
  )?.filePath;
  const vendorProfile = buildVendorProfile(category, data, firstPortfolioPhoto);

  // Cross-reference planner names against the submission index for a
  // "you already work with people in our network" signal. The index read
  // happens after files have been written but before we mutate it — that
  // way we don't accidentally match the vendor against itself.
  const index = await readIndex();
  const plannersRaw =
    typeof data.planners_worked_with === "string"
      ? data.planners_worked_with
      : "";
  const knownPlanners = findKnownPlanners(plannersRaw, index);

  // Stash the vendor-specific extras inside `data` so the generic
  // submission viewer keeps working and the studio can pull them out by
  // key. The category id is stored too so downstream auto-mapping doesn't
  // have to re-derive it from the label.
  data._vendor_profile = vendorProfile;
  data._photo_tags = photoTags;
  if (category) data._vendor_category_id = category.id;
  if (knownPlanners.length > 0) data._known_planners = knownPlanners;

  // Conversion-funnel flags. Flipped to true via /api/vendor/track when the
  // vendor opts in to creating an account or starting a blog post on the
  // post-submission onboarding screen.
  data.accountCreated = false;
  data.blogPostStarted = false;
  data.blogPostSubmitted = false;

  // Auto-mapping hints for downstream content templates. The studio uses
  // these to spin up matching posts in one click.
  const autoMappedTemplates: string[] = ["VendorFeaturePost"];
  if (typeof data.feature_quote === "string" && data.feature_quote.trim()) {
    autoMappedTemplates.push("VendorTipCarousel");
  }
  if (
    (categoryId === "photographer" || categoryId === "videographer") &&
    files.filter((f) => f.fieldId === "portfolio_photos").length >= 3
  ) {
    autoMappedTemplates.push("PhotoMontageReel");
  }
  data._auto_mapped_templates = autoMappedTemplates;

  const noteParts: string[] = [];
  if (knownPlanners.length > 0) {
    noteParts.push(
      `Known planners in submissions: ${knownPlanners.join(", ")}`,
    );
  }
  if (autoMappedTemplates.length > 1) {
    noteParts.push(`Auto-map ready: ${autoMappedTemplates.join(", ")}`);
  }

  const submission: FormSubmission = {
    id: submissionId,
    formId: "vendor",
    formTitle: "Submit your vendor profile",
    templateType: "vendor",
    data,
    files,
    submittedAt,
    status: "new",
    notes: noteParts.join(" · "),
  };

  index.submissions = [submission, ...index.submissions].slice(0, 5000);
  await writeIndex(index);

  // Best-effort cleanup of the resume token.
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
      vendorProfile,
      knownPlanners,
      autoMappedTemplates,
    },
    { status: 200 },
  );
}
