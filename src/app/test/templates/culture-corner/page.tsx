"use client";

import { useState } from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  FamilyRolesPost,
  FusionWeddingPost,
  RegionalSpotlightCarousel,
  TraditionExplainedPost,
} from "@/components/templates/culture-corner";

const TRADITION_SAMPLE = {
  traditionName: "The Kanyadaan",
  meaning:
    "The giving away of the bride by her father — a moment that signifies the merging of two families. Rooted in the Sanskrit kanya (daughter) and daan (gift), it is the most emotional ritual of a Hindu wedding ceremony.",
  modernContext:
    "many couples today have both parents perform the kanyadaan together — or skip it entirely.",
  decorativeIcon: "diya" as const,
};

const REGIONAL_SAMPLE = {
  regionName: "The Punjabi Wedding",
  regionSubtitle: "energy, emotion, and a LOT of dancing",
  regionColor: "deep-pink" as const,
  slides: [
    {
      title: "Roka, Sangeet, Phere — back to back to back",
      content:
        "A Punjabi wedding stretches across at least four events: Roka, Sangeet, Mehendi, and the wedding day itself with Anand Karaj or pheras. Expect a baraat with a horse, dhol players, and a procession that takes its time.",
    },
    {
      title: "Lehengas, paranda, and a sherwani for him",
      content:
        "Brides typically wear a heavily embroidered red or pink lehenga with kundan jewelry, a kaleera tied to the wrist, and a paranda braided into the hair. The groom wears a sherwani with a sehra or safa turban.",
    },
    {
      title: "Sarson da saag, butter chicken, and the chaat counter",
      content:
        "Punjabi weddings live and die by the food. The buffet is non-negotiable: tandoori spreads, paneer in three forms, kulfi falooda, and a live chaat counter that runs all night. Dessert is jalebi with rabri, always.",
    },
    {
      title: "Dhol, bhangra, and the DJ that knows every Diljit drop",
      content:
        "Live dhol players lead the baraat. The sangeet is choreographed by the cousins. Expect bhangra, gidda, and a DJ who can flip from old-school Daler Mehndi to Diljit without losing the dance floor for a single beat.",
    },
    {
      title: "Kaleere, joota chupai, and the chura ceremony",
      content:
        "The chura ceremony — red and white bangles slipped on by the bride's mama — is signature Punjabi. Joota chupai (stealing the groom's shoes) is a friendly ransom war. And kaleere are dropped on cousins to bless the next bride.",
    },
  ],
};

const FUSION_SAMPLE = {
  tradition1: "Hindu",
  tradition2: "Catholic",
  color1: "wine" as const,
  color2: "deep-pink" as const,
  blendingTips: [
    "Pick one ceremony from each tradition — don't try to do all of them.",
    "Agree on the muhurat first, then the church time slots in.",
    "Brief both sets of family elders on the order of events together.",
    "Print a two-language program so guests can follow along.",
  ],
  annotation: "two families, two traditions, one (very long) ceremony",
};

const FAMILY_ROLES_SAMPLE = {
  guideTitle: "The Extended Family Guide",
  subtitle: "who's who at a desi wedding",
  roles: [
    {
      title: "The Mama",
      relationship: "maternal uncle",
      description:
        "Mom's brother. Will give a speech at the sangeet whether anyone asked or not.",
      annotation: "speech is non-negotiable",
    },
    {
      title: "The Bua",
      relationship: "paternal aunt",
      description:
        "Dad's sister. Has very specific opinions about the menu, the flowers, and the cousin's outfit.",
      annotation: "has opinions about the menu",
    },
    {
      title: "The Chacha",
      relationship: "paternal uncle (younger)",
      description:
        "Dad's younger brother. The cool uncle. Will sneak you the good whisky at the cocktail hour.",
      annotation: "the cool one. always.",
    },
    {
      title: "The Nani",
      relationship: "maternal grandmother",
      description:
        "Mom's mom. The matriarch. Will cry the moment you walk down the aisle. Bring a tissue.",
      annotation: "will cry. you will too.",
    },
    {
      title: "The Bhabhi",
      relationship: "elder brother's wife",
      description:
        "Your secret co-conspirator. Knows everything about everyone and shares strategically.",
      annotation: "your secret weapon",
    },
    {
      title: "The Saala",
      relationship: "wife's brother",
      description:
        "Bride's brother. Will steal the groom's shoes during joota chupai and demand a hefty ransom to return them.",
      annotation: "stealing shoes since 1900",
    },
  ],
};

const STATIC_SLIDES = [
  {
    label: "Tradition Explained — Post",
    format: "post" as const,
    node: <TraditionExplainedPost {...TRADITION_SAMPLE} />,
  },
  {
    label: "Fusion Wedding — Post",
    format: "post" as const,
    node: <FusionWeddingPost {...FUSION_SAMPLE} />,
  },
  {
    label: "Family Roles — Post",
    format: "post" as const,
    node: <FamilyRolesPost {...FAMILY_ROLES_SAMPLE} />,
  },
];

export default function CultureCornerTestPage() {
  const [carouselSlide, setCarouselSlide] = useState(1);
  const totalSlides = REGIONAL_SAMPLE.slides.length + 2;

  return (
    <main style={{ background: "#f0f0f0", padding: 40, minHeight: "100vh" }}>
      <header style={{ marginBottom: 32, maxWidth: 720 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "var(--mauve)",
            marginBottom: 6,
          }}
        >
          CULTURE CORNER
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          South Asian <i style={{ color: "var(--mauve)" }}>traditions</i>,
          explained
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Tradition explainers, regional spotlights, fusion guides, and a
          family-role cheat sheet. Wine-dominant palette, mandala motif.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          overflowX: "auto",
          paddingBottom: 24,
        }}
      >
        {STATIC_SLIDES.map((slide) => (
          <div key={slide.label}>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "var(--mauve)",
                marginBottom: 8,
              }}
            >
              {slide.label}
            </div>
            <TemplateFrame format={slide.format}>{slide.node}</TemplateFrame>
          </div>
        ))}
      </div>

      <section style={{ marginTop: 40 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "var(--mauve)",
            marginBottom: 12,
          }}
        >
          Regional Spotlight Carousel — slide {carouselSlide} / {totalSlides}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {Array.from({ length: totalSlides }).map((_, i) => {
            const idx = i + 1;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCarouselSlide(idx)}
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid var(--mauve)",
                  background:
                    carouselSlide === idx ? "var(--wine)" : "white",
                  color:
                    carouselSlide === idx ? "var(--cream)" : "var(--wine)",
                  cursor: "pointer",
                }}
              >
                {idx}
              </button>
            );
          })}
        </div>

        <TemplateFrame format="post">
          <RegionalSpotlightCarousel
            {...REGIONAL_SAMPLE}
            slideIndex={carouselSlide}
          />
        </TemplateFrame>
      </section>
    </main>
  );
}
