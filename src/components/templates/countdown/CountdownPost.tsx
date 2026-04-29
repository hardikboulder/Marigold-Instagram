import { CTABar } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export type CountdownUnit = "months" | "weeks" | "days";
export type UrgencyLevel = "chill" | "getting-real" | "panic";

export interface CountdownPostProps {
  countdownNumber: number;
  countdownUnit: CountdownUnit;
  taskHeadline: string;
  taskDetail: string;
  annotation: string;
  urgencyLevel: UrgencyLevel;
}

interface UrgencyTheme {
  numberColor: string;
  labelColor: string;
  annotationColor: string;
  pin: PushPinVariant;
  detailColor: string;
  headlineColor: string;
}

const URGENCY: Record<UrgencyLevel, UrgencyTheme> = {
  chill: {
    numberColor: "var(--wine)",
    labelColor: "var(--gold)",
    annotationColor: "var(--mint)",
    pin: "gold",
    detailColor: "var(--wine)",
    headlineColor: "var(--wine)",
  },
  "getting-real": {
    numberColor: "var(--deep-pink)",
    labelColor: "var(--gold)",
    annotationColor: "var(--pink)",
    pin: "pink",
    detailColor: "var(--wine)",
    headlineColor: "var(--deep-pink)",
  },
  panic: {
    numberColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    annotationColor: "var(--hot-pink)",
    pin: "red",
    detailColor: "var(--wine)",
    headlineColor: "var(--wine)",
  },
};

const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='%23D4A853' opacity='0.18'/%3E%3C/svg%3E\")";

export function CountdownPost({
  countdownNumber,
  countdownUnit,
  taskHeadline,
  taskDetail,
  annotation,
  urgencyLevel,
}: CountdownPostProps) {
  const theme = URGENCY[urgencyLevel];

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
          position: "absolute",
          inset: 0,
          backgroundImage: DOT_GRID,
          opacity: 0.55,
        }}
      />

      <PushPin variant={theme.pin} top={36} left="50%" style={{ transform: "translateX(-50%)" }} />

      <div
        style={{
          paddingTop: 110,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 8,
          color: theme.labelColor,
          position: "relative",
          zIndex: 2,
        }}
      >
        The Countdown
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 280,
            lineHeight: 0.9,
            color: theme.numberColor,
            letterSpacing: -6,
          }}
        >
          {countdownNumber}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 56,
            color: theme.annotationColor,
            transform: "rotate(-4deg)",
            marginTop: -8,
            marginBottom: 36,
          }}
        >
          {countdownUnit} out
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 64,
            lineHeight: 1.05,
            color: theme.headlineColor,
            textAlign: "center",
            marginBottom: 22,
          }}
        >
          {taskHeadline}
        </div>

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            fontWeight: 400,
            lineHeight: 1.5,
            color: theme.detailColor,
            opacity: 0.85,
            textAlign: "center",
            maxWidth: 760,
          }}
        >
          {taskDetail}
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: theme.annotationColor,
          transform: "rotate(-2deg)",
          marginBottom: 130,
          position: "relative",
          zIndex: 2,
        }}
      >
        {annotation}
      </div>

      <TapeStrip
        bottom={108}
        left="50%"
        rotation={3}
        width={220}
        height={48}
        style={{ transform: "translateX(-50%) rotate(3deg)" }}
      />

      <CTABar variant="overlay" />
    </div>
  );
}
