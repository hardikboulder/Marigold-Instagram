import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

import { FlameIcon } from "./FlameIcon";

export interface HotTakeCarouselProps {
  takes: string[];
  /**
   * Which slide to render. 0 = cover, 1..takes.length = take slides,
   * takes.length + 1 = closing CTA. Defaults to 0.
   */
  slideIndex?: number;
  coverSubtitle?: string;
  closeHeadline?: string;
  closeSubtitle?: string;
}

interface SlideTheme {
  background: string;
  numberColor: string;
  takeColor: string;
  accentColor: string;
  pin: "gold" | "pink";
}

const SLIDE_THEMES: SlideTheme[] = [
  {
    background: "var(--wine)",
    numberColor: "var(--gold)",
    takeColor: "var(--cream)",
    accentColor: "var(--hot-pink)",
    pin: "gold",
  },
  {
    background: "var(--pink)",
    numberColor: "var(--wine)",
    takeColor: "var(--cream)",
    accentColor: "var(--gold-light)",
    pin: "pink",
  },
  {
    background: "var(--wine)",
    numberColor: "var(--gold)",
    takeColor: "var(--cream)",
    accentColor: "var(--hot-pink)",
    pin: "gold",
  },
  {
    background: "var(--pink)",
    numberColor: "var(--wine)",
    takeColor: "var(--cream)",
    accentColor: "var(--gold-light)",
    pin: "pink",
  },
  {
    background: "var(--wine)",
    numberColor: "var(--gold)",
    takeColor: "var(--cream)",
    accentColor: "var(--hot-pink)",
    pin: "gold",
  },
];

function CoverSlide({ subtitle, count }: { subtitle: string; count: number }) {
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
        padding: "100px 80px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 15%, rgba(212,168,83,0.22), transparent 55%), radial-gradient(circle at 80% 85%, rgba(237,147,177,0.18), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={60} left={70} />
      <PushPin variant="pink" top={60} right={70} />
      <TapeStrip
        top={140}
        left="50%"
        rotation={-3}
        width={240}
        height={50}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 40,
          position: "relative",
          zIndex: 2,
        }}
      >
        <FlameIcon size={72} />
        <FlameIcon size={88} />
        <FlameIcon size={72} />
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--hot-pink)",
          marginBottom: 28,
          position: "relative",
          zIndex: 2,
        }}
      >
        Buckle up
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 220,
          lineHeight: 0.9,
          color: "var(--gold)",
          letterSpacing: -4,
          position: "relative",
          zIndex: 2,
        }}
      >
        {count}
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: 12,
          textTransform: "uppercase",
          color: "var(--cream)",
          marginTop: 8,
          marginBottom: 36,
          position: "relative",
          zIndex: 2,
        }}
      >
        Hot Takes
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 56,
          color: "var(--hot-pink)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          maxWidth: 820,
          position: "relative",
          zIndex: 2,
        }}
      >
        {subtitle}
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
          color: "rgba(245,230,200,0.5)",
        }}
      >
        Swipe →
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function TakeSlide({
  take,
  index,
  total,
}: {
  take: string;
  index: number;
  total: number;
}) {
  const theme = SLIDE_THEMES[index % SLIDE_THEMES.length];
  const number = index + 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme.background,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "100px 90px 140px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.08), transparent 55%), radial-gradient(circle at 82% 88%, rgba(0,0,0,0.18), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant={theme.pin} top={56} left="50%" style={{ transform: "translateX(-50%)" }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
          marginBottom: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <FlameIcon size={42} />
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: theme.accentColor,
            }}
          >
            Hot Take
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: theme.accentColor,
            opacity: 0.8,
          }}
        >
          {number} of {total}
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 320,
          lineHeight: 0.85,
          color: theme.numberColor,
          letterSpacing: -8,
          position: "relative",
          zIndex: 2,
          marginBottom: 12,
        }}
      >
        #{number}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 64,
            lineHeight: 1.12,
            color: theme.takeColor,
            maxWidth: 880,
          }}
        >
          &ldquo;{take}&rdquo;
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function CloseSlide({
  headline,
  subtitle,
}: {
  headline: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--hot-pink)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 80px 160px",
      }}
    >
      <PushPin variant="gold" top={60} left={70} />
      <PushPin variant="pink" top={60} right={70} />
      <TapeStrip top={130} left={120} rotation={-6} width={200} height={48} />
      <TapeStrip top={130} right={120} rotation={6} width={200} height={48} />

      <FlameIcon size={96} color="var(--wine)" accent="var(--gold)" />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginTop: 28,
          marginBottom: 30,
        }}
      >
        Your turn
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 100,
          lineHeight: 1.0,
          color: "var(--cream)",
          textAlign: "center",
          maxWidth: 880,
          marginBottom: 36,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 52,
          color: "var(--wine)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          maxWidth: 820,
        }}
      >
        {subtitle}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

export function HotTakeCarousel({
  takes,
  slideIndex = 0,
  coverSubtitle = "that will make your aunty gasp",
  closeHeadline = "What's YOUR hot take?",
  closeSubtitle = "drop it in the comments. we're not scared.",
}: HotTakeCarouselProps) {
  const total = takes.length;
  const closeIndex = total + 1;
  const safeIndex = Math.max(0, Math.min(slideIndex, closeIndex));

  if (safeIndex === 0) {
    return <CoverSlide subtitle={coverSubtitle} count={total} />;
  }
  if (safeIndex === closeIndex) {
    return <CloseSlide headline={closeHeadline} subtitle={closeSubtitle} />;
  }
  const takeIdx = safeIndex - 1;
  return <TakeSlide take={takes[takeIdx]} index={takeIdx} total={total} />;
}
