"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  TemplateFrame,
  type TemplateFormat,
} from "@/components/brand/TemplateFrame";
import { exportImage } from "@/lib/export/export-image";
import { getTemplateBySlug } from "@/lib/db/data-loader";
import {
  getAllSubmissions,
  vendorCategoryLabel,
  submissionTypeLabel,
} from "@/lib/db/submissions-store";
import { CreatePostFromSubmissionDialog } from "@/components/submissions/CreatePostFromSubmissionDialog";
import { CustomizeExpander } from "@/components/gallery/CustomizeExpander";
import type { CalendarItem, VendorSubmission } from "@/lib/types";

const FORMAT_DIMENSIONS = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
} as const satisfies Record<TemplateFormat, { width: number; height: number }>;

export interface GalleryItemProps {
  format: TemplateFormat;
  /** Used as the PNG filename and shown to the user as a small caption. */
  filename: string;
  label: string;
  children: ReactNode;
  /** Optional kind tag — drives the badge / overlay (reel | carousel | post | story). */
  kind?: "post" | "story" | "reel" | "carousel";
  /** Carousel slide indicator, e.g. "2/5". */
  slideIndicator?: string;
  /** Template slug for the "Use This Template" + "Customize Sample" actions. */
  templateSlug?: string;
  /** Series slug for the "Use This Template" modal. */
  seriesSlug?: string;
  /** Called when the user clicks "Use This Template". */
  onUseTemplate?: (info: {
    templateSlug?: string;
    seriesSlug?: string;
    templateName: string;
  }) => void;
  /** Hide the format/dim caption (used inside grouped cards). */
  hideCaption?: boolean;
  /** Hide the "Customize Sample" button (used inside carousel cards). */
  hideCustomize?: boolean;
}

export function GalleryItem({
  format,
  filename,
  label,
  children,
  kind,
  slideIndicator,
  templateSlug,
  seriesSlug,
  onUseTemplate,
  hideCaption,
  hideCustomize,
}: GalleryItemProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] =
    useState<VendorSubmission | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const dims = FORMAT_DIMENSIONS[format];

  // Templates use the same slug as the gallery filename for most series. When
  // there's no match (e.g. gallery slides like "bvm-story-1"), the pill stays
  // hidden and we don't add UI noise.
  const explicitTemplate = templateSlug
    ? getTemplateBySlug(templateSlug)
    : null;
  const linkedTemplate = explicitTemplate ?? getTemplateBySlug(filename);
  const customizeTemplateSlug = explicitTemplate?.slug ?? linkedTemplate?.slug;

  useEffect(() => {
    if (!pickerOpen) return;
    setSubmissions(
      getAllSubmissions().filter((s) => s.status !== "used"),
    );
    function onStorageChange() {
      setSubmissions(
        getAllSubmissions().filter((s) => s.status !== "used"),
      );
    }
    window.addEventListener("marigold:storage-changed", onStorageChange);
    return () =>
      window.removeEventListener("marigold:storage-changed", onStorageChange);
  }, [pickerOpen]);

  // Close the picker on outside click / Escape.
  useEffect(() => {
    if (!pickerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-submission-picker]")) {
        setPickerOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [pickerOpen]);

  async function handleExport() {
    if (!innerRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      console.log(`[export] ${filename} — starting`, {
        node: innerRef.current,
        rect: innerRef.current.getBoundingClientRect(),
      });
      const blob = await exportImage(innerRef.current, {
        filename,
        download: true,
        width: dims.width,
        height: dims.height,
        // The inner div is rendered at scale(0.25). Override that during
        // capture so the cloned subtree paints at full 1080px.
        overrideTransform: "scale(1)",
      });
      console.log(`[export] ${filename} — captured`, {
        size: blob.size,
        type: blob.type,
      });
    } catch (err) {
      console.error(`[export] ${filename} — failed`, err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function handlePickSubmission(submission: VendorSubmission) {
    setPickerOpen(false);
    setActiveSubmission(submission);
  }

  function handleCreated(_item: CalendarItem) {
    setActiveSubmission(null);
  }

  const showReelOverlay = kind === "reel";
  const showCarouselIndicator = kind === "carousel" && slideIndicator;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
      }}
    >
      {!hideCaption && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "var(--mauve)",
            }}
          >
            {label} ({dims.width} × {dims.height})
          </span>
          {kind && kind !== "post" && kind !== "story" && (
            <span style={kindBadgeStyle(kind)}>{kind.toUpperCase()}</span>
          )}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <TemplateFrame format={format} innerRef={innerRef}>
          {children}
        </TemplateFrame>

        {showReelOverlay && (
          <>
            <div style={reelBadgeStyle}>REEL</div>
            <div style={playIconWrapperStyle} aria-hidden>
              <PlayIcon />
            </div>
          </>
        )}

        {showCarouselIndicator && (
          <div style={slideIndicatorStyle}>{slideIndicator}</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={busy}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 2,
            padding: "10px 20px",
            background: busy ? "var(--mauve)" : "var(--wine)",
            color: "var(--cream)",
            border: "none",
            cursor: busy ? "wait" : "pointer",
            boxShadow: "3px 3px 0 var(--gold)",
            transition: "transform 120ms ease, box-shadow 120ms ease",
          }}
        >
          {busy ? "Exporting…" : "Export PNG"}
        </button>

        {onUseTemplate && (
          <button
            type="button"
            onClick={() =>
              onUseTemplate({
                templateSlug: customizeTemplateSlug,
                seriesSlug,
                templateName: linkedTemplate?.name ?? label,
              })
            }
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              padding: "10px 16px",
              background: "var(--hot-pink)",
              color: "var(--cream)",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              boxShadow: "3px 3px 0 var(--wine)",
            }}
          >
            Use this template
          </button>
        )}

        {!hideCustomize && customizeTemplateSlug && (
          <button
            type="button"
            onClick={() => setCustomizeOpen((v) => !v)}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              padding: "10px 14px",
              background: customizeOpen ? "var(--wine)" : "transparent",
              color: customizeOpen ? "var(--cream)" : "var(--wine)",
              border: "1px solid var(--wine)",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {customizeOpen ? "Close customize" : "Customize sample"}
          </button>
        )}

        {linkedTemplate && (
          <div data-submission-picker style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1.4,
                padding: "9px 12px",
                background: "transparent",
                color: "var(--deep-pink)",
                border: "1px dashed var(--deep-pink)",
                borderRadius: 999,
                cursor: "pointer",
              }}
              title="Pair this template with a vendor submission"
            >
              Use with a submission
            </button>

            {pickerOpen && (
              <SubmissionPicker
                submissions={submissions}
                onPick={handlePickSubmission}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      {customizeOpen && customizeTemplateSlug && (
        <CustomizeExpander
          templateSlug={customizeTemplateSlug}
          onClose={() => setCustomizeOpen(false)}
        />
      )}

      {error && (
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            color: "var(--deep-pink)",
            maxWidth: 220,
          }}
        >
          {error}
        </div>
      )}

      {linkedTemplate && (
        <CreatePostFromSubmissionDialog
          open={activeSubmission !== null}
          submission={activeSubmission}
          forcedTemplateSlug={linkedTemplate.slug}
          onClose={() => setActiveSubmission(null)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
    >
      <circle cx="24" cy="24" r="22" fill="rgba(255,255,255,0.92)" />
      <path d="M19 16 L33 24 L19 32 Z" fill="var(--wine)" />
    </svg>
  );
}

const reelBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  left: 10,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(75,21,40,0.85)",
  color: "var(--cream)",
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 2,
  zIndex: 2,
};

const playIconWrapperStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
  zIndex: 2,
};

const slideIndicatorStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(75,21,40,0.85)",
  color: "var(--cream)",
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  zIndex: 2,
};

function kindBadgeStyle(
  kind: "post" | "story" | "reel" | "carousel",
): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string }> = {
    reel: { bg: "var(--hot-pink)", fg: "var(--cream)" },
    carousel: { bg: "var(--gold)", fg: "var(--wine)" },
    story: { bg: "var(--lavender)", fg: "var(--wine)" },
    post: { bg: "var(--blush)", fg: "var(--wine)" },
  };
  const c = colors[kind] ?? colors.post;
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 9,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    padding: "3px 8px",
    background: c.bg,
    color: c.fg,
    borderRadius: 999,
  };
}

interface SubmissionPickerProps {
  submissions: VendorSubmission[];
  onPick: (submission: VendorSubmission) => void;
  onClose: () => void;
}

function SubmissionPicker({
  submissions,
  onPick,
  onClose,
}: SubmissionPickerProps) {
  return (
    <div
      role="dialog"
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        zIndex: 30,
        minWidth: 280,
        maxWidth: 360,
        maxHeight: 360,
        overflowY: "auto",
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.15)",
        borderRadius: 12,
        boxShadow: "0 12px 30px rgba(75,21,40,0.18)",
        padding: 8,
      }}
    >
      {submissions.length === 0 ? (
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 18,
              color: "var(--wine)",
              lineHeight: 1.3,
            }}
          >
            No unused submissions yet.
          </div>
          <a
            href="/submissions"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              color: "var(--deep-pink)",
              textDecoration: "underline",
            }}
            onClick={onClose}
          >
            + Add a submission
          </a>
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {submissions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick(s)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--blush)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 16,
                    color: "var(--wine)",
                    lineHeight: 1.15,
                  }}
                >
                  {s.vendor_name}
                </div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.4,
                    color: "var(--mauve)",
                  }}
                >
                  {vendorCategoryLabel(s.category)} ·{" "}
                  {submissionTypeLabel(s.submission_type)} · {s.status}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
