import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";

export interface DayOfVsFullPlanningPostProps {
  dayOfBullets: string[];
  dayOfPriceRange: string;
  fullServiceBullets: string[];
  fullServicePriceRange: string;
  bottomLine?: string;
}

export function DayOfVsFullPlanningPost({
  dayOfBullets,
  dayOfPriceRange,
  fullServiceBullets,
  fullServicePriceRange,
  bottomLine = "The Marigold works with both.",
}: DayOfVsFullPlanningPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: "var(--cream)",
        overflow: "hidden",
      }}
    >
      <PlannerColumn
        background="var(--cream)"
        eyebrowColor="var(--gold)"
        textColor="var(--wine)"
        bulletColor="var(--mauve)"
        priceColor="var(--deep-pink)"
        align="left"
        padding="100px 64px 200px 80px"
        title="DAY-OF COORDINATOR"
        bullets={dayOfBullets}
        priceRange={dayOfPriceRange}
      />

      <div
        style={{
          position: "absolute",
          top: 60,
          bottom: 200,
          left: "50%",
          width: 4,
          background: "var(--gold)",
          opacity: 0.7,
          transform: "translateX(-50%)",
          zIndex: 5,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-3deg)",
          background: "var(--gold)",
          color: "var(--wine)",
          padding: "20px 32px",
          borderRadius: 999,
          fontFamily: "'Caveat', cursive",
          fontSize: 42,
          fontWeight: 600,
          boxShadow: "0 8px 22px rgba(75,21,40,0.22)",
          zIndex: 6,
          whiteSpace: "nowrap",
        }}
      >
        which one?
      </div>

      <PlannerColumn
        background="var(--wine)"
        eyebrowColor="var(--gold)"
        textColor="var(--cream)"
        bulletColor="rgba(255,248,242,0.85)"
        priceColor="var(--hot-pink)"
        align="right"
        padding="100px 80px 200px 64px"
        title="FULL-SERVICE PLANNER"
        bullets={fullServiceBullets}
        priceRange={fullServicePriceRange}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 92,
          textAlign: "center",
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: "var(--gold)",
          zIndex: 7,
          textShadow: "0 2px 6px rgba(0,0,0,0.18)",
        }}
      >
        {bottomLine}
      </div>

      <CTABar variant="overlay" handleText="PLANNER SPOTLIGHT" />
    </div>
  );
}

function PlannerColumn({
  background,
  eyebrowColor,
  textColor,
  bulletColor,
  priceColor,
  align,
  padding,
  title,
  bullets,
  priceRange,
}: {
  background: string;
  eyebrowColor: string;
  textColor: string;
  bulletColor: string;
  priceColor: string;
  align: "left" | "right";
  padding: string;
  title: string;
  bullets: string[];
  priceRange: string;
}) {
  return (
    <div
      style={{
        flex: "0 0 50%",
        background,
        padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: eyebrowColor,
            lineHeight: 1.2,
            marginBottom: 36,
            maxWidth: align === "left" ? 380 : 380,
            textAlign: align,
            marginLeft: align === "right" ? "auto" : 0,
          }}
        >
          {title}
        </div>

        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            textAlign: align,
          }}
        >
          {bullets.map((bullet, idx) => (
            <BulletRow
              key={idx}
              text={bullet}
              color={bulletColor}
              textColor={textColor}
              align={align}
            />
          ))}
        </ul>
      </div>

      <div
        style={{
          marginTop: 32,
          textAlign: align,
          paddingTop: 18,
          borderTop: `1px solid ${align === "left" ? "rgba(75,21,40,0.18)" : "rgba(255,248,242,0.25)"}`,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: bulletColor,
            marginBottom: 8,
          }}
        >
          PRICE RANGE
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 44,
            color: priceColor,
            lineHeight: 1.1,
          }}
        >
          {priceRange}
        </div>
      </div>
    </div>
  );
}

function BulletRow({
  text,
  color,
  textColor,
  align,
}: {
  text: string;
  color: string;
  textColor: string;
  align: "left" | "right";
}): ReactNode {
  const dot = (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: textColor,
        flexShrink: 0,
        marginTop: 10,
      }}
    />
  );
  return (
    <li
      style={{
        display: "flex",
        flexDirection: align === "right" ? "row-reverse" : "row",
        gap: 14,
        alignItems: "flex-start",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 20,
        lineHeight: 1.4,
        color,
        textAlign: align,
      }}
    >
      {dot}
      <span style={{ flex: 1 }}>{text}</span>
    </li>
  );
}
