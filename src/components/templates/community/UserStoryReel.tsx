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
const LINE_HEIGHT = 124;

const USER_STORY_DEFAULT_WPM = 120;

export interface UserStoryReelProps {
  storyText: string;
  brideName: string;
  brideIdentifier: string;
  wordsPerMinute?: number;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export interface UserStoryReelHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (ms: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

export const UserStoryReel = forwardRef<
  UserStoryReelHandle,
  UserStoryReelProps
>(function UserStoryReel(props, ref) {
  const {
    storyText,
    brideName,
    brideIdentifier,
    wordsPerMinute = USER_STORY_DEFAULT_WPM,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const timeline = useMemo<ConfessionalTimeline>(
    () => computeConfessionalTimeline(storyText, { wordsPerMinute }),
    [storyText, wordsPerMinute],
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
  }, [storyText, wordsPerMinute]);

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
    <UserStoryReelStage
      timeline={timeline}
      currentMs={currentMs}
      brideName={brideName}
      brideIdentifier={brideIdentifier}
    />
  );
});

interface UserStoryReelStageProps {
  timeline: ConfessionalTimeline;
  currentMs: number;
  brideName: string;
  brideIdentifier: string;
}

export function UserStoryReelStage({
  timeline,
  currentMs,
  brideName,
  brideIdentifier,
}: UserStoryReelStageProps) {
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

  const attributionOpacity = clamp01(
    (currentMs - timeline.attributionStartMs) / 600,
  );
  const ctaOpacity = clamp01((currentMs - timeline.ctaStartMs) / 600);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(180deg, var(--blush) 0%, #FBE0EC 40%, var(--cream) 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.45), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          position: "absolute",
          top: 140,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(75,21,40,0.55)",
          }}
        >
          A Bride's Story
        </div>
      </header>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
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
            gap: 0,
          }}
        >
          {timeline.lines.map((line, li) => (
            <StoryLine key={li} line={line} currentMs={currentMs} />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 96,
          right: 96,
          textAlign: "center",
          opacity: attributionOpacity,
          transition: "opacity 200ms linear",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 48,
            color: "var(--wine)",
            transform: "rotate(-1deg)",
            marginBottom: 8,
          }}
        >
          — {brideName}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--mauve)",
            marginBottom: 18,
          }}
        >
          {brideIdentifier}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          shared on The Marigold
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

interface StoryLineProps {
  line: TimedWord[];
  currentMs: number;
}

function StoryLine({ line, currentMs }: StoryLineProps) {
  return (
    <div
      style={{
        height: LINE_HEIGHT,
        display: "flex",
        flexWrap: "nowrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 22,
        fontFamily: "'Caveat', cursive",
        fontWeight: 500,
        fontSize: 92,
        lineHeight: 1.05,
        padding: "0 96px",
        textAlign: "center",
      }}
    >
      {line.map((word) => (
        <StoryWord key={word.index} word={word} currentMs={currentMs} />
      ))}
    </div>
  );
}

interface StoryWordProps {
  word: TimedWord;
  currentMs: number;
}

function StoryWord({ word, currentMs }: StoryWordProps) {
  const state = wordVisualStateAt(word, currentMs);
  const baseStyle = storyWordStyle(state);

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
          bottom: 12,
          height: 12,
          background: "var(--gold)",
          opacity: state.active ? 0.6 : state.past ? 0.4 : 0,
          width: state.active
            ? `calc(${state.progress * 100}% + 12px)`
            : state.past
              ? "calc(100% + 12px)"
              : "0%",
          borderRadius: 6,
          transition: "opacity 160ms linear, width 80ms linear",
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

function storyWordStyle(state: WordVisualState): CSSProperties {
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

export interface UserStoryReelStaticPreviewProps
  extends Omit<
    UserStoryReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  freezeAt?: number;
}

export function UserStoryReelStaticPreview({
  freezeAt = 0.4,
  ...rest
}: UserStoryReelStaticPreviewProps) {
  const timeline = computeConfessionalTimeline(rest.storyText, {
    wordsPerMinute: rest.wordsPerMinute ?? USER_STORY_DEFAULT_WPM,
  });
  const target = timeline.totalMs * clamp01(freezeAt);
  return <UserStoryReel {...rest} progressMs={target} />;
}

export { USER_STORY_DEFAULT_WPM };
