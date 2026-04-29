import { CTABar } from "@/components/brand/CTABar";

export interface BrideMatchProfilePostProps {
  brideName: string;
  brideAge: number;
  planningCity: string;
  weddingMonth: string;
  weddingYear: number;
  lookingFor: string[];
  promptQuestion: string;
  promptAnswer: string;
  imageUrl?: string;
}

function PinIcon({ size = 22, color = "var(--pink)" }: { size?: number; color?: string }) {
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
        d="M12 2C7.6 2 4 5.6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
        fill={color}
      />
    </svg>
  );
}

export function BrideMatchProfilePost({
  brideName,
  brideAge,
  planningCity,
  weddingMonth,
  weddingYear,
  lookingFor,
  promptQuestion,
  promptAnswer,
  imageUrl,
}: BrideMatchProfilePostProps) {
  const tags = lookingFor.slice(0, 4);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--blush)",
        position: "relative",
        overflow: "hidden",
        padding: "60px 56px 110px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span>THE MARIGOLD</span>
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "var(--pink)",
          }}
        />
        <span style={{ color: "var(--pink)" }}>BRIDE CONNECT</span>
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 28,
          color: "var(--mauve)",
          marginBottom: 18,
        }}
      >
        find your planning bestie
      </div>

      <div
        style={{
          width: "100%",
          flex: 1,
          background: "white",
          borderRadius: 36,
          boxShadow:
            "0 20px 50px rgba(75,21,40,0.12), 0 6px 16px rgba(212,83,126,0.10)",
          padding: "44px 44px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 188,
            height: 188,
            borderRadius: "50%",
            background: imageUrl ? `url(${imageUrl})` : "var(--blush)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "6px solid var(--pink)",
            boxShadow:
              "0 0 0 3px white, 0 0 0 6px rgba(212,83,126,0.18), 0 8px 18px rgba(75,21,40,0.14)",
            display: imageUrl ? undefined : "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {!imageUrl && (
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 3,
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
            fontSize: 60,
            color: "var(--wine)",
            lineHeight: 1.0,
            marginBottom: 12,
          }}
        >
          {brideName}, {brideAge}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--mauve)",
            }}
          >
            <PinIcon />
            <span>Planning in {planningCity}</span>
          </div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              background: "var(--pink)",
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            {weddingMonth} {weddingYear}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            borderTop: "1px dashed rgba(212,83,126,0.4)",
            paddingTop: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "var(--pink)",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            LOOKING FOR
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "var(--blush)",
                  color: "var(--wine)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  border: "1px solid rgba(212,83,126,0.25)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            background: "var(--cream)",
            borderRadius: 22,
            padding: "20px 22px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 28,
              color: "var(--gold)",
              marginBottom: 6,
              transform: "rotate(-1deg)",
            }}
          >
            {promptQuestion}
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 19,
              fontWeight: 500,
              color: "var(--wine)",
              lineHeight: 1.35,
            }}
          >
            {promptAnswer}
          </div>
        </div>

        <div
          style={{
            padding: "16px 36px",
            borderRadius: 999,
            background: "var(--wine)",
            color: "var(--cream)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            boxShadow: "0 6px 14px rgba(75,21,40,0.25)",
          }}
        >
          Connect on The Marigold
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
