/**
 * Maps a (vendor category, submission type) pair onto the best content series
 * + template + a content_data prefill so a submission turns into a near-ready
 * calendar item with one click. The suggestion is just a starting point; the
 * editor lets the user override anything.
 */

import type {
  ContentData,
  SubmissionType,
  VendorCategory,
  VendorSubmission,
} from "@/lib/types";
import { vendorCategoryLabel } from "@/lib/db/submissions-store";

export interface TemplateSuggestion {
  seriesSlug: string;
  templateSlug: string;
  reason: string;
}

const VENDOR_CATEGORY_TO_LABEL: Record<VendorCategory, string> = {
  photographer: "PHOTOGRAPHER",
  videographer: "VIDEOGRAPHER",
  decorator: "DECORATOR",
  planner: "PLANNER",
  venue: "VENUE",
  caterer: "CATERER",
  makeup: "MAKEUP ARTIST",
  florist: "FLORIST",
  mehndi: "MEHNDI ARTIST",
  dj: "DJ",
  other: "VENDOR",
};

export function suggestTemplate(
  submission: VendorSubmission,
): TemplateSuggestion {
  const cat = submission.category;
  const type = submission.submission_type;

  if (cat === "venue") {
    if (type === "venue_package" || type === "photos") {
      return {
        seriesSlug: "venue-spotlight",
        templateSlug: "venue-feature-post",
        reason:
          "Venue submissions land best in Venue Spotlight — the feature post hero is built around venue photos, capacity and style.",
      };
    }
    if (type === "tips") {
      return {
        seriesSlug: "venue-spotlight",
        templateSlug: "venue-style-guide",
        reason:
          "Venue tips ship as a style guide post inside Venue Spotlight.",
      };
    }
  }

  if (cat === "planner") {
    if (type === "tips") {
      return {
        seriesSlug: "planner-spotlight",
        templateSlug: "planner-tips-carousel",
        reason:
          "Planner tips fit the Planner Spotlight tips carousel — one tip per slide.",
      };
    }
    if (type === "bio" || type === "photos") {
      return {
        seriesSlug: "planner-spotlight",
        templateSlug: "planner-profile-post",
        reason:
          "Bios + headshots are the exact fit for the Planner Spotlight profile post.",
      };
    }
    if (type === "wedding_recap") {
      return {
        seriesSlug: "planner-spotlight",
        templateSlug: "planner-profile-post",
        reason:
          "A wedding recap from a planner reads as a profile feature — couple's story with the planner credit.",
      };
    }
  }

  // Default vendor handling (photographer / decorator / caterer / etc.)
  if (type === "tips") {
    return {
      seriesSlug: "vendor-spotlight",
      templateSlug: "vendor-tip-carousel",
      reason:
        "Tips submissions become a Vendor Spotlight tip carousel — 1 tip per slide.",
    };
  }
  if (type === "quote") {
    return {
      seriesSlug: "general-purpose",
      templateSlug: "vendor-quote",
      reason:
        "A short quote is the cleanest fit for the standalone Vendor Quote card.",
    };
  }
  if (type === "wedding_recap") {
    return {
      seriesSlug: "vendor-spotlight",
      templateSlug: "vendor-feature-post",
      reason:
        "Wedding recaps ride on the Vendor Spotlight feature post — hero photo + vendor credit, the couple lives in the caption.",
    };
  }
  if (type === "bio" || type === "photos") {
    return {
      seriesSlug: "vendor-spotlight",
      templateSlug: "vendor-feature-post",
      reason:
        "Vendor Spotlight's feature post pairs the vendor name + photo + a hook line.",
    };
  }

  // Final fallback.
  return {
    seriesSlug: "general-purpose",
    templateSlug: "vendor-quote",
    reason:
      "Defaulting to a Vendor Quote card — easy to retarget later from the editor.",
  };
}

