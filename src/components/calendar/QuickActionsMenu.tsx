"use client";

/**
 * Right-click / long-press context menu for any content tile.
 *
 * Renders into a fixed-position floating panel anchored at the pointer.
 * Closes on outside click, Escape, or after any action runs. The menu is
 * intentionally stateless beyond hover — the parent owns selection, dates,
 * regen, etc.
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { CalendarItem } from "@/lib/types";
import { getActiveTemplatesForSeries, isoDate, parseIsoDate } from "./utils";

export interface QuickActionsMenuProps {
  item: CalendarItem;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: (item: CalendarItem) => void;
  onDuplicate: (item: CalendarItem) => void;
  onMoveDate: (item: CalendarItem, isoDate: string) => void;
  onChangeTemplate: (item: CalendarItem, templateSlug: string) => void;
  onRegenerate: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
}

type Submenu = "move" | "template" | null;

export function QuickActionsMenu({
  item,
  x,
  y,
  onClose,
  onEdit,
  onDuplicate,
  onMoveDate,
  onChangeTemplate,
  onRegenerate,
  onDelete,
}: QuickActionsMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<Submenu>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Clamp menu to viewport
  const menuWidth = 240;
  const menuHeight = 240;
  const left =
    typeof window === "undefined"
      ? x
      : Math.min(x, window.innerWidth - menuWidth - 12);
  const top =
    typeof window === "undefined"
      ? y
      : Math.min(y, window.innerHeight - menuHeight - 12);

  const close = () => {
    setSubmenu(null);
    onClose();
  };

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: "fixed",
        top,
        left,
        width: menuWidth,
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.15)",
        borderRadius: 10,
        boxShadow: "0 10px 28px rgba(75,21,40,0.22)",
        zIndex: 200,
        padding: 6,
        fontFamily: "'Space Grotesk', sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Header
        title={item.template_slug}
        date={item.scheduled_date}
      />
      <Divider />

      <Item
        icon={<EditIcon />}
        label="Edit"
        onClick={() => {
          onEdit(item);
          close();
        }}
      />
      <Item
        icon={<DuplicateIcon />}
        label="Duplicate"
        onClick={() => {
          onDuplicate(item);
          close();
        }}
      />
      <Item
        icon={<MoveIcon />}
        label="Move to date"
        chevron
        active={submenu === "move"}
        onClick={() => setSubmenu(submenu === "move" ? null : "move")}
      />
      {submenu === "move" && (
        <MoveSubmenu
          currentIso={item.scheduled_date}
          onPick={(d) => {
            onMoveDate(item, d);
            close();
          }}
        />
      )}
      <Item
        icon={<TemplateIcon />}
        label="Change template"
        chevron
        active={submenu === "template"}
        onClick={() =>
          setSubmenu(submenu === "template" ? null : "template")
        }
      />
      {submenu === "template" && (
        <TemplateSubmenu
          item={item}
          onPick={(slug) => {
            onChangeTemplate(item, slug);
            close();
          }}
        />
      )}
      <Item
        icon={<SparkleIcon />}
        label="Regenerate with AI"
        onClick={() => {
          onRegenerate(item);
          close();
        }}
      />
      <Divider />
      <Item
        icon={<TrashIcon />}
        label="Delete"
        danger
        onClick={() => {
          onDelete(item);
          close();
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Header({ title, date }: { title: string; date: string }) {
  return (
    <div
      style={{
        padding: "6px 10px 2px",
        fontFamily: "'Syne', sans-serif",
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: "var(--mauve)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span style={{ color: "var(--wine)" }}>{title}</span>
      <span>{date}</span>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(75,21,40,0.08)",
        margin: "4px 4px",
      }}
    />
  );
}

interface ItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  chevron?: boolean;
  active?: boolean;
}

function Item({ icon, label, onClick, danger, chevron, active }: ItemProps) {
  const [hovered, setHovered] = useState(false);
  const tone = danger ? "var(--deep-pink)" : "var(--wine)";
  const bg = active || hovered ? "var(--blush)" : "transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="menuitem"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        background: bg,
        border: "none",
        padding: "8px 10px",
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 13,
        color: tone,
        textAlign: "left",
      }}
    >
      <span style={{ width: 16, display: "flex", color: tone }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {chevron && (
        <span style={{ fontSize: 12, color: "var(--mauve)" }}>▸</span>
      )}
    </button>
  );
}

// --- Submenus -------------------------------------------------------------

function MoveSubmenu({
  currentIso,
  onPick,
}: {
  currentIso: string;
  onPick: (iso: string) => void;
}) {
  const today = parseIsoDate(currentIso);
  const offsets = [-7, -1, +1, +7, +14];
  return (
    <div style={submenuStyle}>
      {offsets.map((offset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        const iso = isoDate(d);
        const label = `${offset > 0 ? "+" : ""}${offset} day${
          Math.abs(offset) === 1 ? "" : "s"
        } · ${iso.slice(5)}`;
        return (
          <SubItem key={offset} onClick={() => onPick(iso)}>
            {label}
          </SubItem>
        );
      })}
      <DateInputRow currentIso={currentIso} onPick={onPick} />
    </div>
  );
}

function DateInputRow({
  currentIso,
  onPick,
}: {
  currentIso: string;
  onPick: (iso: string) => void;
}) {
  const [value, setValue] = useState(currentIso);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px 2px",
      }}
    >
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          flex: 1,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12,
          padding: "5px 8px",
          border: "1px solid rgba(75,21,40,0.2)",
          borderRadius: 6,
          background: "var(--cream)",
          color: "var(--wine)",
        }}
      />
      <button
        type="button"
        onClick={() => onPick(value)}
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          padding: "6px 10px",
          background: "var(--wine)",
          color: "var(--cream)",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Move
      </button>
    </div>
  );
}

function TemplateSubmenu({
  item,
  onPick,
}: {
  item: CalendarItem;
  onPick: (slug: string) => void;
}) {
  const templates = getActiveTemplatesForSeries(item.series_slug).filter(
    (t) => t.format === item.format,
  );
  if (templates.length === 0) {
    return (
      <div style={{ ...submenuStyle, padding: "8px 10px" }}>
        <span
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 14,
            color: "var(--mauve)",
          }}
        >
          no other {item.format} templates in this series
        </span>
      </div>
    );
  }
  return (
    <div style={submenuStyle}>
      {templates.map((t) => {
        const current = t.slug === item.template_slug;
        return (
          <SubItem
            key={t.slug}
            onClick={() => !current && onPick(t.slug)}
            disabled={current}
          >
            {t.name}
            {current && (
              <span
                style={{
                  marginLeft: 6,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 8,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "var(--mauve)",
                }}
              >
                · current
              </span>
            )}
          </SubItem>
        );
      })}
    </div>
  );
}

function SubItem({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        background: hovered && !disabled ? "var(--blush)" : "transparent",
        border: "none",
        padding: "6px 14px 6px 28px",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 12,
        color: disabled ? "var(--mauve)" : "var(--wine)",
        textAlign: "left",
        borderRadius: 4,
      }}
    >
      {children}
    </button>
  );
}

const submenuStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  paddingTop: 2,
  paddingBottom: 4,
  borderLeft: "2px solid var(--blush)",
  marginLeft: 16,
};

// --- Icons ----------------------------------------------------------------

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5zM18.7 7.3l-2-2a1 1 0 0 0-1.4 0l-1.6 1.6 3.4 3.4 1.6-1.6a1 1 0 0 0 0-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}
function DuplicateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="8" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="var(--cream)" />
    </svg>
  );
}
function MoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function TemplateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3zM18 16l1 2.5L21.5 19 19 20l-1 2.5L17 20l-2.5-1 2.5-1 1-2z"
        fill="currentColor"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
