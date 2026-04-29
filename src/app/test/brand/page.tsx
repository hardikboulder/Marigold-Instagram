import { CTABar, type CTABarVariant } from "@/components/brand/CTABar";
import { PushPin, type PushPinVariant } from "@/components/brand/PushPin";
import { StickyNote } from "@/components/brand/StickyNote";
import { TapeStrip } from "@/components/brand/TapeStrip";
import { TemplateFrame } from "@/components/brand/TemplateFrame";

const PIN_VARIANTS: PushPinVariant[] = ["pink", "red", "gold", "blue"];
const CTA_VARIANTS: CTABarVariant[] = ["default", "overlay", "light"];

const STICKY_DEMO = [
  {
    color: "blush" as const,
    rotation: -2,
    pinVariant: "pink" as const,
    lined: false,
    label: "Blush — pink pin, −2°",
    confessionLabel: "CONFESSION #01",
    confessionLabelColor: "var(--pink)",
    body:
      '"I told my mom the decorator was fully booked so she\'d stop sending me mandap photos. The decorator was not booked."',
  },
  {
    color: "gold" as const,
    rotation: 1.5,
    pinVariant: "gold" as const,
    lined: true,
    label: "Gold — gold pin, +1.5°, lined",
    confessionLabel: "CONFESSION #02",
    confessionLabelColor: "var(--gold)",
    body:
      '"My MIL added 40 people to the guest list while I was on vacation. I found out from the caterer."',
  },
  {
    color: "lavender" as const,
    rotation: -1,
    pinVariant: "blue" as const,
    lined: false,
    label: "Lavender — blue pin, −1°",
    confessionLabel: "CONFESSION #03",
    confessionLabelColor: "var(--deep-pink)",
    body:
      '"I created a fake \'venue availability\' email to convince my parents we couldn\'t do a Tuesday wedding."',
  },
];

