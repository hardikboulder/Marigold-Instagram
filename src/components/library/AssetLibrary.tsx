"use client";

/**
 * Asset Library — SPEC §6.4.
 *
 * Grid of every record from the local asset-store with thumbnail, format,
 * series, and date. Re-export re-renders the template with the snapshotted
 * content_data and triggers a fresh download. Copy Caption pulls from the
 * snapshot. Filters: format, series, date range. Plus a Clear button.
 */

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import { renderTemplate } from "@/components/calendar/template-renderer";
import { seriesColor, FORMAT_BADGES } from "@/components/calendar/labels";
import { AssetGridSkeleton } from "@/components/app/Skeleton";
import { useToast } from "@/components/app/ToastProvider";
import {
  clearAssetRecords,
  deleteAssetRecord,
  getAssetRecords,
  syncAssetRecords,
} from "@/lib/db/asset-store";
import { exportImage } from "@/lib/export/export-image";
import { getTemplateBySlug } from "@/lib/db/data-loader";
import type { AssetRecord, ContentFormat } from "@/lib/types";

const FORMATS: ContentFormat[] = ["story", "post", "reel"];

interface DateRange {
  from: string;
  to: string;
}

interface OffscreenJob {
  asset: AssetRecord;
  resolve: (node: HTMLDivElement) => void;
}

