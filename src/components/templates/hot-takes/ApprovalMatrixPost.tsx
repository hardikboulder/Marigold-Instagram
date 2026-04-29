import { CTABar } from "@/components/brand/CTABar";

export interface ApprovalMatrixItem {
  label: string;
  /** -1 (worth it) → 1 (skip it) */
  x: number;
  /** -1 (mom approves, top) → 1 (mom doesn't, bottom) */
  y: number;
}

export interface ApprovalMatrixPostProps {
  title: string;
  subtitle?: string;
  items: ApprovalMatrixItem[];
}

const DOT_COLORS = [
  "var(--hot-pink)",
  "var(--gold)",
  "var(--deep-pink)",
  "var(--mauve)",
  "var(--wine)",
];

function clampAxis(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < -1) return -1;
  if (v > 1) return 1;
  return v;
}

export function ApprovalMatrixPost({
  title,
  subtitle,
  items,
}: ApprovalMatrixPostProps) {
  const validItems = (items || [])
    .filter((it) => it.label && it.label.trim())
    .map((it) => ({
      ...it,
      x: clampAxis(it.x),
      y: clampAxis(it.y),
    }));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        padding: "60px 60px 140px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 42,
            lineHeight: 1.1,
            color: "var(--wine)",
          }}
        >
          {title}
        </div>
        {subtitle && subtitle.trim() && (
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 30,
              color: "var(--deep-pink)",
              transform: "rotate(-1.5deg)",
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          margin: "16px 24px 0",
          background: "rgba(255,255,255,0.5)",
          border: "2px solid var(--wine)",
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(75,21,40,0.12)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(75,21,40,0.4)",
            transform: "translateY(-0.5px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(75,21,40,0.4)",
            transform: "translateX(-0.5px)",
          }}
        />

        <QuadrantLabel
          text="The Sweet Spot"
          position={{ top: 14, left: 18 }}
          color="#2E7D5B"
        />
        <QuadrantLabel
          text="Pick Your Battles"
          position={{ top: 14, right: 18 }}
          color="var(--mauve)"
          align="right"
        />
        <QuadrantLabel
          text="Worth The Fight"
          position={{ bottom: 14, left: 18 }}
          color="var(--deep-pink)"
        />
        <QuadrantLabel
          text="Let It Go"
          position={{ bottom: 14, right: 18 }}
          color="rgba(75,21,40,0.55)"
          align="right"
        />

        <AxisLabel
          text="WORTH IT ←"
          position={{ left: 14, top: "50%" }}
          transform="translateY(-50%)"
        />
        <AxisLabel
          text="→ SKIP IT"
          position={{ right: 14, top: "50%" }}
          transform="translateY(-50%)"
          align="right"
        />
        <AxisLabel
          text="↑ MOM APPROVES"
          position={{ top: 8, left: "50%" }}
          transform="translateX(-50%)"
        />
        <AxisLabel
          text="MOM DOESN'T ↓"
          position={{ bottom: 8, left: "50%" }}
          transform="translateX(-50%)"
        />

        {validItems.map((item, i) => {
          const xPct = ((item.x + 1) / 2) * 100;
          const yPct = ((item.y + 1) / 2) * 100;
          const dotColor = DOT_COLORS[i % DOT_COLORS.length];
          const labelLeft = xPct > 70;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                flexDirection: labelLeft ? "row-reverse" : "row",
                gap: 8,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: dotColor,
                  border: "2px solid var(--cream)",
                  boxShadow: "0 2px 6px rgba(75,21,40,0.3)",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--wine)",
                  background: "rgba(255,248,242,0.92)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function QuadrantLabel({
  text,
  position,
  color,
  align = "left",
}: {
  text: string;
  position: React.CSSProperties;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...position,
        fontFamily: "'Caveat', cursive",
        fontSize: 26,
        color,
        textAlign: align,
        transform: "rotate(-2deg)",
        opacity: 0.85,
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

function AxisLabel({
  text,
  position,
  transform,
  align = "left",
}: {
  text: string;
  position: React.CSSProperties;
  transform?: string;
  align?: "left" | "right";
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...position,
        transform,
        fontFamily: "'Syne', sans-serif",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: "var(--wine)",
        opacity: 0.7,
        textAlign: align,
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}