export default function BrandTestPage() {
  return (
    <main style={{ background: "#f0f0f0", padding: 40, minHeight: "100vh" }}>
      <header style={{ marginBottom: 48, maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          Brand Components — <i style={{ color: "var(--pink)" }}>Visual Test</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Every shared component rendered in isolation against the original HTML
          reference. Compare side-by-side with{" "}
          <code>docs/marigold-instagram-templates.html</code>.
        </p>
      </header>

      <Section
        eyebrow="01"
        title="TemplateFrame"
        description="Story → 270×480 preview (0.25 scale). Post → 320×320 preview (0.2963 scale). Empty inner so the frame's border-radius and box-shadow are visible."
      >
        <Row>
          <Labeled label="Story (empty)">
            <TemplateFrame format="story">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--cream)",
                }}
              />
            </TemplateFrame>
          </Labeled>
          <Labeled label="Post (empty)">
            <TemplateFrame format="post">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--cream)",
                }}
              />
            </TemplateFrame>
          </Labeled>
        </Row>
      </Section>

      <Section
        eyebrow="02"
        title="CTABar"
        description="Pinned to the bottom of a TemplateFrame. Logo: Instrument Serif with italic on “Marigold”. Handle: Syne uppercase 600 weight."
      >
        <Row>
          {CTA_VARIANTS.map((variant) => (
            <Labeled key={variant} label={`Variant: ${variant}`}>
              <TemplateFrame format="story">
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background:
                      variant === "overlay"
                        ? "var(--pink)"
                        : variant === "light"
                          ? "var(--pink)"
                          : "var(--cream)",
                    position: "relative",
                  }}
                >
                  <CTABar variant={variant} />
                </div>
              </TemplateFrame>
            </Labeled>
          ))}
          <Labeled label="With logoColor + handleColor overrides">
            <TemplateFrame format="story">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--wine)",
                  position: "relative",
                }}
              >
                <CTABar
                  logoColor="var(--gold-light)"
                  handleColor="rgba(255,255,255,0.3)"
                  handleText="@themarigold"
                />
              </div>
            </TemplateFrame>
          </Labeled>
        </Row>
      </Section>

      <Section
        eyebrow="03"
        title="TapeStrip"
        description="Semi-transparent gold rectangles. rgba(255,235,200,0.65) with rgba(212,168,83,0.12) border. Rotation, width, top, left, right are all controllable."
      >
        <Row>
          <Labeled label="3 strips — varying rotation/position">
            <TemplateFrame format="story">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--cream)",
                  position: "relative",
                }}
              >
                <TapeStrip top={120} left={120} rotation={-6} />
                <TapeStrip top={400} right={80} rotation={4} width={180} />
                <TapeStrip
                  top={760}
                  left="50%"
                  width={300}
                  style={{ transform: "translateX(-50%) rotate(-3deg)" }}
                />
                <TapeStrip bottom={240} left={60} rotation={2} width={200} />
              </div>
            </TemplateFrame>
          </Labeled>
        </Row>
      </Section>

      <Section
        eyebrow="04"
        title="PushPin"
        description="Circular radial-gradient pin. 4 variants. Default size 48px, override with `size`. Position via top/left/right/bottom."
      >
        <Row>
          {PIN_VARIANTS.map((variant) => (
            <Labeled key={variant} label={`${variant} — 48px`}>
              <PinSwatch variant={variant} />
            </Labeled>
          ))}
          <Labeled label="size variants — pink @ 24/48/72px">
            <div
              style={{
                position: "relative",
                width: 240,
                height: 96,
                background: "var(--cream)",
                borderRadius: 8,
                border: "1px dashed rgba(75,21,40,0.15)",
              }}
            >
              <PushPin variant="pink" size={24} top={36} left={32} />
              <PushPin variant="pink" size={48} top={24} left={96} />
              <PushPin variant="pink" size={72} top={12} left={160} />
            </div>
          </Labeled>
        </Row>
        <Row>
          <Labeled label="In context — story-scale frame, scattered">
            <TemplateFrame format="story">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--wine)",
                  position: "relative",
                }}
              >
                <PushPin variant="pink" top={120} left={80} />
                <PushPin variant="gold" top={200} right={100} />
                <PushPin variant="blue" bottom={350} left={140} />
                <PushPin variant="red" bottom={500} right={80} />
              </div>
            </TemplateFrame>
          </Labeled>
        </Row>
      </Section>

      <Section
        eyebrow="05"
        title="StickyNote"
        description="Card used in The Confessional. 780px wide, 80×72 padding, color-specific shadow. Pin always centered at top: −24px. `lined` adds 76px-interval ruled lines (gold variant)."
      >
        <Row>
          {STICKY_DEMO.map((demo) => (
            <Labeled key={demo.color} label={demo.label}>
              <TemplateFrame format="story">
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--cream)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 80,
                  }}
                >
                  <StickyNote
                    color={demo.color}
                    rotation={demo.rotation}
                    pinVariant={demo.pinVariant}
                    lined={demo.lined}
                  >
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 22,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: 4,
                        color: demo.confessionLabelColor,
                        marginBottom: 24,
                      }}
                    >
                      {demo.confessionLabel}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: 64,
                        lineHeight: 1.3,
                        color: "var(--wine)",
                        fontWeight: 500,
                      }}
                    >
                      {demo.body}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 24,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 3,
                        color: "var(--mauve)",
                        marginTop: 32,
                      }}
                    >
                      — ANONYMOUS BRIDE, 2026
                    </div>
                  </StickyNote>
                </div>
              </TemplateFrame>
            </Labeled>
          ))}
        </Row>
      </Section>
    </main>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 64 }}>
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
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 28,
          color: "var(--wine)",
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          color: "var(--mauve)",
          marginBottom: 24,
          maxWidth: 720,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 32,
        flexWrap: "wrap",
        alignItems: "flex-start",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
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
        {label}
      </div>
      {children}
    </div>
  );
}

function PinSwatch({ variant }: { variant: PushPinVariant }) {
  return (
    <div
      style={{
        position: "relative",
        width: 96,
        height: 96,
        background: "var(--cream)",
        borderRadius: 8,
        border: "1px dashed rgba(75,21,40,0.15)",
      }}
    >
      <PushPin variant={variant} top={24} left={24} />
    </div>
  );
}
