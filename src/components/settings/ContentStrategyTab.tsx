"use client";

/**
 * Content Strategy tab — posting cadence (per-format) + series mix sliders +
 * per-series active toggles. Lives in localStorage as a single
 * ContentStrategySettings object; the AI engine reads via getContentStrategy().
 */

import { useEffect, useState, type CSSProperties } from "react";
import {
  clearContentStrategy,
  defaultContentStrategy,
  getContentStrategy,
  setContentStrategy,
  type ContentStrategySettings,
} from "@/lib/db/settings-store";
import {
  loadContentPillars,
  loadContentSeries,
} from "@/lib/db/data-loader";
import { pillarColor } from "@/components/calendar/labels";
import type {
  ContentFormat,
  ContentPillar,
  ContentSeries,
  PillarSlug,
} from "@/lib/types";
import {
  cardHeader,
  cardStyle,
  eyebrow,
  primaryButton,
  secondaryButton,
  sectionHeader,
  sectionLead,
} from "./styles";

interface Props {
  onToast: (msg: string) => void;
}

const FORMATS: ContentFormat[] = ["story", "post", "reel"];

export function ContentStrategyTab({ onToast }: Props) {
  const [strategy, setStrategy] = useState<ContentStrategySettings | null>(
    null,
  );
  const [seriesList, setSeriesList] = useState<ContentSeries[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSeriesList(loadContentSeries().sort((a, b) => a.sort_order - b.sort_order));
    setPillars(loadContentPillars());
    setStrategy(getContentStrategy());
  }, []);

  if (!strategy) return null;

  function updateCadence(format: ContentFormat, value: number) {
    if (!strategy) return;
    const existing = strategy.posting_cadence.find((c) => c.format === format);
    let next: ContentStrategySettings["posting_cadence"];
    if (existing) {
      next = strategy.posting_cadence.map((c) =>
        c.format === format ? { ...c, per_week: value } : c,
      );
    } else {
      next = [...strategy.posting_cadence, { format, per_week: value }];
    }
    setStrategy({ ...strategy, posting_cadence: next });
    setDirty(true);
  }

  function updateMix(slug: PillarSlug, value: number) {
    if (!strategy) return;
    const existing = strategy.pillar_mix.find((m) => m.pillar_slug === slug);
    let next: ContentStrategySettings["pillar_mix"];
    if (existing) {
      next = strategy.pillar_mix.map((m) =>
        m.pillar_slug === slug ? { ...m, share: value } : m,
      );
    } else {
      next = [...strategy.pillar_mix, { pillar_slug: slug, share: value }];
    }
    setStrategy({ ...strategy, pillar_mix: next });
    setDirty(true);
  }

  function toggleSeries(slug: string) {
    if (!strategy) return;
    setStrategy({
      ...strategy,
      series_active: {
        ...strategy.series_active,
        [slug]: !strategy.series_active[slug],
      },
    });
    setDirty(true);
  }

  function save() {
    if (!strategy) return;
    setContentStrategy(strategy);
    setDirty(false);
    onToast("Content strategy saved.");
  }

  function reset() {
    clearContentStrategy();
    const def = defaultContentStrategy();
    setStrategy(def);
    setDirty(false);
    onToast("Content strategy reverted to defaults.");
  }

  const cadenceMap = new Map(
    strategy.posting_cadence.map((c) => [c.format, c.per_week]),
  );

  const mixTotal = strategy.pillar_mix.reduce(
    (sum, m) => sum + (m.share || 0),
    0,
  );

  return (
    <div>
      <div style={headerRow}>
        <div>
          <div style={eyebrow}>Content strategy</div>
          <h2 style={sectionHeader}>How the week gets built.</h2>
          <p style={sectionLead}>
            The calendar generator pulls these numbers when it lays out a week.
            Cadence = how many of each format ship per week. Pillar mix = how
            the week is balanced across the five Content Pillars. Toggle a
            series off to pause it inside its pillar.
          </p>
        </div>
        <div style={actionRow}>
          <button type="button" onClick={reset} style={secondaryButton}>
            Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            style={{
              ...primaryButton,
              opacity: dirty ? 1 : 0.5,
              cursor: dirty ? "pointer" : "default",
            }}
          >
            Save
          </button>
        </div>
      </div>

      <section style={cardStyle}>
        <div style={cardHeader}>Posting cadence</div>
        <p style={helperLine}>Posts per week, by format.</p>
        <div style={cadenceGrid}>
          {FORMATS.map((format) => {
            const value = cadenceMap.get(format) ?? 0;
            return (
              <div key={format} style={cadenceCell}>
                <div style={cadenceLabel}>{format}</div>
                <div style={cadenceValue}>{value}</div>
                <div style={cadenceUnit}>per week</div>
                <input
                  type="range"
                  min={0}
                  max={7}
                  step={1}
                  value={value}
                  onChange={(e) =>
                    updateCadence(format, Number(e.target.value))
                  }
                  style={rangeStyle}
                />
                <div style={cadenceTickRow}>
                  <span>0</span>
                  <span>7</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: 20 }}>
        <div style={cardHeader}>Pillar mix</div>
        <p style={helperLine}>
          Share of slots each pillar should win. Suggested baseline: Engage
          30 / Educate 25 / Inspire 20 / Connect 15 / Convert 10.
          <span style={{ marginLeft: 12, color: mixWarnColor(mixTotal) }}>
            current total: {(mixTotal * 100).toFixed(0)}%
          </span>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pillars.map((pillar) => {
            const slot = strategy.pillar_mix.find(
              (m) => m.pillar_slug === pillar.slug,
            );
            const value = slot?.share ?? 0;
            return (
              <div key={pillar.slug} style={mixRow}>
                <div style={mixLabelCol}>
                  <span
                    style={{
                      ...seriesDot,
                      background: pillarColor(pillar.slug),
                    }}
                  />
                  <div>
                    <div style={mixLabel}>{pillar.name}</div>
                    <div style={mixSub}>{pillar.tagline}</div>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={value}
                  onChange={(e) =>
                    updateMix(pillar.slug, Number(e.target.value))
                  }
                  style={{ ...rangeStyle, flex: 1 }}
                />
                <div style={mixValue}>{(value * 100).toFixed(0)}%</div>
                <span />
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: 20 }}>
        <div style={cardHeader}>Active series</div>
        <p style={helperLine}>
          Toggle a series off to remove it from the rotation inside its
          pillar. Useful when you want to pause a specific format without
          losing the pillar coverage.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {seriesList.map((series) => {
            const isActive = strategy.series_active[series.slug] ?? true;
            return (
              <label key={series.slug} style={activeRowStyle}>
                <span
                  style={{
                    ...seriesDot,
                    background: pillarColor(series.pillar),
                  }}
                />
                <span style={{ flex: 1 }}>
                  <span style={mixLabel}>{series.name}</span>
                  <span style={{ ...mixSub, marginLeft: 8 }}>
                    {series.pillar.toUpperCase()}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleSeries(series.slug)}
                />
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function mixWarnColor(total: number): string {
  if (Math.abs(total - 1) < 0.01) return "var(--mauve)";
  return "var(--deep-pink)";
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
};

const cadenceGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 12,
};

const cadenceCell: CSSProperties = {
  background: "var(--blush)",
  borderRadius: 8,
  padding: 16,
  textAlign: "center",
};

const cadenceLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--mauve)",
  marginBottom: 4,
};

const cadenceValue: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 56,
  color: "var(--wine)",
  lineHeight: 1,
};

const cadenceUnit: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 18,
  color: "var(--pink)",
  marginBottom: 8,
};

const cadenceTickRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  color: "var(--mauve)",
  letterSpacing: 1,
};

const rangeStyle: CSSProperties = {
  width: "100%",
  accentColor: "var(--pink)",
};

const mixRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) 2fr 60px 90px",
  alignItems: "center",
  gap: 16,
};

const mixLabelCol: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const seriesDot: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  flexShrink: 0,
};

const mixLabel: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  fontWeight: 600,
};

const mixSub: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  marginTop: 2,
};

const mixValue: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  textAlign: "right",
};

const helperLine: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
  marginBottom: 8,
};

const activeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
  borderRadius: 8,
  background: "var(--blush)",
  cursor: "pointer",
};
