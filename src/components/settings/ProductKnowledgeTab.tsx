"use client";

/**
 * Product Knowledge tab — read-only display of brand_knowledge entries with
 * search + category filter. Edits save to localStorage as id-keyed partial
 * overrides (title, content, is_active) merged on top of the JSON seed.
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  clearBrandKnowledgeOverrides,
  getBrandKnowledgeOverrides,
  getEffectiveBrandKnowledge,
  setBrandKnowledgeOverride,
} from "@/lib/db/settings-store";
import type { BrandKnowledgeCategory, BrandKnowledgeEntry } from "@/lib/types";
import {
  cardHeader,
  cardStyle,
  eyebrow,
  fieldLabel,
  ghostButton,
  inputStyle,
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

const CATEGORY_LABELS: Record<BrandKnowledgeCategory, string> = {
  product_features: "Product Features",
  audience: "Audience",
  tone: "Tone",
  stats: "Stats",
  competitors: "Competitors",
};

const CATEGORY_ORDER: BrandKnowledgeCategory[] = [
  "product_features",
  "stats",
  "audience",
  "tone",
  "competitors",
];

export function ProductKnowledgeTab({ onToast }: Props) {
  const [entries, setEntries] = useState<BrandKnowledgeEntry[]>([]);
  const [hasOverrides, setHasOverrides] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    BrandKnowledgeCategory | "all"
  >("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; content: string }>({
    title: "",
    content: "",
  });

  function refresh() {
    setEntries(getEffectiveBrandKnowledge());
    setHasOverrides(Object.keys(getBrandKnowledgeOverrides()).length > 0);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeCategory !== "all" && e.category !== activeCategory)
        return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    });
  }, [entries, query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<BrandKnowledgeCategory, BrandKnowledgeEntry[]>();
    for (const e of filtered) {
      const arr = map.get(e.category) ?? [];
      arr.push(e);
      map.set(e.category, arr);
    }
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      items: map.get(cat) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  function startEdit(entry: BrandKnowledgeEntry) {
    setEditingId(entry.id);
    setDraft({ title: entry.title, content: entry.content });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(entry: BrandKnowledgeEntry) {
    setBrandKnowledgeOverride(entry.id, {
      title: draft.title,
      content: draft.content,
    });
    setEditingId(null);
    refresh();
    onToast(`Saved "${draft.title || entry.id}".`);
  }

  function toggleActive(entry: BrandKnowledgeEntry) {
    setBrandKnowledgeOverride(entry.id, { is_active: !entry.is_active });
    refresh();
  }

  function resetAll() {
    clearBrandKnowledgeOverrides();
    refresh();
    onToast("Product knowledge reverted to defaults.");
  }

  return (
    <div>
      <div style={headerRow}>
        <div>
          <div style={eyebrow}>Product knowledge</div>
          <h2 style={sectionHeader}>What the AI knows about The Marigold.</h2>
          <p style={sectionLead}>
            Features, stats, audience, tone, and competitors. Every claim the AI
            makes about the product traces back to one of these entries — keep
            them sharp, specific, and current.
            {hasOverrides ? (
              <span style={overrideTag}>· Custom overrides active</span>
            ) : null}
          </p>
        </div>
        {hasOverrides && (
          <button type="button" onClick={resetAll} style={secondaryButton}>
            Reset all
          </button>
        )}
      </div>

      <div style={controlsRow}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, body, or id…"
          style={{ ...inputStyle, maxWidth: 360, background: "var(--cream)" }}
        />
        <div style={categoryRow}>
          <CategoryChip
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            count={entries.length}
          />
          {CATEGORY_ORDER.map((cat) => (
            <CategoryChip
              key={cat}
              label={CATEGORY_LABELS[cat]}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              count={entries.filter((e) => e.category === cat).length}
            />
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div style={emptyState}>no entries match — try a different filter</div>
      ) : (
        grouped.map((group) => (
          <section key={group.category} style={{ marginBottom: 32 }}>
            <h3 style={categoryHeader}>{CATEGORY_LABELS[group.category]}</h3>
            <div style={cardGrid}>
              {group.items.map((entry) => (
                <article
                  key={entry.id}
                  style={{
                    ...cardStyle,
                    opacity: entry.is_active ? 1 : 0.55,
                  }}
                >
                  <div style={cardHeaderRow}>
                    <div style={cardHeader}>{entry.id}</div>
                    <button
                      type="button"
                      onClick={() => toggleActive(entry)}
                      style={{
                        ...pillTag,
                        background: entry.is_active
                          ? "var(--mint)"
                          : "var(--blush)",
                        color: "var(--wine)",
                        cursor: "pointer",
                        border: "none",
                      }}
                    >
                      {entry.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {editingId === entry.id ? (
                    <>
                      <label style={fieldLabel}>Title</label>
                      <input
                        value={draft.title}
                        onChange={(e) =>
                          setDraft({ ...draft, title: e.target.value })
                        }
                        style={inputStyle}
                      />
                      <label style={{ ...fieldLabel, marginTop: 12 }}>
                        Content
                      </label>
                      <textarea
                        value={draft.content}
                        onChange={(e) =>
                          setDraft({ ...draft, content: e.target.value })
                        }
                        rows={6}
                        style={textareaStyle}
                      />
                      <div style={{ ...editActions, marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={ghostButton}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(entry)}
                          style={primaryButton}
                        >
                          Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 style={entryTitle}>{entry.title}</h4>
                      <p style={entryBody}>{entry.content}</p>
                      <div style={{ ...editActions, marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          style={ghostButton}
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

interface ChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function CategoryChip({ label, count, active, onClick }: ChipProps) {
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
        padding: "8px 14px",
        border: active ? "1px solid var(--wine)" : "1px solid rgba(75,21,40,0.2)",
        background: active ? "var(--wine)" : "transparent",
        color: active ? "var(--cream)" : "var(--mauve)",
        borderRadius: 999,
        cursor: "pointer",
      }}
    >
      {label}{" "}
      <span style={{ opacity: 0.75, marginLeft: 4 }}>({count})</span>
    </button>
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

const controlsRow: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginBottom: 28,
};

const categoryRow: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const cardGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
};

const cardHeaderRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 8,
};

const categoryHeader: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  color: "var(--wine)",
  marginBottom: 12,
};

const entryTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  lineHeight: 1.2,
  marginBottom: 8,
};

const entryBody: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13.5,
  color: "var(--mauve)",
  lineHeight: 1.55,
};

const editActions: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
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

const emptyState: CSSProperties = {
  padding: 64,
  textAlign: "center",
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve)",
};
