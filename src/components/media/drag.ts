"use client";

/**
 * Drag-and-drop helpers shared between the Media Library, the editor's
 * media browser drawer, and the template drop zones.
 *
 * The dataTransfer payload is JSON-encoded under the
 * `application/x-marigold-media` MIME so we can recover full media metadata
 * on the drop side without an extra IndexedDB lookup. We also set a plain
 * `text/plain` fallback so dragging media into a regular text input pastes
 * the file name (handy when a browser intercepts the drop).
 */

import type { DragEvent } from "react";
import {
  MEDIA_DRAG_MIME,
  type MediaDragPayload,
  type MediaItem,
} from "@/lib/db/media-types";

export function setMediaDrag(
  e: DragEvent<Element>,
  item: MediaItem,
): void {
  const payload: MediaDragPayload = {
    id: item.id,
    type: item.type,
    fileName: item.fileName,
    mimeType: item.mimeType,
    textContent: item.type === "text" ? item.textContent : undefined,
  };
  try {
    e.dataTransfer.setData(MEDIA_DRAG_MIME, JSON.stringify(payload));
    e.dataTransfer.setData(
      "text/plain",
      item.type === "text" && item.textContent
        ? item.textContent
        : item.fileName,
    );
    e.dataTransfer.effectAllowed = "copyMove";
  } catch {
    /* ignore */
  }
}

export function readMediaDrag(
  e: DragEvent<Element>,
): MediaDragPayload | null {
  try {
    const raw = e.dataTransfer.getData(MEDIA_DRAG_MIME);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MediaDragPayload;
    if (!parsed || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasMediaDrag(e: DragEvent<Element>): boolean {
  return Array.from(e.dataTransfer.types).includes(MEDIA_DRAG_MIME);
}
