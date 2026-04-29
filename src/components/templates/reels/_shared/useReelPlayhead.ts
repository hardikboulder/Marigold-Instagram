"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";

/**
 * Shared playback contract for every reel template. Every reel exposes the
 * same imperative handle so the editor / preview panel / Remotion pipeline
 * can drive any of them through a single interface.
 */
export interface ReelHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
  /** Jump to a specific time in the reel timeline. */
  seek: (ms: number) => void;
  /** Total duration of the reel including the outro. */
  getDuration: () => number;
  /** Synchronously read the current playhead. */
  getCurrentTime: () => number;
}

export interface UseReelPlayheadOptions {
  /** Total duration of the reel in ms (including the outro / CTA fade). */
  totalMs: number;
  /** When provided, externally pin the playhead — internal RAF is disabled. */
  progressMs?: number;
  /** Externally toggle playback (when `progressMs` is omitted). */
  playing?: boolean;
  /** Start the internal playhead immediately on mount. */
  autoPlay?: boolean;
  /** Loop forever once `totalMs` is reached. */
  loop?: boolean;
  /** Fired every RAF tick with the current playhead. */
  onTick?: (ms: number, totalMs: number) => void;
  /** Fired once when the playhead reaches `totalMs`. */
  onComplete?: () => void;
}

/**
 * Drives the playhead for a reel template with the same RAF / external-scrub /
 * imperative-handle contract used by `ConfessionalReel` and `UserStoryReel`.
 */
export function useReelPlayhead(
  opts: UseReelPlayheadOptions,
  handleRef?: Ref<ReelHandle>,
): { currentMs: number } {
  const {
    totalMs,
    progressMs,
    playing,
    autoPlay = false,
    loop = false,
    onTick,
    onComplete,
  } = opts;

  const [internalMs, setInternalMs] = useState(0);
  const internalMsRef = useRef(0);
  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Mirror callbacks into refs so the RAF effect can read the latest closure
  // without re-mounting on every render.
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
  }, [totalMs]);

  useImperativeHandle(
    handleRef ?? null,
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

  return { currentMs };
}
