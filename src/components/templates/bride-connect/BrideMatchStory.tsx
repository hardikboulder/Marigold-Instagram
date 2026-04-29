import { CTABar } from "@/components/brand/CTABar";

export interface BrideMatchStoryExtraPrompt {
  question: string;
  answer: string;
}

export interface BrideMatchStoryProps {
  brideName: string;
  brideAge: number;
  planningCity: string;
  weddingMonth: string;
  weddingYear: number;
  lookingFor: string[];
  promptQuestion: string;
  promptAnswer: string;
  extraPrompts?: BrideMatchStoryExtraPrompt[];
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

function ArrowDown({ size = 28 }: { size?: number }) {
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
        d="M12 4v14m0 0l-7-7m7 7l7-7"
        stroke="var(--wine)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrideMatchStory({
  brideName,
  brideAge,
  planningCity,
  weddingMonth,
  weddingYear,
  lookingFor,
  promptQuestion,
  promptAnswer,
  extraPrompts = [],
  imageUrl,
}: BrideMatchStoryProps) {
  const tags = lookingFor.slice(0, 4);
  const extras = extraPrompts.slice(0, 2);
  const allPrompts: BrideMatchStoryExtraPrompt[] = [
    { question: promptQuestion, answer: promptAnswer },
    ...extras,
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(180deg, var(--blush) 0%, #FDD8E5 50%, var(--cream) 100%)",
        position: "relative",
        overflow: "hidden",
        padding: "100px 64px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          BRIDE CONNECT
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 44,
            color: "var(--pink)",
            transform: "rotate(-1deg)",
          }}
        >
          find your planning bestie
        </div>
      </div>

      <div
        style={{
          width: "100%",
          flex: 1,
          background: "white",
          borderRadius: 44,
          boxShadow:
            "0 24px 64px rgba(75,21,40,0.16), 0 8px 20px rgba(212,83,126,0.12)",
          padding: "44px 44px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: imageUrl ? `url(${imageUrl})` : "var(--blush)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "8px solid var(--pink)",
            boxShadow:
              "0 0 0 4px white, 0 0 0 8px rgba(212,83,126,0.2), 0 10px 22px rgba(75,21,40,0.16)",
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
            fontSize: 76,
            color: "var(--wine)",
            lineHeight: 1.0,
            marginBottom: 14,
          }}
        >
          {brideName}, {brideAge}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 22,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--mauve)",
            }}
          >
            <PinIcon size={26} />
            <span>Planning in {planningCity}</span>
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              background: "var(--pink)",
              fontFamily: "'Syne', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 3,
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
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "var(--pink)",
              marginBottom: 14,
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
              gap: 10,
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "var(--blush)",
                  color: "var(--wine)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 18,
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
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {allPrompts.map((p, i) => (
            <div
              key={i}
              style={{
                background: i === 0 ? "var(--cream)" : "rgba(251,234,240,0.6)",
                borderRadius: 22,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 30,
                  color: "var(--gold)",
                  marginBottom: 6,
                  transform: "rotate(-1deg)",
                }}
              >
                {p.question}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--wine)",
                  lineHeight: 1.35,
                }}
              >
                {p.answer}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "30px 0 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "var(--wine)",
          }}
        >
          TAP TO CONNECT
        </div>
        <ArrowDown size={32} />
      </div>

      <CTABar />
    </div>
  );
}
