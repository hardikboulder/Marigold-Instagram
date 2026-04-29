import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface BvMPostProps {
  brideQuote: string;
  brideAnnotation: string;
  momQuote: string;
  momAnnotation: string;
  ctaTagline?: string;
}

export function BvMPost({
  brideQuote,
  brideAnnotation,
  momQuote,
  momAnnotation,
  ctaTagline = "we have a tab for both of you",
}: BvMPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "var(--cream)",
        position: "relative",
      }}
    >
      <div
        style={{
          background: "var(--pink)",
          padding: "60px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <TapeStrip top={-28} left={30} rotation={-5} width={180} />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "rgba(255,255,255,0.35)",
            marginBottom: 8,
          }}
        >
          BRIDE
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 56,
            color: "white",
            lineHeight: 1.1,
            marginBottom: 16,
            whiteSpace: "pre-line",
          }}
        >
          {`"${brideQuote}"`}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 34,
            color: "var(--gold-light)",
            transform: "rotate(-2deg)",
          }}
        >
          {brideAnnotation}
        </div>
      </div>

      <div
        style={{
          background: "var(--wine)",
          padding: "60px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <PushPin variant="gold" top={20} right={30} />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 3,
            color: "rgba(237,147,177,0.35)",
            marginBottom: 8,
          }}
        >
          MOM
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 56,
            color: "white",
            lineHeight: 1.1,
            marginBottom: 16,
            whiteSpace: "pre-line",
          }}
        >
          {`"${momQuote}"`}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 34,
            color: "var(--gold)",
            transform: "rotate(2deg)",
          }}
        >
          {momAnnotation}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          fontFamily: "'Caveat', cursive",
          fontSize: 64,
          fontWeight: 700,
          color: "var(--gold)",
          textShadow: "2px 3px 0 rgba(0,0,0,0.2)",
          zIndex: 5,
        }}
      >
        vs.
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(75,21,40,0.9)",
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--hot-pink)",
          }}
        >
          The <i style={{ fontStyle: "italic" }}>Marigold</i>
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 30,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {ctaTagline}
        </div>
      </div>
    </div>
  );
}
