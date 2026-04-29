import { CTABar } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export type CountdownUnit = "months" | "weeks" | "days";
export type UrgencyLevel = "chill" | "getting-real" | "panic";

export interface CountdownStoryProps {
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
  unitColor: string;
}

const URGENCY: Record<UrgencyLevel, UrgencyTheme> = {
  chill: {
    numberColor: "var(--wine)",
    labelColor: "var(--gold)",
    annotationColor: "var(--mint)",
    pin: "gold",
    detailColor: "var(--wine)",
    headlineColor: "var(--wine)",
    unitColor: "var(--mint)",
  },
  "getting-real": {
    numberColor: "var(--deep-pink)",
    labelColor: "var(--gold)",
    annotationColor: "var(--pink)",
    pin: "pink",
    detailColor: "var(--wine)",
    headlineColor: "var(--deep-pink)",
    unitColor: "var(--pink)",
  },
  panic: {
    numberColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    annotationColor: "var(--hot-pink)",
    pin: "red",
    detailColor: "var(--wine)",
    headlineColor: "var(--wine)",
    unitColor: "var(--hot-pink)",
  },
};

const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='%23D4A853' opacity='0.18'/%3E%3C/svg%3E\")";

export function CountdownStory({
  countdownNumber,
  countdownUnit,
  taskHeadline,
  taskDetail,
  annotation,
  urgencyLevel,
}: CountdownStoryProps) {
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
          opacity: 0.6,
        }}
      />

      <PushPin variant={theme.pin} top={60} left={80} />
      <PushPin variant="gold" top={60} right={80} />

      <div
        style={{
          paddingTop: 140,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 30,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 10,
          color: theme.labelColor,
          position: "relative",
          zIndex: 2,
        }}
      >
        The Countdown
      </div>

      <div
        style={{
          height: "40%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
          marginTop: 40,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 400,
            lineHeight: 0.85,
            color: theme.numberColor,
            letterSpacing: -10,
          }}
        >
          {countdownNumber}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 88,
            color: theme.unitColor,
            transform: "rotate(-5deg)",
            marginTop: -12,
          }}
        >
          {countdownUnit} out
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "60px 100px 0",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 96,
            lineHeight: 1.0,
            color: theme.headlineColor,
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          {taskHeadline}
        </div>

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 32,
            fontWeight: 400,
            lineHeight: 1.5,
            color: theme.detailColor,
            opacity: 0.85,
            textAlign: "center",
            maxWidth: 820,
            marginBottom: 48,
          }}
        >
          {taskDetail}
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 56,
            color: theme.annotationColor,
            transform: "rotate(-3deg)",
          }}
        >
          {annotation}
        </div>
      </div>

      <TapeStrip
        bottom={260}
        left="50%"
        rotation={4}
        width={280}
        height={56}
        style={{ transform: "translateX(-50%) rotate(4deg)" }}
      />

      <CTABar />
    </div>
  );
}
