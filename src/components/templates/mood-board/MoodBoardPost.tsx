import type { CSSProperties } from "react";

import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface MoodBoardPostProps {
  styleLabel: string;
  annotation: string;
  /** 4-5 hex strings. Doubles as panel placeholders when an image is missing. */
  colorPalette: string[];
  /** 4 entries; pass an empty string to render the palette color as a placeholder. */
  images?: string[];
}

const DEFAULT_PALETTE = ["#F4C2C2", "#D4A853", "#8A6070", "#FBEAF0", "#A8B89F"];

const PANEL_BASE: CSSProperties = {
  position: "absolute",
  borderRadius: 6,
  boxShadow: "0 6px 18px rgba(75,21,40,0.18)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  overflow: "hidden",
};

export function MoodBoardPost({
  styleLabel,
  annotation,
  colorPalette,
  images = [],
}: MoodBoardPostProps) {
  const palette = colorPalette.length > 0 ? colorPalette : DEFAULT_PALETTE;
  const panelColor = (i: number) => palette[i % palette.length] ?? DEFAULT_PALETTE[i];
  const panelStyle = (i: number): CSSProperties => {
    const url = images[i];
    return {
      ...PANEL_BASE,
      background: panelColor(i),
      backgroundImage: url ? `url(${url})` : undefined,
    };
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          right: 40,
          bottom: 280,
        }}
      >
        <div style={{ ...panelStyle(0), top: 0, left: 0, width: 580, height: 720 }}>
          <PlaceholderTag index={1} hasImage={Boolean(images[0])} />
        </div>

        <div style={{ ...panelStyle(1), top: 0, left: 600, width: 400, height: 230 }}>
          <PlaceholderTag index={2} hasImage={Boolean(images[1])} />
        </div>

        <div style={{ ...panelStyle(2), top: 250, left: 600, width: 400, height: 230 }}>
          <PlaceholderTag index={3} hasImage={Boolean(images[2])} />
        </div>

        <div style={{ ...panelStyle(3), top: 500, left: 600, width: 400, height: 220 }}>
          <PlaceholderTag index={4} hasImage={Boolean(images[3])} />
        </div>

        <TapeStrip top={-22} left={140} rotation={-8} width={180} height={44} />
        <TapeStrip top={230} left={560} rotation={6} width={140} height={36} />
        <TapeStrip top={490} left={560} rotation={-4} width={140} height={36} />

        <PushPin variant="pink" top={-12} left={20} />
        <PushPin variant="gold" top={-12} left={560} />
        <PushPin variant="gold" top={-12} right={20} />
        <PushPin variant="pink" bottom={-12} left={260} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 80,
          height: 200,
          background: "rgba(255,248,242,0.96)",
          borderTop: "1px solid rgba(75,21,40,0.08)",
          padding: "32px 60px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--wine)",
          }}
        >
          {styleLabel}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {palette.map((hex, i) => (
              <div
                key={`${hex}-${i}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: hex,
                  border: "2px solid var(--cream)",
                  boxShadow: "0 2px 6px rgba(75,21,40,0.18)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 36,
              color: "var(--mauve)",
              transform: "rotate(-2deg)",
              lineHeight: 1.1,
            }}
          >
            {annotation}
          </div>
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function PlaceholderTag({
  index,
  hasImage,
}: {
  index: number;
  hasImage: boolean;
}) {
  if (hasImage) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        fontFamily: "'Syne', sans-serif",
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: 4,
        color: "rgba(75,21,40,0.55)",
        textTransform: "uppercase",
      }}
    >
      {`0${index}`}
    </div>
  );
}
