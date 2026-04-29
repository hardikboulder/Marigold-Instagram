"use client";

/**
 * Template Library tab — grid of every template, each with a small live
 * preview rendered with default content. Active/inactive toggle persists
 * via setTemplateActive (settings-store). Click to view a larger preview.
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import { renderTemplate } from "@/components/calendar/template-renderer";
import { defaultContentForTemplate } from "@/components/calendar/utils";
import {
  clearTemplateActiveOverrides,
  getEffectiveTemplates,
  getTemplateActiveOverrides,
  setTemplateActive,
} from "@/lib/db/settings-store";
import { loadContentSeries } from "@/lib/db/data-loader";
import { seriesColor } from "@/components/calendar/labels";
import type { ContentSeries, TemplateDefinition } from "@/lib/types";
import {
  cardHeader,
  eyebrow,
  pillTag,
  secondaryButton,
  sectionHeader,
  sectionLead,
} from "./styles";

interface Props {
  onToast: (msg: string) => void;
}

export function TemplateLibraryTab({ onToast }: Props) {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [seriesList, setSeriesList] = useState<ContentSeries[]>([]);
  const [hasOverrides, setHasOverrides] = useState(false);
  const [zoomedSlug, setZoomedSlug] = useState<string | null>(null);

  function refresh() {
    setTemplates(
      getEffectiveTemplates().sort((a, b) => {
        if (a.series_slug !== b.series_slug)
          return a.series_slug.localeCompare(b.series_slug);
        return a.sort_order - b.sort_order;
      }),
    );
    setHasOverrides(Object.keys(getTemplateActiveOverrides()).length > 0);
  }

  useEffect(() => {
    setSeriesList(loadContentSeries().sort((a, b) => a.sort_order - b.sort_order));
    refresh();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, TemplateDefinition[]>();
    for (const t of templates) {
      const arr = map.get(t.series_slug) ?? [];
      arr.push(t);
      map.set(t.series_slug, arr);
    }
    return seriesList
      .map((s) => ({ series: s, items: map.get(s.slug) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [templates, seriesList]);

  function toggle(slug: string, isActive: boolean) {
    setTemplateActive(slug, !isActive);
    refresh();
  }

  function reset() {
    clearTemplateActiveOverrides();
    refresh();
    onToast("Template overrides cleared.");
  }

  const zoomed = zoomedSlug
    ? templates.find((t) => t.slug === zoomedSlug) ?? null
    : null;

  return (
    <div>
      <div style={headerRow}>
        <div>
          <div style={eyebrow}>Template library</div>
          <h2 style={sectionHeader}>Everything in the system.</h2>
          <p style={sectionLead}>
            Every template the AI engine can pick from when it builds a week.
            Toggle one off to retire it without removing it from the seed —
            it&rsquo;ll come back the moment you flip it back on.
            {hasOverrides && (
              <span style={overrideTag}>· Custom toggles active</span>
            )}
          </p>
        </div>
        {hasOverrides && (
          <button type="button" onClick={reset} style={secondaryButton}>
            Reset
          </button>
        )}
      </div>

      {grouped.map((group) => (
        <section key={group.series.slug} style={{ marginBottom: 36 }}>
          <h3 style={seriesHeading}>
            <span
              style={{ ...seriesDot, background: seriesColor(group.series.slug) }}
            />
            {group.series.name}
          </h3>
          <div style={tileGrid}>
            {group.items.map((template) => (
              <TemplateCard
                key={template.slug}
                template={template}
                onToggle={() => toggle(template.slug, template.is_active)}
                onZoom={() => setZoomedSlug(template.slug)}
              />
            ))}
          </div>
        </section>
      ))}

      {zoomed && (
        <ZoomModal template={zoomed} onClose={() => setZoomedSlug(null)} />
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: TemplateDefinition;
  onToggle: () => void;
  onZoom: () => void;
}

function TemplateCard({ template, onToggle, onZoom }: TemplateCardProps) {
  const previewFormat = template.format === "reel" ? "story" : template.format;
  const data = useMemo(
    () => defaultContentForTemplate(template.slug),
    [template.slug],
  );
  const previewScale = previewFormat === "story" ? 0.16 : 0.18;

  return (
    <article
      style={{
        ...tileCard,
        opacity: template.is_active ? 1 : 0.5,
      }}
    >
      <button
        type="button"
        onClick={onZoom}
        style={tilePreviewBtn}
        aria-label={`Open larger preview of ${template.name}`}
      >
        <TemplateFrame format={previewFormat} scale={previewScale}>
          {renderTemplate(template.slug, data)}
        </TemplateFrame>
      </button>
      <div style={tileBody}>
        <div style={cardHeader}>{template.format}</div>
        <div style={tileTitle}>{template.name}</div>
        <div style={tileMeta}>
          {template.dimensions.width} × {template.dimensions.height}
        </div>
        <div style={tileActions}>
          <button
            type="button"
            onClick={onZoom}
            style={{
              ...secondaryButton,
              padding: "6px 12px",
              fontSize: 10,
            }}
          >
            View
          </button>
          <button
            type="button"
            onClick={onToggle}
            style={{
              ...pillTag,
              cursor: "pointer",
              border: "none",
              background: template.is_active ? "var(--mint)" : "var(--blush)",
              color: "var(--wine)",
            }}
          >
            {template.is_active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ZoomModal({
  template,
  onClose,
}: {
  template: TemplateDefinition;
  onClose: () => void;
}) {
  const previewFormat = template.format === "reel" ? "story" : template.format;
  const data = useMemo(
    () => defaultContentForTemplate(template.slug),
    [template.slug],
  );
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={modalOverlay}
    >
      <div onClick={(e) => e.stopPropagation()} style={modalInner}>
        <button type="button" onClick={onClose} style={modalClose}>
          Close
        </button>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <TemplateFrame format={previewFormat} scale={previewFormat === "story" ? 0.4 : 0.5}>
            {renderTemplate(template.slug, data)}
          </TemplateFrame>
        </div>
        <div style={modalCaption}>
          <div style={cardHeader}>{template.series_slug}</div>
          <div style={modalTitle}>{template.name}</div>
          <div style={tileMeta}>
            {template.dimensions.width} × {template.dimensions.height} ·{" "}
            {template.format}
          </div>
        </div>
      </div>
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

const overrideTag: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  marginLeft: 8,
};

const seriesHeading: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  color: "var(--wine)",
  marginBottom: 16,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const seriesDot: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 999,
};

const tileGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
};

const tileCard: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "3px 3px 0 rgba(212,168,83,0.18)",
};

const tilePreviewBtn: CSSProperties = {
  background: "var(--blush)",
  border: "none",
  cursor: "pointer",
  padding: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 220,
};

const tileBody: CSSProperties = {
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const tileTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 20,
  color: "var(--wine)",
  lineHeight: 1.2,
};

const tileMeta: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
};

const tileActions: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginTop: 8,
};

const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(75,21,40,0.62)",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const modalInner: CSSProperties = {
  background: "var(--cream)",
  borderRadius: 16,
  padding: 32,
  maxWidth: 720,
  maxHeight: "90vh",
  overflow: "auto",
  position: "relative",
  boxShadow: "8px 8px 0 var(--gold)",
};

const modalClose: CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 999,
  cursor: "pointer",
};

const modalTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 32,
  color: "var(--wine)",
  marginTop: 6,
  lineHeight: 1.1,
};

const modalCaption: CSSProperties = {
  marginTop: 24,
  textAlign: "center",
};
