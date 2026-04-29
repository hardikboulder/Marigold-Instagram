import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface BrideOfTheWeekPostProps {
  brideName: string;
  brideLocation: string;
  weddingDate: string;
  guestCount: string;
  advice: string;
  favoriteFeature: string;
  imageUrl?: string;
}

function CrownGlyph({ size = 38, color = "var(--gold)" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size * (24 / 36)}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2 22 L4 6 L11 14 L18 2 L25 14 L32 6 L34 22 Z"
        fill={color}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx="4" cy="6" r="2" fill={color} />
      <circle cx="18" cy="2" r="2" fill={color} />
      <circle cx="32" cy="6" r="2" fill={color} />
    </svg>
  );
}

export function BrideOfTheWeekPost({
  brideName,
  brideLocation,
  weddingDate,
  guestCount,
  advice,
  favoriteFeature,
  imageUrl,
}: BrideOfTheWeekPostProps) {
  const stats = [brideLocation, weddingDate, guestCount].filter(Boolean).join(" · ");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--gold-light)",
        position: "relative",
        overflow: "hidden",
        padding: "92px 80px 160px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <TapeStrip top={28} left={120} rotation={-6} width={200} height={50} />
      <TapeStrip bottom={150} right={70} rotation={4} width={180} height={48} />
      <PushPin variant="pink" size={32} top={60} right={120} />
      <PushPin variant="gold" size={28} bottom={170} left={90} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 38,
        }}
      >
        <CrownGlyph size={42} color="var(--gold)" />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--wine)",
          }}
        >
          Bride of the Week
        </div>
        <CrownGlyph size={42} color="var(--gold)" />
      </div>

      <div
        style={{
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: imageUrl ? `url(${imageUrl})` : "rgba(75,21,40,0.08)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "8px solid var(--gold)",
          boxShadow:
            "0 0 0 4px var(--gold-light), 0 0 0 8px rgba(212,168,83,0.25), 0 12px 28px rgba(75,21,40,0.18)",
          display: imageUrl ? undefined : "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 36,
        }}
      >
        {!imageUrl && (
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(75,21,40,0.35)",
            }}
          >
            BRIDE PHOTO
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 76,
          color: "var(--wine)",
          textAlign: "center",
          lineHeight: 1.05,
          marginBottom: 22,
        }}
      >
        {brideName}
      </div>

      {stats && (
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: 2,
            color: "var(--mauve)",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          {stats}
        </div>
      )}

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 50,
          color: "var(--pink)",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 760,
          marginBottom: 30,
          transform: "rotate(-1deg)",
        }}
      >
        “{advice}”
      </div>

      {favoriteFeature && (
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 1,
            color: "var(--wine)",
            textAlign: "center",
          }}
        >
          <span style={{ color: "var(--mauve)", fontWeight: 500 }}>Loves: </span>
          {favoriteFeature}
        </div>
      )}

      <CTABar variant="overlay" />
    </div>
  );
}
