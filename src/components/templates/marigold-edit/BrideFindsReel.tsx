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
  EDIT_CATEGORY_LABELS,
  type EditCategory,
} from "./ProductPickPost";

const SLIDE_DURATION_MS = 3000;
const FINAL_DURATION_MS = 2400;
const TRANSITION_MS = 280;

export interface BrideFind {
  productName: string;
  category: EditCategory;
  price?: string;
  imageUrl?: string;
}

export interface BrideFindsReelProps {
  finds: BrideFind[];
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export interface BrideFindsReelHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (ms: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

export const BrideFindsReel = forwardRef<
  BrideFindsReelHandle,
  BrideFindsReelProps
>(function BrideFindsReel(props, ref) {
  const {
    finds,
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const totalMs = useMemo(
    () => finds.length * SLIDE_DURATION_MS + FINAL_DURATION_MS,
    [finds.length],
  );

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
      if (next >= totalMs) {
        if (loop) {
          completedRef.current = false;
          next = 0;
        } else {
          next = totalMs;
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
        onTickRef.current?.(next, totalMs);
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [isPlaying, progressMs, totalMs, loop]);

  useEffect(() => {
    completedRef.current = false;
  }, [finds]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        if (internalMsRef.current >= totalMs) {
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
        const clamped = Math.max(0, Math.min(totalMs, ms));
        internalMsRef.current = clamped;
        setInternalMs(clamped);
      },
      getDuration: () => totalMs,
      getCurrentTime: () => internalMsRef.current,
    }),
    [totalMs],
  );

  return <BrideFindsStage currentMs={currentMs} finds={finds} />;
});

interface BrideFindsStageProps {
  currentMs: number;
  finds: BrideFind[];
}

export function BrideFindsStage({ currentMs, finds }: BrideFindsStageProps) {
  const findsTotalMs = finds.length * SLIDE_DURATION_MS;
  const inFinal = currentMs >= findsTotalMs;

  const activeIdx = inFinal
    ? finds.length
    : Math.min(finds.length - 1, Math.floor(currentMs / SLIDE_DURATION_MS));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#000000",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {finds.map((find, i) => {
        const slideStart = i * SLIDE_DURATION_MS;
        const slideEnd = slideStart + SLIDE_DURATION_MS;
        const isActive = !inFinal && i === activeIdx;

        const localMs = isActive ? currentMs - slideStart : 0;

        const swipeOut = clamp01(
          (currentMs - (slideEnd - TRANSITION_MS)) / TRANSITION_MS,
        );
        const swipeIn = clamp01(
          (currentMs - slideStart) / TRANSITION_MS,
        );

        let translateX = 0;
        let opacity = 0;
        if (isActive) {
          opacity = 1;
          translateX = (1 - swipeIn) * 80 - swipeOut * 80;
        }

        if (!isActive) return null;

        return (
          <FindSlide
            key={i}
            find={find}
            localMs={localMs}
            translateX={translateX}
            opacity={opacity}
          />
        );
      })}

      {inFinal && <FinalSlide currentMs={currentMs - findsTotalMs} />}
    </div>
  );
}

interface FindSlideProps {
  find: BrideFind;
  localMs: number;
  translateX: number;
  opacity: number;
}

