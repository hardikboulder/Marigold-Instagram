import { toBlob, toPng } from "html-to-image";

export interface ExportImageOptions {
  /** Filename for the downloaded PNG (without extension). */
  filename?: string;
  /** When true, triggers a browser download of the resulting blob. */
  download?: boolean;
  /**
   * Force-clamp the captured size to these dimensions. Recommended: 1080×1920
   * for stories and 1080×1080 for posts so the output matches Instagram's
   * native resolution exactly.
   */
  width?: number;
  height?: number;
  /**
   * CSS background applied during capture. Defaults to undefined.
   */
  backgroundColor?: string;
  /**
   * Device pixel ratio for the capture. Stays at 1 so a 1080-wide node maps
   * to a 1080-pixel PNG. Bump for super-retina exports if needed.
   */
  pixelRatio?: number;
  /**
   * Deprecated. The exporter now mounts a fresh, untransformed clone at
   * native size, so no transform override is needed. Kept for compat.
   */
  overrideTransform?: string;
}

/**
 * Capture a DOM node as a PNG Blob at native resolution.
 *
 * Implementation note: capturing a node that is currently `transform: scale(...)`-ed
 * (as the editor's TemplateFrame inner div is) makes html-to-image hit a cluster
 * of edge cases — computed-style copying preserves the matrix even when we
 * override `transform`, and Chrome's SVG-foreignObject rasterizer occasionally
 * yields a transparent canvas. We side-step all of that by deep-cloning the
 * source node into a fresh, untransformed wrapper appended to <body>, capturing
 * that, and removing it. The clone inherits the same global stylesheet so
 * fonts and CSS variables resolve identically.
 */
export async function exportImage(
  node: HTMLElement,
  options: ExportImageOptions = {},
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const {
    filename,
    download = false,
    width,
    height,
    backgroundColor,
    pixelRatio = 1,
  } = options;

  const { wrapper, clone } = mountUntransformedClone(node, width, height);
  // Yield two frames so layout & paint settle before html-to-image walks the
  // computed styles. Without this the captured image is sometimes blank on the
  // first export of a freshly mounted route.
  await waitTwoFrames();

  try {
    const blob = await toBlob(clone, {
      pixelRatio,
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor,
    });

    if (!blob) {
      throw new Error("exportImage: html-to-image returned a null blob.");
    }

    if (download) {
      triggerDownload(blob, `${filename ?? "marigold-export"}.png`);
    }

    return blob;
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}

/**
 * Capture a DOM node as a small base64 PNG data URL — used by the Asset
 * Library to persist thumbnails across sessions (blob URLs would expire).
 */
export async function exportThumbnailDataUrl(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<string> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  // The thumbnail path uses the same fresh-clone strategy as exportImage so
  // the captured pixels match what users see in the asset library tile.
  const sourceWidth = node.offsetWidth || width;
  const sourceHeight = node.offsetHeight || height;
  const { wrapper, clone } = mountUntransformedClone(
    node,
    sourceWidth,
    sourceHeight,
  );
  await waitTwoFrames();

  try {
    return await toPng(clone, {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      style: {
        transform: `scale(${width / sourceWidth})`,
        transformOrigin: "top left",
      },
    });
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}

interface MountedClone {
  wrapper: HTMLDivElement;
  clone: HTMLElement;
}

/**
 * Deep-clone `source` into a fresh wrapper appended to <body>, sized exactly
 * `width`×`height` and stripped of any preview transform / absolute-positioning
 * that the original may have carried.
 */
function mountUntransformedClone(
  source: HTMLElement,
  width: number | undefined,
  height: number | undefined,
): MountedClone {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  // Position offscreen but in normal flow so the browser actually paints it.
  // Negative `left` is more reliably rasterized than `display: none` (which
  // skips paint) or `visibility: hidden` (which the SVG inherits).
  wrapper.style.cssText = [
    "position: fixed",
    "top: 0",
    `left: -${(width ?? 1080) + 200}px`,
    `width: ${width ?? source.offsetWidth ?? 1080}px`,
    `height: ${height ?? source.offsetHeight ?? 1920}px`,
    "pointer-events: none",
    "z-index: -9999",
    "background: transparent",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;
  // Strip preview-time scale/positioning so the clone fills the wrapper at 1:1.
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.position = "relative";
  clone.style.top = "0";
  clone.style.left = "0";
  if (width != null) clone.style.width = `${width}px`;
  if (height != null) clone.style.height = `${height}px`;

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  return { wrapper, clone };
}

function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve()),
    ),
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
