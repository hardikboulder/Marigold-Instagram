"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  CalendarItem,
  CalendarItemInput,
  PillarSlug,
  TemplateDefinition,
} from "@/lib/types";
import {
  getPillarBySlug,
  getTemplatesByPillar,
  loadContentPillars,
  loadTemplateDefinitions,
} from "@/lib/db/data-loader";
import { Modal } from "./Modal";
import { pillarColor } from "./labels";
import {
  dayOfWeekName,
  defaultContentForTemplate,
  isoDate,
  isoWeekNumber,
  parseIsoDate,
} from "./utils";

export interface AddPostPreset {
  seriesSlug?: string;
  templateSlug?: string;
  pillar?: PillarSlug;
  rationale?: string;
}

interface AddPostDialogProps {
  open: boolean;
  defaultDate: Date;
  preset?: AddPostPreset;
  /**
   * Recent calendar items used for "least-recently-used" template ordering
   * within the chosen pillar, and for the "Let AI Decide" gap analysis.
   */
  recentItems?: CalendarItem[];
  onClose: () => void;
  onCreated: (item: CalendarItemInput) => void;
}

type Mode = "blank" | "ai";

const MAX_TEMPLATES_PER_PILLAR = 8;

export function AddPostDialog({
  open,
  defaultDate,
  preset,
  recentItems = [],
  onClose,
  onCreated,
}: AddPostDialogProps) {
  const pillars = useMemo(() => loadContentPillars(), []);
  const allTemplates = useMemo(() => loadTemplateDefinitions(), []);

  const [pillar, setPillar] = useState<PillarSlug | null>(null);
  const [templateSlug, setTemplateSlug] = useState<string>("");
  const [date, setDate] = useState<string>(isoDate(defaultDate));
  const [mode, setMode] = useState<Mode>("blank");
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(isoDate(defaultDate));
      const presetTemplate = preset?.templateSlug
        ? allTemplates.find((t) => t.slug === preset.templateSlug)
        : null;
      const initialPillar =
        preset?.pillar ?? (presetTemplate?.pillar as PillarSlug | undefined) ?? null;
      setPillar(initialPillar);
      setTemplateSlug(preset?.templateSlug ?? "");
      setMode("blank");
      setUserPrompt("");
      setSearch("");
      setError(null);
      setBusy(false);
    } else {
      setPillar(null);
      setTemplateSlug("");
      setDate(isoDate(defaultDate));
      setMode("blank");
      setUserPrompt("");
      setSearch("");
      setBusy(false);
      setError(null);
    }
  }, [open, defaultDate, preset?.pillar, preset?.templateSlug, allTemplates]);

  // Templates within the chosen pillar, sorted by least-recently-used
  // (encourage variety). Search filters across ALL pillars.
  const recencyByTemplate = useMemo(() => {
    const map = new Map<string, number>();
    recentItems.forEach((item, idx) => {
      // Higher idx = more recent (caller passes ordered ascending). We
      // store the most recent idx per template_slug; missing = unused.
      map.set(item.template_slug, Math.max(map.get(item.template_slug) ?? -1, idx));
    });
    return map;
  }, [recentItems]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    let pool: TemplateDefinition[];
    if (q.length > 0) {
      pool = allTemplates.filter(
        (t) =>
          t.is_active &&
          (t.name.toLowerCase().includes(q) ||
            t.slug.toLowerCase().includes(q) ||
            t.series_slug.toLowerCase().includes(q)),
      );
    } else if (pillar) {
      pool = getTemplatesByPillar(pillar);
    } else {
      return [] as TemplateDefinition[];
    }

    return pool
      .slice()
      .sort((a, b) => {
        const ra = recencyByTemplate.get(a.slug) ?? -1;
        const rb = recencyByTemplate.get(b.slug) ?? -1;
        // Least-recently-used first (smaller idx → earlier).
        if (ra !== rb) return ra - rb;
        return a.sort_order - b.sort_order;
      })
      .slice(0, q.length > 0 ? 24 : MAX_TEMPLATES_PER_PILLAR);
  }, [allTemplates, pillar, search, recencyByTemplate]);

  const selectedTemplate = useMemo(
    () => allTemplates.find((t) => t.slug === templateSlug) ?? null,
    [allTemplates, templateSlug],
  );

  function pickAIDecide() {
    // Gap analysis: find the pillar most under-served in the recent window.
    // Default targets if there's no recent history yet.
    const targets = pillars.map((p) => ({
      slug: p.slug,
      target: p.default_share,
    }));
    const total = recentItems.length || 1;
    const counts = new Map<PillarSlug, number>();
    for (const item of recentItems) {
      counts.set(item.pillar, (counts.get(item.pillar) ?? 0) + 1);
    }
    let bestPillar: PillarSlug = "engage";
    let bestDelta = -Infinity;
    for (const t of targets) {
      const actual = (counts.get(t.slug) ?? 0) / total;
      const delta = t.target - actual;
      if (delta > bestDelta) {
        bestDelta = delta;
        bestPillar = t.slug;
      }
    }
    setPillar(bestPillar);
    const candidates = getTemplatesByPillar(bestPillar);
    const least = candidates
      .slice()
      .sort((a, b) => {
        const ra = recencyByTemplate.get(a.slug) ?? -1;
        const rb = recencyByTemplate.get(b.slug) ?? -1;
        return ra - rb;
      })[0];
    if (least) setTemplateSlug(least.slug);
    setMode("ai");
  }

  function buildBlank(): CalendarItemInput {
    if (!selectedTemplate) throw new Error("Pick a template first.");
    const dateObj = parseIsoDate(date);
    return {
      scheduled_date: date,
      scheduled_time: null,
      week_number: isoWeekNumber(dateObj),
      day_of_week: dayOfWeekName(dateObj),
      series_slug: selectedTemplate.series_slug,
      pillar: selectedTemplate.pillar,
      template_slug: selectedTemplate.slug,
      format: selectedTemplate.format,
      status: "suggested",
      content_data: defaultContentForTemplate(selectedTemplate.slug),
      caption: null,
      hashtags: [],
      ai_rationale: null,
      generation_prompt: null,
      sort_order: 0,
    };
  }

  async function generateWithAI(): Promise<CalendarItemInput> {
    if (!selectedTemplate) throw new Error("Pick a template first.");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "single",
        seriesSlug: selectedTemplate.series_slug,
        templateSlug: selectedTemplate.slug,
        userPrompt: userPrompt.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.error ?? "AI generation failed.");
    }
    const item = data.data as CalendarItem;
    const dateObj = parseIsoDate(date);
    return {
      ...item,
      pillar: selectedTemplate.pillar,
      scheduled_date: date,
      week_number: isoWeekNumber(dateObj),
      day_of_week: dayOfWeekName(dateObj),
    };
  }

  async function handleSubmit() {
    if (!selectedTemplate) {
      setError("Pick a template.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input = mode === "ai" ? await generateWithAI() : buildBlank();
      onCreated(input);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="What kind of content do you need?"
      subtitle="Pick a pillar (the strategic purpose), then a template within it. Or let the AI choose what your calendar needs most."
      onClose={onClose}
      width={780}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {preset?.rationale && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--blush)",
              border: "1px dashed rgba(75,21,40,0.25)",
              borderRadius: 8,
              fontFamily: "'Caveat', cursive",
              fontSize: 16,
              color: "var(--pink)",
              lineHeight: 1.4,
            }}
          >
            {preset.rationale}
          </div>
        )}

        {/* Pillar cards */}
        <div style={pillarCardRowStyle}>
          {pillars.map((p) => {
            const active = pillar === p.slug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  setPillar(p.slug);
                  setTemplateSlug("");
                }}
                style={pillarCardStyle(active, pillarColor(p.slug))}
              >
                <span style={pillarCardDotStyle(pillarColor(p.slug))} />
                <span style={pillarCardName}>{p.name}</span>
                <span style={pillarCardTagline}>{p.tagline}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={pickAIDecide}
            style={letAIDecideStyle}
            title="Use the calendar's pillar gap analysis to pick the next post"
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>✨</span>
            <span style={pillarCardName}>Let AI Decide</span>
            <span style={pillarCardTagline}>
              Pick the pillar your calendar needs most.
            </span>
          </button>
        </div>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Or search every template…"
          style={selectStyle}
        />

        {/* Template grid */}
        {(pillar || search.trim().length > 0) && (
          <div>
            <div style={templateGridLabelStyle}>
              {search.trim().length > 0
                ? `Search · ${filteredTemplates.length}`
                : `${getPillarBySlug(pillar!)?.name ?? ""} templates · least recently used first`}
            </div>
            <div style={templateGridStyle}>
              {filteredTemplates.length === 0 && (
                <div style={emptyTemplateStyle}>
                  No templates match yet — try a different keyword or pillar.
                </div>
              )}
              {filteredTemplates.map((t) => {
                const active = templateSlug === t.slug;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setTemplateSlug(t.slug)}
                    style={templateCardStyle(active, pillarColor(t.pillar))}
                  >
                    <span style={templateFormatStyle}>{t.format}</span>
                    <span style={templateNameStyle}>{t.name}</span>
                    <span style={templateSeriesStyle}>{t.series_slug}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Field label="Scheduled date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={selectStyle}
          />
        </Field>

        <Field label="How to fill the content">
          <div style={{ display: "flex", gap: 8 }}>
            <ModePill
              active={mode === "blank"}
              onClick={() => setMode("blank")}
            >
              Create blank
            </ModePill>
            <ModePill active={mode === "ai"} onClick={() => setMode("ai")}>
              Generate with AI
            </ModePill>
          </div>
        </Field>

        {mode === "ai" && (
          <Field
            label="Optional prompt"
            help="Tell Claude what angle you want — e.g. 'a confession about hiding the venue from the in-laws'."
          >
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              style={{
                ...selectStyle,
                fontFamily: "'Space Grotesk', sans-serif",
                resize: "vertical",
              }}
              placeholder="Leave blank to let the AI pick its own angle."
            />
          </Field>
        )}

        {error && (
          <div
            style={{
              padding: 12,
              background: "var(--blush)",
              border: "1px solid var(--deep-pink)",
              borderRadius: 8,
              color: "var(--deep-pink)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: 8,
            borderTop: "1px dashed rgba(75,21,40,0.15)",
          }}
        >
          <button type="button" onClick={onClose} style={cancelButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !selectedTemplate}
            style={{
              ...primaryButton,
              opacity: busy || !selectedTemplate ? 0.5 : 1,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy
              ? mode === "ai"
                ? "Generating…"
                : "Adding…"
              : mode === "ai"
                ? "Generate post"
                : "Add post"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface FieldProps {
  label: string;
  help?: string;
  children: React.ReactNode;
}

function Field({ label, help, children }: FieldProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.6,
          color: "var(--wine)",
        }}
      >
        {label}
      </span>
      {children}
      {help && (
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            color: "var(--mauve)",
            lineHeight: 1.4,
          }}
        >
          {help}
        </span>
      )}
    </label>
  );
}

interface ModePillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ModePill({ active, onClick, children }: ModePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 1.6,
        padding: "10px 16px",
        background: active ? "var(--wine)" : "transparent",
        color: active ? "var(--cream)" : "var(--wine)",
        border: "1px solid var(--wine)",
        borderRadius: 999,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const pillarCardRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

function pillarCardStyle(active: boolean, color: string): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    padding: "12px 14px",
    background: active ? color : "var(--cream)",
    color: active ? "var(--cream)" : "var(--wine)",
    border: `1.5px solid ${active ? color : "rgba(75,21,40,0.18)"}`,
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    transition: "background 120ms ease",
  };
}

function pillarCardDotStyle(color: string): CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: color,
    boxShadow: "inset 0 0 0 1px rgba(75,21,40,0.15)",
  };
}

const pillarCardName: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
};

const pillarCardTagline: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  lineHeight: 1.4,
  opacity: 0.85,
};

const letAIDecideStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 4,
  padding: "12px 14px",
  background: "var(--blush)",
  color: "var(--wine)",
  border: "1.5px dashed var(--deep-pink)",
  borderRadius: 10,
  cursor: "pointer",
  textAlign: "left",
};

const templateGridLabelStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.8,
  color: "var(--mauve)",
  marginBottom: 8,
};

const templateGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 8,
};

const emptyTemplateStyle: CSSProperties = {
  padding: 16,
  fontFamily: "'Caveat', cursive",
  fontSize: 16,
  color: "var(--mauve)",
};

function templateCardStyle(active: boolean, color: string): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "10px 12px",
    background: active ? "var(--blush)" : "var(--cream)",
    border: `1.5px solid ${active ? color : "rgba(75,21,40,0.12)"}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
  };
}

const templateFormatStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
};

const templateNameStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--wine)",
  lineHeight: 1.3,
};

const templateSeriesStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  opacity: 0.75,
};

const selectStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  padding: "10px 12px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
  width: "100%",
};

const primaryButton: React.CSSProperties = {
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
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const cancelButton: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};