function FindSlide({ find, localMs, translateX, opacity }: FindSlideProps) {
  const imageOpacity = clamp01(localMs / 400);
  const nameProgress = clamp01((localMs - 400) / 500);
  const priceOpacity = clamp01((localMs - 1000) / 350);
  const categoryOpacity = clamp01((localMs - 1400) / 350);

  const categoryLabel =
    EDIT_CATEGORY_LABELS[find.category] ?? find.category.toUpperCase();

  const slideStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    transform: `translateX(${translateX}px)`,
    opacity,
    transition: "transform 60ms linear, opacity 80ms linear",
  };

  return (
    <div style={slideStyle}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: imageOpacity,
          transition: "opacity 200ms linear",
        }}
      >
        {find.imageUrl ? (
          <img
            src={find.imageUrl}
            alt={find.productName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(160deg, var(--blush) 0%, var(--peach) 50%, var(--gold-light) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Caveat', cursive",
              fontSize: 56,
              color: "rgba(75,21,40,0.4)",
            }}
          >
            product photo
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--gold)",
          }}
        >
          THE MARIGOLD EDIT
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 480,
          textAlign: "center",
          zIndex: 3,
          transform: `translateY(${(1 - nameProgress) * 60}px)`,
          opacity: nameProgress,
          transition: "transform 200ms linear, opacity 200ms linear",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 96,
            lineHeight: 1.0,
            color: "var(--cream)",
            textShadow: "0 4px 24px rgba(0,0,0,0.55)",
          }}
        >
          {find.productName}
        </div>
      </div>

      {find.price && (
        <div
          style={{
            position: "absolute",
            top: 220,
            right: 90,
            background: "var(--hot-pink)",
            color: "white",
            padding: "16px 28px",
            transform: `rotate(8deg) scale(${0.6 + 0.4 * priceOpacity})`,
            opacity: priceOpacity,
            transition: "opacity 200ms linear, transform 200ms linear",
            boxShadow: "0 10px 24px rgba(75,21,40,0.3)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1,
            zIndex: 4,
          }}
        >
          {find.price}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 360,
          textAlign: "center",
          zIndex: 3,
          opacity: categoryOpacity,
          transform: `translateX(${(1 - categoryOpacity) * -40}px)`,
          transition: "opacity 200ms linear, transform 200ms linear",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "var(--cream)",
            color: "var(--deep-pink)",
            padding: "12px 24px",
            borderRadius: 999,
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 5,
            textTransform: "uppercase",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
          }}
        >
          {categoryLabel}
        </div>
      </div>
    </div>
  );
}

function FinalSlide({ currentMs }: { currentMs: number }) {
  const lineOneOpacity = clamp01(currentMs / 500);
  const lineTwoOpacity = clamp01((currentMs - 500) / 500);
  const ctaBarOpacity = clamp01((currentMs - 900) / 500);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--wine)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 80px 200px",
      }}
    >
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 56,
          color: "var(--gold)",
          marginBottom: 24,
          opacity: lineOneOpacity,
          transform: `translateY(${(1 - lineOneOpacity) * 24}px)`,
          transition: "opacity 200ms linear, transform 200ms linear",
        }}
      >
        all links on
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 124,
          color: "var(--cream)",
          lineHeight: 1.0,
          opacity: lineTwoOpacity,
          transform: `translateY(${(1 - lineTwoOpacity) * 30}px)`,
          transition: "opacity 200ms linear, transform 200ms linear",
        }}
      >
        The <i style={{ fontStyle: "italic", color: "var(--gold)" }}>Marigold</i>
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: "'Syne', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "rgba(255,248,242,0.55)",
          opacity: lineTwoOpacity,
        }}
      >
        @themarigold · weekly picks
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          opacity: ctaBarOpacity,
          transition: "opacity 200ms linear",
        }}
      >
        <CTABar variant="light" handleText="THE MARIGOLD EDIT" />
      </div>
    </div>
  );
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export interface BrideFindsReelStaticPreviewProps
  extends Omit<
    BrideFindsReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  /** Where in the timeline to freeze. 0–1, default 0.4. */
  freezeAt?: number;
}

export function BrideFindsReelStaticPreview({
  freezeAt = 0.4,
  ...rest
}: BrideFindsReelStaticPreviewProps) {
  const totalMs =
    rest.finds.length * SLIDE_DURATION_MS + FINAL_DURATION_MS;
  const target = totalMs * clamp01(freezeAt);
  return <BrideFindsReel {...rest} progressMs={target} />;
}

export {
  SLIDE_DURATION_MS as BRIDE_FINDS_SLIDE_MS,
  FINAL_DURATION_MS as BRIDE_FINDS_FINAL_MS,
};
