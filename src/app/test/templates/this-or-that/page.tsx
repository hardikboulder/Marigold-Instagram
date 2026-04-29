import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  ThisOrThatPost,
  ThisOrThatStory,
  type ThisOrThatColorScheme,
} from "@/components/templates/this-or-that";

const SAMPLE = {
  topicLabel: "WEDDING VIBES",
  optionA: "Lehenga",
  optionAAnnotation: "main character energy",
  optionB: "Saree",
  optionBAnnotation: "classic, always",
};

const SCHEMES: ThisOrThatColorScheme[] = [
  "pink-wine",
  "cream-blush",
  "gold-lavender",
];

export default function ThisOrThatTestPage() {
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
            color: "var(--pink)",
            marginBottom: 6,
          }}
        >
          SERIES 05
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          This <i style={{ color: "var(--pink)" }}>or</i> That
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Quick-fire visual polls. Story (1080×1920) and Post (1080×1080)
          rendered across all three color schemes.
        </p>
      </header>

      {SCHEMES.map((scheme) => (
        <section key={scheme} style={{ marginBottom: 56 }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "var(--wine)",
              marginBottom: 16,
            }}
          >
            Color scheme: {scheme}
          </div>
          <div
            style={{
              display: "flex",
              gap: 32,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div>
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
                Story (1080 × 1920)
              </div>
              <TemplateFrame format="story">
                <ThisOrThatStory
                  topicLabel={SAMPLE.topicLabel}
                  optionA={SAMPLE.optionA}
                  optionAAnnotation={SAMPLE.optionAAnnotation}
                  optionB={SAMPLE.optionB}
                  optionBAnnotation={SAMPLE.optionBAnnotation}
                  colorScheme={scheme}
                />
              </TemplateFrame>
            </div>
            <div>
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
                Post (1080 × 1080)
              </div>
              <TemplateFrame format="post">
                <ThisOrThatPost
                  topicLabel={SAMPLE.topicLabel}
                  optionA={SAMPLE.optionA}
                  optionAAnnotation={SAMPLE.optionAAnnotation}
                  optionB={SAMPLE.optionB}
                  optionBAnnotation={SAMPLE.optionBAnnotation}
                  colorScheme={scheme}
                />
              </TemplateFrame>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
