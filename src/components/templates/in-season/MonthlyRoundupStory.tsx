import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

import { RoundupIcon, type RoundupIconType } from "./InSeasonIcons";

export interface RoundupItem {
  text: string;
  iconType: RoundupIconType;
}

export interface MonthlyRoundupStoryProps {
  month: string;
  year: string;
  items: RoundupItem[];
  swipeText?: string;
}

export function MonthlyRoundupStory({
  month,
  year,
  items,
  swipeText = "Swipe for details →",
}: MonthlyRoundupStoryProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "180px 90px 240px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 10%, rgba(212,168,83,0.22), transparent 50%), radial-gradient(circle at 80% 90%, rgba(237,147,177,0.18), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={90} left={90} />
      <PushPin variant="gold" top={90} right={90} />
      <TapeStrip
        top={170}
        left="50%"
        rotation={-3}
        width={300}
        height={56}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--gold)",
          textAlign: "center",
          lineHeight: 1.15,
          marginTop: 40,
          marginBottom: 24,
          position: "relative",
          zIndex: 2,
        }}
      >
        This Month
        <br />
        in Weddings
      </div>

      <div
        style={{
          width: 160,
          height: 3,
          background: "var(--gold)",
          opacity: 0.5,
          margin: "0 auto 36px",
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 96,
          lineHeight: 1,
          color: "var(--cream)",
          textAlign: "center",
          marginBottom: 64,
          position: "relative",
          zIndex: 2,
        }}
      >
        {month} {year}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 32,
          position: "relative",
          zIndex: 2,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              borderBottom: "1px solid rgba(212,168,83,0.25)",
              paddingBottom: 22,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(212,168,83,0.16)",
                border: "1px solid rgba(212,168,83,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <RoundupIcon icon={item.iconType} size={44} color="var(--gold)" />
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 30,
                fontWeight: 500,
                color: "var(--cream)",
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {item.text}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--gold-light)",
          textAlign: "center",
          marginTop: 40,
          position: "relative",
          zIndex: 2,
        }}
      >
        {swipeText}
      </div>

      <CTABar />
    </div>
  );
}
