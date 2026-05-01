"use client";

/**
 * Template Editor — SPEC §6.2.
 *
 * Two-panel layout (form left, live preview right) for a single CalendarItem
 * loaded from localStorage by route id. All edits auto-save with a 500ms
 * debounce. Export captures the right-panel TemplateFrame at native 1080
 * resolution, downloads the PNG, and records metadata via asset-store.
 */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { EditPanel } from "@/components/editor/EditPanel";
import { PreviewPanel } from "@/components/editor/PreviewPanel";
import { EditorSkeleton } from "@/components/app/Skeleton";
import { useToast } from "@/components/app/ToastProvider";
import { MediaBrowserDrawer } from "@/components/media/MediaBrowserDrawer";
import {
  resolveContentDataMedia,
  useMediaGeneration,
} from "@/lib/db/media-resolver";
import { parseMediaRef } from "@/lib/db/media-types";
import { trackMediaUsage } from "@/lib/db/media-store";
import {
  defaultContentForTemplate,
  getActiveTemplatesForSeries,
} from "@/components/calendar/utils";
import {
  getAllCalendarItems,
  getCalendarItemById,
  updateCalendarItem,
} from "@/lib/db/content-calendar-store";
import { saveAssetRecord } from "@/lib/db/asset-store";
import { getSubmissionById } from "@/lib/db/submissions-store";
import {
  getSeriesBySlug,
  getTemplateBySlug,
} from "@/lib/db/data-loader";
import {
  exportImage,
  exportThumbnailDataUrl,
} from "@/lib/export/export-image";
import { uploadToBucket, dataUrlToBlob } from "@/lib/export/storage-upload";
import type {
  CalendarItem,
  CalendarStatus,
  ContentData,
  ContentFormat,
  TemplateDefinition,
  VendorSubmission,
} from "@/lib/types";

interface DraftState {
  templateSlug: string;
  format: ContentFormat;
  contentData: ContentData;
  caption: string;
  hashtags: string[];
  userPrompt: string;
  status: CalendarStatus;
  scheduledDate: string;
  scheduledTime: string;
}

function itemToDraft(item: CalendarItem): DraftState {
  return {
    templateSlug: item.template_slug,
    format: item.format,
    contentData: item.content_data ?? {},
    caption: item.caption ?? "",
    hashtags: item.hashtags ?? [],
    userPrompt: item.generation_prompt ?? "",
    status: item.status,
    scheduledDate: item.scheduled_date,
    scheduledTime: item.scheduled_time ?? "",
  };
}

