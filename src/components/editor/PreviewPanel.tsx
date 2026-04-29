"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import { renderTemplate } from "@/components/calendar/template-renderer";
import {
  ConfessionalReel,
  type ConfessionalReelHandle,
} from "@/components/templates/confessional";
import {
  HIGHLIGHT_PALETTES,
  computeConfessionalTimeline,
  type ConfessionalHighlightColor,
} from "@/lib/confessional-timing";
import { exportReelAsAnimation } from "@/lib/export/export-reel";
import type { ContentData, TemplateDefinition } from "@/lib/types";

interface PreviewPanelProps {
  template: TemplateDefinition;
  contentData: ContentData;
  /**
   * Sibling templates in the same series. If a story↔post pair exists, a
   * format toggle is shown that swaps the active template.
   */
  templatesInSeries: TemplateDefinition[];
  onTemplateChange: (slug: string) => void;
  /**
   * Ref pointing at the inner (1080-wide) div that the export pipeline
   * captures with `overrideTransform: "scale(1)"`.
   */
  innerRef: RefObject<HTMLDivElement>;
}

export function PreviewPanel({
  template,
  contentData,
  templatesInSeries,
  onTemplateChange,
  innerRef,
}: PreviewPanelProps) {
  const previewFormat = template.format === "reel" ? "story" : template.format;
  const dims = template.dimensions;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    function recalc() {
      const el = containerRef.current;
      if (!el) return;
      const padding = 48;
      const availW = Math.max(220, el.clientWidth - padding);
      const availH = Math.max(220, el.clientHeight - padding - 80);
      const s = Math.min(availW / dims.width, availH / dims.height);
      setScale(Math.max(0.1, Math.min(s, 0.6)));
    }
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [dims.width, dims.height]);

  // Build the format-toggle pairs: list of (format, slug) for templates in
  // this series that share the same conceptual content. Currently this is
  // any template whose slug matches the prefix before the format suffix.
  const baseSlug = stripFormatSuffix(template.slug);
  const formatPairs = templatesInSeries.filter(
    (t) => stripFormatSuffix(t.slug) === baseSlug,
  );
  const showFormatToggle = formatPairs.length > 1;

  return (
    <div ref={containerRef} style={panelStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrow}>Live preview</div>
          <h2 style={titleStyle}>{template.name}</h2>
          <div style={dimsStyle}>
            {dims.width} × {dims.height} · {template.format}
          </div>
        </div>
        {showFormatToggle && (
          <div style={{ display: "flex", gap: 6 }}>
            {formatPairs.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => onTemplateChange(t.slug)}
                style={{
                  ...formatToggleButton,
                  background:
                    t.slug === template.slug ? "var(--wine)" : "transparent",
                  color:
                    t.slug === template.slug ? "var(--cream)" : "var(--wine)",
                }}
              >
                {t.format}
              </button>
            ))}
          </div>
        )}
      </header>

      <div style={stageStyle}>
        {template.slug === "confessional-reel" ? (
          <ConfessionalReelStage
            template={template}
            contentData={contentData}
            scale={scale}
            innerRef={innerRef}
          />
        ) : (
          <TemplateFrame
            format={previewFormat}
            scale={scale}
            innerRef={innerRef}
          >
            {renderTemplate(template.slug, contentData)}
          </TemplateFrame>
        )}
      </div>

      <FontReadyHint />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confessional Reel — live playback stage with play/pause/restart + scrubber.
// Other templates use the static `renderTemplate` path; the reel needs an
// imperative ref to drive the karaoke loop in real time.
// ---------------------------------------------------------------------------

interface ConfessionalReelStageProps {
  template: TemplateDefinition;
  contentData: ContentData;
  scale: number;
  innerRef: RefObject<HTMLDivElement>;
}

