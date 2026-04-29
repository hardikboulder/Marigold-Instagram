import type { CSSProperties } from "react";

import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export type ThisOrThatColorScheme = "pink-wine" | "cream-blush" | "gold-lavender";

export interface ThisOrThatStoryProps {
  topicLabel: string;
  optionA: string;
  optionAAnnotation: string;
  optionB: string;
  optionBAnnotation: string;
  colorScheme?: ThisOrThatColorScheme;
}

interface SchemeStyle {
  pageBg: string;
  topLabelColor: string;
  topSubColor: string;
  dividerCenterBg: string;
  orColor: string;
  optionA: {
    bg: string;
    textColor: string;
    annotationColor: string;
    voteRing: string;
  };
  optionB: {
    bg: string;
    textColor: string;
    annotationColor: string;
    voteRing: string;
  };
}

const SCHEMES: Record<ThisOrThatColorScheme, SchemeStyle> = {
  "pink-wine": {
    pageBg: "var(--cream)",
    topLabelColor: "var(--wine)",
    topSubColor: "var(--mauve)",
    dividerCenterBg: "var(--cream)",
    orColor: "var(--gold)",
    optionA: {
      bg: "var(--pink)",
      textColor: "white",
      annotationColor: "var(--gold-light)",
      voteRing: "rgba(255,255,255,0.65)",
    },
    optionB: {
      bg: "var(--wine)",
      textColor: "white",
      annotationColor: "var(--gold)",
      voteRing: "rgba(245,230,200,0.65)",
    },
  },
  "cream-blush": {
    pageBg: "var(--cream)",
    topLabelColor: "var(--wine)",
    topSubColor: "var(--mauve)",
    dividerCenterBg: "var(--gold-light)",
    orColor: "var(--wine)",
    optionA: {
      bg: "var(--blush)",
      textColor: "var(--wine)",
      annotationColor: "var(--pink)",
      voteRing: "rgba(75,21,40,0.45)",
    },
    optionB: {
      bg: "var(--cream)",
      textColor: "var(--wine)",
      annotationColor: "var(--gold)",
      voteRing: "rgba(75,21,40,0.45)",
    },
  },
  "gold-lavender": {
    pageBg: "var(--cream)",
    topLabelColor: "var(--wine)",
    topSubColor: "var(--mauve)",
    dividerCenterBg: "var(--cream)",
    orColor: "var(--wine)",
    optionA: {
      bg: "var(--gold-light)",
      textColor: "var(--wine)",
      annotationColor: "var(--gold)",
      voteRing: "rgba(75,21,40,0.45)",
    },
    optionB: {
      bg: "var(--lavender)",
      textColor: "var(--wine)",
      annotationColor: "var(--pink)",
      voteRing: "rgba(75,21,40,0.45)",
    },
  },
};

export function ThisOrThatStory({
  topicLabel,
  optionA,
  optionAAnnotation,
  optionB,
  optionBAnnotation,
  colorScheme = "pink-wine",
}: ThisOrThatStoryProps) {
  const scheme = SCHEMES[colorScheme];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: scheme.pageBg,
        position: "relative",
      }}
    >
      <TopBanner
        topicLabel={topicLabel}
        labelColor={scheme.topLabelColor}
        subColor={scheme.topSubColor}
      />

      <OptionHalf
        position="top"
        label="THIS"
        text={optionA}
        annotation={optionAAnnotation}
        styles={scheme.optionA}
      />

      <Divider centerBg={scheme.dividerCenterBg} orColor={scheme.orColor} />

      <OptionHalf
        position="bottom"
        label="THAT"
        text={optionB}
        annotation={optionBAnnotation}
        styles={scheme.optionB}
      />

      <CTABar />
    </div>
  );
}

function TopBanner({
  topicLabel,
  labelColor,
  subColor,
}: {
  topicLabel: string;
  labelColor: string;
  subColor: string;
}) {
  return (
    <div
      style={{
        height: "10%",
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 60px",
        zIndex: 6,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: subColor,
        }}
      >
        {topicLabel}
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: labelColor,
          lineHeight: 1,
        }}
      >
        THIS OR THAT
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: subColor,
          transform: "rotate(-2deg)",
          marginTop: 4,
        }}
      >
        tap to vote ↓
      </div>
    </div>
  );
}

function OptionHalf({
  position,
  label,
  text,
  annotation,
  styles,
}: {
  position: "top" | "bottom";
  label: string;
  text: string;
  annotation: string;
  styles: SchemeStyle["optionA"];
}) {
  const annotationRotation = position === "top" ? -2 : 2;

  return (
    <div
      style={{
        flex: 1,
        background: styles.bg,
        padding:
          position === "top" ? "72px 80px 56px" : "56px 80px 72px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: styles.annotationColor,
          opacity: 0.55,
          marginBottom: 16,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 132,
          color: styles.textColor,
          lineHeight: 1.02,
          marginBottom: 24,
          whiteSpace: "pre-line",
        }}
      >
        {text}
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 44,
          color: styles.annotationColor,
          transform: `rotate(${annotationRotation}deg)`,
        }}
      >
        {annotation}
      </div>

      <VoteCircle
        ringColor={styles.voteRing}
        position={position}
      />
    </div>
  );
}

function VoteCircle({
  ringColor,
  position,
}: {
  ringColor: string;
  position: "top" | "bottom";
}) {
  const offset: CSSProperties =
    position === "top"
      ? { top: 56, right: 60 }
      : { bottom: 200, right: 60 };

  return (
    <div
      style={{
        position: "absolute",
        width: 132,
        height: 132,
        border: `4px solid ${ringColor}`,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(-6deg)",
        ...offset,
      }}
    >
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 64,
          color: ringColor,
          lineHeight: 1,
          transform: "rotate(8deg)",
        }}
      >
        ✓
      </div>
    </div>
  );
}

function Divider({
  centerBg,
  orColor,
}: {
  centerBg: string;
  orColor: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 12,
        background: "var(--gold)",
        zIndex: 5,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: centerBg,
          border: "6px solid var(--gold)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 72,
            fontWeight: 700,
            color: orColor,
            transform: "rotate(-6deg)",
            lineHeight: 1,
          }}
        >
          or
        </div>
      </div>
      <PushPin variant="pink" top={-22} left={120} />
      <PushPin variant="gold" top={-22} right={120} />
    </div>
  );
}
