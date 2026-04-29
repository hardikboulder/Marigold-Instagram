import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface BvMStoryProps {
  brideQuote: string;
  brideAnnotation: string;
  momQuote: string;
  momAnnotation: string;
}

export function BvMStory({
  brideQuote,
  brideAnnotation,
  momQuote,
  momAnnotation,
}: BvMStoryProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--cream)",
      }}
    >
      <div
        style={{
          flex: 1,
          background: "var(--pink)",
          padding: "80px 72px 40px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <TapeStrip top={-28} left={60} rotation={-6} />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 12,
          }}
        >
          THE BRIDE
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 72,
            color: "white",
            lineHeight: 1.05,
            marginBottom: 20,
            whiteSpace: "pre-line",
          }}
        >
          {`"${brideQuote}"`}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 40,
            color: "var(--gold-light)",
            transform: "rotate(-2deg)",
          }}
        >
          {brideAnnotation}
        </div>
      </div>

      <div
        style={{
          height: 100,
          background: "var(--cream)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 72,
            fontWeight: 700,
            color: "var(--gold)",
            transform: "rotate(-8deg)",
          }}
        >
          vs.
        </div>
        <PushPin variant="pink" top={-24} right={100} />
      </div>

      <div
        style={{
          flex: 1,
          background: "var(--wine)",
          padding: "40px 72px 40px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "rgba(237,147,177,0.4)",
            marginBottom: 12,
          }}
        >
          THE MOM
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 72,
            color: "white",
            lineHeight: 1.05,
            marginBottom: 20,
            whiteSpace: "pre-line",
          }}
        >
          {`"${momQuote}"`}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 40,
            color: "var(--gold)",
            transform: "rotate(2deg)",
          }}
        >
          {momAnnotation}
        </div>
        <PushPin variant="gold" bottom={120} right={60} />
      </div>

      <CTABar />
    </div>
  );
}