function ConfessionalReelStage({
  template,
  contentData,
  scale,
  innerRef,
}: ConfessionalReelStageProps) {
  const reelRef = useRef<ConfessionalReelHandle>(null);
  const [playing, setPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  // When set, the reel renders in "controlled" mode (RAF disabled) and the
  // export pipeline drives the playhead frame-by-frame. Cleared on completion.
  const [controlledMs, setControlledMs] = useState<number | null>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const confessionNumber = useMemo(
    () => coerceNumber(contentData.confessionNumber, 1),
    [contentData.confessionNumber],
  );
  const confessionText = useMemo(
    () => coerceString(contentData.confessionText, ""),
    [contentData.confessionText],
  );
  const attribution = useMemo(
    () =>
      coerceString(contentData.attribution, "— anonymous bride, 2026"),
    [contentData.attribution],
  );
  const wordsPerMinute = useMemo(
    () => coerceNumber(contentData.wordsPerMinute, 150),
    [contentData.wordsPerMinute],
  );
  const highlightColor = useMemo<ConfessionalHighlightColor>(() => {
    const raw = coerceString(contentData.highlightColor, "hot-pink");
    return raw in HIGHLIGHT_PALETTES
      ? (raw as ConfessionalHighlightColor)
      : "hot-pink";
  }, [contentData.highlightColor]);

  // Reset playhead when the underlying content changes — so a freshly edited
  // confession plays from the top instead of resuming partway through.
  useEffect(() => {
    setPlaying(false);
    setProgressMs(0);
    reelRef.current?.reset();
  }, [confessionText, wordsPerMinute]);

  function handlePlayPause() {
    if (playing) {
      reelRef.current?.pause();
      setPlaying(false);
      return;
    }
    if (durationMs > 0 && progressMs >= durationMs - 1) {
      reelRef.current?.reset();
      setProgressMs(0);
    }
    reelRef.current?.play();
    setPlaying(true);
  }

  function handleRestart() {
    reelRef.current?.reset();
    setProgressMs(0);
    if (!playing) {
      reelRef.current?.play();
      setPlaying(true);
    }
  }

  async function handleExport() {
    if (!innerRef.current || exportProgress != null) return;
    // Pause playback and switch the reel into controlled mode so the export
    // pipeline can step the playhead frame-by-frame.
    reelRef.current?.pause();
    setPlaying(false);
    setExportError(null);
    setExportProgress(0);

    const timeline = computeConfessionalTimeline(confessionText, {
      wordsPerMinute,
    });
    const totalDuration = timeline.ctaStartMs + 1500;
    const filename = `${template.slug}_${confessionNumber}_${highlightColor}`;

    try {
      // Seed the controlled playhead BEFORE the export driver runs so the
      // RAF loop is fully disabled by the time we capture frame 0.
      setControlledMs(0);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve()),
        ),
      );
      await exportReelAsAnimation(innerRef.current, {
        durationMs: totalDuration,
        fps: 24,
        width: 1080,
        height: 1920,
        filename,
        download: true,
        setProgressMs: (ms) => setControlledMs(ms),
        onProgress: (p) => setExportProgress(p),
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setControlledMs(null);
      setExportProgress(null);
      setProgressMs(0);
      reelRef.current?.reset();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <TemplateFrame format="story" scale={scale} innerRef={innerRef}>
        <ConfessionalReel
          ref={reelRef}
          confessionNumber={confessionNumber}
          confessionText={confessionText}
          attribution={attribution}
          wordsPerMinute={wordsPerMinute}
          highlightColor={highlightColor}
          playing={playing}
          progressMs={controlledMs ?? undefined}
          onTick={(ms, total) => {
            setProgressMs(ms);
            setDurationMs(total);
          }}
          onComplete={() => setPlaying(false)}
        />
      </TemplateFrame>
      <ReelPlaybackControls
        playing={playing}
        progressMs={controlledMs ?? progressMs}
        durationMs={durationMs || 1}
        onPlayPause={handlePlayPause}
        onRestart={handleRestart}
        templateName={template.name}
        onExport={handleExport}
        exportProgress={exportProgress}
        exportError={exportError}
      />
    </div>
  );
}

interface ReelPlaybackControlsProps {
  playing: boolean;
  progressMs: number;
  durationMs: number;
  onPlayPause: () => void;
  onRestart: () => void;
  templateName: string;
  onExport: () => void;
  exportProgress: number | null;
  exportError: string | null;
}

function ReelPlaybackControls({
  playing,
  progressMs,
  durationMs,
  onPlayPause,
  onRestart,
  templateName,
  onExport,
  exportProgress,
  exportError,
}: ReelPlaybackControlsProps) {
  const pct = Math.max(0, Math.min(1, progressMs / durationMs));
  const exporting = exportProgress != null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        role="group"
        aria-label={`${templateName} playback`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 18px",
          background: "var(--cream)",
          border: "1px solid rgba(75,21,40,0.15)",
          borderRadius: 999,
          boxShadow: "0 4px 18px rgba(75,21,40,0.08)",
          minWidth: 360,
        }}
      >
        <button
          type="button"
          onClick={onPlayPause}
          aria-label={playing ? "Pause" : "Play"}
          disabled={exporting}
          style={{
            ...playButtonStyle,
            opacity: exporting ? 0.4 : 1,
            cursor: exporting ? "not-allowed" : "pointer",
          }}
        >
          {playing ? "❙❙" : "▶"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          aria-label="Restart from beginning"
          disabled={exporting}
          style={{
            ...restartButtonStyle,
            opacity: exporting ? 0.4 : 1,
            cursor: exporting ? "not-allowed" : "pointer",
          }}
        >
          ↺
        </button>
        <div
          aria-hidden
          style={{
            flex: 1,
            height: 4,
            background: "rgba(75,21,40,0.12)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: "100%",
              background: "var(--pink)",
              transition: "width 80ms linear",
            }}
          />
        </div>
        <span style={timeLabelStyle}>
          {formatMs(progressMs)} / {formatMs(durationMs)}
        </span>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          title="Capture frames at 24fps and download an animated WebM preview."
          style={{
            ...exportReelButtonStyle,
            opacity: exporting ? 0.65 : 1,
            cursor: exporting ? "wait" : "pointer",
          }}
        >
          {exporting
            ? `Exporting ${Math.round((exportProgress ?? 0) * 100)}%`
            : "Export .webm"}
        </button>
      </div>
      {exportError && (
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            color: "var(--deep-pink)",
            maxWidth: 360,
            textAlign: "center",
          }}
        >
          {exportError}
        </div>
      )}
    </div>
  );
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function coerceString(v: unknown, fallback: string): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function coerceNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return fallback;
}

