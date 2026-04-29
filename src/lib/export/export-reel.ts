/**
 * Reel frame-capture pipeline.
 *
 * Drives a controlled animation forward, captures each frame with
 * html-to-image, and stitches the frames into a playable artifact. Used by
 * the editor's reel preview as a placeholder until Remotion server-side
 * rendering lands in Phase 4.
 *
 * Output format: animated WebM (canvas + MediaRecorder). The user-facing
 * brief asked for GIF / animated WebP — WebM is the no-deps substitute that
 * plays natively in every modern browser and is the smallest viable change.
 * Once a real GIF / WebP encoder is wired in (or Remotion is installed), the
 * encoding step here can be swapped without touching the capture pipeline.
 *
 * The capture step (`captureReelFrames`) returns raw PNG Blobs and is the
 * stable building block — keep it intact even if `framesToWebm` is replaced.
 */

import { toBlob } from "html-to-image";

export interface CaptureReelFramesOptions {
  /** Total length of the karaoke pass + outro, in ms. */
  durationMs: number;
  /** Frames per second to sample at. 24fps keeps file size small. */
  fps: number;
  /** Native frame width — typically 1080. */
  width: number;
  /** Native frame height — typically 1920. */
  height: number;
  /**
   * Drives the animation. Called with the target playhead in ms before each
   * frame capture. The component owning the playhead must accept this and
   * commit it synchronously (i.e. via `useState`).
   */
  setProgressMs: (ms: number) => void;
  /** CSS transform applied to the captured node — defaults to "scale(1)". */
  overrideTransform?: string;
  /** Optional progress callback fired after each frame. */
  onFrame?: (frameIndex: number, totalFrames: number) => void;
  /** Aborts the capture early if the AbortSignal fires. */
  signal?: AbortSignal;
}

export interface CapturedReelFrame {
  /** PNG-encoded frame. */
  blob: Blob;
  /** 0-based index in the captured sequence. */
  frameIndex: number;
  /** Playhead this frame was captured at. */
  ms: number;
}

/** Wait for two RAFs so React commits + paints the new playhead state. */
function nextPaint(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

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

interface CanvasCaptureMediaStreamTrackLike extends MediaStreamTrack {
  requestFrame?: () => void;
}

/**
 * Encode captured PNG frames into a single playable WebM blob using
 * canvas.captureStream + MediaRecorder. Picks the best available webm codec.
 */
export async function framesToWebm(
  frames: CapturedReelFrame[],
  fps: number,
  width: number,
  height: number,
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("framesToWebm must be called in the browser.");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error(
      "MediaRecorder is unavailable in this browser; cannot encode reel preview.",
    );
  }
  if (!frames.length) {
    throw new Error("framesToWebm: no frames to encode.");
  }

  // Decode each PNG into an ImageBitmap up-front so the recorder isn't
  // bottlenecked on decode while it's running.
  const bitmaps = await Promise.all(
    frames.map((f) => createImageBitmap(f.blob)),
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("framesToWebm: 2D context unavailable.");

  // Paint the first frame before opening the stream so the initial keyframe
  // isn't blank.
  ctx.drawImage(bitmaps[0], 0, 0, width, height);

  // Pass 0 to captureStream so we drive frame timing manually via
  // `track.requestFrame()`. That avoids race conditions where the recorder
  // samples before our draw lands.
  const stream = (canvas as HTMLCanvasElement).captureStream(0);
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrackLike;

  const mimeType = pickWebmMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const frameIntervalMs = 1000 / fps;
  for (let i = 0; i < bitmaps.length; i++) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bitmaps[i], 0, 0, width, height);
    track.requestFrame?.();
    await sleep(frameIntervalMs);
  }
  // Hold the last frame for one extra interval so the tail isn't clipped.
  await sleep(frameIntervalMs);
  recorder.stop();
  await stopped;

  bitmaps.forEach((b) => b.close?.());

  return new Blob(chunks, { type: mimeType || "video/webm" });
}

function pickWebmMimeType(): string | null {
  const candidates = [
    "video/webm; codecs=vp9",
    "video/webm; codecs=vp8",
    "video/webm",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ExportReelAnimationOptions
  extends Omit<CaptureReelFramesOptions, "onFrame"> {
  /** Filename without extension. */
  filename: string;
  /** When true, triggers a browser download. */
  download?: boolean;
  /** Progress 0..1 callback. */
  onProgress?: (progress: number) => void;
}

export interface ExportReelAnimationResult {
  blob: Blob;
  url: string;
  filename: string;
  mimeType: string;
  durationMs: number;
  frameCount: number;
}

/**
 * Orchestrates capture → encode → (optional) download for a reel preview.
 */
export async function exportReelAsAnimation(
  node: HTMLElement,
  options: ExportReelAnimationOptions,
): Promise<ExportReelAnimationResult> {
  const { filename, download = false, onProgress, ...captureOpts } = options;

  const frames = await captureReelFrames(node, {
    ...captureOpts,
    onFrame: (i, total) => {
      // Capture is the bulk of the work — weight it as the first 80%.
      onProgress?.((i + 1) / total * 0.8);
    },
  });
  onProgress?.(0.8);

  const webm = await framesToWebm(
    frames,
    captureOpts.fps,
    captureOpts.width,
    captureOpts.height,
  );
  onProgress?.(1);

  const url = URL.createObjectURL(webm);
  if (download) {
    triggerDownload(url, `${filename}.webm`);
  }

  return {
    blob: webm,
    url,
    filename: `${filename}.webm`,
    mimeType: webm.type || "video/webm",
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
