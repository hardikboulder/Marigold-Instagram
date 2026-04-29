import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";
import { DiaryDoodle, type DiaryMarginDoodle } from "./DiaryDoodle";

export interface DiaryEntryStoryProps {
  dayOrWeek: string;
  dateLabel: string;
  diaryText: string;
  brideIdentifier: string;
  planningStage: string;
  marginDoodle: DiaryMarginDoodle;
}

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23c)' opacity='0.02'/%3E%3C/svg%3E\")";

const LINED_BACKGROUND =
  "repeating-linear-gradient(transparent, transparent 86px, rgba(212,83,126,0.10) 86px, rgba(212,83,126,0.10) 88px)";

export function DiaryEntryStory({
  dayOrWeek,
  dateLabel,
  diaryText,
  brideIdentifier,
  planningStage,
  marginDoodle,
}: DiaryEntryStoryProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#FFFDF8",
        backgroundImage: LINED_BACKGROUND,
        backgroundPosition: "0 220px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: NOISE_SVG,
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />

      <TapeStrip
        top={48}
        left="22%"
        rotation={-6}
        width={260}
        height={64}
        style={{ transform: "rotate(-6deg)" }}
      />
      <TapeStrip
        top={56}
        right={120}
        rotation={4}
        width={220}
        height={60}
        style={{ transform: "rotate(4deg)" }}
      />

      <header
        style={{
          position: "absolute",
          top: 200,
          left: 96,
          right: 96,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 8,
            color: "var(--pink)",
          }}
        >
          REAL BRIDE DIARIES
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            paddingBottom: 22,
            borderBottom: "1px solid rgba(75,21,40,0.12)",
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 110,
              color: "var(--wine)",
              lineHeight: 0.95,
            }}
          >
            {dayOrWeek}
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: 2,
              color: "var(--mauve)",
              textTransform: "uppercase",
              textAlign: "right",
            }}
          >
            {dateLabel}
          </div>
        </div>
      </header>

      <DiaryDoodle
        doodle={marginDoodle}
        size={220}
        color="var(--pink)"
        style={{
          position: "absolute",
          top: 540,
          right: 64,
          transform: "rotate(10deg)",
          opacity: 0.9,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 540,
          left: 96,
          right: 280,
          fontFamily: "'Caveat', cursive",
          fontSize: 88,
          lineHeight: 1.25,
          color: "var(--wine)",
          fontWeight: 500,
          whiteSpace: "pre-line",
        }}
      >
        {diaryText}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 96,
          right: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 32,
          borderTop: "1px solid rgba(75,21,40,0.12)",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 3,
            color: "var(--wine)",
            textTransform: "uppercase",
          }}
        >
          {brideIdentifier}
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 40,
            color: "var(--mauve)",
            transform: "rotate(-2deg)",
          }}
        >
          — {planningStage}
        </div>
      </div>

      <CTABar />
    </div>
  );
}
