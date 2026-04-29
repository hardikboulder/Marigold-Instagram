import type { CSSProperties } from "react";

export const eyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 4,
  color: "var(--pink)",
  marginBottom: 12,
};

export const sectionHeader: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 40,
  color: "var(--wine)",
  lineHeight: 1.1,
  marginBottom: 8,
};

export const sectionLead: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 720,
  marginBottom: 28,
};

export const cardStyle: CSSProperties = {
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 12,
  padding: 24,
  boxShadow: "3px 3px 0 rgba(212,168,83,0.18)",
};

export const cardHeader: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2.4,
  color: "var(--pink)",
  marginBottom: 12,
};

export const cardLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
};

export const fieldLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
  marginBottom: 6,
  display: "block",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  background: "var(--blush)",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 6,
  padding: "10px 12px",
  outline: "none",
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 80,
  resize: "vertical" as const,
  lineHeight: 1.5,
};

export const primaryButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "10px 20px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

export const secondaryButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "10px 20px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};

export const ghostButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

export const dangerButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "10px 20px",
  background: "transparent",
  color: "var(--deep-pink)",
  border: "1px solid var(--deep-pink)",
  borderRadius: 4,
  cursor: "pointer",
};

export const pillTag: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "6px 12px",
  borderRadius: 999,
  display: "inline-block",
  background: "var(--blush)",
  color: "var(--deep-pink)",
};
