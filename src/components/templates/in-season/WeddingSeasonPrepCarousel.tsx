import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface WeddingSeasonPrepSlide {
  items: string[];
}

export interface WeddingSeasonPrepCarouselProps {
  seasonName: string;
  seasonDates: string;
  hypeText?: string;
  bookNow: WeddingSeasonPrepSlide;
  startNow: WeddingSeasonPrepSlide;
  decideNow: WeddingSeasonPrepSlide;
  relaxAbout: WeddingSeasonPrepSlide;
  ctaHeadline?: string;
  ctaSupport?: string;
  ctaLine?: string;
  /** 0 = cover, 1 = book, 2 = start, 3 = decide, 4 = relax, 5 = platform CTA */
  slideIndex?: number;
}

interface CategoryTheme {
  background: string;
  accent: string;
  body: string;
  pin: "gold" | "pink";
  label: string;
  caption: string;
}

const CATEGORY_THEMES: Record<
  "book" | "start" | "decide" | "relax",
  CategoryTheme
> = {
  book: {
    background: "var(--wine)",
    accent: "var(--hot-pink)",
    body: "var(--cream)",
    pin: "gold",
    label: "Book Now",
    caption: "vendors fill up fast — secure these first",
  },
  start: {
    background: "var(--deep-pink)",
    accent: "var(--gold-light)",
    body: "var(--cream)",
    pin: "gold",
    label: "Start Now",
    caption: "knock these out before season chaos",
  },
  decide: {
    background: "#2F5D4E",
    accent: "var(--gold)",
    body: "var(--cream)",
    pin: "gold",
    label: "Decide Now",
    caption: "long lead times — pick early, regret never",
  },
  relax: {
    background: "var(--blush)",
    accent: "var(--wine)",
    body: "var(--wine)",
    pin: "pink",
    label: "Relax About",
    caption: "these can wait. seriously.",
  },
};

function CoverSlide({
  seasonName,
  seasonDates,
  hypeText,
}: {
  seasonName: string;
  seasonDates: string;
  hypeText: string;
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
        width={260}
        height={50}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--hot-pink)",
          marginTop: 30,
          marginBottom: 28,
          position: "relative",
          zIndex: 2,
        }}
      >
        In Season
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 110,
          lineHeight: 0.95,
          color: "var(--gold)",
          letterSpacing: -2,
          textAlign: "center",
          maxWidth: 880,
          position: "relative",
          zIndex: 2,
        }}
      >
        {seasonName}
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 56,
          color: "var(--cream)",
          textAlign: "center",
          marginTop: 12,
          position: "relative",
          zIndex: 2,
        }}
      >
        is coming.
      </div>

      <div
        style={{
          width: 120,
          height: 2,
          background: "var(--gold)",
          opacity: 0.6,
          margin: "40px 0 28px",
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--gold-light)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {seasonDates}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 60,
          color: "var(--hot-pink)",
          transform: "rotate(-2deg)",
          marginTop: 48,
          textAlign: "center",
          maxWidth: 820,
          position: "relative",
          zIndex: 2,
        }}
      >
        {hypeText}
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
        Are you ready? →
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function CategorySlide({
  category,
  items,
}: {
  category: keyof typeof CATEGORY_THEMES;
  items: string[];
}) {
  const theme = CATEGORY_THEMES[category];
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
        padding: "110px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(255,255,255,0.10), transparent 55%), radial-gradient(circle at 82% 88%, rgba(0,0,0,0.18), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant={theme.pin} top={56} left="50%" style={{ transform: "translateX(-50%)" }} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: theme.accent,
          textAlign: "center",
          lineHeight: 1,
          marginBottom: 18,
          position: "relative",
          zIndex: 2,
        }}
      >
        {theme.label}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: theme.body,
          opacity: 0.75,
          textAlign: "center",
          transform: "rotate(-1deg)",
          marginBottom: 56,
          position: "relative",
          zIndex: 2,
        }}
      >
        {theme.caption}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 22,
          position: "relative",
          zIndex: 2,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 22,
              borderBottom: `1px solid ${theme.body === "var(--cream)" ? "rgba(255,248,242,0.18)" : "rgba(75,21,40,0.18)"}`,
              paddingBottom: 18,
            }}
          >
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 56,
                lineHeight: 0.9,
                color: theme.accent,
                minWidth: 60,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 500,
                color: theme.body,
                lineHeight: 1.3,
                flex: 1,
                paddingTop: 12,
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

function PlatformCTASlide({
  headline,
  support,
  ctaLine,
}: {
  headline: string;
  support: string;
  ctaLine: string;
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

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginBottom: 30,
        }}
      >
        The Marigold handles this
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 96,
          lineHeight: 1.0,
          color: "var(--cream)",
          textAlign: "center",
          maxWidth: 880,
          marginBottom: 28,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 28,
          fontWeight: 500,
          color: "var(--wine)",
          textAlign: "center",
          maxWidth: 820,
          lineHeight: 1.4,
          marginBottom: 36,
        }}
      >
        {support}
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
        {ctaLine}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}

export function WeddingSeasonPrepCarousel({
  seasonName,
  seasonDates,
  hypeText = "season is coming. let's make sure you're ready.",
  bookNow,
  startNow,
  decideNow,
  relaxAbout,
  ctaHeadline = "We've already done the math.",
  ctaSupport = "Vendor briefs, the 13-phase planner, and a 582-task checklist that knows what to do when.",
  ctaLine = "you handle the love. we handle the list.",
  slideIndex = 0,
}: WeddingSeasonPrepCarouselProps) {
  const safeIndex = Math.max(0, Math.min(slideIndex, 5));

  if (safeIndex === 0) {
    return <CoverSlide seasonName={seasonName} seasonDates={seasonDates} hypeText={hypeText} />;
  }
  if (safeIndex === 1) {
    return <CategorySlide category="book" items={bookNow.items} />;
  }
  if (safeIndex === 2) {
    return <CategorySlide category="start" items={startNow.items} />;
  }
  if (safeIndex === 3) {
    return <CategorySlide category="decide" items={decideNow.items} />;
  }
  if (safeIndex === 4) {
    return <CategorySlide category="relax" items={relaxAbout.items} />;
  }
  return <PlatformCTASlide headline={ctaHeadline} support={ctaSupport} ctaLine={ctaLine} />;
}
