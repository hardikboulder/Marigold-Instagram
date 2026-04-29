/**
 * POST /api/submit/blog
 *
 * Final submission endpoint for the public Vendor Blog Post intake form
 * (/submit/blog). Mirrors the shape of the vendor and venue submit routes
 * so the studio inbox picks up entries automatically.
 *
 * Submissions land in /public/submissions/_index.json under templateType
 * "vendor-blog-post". The card in the inbox uses `data._blog_post` to
 * render the generated article alongside the vendor's raw answers.
 *
 * The post HTML/markdown are stored as text fields (not as files), so the
 * studio can render them inline without an extra fetch.
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { FormSubmission, SubmissionFile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const SUBMISSIONS_ROOT = path.join(PUBLIC_ROOT, "submissions");
const INDEX_PATH = path.join(SUBMISSIONS_ROOT, "_index.json");

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_BYTES = 200 * 1024; // generated HTML can be longer than usual
const RATE_LIMIT_PER_HOUR = 5;

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

function sanitizeText(value: unknown, maxBytes = MAX_TEXT_BYTES): string {
  if (typeof value !== "string") return "";
  if (Buffer.byteLength(value, "utf8") > maxBytes) {
    return value.slice(0, maxBytes);
  }
  // Block <script> tags but otherwise preserve the markup we generated.
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

const ALLOWED_MIME_PREFIXES = ["image/"];
function isAcceptedMime(type: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((p) => type.startsWith(p));
}

function looksLikeImage(buf: Buffer, fileName: string): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return true;
  const gifHead = buf.slice(0, 6).toString("ascii");
  if (gifHead === "GIF87a" || gifHead === "GIF89a") return true;
  const riff = buf.slice(0, 4).toString("ascii");
  const webp = buf.slice(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") return true;
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

interface BlogPostPayload {
  headline: string;
  markdown: string;
  html: string;
  readingTimeMin: number;
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

  const submissionId = newId();
  const submittedAt = new Date().toISOString();
  const folderName = `${submittedAt.replace(/[:.]/g, "-")}_${submissionId.slice(0, 8)}`;
  const submissionDir = path.join(SUBMISSIONS_ROOT, "blog", folderName);

  const data: Record<string, unknown> = {};
  const fileEntries: { fieldId: string; file: File }[] = [];
  let blogPostJson: string | null = null;
  let answersJson: string | null = null;

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("_")) continue;
    if (typeof value === "string") {
      if (key === "blog_post_json") {
        blogPostJson = value;
        continue;
      }
      if (key === "answers_json") {
        answersJson = value;
        continue;
      }
      const sanitized = sanitizeText(
        value,
        key === "blog_post_html" || key === "blog_post_markdown"
          ? MAX_TEXT_BYTES
          : 50 * 1024,
      );
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

  if (fileEntries.length > 10) {
    return NextResponse.json(
      { ok: false, error: "Too many files in this submission." },
      { status: 413 },
    );
  }

  if (!blogPostJson) {
    return NextResponse.json(
      { ok: false, error: "Generated blog post is missing." },
      { status: 400 },
    );
  }

  let blogPost: BlogPostPayload;
  try {
    const parsed = JSON.parse(blogPostJson) as Partial<BlogPostPayload>;
    if (!parsed.headline || !parsed.markdown || !parsed.html) {
      throw new Error("Missing fields");
    }
    blogPost = {
      headline: sanitizeText(parsed.headline, 1000),
      markdown: sanitizeText(parsed.markdown),
      html: sanitizeText(parsed.html),
      readingTimeMin:
        typeof parsed.readingTimeMin === "number" ? parsed.readingTimeMin : 5,
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Generated blog post payload was invalid." },
      { status: 400 },
    );
  }

  let answers: Array<{ question: string; answer: string }> = [];
  if (answersJson) {
    try {
      const parsedAnswers = JSON.parse(answersJson) as unknown;
      if (Array.isArray(parsedAnswers)) {
        answers = parsedAnswers
          .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const e = entry as { question?: unknown; answer?: unknown };
            return {
              question: sanitizeText(e.question, 2000),
              answer: sanitizeText(e.answer, 4000),
            };
          })
          .filter(
            (entry): entry is { question: string; answer: string } =>
              entry !== null && (entry.question.length > 0 || entry.answer.length > 0),
          );
      }
    } catch {
      // ignore — we'll store an empty array
    }
  }

  const files: SubmissionFile[] = [];
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
          error: `"${file.name}" isn't an image — only images are accepted for blog posts.`,
        },
        { status: 415 },
      );
    }
    const safeName = sanitizeFileName(file.name);
    const filePath = path.join(submissionDir, safeName);
    const buf = Buffer.from(await file.arrayBuffer());
    if (!looksLikeImage(buf, safeName)) {
      return NextResponse.json(
        {
          ok: false,
          error: `"${file.name}" doesn't look like a real image file.`,
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
      filePath: `/submissions/blog/${folderName}/${safeName}`,
    });
  }

  data._blog_post = blogPost;
  data._blog_answers = answers;

  const vendorName =
    typeof data.vendor_name === "string" ? data.vendor_name : "Vendor";
  const businessName =
    typeof data.business_name === "string" ? data.business_name : "";
  const topicTitle =
    typeof data.topic_title === "string" ? data.topic_title : blogPost.headline;

  const submission: FormSubmission = {
    id: submissionId,
    formId: "vendor-blog-post",
    formTitle: `Blog post: ${topicTitle}`,
    templateType: "vendor-blog-post",
    data,
    files,
    submittedAt,
    status: "new",
    notes: businessName
      ? `From ${vendorName} at ${businessName} · ${blogPost.readingTimeMin} min read`
      : `From ${vendorName} · ${blogPost.readingTimeMin} min read`,
  };

  const index = await readIndex();
  index.submissions = [submission, ...index.submissions].slice(0, 5000);
  await writeIndex(index);

  return NextResponse.json(
    {
      ok: true,
      id: submissionId,
      headline: blogPost.headline,
      readingTimeMin: blogPost.readingTimeMin,
    },
    { status: 200 },
  );
}
