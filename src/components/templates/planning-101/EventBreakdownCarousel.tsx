import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export type EventColor =
  | "mint"
  | "gold"
  | "pink"
  | "wine"
  | "gold-light"
  | "lavender"
  | "peach"
  | "blush";

export interface BudgetLine {
  label: string;
  range: string;
}

export interface EventBreakdownTimelineEntry {
  time: string;
  activity: string;
}

export interface EventBreakdownSlides {
  vibeText: string;
  checklist: string[];
  budgetTotal: string;
  budgetLines: BudgetLine[];
  timeline: EventBreakdownTimelineEntry[];
  mistakes: string[];
  marigoldFeatures: string[];
  marigoldClosingLine: string;
}

export interface EventBreakdownCarouselProps {
  eventName: string;
  eventColor: EventColor;
  slides: EventBreakdownSlides;
  /** 0 = cover, 1..6 = topical slides. */
  slideIndex?: number;
}

interface ColorTheme {
  background: string;
  accent: string;
  accentSoft: string;
  textOnColor: string;
  pin: "pink" | "gold" | "red" | "blue";
}

const COLOR_THEMES: Record<EventColor, ColorTheme> = {
  mint: {
    background: "var(--mint)",
    accent: "var(--wine)",
    accentSoft: "var(--deep-pink)",
    textOnColor: "var(--wine)",
    pin: "gold",
  },
  gold: {
    background: "var(--gold)",
    accent: "var(--wine)",
    accentSoft: "var(--cream)",
    textOnColor: "var(--wine)",
    pin: "gold",
  },
  pink: {
    background: "var(--pink)",
    accent: "var(--cream)",
    accentSoft: "var(--gold-light)",
    textOnColor: "var(--cream)",
    pin: "pink",
  },
  wine: {
    background: "var(--wine)",
    accent: "var(--gold)",
    accentSoft: "var(--hot-pink)",
    textOnColor: "var(--cream)",
    pin: "gold",
  },
  "gold-light": {
    background: "var(--gold-light)",
    accent: "var(--wine)",
    accentSoft: "var(--deep-pink)",
    textOnColor: "var(--wine)",
    pin: "gold",
  },
  lavender: {
    background: "var(--lavender)",
    accent: "var(--wine)",
    accentSoft: "var(--deep-pink)",
    textOnColor: "var(--wine)",
    pin: "blue",
  },
  peach: {
    background: "var(--peach)",
    accent: "var(--wine)",
    accentSoft: "var(--deep-pink)",
    textOnColor: "var(--wine)",
    pin: "pink",
  },
  blush: {
    background: "var(--blush)",
    accent: "var(--wine)",
    accentSoft: "var(--pink)",
    textOnColor: "var(--wine)",
    pin: "pink",
  },
};

const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='%23D4A853' opacity='0.18'/%3E%3C/svg%3E\")";

function SlideFrame({
  background,
  children,
}: {
  background: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  text,
  color,
  align = "center",
}: {
  text: string;
  color: string;
  align?: "left" | "center";
}) {
  return (
    <div
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 8,
        textTransform: "uppercase",
        color,
        textAlign: align,
        marginBottom: 24,
      }}
    >
      {text}
    </div>
  );
}

function CoverSlide({
  eventName,
  theme,
}: {
  eventName: string;
  theme: ColorTheme;
}) {
  return (
    <SlideFrame background={theme.background}>
      <PushPin variant={theme.pin} top={60} left={70} />
      <PushPin variant="gold" top={60} right={70} />
      <TapeStrip
        top={140}
        left="50%"
        rotation={-3}
        width={240}
        height={48}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 160px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: theme.accentSoft,
            marginBottom: 36,
          }}
        >
          Event Decoded
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 220,
            lineHeight: 0.9,
            color: theme.accent,
            letterSpacing: -4,
            marginBottom: 28,
          }}
        >
          {eventName}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: theme.accentSoft,
            transform: "rotate(-2deg)",
          }}
        >
          everything you need to plan it
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 110,
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 6,
            color: theme.accentSoft,
            opacity: 0.7,
          }}
        >
          Swipe →
        </div>
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

function VibeSlide({
  vibeText,
  theme,
}: {
  vibeText: string;
  theme: ColorTheme;
}) {
  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: DOT_GRID,
          opacity: 0.5,
        }}
      />
      <PushPin variant={theme.pin} top={60} left="50%" style={{ transform: "translateX(-50%)" }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "150px 90px 160px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <SectionLabel text="The Vibe" color="var(--gold)" />
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 56,
            lineHeight: 1.15,
            color: "var(--wine)",
            maxWidth: 880,
          }}
        >
          {vibeText}
        </div>
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

function ChecklistSlide({
  checklist,
  theme,
}: {
  checklist: string[];
  theme: ColorTheme;
}) {
  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: DOT_GRID,
          opacity: 0.5,
        }}
      />
      <PushPin variant={theme.pin} top={60} left={80} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 150px",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}
      >
        <SectionLabel text="The Checklist" color="var(--gold)" align="left" />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {checklist.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                lineHeight: 1.35,
                color: "var(--wine)",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  border: "2.5px solid var(--gold)",
                  marginTop: 4,
                  background: "white",
                }}
              />
              <div>{item}</div>
            </div>
          ))}
        </div>
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

