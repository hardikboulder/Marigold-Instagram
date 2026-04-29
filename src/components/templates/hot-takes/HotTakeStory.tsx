import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

import { FlameIcon } from "./FlameIcon";

export interface HotTakeStoryProps {
  hotTake: string;
  responsePrompt?: string;
  ctaText?: string;
}

export function HotTakeStory({
  hotTake,
  responsePrompt = "agree or fight me",
  ctaText = "Drop your take in the comments 👇",
}: HotTakeStoryProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "180px 90px 220px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 10%, rgba(212,168,83,0.22), transparent 50%), radial-gradient(circle at 80% 90%, rgba(237,147,177,0.18), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={90} left={90} />
      <PushPin variant="pink" top={90} right={90} />
      <TapeStrip
        top={170}
        left="50%"
        rotation={-3}
        width={280}
        height={56}
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 40,
          marginBottom: 28,
          position: "relative",
          zIndex: 2,
        }}
      >
        <FlameIcon size={88} />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: 14,
            textTransform: "uppercase",
            color: "var(--gold)",
            lineHeight: 1,
          }}
        >
          Hot Take
        </div>
        <FlameIcon size={88} />
      </div>

      <div
        style={{
          width: 160,
          height: 3,
          background: "var(--gold)",
          opacity: 0.5,
          marginBottom: 70,
          position: "relative",
          zIndex: 2,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 96,
            lineHeight: 1.08,
            color: "var(--cream)",
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          &ldquo;{hotTake}&rdquo;
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 80,
          color: "var(--gold)",
          transform: "rotate(-3deg)",
          marginTop: 40,
          marginBottom: 60,
          position: "relative",
          zIndex: 2,
        }}
      >
        {responsePrompt}
      </div>

      <PollOverlay />

      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: 1.5,
          color: "rgba(255,248,242,0.55)",
          textAlign: "center",
          marginTop: 36,
          position: "relative",
          zIndex: 2,
        }}
      >
        {ctaText}
      </div>

      <CTABar />
    </div>
  );
}

function PollOverlay() {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        position: "relative",
        zIndex: 2,
        marginTop: 16,
      }}
    >
      <PollOption
        label="AGREE"
        background="var(--hot-pink)"
        textColor="var(--wine)"
        rotation={-2}
      />
      <PollOption
        label="DISAGREE"
        background="var(--deep-pink)"
        textColor="var(--gold-light)"
        rotation={2}
      />
    </div>
  );
}

function PollOption({
  label,
  background,
  textColor,
  rotation,
}: {
  label: string;
  background: string;
  textColor: string;
  rotation: number;
}) {
  return (
    <div
      style={{
        background,
        padding: "32px 64px",
        borderRadius: 16,
        boxShadow: "0 8px 0 rgba(0,0,0,0.25), 0 12px 30px rgba(0,0,0,0.25)",
        transform: `rotate(${rotation}deg)`,
        border: "3px solid var(--cream)",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: textColor,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}
