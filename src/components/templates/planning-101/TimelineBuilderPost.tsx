import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

export interface TimelineEntry {
  time: string;
  activity: string;
  note?: string;
}

export interface TimelineBuilderPostProps {
  eventName: string;
  entries: TimelineEntry[];
  headerAnnotation?: string;
}

const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='%23D4A853' opacity='0.18'/%3E%3C/svg%3E\")";

export function TimelineBuilderPost({
  eventName,
  entries,
  headerAnnotation,
}: TimelineBuilderPostProps) {
  const TIMELINE_LEFT = 130;
  const PIN_INDEXES = entries.length > 4 ? [0, Math.floor(entries.length / 2), entries.length - 1] : [0];

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
          backgroundImage: DOT_GRID,
          opacity: 0.5,
        }}
      />

      <div
        style={{
          padding: "90px 80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "var(--deep-pink)",
            lineHeight: 1.2,
          }}
        >
          Your {eventName} Timeline
        </div>
        {headerAnnotation && (
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 32,
              color: "var(--gold)",
              transform: "rotate(-2deg)",
              marginTop: 10,
            }}
          >
            {headerAnnotation}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          padding: "20px 60px 130px",
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 30,
            bottom: 130,
            left: TIMELINE_LEFT,
            width: 4,
            background: "var(--gold)",
            opacity: 0.7,
            borderRadius: 2,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {entries.map((entry, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                paddingLeft: TIMELINE_LEFT + 32 - 60,
                minHeight: 70,
              }}
            >
              {PIN_INDEXES.includes(i) ? (
                <PushPin
                  variant={i === 0 ? "pink" : i === entries.length - 1 ? "gold" : "red"}
                  size={28}
                  top={4}
                  left={TIMELINE_LEFT - 14 - 60}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    left: TIMELINE_LEFT - 9 - 60,
                    top: 14,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--cream)",
                    border: "3px solid var(--gold)",
                    zIndex: 3,
                  }}
                />
              )}

              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 36,
                  fontWeight: 400,
                  color: "var(--deep-pink)",
                  lineHeight: 1.05,
                  marginBottom: 2,
                }}
              >
                {entry.time}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--wine)",
                  lineHeight: 1.3,
                  marginBottom: entry.note ? 4 : 0,
                }}
              >
                {entry.activity}
              </div>
              {entry.note && (
                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 24,
                    color: "var(--gold)",
                    transform: "rotate(-1deg)",
                    transformOrigin: "left center",
                  }}
                >
                  {entry.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