function BudgetSlide({
  budgetTotal,
  budgetLines,
  theme,
}: {
  budgetTotal: string;
  budgetLines: BudgetLine[];
  theme: ColorTheme;
}) {
  return (
    <SlideFrame background={theme.background}>
      <PushPin variant={theme.pin} top={60} left={80} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 150px",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}
      >
        <SectionLabel text="The Budget" color={theme.accentSoft} align="left" />

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 48,
            lineHeight: 1.1,
            color: theme.accent,
            marginBottom: 24,
          }}
        >
          {budgetTotal}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {budgetLines.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: `1px dashed ${theme.accent}`,
                opacity: 0.95,
                paddingBottom: 6,
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: theme.textOnColor,
                }}
              >
                {line.label}
              </div>
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 28,
                  color: theme.accent,
                }}
              >
                {line.range}
              </div>
            </div>
          ))}
        </div>
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

function TimelineSlide({
  entries,
  theme,
}: {
  entries: EventBreakdownTimelineEntry[];
  theme: ColorTheme;
}) {
  return (
    <SlideFrame background="var(--cream)">
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: DOT_GRID,
          opacity: 0.5,
        }}
      />
      <PushPin variant={theme.pin} top={60} left={80} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 150px",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}
      >
        <SectionLabel text="The Timeline" color="var(--gold)" align="left" />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
          }}
        >
          {entries.map((entry, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 24,
                alignItems: "baseline",
              }}
            >
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 32,
                  color: "var(--deep-pink)",
                  minWidth: 160,
                }}
              >
                {entry.time}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  lineHeight: 1.35,
                  color: "var(--wine)",
                }}
              >
                {entry.activity}
              </div>
            </div>
          ))}
        </div>
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

function MistakesSlide({
  mistakes,
  theme,
}: {
  mistakes: string[];
  theme: ColorTheme;
}) {
  return (
    <SlideFrame background="var(--wine)">
      <PushPin variant="gold" top={60} left={80} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 80px 150px",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}
      >
        <SectionLabel text="The Mistakes" color="var(--hot-pink)" align="left" />

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            color: "var(--gold)",
            marginBottom: 24,
            transform: "rotate(-1.5deg)",
            transformOrigin: "left center",
          }}
        >
          things that look fine on paper but break in person
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {mistakes.map((mistake, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                lineHeight: 1.4,
                color: "var(--cream)",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontSize: 28,
                  color: theme.accentSoft,
                  lineHeight: 1,
                  marginTop: 2,
                  width: 32,
                }}
              >
                ×
              </div>
              <div>{mistake}</div>
            </div>
          ))}
        </div>
      </div>
      <CTABar variant="light" />
    </SlideFrame>
  );
}

function MarigoldSlide({
  features,
  closingLine,
}: {
  features: string[];
  closingLine: string;
}) {
  return (
    <SlideFrame background="var(--pink)">
      <PushPin variant="gold" top={60} left="50%" style={{ transform: "translateX(-50%)" }} />
      <TapeStrip top={140} left={120} rotation={-6} width={200} height={48} />
      <TapeStrip top={140} right={120} rotation={6} width={200} height={48} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "180px 80px 200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--gold-light)",
            marginBottom: 24,
          }}
        >
          The Marigold Has This
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 64,
            color: "var(--cream)",
            lineHeight: 1.05,
            marginBottom: 40,
            maxWidth: 880,
          }}
        >
          we built the planner to handle the hard parts.
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 36,
            alignItems: "flex-start",
          }}
        >
          {features.map((feature, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 500,
                color: "var(--cream)",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--gold)",
                }}
              />
              <div>{feature}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: "var(--gold-light)",
            transform: "rotate(-2deg)",
          }}
        >
          {closingLine}
        </div>
      </div>
      <CTABar variant="overlay" />
    </SlideFrame>
  );
}

export function EventBreakdownCarousel({
  eventName,
  eventColor,
  slides,
  slideIndex = 0,
}: EventBreakdownCarouselProps) {
  const theme = COLOR_THEMES[eventColor];
  const safeIndex = Math.max(0, Math.min(slideIndex, 6));

  switch (safeIndex) {
    case 0:
      return <CoverSlide eventName={eventName} theme={theme} />;
    case 1:
      return <VibeSlide vibeText={slides.vibeText} theme={theme} />;
    case 2:
      return <ChecklistSlide checklist={slides.checklist} theme={theme} />;
    case 3:
      return (
        <BudgetSlide
          budgetTotal={slides.budgetTotal}
          budgetLines={slides.budgetLines}
          theme={theme}
        />
      );
    case 4:
      return <TimelineSlide entries={slides.timeline} theme={theme} />;
    case 5:
      return <MistakesSlide mistakes={slides.mistakes} theme={theme} />;
    case 6:
      return (
        <MarigoldSlide
          features={slides.marigoldFeatures}
          closingLine={slides.marigoldClosingLine}
        />
      );
    default:
      return <CoverSlide eventName={eventName} theme={theme} />;
  }
}
