import { CTABar } from "@/components/brand/CTABar";

export interface SaveVsSplurgePostProps {
  saveItems?: string[];
  splurgeItems?: string[];
  bottomLine?: string;
}

const DEFAULT_SAVE: string[] = [
  "Save-the-dates (text the group chat)",
  "Welcome bag swag — keep it light",
  "Premium liquor after the first round",
  "Calligraphed escort cards",
  "Mandap florals out of camera",
];

const DEFAULT_SPLURGE: string[] = [
  "Photographer (50 years of looking back)",
  "Food. Always the food.",
  "DJ or band — empty floors are a tragedy",
  "Bridal hair & makeup trial",
  "A real day-of coordinator",
];

function CheckIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="var(--wine)" opacity={0.15} />
      <path
        d="M6.5 12.5l3.6 3.6L17.5 8.7"
        stroke="var(--wine)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function StarIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.16l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93z"
        fill="var(--wine)"
      />
    </svg>
  );
}

export function SaveVsSplurgePost({
  saveItems,
  splurgeItems,
  bottomLine = "Nobody remembers the napkins. Everyone remembers the food.",
}: SaveVsSplurgePostProps) {
  const saves = saveItems && saveItems.length > 0 ? saveItems : DEFAULT_SAVE;
  const splurges =
    splurgeItems && splurgeItems.length > 0 ? splurgeItems : DEFAULT_SPLURGE;

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
          top: 0,
          bottom: 0,
          left: 0,
          width: "50%",
          background: "var(--mint)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "50%",
          background: "var(--hot-pink)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 4,
          background: "var(--gold)",
          opacity: 0.85,
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-4deg)",
          fontFamily: "'Caveat', cursive",
          fontSize: 56,
          color: "var(--wine)",
          background: "var(--cream)",
          padding: "10px 28px",
          borderRadius: 999,
          boxShadow: "0 6px 22px rgba(75,21,40,0.18)",
          border: "2px solid var(--gold)",
          zIndex: 5,
          whiteSpace: "nowrap",
        }}
      >
        choose wisely
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          position: "relative",
          zIndex: 2,
          padding: "100px 0 220px",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "0 60px",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: 8,
              color: "var(--wine)",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            SAVE
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 32,
              color: "var(--wine)",
              opacity: 0.7,
              marginBottom: 36,
            }}
          >
            here, with our blessing
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {saves.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 26,
                  fontWeight: 500,
                  color: "var(--wine)",
                  lineHeight: 1.25,
                }}
              >
                <CheckIcon size={32} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "0 60px",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: 8,
              color: "var(--wine)",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            SPLURGE
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 32,
              color: "var(--wine)",
              opacity: 0.8,
              marginBottom: 36,
            }}
          >
            this is where it counts
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {splurges.map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 26,
                  fontWeight: 500,
                  color: "var(--wine)",
                  lineHeight: 1.25,
                }}
              >
                <StarIcon size={32} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 130,
          padding: "0 80px",
          textAlign: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "var(--cream)",
            padding: "20px 36px",
            borderRadius: 14,
            boxShadow: "0 6px 24px rgba(75,21,40,0.16)",
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 36,
            color: "var(--wine)",
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          {bottomLine}
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
