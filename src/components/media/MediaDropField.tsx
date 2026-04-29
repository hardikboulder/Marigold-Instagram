"use client";

/**
 * Wraps an input field so that media items dragged from the Media Library
 * (or the editor's Media Browser drawer) can be dropped onto it.
 *
 * Behavior:
 *   • image / video media → calls onMediaDropped with `media:<id>`
 *   • text media          → calls onMediaDropped with the text content
 *
 * The visual is a thin rounded wrapper that shows a pink dashed border and
 * "Drop here" hint while a compatible media item is being dragged over it.
 */

import { useState, type ReactNode, type DragEvent, type CSSProperties } from "react";
import { hasMediaDrag, readMediaDrag } from "./drag";
import { makeMediaRef, type MediaItemType } from "@/lib/db/media-types";

interface Props {
  /** Field types this drop target accepts. Default: image & video. */
  accept?: MediaItemType[];
  /**
   * Called when a media item is dropped. The value is either a media: ref
   * (for image/video) or the raw text content (for text drops).
   */
  onMediaDropped: (value: string) => void;
  children: ReactNode;
  /** Override styles applied while no drag is active. */
  style?: CSSProperties;
  /** Optional label shown in the highlight overlay. */
  hint?: string;
}

export function MediaDropField({
  accept = ["image", "video"],
  onMediaDropped,
  children,
  style,
  hint,
}: Props) {
  const [over, setOver] = useState(false);

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (!hasMediaDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setOver(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget === e.target) setOver(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    setOver(false);
    const payload = readMediaDrag(e);
    if (!payload) return;
    if (!accept.includes(payload.type)) return;
    e.preventDefault();
    if (payload.type === "text") {
      onMediaDropped(payload.textContent ?? "");
    } else {
      onMediaDropped(makeMediaRef(payload.id));
    }
  }

  const acceptText = accept.includes("text");
  const hintText =
    hint ?? (acceptText ? "Drop text here" : "Drop image here");

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        position: "relative",
        borderRadius: 8,
        outline: over ? "2px dashed var(--pink)" : "none",
        outlineOffset: 2,
        transition: "outline-color 0.12s ease",
        ...style,
      }}
    >
      {children}
      {over && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(237,147,177,0.18)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1.6,
            color: "var(--deep-pink)",
            backdropFilter: "blur(2px)",
          }}
        >
          {hintText}
        </div>
      )}
    </div>
  );
}
