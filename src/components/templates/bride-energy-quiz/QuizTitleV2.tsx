import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export type QuizBackgroundColor =
  | "wine"
  | "deep-pink"
  | "mint"
  | "gold-light"
  | "lavender"
  | "peach"
  | "blush"
  | "sky"
  | "cream";

export interface QuizTitleV2Option {
  letter: string;
  label: string;
  subtitle?: string;
}

export interface QuizTitleV2Props {
  /** The quiz question, e.g. "What's Your Wedding Style?". Last 2 words render italic. */
  quizTheme: string;
  /** 3-5 options, each with a letter, label, and optional subtitle. */
  options: QuizTitleV2Option[];
  /** Background color from the brand palette. */
  backgroundColor?: QuizBackgroundColor;
  /** Caveat annotation rendered above the question. */
  headerAnnotation?: string;
}

interface BgPalette {
  background: string;
  heading: string;
  emphasis: string;
  annotation: string;
  badgeBg: string;
  badgeText: string;
  optionBg: string;
  optionBorder: string;
  optionLetterBorder: string;
  optionLetterText: string;
  optionLabel: string;
  optionSubtitle: string;
}

const PALETTES: Record<QuizBackgroundColor, BgPalette> = {
  wine: {
    background: "var(--wine)",
    heading: "white",
    emphasis: "var(--hot-pink)",
    annotation: "var(--gold)",
    badgeBg: "rgba(212,168,83,0.18)",
    badgeText: "var(--gold)",
    optionBg: "rgba(255,255,255,0.06)",
    optionBorder: "2px dashed rgba(212,83,126,0.25)",
    optionLetterBorder: "var(--hot-pink)",
    optionLetterText: "var(--hot-pink)",
    optionLabel: "rgba(255,255,255,0.85)",
    optionSubtitle: "rgba(255,255,255,0.55)",
  },
  "deep-pink": {
    background: "var(--deep-pink)",
    heading: "white",
    emphasis: "var(--gold-light)",
    annotation: "var(--gold-light)",
    badgeBg: "rgba(245,230,200,0.2)",
    badgeText: "var(--gold-light)",
    optionBg: "rgba(255,255,255,0.08)",
    optionBorder: "2px dashed rgba(245,230,200,0.35)",
    optionLetterBorder: "var(--gold-light)",
    optionLetterText: "var(--gold-light)",
    optionLabel: "rgba(255,255,255,0.9)",
    optionSubtitle: "rgba(255,255,255,0.6)",
  },
  mint: {
    background: "var(--mint)",
    heading: "var(--wine)",
    emphasis: "var(--pink)",
    annotation: "var(--mauve)",
    badgeBg: "rgba(75,21,40,0.1)",
    badgeText: "var(--wine)",
    optionBg: "rgba(255,255,255,0.45)",
    optionBorder: "2px dashed rgba(75,21,40,0.18)",
    optionLetterBorder: "var(--pink)",
    optionLetterText: "var(--pink)",
    optionLabel: "var(--wine)",
    optionSubtitle: "rgba(75,21,40,0.6)",
  },
  "gold-light": {
    background: "var(--gold-light)",
    heading: "var(--wine)",
    emphasis: "var(--pink)",
    annotation: "var(--mauve)",
    badgeBg: "rgba(75,21,40,0.1)",
    badgeText: "var(--wine)",
    optionBg: "rgba(255,255,255,0.4)",
    optionBorder: "2px dashed rgba(75,21,40,0.2)",
    optionLetterBorder: "var(--pink)",
    optionLetterText: "var(--pink)",
    optionLabel: "var(--wine)",
    optionSubtitle: "rgba(75,21,40,0.6)",
  },
  lavender: {
    background: "var(--lavender)",
    heading: "var(--wine)",
    emphasis: "var(--pink)",
    annotation: "var(--mauve)",
    badgeBg: "rgba(75,21,40,0.1)",
    badgeText: "var(--wine)",
    optionBg: "rgba(255,255,255,0.45)",
    optionBorder: "2px dashed rgba(75,21,40,0.18)",
    optionLetterBorder: "var(--pink)",
    optionLetterText: "var(--pink)",
    optionLabel: "var(--wine)",
    optionSubtitle: "rgba(75,21,40,0.6)",
  },
  peach: {
    background: "var(--peach)",
    heading: "var(--wine)",
    emphasis: "var(--deep-pink)",
    annotation: "var(--mauve)",
    badgeBg: "rgba(75,21,40,0.1)",
    badgeText: "var(--wine)",
    optionBg: "rgba(255,255,255,0.45)",
    optionBorder: "2px dashed rgba(75,21,40,0.18)",
    optionLetterBorder: "var(--deep-pink)",
    optionLetterText: "var(--deep-pink)",
    optionLabel: "var(--wine)",
    optionSubtitle: "rgba(75,21,40,0.6)",
  },
  blush: {
    background: "var(--blush)",
    heading: "var(--wine)",
    emphasis: "var(--deep-pink)",
    annotation: "var(--mauve)",
    badgeBg: "rgba(75,21,40,0.08)",
    badgeText: "var(--wine)",
    optionBg: "rgba(255,255,255,0.55)",
    optionBorder: "2px dashed rgba(75,21,40,0.15)",
    optionLetterBorder: "var(--deep-pink)",
    optionLetterText: "var(--deep-pink)",
    optionLabel: "var(--wine)",
    optionSubtitle: "rgba(75,21,40,0.55)",
  },
  sky: {
    background: "var(--sky)",
    heading: "var(--wine)",
    emphasis: "var(--pink)",
    annotation: "var(--mauve)",
    badgeBg: "rgba(75,21,40,0.1)",
    badgeText: "var(--wine)",
    optionBg: "rgba(255,255,255,0.5)",
    optionBorder: "2px dashed rgba(75,21,40,0.18)",
    optionLetterBorder: "var(--pink)",
    optionLetterText: "var(--pink)",
    optionLabel: "var(--wine)",
    optionSubtitle: "rgba(75,21,40,0.6)",
  },
  cream: {
    background: "var(--cream)",
    heading: "var(--wine)",
    emphasis: "var(--deep-pink)",
    annotation: "var(--mauve)",
    badgeBg: "rgba(75,21,40,0.08)",
    badgeText: "var(--wine)",
    optionBg: "rgba(75,21,40,0.04)",
    optionBorder: "2px dashed rgba(75,21,40,0.15)",
    optionLetterBorder: "var(--deep-pink)",
    optionLetterText: "var(--deep-pink)",
    optionLabel: "var(--wine)",
    optionSubtitle: "rgba(75,21,40,0.55)",
  },
};

