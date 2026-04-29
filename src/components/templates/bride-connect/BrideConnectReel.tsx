"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";

import { CTABar } from "@/components/brand/CTABar";
import {
  computeConfessionalTimeline,
  wordVisualStateAt,
  type ConfessionalTimeline,
  type TimedWord,
  type WordVisualState,
} from "@/lib/confessional-timing";

const VISIBLE_LINES = 4;
const LINE_HEIGHT = 110;

export const BRIDE_CONNECT_REEL_DEFAULT_WPM = 130;

export interface BrideConnectReelProps {
  brideName: string;
  planningCity: string;
  weddingMonth: string;
  weddingYear: number;
  personalNote: string;
  imageUrl?: string;
  wordsPerMinute?: number;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export interface BrideConnectReelHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (ms: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

function buildIntroScript({
  brideName,
  planningCity,
  weddingMonth,
  weddingYear,
  personalNote,
}: {
  brideName: string;
  planningCity: string;
  weddingMonth: string;
  weddingYear: number;
  personalNote: string;
}): string {
  const month = formatMonth(weddingMonth);
  return [
    `Hi, I'm ${brideName}.`,
    `I'm planning a wedding in ${planningCity} for ${month} ${weddingYear}.`,
    `I'm looking for ${personalNote}.`,
    `If you're planning in ${planningCity} too, find me on The Marigold.`,
  ].join(" ");
}

function formatMonth(raw: string): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const map: Record<string, string> = {
    JAN: "January",
    FEB: "February",
    MAR: "March",
    APR: "April",
    MAY: "May",
    JUN: "June",
    JUL: "July",
    AUG: "August",
    SEP: "September",
    OCT: "October",
    NOV: "November",
    DEC: "December",
  };
  return map[upper] ?? trimmed;
}

export const BrideConnectReel = forwardRef<
  BrideConnectReelHandle,
  BrideConnectReelProps
>(function BrideConnectReel(props, ref) {
  const {
    brideName,
    planningCity,
    weddingMonth,
    weddingYear,
    personalNote,
    imageUrl,
    wordsPerMinute = BRIDE_CONNECT_REEL_DEFAULT_WPM,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const script = useMemo(
    () =>
      buildIntroScript({
        brideName,
        planningCity,
        weddingMonth,
        weddingYear,
        personalNote,
      }),
    [brideName, planningCity, weddingMonth, weddingYear, personalNote],
  );

  const timeline = useMemo<ConfessionalTimeline>(
    () => computeConfessionalTimeline(script, { wordsPerMinute }),
    [script, wordsPerMinute],
  );

  const outroEnd = timeline.ctaStartMs + 1500;

  const [internalMs, setInternalMs] = useState(0);
  const internalMsRef = useRef(0);
  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const isPlaying = progressMs == null && (playing ?? internalPlaying);
  const currentMs = progressMs ?? internalMs;

  useEffect(() => {
    if (progressMs != null) return;
    if (!isPlaying) {
      lastFrameRef.current = null;
      return;
    }
    function tick(ts: number) {
      if (lastFrameRef.current == null) lastFrameRef.current = ts;
      const delta = ts - lastFrameRef.current;
      lastFrameRef.current = ts;

      let next = internalMsRef.current + delta;
      let reachedEnd = false;
      if (next >= outroEnd) {
        if (loop) {
          completedRef.current = false;
          next = 0;
        } else {
          next = outroEnd;
          reachedEnd = true;
        }
      }
      internalMsRef.current = next;
      setInternalMs(next);

      if (reachedEnd) {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        setInternalPlaying(false);
      } else {
        onTickRef.current?.(next, outroEnd);
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [isPlaying, progressMs, outroEnd, loop]);

  useEffect(() => {
    completedRef.current = false;
  }, [script, wordsPerMinute]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        if (internalMsRef.current >= outroEnd) {
          completedRef.current = false;
          internalMsRef.current = 0;
          setInternalMs(0);
        }
        setInternalPlaying(true);
      },
      pause: () => setInternalPlaying(false),
      reset: () => {
        completedRef.current = false;
        internalMsRef.current = 0;
        setInternalMs(0);
      },
      seek: (ms: number) => {
        completedRef.current = false;
        const clamped = Math.max(0, Math.min(outroEnd, ms));
        internalMsRef.current = clamped;
        setInternalMs(clamped);
      },
      getDuration: () => outroEnd,
      getCurrentTime: () => internalMsRef.current,
    }),
    [outroEnd],
  );

  return (
    <BrideConnectReelStage
      timeline={timeline}
      currentMs={currentMs}
      brideName={brideName}
      planningCity={planningCity}
      imageUrl={imageUrl}
    />
  );
});

interface BrideConnectReelStageProps {
  timeline: ConfessionalTimeline;
  currentMs: number;
  brideName: string;
  planningCity: string;
  imageUrl?: string;
}

export function BrideConnectReelStage({
  timeline,
  currentMs,
  brideName,
  planningCity,
  imageUrl,
}: BrideConnectReelStageProps) {
  const activeLineIdx = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < timeline.words.length; i++) {
      if (timeline.words[i].startMs <= currentMs) {
        idx = timeline.words[i].lineIndex;
      } else {
        break;
      }
    }
    return idx;
  }, [timeline, currentMs]);

  const scrollLine = Math.max(0, activeLineIdx - 1);
  const translateY = -scrollLine * LINE_HEIGHT;

  const photoOpacity = clamp01(currentMs / 600);
  const ctaOpacity = clamp01((currentMs - timeline.ctaStartMs) / 600);
  const logoOpacity = clamp01((currentMs - timeline.attributionStartMs) / 600);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(180deg, var(--blush) 0%, #FCDCE7 45%, var(--cream) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.55), transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Profile photo — fades in immediately and stays */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: photoOpacity,
          transition: "opacity 200ms linear",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: imageUrl ? `url(${imageUrl})` : "rgba(212,83,126,0.12)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "6px solid var(--pink)",
            boxShadow:
              "0 0 0 4px white, 0 0 0 8px rgba(212,83,126,0.22), 0 12px 26px rgba(75,21,40,0.16)",
            display: imageUrl ? undefined : "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!imageUrl && (
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 4,
                color: "rgba(75,21,40,0.4)",
                textTransform: "uppercase",
              }}
            >
              PHOTO
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 36,
            color: "var(--wine)",
            lineHeight: 1.0,
          }}
        >
          {brideName}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 4,
            color: "var(--pink)",
            textTransform: "uppercase",
          }}
        >
          PLANNING IN {planningCity.toUpperCase()}
        </div>
      </div>

      {/* Karaoke stage — same teleprompter pattern as UserStoryReel */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "62%",
          transform: "translateY(-50%)",
          height: LINE_HEIGHT * VISIBLE_LINES,
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: LINE_HEIGHT,
            left: 0,
            right: 0,
            transform: `translateY(${translateY}px)`,
            transition: "transform 480ms cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {timeline.lines.map((line, li) => (
            <ScriptLine key={li} line={line} currentMs={currentMs} />
          ))}
        </div>
      </div>

      {/* Bride Connect logo treatment fades in at the end */}
      <div
        style={{
          position: "absolute",
          bottom: 240,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: logoOpacity,
          transition: "opacity 200ms linear",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          BRIDE CONNECT
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            color: "var(--pink)",
            transform: "rotate(-1deg)",
          }}
        >
          find your planning bestie
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          opacity: ctaOpacity,
          transition: "opacity 200ms linear",
        }}
      >
        <CTABar />
      </div>
    </div>
  );
}