export function AssetLibrary() {
  const toast = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [formatFilter, setFormatFilter] = useState<string[]>([]);
  const [seriesFilter, setSeriesFilter] = useState<string[]>([]);
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [zoomedAsset, setZoomedAsset] = useState<AssetRecord | null>(null);
  const [offscreenJob, setOffscreenJob] = useState<OffscreenJob | null>(null);

  const offscreenInnerRef = useRef<HTMLDivElement>(null);

  function refresh() {
    setAssets(getAssetRecords());
  }

  useEffect(() => {
    refresh();
    setHydrated(true);
    // Pull latest rows from Supabase so the cache reflects other devices /
    // sessions; refresh() picks them up via the storage-changed event.
    void syncAssetRecords();
    function onStorageChange() {
      refresh();
    }
    window.addEventListener("marigold:storage-changed", onStorageChange);
    return () =>
      window.removeEventListener("marigold:storage-changed", onStorageChange);
  }, []);

  const knownSeries = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) {
      const slug =
        a.series_slug ?? getTemplateBySlug(a.template_slug)?.series_slug ?? "";
      if (slug) set.add(slug);
    }
    return Array.from(set).sort();
  }, [assets]);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (formatFilter.length) {
        const fmt = a.render_config.format;
        if (!formatFilter.includes(fmt)) return false;
      }
      if (seriesFilter.length) {
        const slug =
          a.series_slug ??
          getTemplateBySlug(a.template_slug)?.series_slug ??
          "";
        if (!seriesFilter.includes(slug)) return false;
      }
      if (range.from && a.created_at < range.from) return false;
      if (range.to && a.created_at > range.to + "T23:59:59.999Z") return false;
      return true;
    });
  }, [assets, formatFilter, seriesFilter, range]);

  function toggleArrayValue(arr: string[], value: string): string[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  async function handleReExport(asset: AssetRecord) {
    if (busyAssetId) return;
    setBusyAssetId(asset.id);
    try {
      const node = await new Promise<HTMLDivElement>((resolve) => {
        setOffscreenJob({ asset, resolve });
      });
      const tpl = getTemplateBySlug(asset.template_slug);
      const dims = tpl?.dimensions ?? asset.dimensions;
      const filename = asset.filename.replace(/\.png$/, "");
      await exportImage(node, {
        filename,
        download: true,
        width: dims.width,
        height: dims.height,
        overrideTransform: "scale(1)",
      });
      toast.success(`Re-exported ${filename}.png`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Export failed: ${msg}`);
    } finally {
      setBusyAssetId(null);
      setOffscreenJob(null);
    }
  }

  // When the offscreen job mounts, hand the inner ref back to the awaiting
  // promise so the export can capture it.
  useEffect(() => {
    if (offscreenJob && offscreenInnerRef.current) {
      // Defer one tick so html-to-image sees the painted node.
      const handle = window.setTimeout(() => {
        if (offscreenInnerRef.current) {
          offscreenJob.resolve(offscreenInnerRef.current);
        }
      }, 50);
      return () => window.clearTimeout(handle);
    }
    return undefined;
  }, [offscreenJob]);

  async function handleCopyCaption(asset: AssetRecord) {
    const caption = asset.render_config.caption ?? "";
    const tags = (asset.render_config.hashtags ?? []).join(" ");
    const text = [caption, tags].filter(Boolean).join("\n\n");
    if (!text) {
      toast.info("No caption stored on this asset.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Caption copied.");
    } catch {
      toast.error("Couldn't copy — clipboard unavailable.");
    }
  }

  function handleDelete(asset: AssetRecord) {
    const ok = window.confirm(`Remove "${asset.filename}" from the library?`);
    if (!ok) return;
    deleteAssetRecord(asset.id);
    refresh();
    toast.success("Asset removed.");
  }

  function handleClearAll() {
    if (assets.length === 0) {
      toast.info("Library already empty.");
      return;
    }
    const ok = window.confirm(
      "Clear the entire asset library? This cannot be undone.",
    );
    if (!ok) return;
    clearAssetRecords();
    refresh();
    toast.success("Library cleared.");
  }

  const offscreenTemplate = offscreenJob
    ? getTemplateBySlug(offscreenJob.asset.template_slug)
    : null;

  return (
    <div className="marigold-page-pad" style={pageStyle}>
      <div style={heroStyle}>
        <div style={eyebrow}>The Marigold Content Studio</div>
        <h1 style={titleStyle}>
          Asset <i style={{ color: "var(--hot-pink)" }}>Library</i>
        </h1>
        <p style={leadStyle}>
          Every PNG you&rsquo;ve exported from the editor, with the content
          snapshot stored alongside. Re-export to download a fresh copy at
          native resolution; copy the caption straight to the clipboard before
          you post.
        </p>
      </div>

      <section style={controlsRow}>
        <FilterGroup label="Format">
          {FORMATS.map((fmt) => (
            <Chip
              key={fmt}
              label={FORMAT_BADGES[fmt].label}
              active={formatFilter.includes(fmt)}
              onClick={() =>
                setFormatFilter((arr) => toggleArrayValue(arr, fmt))
              }
            />
          ))}
        </FilterGroup>

        {knownSeries.length > 0 && (
          <FilterGroup label="Series">
            {knownSeries.map((slug) => (
              <Chip
                key={slug}
                label={slug}
                active={seriesFilter.includes(slug)}
                color={seriesColor(slug)}
                onClick={() =>
                  setSeriesFilter((arr) => toggleArrayValue(arr, slug))
                }
              />
            ))}
          </FilterGroup>
        )}

        <FilterGroup label="Date">
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
            style={dateInput}
            aria-label="From date"
          />
          <span style={dateSep}>→</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
            style={dateInput}
            aria-label="To date"
          />
          {(range.from || range.to) && (
            <button
              type="button"
              onClick={() => setRange({ from: "", to: "" })}
              style={ghostBtn}
            >
              Clear
            </button>
          )}
        </FilterGroup>

        <div style={{ marginLeft: "auto" }}>
          <button type="button" onClick={handleClearAll} style={dangerBtn}>
            Clear Library
          </button>
        </div>
      </section>

      {!hydrated ? (
        <AssetGridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState empty={assets.length === 0} />
      ) : (
        <div style={tileGrid}>
          {filtered.map((asset) => (
            <AssetTile
              key={asset.id}
              asset={asset}
              busy={busyAssetId === asset.id}
              onReExport={() => handleReExport(asset)}
              onCopyCaption={() => handleCopyCaption(asset)}
              onDelete={() => handleDelete(asset)}
              onZoom={() => setZoomedAsset(asset)}
            />
          ))}
        </div>
      )}

      {zoomedAsset && (
        <ZoomModal
          asset={zoomedAsset}
          onClose={() => setZoomedAsset(null)}
        />
      )}

      {offscreenJob && offscreenTemplate && (
        <div style={offscreenStage} aria-hidden="true">
          <TemplateFrame
            format={
              offscreenTemplate.format === "reel"
                ? "story"
                : offscreenTemplate.format
            }
            scale={1}
            innerRef={offscreenInnerRef}
          >
            {renderTemplate(
              offscreenJob.asset.template_slug,
              offscreenJob.asset.render_config.content_data,
            )}
          </TemplateFrame>
        </div>
      )}

    </div>
  );
}

interface AssetTileProps {
  asset: AssetRecord;
  busy: boolean;
  onReExport: () => void;
  onCopyCaption: () => void;
  onDelete: () => void;
  onZoom: () => void;
}

function AssetTile({
  asset,
  busy,
  onReExport,
  onCopyCaption,
  onDelete,
  onZoom,
}: AssetTileProps) {
  const seriesSlug =
    asset.series_slug ??
    getTemplateBySlug(asset.template_slug)?.series_slug ??
    "";
  const formatBadge = FORMAT_BADGES[asset.render_config.format];
  const exportedDate = formatExportDate(asset.created_at);

  return (
    <article style={tileCard}>
      <button
        type="button"
        onClick={onZoom}
        style={tileThumbBtn}
        aria-label={`Open larger preview of ${asset.filename}`}
      >
        {asset.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.thumbnail}
            alt={asset.filename}
            style={thumbImage}
          />
        ) : (
          <ThumbFallback asset={asset} />
        )}
        <span
          style={{
            ...formatBadgeStyle,
            background: formatBadge.bg,
            color: formatBadge.fg,
          }}
        >
          {formatBadge.label}
        </span>
      </button>
      <div style={tileBody}>
        <div
          style={{ ...seriesPill, background: seriesColor(seriesSlug) }}
        >
          {seriesSlug || "uncategorised"}
        </div>
        <div style={tileTitle}>{asset.template_slug}</div>
        <div style={tileMeta}>
          {asset.dimensions.width} × {asset.dimensions.height} ·{" "}
          {exportedDate}
        </div>
        <div style={tileActions}>
          <button
            type="button"
            onClick={onReExport}
            disabled={busy}
            style={{
              ...primaryBtn,
              opacity: busy ? 0.6 : 1,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Re-exporting…" : "Re-export"}
          </button>
          <button type="button" onClick={onCopyCaption} style={secondaryBtn}>
            Copy Caption
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={dangerLinkBtn}
            aria-label="Delete asset record"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function ThumbFallback({ asset }: { asset: AssetRecord }) {
  const tpl = getTemplateBySlug(asset.template_slug);
  if (!tpl) {
    return (
      <div style={fallbackBox}>
        <span style={fallbackText}>preview unavailable</span>
      </div>
    );
  }
  const previewFormat = tpl.format === "reel" ? "story" : tpl.format;
  const previewScale = previewFormat === "story" ? 0.16 : 0.18;
  return (
    <TemplateFrame format={previewFormat} scale={previewScale}>
      {renderTemplate(asset.template_slug, asset.render_config.content_data)}
    </TemplateFrame>
  );
}

function ZoomModal({
  asset,
  onClose,
}: {
  asset: AssetRecord;
  onClose: () => void;
}) {
  const tpl = getTemplateBySlug(asset.template_slug);
  const previewFormat =
    tpl?.format === "reel" ? "story" : tpl?.format ?? "post";
  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={modalOverlay}>
      <div onClick={(e) => e.stopPropagation()} style={modalInner}>
        <button type="button" onClick={onClose} style={modalClose}>
          Close
        </button>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {tpl ? (
            <TemplateFrame
              format={previewFormat}
              scale={previewFormat === "story" ? 0.4 : 0.5}
            >
              {renderTemplate(asset.template_slug, asset.render_config.content_data)}
            </TemplateFrame>
          ) : asset.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.thumbnail} alt={asset.filename} />
          ) : null}
        </div>
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <div style={tileMeta}>{asset.filename}</div>
          {asset.render_config.caption && (
            <p style={modalCaption}>{asset.render_config.caption}</p>
          )}
          {(asset.render_config.hashtags?.length ?? 0) > 0 && (
            <p style={modalHashtags}>
              {asset.render_config.hashtags?.join("  ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={filterGroup}>
      <span style={filterLabel}>{label}</span>
      {children}
    </div>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}

function Chip({ label, active, color, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...chipBase,
        background: active
          ? color ?? "var(--wine)"
          : "transparent",
        color: active ? "var(--cream)" : "var(--mauve)",
        borderColor: active ? color ?? "var(--wine)" : "rgba(75,21,40,0.2)",
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ empty }: { empty: boolean }) {
  if (!empty) {
    return (
      <div style={emptyState}>
        <div style={emptyTitle}>no assets match these filters</div>
        <p style={emptyLead}>
          Try clearing a filter or widening the date range.
        </p>
      </div>
    );
  }
  return (
    <div style={emptyState}>
      <div style={emptyHeadline}>Nothing exported yet.</div>
      <p style={emptyLead}>
        Your assets will show up here after you hit that Export button.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        <Link href="/" style={emptyCta}>
          Open the Calendar →
        </Link>
        <Link href="/gallery" style={emptyCtaGhost}>
          Browse Templates
        </Link>
      </div>
    </div>
  );
}

function formatExportDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

const pageStyle: CSSProperties = {
  background: "var(--cream)",
  minHeight: "100vh",
};

const heroStyle: CSSProperties = {
  maxWidth: 1280,
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

const controlsRow: CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto 24px",
  display: "flex",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
  padding: "16px 20px",
  background: "var(--blush)",
  borderRadius: 12,
};

const filterGroup: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
};

const filterLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--mauve)",
  marginRight: 4,
};

const chipBase: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "6px 12px",
  border: "1px solid",
  borderRadius: 999,
  cursor: "pointer",
};

const dateInput: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--wine)",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 4,
  padding: "6px 8px",
};

const dateSep: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "6px 10px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const dangerBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 16px",
  background: "transparent",
  color: "var(--deep-pink)",
  border: "1px solid var(--deep-pink)",
  borderRadius: 4,
  cursor: "pointer",
};

const tileGrid: CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
};

const tileCard: CSSProperties = {
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "3px 3px 0 rgba(212,168,83,0.18)",
  display: "flex",
  flexDirection: "column",
};

const tileThumbBtn: CSSProperties = {
  background: "var(--blush)",
  border: "none",
  cursor: "pointer",
  padding: 16,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 240,
};

const thumbImage: CSSProperties = {
  maxWidth: "100%",
  maxHeight: 240,
  borderRadius: 6,
  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
};

const formatBadgeStyle: CSSProperties = {
  position: "absolute",
  top: 12,
  left: 12,
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "4px 8px",
  borderRadius: 4,
};

const seriesPill: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "4px 10px",
  borderRadius: 999,
  color: "var(--wine)",
  alignSelf: "flex-start",
  marginBottom: 6,
};

const tileBody: CSSProperties = {
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 4,
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
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
};

const primaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 14px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "2px 2px 0 var(--gold)",
};

const secondaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};

const dangerLinkBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 6px",
  background: "transparent",
  color: "var(--deep-pink)",
  border: "none",
  cursor: "pointer",
  marginLeft: "auto",
};

const fallbackBox: CSSProperties = {
  width: "100%",
  height: 200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--blush)",
  borderRadius: 6,
};

const fallbackText: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 22,
  color: "var(--mauve)",
};

const offscreenStage: CSSProperties = {
  position: "fixed",
  top: -10000,
  left: -10000,
  pointerEvents: "none",
  zIndex: -1,
};

const emptyState: CSSProperties = {
  maxWidth: 720,
  margin: "40px auto 0",
  padding: "56px 40px",
  background: "var(--blush)",
  borderRadius: 16,
  border: "1px dashed rgba(75,21,40,0.25)",
  textAlign: "center",
};

const emptyHeadline: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 44,
  color: "var(--wine)",
  lineHeight: 1.05,
  marginBottom: 14,
};

const emptyTitle: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--pink)",
  marginBottom: 12,
};

const emptyLead: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.55,
  margin: "0 auto 22px",
  maxWidth: 480,
};

const emptyCta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 20px",
  background: "var(--wine)",
  color: "var(--cream)",
  borderRadius: 4,
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "3px 3px 0 var(--gold)",
};

const emptyCtaGhost: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 20px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  textDecoration: "none",
  display: "inline-block",
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

const modalCaption: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  lineHeight: 1.55,
  marginTop: 8,
  whiteSpace: "pre-wrap",
};

const modalHashtags: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  marginTop: 8,
};
