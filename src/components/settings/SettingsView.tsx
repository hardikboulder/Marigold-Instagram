"use client";

/**
 * Brand Settings — SPEC §6.3.
 *
 * Five tabs (Voice & Tone, Product Knowledge, Content Strategy, Design Tokens,
 * Template Library) plus a Data Management section. All edits are persisted
 * as overrides under `marigold:*` localStorage namespaces — see settings-store.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { useToast } from "@/components/app/ToastProvider";
import { ContentStrategyTab } from "./ContentStrategyTab";
import { DataManagement } from "./DataManagement";
import { DesignTokensTab } from "./DesignTokensTab";
import { ProductKnowledgeTab } from "./ProductKnowledgeTab";
import { TemplateLibraryTab } from "./TemplateLibraryTab";
import { VendorSubmissionsTab } from "./VendorSubmissionsTab";
import { VoiceToneTab } from "./VoiceToneTab";
import { SubmissionFormsTab } from "./forms/SubmissionFormsTab";

const TABS = [
  { key: "voice", label: "Voice & Tone" },
  { key: "knowledge", label: "Product Knowledge" },
  { key: "strategy", label: "Content Strategy" },
  { key: "tokens", label: "Design Tokens" },
  { key: "templates", label: "Template Library" },
  { key: "submissions", label: "Vendor Submissions" },
  { key: "forms", label: "Submission Forms" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SettingsView() {
  const toast = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState<TabKey>("voice");

  useEffect(() => {
    setHydrated(true);
  }, []);

  const showToast = (msg: string) => toast.show(msg);

  return (
    <div className="marigold-page-pad" style={pageStyle}>
      <div style={heroBlock}>
        <div style={eyebrow}>The Marigold Content Studio</div>
        <h1 style={titleStyle}>
          Brand <i style={{ color: "var(--hot-pink)" }}>Settings</i>
        </h1>
        <p style={leadStyle}>
          Voice, product knowledge, content strategy, design tokens, and
          templates — every dial the AI engine pulls from when it generates a
          week of content. Edits save to your browser; export below to back up.
        </p>
      </div>

      <nav style={tabsNav} role="tablist" aria-label="Settings sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            style={{
              ...tabButton,
              ...(active === t.key ? tabButtonActive : null),
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section style={tabPanel}>
        {!hydrated ? (
          <div style={loadingHint}>loading the brand…</div>
        ) : (
          <>
            {active === "voice" && <VoiceToneTab onToast={showToast} />}
            {active === "knowledge" && (
              <ProductKnowledgeTab onToast={showToast} />
            )}
            {active === "strategy" && (
              <ContentStrategyTab onToast={showToast} />
            )}
            {active === "tokens" && <DesignTokensTab />}
            {active === "templates" && (
              <TemplateLibraryTab onToast={showToast} />
            )}
            {active === "submissions" && (
              <VendorSubmissionsTab onToast={showToast} />
            )}
            {active === "forms" && <SubmissionFormsTab onToast={showToast} />}
          </>
        )}
      </section>

      {hydrated && <DataManagement onToast={showToast} />}
    </div>
  );
}

const pageStyle: CSSProperties = {
  background: "var(--cream)",
  minHeight: "100vh",
};

const heroBlock: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto 32px",
};

const eyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 6,
  color: "var(--pink)",
  marginBottom: 10,
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 72,
  color: "var(--wine)",
  lineHeight: 1,
  marginBottom: 14,
};

const leadStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 720,
};

const tabsNav: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto 24px",
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  borderBottom: "1px solid rgba(75,21,40,0.12)",
  paddingBottom: 8,
};

const tabButton: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px solid transparent",
  borderRadius: 999,
  cursor: "pointer",
};

const tabButtonActive: CSSProperties = {
  background: "var(--wine)",
  color: "var(--cream)",
  borderColor: "var(--wine)",
};

const tabPanel: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const loadingHint: CSSProperties = {
  padding: 80,
  textAlign: "center",
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve)",
};

