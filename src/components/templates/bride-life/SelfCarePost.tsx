import { CTABar } from "@/components/brand/CTABar";
import { HeartGlyph, SelfCareIconGlyph, type SelfCareIcon } from "./BrideLifeIcons";

export interface SelfCareItem {
  text: string;
  icon: SelfCareIcon;
}

export interface SelfCarePostProps {
  title: string;
  items: SelfCareItem[];
  bottomNote: string;
}

export function SelfCarePost({ title, items, bottomNote }: SelfCarePostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "var(--blush)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 90px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 14%, rgba(224,208,240,0.55), transparent 52%), radial-gradient(circle at 84% 22%, rgba(255,248,242,0.85), transparent 50%), radial-gradient(circle at 24% 86%, rgba(255,216,184,0.35), transparent 48%), radial-gradient(circle at 78% 78%, rgba(251,234,240,0.9), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, transparent 60%, rgba(138,96,112,0.06) 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 28,
          position: "relative",
          zIndex: 2,
        }}
      >
        <HeartGlyph size={22} color="var(--mauve)" />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--mauve)",
            lineHeight: 1,
          }}
        >
          Bride Life
        </div>
        <HeartGlyph size={22} color="var(--mauve)" />
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 64,
          lineHeight: 1.12,
          color: "var(--wine)",
          textAlign: "center",
          maxWidth: 820,
          marginBottom: 64,
          position: "relative",
          zIndex: 2,
        }}
      >
        {title}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 760,
          display: "flex",
          flexDirection: "column",
          gap: 26,
          position: "relative",
          zIndex: 2,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              padding: "20px 28px",
              background: "rgba(255,248,242,0.55)",
              border: "1px solid rgba(138,96,112,0.12)",
              borderRadius: 18,
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(212,168,83,0.18)",
              }}
            >
              <SelfCareIconGlyph icon={item.icon} size={32} color="var(--mauve)" />
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 500,
                color: "var(--wine)",
                lineHeight: 1.3,
              }}
            >
              {item.text}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 42,
          color: "var(--mauve)",
          textAlign: "center",
          maxWidth: 720,
          lineHeight: 1.25,
          marginTop: 44,
          transform: "rotate(-1.5deg)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {bottomNote}
      </div>

      <CTABar
        variant="overlay"
        style={{ background: "rgba(138,96,112,0.92)" }}
        logoColor="var(--blush)"
        handleColor="rgba(255,248,242,0.55)"
      />
    </div>
  );
}
