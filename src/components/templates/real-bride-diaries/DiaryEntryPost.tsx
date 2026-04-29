import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";
import { DiaryDoodle, type DiaryMarginDoodle } from "./DiaryDoodle";

export interface DiaryEntryPostProps {
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
  "repeating-linear-gradient(transparent, transparent 60px, rgba(212,83,126,0.10) 60px, rgba(212,83,126,0.10) 62px)";

export function DiaryEntryPost({
  dayOrWeek,
  dateLabel,
  diaryText,
  brideIdentifier,
  planningStage,
  marginDoodle,
}: DiaryEntryPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: NOISE_SVG,
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: "relative",
          width: 880,
          height: 860,
          background: "#FFFDF8",
          backgroundImage: LINED_BACKGROUND,
          backgroundPosition: "0 78px",
          padding: "82px 88px 96px",
          transform: "rotate(-1.2deg)",
          boxShadow:
            "4px 8px 22px rgba(75,21,40,0.10), 0 0 0 1px rgba(75,21,40,0.04)",
        }}
      >
        <TapeStrip
          top={-30}
          left="50%"
          rotation={-3}
          width={220}
          height={56}
          style={{ transform: "translateX(-50%) rotate(-3deg)" }}
        />

        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 6,
            color: "var(--pink)",
            marginBottom: 14,
          }}
        >
          REAL BRIDE DIARIES
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 28,
            paddingBottom: 16,
            borderBottom: "1px solid rgba(75,21,40,0.10)",
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 56,
              color: "var(--wine)",
              lineHeight: 1,
            }}
          >
            {dayOrWeek}
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: 1,
              color: "var(--mauve)",
              textTransform: "uppercase",
            }}
          >
            {dateLabel}
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 52,
            lineHeight: 1.3,
            color: "var(--wine)",
            fontWeight: 500,
            marginRight: 110,
            whiteSpace: "pre-line",
          }}
        >
          {diaryText}
        </div>

        <DiaryDoodle
          doodle={marginDoodle}
          size={150}
          color="var(--pink)"
          style={{
            position: "absolute",
            top: 220,
            right: 56,
            transform: "rotate(8deg)",
            opacity: 0.85,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 88,
            right: 88,
            bottom: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 2,
              color: "var(--wine)",
              textTransform: "uppercase",
            }}
          >
            {brideIdentifier}
          </div>
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 28,
              color: "var(--mauve)",
              transform: "rotate(-2deg)",
            }}
          >
            — {planningStage}
          </div>
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
