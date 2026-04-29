"use client";

/**
 * ReelPreviewPlayer — universal playback shell for any reel template.
 *
 * Owns the playhead (driven by requestAnimationFrame) plus the standard set
 * of editor controls: play / pause, scrubber, time readout, speed control,
 * loop toggle, and an "Export Frames" trigger that hands off to the GIF
 * encoder in `@/lib/animations/frame-exporter`.
 *
 * Use as a render-prop:
 *
 *   <ReelPreviewPlayer durationMs={d} width={1080} height={1920}>
 *     {(currentMs) => <ConfessionalReel progressMs={currentMs} ... />}
 *   </ReelPreviewPlayer>
 *
 * The child receives the live playhead in ms; the player wraps it in a fixed
 * 1080×1920 stage for capture.
 */

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  exportReelAsGif,
  type ExportReelGifResult,
} from "@/lib/animations/frame-exporter";

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

export interface ReelPreviewPlayerProps {
  /** Total length of the reel in ms (including any outro / CTA fades). */
  durationMs: number;
  /** Native frame width — typically 1080. */
  width?: number;
  /** Native frame height — typically 1920. */
  height?: number;
  /**
   * Render-prop. Receives the current playhead in ms. The returned node is
   * what gets played back and (when the user hits Export) captured.
   */
  children: (currentTimeMs: number) => ReactNode;
  /** Filename (no extension) used when the user exports the reel. */
  exportFilename?: string;
  /** Frames per second when exporting. Default 30. */
  exportFps?: number;
  /** Visual scale of the preview stage. Default 0.4 (so 1080×1920 fits). */
  previewScale?: number;
  /** Loop on by default. */
  defaultLoop?: boolean;
  /** Auto-play when mounted. */
  autoPlay?: boolean;
  /** Notified once when the playhead reaches `durationMs` (with loop off). */
  onComplete?: () => void;
  /** Class name applied to the outer wrapper. */
  className?: string;
}