function splitTitle(title: string): { lead: string; emphasis: string } {
  if (title.includes("\n")) {
    const [lead, ...rest] = title.split("\n");
    return { lead: lead.trim(), emphasis: rest.join(" ").trim() };
  }
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return { lead: "", emphasis: title.trim() };
  const emphasis = words.slice(-2).join(" ");
  const lead = words.slice(0, -2).join(" ");
  return { lead, emphasis };
}

export function QuizTitleV2({
  quizTheme,
  options,
  backgroundColor = "wine",
  headerAnnotation = "take this totally scientific quiz",
}: QuizTitleV2Props) {
  const palette = PALETTES[backgroundColor];
  const { lead, emphasis } = splitTitle(quizTheme);
  const safeOptions = options.slice(0, 5);
  const headingFontSize = lead.length > 14 ? 96 : 110;
  const optionPadding =
    safeOptions.length >= 5
      ? "20px 32px"
      : safeOptions.length === 4
        ? "24px 34px"
        : "28px 36px";
  const optionGap = safeOptions.length >= 5 ? 14 : 18;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: palette.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 80,
        position: "relative",
      }}
    >
      <TapeStrip
        width={300}
        top={140}
        left="50%"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: palette.badgeText,
          background: palette.badgeBg,
          padding: "10px 22px",
          marginTop: 40,
          marginBottom: 28,
        }}
      >
        QUIZ
      </div>

      {headerAnnotation && (
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 46,
            color: palette.annotation,
            transform: "rotate(-3deg)",
            marginBottom: 16,
          }}
        >
          {headerAnnotation}
        </div>
      )}

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: headingFontSize,
          color: palette.heading,
          lineHeight: 1,
          marginBottom: 32,
        }}
      >
        {lead && (
          <>
            {lead}
            <br />
          </>
        )}
        <i style={{ color: palette.emphasis }}>{emphasis}</i>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: optionGap,
          width: "100%",
          maxWidth: 740,
          marginTop: 12,
        }}
      >
        {safeOptions.map((option) => (
          <div
            key={option.letter}
            style={{
              background: palette.optionBg,
              border: palette.optionBorder,
              padding: optionPadding,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                border: `2px solid ${palette.optionLetterBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Instrument Serif', serif",
                fontSize: 28,
                color: palette.optionLetterText,
                flexShrink: 0,
              }}
            >
              {option.letter}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 28,
                  fontWeight: 500,
                  color: palette.optionLabel,
                  lineHeight: 1.2,
                }}
              >
                {option.label}
              </div>
              {option.subtitle && (
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 20,
                    color: palette.optionSubtitle,
                    lineHeight: 1.3,
                  }}
                >
                  {option.subtitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <CTABar />
    </div>
  );
}
