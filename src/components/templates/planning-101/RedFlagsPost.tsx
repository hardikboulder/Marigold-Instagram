import { CTABar } from "@/components/brand/CTABar";

export type RedFlagCategory =
  | "vendor"
  | "venue"
  | "contract"
  | "caterer"
  | "photographer"
  | "decorator";

export interface RedFlag {
  flag: string;
  explanation: string;
}

export interface RedFlagsPostProps {
  flagCategory: RedFlagCategory;
  flags: RedFlag[];
  bottomAdvice: string;
}

const CATEGORY_LABEL: Record<RedFlagCategory, string> = {
  vendor: "IN A VENDOR",
  venue: "IN A VENUE",
  contract: "IN A CONTRACT",
  caterer: "IN A CATERER",
  photographer: "IN A PHOTOGRAPHER",
  decorator: "IN A DECORATOR",
};

function FlagIcon({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="6" width="3" height="56" fill="var(--gold)" />
      <path
        d="M13 10 L52 14 L42 24 L52 36 L13 32 Z"
        fill="var(--hot-pink)"
        stroke="var(--gold)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function RedFlagsPost({
  flagCategory,
  flags,
  bottomAdvice,
}: RedFlagsPostProps) {
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
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 12%, rgba(237,147,177,0.18), transparent 55%), radial-gradient(circle at 85% 90%, rgba(212,168,83,0.12), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          padding: "90px 80px 0",
          display: "flex",
          alignItems: "center",
          gap: 22,
          position: "relative",
          zIndex: 2,
        }}
      >
        <FlagIcon size={68} />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--hot-pink)",
            lineHeight: 1,
          }}
        >
          Red Flags
        </div>
      </div>

      <div
        style={{
          padding: "20px 80px 0",
          fontFamily: "'Caveat', cursive",
          fontSize: 44,
          color: "var(--gold)",
          transform: "rotate(-2deg)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {CATEGORY_LABEL[flagCategory].toLowerCase()}
      </div>

      <div
        style={{
          flex: 1,
          padding: "40px 80px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          position: "relative",
          zIndex: 2,
        }}
      >
        {flags.map((flag, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "var(--hot-pink)",
                marginTop: 12,
                boxShadow: "0 0 0 4px rgba(237,147,177,0.18)",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--cream)",
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {flag.flag}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 20,
                  lineHeight: 1.45,
                  color: "rgba(255,248,242,0.75)",
                }}
              >
                {flag.explanation}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "0 80px 130px",
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: "var(--gold)",
          textAlign: "center",
          transform: "rotate(-1.5deg)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {bottomAdvice}
      </div>

      <CTABar variant="light" />
    </div>
  );
}
