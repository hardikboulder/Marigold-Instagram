import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface PlannerProfilePostProps {
  plannerName: string;
  companyName: string;
  plannerLocation: string;
  specialties: string[];
  pullQuote: string;
  weddingsPlanned: number;
  yearsExperience: number;
  imageUrl?: string;
}

export function PlannerProfilePost({
  plannerName,
  companyName,
  plannerLocation,
  specialties,
  pullQuote,
  weddingsPlanned,
  yearsExperience,
  imageUrl,
}: PlannerProfilePostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        display: "flex",
      }}
    >
      <TapeStrip top={56} left={392} rotation={-6} width={300} height={56} />

      <div
        style={{
          flex: "0 0 40%",
          padding: "120px 32px 160px 56px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "var(--blush)",
            border: "8px solid var(--hot-pink)",
            boxShadow: "0 12px 28px rgba(75,21,40,0.18)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={plannerName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 32,
                color: "var(--mauve)",
                opacity: 0.6,
                padding: "0 20px",
                lineHeight: 1.2,
              }}
            >
              planner photo
            </div>
          )}
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 56,
            lineHeight: 1.05,
            color: "var(--wine)",
            marginBottom: 12,
          }}
        >
          {plannerName}
        </div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: 1,
            color: "var(--mauve)",
            marginBottom: 18,
          }}
        >
          {companyName}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 32,
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transform: "rotate(-2deg)",
          }}
        >
          <PinIcon />
          {plannerLocation}
        </div>
      </div>

      <div
        style={{
          flex: "0 0 60%",
          padding: "100px 72px 160px 48px",
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: "var(--cream)",
            border: "1px solid rgba(212,168,83,0.35)",
            borderRadius: 12,
            boxShadow: "0 14px 32px rgba(75,21,40,0.10)",
            padding: "48px 44px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            MEET THE PLANNER
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {specialties.map((specialty) => (
              <span
                key={specialty}
                style={{
                  background: "var(--hot-pink)",
                  color: "white",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "8px 16px",
                  borderRadius: 999,
                }}
              >
                {specialty}
              </span>
            ))}
          </div>

          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 38,
              lineHeight: 1.25,
              color: "var(--wine)",
            }}
          >
            &ldquo;{pullQuote}&rdquo;
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(75,21,40,0.15)",
              paddingTop: 20,
              display: "flex",
              gap: 28,
              alignItems: "center",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--mauve)",
              letterSpacing: 0.5,
            }}
          >
            <span>
              <strong style={{ color: "var(--wine)", fontWeight: 700 }}>
                {weddingsPlanned}
              </strong>{" "}
              weddings planned
            </span>
            <span style={{ color: "var(--gold)" }}>·</span>
            <span>
              <strong style={{ color: "var(--wine)", fontWeight: 700 }}>
                {yearsExperience}
              </strong>{" "}
              years experience
            </span>
          </div>
        </div>
      </div>

      <CTABar variant="overlay" handleText="PLANNER SPOTLIGHT" />
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block" }}
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
        fill="var(--gold)"
      />
    </svg>
  );
}
