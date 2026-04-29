import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  ConfessionalCard,
  ConfessionalCTA,
  ConfessionalTitle,
} from "@/components/templates/confessional";

const SLIDES = [
  { label: "Title Slide", node: <ConfessionalTitle /> },
  {
    label: "Confession — Blush",
    node: (
      <ConfessionalCard
        variant="blush"
        confessionNumber={1}
        confessionText={`"I told my mom the decorator was fully booked so she'd stop sending me mandap photos. The decorator was not booked."`}
        attribution="— ANONYMOUS BRIDE, 2026"
      />
    ),
  },
  {
    label: "Confession — Gold",
    node: (
      <ConfessionalCard
        variant="gold"
        confessionNumber={2}
        confessionText={`"My MIL added 40 people to the guest list while I was on vacation. I found out from the caterer."`}
        attribution="— ANONYMOUS BRIDE, 2026"
      />
    ),
  },
  {
    label: "Confession — Lavender",
    node: (
      <ConfessionalCard
        variant="lavender"
        confessionNumber={3}
        confessionText={`"I created a fake 'venue availability' email to convince my parents we couldn't do a Tuesday wedding."`}
        attribution="— ANONYMOUS GROOM, 2025"
      />
    ),
  },
  { label: "Submit Your Confession", node: <ConfessionalCTA /> },
];

export default function ConfessionalTestPage() {
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
          SERIES 02
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          The <i style={{ color: "var(--hot-pink)" }}>Confessional</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Title slide, three confession variants (blush / gold / lavender), and
          the Submit CTA — sample copy lifted from{" "}
          <code>docs/marigold-instagram-templates.html</code>.
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
        {SLIDES.map((slide) => (
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
              {slide.label} (1080 × 1920)
            </div>
            <TemplateFrame format="story">{slide.node}</TemplateFrame>
          </div>
        ))}
      </div>
    </main>
  );
}
