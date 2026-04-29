import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export function ConfessionalTitle() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 80,
        position: "relative",
      }}
    >
      <PushPin variant="pink" top={120} left={80} />
      <PushPin variant="gold" top={200} right={100} />
      <PushPin variant="blue" bottom={350} left={140} />
      <PushPin variant="red" bottom={500} right={80} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 6,
          color: "var(--hot-pink)",
          marginBottom: 24,
        }}
      >
        THE MARIGOLD PRESENTS
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 140,
          color: "white",
          lineHeight: 0.95,
          marginBottom: 24,
        }}
      >
        The
        <br />
        <i style={{ color: "var(--hot-pink)" }}>Confessional</i>
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 48,
          color: "var(--gold)",
          transform: "rotate(-3deg)",
          marginBottom: 40,
        }}
      >
        anonymous. unfiltered. very real.
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: "rgba(255,255,255,0.25)",
        }}
      >
        SWIPE FOR CONFESSIONS →
      </div>

      <CTABar />
    </div>
  );
}
