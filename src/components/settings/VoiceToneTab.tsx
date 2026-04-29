"use client";

/**
 * Voice & Tone tab — read-only by default, "Edit" toggles inline editing.
 * Saves to localStorage as a partial BrandVoice override that merges on top
 * of the JSON seed. The AI engine reads via getEffectiveBrandConfig().
 */

import { useEffect, useState, type CSSProperties } from "react";
import {
  getBrandConfigOverrides,
  getEffectiveBrandConfig,
  setBrandConfigOverrides,
  type BrandConfigOverrides,
} from "@/lib/db/settings-store";
import type { BrandVoice } from "@/lib/types";
import {
  cardHeader,
  cardStyle,
  eyebrow,
  fieldLabel,
  pillTag,
  primaryButton,
  secondaryButton,
  sectionHeader,
  sectionLead,
  textareaStyle,
} from "./styles";

interface Props {
  onToast: (msg: string) => void;
}

interface VoiceDraft {
  tone: string;
  pillars: string;
  do: string;
  dont: string;
  example_phrases: string;
}

function voiceToDraft(v: BrandVoice): VoiceDraft {
  return {
    tone: (v.tone ?? []).join("\n"),
    pillars: (v.pillars ?? []).join("\n\n"),
    do: (v.do ?? []).join("\n"),
    dont: (v.dont ?? []).join("\n"),
    example_phrases: (v.example_phrases ?? []).join("\n"),
  };
}

function draftToVoice(d: VoiceDraft): BrandVoice {
  return {
    tone: splitLines(d.tone),
    pillars: splitParas(d.pillars),
    do: splitLines(d.do),
    dont: splitLines(d.dont),
    example_phrases: splitLines(d.example_phrases),
  };
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitParas(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function VoiceToneTab({ onToast }: Props) {
  const [voice, setVoice] = useState<BrandVoice | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<VoiceDraft | null>(null);
  const [hasOverride, setHasOverride] = useState(false);

  useEffect(() => {
    const v = getEffectiveBrandConfig().brand_voice.config_value;
    setVoice(v);
    setDraft(voiceToDraft(v));
    const overrides = getBrandConfigOverrides();
    setHasOverride(Boolean(overrides.brand_voice));
  }, []);

  if (!voice || !draft) return null;

  function save() {
    if (!draft) return;
    const next = draftToVoice(draft);
    const overrides: BrandConfigOverrides = { brand_voice: next };
    setBrandConfigOverrides(overrides);
    setVoice(next);
    setHasOverride(true);
    setEditing(false);
    onToast("Voice & tone saved.");
  }

  function cancel() {
    if (!voice) return;
    setDraft(voiceToDraft(voice));
    setEditing(false);
  }

  function reset() {
    setBrandConfigOverrides({});
    const v = getEffectiveBrandConfig().brand_voice.config_value;
    setVoice(v);
    setDraft(voiceToDraft(v));
    setHasOverride(false);
    setEditing(false);
    onToast("Voice & tone reverted to defaults.");
  }

  return (
    <div>
      <div style={headerRow}>
        <div>
          <div style={eyebrow}>Brand voice</div>
          <h2 style={sectionHeader}>How the brand sounds.</h2>
          <p style={sectionLead}>
            The system prompt loads these values whenever the AI generates copy.
            Tone descriptors set the personality, pillars define the guardrails,
            do&rsquo;s and don&rsquo;ts give it the rules, example phrases give it
            the rhythm.
            {hasOverride ? (
              <span style={overrideTag}>· Custom overrides active</span>
            ) : null}
          </p>
        </div>
        <div style={actionRow}>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={primaryButton}
            >
              Edit
            </button>
          ) : (
            <>
              <button type="button" onClick={cancel} style={secondaryButton}>
                Cancel
              </button>
              <button type="button" onClick={save} style={primaryButton}>
                Save
              </button>
            </>
          )}
          {hasOverride && !editing && (
            <button
              type="button"
              onClick={reset}
              style={{
                ...secondaryButton,
                color: "var(--deep-pink)",
                borderColor: "var(--deep-pink)",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div style={grid}>
        <Card title="Tone descriptors">
          {editing ? (
            <Textarea
              value={draft.tone}
              onChange={(v) => setDraft({ ...draft, tone: v })}
              rows={6}
              hint="One descriptor per line."
            />
          ) : (
            <div style={pillRow}>
              {voice.tone.map((t) => (
                <span key={t} style={pillTag}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card title="Voice pillars">
          {editing ? (
            <Textarea
              value={draft.pillars}
              onChange={(v) => setDraft({ ...draft, pillars: v })}
              rows={9}
              hint="One pillar per paragraph (separated by blank lines)."
            />
          ) : (
            <ul style={listStyle}>
              {voice.pillars.map((p, i) => (
                <li key={i} style={listItem}>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Do" accent="var(--mint)">
          {editing ? (
            <Textarea
              value={draft.do}
              onChange={(v) => setDraft({ ...draft, do: v })}
              rows={6}
              hint="One rule per line."
            />
          ) : (
            <ul style={listStyle}>
              {voice.do.map((p, i) => (
                <li key={i} style={listItem}>
                  ✓ {p}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Don't" accent="var(--blush)">
          {editing ? (
            <Textarea
              value={draft.dont}
              onChange={(v) => setDraft({ ...draft, dont: v })}
              rows={6}
              hint="One rule per line."
            />
          ) : (
            <ul style={listStyle}>
              {voice.dont.map((p, i) => (
                <li key={i} style={listItem}>
                  ✗ {p}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Example phrases" wide>
          {editing ? (
            <Textarea
              value={draft.example_phrases}
              onChange={(v) => setDraft({ ...draft, example_phrases: v })}
              rows={6}
              hint="One phrase per line. Used as voice anchors."
            />
          ) : (
            <div style={pillRow}>
              {voice.example_phrases.map((p) => (
                <span
                  key={p}
                  style={{
                    ...pillTag,
                    background: "var(--gold-light)",
                    color: "var(--wine)",
                    fontFamily: "'Caveat', cursive",
                    fontSize: 18,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  accent?: string;
  wide?: boolean;
  children: React.ReactNode;
}

function Card({ title, accent, wide, children }: CardProps) {
  return (
    <div
      style={{
        ...cardStyle,
        gridColumn: wide ? "1 / -1" : undefined,
        background: accent ?? cardStyle.background,
      }}
    >
      <div style={cardHeader}>{title}</div>
      {children}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  rows = 4,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={textareaStyle}
      />
      {hint && (
        <div
          style={{
            ...fieldLabel,
            marginTop: 6,
            marginBottom: 0,
            textTransform: "none",
            letterSpacing: 0.4,
            fontWeight: 500,
            color: "var(--mauve)",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  marginBottom: 24,
  flexWrap: "wrap",
};

const actionRow: CSSProperties = {
  display: "flex",
  gap: 8,
  flexShrink: 0,
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 20,
};

const overrideTag: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  marginLeft: 8,
};

const pillRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const listStyle: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const listItem: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  lineHeight: 1.55,
};