export default function TemplateEditorPage() {
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [hydrated, setHydrated] = useState(false);
  const [item, setItem] = useState<CalendarItem | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [allItems, setAllItems] = useState<CalendarItem[]>([]);
  const [regenerating, setRegenerating] = useState<"content" | "caption" | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false);
  const [mediaDrawerHeight, setMediaDrawerHeight] = useState(320);
  const [resolvedContentData, setResolvedContentData] = useState<ContentData>({});

  const mediaGeneration = useMediaGeneration();
  const previewInnerRef = useRef<HTMLDivElement>(null);

  // Load item from localStorage on mount and on id change.
  useEffect(() => {
    if (!id) return;
    const found = getCalendarItemById(id);
    if (found) {
      setItem(found);
      setDraft(itemToDraft(found));
    } else {
      setItem(null);
      setDraft(null);
    }
    setAllItems(getAllCalendarItems());
    setHydrated(true);
  }, [id]);

  // Debounced auto-save back to localStorage.
  useEffect(() => {
    if (!item || !draft) return;
    const handle = setTimeout(() => {
      try {
        const updated = updateCalendarItem(item.id, {
          template_slug: draft.templateSlug,
          format: draft.format,
          content_data: draft.contentData,
          caption: draft.caption || null,
          hashtags: draft.hashtags,
          generation_prompt: draft.userPrompt || null,
          status: draft.status,
          scheduled_date: draft.scheduledDate,
          scheduled_time: draft.scheduledTime || null,
        });
        setItem(updated);
        setAllItems(getAllCalendarItems());
        // Track media usage for any media: refs in the saved content_data.
        const ids = collectMediaIdsFromContent(draft.contentData);
        if (ids.length > 0) {
          void trackMediaUsage(ids, item.id);
        }
      } catch (err) {
        console.error("[editor] auto-save failed", err);
      }
    }, 500);
    return () => clearTimeout(handle);
    // We deliberately only depend on the draft fields. `item` updates after
    // each save and would cause an infinite loop if listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft?.templateSlug,
    draft?.format,
    draft?.contentData,
    draft?.caption,
    draft?.hashtags,
    draft?.userPrompt,
    draft?.status,
    draft?.scheduledDate,
    draft?.scheduledTime,
  ]);

  const template = useMemo<TemplateDefinition | null>(
    () => (draft ? getTemplateBySlug(draft.templateSlug) : null),
    [draft],
  );

  // Resolve any `media:<id>` refs in the draft content into blob URLs so the
  // live preview can render real images. Re-runs whenever the draft or the
  // media-store generation changes (so deleting/replacing media updates the
  // preview without a manual refresh).
  useEffect(() => {
    if (!draft) {
      setResolvedContentData({});
      return;
    }
    let cancelled = false;
    void resolveContentDataMedia(draft.contentData).then((resolved) => {
      if (!cancelled) setResolvedContentData(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [draft, mediaGeneration]);

  const series = useMemo(
    () => (item ? getSeriesBySlug(item.series_slug) : null),
    [item],
  );

  const templatesInSeries = useMemo<TemplateDefinition[]>(
    () => (item ? getActiveTemplatesForSeries(item.series_slug) : []),
    [item],
  );

  const submission = useMemo<VendorSubmission | null>(() => {
    const submissionId = draft?.contentData?._submissionId;
    if (typeof submissionId !== "string" || !submissionId) return null;
    return getSubmissionById(submissionId);
  }, [draft?.contentData]);

  const { prevItem, nextItem } = useMemo(() => {
    if (!item || allItems.length === 0)
      return { prevItem: null, nextItem: null };
    const idx = allItems.findIndex((i) => i.id === item.id);
    if (idx === -1) return { prevItem: null, nextItem: null };
    return {
      prevItem: idx > 0 ? allItems[idx - 1] : null,
      nextItem: idx < allItems.length - 1 ? allItems[idx + 1] : null,
    };
  }, [allItems, item]);

  // Field updaters
  const updateDraft = useCallback(
    (patch: Partial<DraftState>) => {
      setDraft((d) => (d ? { ...d, ...patch } : d));
    },
    [],
  );

  const handleTemplateChange = useCallback(
    (slug: string) => {
      const next = getTemplateBySlug(slug);
      if (!next || !draft) return;
      // Merge defaults for fields not present in the existing content_data so
      // a story↔post swap keeps shared keys but doesn't leave new fields blank.
      const defaults = defaultContentForTemplate(slug);
      const mergedContent: ContentData = { ...defaults, ...draft.contentData };
      updateDraft({
        templateSlug: slug,
        format: next.format,
        contentData: mergedContent,
      });
    },
    [draft, updateDraft],
  );

  const handleContentChange = useCallback(
    (key: string, value: string | number) => {
      setDraft((d) =>
        d
          ? { ...d, contentData: { ...d.contentData, [key]: value } }
          : d,
      );
    },
    [],
  );

  // AI calls
  const callApiGenerate = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "AI request failed.");
      return json.data;
    },
    [],
  );

  const handleRegenerateContent = useCallback(async () => {
    if (!draft || !item || regenerating) return;
    setRegenerating("content");
    setErrorMsg(null);
    try {
      const data = (await callApiGenerate({
        type: "single",
        seriesSlug: item.series_slug,
        templateSlug: draft.templateSlug,
        userPrompt: draft.userPrompt.trim() || undefined,
      })) as CalendarItem;
      updateDraft({
        contentData: data.content_data ?? draft.contentData,
        caption: data.caption ?? draft.caption,
        hashtags: data.hashtags ?? draft.hashtags,
      });
      toast.success("Content regenerated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      toast.error(`Regenerate failed: ${msg}`);
    } finally {
      setRegenerating(null);
    }
  }, [draft, item, regenerating, callApiGenerate, updateDraft, toast]);

  const handleRegenerateCaption = useCallback(async () => {
    if (!draft || !item || regenerating) return;
    setRegenerating("caption");
    setErrorMsg(null);
    try {
      const data = (await callApiGenerate({
        type: "caption",
        seriesSlug: item.series_slug,
        contentData: draft.contentData,
      })) as { caption: string; hashtags: string[] };
      updateDraft({
        caption: data.caption ?? "",
        hashtags: data.hashtags ?? [],
      });
      toast.success("Caption regenerated.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      toast.error(`Caption regenerate failed: ${msg}`);
    } finally {
      setRegenerating(null);
    }
  }, [draft, item, regenerating, callApiGenerate, updateDraft, toast]);

  // Export
  const handleExportPNG = useCallback(async () => {
    if (!item || !template || !previewInnerRef.current || exporting) return;
    setExporting(true);
    setErrorMsg(null);
    try {
      const filename = `${item.scheduled_date}_${item.series_slug}_${template.slug}`;
      const blob = await exportImage(previewInnerRef.current, {
        filename,
        download: true,
        width: template.dimensions.width,
        height: template.dimensions.height,
        overrideTransform: "scale(1)",
      });
      const recordId = (typeof crypto !== "undefined" && "randomUUID" in crypto)
        ? crypto.randomUUID()
        : `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

      let assetPath: string | undefined;
      try {
        const up = await uploadToBucket("assets", `${recordId}.png`, blob);
        assetPath = up.path;
      } catch (e) {
        console.warn("[editor] asset upload failed", e);
      }

      const thumbScale = 320 / template.dimensions.width;
      const thumbnailDataUrl = await exportThumbnailDataUrl(
        previewInnerRef.current,
        Math.round(template.dimensions.width * thumbScale),
        Math.round(template.dimensions.height * thumbScale),
      );
      let thumbPath: string | undefined;
      let thumbPublicUrl: string | undefined;
      try {
        const up = await uploadToBucket(
          "thumbnails",
          `${recordId}.jpg`,
          dataUrlToBlob(thumbnailDataUrl),
        );
        thumbPath = up.path;
        thumbPublicUrl = up.publicUrl;
      } catch (e) {
        console.warn("[editor] thumbnail upload failed", e);
      }

      saveAssetRecord({
        id: recordId,
        calendar_item_id: item.id,
        template_slug: template.slug,
        series_slug: item.series_slug,
        file_type: "png",
        file_path: assetPath,
        file_url: assetPath ? undefined : URL.createObjectURL(blob),
        thumbnail: thumbPublicUrl ?? thumbnailDataUrl,
        thumbnail_path: thumbPath,
        filename: `${filename}.png`,
        dimensions: template.dimensions,
        file_size_bytes: blob.size,
        render_config: {
          template_slug: template.slug,
          format: template.format,
          content_data: draft?.contentData ?? {},
          caption: draft?.caption ?? null,
          hashtags: draft?.hashtags ?? [],
        },
      });
      // Bump the calendar item to "exported" if it was anything earlier.
      if (
        draft &&
        draft.status !== "exported" &&
        draft.status !== "posted"
      ) {
        updateDraft({ status: "exported" });
      }
      toast.success(`Exported ${filename}.png`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      toast.error(`Export failed: ${msg}`);
    } finally {
      setExporting(false);
    }
  }, [item, template, draft, exporting, updateDraft, toast]);

  // Keyboard shortcuts: Cmd/Ctrl+S save, Cmd/Ctrl+E export, Cmd/Ctrl+R regenerate.
  useEffect(() => {
    if (!hydrated || !item || !draft) return;

    function handler(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key !== "s" && key !== "e" && key !== "r") return;
      // Don't hijack browser's "view source" if shift held.
      if (e.shiftKey) return;

      e.preventDefault();
      if (key === "s") {
        if (!item || !draft) return;
        try {
          updateCalendarItem(item.id, {
            template_slug: draft.templateSlug,
            format: draft.format,
            content_data: draft.contentData,
            caption: draft.caption || null,
            hashtags: draft.hashtags,
            generation_prompt: draft.userPrompt || null,
            status: draft.status,
            scheduled_date: draft.scheduledDate,
            scheduled_time: draft.scheduledTime || null,
          });
          toast.success("Saved.");
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Save failed.",
          );
        }
      } else if (key === "e") {
        handleExportPNG();
      } else if (key === "r") {
        handleRegenerateContent();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    hydrated,
    item,
    draft,
    handleExportPNG,
    handleRegenerateContent,
    toast,
  ]);

  // Render guards
  if (!hydrated) {
    return (
      <main style={mainStyle}>
        <header style={topBarStyle}>
          <Link href="/" style={backLink}>
            ← Calendar
          </Link>
        </header>
        <EditorSkeleton />
      </main>
    );
  }
  if (!item || !draft || !template) {
    return (
      <main style={mainStyle}>
        <header style={topBarStyle}>
          <Link href="/" style={backLink}>
            ← Calendar
          </Link>
        </header>
        <div style={notFoundWrap}>
          <div style={notFoundCard}>
            <div style={notFoundEyebrow}>404 · post not found</div>
            <h1 style={notFoundTitle}>
              This content piece <i style={{ color: "var(--hot-pink)" }}>doesn&apos;t exist.</i>
            </h1>
            <p style={notFoundBody}>
              It might have been deleted, or it was scheduled in a different
              browser. The id <code style={notFoundCode}>{id}</code> isn&apos;t
              in your local store.
            </p>
            <Link href="/" style={notFoundCta}>
              ← Back to Feed Calendar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <TopBar
        seriesName={series?.name ?? item.series_slug}
        nextItem={nextItem ?? null}
        prevItem={prevItem ?? null}
        onNavigate={(targetId) => router.push(`/editor/${targetId}`)}
      />

      {errorMsg && (
        <div style={errorBar}>
          <strong style={{ marginRight: 8 }}>Error:</strong>
          {errorMsg}
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            style={errorDismiss}
          >
            ×
          </button>
        </div>
      )}

      <div className="marigold-editor-layout">
        <aside className="marigold-editor-left">
          <EditPanel
            template={template}
            templatesInSeries={templatesInSeries}
            contentData={draft.contentData}
            caption={draft.caption}
            hashtags={draft.hashtags}
            userPrompt={draft.userPrompt}
            status={draft.status}
            scheduledDate={draft.scheduledDate}
            scheduledTime={draft.scheduledTime}
            regenerating={regenerating}
            exporting={exporting}
            submission={submission}
            onTemplateChange={handleTemplateChange}
            onContentChange={handleContentChange}
            onCaptionChange={(v) => updateDraft({ caption: v })}
            onHashtagsChange={(v) => updateDraft({ hashtags: v })}
            onUserPromptChange={(v) => updateDraft({ userPrompt: v })}
            onStatusChange={(v) => updateDraft({ status: v })}
            onScheduledDateChange={(v) => updateDraft({ scheduledDate: v })}
            onScheduledTimeChange={(v) => updateDraft({ scheduledTime: v })}
            onRegenerateContent={handleRegenerateContent}
            onRegenerateCaption={handleRegenerateCaption}
            onExportPNG={handleExportPNG}
          />
        </aside>

        <section className="marigold-editor-right">
          <PreviewPanel
            template={template}
            contentData={resolvedContentData}
            templatesInSeries={templatesInSeries}
            onTemplateChange={handleTemplateChange}
            innerRef={previewInnerRef}
          />
        </section>
      </div>

      <button
        type="button"
        onClick={() => setMediaDrawerOpen((v) => !v)}
        style={{
          ...mediaToggleBtn,
          bottom: mediaDrawerOpen ? mediaDrawerHeight + 12 : 24,
        }}
        title="Toggle Media browser"
      >
        {mediaDrawerOpen ? "Close Media ▾" : "Open Media ▴"}
      </button>

      <MediaBrowserDrawer
        open={mediaDrawerOpen}
        height={mediaDrawerHeight}
        onClose={() => setMediaDrawerOpen(false)}
        onResize={setMediaDrawerHeight}
      />
    </main>
  );
}

function collectMediaIdsFromContent(data: Record<string, unknown>): string[] {
  const out: string[] = [];
  function walk(v: unknown) {
    if (v == null) return;
    if (typeof v === "string") {
      const id = parseMediaRef(v);
      if (id && !out.includes(id)) out.push(id);
      return;
    }
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    if (typeof v === "object") {
      for (const x of Object.values(v as Record<string, unknown>)) walk(x);
    }
  }
  walk(data);
  return out;
}

interface TopBarProps {
  seriesName: string;
  prevItem: CalendarItem | null;
  nextItem: CalendarItem | null;
  onNavigate: (id: string) => void;
}

function TopBar({ seriesName, prevItem, nextItem, onNavigate }: TopBarProps) {
  return (
    <header style={topBarStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={backLink}>
          ← Calendar
        </Link>
        <span style={topDivider} />
        <div>
          <div style={topEyebrow}>Editing</div>
          <div style={topSeries}>{seriesName}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ShortcutHint />
        <NavButton
          disabled={!prevItem}
          onClick={() => prevItem && onNavigate(prevItem.id)}
          label="Previous"
        >
          ← Prev
        </NavButton>
        <NavButton
          disabled={!nextItem}
          onClick={() => nextItem && onNavigate(nextItem.id)}
          label="Next"
        >
          Next →
        </NavButton>
      </div>
    </header>
  );
}

function NavButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        ...navButtonStyle,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ShortcutHint() {
  const [meta, setMeta] = useState("Ctrl");
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setMeta(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl");
  }, []);
  return (
    <div
      style={shortcutHintStyle}
      title={`${meta}+S save · ${meta}+E export · ${meta}+R regenerate`}
    >
      <kbd style={kbdStyle}>{meta}</kbd>
      <span>S · E · R</span>
    </div>
  );
}

const mainStyle: CSSProperties = {
  background: "var(--cream)",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 28px",
  background: "var(--cream)",
  borderBottom: "1px solid rgba(75,21,40,0.08)",
  position: "sticky",
  top: 0,
  zIndex: 5,
};

const topEyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--pink)",
};

const topSeries: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  lineHeight: 1.1,
};

const topDivider: CSSProperties = {
  width: 1,
  height: 28,
  background: "rgba(75,21,40,0.15)",
};

const backLink: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--wine)",
  textDecoration: "none",
  padding: "8px 14px",
  border: "1px solid var(--wine)",
  borderRadius: 999,
  display: "inline-block",
};

const navButtonStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid rgba(75,21,40,0.3)",
  borderRadius: 999,
};

const errorBar: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--cream)",
  background: "var(--deep-pink)",
  padding: "10px 24px",
  display: "flex",
  alignItems: "center",
};

const errorDismiss: CSSProperties = {
  marginLeft: "auto",
  background: "transparent",
  border: "none",
  color: "var(--cream)",
  fontSize: 18,
  cursor: "pointer",
  lineHeight: 1,
};

const notFoundWrap: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
};

const notFoundCard: CSSProperties = {
  maxWidth: 560,
  background: "var(--blush)",
  border: "1px dashed rgba(75,21,40,0.2)",
  borderRadius: 18,
  padding: "48px 40px",
  textAlign: "center",
};

const notFoundEyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 4,
  color: "var(--pink)",
  marginBottom: 14,
};

const notFoundTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 48,
  color: "var(--wine)",
  marginBottom: 12,
  lineHeight: 1.05,
};

const notFoundBody: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.55,
  marginBottom: 24,
};

const notFoundCode: CSSProperties = {
  background: "rgba(75,21,40,0.08)",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "monospace",
};

const notFoundCta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 22px",
  background: "var(--wine)",
  color: "var(--cream)",
  borderRadius: 4,
  textDecoration: "none",
  display: "inline-block",
  boxShadow: "3px 3px 0 var(--gold)",
};

const shortcutHintStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  padding: "6px 10px",
  background: "rgba(75,21,40,0.04)",
  borderRadius: 999,
};

const mediaToggleBtn: CSSProperties = {
  position: "fixed",
  right: 24,
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "10px 16px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(75,21,40,0.28)",
  zIndex: 65,
  transition: "bottom 0.2s ease",
};

const kbdStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  background: "var(--cream)",
  color: "var(--wine)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 4,
  padding: "1px 6px",
  lineHeight: 1.2,
};
