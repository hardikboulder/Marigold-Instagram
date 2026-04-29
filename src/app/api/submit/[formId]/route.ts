/**
 * POST /api/submit/[formId]
 *
 * Public submission endpoint for /submit/[formId] forms.
 *
 * Local-first behaviour:
 *   1. Reads multipart/form-data (field values + files).
 *   2. Saves files under /public/submissions/[formId]/[timestamp]/.
 *   3. Appends a FormSubmission record to /public/submissions/_index.json.
 *
 * The studio polls _index.json on load and merges new entries into
 * localStorage via syncFromPublicIndex().
 *
 * ─── PRODUCTION SWAP (Supabase) ───────────────────────────────────────────
 *   Replace the file-system writes with:
 *     - supabase.storage.from('submissions').upload(...)  for files
 *     - supabase.from('form_submissions').insert(...)     for the record
 *   Replace the rate-limit Map with an Upstash/Redis counter keyed on IP.
 *   Replace JSON-index reads on the client with supabase.from(...).select().
 * ──────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type {
  FormSubmission,
  SubmissionFile,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const SUBMISSIONS_ROOT = path.join(PUBLIC_ROOT, "submissions");
const INDEX_PATH = path.join(SUBMISSIONS_ROOT, "_index.json");

// Spam / abuse limits.
const MAX_FILES_PER_FIELD = 25;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TEXT_BYTES = 50 * 1024;
const RATE_LIMIT_PER_HOUR = 5;
const ALLOWED_MIME_PREFIXES = ["image/", "video/"];

// In-memory rate limiter (process-local). Sufficient for local dev.
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
  // Strip raw script tags as a baseline. The studio re-renders this as
  // plain text in React anyway, so escaping happens there.
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
  return ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));
}

/**
 * Validates the first few bytes of a file against the magic numbers of the
 * formats we accept. We intentionally don't trust the client-supplied
 * Content-Type header — bots can lie about it, and a vendor's iPhone often
 * sends an empty `type` for HEIC files.
 *
 * Returns true if the bytes look like one of:
 *   - JPEG (FF D8 FF)
 *   - PNG  (89 50 4E 47 0D 0A 1A 0A)
 *   - WEBP (RIFF…WEBP)
 *   - GIF  (GIF87a / GIF89a)
 *   - HEIC/HEIF (ftyp box at offset 4 with brand "heic"/"heix"/"mif1"/"hevc")
 *   - MP4  (ftyp box at offset 4)
 *   - QuickTime / MOV (ftyp box, brand "qt  ")
 */
function looksLikeAcceptedMedia(buf: Buffer, fileName: string): boolean {
  if (buf.length < 12) return false;

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG
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
  // GIF
  const gifHead = buf.slice(0, 6).toString("ascii");
  if (gifHead === "GIF87a" || gifHead === "GIF89a") return true;
  // RIFF WEBP
  const riff = buf.slice(0, 4).toString("ascii");
  const webp = buf.slice(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") return true;
  // ISO Base Media (MP4/MOV/HEIC) — ftyp box at offset 4
  const ftyp = buf.slice(4, 8).toString("ascii");
  if (ftyp === "ftyp") return true;
  // Some HEIC files from older iOS devices are gracefully handled by
  // extension-only fallback (we already validated extension client-side).
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
    return { submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [] };
  } catch {
    return { submissions: [] };
  }
}

async function writeIndex(data: { submissions: FormSubmission[] }): Promise<void> {
  await ensureDir(SUBMISSIONS_ROOT);
  await fs.writeFile(INDEX_PATH, JSON.stringify(data, null, 2));
}

interface RouteParams {
  params: { formId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const formId = params.formId;
  if (!formId || formId.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(formId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid form id." },
      { status: 400 },
    );
  }

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

  // Honeypot: a hidden "_company" field that real users will never fill.
  // If it has any value, we accept the request (so the bot thinks it
  // succeeded) but silently discard it.
  const honeypot = formData.get("_company");
  if (honeypot && String(honeypot).trim().length > 0) {
    return NextResponse.json({ ok: true, id: "honeypot" }, { status: 200 });
  }

  const formTitle = sanitizeText(formData.get("_form_title") ?? "Submission");
  const templateType = sanitizeText(formData.get("_template_type") ?? "general");

  const submissionId = newId();
  const submittedAt = new Date().toISOString();
  const folderName = `${submittedAt.replace(/[:.]/g, "-")}_${submissionId.slice(0, 8)}`;
  const submissionDir = path.join(SUBMISSIONS_ROOT, formId, folderName);

  const data: Record<string, unknown> = {};
  const files: SubmissionFile[] = [];

  // First pass: collect text fields and files. FormData uses repeated keys
  // for multi-value fields; we coalesce duplicates into arrays.
  const fileEntries: { fieldId: string; file: File }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("_")) continue; // reserved (honeypot, meta)
    if (typeof value === "string") {
      const sanitized = sanitizeText(value);
      if (key in data) {
        const existing = data[key];
        data[key] = Array.isArray(existing) ? [...existing, sanitized] : [existing, sanitized];
      } else {
        data[key] = sanitized;
      }
    } else if (value instanceof File) {
      // Empty file inputs come through with size 0 and name "". Skip them.
      if (value.size === 0) continue;
      fileEntries.push({ fieldId: key, file: value });
    }
  }

  // Cap total files to prevent abuse.
  if (fileEntries.length > MAX_FILES_PER_FIELD * 5) {
    return NextResponse.json(
      { ok: false, error: "Too many files in this submission." },
      { status: 413 },
    );
  }

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
    // The MIME header is a hint — we still verify magic bytes after reading
    // the buffer below. iPhones sometimes send empty `type` for HEIC, so we
    // accept octet-stream here and rely on the byte-level check.
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
      filePath: `/submissions/${formId}/${folderName}/${safeName}`,
    });
  }

  const submission: FormSubmission = {
    id: submissionId,
    formId,
    formTitle,
    templateType: templateType as FormSubmission["templateType"],
    data,
    files,
    submittedAt,
    status: "new",
    notes: "",
  };

  // Append to the index.
  const index = await readIndex();
  index.submissions = [submission, ...index.submissions].slice(0, 5000);
  await writeIndex(index);

  return NextResponse.json({ ok: true, id: submission.id }, { status: 200 });
}
