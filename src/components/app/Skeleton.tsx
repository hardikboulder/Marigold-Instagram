"use client";

/**
 * Skeleton loaders for the studio's main views. Reads from localStorage are
 * fast so these flash briefly — they exist mostly to keep layout stable while
 * `hydrated` flips from false to true.
 */

import type { CSSProperties } from "react";

export function SkeletonBlock({
  width,
  height = 16,
  rounded = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  rounded?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="marigold-skeleton"
      style={{
        width: width ?? "100%",
        height,
        borderRadius: rounded,
        ...style,
      }}
    />
  );
}

export function CalendarSkeleton() {
  return (
    <div style={gridStyle} aria-hidden="true">
      {Array.from({ length: 7 }).map((_, dayIdx) => (
        <div key={dayIdx} style={columnStyle}>
          <SkeletonBlock height={14} width="60%" style={{ marginBottom: 6 }} />
          <SkeletonBlock height={11} width="40%" style={{ marginBottom: 18 }} />
          {Array.from({ length: dayIdx % 3 === 0 ? 2 : 1 }).map((_, tileIdx) => (
            <div key={tileIdx} style={tileStyle}>
              <SkeletonBlock height={14} width="50%" />
              <SkeletonBlock height={11} width="80%" style={{ marginTop: 10 }} />
              <SkeletonBlock height={11} width="65%" style={{ marginTop: 6 }} />
              <SkeletonBlock height={9} width="35%" style={{ marginTop: 14 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div style={editorLayoutStyle} aria-hidden="true">
      <div style={editorPanelStyle}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <SkeletonBlock height={11} width="30%" style={{ marginBottom: 10 }} />
            <SkeletonBlock height={36} />
            <SkeletonBlock height={36} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div style={editorPreviewStyle}>
        <div style={{ width: "min(280px, 70%)", aspectRatio: "9 / 16" }}>
          <SkeletonBlock height="100%" rounded={12} />
        </div>
      </div>
    </div>
  );
}

export function AssetGridSkeleton() {
  return (
    <div style={assetGridStyle} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={assetCardStyle}>
          <SkeletonBlock height={220} rounded={0} />
          <div style={{ padding: 16 }}>
            <SkeletonBlock height={11} width="35%" />
            <SkeletonBlock height={18} width="80%" style={{ marginTop: 10 }} />
            <SkeletonBlock height={10} width="55%" style={{ marginTop: 8 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <SkeletonBlock height={28} width={80} rounded={4} />
              <SkeletonBlock height={28} width={92} rounded={4} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(188px, 1fr))",
  gap: 16,
};

const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const tileStyle: CSSProperties = {
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
};

const editorLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(360px, 460px) 1fr",
  flex: 1,
  minHeight: "calc(100vh - 80px)",
};

const editorPanelStyle: CSSProperties = {
  padding: "32px 28px",
  background: "var(--cream)",
  borderRight: "1px solid rgba(75,21,40,0.08)",
};

const editorPreviewStyle: CSSProperties = {
  background: "var(--blush)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 40,
};

const assetGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
};

const assetCardStyle: CSSProperties = {
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 12,
  overflow: "hidden",
};
