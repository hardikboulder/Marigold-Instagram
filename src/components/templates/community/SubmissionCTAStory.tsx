import { CTABar } from "@/components/brand/CTABar";

export type SubmissionButtonType = "link-in-bio" | "dm-us" | "tag-us" | "email-us";

export interface SubmissionCTAStoryProps {
  seriesReference: string;
  callToAction: string;
  steps: string[];
  buttonText: SubmissionButtonType;
}

const BUTTON_LABELS: Record<SubmissionButtonType, string> = {
  "link-in-bio": "LINK IN BIO",
  "dm-us": "DM US",
  "tag-us": "TAG US",
  "email-us": "EMAIL US",
};

export function SubmissionCTAStory({
  seriesReference,
  callToAction,
  steps,
  buttonText,
}: SubmissionCTAStoryProps) {
  const validSteps = (steps || []).filter((s) => s && s.trim());
  const buttonLabel = BUTTON_LABELS[buttonText] ?? BUTTON_LABELS["link-in-bio"];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--pink)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "180px 100px 220px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,248,242,0.12), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--gold-light)",
          textAlign: "center",
          marginBottom: 60,
          position: "relative",
          zIndex: 2,
        }}
      >
        {seriesReference}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          maxWidth: 880,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 92,
            lineHeight: 1.12,
            color: "var(--cream)",
            textAlign: "center",
            marginBottom: 80,
          }}
        >
          {callToAction}
        </div>

        {validSteps.length > 0 && (
          <div
            style={{
              width: "100%",
              marginBottom: 70,
              padding: "32px 36px",
              background: "rgba(255,248,242,0.08)",
              borderRadius: 18,
              border: "1px solid rgba(255,248,242,0.18)",
            }}
          >
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "var(--gold-light)",
                marginBottom: 20,
              }}
            >
              How to Submit:
            </div>
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {validSteps.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 18,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 28,
                    fontWeight: 400,
                    color: "var(--cream)",
                    lineHeight: 1.35,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "var(--gold)",
                      color: "var(--wine)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 18,
                      fontWeight: 800,
                      marginTop: 2,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "26px 56px",
            background: "var(--gold)",
            color: "var(--wine)",
            borderRadius: 999,
            fontFamily: "'Syne', sans-serif",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 6,
            textTransform: "uppercase",
            boxShadow: "0 12px 28px rgba(75,21,40,0.25)",
          }}
        >
          <span>→</span>
          <span>{buttonLabel}</span>
        </div>
      </div>

      <CTABar variant="default" />
    </div>
  );
}
