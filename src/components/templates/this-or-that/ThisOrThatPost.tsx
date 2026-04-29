import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

import type { ThisOrThatColorScheme } from "./ThisOrThatStory";

export interface ThisOrThatPostProps {
  topicLabel: string;
  optionA: string;
  optionAAnnotation: string;
  optionB: string;
  optionBAnnotation: string;
  colorScheme?: ThisOrThatColorScheme;
}

interface PostScheme {
  topLabelBg: string;
  topLabelColor: string;
  vsCircleBg: string;
  vsCircleBorder: string;
  vsColor: string;
  optionA: {
    bg: string;
    textColor: string;
    annotationColor: string;
  };
  optionB: {
    bg: string;
    textColor: string;
    annotationColor: string;
  };
}

const SCHEMES: Record<ThisOrThatColorScheme, PostScheme> = {
  "pink-wine": {
    topLabelBg: "var(--cream)",
    topLabelColor: "var(--wine)",
    vsCircleBg: "var(--gold)",
    vsCircleBorder: "var(--cream)",
    vsColor: "var(--wine)",
    optionA: {
      bg: "var(--pink)",
      textColor: "white",
      annotationColor: "var(--gold-light)",
    },
    optionB: {
      bg: "var(--wine)",
      textColor: "white",
      annotationColor: "var(--gold)",
    },
  },
  "cream-blush": {
    topLabelBg: "var(--cream)",
    topLabelColor: "var(--wine)",
    vsCircleBg: "var(--gold-light)",
    vsCircleBorder: "var(--gold)",
    vsColor: "var(--wine)",
    optionA: {
      bg: "var(--blush)",
      textColor: "var(--wine)",
      annotationColor: "var(--pink)",
    },
    optionB: {
      bg: "var(--cream)",
      textColor: "var(--wine)",
      annotationColor: "var(--gold)",
    },
  },
  "gold-lavender": {
    topLabelBg: "var(--cream)",
    topLabelColor: "var(--wine)",
    vsCircleBg: "var(--gold)",
    vsCircleBorder: "var(--cream)",
    vsColor: "var(--wine)",
    optionA: {
      bg: "var(--gold-light)",
      textColor: "var(--wine)",
      annotationColor: "var(--gold)",
    },
    optionB: {
      bg: "var(--lavender)",
      textColor: "var(--wine)",
      annotationColor: "var(--pink)",
    },
  },
};

export function ThisOrThatPost({
  topicLabel,
  optionA,
  optionAAnnotation,
  optionB,
  optionBAnnotation,
  colorScheme = "pink-wine",
}: ThisOrThatPostProps) {
  const scheme = SCHEMES[colorScheme];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: scheme.topLabelBg,
        position: "relative",
      }}
    >
      <TapeStrip
        top={-28}
        left="50%"
        rotation={-3}
        width={260}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
          zIndex: 6,
          paddingTop: 18,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "var(--mauve)",
          }}
        >
          {topicLabel}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: scheme.topLabelColor,
            lineHeight: 1,
          }}
        >
          THIS OR THAT
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          paddingTop: 110,
          paddingBottom: 96,
        }}
      >
        <Half
          side="left"
          label="THIS"
          text={optionA}
          annotation={optionAAnnotation}
          styles={scheme.optionA}
        />
        <Half
          side="right"
          label="THAT"
          text={optionB}
          annotation={optionBAnnotation}
          styles={scheme.optionB}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: scheme.vsCircleBg,
          border: `8px solid ${scheme.vsCircleBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          zIndex: 7,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 80,
            fontWeight: 700,
            color: scheme.vsColor,
            transform: "rotate(-6deg)",
            lineHeight: 1,
          }}
        >
          vs.
        </div>
      </div>

      <PushPin variant="pink" top={130} left={60} />
      <PushPin variant="gold" top={130} right={60} />

      <CTABar variant="overlay" />
    </div>
  );
}

function Half({
  side,
  label,
  text,
  annotation,
  styles,
}: {
  side: "left" | "right";
  label: string;
  text: string;
  annotation: string;
  styles: PostScheme["optionA"];
}) {
  const annotationRotation = side === "left" ? -2 : 2;

  return (
    <div
      style={{
        background: styles.bg,
        padding: side === "left" ? "60px 100px 60px 56px" : "60px 56px 60px 100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: side === "left" ? "flex-start" : "flex-end",
        textAlign: side === "left" ? "left" : "right",
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: styles.annotationColor,
          opacity: 0.6,
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 84,
          color: styles.textColor,
          lineHeight: 1.02,
          marginBottom: 18,
          whiteSpace: "pre-line",
        }}
      >
        {text}
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: styles.annotationColor,
          transform: `rotate(${annotationRotation}deg)`,
        }}
      >
        {annotation}
      </div>
    </div>
  );
}
