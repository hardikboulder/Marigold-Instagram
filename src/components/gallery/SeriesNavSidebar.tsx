"use client";

import { useEffect, useState } from "react";

export interface SeriesNavEntry {
  id: string;
  number: string;
  title: string;
}

interface SeriesNavSidebarProps {
  entries: SeriesNavEntry[];
}

export function SeriesNavSidebar({ entries }: SeriesNavSidebarProps) {
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sections = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el != null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort(
            (a, b) =>
              (a.target.getBoundingClientRect().top ?? 0) -
              (b.target.getBoundingClientRect().top ?? 0),
          );
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveId(id);
  }

  return (
    <nav style={navStyle} aria-label="Series navigation">
      <div style={kickerStyle}>Series</div>
      <ul style={listStyle}>
        {entries.map((entry) => {
          const active = entry.id === activeId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => handleClick(entry.id)}
                style={itemStyle(active)}
              >
                <span style={numberPillStyle(active)}>{entry.number}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{entry.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: "sticky",
  top: 24,
  alignSelf: "flex-start",
  width: 240,
  flexShrink: 0,
  paddingRight: 12,
  maxHeight: "calc(100vh - 48px)",
  overflowY: "auto",
};

const kickerStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 3,
  color: "var(--pink)",
  marginBottom: 12,
  paddingLeft: 8,
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

function itemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    border: "none",
    background: active ? "var(--blush)" : "transparent",
    borderLeft: `3px solid ${active ? "var(--hot-pink)" : "transparent"}`,
    color: active ? "var(--wine)" : "var(--mauve)",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 12.5,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    textAlign: "left",
    borderRadius: 4,
    transition: "background 120ms ease, color 120ms ease",
  };
}

function numberPillStyle(active: boolean): React.CSSProperties {
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1,
    padding: "2px 6px",
    background: active ? "var(--wine)" : "rgba(75,21,40,0.08)",
    color: active ? "var(--cream)" : "var(--mauve)",
    borderRadius: 3,
    flexShrink: 0,
  };
}