/**
 * Pre-fill the content_data for the suggested template using whatever's in
 * the submission. We're conservative — only fill keys we're confident about.
 */
export function prefillContentData(
  templateSlug: string,
  submission: VendorSubmission,
): ContentData {
  const categoryLabel = VENDOR_CATEGORY_TO_LABEL[submission.category];
  const text = (submission.text_content ?? "").trim();
  const tipLines = text
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^\s*[-*•·]\s+/, "")
        .replace(/^\s*\d+[.)]\s+/, "")
        .trim(),
    )
    .filter(Boolean);

  switch (templateSlug) {
    case "vendor-quote":
      return {
        quote: text,
        attribution: `— ${submission.vendor_name.toUpperCase()}`,
        tagline: vendorCategoryLabel(submission.category),
      };
    case "vendor-feature-post":
      return {
        vendorCategory: categoryLabel,
        vendorName: submission.vendor_name,
        hookLine: text || "A vendor we're obsessed with.",
      };
    case "vendor-tip-carousel":
      return {
        slideIndex: "1",
        vendorName: submission.vendor_name,
        vendorCategory: categoryLabel,
        coverTitle: "Tips from our favorite vendor",
        tip1: tipLines[0] ?? "",
        tip2: tipLines[1] ?? "",
        tip3: tipLines[2] ?? "",
        tip4: tipLines[3] ?? "",
      };
    case "venue-feature-post":
      return {
        venueName: submission.vendor_name,
        hookLine: text || "A venue we're obsessed with.",
      };
    case "venue-style-guide":
      return {
        venueName: submission.vendor_name,
        guideText: text,
      };
    case "planner-profile-post":
      return {
        plannerName: submission.vendor_name,
        bio: text,
      };
    case "planner-tips-carousel":
      return {
        slideIndex: "1",
        plannerName: submission.vendor_name,
        tip1: tipLines[0] ?? "",
        tip2: tipLines[1] ?? "",
        tip3: tipLines[2] ?? "",
        tip4: tipLines[3] ?? "",
      };
    default:
      return {};
  }
}

/**
 * A short, hand-crafted caption referencing the vendor. Plays the role of
 * "Generate Caption" without round-tripping the AI — keeps the inbox flow
 * working even if the AI server is down or rate-limited. The user can hit
 * "Regenerate caption" inside the editor for an AI version.
 */
export function buildVendorCaption(submission: VendorSubmission): string {
  const cat = vendorCategoryLabel(submission.category).toLowerCase();
  const name = submission.vendor_name;
  const summary = (submission.text_content ?? "").trim();
  const summaryLine =
    summary.length > 0
      ? summary.split("\n")[0].slice(0, 200)
      : `Featuring work from ${name}.`;

  switch (submission.submission_type) {
    case "tips":
      return [
        `${cat} secrets, courtesy of ${name}.`,
        "",
        summaryLine,
        "",
        `Save this for when you start vendor calls 👇`,
        `Featured: ${name}`,
      ].join("\n");
    case "quote":
      return [
        `"${summaryLine}"`,
        "",
        `— ${name}, ${cat}`,
        "",
        "More vendor confessions on the way.",
      ].join("\n");
    case "wedding_recap":
      return [
        `Inside a wedding by ${name}.`,
        "",
        summaryLine,
        "",
        `Vendor: ${name}`,
      ].join("\n");
    case "venue_package":
      return [
        `Saving this venue for the moodboard 📌`,
        "",
        summaryLine,
        "",
        `Venue: ${name}`,
      ].join("\n");
    case "bio":
      return [
        `Meet ${name}.`,
        "",
        summaryLine,
        "",
        `One more ${cat} for the rolodex.`,
      ].join("\n");
    case "photos":
    default:
      return [
        `Captured by ${name}.`,
        "",
        summaryLine,
        "",
        `Tag a friend who'd book them in a heartbeat.`,
      ].join("\n");
  }
}
