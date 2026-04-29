import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export function ConfessionalCTA() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--pink)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 100,
        position: "relative",
      }}
    >
      <PushPin variant="gold" top={160} left={100} />
      <PushPin variant="red" top={280} right={120} />

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 96,
          color: "white",
          lineHeight: 1.05,
          marginBottom: 32,
        }}
      >
        Got a
        <br />
        <i style={{ color: "var(--gold-light)" }}>confession?</i>
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 52,
          color: "rgba(255,255,255,0.6)",
          marginBottom: 60,
          transform: "rotate(-2deg)",
        }}
      >
        anonymous. judgment-free. pinky promise.
      </div>
      <div
        style={{
          background: "white",
          color: "var(--deep-pink)",
          fontFamily: "'Syne', sans-serif",
          fontSize: 32,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 3,
          padding: "36px 72px",
          boxShadow: "6px 6px 0 var(--wine)",
          transform: "rotate(-1deg)",
        }}
      >
        LINK IN BIO
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: "rgba(255,255,255,0.35)",
          marginTop: 32,
        }}
      >
        your secret is safe with 10,000 brides
      </div>

      <CTABar variant="light" />
    </div>
  );
}