interface ScriptLineProps {
  line: TimedWord[];
  currentMs: number;
}

function ScriptLine({ line, currentMs }: ScriptLineProps) {
  return (
    <div
      style={{
        height: LINE_HEIGHT,
        display: "flex",
        flexWrap: "nowrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 500,
        fontSize: 56,
        lineHeight: 1.1,
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      {line.map((word) => (
        <ScriptWord key={word.index} word={word} currentMs={currentMs} />
      ))}
    </div>
  );
}

interface ScriptWordProps {
  word: TimedWord;
  currentMs: number;
}

function ScriptWord({ word, currentMs }: ScriptWordProps) {
  const state = wordVisualStateAt(word, currentMs);
  const baseStyle = scriptWordStyle(state);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: -6,
          right: -6,
          top: 8,
          bottom: 12,
          background: "var(--pink)",
          opacity: state.active ? 0.32 : 0,
          width: state.active
            ? `calc(${state.progress * 100}% + 12px)`
            : "0%",
          borderRadius: 6,
          transition: "opacity 120ms linear, width 80ms linear",
          pointerEvents: "none",
        }}
      />
      <span style={{ position: "relative", ...baseStyle }}>
        {word.word}
        {word.trailing}
      </span>
    </span>
  );
}

function scriptWordStyle(state: WordVisualState): CSSProperties {
  if (state.active) {
    return {
      color: "var(--wine)",
      opacity: 1,
      transition: "color 80ms linear, opacity 80ms linear",
    };
  }
  if (state.past) {
    return {
      color: "var(--wine)",
      opacity: 0.85,
      transition: "opacity 200ms linear",
    };
  }
  return {
    color: "var(--mauve)",
    opacity: 0.32,
  };
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export interface BrideConnectReelStaticPreviewProps
  extends Omit<
    BrideConnectReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function BrideConnectReelStaticPreview({
  freezeAt = 0.4,
  ...rest
}: BrideConnectReelStaticPreviewProps) {
  const script = buildIntroScript({
    brideName: rest.brideName,
    planningCity: rest.planningCity,
    weddingMonth: rest.weddingMonth,
    weddingYear: rest.weddingYear,
    personalNote: rest.personalNote,
  });
  const timeline = computeConfessionalTimeline(script, {
    wordsPerMinute: rest.wordsPerMinute ?? BRIDE_CONNECT_REEL_DEFAULT_WPM,
  });
  const target = (timeline.ctaStartMs + 1500) * clamp01(freezeAt);
  return <BrideConnectReel {...rest} progressMs={target} />;
}