function stripFormatSuffix(slug: string): string {
  return slug.replace(/-(story|post|reel)$/, "");
}

function FontReadyHint() {
  const [ready, setReady] = useState(true);
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    setReady(document.fonts.status === "loaded");
    document.fonts.ready.then(() => setReady(true));
  }, []);
  if (ready) return null;
  return (
    <div
      style={{
        fontFamily: "'Caveat', cursive",
        fontSize: 16,
        color: "var(--mauve)",
        textAlign: "center",
        padding: 12,
      }}
    >
      loading fonts…
    </div>
  );
}

const panelStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "var(--blush)",
  position: "relative",
  minHeight: 0,
  height: "100%",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  padding: "32px 40px 16px",
  flexShrink: 0,
};

const eyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2.4,
  color: "var(--pink)",
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 32,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.1,
};

const dimsStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  marginTop: 4,
  textTransform: "uppercase",
  letterSpacing: 1.2,
};

const stageStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  overflow: "hidden",
};

const formatToggleButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  border: "1px solid var(--wine)",
  borderRadius: 999,
  cursor: "pointer",
};

const playButtonStyle: CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: 999,
  background: "var(--wine)",
  color: "var(--cream)",
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "2px 2px 0 var(--gold)",
};

const restartButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid rgba(75,21,40,0.3)",
  borderRadius: 999,
  background: "transparent",
  color: "var(--wine)",
  fontFamily: "'Syne', sans-serif",
  fontSize: 16,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const timeLabelStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: 0.4,
  whiteSpace: "nowrap",
};

const exportReelButtonStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  background: "var(--pink)",
  color: "white",
  border: "none",
  borderRadius: 999,
  whiteSpace: "nowrap",
};
