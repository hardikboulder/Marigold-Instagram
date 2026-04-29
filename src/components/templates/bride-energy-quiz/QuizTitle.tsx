import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface QuizTitleProps {
  /**
   * Headline split for the two-line display. Example: "What's Your Bride Energy?"
   * The portion after the optional `\n` (or "Your ") is rendered italic in
   * hot-pink. Pass the full string and the component handles the split.
   */
  quizTitle: string;
  /**
   * Exactly four option strings, displayed A / B / C / D top to bottom.
   */
  options: [string, string, string, string];
}

const LETTERS = ["A", "B", "C", "D"] as const;

function splitTitle(title: string): { lead: string; emphasis: string } {
  if (title.includes("\n")) {
    const [lead, ...rest] = title.split("\n");
    return { lead: lead.trim(), emphasis: rest.join(" ").trim() };
  }
  // Default split: everything before the last 2 words is the lead, last 2 are the
  // hot-pink italic line. Matches "What's Your" / "Bride Energy?".
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return { lead: "", emphasis: title.trim() };
  const emphasis = words.slice(-2).join(" ");
  const lead = words.slice(0, -2).join(" ");
  return { lead, emphasis };
}

export function QuizTitle({ quizTitle, options }: QuizTitleProps) {
  const { lead, emphasis } = splitTitle(quizTitle);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 80,
        position: "relative",
      }}
    >
      <TapeStrip
        width={300}
        top={140}
        left="50%"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 48,
          color: "var(--gold)",
          transform: "rotate(-3deg)",
          marginBottom: 16,
        }}
      >
        take this totally scientific quiz
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 120,
          color: "white",
          lineHeight: 1,
          marginBottom: 32,
        }}
      >
        {lead && (
          <>
            {lead}
            <br />
          </>
        )}
        <i style={{ color: "var(--hot-pink)" }}>{emphasis}</i>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
          maxWidth: 740,
          marginTop: 20,
        }}
      >
        {options.map((option, i) => (
          <div
            key={LETTERS[i]}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "2px dashed rgba(212,83,126,0.25)",
              padding: "28px 36px",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                border: "2px solid var(--hot-pink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Instrument Serif', serif",
                fontSize: 28,
                color: "var(--hot-pink)",
                flexShrink: 0,
              }}
            >
              {LETTERS[i]}
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 30,
                color: "rgba(255,255,255,0.7)",
                textAlign: "left",
              }}
            >
              {option}
            </div>
          </div>
        ))}
      </div>

      <CTABar />
    </div>
  );
}
