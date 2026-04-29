import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface ChecklistStoryProps {
  checklistTitle: string;
  items: string[];
  annotation?: string;
}

const LINED_PAPER =
  "url(\"data:image/svg+xml,%3Csvg width='100%25' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='79' x2='100%25' y2='79' stroke='%23E0D0C0' stroke-width='1.2'/%3E%3C/svg%3E\")";

export function ChecklistStory({
  checklistTitle,
  items,
  annotation,
}: ChecklistStoryProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: LINED_PAPER,
          backgroundRepeat: "repeat",
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 90,
          top: 0,
          bottom: 0,
          width: 3,
          background: "var(--hot-pink)",
          opacity: 0.55,
        }}
      />

      <PushPin variant="pink" top={70} left="50%" style={{ transform: "translateX(-50%)" }} />
      <TapeStrip
        top={150}
        left="50%"
        rotation={-3}
        width={260}
        height={50}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "240px 90px 0 130px",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: 14,
          }}
        >
          Checklist
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 88,
            lineHeight: 1.0,
            color: "var(--wine)",
            marginBottom: 50,
          }}
        >
          {checklistTitle}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 2,
          padding: "0 90px 0 130px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 22,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              lineHeight: 1.35,
              fontWeight: 500,
              color: "var(--wine)",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 38,
                height: 38,
                borderRadius: 6,
                border: "3px solid var(--gold)",
                background: "white",
                marginTop: 6,
              }}
            />
            <div>{item}</div>
          </div>
        ))}
      </div>

      {annotation && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "30px 90px 240px",
            fontFamily: "'Caveat', cursive",
            fontSize: 48,
            color: "var(--deep-pink)",
            transform: "rotate(-2deg)",
            transformOrigin: "left center",
            marginLeft: 130 - 90,
          }}
        >
          {annotation}
        </div>
      )}

      <CTABar />
    </div>
  );
}
