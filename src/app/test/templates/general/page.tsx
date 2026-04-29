import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  FeatureCallout,
  StatCallout,
  VendorQuote,
} from "@/components/templates/general";

const VENDOR_QUOTE = {
  quote: "Your Pinterest board with 400 pins isn't a brief. It's a cry for help.",
  attribution: "— ANONYMOUS PHOTOGRAPHER",
  tagline: "The Marigold turns 400 pins into one Brief.",
  seriesLabel: "Things Your Vendor Wishes You Knew",
};

const FEATURE_CALLOUT = {
  categoryLabel: "DID YOU KNOW",
  headline: "Your décor palette\nflows to *every*\nworkspace.",
  annotation: "stationery, wardrobe, cake — all synced",
  ctaText: "EXPLORE WORKSPACES",
};

const STAT_CALLOUT = {
  statNumber: "582",
  statLabel: "PLANNING TASKS",
  description:
    "From \"discuss overall wedding vision\" to \"confirm the baraat horse.\" We thought of everything so you don't have to.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

export default function GeneralTemplatesTestPage() {
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
          BONUS
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          General Purpose <i style={{ color: "var(--pink)" }}>Templates</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Vendor Quote, Feature Callout, and Stat Callout rendered with sample
          data lifted from <code>docs/marigold-instagram-templates.html</code>.
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
          <SectionLabel>Vendor Quote Post (1080 × 1080)</SectionLabel>
          <TemplateFrame format="post">
            <VendorQuote {...VENDOR_QUOTE} />
          </TemplateFrame>
        </div>

        <div>
          <SectionLabel>Feature Callout Post (1080 × 1080)</SectionLabel>
          <TemplateFrame format="post">
            <FeatureCallout {...FEATURE_CALLOUT} />
          </TemplateFrame>
        </div>

        <div>
          <SectionLabel>Stat Callout Story (1080 × 1920)</SectionLabel>
          <TemplateFrame format="story">
            <StatCallout {...STAT_CALLOUT} />
          </TemplateFrame>
        </div>
      </div>
    </main>
  );
}
