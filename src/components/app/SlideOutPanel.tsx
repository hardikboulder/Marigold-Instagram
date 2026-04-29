"use client";

/**
 * Slide-out panel for secondary actions, keyboard shortcut reference, and the
 * detailed storage breakdown. Triggered from the top nav's hamburger; slides
 * in from the right with a wine backdrop. On narrow viewports it also hosts
 * the primary navigation links (the top bar shrinks to logo + menu only).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  STORE_KEYS,
  deleteStore,
  getStore,
  setStore,
} from "@/lib/db/local-store";
import {
  bulkAddCalendarItems,
  clearCalendar,
  getAllCalendarItems,
} from "@/lib/db/content-calendar-store";
import { buildSeedCalendarItems } from "@/lib/db/seed-calendar";
import { clearAssetRecords } from "@/lib/db/asset-store";
import { clearSubmissions } from "@/lib/db/submissions-store";
import {
  computeStorageUsage,
  formatBytes,
  type StorageUsage,
} from "@/lib/db/storage-usage";
import { useToast } from "@/components/app/ToastProvider";
import { NAV_LINKS } from "@/components/app/TopNav";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EXPORT_VERSION = 1;
const ALL_KEYS = Object.values(STORE_KEYS);

interface ExportPayload {
  version: number;
  exported_at: string;
  data: Record<string, unknown>;
}

export function SlideOutPanel({ open, onClose }: Props) {
  const toast = useToast();
  const pathname = usePathname() ?? "/";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState<StorageUsage>({
    itemCount: 0,
    totalBytes: 0,
    percentage: 0,
  });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    function refresh() {
      setUsage(computeStorageUsage());
    }
    refresh();
    const handle = window.setInterval(refresh, 3000);
    window.addEventListener("storage", refresh);
    window.addEventListener("marigold:storage-changed", refresh);
    return () => {
      window.clearInterval(handle);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("marigold:storage-changed", refresh);
    };
  }, []);

  function handleSeedCalendar() {
    const existing = getAllCalendarItems();
    if (existing.length > 0) {
      const ok = window.confirm(
        "This will replace all existing calendar data. Continue?",
      );
      if (!ok) return;
      clearCalendar();
    }
    const { items, weekCount } = buildSeedCalendarItems();
    bulkAddCalendarItems(items);
    toast.success(
      `Loaded ${items.length} content items across ${weekCount} weeks.`,
    );
    onClose();
  }

  function handleClearCalendar() {
    const existing = getAllCalendarItems();
    if (existing.length === 0) {
      toast.info("Calendar is already empty.");
      return;
    }
    const ok = window.confirm(
      "Clear the entire calendar? This cannot be undone.",
    );
    if (!ok) return;
    clearCalendar();
    toast.success("Calendar cleared.");
    onClose();
  }

  function handleExport() {
    const data: Record<string, unknown> = {};
    for (const key of ALL_KEYS) {
      const value = getStore<unknown>(key, null);
      if (value !== null) data[key] = value;
    }
    const payload: ExportPayload = {
      version: EXPORT_VERSION,
      exported_at: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    triggerDownload(blob, `marigold-studio-${stamp}.json`);
    toast.success(`Exported ${Object.keys(data).length} stores.`);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed = JSON.parse(text) as Partial<ExportPayload>;
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !parsed.data ||
          typeof parsed.data !== "object"
        ) {
          throw new Error("File doesn't look like a Marigold backup.");
        }
        const proceed = window.confirm(
          "Import will overwrite the matching stores in this browser. Continue?",
        );
        if (!proceed) return;
        const data = parsed.data as Record<string, unknown>;
        let restored = 0;
        for (const key of ALL_KEYS) {
          if (key in data) {
            setStore(key, data[key]);
            restored++;
          }
        }
        toast.success(
          `Imported ${restored} stores. Reload to see all changes.`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => toast.error("Couldn't read that file.");
    reader.readAsText(file);
  }

  function handleResetDefaults() {
    const ok = window.confirm(
      "Clear all overrides and exported assets? Calendar items remain. This cannot be undone.",
    );
    if (!ok) return;
    deleteStore(STORE_KEYS.brandConfigOverrides);
    deleteStore(STORE_KEYS.brandKnowledgeOverrides);
    deleteStore(STORE_KEYS.contentStrategy);
    deleteStore(STORE_KEYS.templateActive);
    deleteStore(STORE_KEYS.assets);
    toast.success("Overrides and assets cleared.");
  }

  function handleClearLibrary() {
    const ok = window.confirm(
      "Clear the entire asset library? Exported PNGs and thumbnails will be removed from this browser.",
    );
    if (!ok) return;
    clearAssetRecords();
    toast.success("Library cleared.");
  }

  function handleClearSubmissions() {
    const ok = window.confirm(
      "Clear all vendor submissions? This cannot be undone.",
    );
    if (!ok) return;
    clearSubmissions();
    toast.success("Submissions cleared.");
  }

  const pct = Math.min(1, usage.percentage);
  const warn = pct > 0.7;
  const danger = pct > 0.9;
  const meterColor = danger
    ? "var(--deep-pink)"
    : warn
      ? "var(--gold)"
      : "var(--wine)";

  return (
    <>
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={-1}
        className={`marigold-panel__backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-label="Close quick actions"
      />
      <aside
        className={`marigold-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Quick actions"
        aria-hidden={!open}
      >
        <header style={panelHeader}>
          <div style={panelEyebrow}>Quick Actions</div>
          <button
            type="button"
            onClick={onClose}
            style={closeButton}
            aria-label="Close panel"
          >
            ×
          </button>
        </header>

        <div style={panelBody}>
          <nav className="marigold-panel__nav" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => {
              const active = link.match
                ? link.match(pathname)
                : pathname === link.href ||
                  pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`marigold-panel__navlink${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <PanelDivider />

          <PanelSection label="Calendar">
            <PanelItem onClick={handleSeedCalendar}>Seed Calendar</PanelItem>
            <PanelItem onClick={handleClearCalendar} tone="danger">
              Clear Calendar
            </PanelItem>
          </PanelSection>

          <PanelSection label="Backup">
            <PanelItem onClick={handleExport}>Export All Data</PanelItem>
            <PanelItem onClick={handleImportClick}>Import Data</PanelItem>
            <PanelItem onClick={handleResetDefaults} tone="danger">
              Reset to Defaults
            </PanelItem>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChosen}
              style={{ display: "none" }}
            />
          </PanelSection>

          <PanelDivider />

          <PanelSection label="Keyboard Shortcuts">
            <div style={shortcutRow}>
              <kbd style={kbdStyle}>⌘S</kbd>
              <span style={shortcutLabel}>Save</span>
            </div>
            <div style={shortcutRow}>
              <kbd style={kbdStyle}>⌘E</kbd>
              <span style={shortcutLabel}>Export</span>
            </div>
            <div style={shortcutRow}>
              <kbd style={kbdStyle}>⌘R</kbd>
              <span style={shortcutLabel}>Regenerate</span>
            </div>
          </PanelSection>

          <PanelDivider />

          <PanelSection label="Storage">
            <div style={storageMeterRow}>
              <div style={meterTrack}>
                <div
                  style={{
                    ...meterFill,
                    width: `${Math.max(2, pct * 100)}%`,
                    background: meterColor,
                  }}
                />
              </div>
              <span style={{ ...meterPct, color: meterColor }}>
                {Math.round(pct * 100)}%
              </span>
            </div>
            <div style={storageMeta}>
              {usage.itemCount} item{usage.itemCount === 1 ? "" : "s"} ·{" "}
              {formatBytes(usage.totalBytes)}
            </div>
            <div style={{ height: 10 }} />
            <PanelItem onClick={handleClearLibrary} tone="danger">
              Clear Library
            </PanelItem>
            <PanelItem onClick={handleClearSubmissions} tone="danger">
              Clear Submissions
            </PanelItem>
          </PanelSection>

          <PanelDivider />

          <footer style={panelFooter}>
            <div style={footerWordmark}>
              <span style={footerThe}>The </span>
              <span style={footerMarigold}>Marigold</span>
            </div>
            <div style={footerVersion}>Content Studio v1.0</div>
          </footer>
        </div>
      </aside>
    </>
  );
}

function PanelSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <div style={sectionLabel}>{label}</div>
      <div style={sectionItems}>{children}</div>
    </section>
  );
}

function PanelItem({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone?: "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`marigold-panel__item${tone === "danger" ? " is-danger" : ""}`}
    >
      <span>{children}</span>
      <span aria-hidden="true" style={itemArrow}>
        ›
      </span>
    </button>
  );
}

function PanelDivider() {
  return <div style={dividerLine} aria-hidden="true" />;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const panelHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 18px",
  borderBottom: "1px solid rgba(75,21,40,0.08)",
};

const panelEyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--wine)",
};

const closeButton: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  lineHeight: 1,
  color: "var(--mauve)",
  cursor: "pointer",
  padding: 4,
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
};

const panelBody: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "16px 0 24px",
};

const sectionStyle: CSSProperties = {
  padding: "10px 12px",
};

const sectionLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
  padding: "4px 12px 8px",
};

const sectionItems: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const itemArrow: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 18,
  color: "var(--mauve)",
  opacity: 0.5,
  lineHeight: 1,
};

const dividerLine: CSSProperties = {
  height: 1,
  background: "rgba(75,21,40,0.08)",
  margin: "8px 24px",
};

const shortcutRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
};

const kbdStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--wine)",
  background: "rgba(75,21,40,0.06)",
  border: "1px solid rgba(75,21,40,0.12)",
  borderRadius: 4,
  padding: "3px 7px",
  minWidth: 36,
  textAlign: "center",
};

const shortcutLabel: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
};

const storageMeterRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "4px 12px",
};

const meterTrack: CSSProperties = {
  flex: 1,
  height: 6,
  background: "rgba(75,21,40,0.08)",
  borderRadius: 999,
  overflow: "hidden",
};

const meterFill: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  transition: "width 0.3s ease",
};

const meterPct: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  minWidth: 36,
  textAlign: "right",
};

const storageMeta: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  padding: "2px 12px 0",
};

const panelFooter: CSSProperties = {
  padding: "16px 24px 8px",
};

const footerWordmark: CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  color: "var(--wine)",
};

const footerThe: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 400,
  fontSize: 14,
};

const footerMarigold: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 18,
  marginLeft: 2,
};

const footerVersion: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  marginTop: 4,
  letterSpacing: 0.3,
};
