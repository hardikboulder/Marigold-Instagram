"use client";

/**
 * Data Management — export / import / reset for every localStorage namespace
 * the studio uses. Backup is the whole picture so a user can move between
 * browsers without losing calendar items, settings overrides, or asset
 * thumbnails.
 */

import { useRef, useState, type CSSProperties } from "react";
import {
  STORE_KEYS,
  deleteStore,
  getStore,
  setStore,
} from "@/lib/db/local-store";
import {
  cardHeader,
  cardStyle,
  dangerButton,
  eyebrow,
  primaryButton,
  secondaryButton,
  sectionHeader,
  sectionLead,
} from "./styles";

interface Props {
  onToast: (msg: string) => void;
}

const EXPORT_VERSION = 1;

interface ExportPayload {
  version: number;
  exported_at: string;
  data: Record<string, unknown>;
}

const ALL_KEYS = Object.values(STORE_KEYS);

export function DataManagement({ onToast }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
    onToast(`Exported ${Object.keys(data).length} stores.`);
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
        setImportError(null);
        onToast(`Imported ${restored} stores. Reload to see all changes.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setImportError(msg);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setImportError("Couldn't read that file.");
    };
    reader.readAsText(file);
  }

  function handleReset() {
    const ok = window.confirm(
      "Clear all overrides and exported assets? Calendar items remain. This cannot be undone.",
    );
    if (!ok) return;
    deleteStore(STORE_KEYS.brandConfigOverrides);
    deleteStore(STORE_KEYS.brandKnowledgeOverrides);
    deleteStore(STORE_KEYS.contentStrategy);
    deleteStore(STORE_KEYS.templateActive);
    deleteStore(STORE_KEYS.assets);
    onToast("Overrides and assets cleared. Reload to see all changes.");
  }

  return (
    <section style={wrapStyle}>
      <div style={{ marginBottom: 16 }}>
        <div style={eyebrow}>Data management</div>
        <h2 style={sectionHeader}>
          Back it up. <i style={{ color: "var(--hot-pink)" }}>Move it.</i>{" "}
          Reset it.
        </h2>
        <p style={sectionLead}>
          Everything you&rsquo;ve done lives in this browser&rsquo;s
          localStorage. Export downloads a JSON snapshot of every Marigold
          store; Import restores it on another machine. Reset wipes overrides
          back to the seeded defaults.
        </p>
      </div>

      <div style={dataGrid}>
        <article style={cardStyle}>
          <div style={cardHeader}>Export all data</div>
          <p style={dataParagraph}>
            Calendar items, settings overrides, exported asset records and
            thumbnails. One JSON file, ready to back up or move to another
            browser.
          </p>
          <button type="button" onClick={handleExport} style={primaryButton}>
            Download backup
          </button>
        </article>

        <article style={cardStyle}>
          <div style={cardHeader}>Import data</div>
          <p style={dataParagraph}>
            Restore from a previously exported JSON file. Matching stores will
            be overwritten — non-matching stores are left alone.
          </p>
          <button
            type="button"
            onClick={handleImportClick}
            style={secondaryButton}
          >
            Choose file…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChosen}
            style={{ display: "none" }}
          />
          {importError && <div style={errorLine}>{importError}</div>}
        </article>

        <article style={cardStyle}>
          <div style={cardHeader}>Reset to defaults</div>
          <p style={dataParagraph}>
            Clears settings overrides (voice, knowledge, strategy, templates)
            and the asset library. The seed data in{" "}
            <code style={inlineCode}>src/data/</code> stays untouched.
          </p>
          <button type="button" onClick={handleReset} style={dangerButton}>
            Reset overrides
          </button>
        </article>
      </div>
    </section>
  );
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

const wrapStyle: CSSProperties = {
  maxWidth: 1180,
  margin: "56px auto 0",
  paddingTop: 32,
  borderTop: "1px dashed rgba(75,21,40,0.18)",
};

const dataGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
};

const dataParagraph: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13.5,
  color: "var(--mauve)",
  lineHeight: 1.55,
  marginBottom: 16,
};

const errorLine: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--deep-pink)",
  marginTop: 12,
};

const inlineCode: CSSProperties = {
  background: "var(--blush)",
  padding: "2px 6px",
  borderRadius: 3,
  fontSize: 12,
};
