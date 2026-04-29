/**
 * frame-exporter.ts — capture an animated reel into a downloadable GIF.
 *
 * Two-stage pipeline:
 *   1. captureReelFrames — drives the playhead one frame at a time and uses
 *      html-to-image to snapshot the DOM at each step.
 *   2. framesToGif — feeds each PNG into a `gif.js.optimized` encoder and
 *      produces a single animated-GIF Blob.
 *
 * This lives alongside the existing `lib/export/export-reel.ts` (WebM via
 * MediaRecorder) — same capture step, swapped encoder. Either pipeline can
 * be used until Remotion server-side MP4 rendering lands in Phase 4.
 */

import { toBlob } from "html-to-image";

export interface CaptureReelFramesOptions {
  /** Total length of the reel, in ms. */
  durationMs: number;
  /** Frames per second to sample at. */
  fps: number;
  /** Native frame width — typically 1080. */
  width: number;
  /** Native frame height — typically 1920. */
  height: number;
  /**
   * Synchronously commit a new playhead value to the rendered subtree. The
   * exporter waits two paint cycles after each call so React has time to
   * commit and the browser has time to repaint.
   */
  setProgressMs: (ms: number) => void;
  /** Optional CSS transform applied to the captured node. */
  overrideTransform?: string;
  /** Per-frame progress callback (frameIndex, totalFrames). */
  onFrame?: (frameIndex: number, totalFrames: number) => void;
  /** Aborts capture early if the AbortSignal fires. */
  signal?: AbortSignal;
}

export interface CapturedReelFrame {
  blob: Blob;
  frameIndex: number;
  ms: number;
}

function nextPaint(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Sample a reel frame-by-frame. Returns a list of PNG Blobs aligned to the
 * requested fps. The caller is responsible for stitching them.
 */
export async function captureReelFrames(
  node: HTMLElement,
  options: CaptureReelFramesOptions,
): Promise<CapturedReelFrame[]> {
  const {
    durationMs,
    fps,
    width,
    height,
    setProgressMs,
    overrideTransform = "scale(1)",
    onFrame,
    signal,
  } = options;

  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const totalFrames = Math.max(1, Math.ceil((durationMs / 1000) * fps));
  const frames: CapturedReelFrame[] = [];

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) {
      throw new DOMException("Capture aborted.", "AbortError");
    }
    const ms = (i / fps) * 1000;
    setProgressMs(ms);
    await nextPaint();

    const blob = await toBlob(node, {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      style: { transform: overrideTransform, transformOrigin: "top left" },
    });
    if (!blob) {
      throw new Error(
        `captureReelFrames: html-to-image returned a null blob at frame ${i}.`,
      );
    }
    frames.push({ blob, frameIndex: i, ms });
    onFrame?.(i, totalFrames);
  }

  return frames;
}

type GifJsModule = typeof import("gif.js.optimized");
type GifJsConstructor = GifJsModule["default"];

let gifModulePromise: Promise<GifJsConstructor> | null = null;

async function loadGifEncoder(): Promise<GifJsConstructor> {
  if (typeof window === "undefined") {
    throw new Error("framesToGif must be called in the browser.");
  }
  if (!gifModulePromise) {
    gifModulePromise = import("gif.js.optimized").then((mod) => mod.default);
  }
  return gifModulePromise;
}

/**
 * Resolve the URL for the gif.js worker. The package ships the worker at
 * `gif.js.optimized/dist/gif.worker.js`; we mirror it into `/public` at
 * install time so the browser can fetch it from a same-origin path. The
 * fetched script is wrapped into a Blob URL so the encoder can spawn it
 * without a cross-origin worker policy.
 */
let gifWorkerUrl: string | null = null;
async function resolveGifWorkerUrl(): Promise<string> {
  if (gifWorkerUrl) return gifWorkerUrl;
  const res = await fetch("/gif.worker.js");
  if (!res.ok) {
    throw new Error(
      `Could not load /gif.worker.js (${res.status}). Copy node_modules/gif.js.optimized/dist/gif.worker.js to /public.`,
    );
  }
  const text = await res.text();
  gifWorkerUrl = URL.createObjectURL(
    new Blob([text], { type: "application/javascript" }),
  );
  return gifWorkerUrl;
}

