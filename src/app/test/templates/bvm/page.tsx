import { TemplateFrame } from "@/components/brand/TemplateFrame";
import { BvMPost, BvMStory } from "@/components/templates/bridezilla-vs-momzilla";

const SAMPLE = {
  brideQuote: "80 people,\nmax.",
  brideAnnotation: "she said, confidently",
  momQuote: "I have 347\non my list.",
  momAnnotation: "and that's just dad's side",
};

export default function BvMTestPage() {
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
          SERIES 01
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          Bridezilla <i style={{ color: "var(--pink)" }}>vs.</i> Momzilla
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Episode: Guest List Size. Story (1080×1920) and Post (1080×1080)
          rendered with sample data lifted from{" "}
          <code>docs/marigold-instagram-templates.html</code>.
        </p>
      </header>

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
            Story Template (1080 × 1920)
          </div>
          <TemplateFrame format="story">
            <BvMStory
              brideQuote={SAMPLE.brideQuote}
              brideAnnotation={SAMPLE.brideAnnotation}
              momQuote={SAMPLE.momQuote}
              momAnnotation={SAMPLE.momAnnotation}
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
            Post Template (1080 × 1080)
          </div>
          <TemplateFrame format="post">
            <BvMPost
              brideQuote={SAMPLE.brideQuote}
              brideAnnotation={SAMPLE.brideAnnotation}
              momQuote={SAMPLE.momQuote}
              momAnnotation={SAMPLE.momAnnotation}
              ctaTagline="we have a tab for both of you"
            />
          </TemplateFrame>
        </div>
      </div>
    </main>
  );
}
