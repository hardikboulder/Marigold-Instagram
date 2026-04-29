"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type {
  CalendarStatus,
  ContentFormat,
  PillarSlug,
} from "@/lib/types";
import {
  FORMAT_BADGES,
  STATUS_BADGES,
  pillarColor,
} from "./labels";
import {
  getActivePillarList,
  type CalendarFilters,
} from "./utils";

const FORMATS: ContentFormat[] = ["story", "post", "reel"];
const STATUSES: CalendarStatus[] = [
  "suggested",
  "approved",
  "editing",
  "exported",
  "posted",
];

interface FilterBarProps {
  filters: CalendarFilters;
  onChange: (next: CalendarFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const pillars = getActivePillarList();
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!secondaryOpen) return;
    function onDocClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setSecondaryOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [secondaryOpen]);

  function handlePillarClick(slug: PillarSlug) {
    if (filters.soloPillar === slug) {
      // already solo'd → return to all-active
      onChange({ ...filters, soloPillar: null, pillars: [] });
    } else if (filters.soloPillar) {
      // switching solo → new pillar
      onChange({ ...filters, soloPillar: slug, pillars: [] });
    } else {
      // first click → solo this pillar
      onChange({ ...filters, soloPillar: slug, pillars: [] });
    }
  }

  function toggleSecondary<T extends string>(
    key: "formats" | "statuses",
    value: T,
  ) {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  function clearAll() {
    onChange({
      pillars: [],
      soloPillar: null,
      formats: [],
      statuses: [],
      series: [],
    });
  }

  const secondaryCount =
    filters.formats.length + filters.statuses.length + filters.series.length;
  const totalActive = secondaryCount + (filters.soloPillar ? 1 : 0);

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        padding: "10px 16px",
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.08)",
        borderRadius: 12,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
        {pillars.map((p) => {
          const isSolo = filters.soloPillar === p.slug;
          const isDimmed = filters.soloPillar !== null && !isSolo;
          return (
            <PillarPill
              key={p.slug}
              name={p.name}
              color={pillarColor(p.slug)}
              solo={isSolo}
              dimmed={isDimmed}
              onClick={() => handlePillarClick(p.slug)}
            />
          );
        })}
      </div>

      <div
        ref={popoverRef}
        style={{ position: "relative", display: "flex", gap: 6 }}
      >
        <button
          type="button"
          onClick={() => setSecondaryOpen((v) => !v)}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.4,
            padding: "6px 12px",
            background: secondaryOpen ? "var(--wine)" : "transparent",
            color: secondaryOpen ? "var(--cream)" : "var(--wine)",
            border: "1px solid var(--wine)",
            borderRadius: 999,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          aria-expanded={secondaryOpen}
        >
          Filters
          {secondaryCount > 0 && (
            <span
              style={{
                background: "var(--deep-pink)",
                color: "var(--cream)",
                fontSize: 9,
                padding: "1px 6px",
                borderRadius: 999,
                lineHeight: 1.4,
              }}
            >
              {secondaryCount}
            </span>
          )}
          <span style={{ fontSize: 8, marginLeft: 2 }}>▾</span>
        </button>

        {totalActive > 0 && (
          <button
            type="button"
            onClick={clearAll}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              padding: "6px 10px",
              background: "transparent",
              color: "var(--deep-pink)",
              border: "1px solid var(--deep-pink)",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}

        {secondaryOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 280,
              background: "var(--cream)",
              border: "1px solid rgba(75,21,40,0.18)",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "0 12px 32px rgba(75,21,40,0.18)",
              zIndex: 30,
            }}
          >
            <SecondaryGroup label="Format">
              {FORMATS.map((f) => (
                <Checkbox
                  key={f}
                  label={FORMAT_BADGES[f].label}
                  swatch={FORMAT_BADGES[f].bg}
                  checked={filters.formats.includes(f)}
                  onChange={() => toggleSecondary("formats", f)}
                />
              ))}
            </SecondaryGroup>
            <SecondaryGroup label="Status">
              {STATUSES.map((s) => (
                <Checkbox
                  key={s}
                  label={STATUS_BADGES[s].label}
                  swatch={STATUS_BADGES[s].bg}
                  checked={filters.statuses.includes(s)}
                  onChange={() => toggleSecondary("statuses", s)}
                />
              ))}
            </SecondaryGroup>
          </div>
        )}
      </div>
    </div>
  );
}

interface PillarPillProps {
  name: string;
  color: string;
  solo: boolean;
  dimmed: boolean;
  onClick: () => void;
}

function PillarPill({ name, color, solo, dimmed, onClick }: PillarPillProps) {
  const style: CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    padding: "6px 12px",
    background: solo ? color : "transparent",
    color: solo ? "var(--cream)" : "var(--wine)",
    border: `1.5px solid ${solo ? color : "rgba(75,21,40,0.18)"}`,
    borderRadius: 999,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    opacity: dimmed ? 0.4 : 1,
    transition: "opacity 120ms ease, background 120ms ease, color 120ms ease",
  };
  return (
    <button type="button" onClick={onClick} style={style}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          boxShadow: solo ? "0 0 0 2px var(--cream)" : "none",
        }}
      />
      {name}
    </button>
  );
}

interface SecondaryGroupProps {
  label: string;
  children: React.ReactNode;
}

function SecondaryGroup({ label, children }: SecondaryGroupProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1.6,
          color: "var(--mauve)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface CheckboxProps {
  label: string;
  swatch: string;
  checked: boolean;
  onChange: () => void;
}

function Checkbox({ label, swatch, checked, onChange }: CheckboxProps) {
  const style: CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    padding: "5px 10px",
    background: checked ? swatch : "transparent",
    color: checked ? "var(--cream)" : "var(--wine)",
    border: `1px solid ${checked ? swatch : "rgba(75,21,40,0.22)"}`,
    borderRadius: 999,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };
  return (
    <button type="button" onClick={onChange} style={style}>
      {!checked && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: swatch,
          }}
        />
      )}
      {label}
    </button>
  );
}