export interface FramesToGifOptions {
  fps: number;
  width: number;
  height: number;
  /** GIF quality, lower is better. Default 10. */
  quality?: number;
  /** Number of encoder workers. Default 2. */
  workers?: number;
  /** Repeat: 0 = forever (default), -1 = no repeat, n = play n+1 times. */
  repeat?: number;
  /** Progress 0..1 emitted while the encoder is running. */
  onProgress?: (progress: number) => void;
}

/**
 * Encode captured PNG frames into a single animated GIF. Decodes each PNG to
 * an `ImageBitmap` first so the encoder is fed raw pixels (which lets gif.js
 * skip its own decode pass and parallelise across workers).
 */
export async function framesToGif(
  frames: CapturedReelFrame[],
  options: FramesToGifOptions,
): Promise<Blob> {
  if (!frames.length) throw new Error("framesToGif: no frames to encode.");
  if (typeof window === "undefined") {
    throw new Error("framesToGif must be called in the browser.");
  }

  const { fps, width, height, quality = 10, workers = 2, repeat = 0, onProgress } =
    options;

  const GifEncoder = await loadGifEncoder();
  const workerScript = await resolveGifWorkerUrl();

  const gif = new GifEncoder({
    workers,
    quality,
    width,
    height,
    workerScript,
    repeat,
  });

  // Stage canvas — every frame is drawn here, then handed to the encoder.
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("framesToGif: 2D context unavailable.");

  const frameDelay = Math.max(1, Math.round(1000 / fps));

  for (const frame of frames) {
    const bitmap = await createImageBitmap(frame.blob);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    gif.addFrame(ctx, { delay: frameDelay, copy: true });
    bitmap.close?.();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    gif.on("finished", (b) => resolve(b));
    gif.on("abort", () => reject(new Error("GIF encoding aborted.")));
    gif.on("progress", (p) => onProgress?.(p));
    gif.render();
  });

  return blob;
}

export interface ExportReelGifOptions
  extends Omit<CaptureReelFramesOptions, "onFrame"> {
  /** Filename without extension. */
  filename: string;
  /** Trigger a browser download once encoding completes. */
  download?: boolean;
  /** GIF quality (lower = better). Default 10. */
  quality?: number;
  /** Repeat — 0 forever (default), -1 once. */
  repeat?: number;
  /** Combined 0..1 progress (capture + encode). */
  onProgress?: (progress: number) => void;
}

export interface ExportReelGifResult {
  blob: Blob;
  url: string;
  filename: string;
  mimeType: string;
  durationMs: number;
  frameCount: number;
}

/**
 * Capture a reel from a DOM node and encode the frames into a downloadable
 * animated GIF. Capture is weighted as the first 70% of progress, encoding
 * the last 30% — those tend to be the rough split for a 1080×1920 reel.
 */
export async function exportReelAsGif(
  node: HTMLElement,
  options: ExportReelGifOptions,
): Promise<ExportReelGifResult> {
  const {
    filename,
    download = false,
    quality,
    repeat,
    onProgress,
    ...captureOpts
  } = options;

  const frames = await captureReelFrames(node, {
    ...captureOpts,
    onFrame: (i, total) => {
      onProgress?.(((i + 1) / total) * 0.7);
    },
  });

  const gifBlob = await framesToGif(frames, {
    fps: captureOpts.fps,
    width: captureOpts.width,
    height: captureOpts.height,
    quality,
    repeat,
    onProgress: (p) => onProgress?.(0.7 + p * 0.3),
  });

  const url = URL.createObjectURL(gifBlob);
  if (download) triggerDownload(url, `${filename}.gif`);

  return {
    blob: gifBlob,
    url,
    filename: `${filename}.gif`,
    mimeType: gifBlob.type || "image/gif",
    durationMs: options.durationMs,
    frameCount: frames.length,
  };
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Wrapper that matches the brief's signature exactly. Prefer
 * `exportReelAsGif` for new code — this one is kept as an explicit
 * "captureReelFrames returns Blob[]" entry point for tests / scripts.
 */
export async function captureReelFramesAsBlobs(
  containerRef: HTMLElement | { current: HTMLElement | null },
  durationMs: number,
  fps: number,
  setProgressMs: (ms: number) => void,
  width = 1080,
  height = 1920,
): Promise<Blob[]> {
  const node =
    "current" in containerRef ? containerRef.current : containerRef;
  if (!node) throw new Error("captureReelFramesAsBlobs: container ref is null.");
  const frames = await captureReelFrames(node, {
    durationMs,
    fps,
    width,
    height,
    setProgressMs,
  });
  return frames.map((f) => f.blob);
}
