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

const FRAME1_END = 2000;
const FRAME2_END = 5000;
const FRAME3_END = 8000;
const FRAME4_END = 10000;

export interface DreamVenueReelProps {
  venueName: string;
  venueLocation: string;
  venueStyle: string;
  capacity: number;
  imageUrl?: string;
  hookText?: string;
  progressMs?: number;
  playing?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  onTick?: (ms: number, totalMs: number) => void;
  onComplete?: () => void;
}

export interface DreamVenueReelHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (ms: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

export const DreamVenueReel = forwardRef<
  DreamVenueReelHandle,
  DreamVenueReelProps
>(function DreamVenueReel(props, ref) {
  const {
    venueName,
    venueLocation,
    venueStyle,
    capacity,
    imageUrl,
    hookText = "imagine this.",
    progressMs,
    playing,
    loop = false,
    autoPlay = false,
    onTick,
    onComplete,
  } = props;

  const totalMs = FRAME4_END;

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
  }, [venueName, venueLocation, venueStyle, capacity, imageUrl]);

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

  return (
    <DreamVenueStage
      currentMs={currentMs}
      venueName={venueName}
      venueLocation={venueLocation}
      venueStyle={venueStyle}
      capacity={capacity}
      imageUrl={imageUrl}
      hookText={hookText}
    />
  );
});

interface DreamVenueStageProps {
  currentMs: number;
  venueName: string;
  venueLocation: string;
  venueStyle: string;
  capacity: number;
  imageUrl?: string;
  hookText: string;
}

export function DreamVenueStage({
  currentMs,
  venueName,
  venueLocation,
  venueStyle,
  capacity,
  imageUrl,
  hookText,
}: DreamVenueStageProps) {
  const hookOpacity = clamp01((currentMs - 200) / 600) *
    (1 - clamp01((currentMs - (FRAME1_END - 400)) / 400));

  const imageOpacity = clamp01((currentMs - FRAME1_END) / 600);

  const venueNameProgress = clamp01(
    (currentMs - (FRAME1_END + 400)) / 1400,
  );
  const venueNameChars = Math.floor(venueName.length * venueNameProgress);
  const venueNameTyped = venueName.slice(0, venueNameChars);
  const venueNameOpacity = clamp01((currentMs - (FRAME1_END + 400)) / 200);

  const stat1Opacity = clamp01((currentMs - (FRAME2_END + 200)) / 400);
  const stat2Opacity = clamp01((currentMs - (FRAME2_END + 800)) / 400);
  const stat3Opacity = clamp01((currentMs - (FRAME2_END + 1400)) / 400);

  const ctaOpacity = clamp01((currentMs - (FRAME3_END + 200)) / 500);
  const logoOpacity = clamp01((currentMs - (FRAME3_END + 600)) / 500);

  const blackoutOpacity = clamp01(1 - (currentMs - 100) / 800);

  const showImage = currentMs >= FRAME1_END - 200;

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
      {showImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: imageOpacity,
            transition: "opacity 200ms linear",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={venueName}
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
                  "linear-gradient(160deg, var(--wine) 0%, var(--deep-pink) 60%, var(--gold) 100%)",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000000",
          opacity: blackoutOpacity > 0 ? blackoutOpacity : 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: hookOpacity,
          transition: "opacity 200ms linear",
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 110,
            color: "var(--gold)",
            transform: "rotate(-2deg)",
          }}
        >
          {hookText}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 360,
          textAlign: "center",
          opacity: venueNameOpacity,
          transition: "opacity 200ms linear",
          zIndex: 2,
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
            marginBottom: 24,
          }}
        >
          A VENUE TO IMAGINE
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 110,
            lineHeight: 1.0,
            color: "var(--cream)",
            textShadow: "0 4px 30px rgba(0,0,0,0.5)",
          }}
        >
          {venueNameTyped}
          {venueNameChars < venueName.length && (
            <span
              style={{
                display: "inline-block",
                width: "0.05em",
                height: "0.9em",
                background: "var(--gold)",
                marginLeft: 4,
                verticalAlign: "baseline",
              }}
            />
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 540,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <StatRow
          label="LOCATION"
          value={venueLocation}
          opacity={stat1Opacity}
        />
        <StatRow
          label="STYLE"
          value={venueStyle}
          opacity={stat2Opacity}
        />
        <StatRow
          label="CAPACITY"
          value={`Up to ${capacity} guests`}
          opacity={stat3Opacity}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 320,
          textAlign: "center",
          opacity: ctaOpacity,
          transition: "opacity 200ms linear",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 56,
            color: "var(--gold)",
            transform: "rotate(-1.5deg)",
            lineHeight: 1.1,
          }}
        >
          Book your tour on
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 96,
            color: "var(--cream)",
            lineHeight: 1,
            marginTop: 8,
          }}
        >
          The <i style={{ fontStyle: "italic" }}>Marigold</i>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          opacity: logoOpacity,
          transition: "opacity 200ms linear",
        }}
      >
        <CTABar variant="default" handleText="VENUE SPOTLIGHT" />
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  opacity,
}: {
  label: string;
  value: string;
  opacity: number;
}) {
  const slideStyle: CSSProperties = {
    opacity,
    transform: `translateY(${(1 - opacity) * 16}px)`,
    transition: "opacity 200ms linear, transform 200ms linear",
  };

  return (
    <div style={slideStyle}>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--gold)",
          opacity: 0.7,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 30,
          fontWeight: 500,
          color: "var(--cream)",
          textShadow: "0 2px 14px rgba(0,0,0,0.6)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export interface DreamVenueReelStaticPreviewProps
  extends Omit<
    DreamVenueReelProps,
    "progressMs" | "playing" | "autoPlay" | "loop"
  > {
  /** Where in the timeline to freeze. 0–1, default 0.6. */
  freezeAt?: number;
}

export function DreamVenueReelStaticPreview({
  freezeAt = 0.6,
  ...rest
}: DreamVenueReelStaticPreviewProps) {
  const target = FRAME4_END * clamp01(freezeAt);
  return <DreamVenueReel {...rest} progressMs={target} />;
}

export {
  FRAME1_END as DREAM_VENUE_FRAME1_END,
  FRAME2_END as DREAM_VENUE_FRAME2_END,
  FRAME3_END as DREAM_VENUE_FRAME3_END,
  FRAME4_END as DREAM_VENUE_TOTAL_MS,
};
