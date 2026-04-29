import { CTABar } from "@/components/brand/CTABar";

export interface BrideMatchDuoPostProps {
  brideAName: string;
  brideACity: string;
  brideADate: string;
  brideAImageUrl?: string;
  brideBName: string;
  brideBCity: string;
  brideBDate: string;
  brideBImageUrl?: string;
  sharedQuote: string;
}

function HeartGlyph({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 21s-7-4.5-9.5-9C0.8 8.6 2.7 4.5 6.5 4.5c2 0 3.4 1.1 4.4 2.6h0.2c1-1.5 2.4-2.6 4.4-2.6 3.8 0 5.7 4.1 4 7.5C19 16.5 12 21 12 21z"
        fill="var(--pink)"
        stroke="var(--wine)"
        strokeWidth={1.2}
      />
    </svg>
  );
}

function BrideAvatar({
  imageUrl,
  name,
  city,
  date,
}: {
  imageUrl?: string;
  name: string;
  city: string;
  date: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        flex: 1,
      }}
    >
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: imageUrl ? `url(${imageUrl})` : "rgba(75,21,40,0.06)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "6px solid var(--gold)",
          boxShadow:
            "0 0 0 4px var(--cream), 0 0 0 8px rgba(212,168,83,0.25), 0 12px 26px rgba(75,21,40,0.16)",
          display: imageUrl ? undefined : "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!imageUrl && (
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 4,
              color: "rgba(75,21,40,0.4)",
              textTransform: "uppercase",
            }}
          >
            PHOTO
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 44,
          color: "var(--wine)",
          lineHeight: 1.0,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 1.5,
          color: "var(--mauve)",
          textTransform: "uppercase",
        }}
      >
        {city}
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: 3,
          color: "var(--pink)",
          textTransform: "uppercase",
        }}
      >
        {date}
      </div>
    </div>
  );
}

export function BrideMatchDuoPost({
  brideAName,
  brideACity,
  brideADate,
  brideAImageUrl,
  brideBName,
  brideBCity,
  brideBDate,
  brideBImageUrl,
  sharedQuote,
}: BrideMatchDuoPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--gold-light)",
        position: "relative",
        overflow: "hidden",
        padding: "70px 70px 130px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        MATCHED!
        <span style={{ fontSize: 30 }}>💛</span>
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: "var(--pink)",
          textAlign: "center",
          transform: "rotate(-1deg)",
          marginBottom: 44,
        }}
      >
        they found each other on The Marigold
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 24,
          position: "relative",
          marginBottom: 40,
        }}
      >
        <BrideAvatar
          imageUrl={brideAImageUrl}
          name={brideAName}
          city={brideACity}
          date={brideADate}
        />

        <div
          style={{
            position: "absolute",
            top: 100,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 5,
          }}
        >
          <svg
            width={180}
            height={20}
            viewBox="0 0 180 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <line
              x1="6"
              y1="10"
              x2="174"
              y2="10"
              stroke="var(--gold)"
              strokeWidth={3}
              strokeDasharray="6 8"
              strokeLinecap="round"
            />
          </svg>
          <HeartGlyph size={42} />
        </div>

        <BrideAvatar
          imageUrl={brideBImageUrl}
          name={brideBName}
          city={brideBCity}
          date={brideBDate}
        />
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 38,
          color: "var(--wine)",
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: 820,
          padding: "0 40px",
        }}
      >
        “{sharedQuote}”
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
