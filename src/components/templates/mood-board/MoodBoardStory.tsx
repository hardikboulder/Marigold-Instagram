import type { CSSProperties } from "react";

import { CTABar } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface MoodBoardPanel {
  label: string;
  imageUrl?: string;
}

export interface MoodBoardStoryProps {
  styleLabel: string;
  panels: MoodBoardPanel[];
  /** Optional fallback colors used when a panel imageUrl is missing. */
  fallbackColors?: string[];
}

const DEFAULT_FALLBACKS = ["#F4C2C2", "#D4A853", "#A8B89F"];
const PIN_ROTATION: Array<{ pin: PushPinVariant; rotation: number; tapeRotation: number }> = [
  { pin: "pink", rotation: -1.5, tapeRotation: -6 },
  { pin: "gold", rotation: 1.5, tapeRotation: 5 },
  { pin: "pink", rotation: -1, tapeRotation: -4 },
];

export function MoodBoardStory({
  styleLabel,
  panels,
  fallbackColors = DEFAULT_FALLBACKS,
}: MoodBoardStoryProps) {
  const items = panels.slice(0, 3);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          paddingTop: 110,
          paddingBottom: 24,
          textAlign: "center",
          position: "relative",
          zIndex: 4,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--mauve)",
            marginBottom: 12,
          }}
        >
          MOOD BOARD
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 76,
            color: "var(--wine)",
            lineHeight: 1.05,
            padding: "0 80px",
          }}
        >
          {styleLabel}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "12px 60px 60px",
          display: "flex",
          flexDirection: "column",
          gap: 56,
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {items.map((panel, i) => {
          const align = i % 2 === 0 ? "left" : "right";
          const fallback = fallbackColors[i % fallbackColors.length] ?? DEFAULT_FALLBACKS[i];
          const meta = PIN_ROTATION[i % PIN_ROTATION.length];
          return (
            <PanelRow
              key={`${panel.label}-${i}`}
              align={align}
              label={panel.label}
              imageUrl={panel.imageUrl}
              fallback={fallback}
              rotation={meta.rotation}
              tapeRotation={meta.tapeRotation}
              pin={meta.pin}
            />
          );
        })}
      </div>

      <CTABar />
    </div>
  );
}

function PanelRow({
  align,
  label,
  imageUrl,
  fallback,
  rotation,
  tapeRotation,
  pin,
}: {
  align: "left" | "right";
  label: string;
  imageUrl?: string;
  fallback: string;
  rotation: number;
  tapeRotation: number;
  pin: PushPinVariant;
}) {
  const isLeft = align === "left";
  const annotationRotation = isLeft ? -3 : 3;

  const panelStyle: CSSProperties = {
    width: 600,
    height: 380,
    borderRadius: 8,
    background: fallback,
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 8px 24px rgba(75,21,40,0.2)",
    transform: `rotate(${rotation}deg)`,
    position: "relative",
    flexShrink: 0,
  };

  const labelStyle: CSSProperties = {
    fontFamily: "'Caveat', cursive",
    fontSize: 64,
    color: "var(--wine)",
    lineHeight: 1.1,
    transform: `rotate(${annotationRotation}deg)`,
    maxWidth: 320,
    textAlign: isLeft ? "left" : "right",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isLeft ? "row" : "row-reverse",
        alignItems: "center",
        gap: 36,
        position: "relative",
      }}
    >
      <div style={panelStyle}>
        <TapeStrip
          top={-26}
          left={isLeft ? "70%" : "10%"}
          rotation={tapeRotation}
          width={160}
          height={42}
        />
        <PushPin variant={pin} top={-14} left={isLeft ? 30 : "auto"} right={isLeft ? "auto" : 30} />
        {!imageUrl ? (
          <div
            style={{
              position: "absolute",
              bottom: 18,
              left: 22,
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 4,
              color: "rgba(75,21,40,0.55)",
              textTransform: "uppercase",
            }}
          >
            IMAGE
          </div>
        ) : null}
      </div>

      <div style={labelStyle}>{label}</div>
    </div>
  );
}
