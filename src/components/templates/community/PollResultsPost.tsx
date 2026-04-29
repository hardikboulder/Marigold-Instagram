import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface PollResultsPostProps {
  question: string;
  optionA: string;
  optionAPercent: number;
  optionB: string;
  optionBPercent: number;
  totalVotes: string;
  editorialComment: string;
}

function GoldStar({ size = 36 }: { size?: number }) {
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
        d="M12 1.5l3.09 6.26L22 8.77l-5 4.87 1.18 6.86L12 17.27 5.82 20.5 7 13.64l-5-4.87 6.91-1.01L12 1.5z"
        fill="var(--gold)"
        stroke="var(--gold)"
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ResultBarProps {
  label: string;
  percent: number;
  color: string;
  isWinner: boolean;
}

function ResultBar({ label, percent, color, isWinner }: ResultBarProps) {
  const safePercent = Math.max(0, Math.min(100, percent));
  return (
    <div style={{ marginBottom: 30 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
          }}
        >
          {isWinner && <GoldStar size={32} />}
          <span style={{ fontStyle: isWinner ? "italic" : "normal" }}>{label}</span>
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 32,
            fontWeight: 800,
            color: color,
            letterSpacing: 1,
          }}
        >
          {safePercent}%
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: 28,
          background: "rgba(75,21,40,0.08)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${safePercent}%`,
            height: "100%",
            background: color,
            borderRadius: 14,
            transition: "width 400ms ease",
          }}
        />
      </div>
    </div>
  );
}

export function PollResultsPost({
  question,
  optionA,
  optionAPercent,
  optionB,
  optionBPercent,
  totalVotes,
  editorialComment,
}: PollResultsPostProps) {
  const aWins = optionAPercent >= optionBPercent;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        padding: "84px 88px 160px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TapeStrip top={36} right={120} rotation={5} width={180} height={48} />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--pink)",
          marginBottom: 28,
        }}
      >
        You Voted
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 60,
          lineHeight: 1.1,
          color: "var(--wine)",
          marginBottom: 56,
        }}
      >
        {question}
      </div>

      <div style={{ flex: 1 }}>
        <ResultBar
          label={optionA}
          percent={optionAPercent}
          color="var(--hot-pink)"
          isWinner={aWins}
        />
        <ResultBar
          label={optionB}
          percent={optionBPercent}
          color="var(--wine)"
          isWinner={!aWins}
        />
      </div>

      {totalVotes && (
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "var(--mauve)",
            marginBottom: 20,
          }}
        >
          {totalVotes}
        </div>
      )}

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 44,
          color: "var(--pink)",
          lineHeight: 1.2,
          transform: "rotate(-1deg)",
          maxWidth: 720,
        }}
      >
        {editorialComment}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
