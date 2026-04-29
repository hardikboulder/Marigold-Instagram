"use client";

/**
 * Renders the thumbnail for a single MediaItem. Uses the cached blob URL when
 * available, otherwise falls back to creating one from the item's
 * thumbnailBlob the first time it mounts. Object URLs are revoked on unmount
 * unless they came from the resolver cache.
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { MediaItem } from "@/lib/db/media-types";

interface Props {
  item: MediaItem;
  size?: number | string;
  rounded?: number;
  style?: CSSProperties;
}

export function MediaThumb({ item, size = "100%", rounded = 8, style }: Props) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.thumbnailBlob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [item.id, item.updatedAt, item.thumbnailBlob]);

  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: "rgba(75,21,40,0.06)",
          borderRadius: rounded,
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={url}
      alt={item.fileName}
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        display: "block",
        borderRadius: rounded,
        background: "var(--blush)",
        ...style,
      }}
    />
  );
}
