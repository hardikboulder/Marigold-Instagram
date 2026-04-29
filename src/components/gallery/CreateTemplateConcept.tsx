"use client";

import { useState } from "react";

export function CreateTemplateConcept() {
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [concept, setConcept] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!idea.trim() || busy) return;
    setBusy(true);
    setError(null);
    setConcept(null);
    try {
      const res = await fetch("/api/generate-template-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error ?? "Generation failed.");
      }
      setConcept(data.concept as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={cardStyle}>
      <div style={kickerStyle}>Create new template</div>
      <h3 style={titleStyle}>Have a new content idea?</h3>
      <p style={descStyle}>
        Describe it in a sentence or two and the AI will sketch a template
        concept — the layout, the editable fields, the brand-voice angle. Think
        of it as ideation, not code.
      </p>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        rows={4}
        placeholder="e.g. A weekly 'guest list math' tile that shows the bride's number vs. mom's number with the gap as a Caveat-handwritten total."
        style={textareaStyle}
      />

      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}
      >
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!idea.trim() || busy}
          style={{
            ...primaryBtnStyle,
            opacity: !idea.trim() || busy ? 0.5 : 1,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Sketching…" : "Generate template concept"}
        </button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {concept && (
        <div style={conceptBoxStyle}>
          <div style={conceptKickerStyle}>Concept</div>
          <pre style={conceptTextStyle}>{concept}</pre>
        </div>
      )}
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 32,
  background: "var(--cream)",
  border: "2px dashed var(--gold)",
  borderRadius: 16,
  marginTop: 64,
};

const kickerStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 4,
  color: "var(--gold)",
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 36,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.1,
};

const descStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 640,
  marginTop: 8,
  marginBottom: 16,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  padding: 14,
  background: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 8,
  color: "var(--wine)",
  resize: "vertical",
};

const primaryBtnStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 24px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  boxShadow: "3px 3px 0 var(--gold)",
};

const errorStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  background: "var(--blush)",
  border: "1px solid var(--deep-pink)",
  borderRadius: 8,
  color: "var(--deep-pink)",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
};

const conceptBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: 18,
  background: "var(--blush)",
  border: "1px dashed rgba(75,21,40,0.2)",
  borderRadius: 12,
};

const conceptKickerStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2.4,
  color: "var(--hot-pink)",
  marginBottom: 8,
};

const conceptTextStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  margin: 0,
  fontFeatureSettings: '"liga" off',
};
