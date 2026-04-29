import { CTABar } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export type CountdownUnit = "months" | "weeks" | "days";

export interface CountdownMilestone {
  number: number;
  unit: CountdownUnit;
  tasks: string[];
}

export interface CountdownCarouselProps {
  milestones: CountdownMilestone[];
  /**
   * Which slide to render. 0 = cover, 1..milestones.length = milestone slides,
   * milestones.length + 1 = close. Defaults to 0.
   */
  slideIndex?: number;
  coverTitle?: string;
  coverSubtitle?: string;
  closeHeadline?: string;
  closeCta?: string;
}

interface MilestoneTheme {
  numberColor: string;
  labelColor: string;
  bulletColor: string;
  bulletDot: string;
  pin: PushPinVariant;
  accent: string;
}

const MILESTONE_THEMES: MilestoneTheme[] = [
  {
    numberColor: "var(--wine)",
    labelColor: "var(--gold)",
    bulletColor: "var(--wine)",
    bulletDot: "var(--mint)",
    pin: "gold",
    accent: "var(--mint)",
  },
  {
    numberColor: "var(--wine)",
    labelColor: "var(--gold)",
    bulletColor: "var(--wine)",
    bulletDot: "var(--gold)",
    pin: "gold",
    accent: "var(--gold-light)",
  },
  {
    numberColor: "var(--deep-pink)",
    labelColor: "var(--gold)",
    bulletColor: "var(--wine)",
    bulletDot: "var(--pink)",
    pin: "pink",
    accent: "var(--pink)",
  },
  {
    numberColor: "var(--deep-pink)",
    labelColor: "var(--deep-pink)",
    bulletColor: "var(--wine)",
    bulletDot: "var(--hot-pink)",
    pin: "pink",
    accent: "var(--hot-pink)",
  },
  {
    numberColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    bulletColor: "var(--wine)",
    bulletDot: "var(--hot-pink)",
    pin: "red",
    accent: "var(--hot-pink)",
  },
  {
    numberColor: "var(--wine)",
    labelColor: "var(--deep-pink)",
    bulletColor: "var(--wine)",
    bulletDot: "var(--deep-pink)",
    pin: "red",
    accent: "var(--deep-pink)",
  },
];

const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='%23D4A853' opacity='0.18'/%3E%3C/svg%3E\")";

function CoverSlide({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
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
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 80px",
      }}
    >
      <PushPin variant="gold" top={60} left={80} />
      <PushPin variant="pink" top={60} right={80} />
      <TapeStrip top={140} left="50%" rotation={-3} width={220} height={48} style={{ transform: "translateX(-50%) rotate(-3deg)" }} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 8,
          color: "var(--gold)",
          marginBottom: 36,
        }}
      >
        The Marigold Presents
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 110,
          lineHeight: 1.0,
          color: "var(--gold-light)",
          textAlign: "center",
          marginBottom: 32,
          letterSpacing: -1,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 48,
          color: "var(--hot-pink)",
          textAlign: "center",
          maxWidth: 820,
          transform: "rotate(-2deg)",
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 80,
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: "rgba(245,230,200,0.5)",
        }}
      >
        Swipe →
      </div>
    </div>
  );
}

function MilestoneSlide({
  milestone,
  index,
  total,
}: {
  milestone: CountdownMilestone;
  index: number;
  total: number;
}) {
  const theme = MILESTONE_THEMES[Math.min(index, MILESTONE_THEMES.length - 1)];

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
        padding: "100px 80px 140px",
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

      <PushPin variant={theme.pin} top={48} left="50%" style={{ transform: "translateX(-50%)" }} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: theme.labelColor,
          textAlign: "center",
          marginTop: 40,
          marginBottom: 12,
          position: "relative",
          zIndex: 2,
        }}
      >
        Step {index + 1} of {total}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 16,
          position: "relative",
          zIndex: 2,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 220,
            lineHeight: 0.9,
            color: theme.numberColor,
            letterSpacing: -4,
          }}
        >
          {milestone.number}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 64,
            color: theme.accent,
            transform: "rotate(-4deg)",
          }}
        >
          {milestone.unit} out
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingLeft: 40,
          position: "relative",
          zIndex: 2,
          gap: 22,
        }}
      >
        {milestone.tasks.map((task, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.4,
              color: theme.bulletColor,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: theme.bulletDot,
                marginTop: 14,
                flexShrink: 0,
              }}
            />
            <div>{task}</div>
          </div>
        ))}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function CloseSlide({
  headline,
  cta,
}: {
  headline: string;
  cta: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--pink)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 80px",
      }}
    >
      <PushPin variant="gold" top={80} left="50%" style={{ transform: "translateX(-50%)" }} />
      <TapeStrip top={120} left={120} rotation={-6} width={200} height={48} />
      <TapeStrip top={120} right={120} rotation={6} width={200} height={48} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 8,
          color: "var(--gold-light)",
          marginBottom: 40,
        }}
      >
        Or, easier —
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 96,
          lineHeight: 1.05,
          color: "white",
          textAlign: "center",
          marginBottom: 48,
          maxWidth: 880,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 48,
          color: "var(--wine)",
          transform: "rotate(-2deg)",
          marginBottom: 56,
        }}
      >
        you focus on the wedding. we'll track the chaos.
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 4,
          color: "var(--wine)",
          background: "var(--gold-light)",
          padding: "22px 48px",
          borderRadius: 8,
          boxShadow: "0 6px 0 var(--deep-pink)",
        }}
      >
        {cta}
      </div>

      <CTABar />
    </div>
  );
}

export function CountdownCarousel({
  milestones,
  slideIndex = 0,
  coverTitle = "Your Wedding Countdown",
  coverSubtitle = "a timeline for the organized and the panicking alike",
  closeHeadline = "The Marigold tracks all of this for you.",
  closeCta = "Start your plan →",
}: CountdownCarouselProps) {
  const total = milestones.length;
  const closeIndex = total + 1;
  const safeIndex = Math.max(0, Math.min(slideIndex, closeIndex));

  if (safeIndex === 0) {
    return <CoverSlide title={coverTitle} subtitle={coverSubtitle} />;
  }
  if (safeIndex === closeIndex) {
    return <CloseSlide headline={closeHeadline} cta={closeCta} />;
  }
  const milestoneIdx = safeIndex - 1;
  return (
    <MilestoneSlide
      milestone={milestones[milestoneIdx]}
      index={milestoneIdx}
      total={total}
    />
  );
}
