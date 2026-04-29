/**
 * POST /api/generate
 *
 * The single AI entry point for the Marigold Studio. Dispatches to one of
 * four generation functions based on the `type` field.
 *
 * Request body:
 *   { type: "week",       startDate: ISO8601 }
 *   { type: "single",     seriesSlug, templateSlug, userPrompt? }
 *   { type: "caption",    seriesSlug, contentData }
 *   { type: "variations", contentData, count, seriesSlug? }
 *
 * Response: { ok: true, data: ... }  on success.
 *           { ok: false, error: string } on failure.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  generateCalendarWeek,
  generateCaption,
  generateSinglePost,
  generateVariations,
} from "@/lib/ai/generate-content";
import type { CalendarItem, ContentData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WeekRequest {
  type: "week";
  startDate?: string;
  /**
   * Optional. The previous week's calendar items, so the grid sequencer can
   * read the last row of the existing grid and avoid stacking the same
   * colour or series vertically.
   */
  previousWeekItems?: CalendarItem[];
}

interface SingleRequest {
  type: "single";
  seriesSlug: string;
  templateSlug: string;
  userPrompt?: string;
}

interface CaptionRequest {
  type: "caption";
  seriesSlug: string;
  contentData: ContentData;
}

interface VariationsRequest {
  type: "variations";
  contentData: ContentData;
  count: number;
  seriesSlug?: string;
}

type GenerateRequest =
  | WeekRequest
  | SingleRequest
  | CaptionRequest
  | VariationsRequest;

function badRequest(message: string): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function serverError(message: string): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object" || !("type" in body)) {
    return badRequest("Request body must include a `type` field.");
  }

  try {
    switch (body.type) {
      case "week": {
        const startDate = body.startDate ? new Date(body.startDate) : new Date();
        if (Number.isNaN(startDate.getTime())) {
          return badRequest("`startDate` is not a valid ISO date.");
        }
        const result = await generateCalendarWeek(
          startDate,
          body.previousWeekItems ?? [],
        );
        // Keep the legacy contract — top-level `data` is the merged item list
        // — but expose grid order, story/reel schedule, and grid reasoning so
        // the dialog can render the strategy alongside the items.
        return NextResponse.json({
          ok: true,
          data: result.items,
          gridOrder: result.gridOrder.map((item) => item.id),
          storyReelSchedule: result.storyReelSchedule.map((item) => item.id),
          gridReasoning: result.gridReasoning,
        });
      }

      case "single": {
        if (!body.seriesSlug || !body.templateSlug) {
          return badRequest("`seriesSlug` and `templateSlug` are required.");
        }
        const item = await generateSinglePost(
          body.seriesSlug,
          body.templateSlug,
          body.userPrompt,
        );
        return NextResponse.json({ ok: true, data: item });
      }

      case "caption": {
        if (!body.seriesSlug || !body.contentData) {
          return badRequest("`seriesSlug` and `contentData` are required.");
        }
        const result = await generateCaption(body.contentData, body.seriesSlug);
        return NextResponse.json({ ok: true, data: result });
      }

      case "variations": {
        if (!body.contentData || typeof body.count !== "number") {
          return badRequest("`contentData` and numeric `count` are required.");
        }
        const variations = await generateVariations(
          body.contentData,
          body.count,
          body.seriesSlug,
        );
        return NextResponse.json({ ok: true, data: variations });
      }

      default: {
        const exhaustive: never = body;
        return badRequest(
          `Unknown generation type: ${(exhaustive as { type?: string }).type ?? "<missing>"}`,
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    console.error("[/api/generate] failed:", err);
    return serverError(message);
  }
}