export function ReelPreviewPlayer(props: ReelPreviewPlayerProps) {
  const {
    durationMs,
    width = 1080,
    height = 1920,
    children,
    exportFilename = "reel-preview",
    exportFps = 30,
    previewScale = 0.4,
    defaultLoop = true,
    autoPlay = false,
    onComplete,
    className,
  } = props;

  const [currentMs, setCurrentMs] = useState(0);
  const currentMsRef = useRef(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<Speed>(1);
  const [loop, setLoop] = useState(defaultLoop);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<ExportReelGifResult | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset the completed flag whenever duration shifts (e.g. text edits).
  useEffect(() => {
    completedRef.current = false;
  }, [durationMs]);

  // Drive the playhead off RAF. Pauses when `playing` is false or while an
  // export is running (the exporter pins the playhead manually).
  useEffect(() => {
    if (!playing || exporting) {
      lastFrameRef.current = null;
      return;
    }

    function tick(ts: number) {
      if (lastFrameRef.current == null) lastFrameRef.current = ts;
      const delta = (ts - lastFrameRef.current) * speed;
      lastFrameRef.current = ts;

      let next = currentMsRef.current + delta;
      let reachedEnd = false;
      if (next >= durationMs) {
        if (loop) {
          completedRef.current = false;
          next = 0;
        } else {
          next = durationMs;
          reachedEnd = true;
        }
      }
      currentMsRef.current = next;
      setCurrentMs(next);

      if (reachedEnd) {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        setPlaying(false);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [playing, exporting, speed, durationMs, loop]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(durationMs, ms));
      currentMsRef.current = clamped;
      setCurrentMs(clamped);
      completedRef.current = false;
    },
    [durationMs],
  );

  const togglePlay = useCallback(() => {
    setPlaying((prev) => {
      if (!prev && currentMsRef.current >= durationMs) {
        currentMsRef.current = 0;
        setCurrentMs(0);
        completedRef.current = false;
      }
      return !prev;
    });
  }, [durationMs]);

  const handleExport = useCallback(async () => {
    if (!stageRef.current) return;
    if (exporting) return;
    setExporting(true);
    setExportProgress(0);
    setExportError(null);
    setLastExport(null);
    setPlaying(false);

    try {
      const result = await exportReelAsGif(stageRef.current, {
        durationMs,
        fps: exportFps,
        width,
        height,
        filename: exportFilename,
        download: true,
        setProgressMs: (ms) => {
          currentMsRef.current = ms;
          setCurrentMs(ms);
        },
        onProgress: (p) => setExportProgress(p),
      });
      setLastExport(result);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [exporting, durationMs, exportFps, width, height, exportFilename]);

  const stageWrapperStyle = useMemo(
    () => ({
      width: width * previewScale,
      height: height * previewScale,
      position: "relative" as const,
      overflow: "hidden" as const,
      borderRadius: 16,
      background: "#000",
      boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
    }),
    [width, height, previewScale],
  );

  const stageInnerStyle = useMemo(
    () => ({
      width,
      height,
      transform: `scale(${previewScale})`,
      transformOrigin: "top left",
      position: "absolute" as const,
      top: 0,
      left: 0,
    }),
    [width, height, previewScale],
  );

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={stageWrapperStyle}>
        <div ref={stageRef} style={stageInnerStyle}>
          {children(currentMs)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          color: "var(--wine, #4B1528)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={togglePlay}
            disabled={exporting}
            aria-label={playing ? "Pause" : "Play"}
            style={controlButtonStyle({ active: playing })}
          >
            {playing ? "❚❚" : "▶"}
          </button>

          <div style={{ minWidth: 92, fontVariantNumeric: "tabular-nums" }}>
            {formatMs(currentMs)} / {formatMs(durationMs)}
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(1, Math.round(durationMs))}
            step={10}
            value={Math.round(currentMs)}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={exporting}
            style={{ flex: 1 }}
            aria-label="Scrubber"
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ opacity: 0.7 }}>Speed</span>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                disabled={exporting}
                style={pillStyle({ active: speed === s })}
              >
                {s}×
              </button>
            ))}
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
              disabled={exporting}
            />
            Loop
          </label>

          <div style={{ flex: 1 }} />

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={exportButtonStyle({ exporting })}
          >
            {exporting
              ? `Exporting… ${Math.round(exportProgress * 100)}%`
              : "Export Frames"}
          </button>
        </div>

        {exportError ? (
          <div style={{ color: "var(--hot-pink, #d4537e)", fontSize: 12 }}>
            Export failed: {exportError}
          </div>
        ) : null}
        {lastExport ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Exported {lastExport.frameCount} frames →{" "}
            <a href={lastExport.url} download={lastExport.filename}>
              {lastExport.filename}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const seconds = Math.floor(total / 1000);
  const tenths = Math.floor((total % 1000) / 100);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}.${tenths}`;
}

function controlButtonStyle({ active }: { active: boolean }) {
  return {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: "1px solid rgba(75,21,40,0.18)",
    background: active ? "var(--hot-pink, #d4537e)" : "var(--cream, #fff8f2)",
    color: active ? "#fff" : "var(--wine, #4B1528)",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
  };
}

function pillStyle({ active }: { active: boolean }) {
  return {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(75,21,40,0.18)",
    background: active ? "var(--wine, #4B1528)" : "transparent",
    color: active ? "var(--cream, #fff8f2)" : "var(--wine, #4B1528)",
    fontFamily: "inherit",
    fontSize: 12,
    cursor: "pointer",
  };
}

function exportButtonStyle({ exporting }: { exporting: boolean }) {
  return {
    padding: "8px 16px",
    borderRadius: 999,
    border: "none",
    background: exporting ? "rgba(75,21,40,0.5)" : "var(--wine, #4B1528)",
    color: "var(--cream, #fff8f2)",
    fontFamily: "inherit",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    cursor: exporting ? "wait" : "pointer",
  };
}
