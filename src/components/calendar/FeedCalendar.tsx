"use client";

/**
 * Feed Calendar — primary studio dashboard.
 *
 * Three modes:
 *   GRID  — Instagram 3-col profile preview (default). Stories/reels strip
 *           sits at the top. Posts only land on the grid itself.
 *   WEEK  — day-column scheduling view; shows everything for a single week.
 *   MONTH — planner-style monthly grid with tiny thumbnails, designed to
 *           expose cadence holes and clusters at a glance.
 *
 * Cross-cutting features (all three modes share these):
 *   - Persistent series legend
 *   - Right-click / long-press quick actions on every tile
 *   - Multi-select + floating bulk-operations bar
 *   - AI-generated empty-day suggestions
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addCalendarItem,
  bulkAddCalendarItems,
  clearCalendar,
  deleteCalendarItem,
  getAllCalendarItems,
  syncCalendarItems,
  updateCalendarItem,
} from "@/lib/db/content-calendar-store";
import { buildSeedCalendarItems } from "@/lib/db/seed-calendar";
import {
  computeSubmissionStats,
  getAllSubmissions,
} from "@/lib/db/submissions-store";
import { CalendarSkeleton } from "@/components/app/Skeleton";
import { useToast } from "@/components/app/ToastProvider";
import { getTemplateBySlug } from "@/lib/db/data-loader";
import type {
  CalendarItem,
  CalendarItemInput,
  CalendarStatus,
} from "@/lib/types";
import { AddPostDialog, type AddPostPreset } from "./AddPostDialog";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { DayColumn } from "./DayColumn";
import type { EmptyDaySuggestion } from "./EmptyDayGhost";
import { FeedGridView } from "./FeedGridView";
import { FilterBar } from "./FilterBar";
import { GenerateWeekDialog } from "./GenerateWeekDialog";
import { MonthView } from "./MonthView";
import { NewSubmissionsBanner } from "./NewSubmissionsBanner";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { SeriesLegend } from "./SeriesLegend";
import { StoriesReelsBar } from "./StoriesReelsBar";
import {
  addDays,
  addWeeks,
  applyFilters,
  dayOfWeekName,
  defaultContentForTemplate,
  emptyFilters,
  filterItemsForWeek,
  formatWeekLabel,
  groupItemsByDay,
  isoDate,
  isoWeekNumber,
  nextStatus,
  parseIsoDate,
  startOfWeek,
  type CalendarFilters,
} from "./utils";

type ViewMode = "grid" | "week" | "month";

interface AddDialogState {
  open: boolean;
  defaultDate: Date;
  preset?: AddPostPreset;
}

export function FeedCalendar() {
  const toast = useToast();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [allItems, setAllItems] = useState<CalendarItem[]>([]);
  const [submissionStats, setSubmissionStats] = useState(() =>
    computeSubmissionStats(monthIso(new Date()), []),
  );
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date()),
  );
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [filters, setFilters] = useState<CalendarFilters>(emptyFilters());
  const [generateOpen, setGenerateOpen] = useState(false);
  const [addDialog, setAddDialog] = useState<AddDialogState>(() => ({
    open: false,
    defaultDate: new Date(),
  }));
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    item: CalendarItem;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setAllItems(getAllCalendarItems());
    setSubmissionStats(
      computeSubmissionStats(monthIso(new Date()), getAllSubmissions()),
    );
    setHydrated(true);
    // Pull latest from Supabase. The push will fire a storage-changed event
    // that rehydrates `allItems` from the cache.
    void syncCalendarItems();
    function onStorageChange() {
      setAllItems(getAllCalendarItems());
      setSubmissionStats(
        computeSubmissionStats(monthIso(new Date()), getAllSubmissions()),
      );
    }
    window.addEventListener("marigold:storage-changed", onStorageChange);
    return () =>
      window.removeEventListener("marigold:storage-changed", onStorageChange);
  }, []);

  const todayIso = isoDate(new Date());

  const filteredAll = useMemo(
    () => applyFilters(allItems, filters),
    [allItems, filters],
  );

  const visibleWeekItems = useMemo(() => {
    const inWeek = filterItemsForWeek(allItems, weekStart);
    return applyFilters(inWeek, filters);
  }, [allItems, weekStart, filters]);

  const weekBuckets = useMemo(
    () => groupItemsByDay(visibleWeekItems, weekStart),
    [visibleWeekItems, weekStart],
  );

  // ---------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------

  const refresh = useCallback(() => {
    setAllItems(getAllCalendarItems());
    setSubmissionStats(
      computeSubmissionStats(monthIso(new Date()), getAllSubmissions()),
    );
  }, []);

  const handleStatusChange = useCallback(
    (id: string, current: CalendarStatus) => {
      updateCalendarItem(id, { status: nextStatus(current) });
      refresh();
    },
    [refresh],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteCalendarItem(id);
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refresh();
    },
    [refresh],
  );

  function handleWeekAccept(items: CalendarItem[]) {
    if (items.length === 0) {
      setGenerateOpen(false);
      return;
    }
    const inputs: CalendarItemInput[] = items.map((item) => ({ ...item }));
    bulkAddCalendarItems(inputs);
    setGenerateOpen(false);
    refresh();
  }

  function handleAddPost(input: CalendarItemInput) {
    addCalendarItem(input);
    refresh();
    toast.success("Post added to the calendar.");
  }

  const handleSwapDates = useCallback(
    (sourceId: string, targetId: string) => {
      const source = allItems.find((i) => i.id === sourceId);
      const target = allItems.find((i) => i.id === targetId);
      if (!source || !target) return;
      updateCalendarItem(sourceId, {
        scheduled_date: target.scheduled_date,
        scheduled_time: target.scheduled_time,
        sort_order: target.sort_order,
      });
      updateCalendarItem(targetId, {
        scheduled_date: source.scheduled_date,
        scheduled_time: source.scheduled_time,
        sort_order: source.sort_order,
      });
      refresh();
      toast.success("Posts swapped — schedule updated.");
    },
    [allItems, refresh, toast],
  );

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
    if (items.length > 0) {
      setWeekStart(startOfWeek(new Date(items[0].scheduled_date + "T00:00:00")));
    }
    refresh();
    toast.success(
      `Loaded ${items.length} content items across ${weekCount} weeks.`,
    );
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
    setSelectedIds(new Set());
    refresh();
    toast.success("Calendar cleared.");
  }

  // ---------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------

  const toggleSelect = useCallback((id: string, additive?: boolean) => {
    setSelectedIds((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  function bulkApprove() {
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      const item = allItems.find((i) => i.id === id);
      if (!item) continue;
      if (item.status === "suggested" || item.status === "editing") {
        updateCalendarItem(id, { status: "approved" });
        count++;
      }
    }
    refresh();
    toast.success(`${count} item${count === 1 ? "" : "s"} approved.`);
  }

  function bulkExport() {
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      const item = allItems.find((i) => i.id === id);
      if (!item || item.status === "posted") continue;
      updateCalendarItem(id, { status: "exported" });
      count++;
    }
    refresh();
    toast.success(`${count} item${count === 1 ? "" : "s"} marked exported.`);
  }

  function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok = window.confirm(
      `Delete ${ids.length} selected item${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!ok) return;
    for (const id of ids) deleteCalendarItem(id);
    clearSelection();
    refresh();
    toast.success(`${ids.length} item${ids.length === 1 ? "" : "s"} deleted.`);
  }

  function bulkShift(days: number) {
    if (days === 0) return;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const item = allItems.find((i) => i.id === id);
      if (!item) continue;
      const newDate = addDays(parseIsoDate(item.scheduled_date), days);
      const iso = isoDate(newDate);
      updateCalendarItem(id, {
        scheduled_date: iso,
        week_number: isoWeekNumber(newDate),
        day_of_week: dayOfWeekName(newDate),
      });
    }
    refresh();
    toast.success(
      `Shifted ${ids.length} item${ids.length === 1 ? "" : "s"} ${days > 0 ? "+" : ""}${days} day${
        Math.abs(days) === 1 ? "" : "s"
      }.`,
    );
  }

  // ---------------------------------------------------------------------
  // Quick actions
  // ---------------------------------------------------------------------

  const handleEdit = useCallback(
    (item: CalendarItem) => {
      router.push(`/editor/${item.id}`);
    },
    [router],
  );

  const handleDuplicate = useCallback(
    (item: CalendarItem) => {
      const duplicateDate = addDays(parseIsoDate(item.scheduled_date), 1);
      addCalendarItem({
        scheduled_date: isoDate(duplicateDate),
        scheduled_time: item.scheduled_time,
        week_number: isoWeekNumber(duplicateDate),
        day_of_week: dayOfWeekName(duplicateDate),
        series_slug: item.series_slug,
        template_slug: item.template_slug,
        format: item.format,
        status: "suggested",
        content_data: { ...item.content_data },
        caption: item.caption,
        hashtags: [...item.hashtags],
        ai_rationale: item.ai_rationale,
        generation_prompt: item.generation_prompt,
        sort_order: item.sort_order,
      });
      refresh();
      toast.success("Duplicated — new copy saved as suggested.");
    },
    [refresh, toast],
  );

  const handleMoveDate = useCallback(
    (item: CalendarItem, dateIso: string) => {
      const date = parseIsoDate(dateIso);
      updateCalendarItem(item.id, {
        scheduled_date: dateIso,
        week_number: isoWeekNumber(date),
        day_of_week: dayOfWeekName(date),
      });
      refresh();
      toast.success(`Moved to ${dateIso}.`);
    },
    [refresh, toast],
  );

  const handleChangeTemplate = useCallback(
    (item: CalendarItem, templateSlug: string) => {
      const template = getTemplateBySlug(templateSlug);
      if (!template) {
        toast.error("Template not found.");
        return;
      }
      const defaults = defaultContentForTemplate(templateSlug);
      const merged = { ...defaults, ...item.content_data };
      updateCalendarItem(item.id, {
        template_slug: templateSlug,
        format: template.format,
        content_data: merged,
      });
      refresh();
      toast.success(`Switched to ${template.name}.`);
    },
    [refresh, toast],
  );

  const handleRegenerate = useCallback(
    async (item: CalendarItem) => {
      toast.info("Regenerating with AI…");
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "single",
            seriesSlug: item.series_slug,
            templateSlug: item.template_slug,
            userPrompt: item.generation_prompt ?? undefined,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "AI generation failed.");
        const generated = data.data as CalendarItem;
        updateCalendarItem(item.id, {
          content_data: generated.content_data,
          caption: generated.caption,
          hashtags: generated.hashtags,
          ai_rationale: generated.ai_rationale,
          status: "suggested",
        });
        refresh();
        toast.success("Regenerated — saved as a new suggestion.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Regeneration failed.",
        );
      }
    },
    [refresh, toast],
  );

  const handleDeleteItem = useCallback(
    (item: CalendarItem) => {
      const ok = window.confirm("Delete this post from the calendar?");
      if (!ok) return;
      handleDelete(item.id);
    },
    [handleDelete],
  );

  // ---------------------------------------------------------------------
  // Empty-day suggestion accept
  // ---------------------------------------------------------------------

  const handleAcceptSuggestion = useCallback(
    (date: Date, suggestion: EmptyDaySuggestion) => {
      setAddDialog({
        open: true,
        defaultDate: date,
        preset: {
          seriesSlug: suggestion.seriesSlug,
          templateSlug: suggestion.templateSlug,
          rationale: suggestion.rationale,
        },
      });
    },
    [],
  );

  const handleAddManual = useCallback((date: Date) => {
    setAddDialog({ open: true, defaultDate: date });
  }, []);

  // ---------------------------------------------------------------------
  // Header label per view
  // ---------------------------------------------------------------------

  const headerLabel = useMemo(() => {
    if (viewMode === "week") return formatWeekLabel(weekStart);
    if (viewMode === "month") {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(monthAnchor);
    }
    return "@themarigold grid";
  }, [viewMode, weekStart, monthAnchor]);

  function navigatePrev() {
    if (viewMode === "week") setWeekStart(addWeeks(weekStart, -1));
    else if (viewMode === "month") {
      setMonthAnchor(
        new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1),
      );
    }
  }
  function navigateNext() {
    if (viewMode === "week") setWeekStart(addWeeks(weekStart, 1));
    else if (viewMode === "month") {
      setMonthAnchor(
        new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1),
      );
    }
  }
  function navigateToday() {
    if (viewMode === "week") setWeekStart(startOfWeek(new Date()));
    else if (viewMode === "month") {
      const d = new Date();
      setMonthAnchor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  return (
    <div className="marigold-page-pad">
      <NewSubmissionsBanner />
      <header style={{ maxWidth: 1280, marginBottom: 32 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 6,
            color: "var(--pink)",
            marginBottom: 10,
          }}
        >
          The Marigold Content Studio
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 72,
            color: "var(--wine)",
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          Feed <i style={{ color: "var(--hot-pink)" }}>Calendar</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            color: "var(--mauve)",
            lineHeight: 1.6,
            maxWidth: 640,
          }}
        >
          The grid is the face. The week is the schedule. The month is the
          rhythm. Generate, edit, and stage everything across all three.
        </p>
      </header>

      {hydrated && submissionStats.total > 0 && (
        <SubmissionsBanner
          unused={submissionStats.unused}
          vendorsThisMonth={submissionStats.vendorsThisMonth}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <ViewModeTabs value={viewMode} onChange={setViewMode} />
      </div>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {viewMode !== "grid" && (
            <>
              <NavButton onClick={navigatePrev} aria-label="Previous">
                ←
              </NavButton>
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 32,
                  color: "var(--wine)",
                  minWidth: 280,
                  textAlign: "center",
                }}
              >
                {headerLabel}
              </div>
              <NavButton onClick={navigateNext} aria-label="Next">
                →
              </NavButton>
              <button
                type="button"
                onClick={navigateToday}
                style={todayButton}
              >
                Today
              </button>
            </>
          )}
          {viewMode === "grid" && (
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 22,
                color: "var(--mauve)",
              }}
            >
              shift+click a tile to multi-select · right-click for quick actions
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleClearCalendar}
            style={tertiaryAction}
            title="Wipe all locally-stored calendar items"
          >
            Clear Calendar
          </button>
          <button
            type="button"
            onClick={handleSeedCalendar}
            style={secondaryAction}
            title="Load the 3-month seed plan"
          >
            Seed Calendar
          </button>
          <button
            type="button"
            onClick={() =>
              setAddDialog({ open: true, defaultDate: weekStart })
            }
            style={secondaryAction}
          >
            + Add Post
          </button>
          <button
            type="button"
            onClick={() => setGenerateOpen(true)}
            style={primaryAction}
          >
            Generate Week
          </button>
        </div>
      </section>

      <div style={{ marginBottom: 16 }}>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <SeriesLegend
          items={filteredAll}
          soloPillar={filters.soloPillar}
          onTogglePillar={(slug) => {
            const next = filters.soloPillar === slug ? null : slug;
            setFilters({ ...filters, soloPillar: next, pillars: [] });
          }}
        />
      </div>

      {!hydrated ? (
        <CalendarSkeleton />
      ) : allItems.length === 0 ? (
        <FullEmptyState
          onSeed={handleSeedCalendar}
          onGenerate={() => setGenerateOpen(true)}
        />
      ) : viewMode === "grid" ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 22 }}
        >
          <StoriesReelsBar
            items={filteredAll}
            onAdd={() =>
              setAddDialog({ open: true, defaultDate: new Date() })
            }
          />
          <FeedGridView
            items={allItems}
            filters={filters}
            onSwapDates={handleSwapDates}
            onAddPost={(d) =>
              setAddDialog({ open: true, defaultDate: d ?? weekStart })
            }
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onContextMenu={(item, x, y) =>
              setContextMenu({ item, x, y })
            }
          />
        </div>
      ) : viewMode === "week" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(188px, 1fr))",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 16,
            }}
          >
            {weekBuckets.map((items, idx) => {
              const date = addDays(weekStart, idx);
              return (
                <DayColumn
                  key={idx}
                  date={date}
                  items={items}
                  isToday={isoDate(date) === todayIso}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  allItems={allItems}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onContextMenu={(item, x, y) =>
                    setContextMenu({ item, x, y })
                  }
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onAddManual={handleAddManual}
                />
              );
            })}
          </div>
          {visibleWeekItems.length === 0 && (
            <WeekEmptyState
              onGenerate={() => setGenerateOpen(true)}
              onAdd={() =>
                setAddDialog({ open: true, defaultDate: weekStart })
              }
            />
          )}
        </>
      ) : (
        <MonthView
          monthAnchor={monthAnchor}
          items={filteredAll}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onMoveDate={handleMoveDate}
          onChangeTemplate={handleChangeTemplate}
          onRegenerate={handleRegenerate}
          onDelete={handleDeleteItem}
          onAcceptSuggestion={handleAcceptSuggestion}
          onAddManual={handleAddManual}
        />
      )}

      <BulkOperationsBar
        selectedIds={Array.from(selectedIds)}
        items={allItems}
        onClear={clearSelection}
        onApprove={bulkApprove}
        onExport={bulkExport}
        onDelete={bulkDelete}
        onShift={bulkShift}
      />

      {contextMenu && (
        <QuickActionsMenu
          item={contextMenu.item}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onMoveDate={handleMoveDate}
          onChangeTemplate={handleChangeTemplate}
          onRegenerate={handleRegenerate}
          onDelete={handleDeleteItem}
        />
      )}

      <GenerateWeekDialog
        open={generateOpen}
        weekStart={weekStart}
        existingItems={allItems}
        onClose={() => setGenerateOpen(false)}
        onAccept={handleWeekAccept}
      />

      <AddPostDialog
        open={addDialog.open}
        defaultDate={addDialog.defaultDate}
        preset={addDialog.preset}
        recentItems={allItems}
        onClose={() => setAddDialog((s) => ({ ...s, open: false }))}
        onCreated={handleAddPost}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function monthIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function SubmissionsBanner({
  unused,
  vendorsThisMonth,
}: {
  unused: number;
  vendorsThisMonth: number;
}) {
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(new Date());
  return (
    <Link
      href="/submissions"
      style={submissionsBanner}
      aria-label="Open Submission Inbox"
    >
      <div style={submissionsBannerInner}>
        <div>
          <div style={submissionsEyebrow}>Vendor submissions</div>
          <div style={submissionsHeadline}>
            {unused > 0 ? (
              <>
                <strong style={{ color: "var(--deep-pink)" }}>{unused}</strong>{" "}
                unused submission{unused === 1 ? "" : "s"} waiting to ship
              </>
            ) : (
              <>All vendor submissions are planned or used. Inbox 0.</>
            )}
          </div>
        </div>
        <div style={submissionsStat}>
          <div style={submissionsStatValue}>{vendorsThisMonth}</div>
          <div style={submissionsStatLabel}>
            vendors featured · {monthLabel}
          </div>
        </div>
        <div style={submissionsCta}>Open inbox →</div>
      </div>
    </Link>
  );
}

interface ViewModeTabsProps {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}

function ViewModeTabs({ value, onChange }: ViewModeTabsProps) {
  const options: { key: ViewMode; label: string; hint: string }[] = [
    { key: "grid", label: "Grid", hint: "@themarigold profile preview" },
    { key: "week", label: "Week", hint: "scheduling, day by day" },
    { key: "month", label: "Month", hint: "cadence at a glance" },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        padding: 4,
        background: "var(--cream)",
        border: "1px solid rgba(75,21,40,0.08)",
        borderRadius: 999,
      }}
      role="tablist"
      aria-label="Feed view mode"
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            title={opt.hint}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              padding: "10px 22px",
              background: active ? "var(--wine)" : "transparent",
              color: active ? "var(--cream)" : "var(--wine)",
              border: `1px solid ${active ? "var(--wine)" : "rgba(75,21,40,0.18)"}`,
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface NavButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  "aria-label"?: string;
}

function NavButton({ onClick, children, ...rest }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: 22,
        width: 40,
        height: 40,
        background: "var(--cream)",
        color: "var(--wine)",
        border: "1px solid rgba(75,21,40,0.2)",
        borderRadius: 999,
        cursor: "pointer",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function FullEmptyState({
  onSeed,
  onGenerate,
}: {
  onSeed: () => void;
  onGenerate: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 40,
        padding: "64px 40px",
        background: "var(--blush)",
        border: "1px dashed rgba(75,21,40,0.25)",
        borderRadius: 18,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 48,
          color: "var(--wine)",
          lineHeight: 1.05,
          marginBottom: 14,
          fontStyle: "italic",
        }}
      >
        No content yet.
      </div>
      <p
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 26,
          color: "var(--pink)",
          marginBottom: 18,
        }}
      >
        Your Instagram feed is looking emptier than a mandap without flowers.
      </p>
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          color: "var(--mauve)",
          marginBottom: 28,
          maxWidth: 520,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.55,
        }}
      >
        Drop in the curated 3-month plan to start, or let Claude generate a week
        of stories, posts, and reels from your brand strategy.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button type="button" onClick={onSeed} style={secondaryAction}>
          Seed Calendar
        </button>
        <button type="button" onClick={onGenerate} style={primaryAction}>
          Generate Week
        </button>
      </div>
    </div>
  );
}

function WeekEmptyState({
  onGenerate,
  onAdd,
}: {
  onGenerate: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 40,
        padding: "40px 28px",
        background: "var(--blush)",
        border: "1px dashed rgba(75,21,40,0.2)",
        borderRadius: 14,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 30,
          color: "var(--pink)",
          marginBottom: 8,
        }}
      >
        nothing scheduled this week
      </div>
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          color: "var(--mauve)",
          marginBottom: 22,
          maxWidth: 480,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Let Claude plan the whole week from the brand strategy, or add a single
        post yourself.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button type="button" onClick={onAdd} style={secondaryAction}>
          + Add Post
        </button>
        <button type="button" onClick={onGenerate} style={primaryAction}>
          Generate Week
        </button>
      </div>
    </div>
  );
}

const primaryAction: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 22px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const secondaryAction: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 2,
  padding: "12px 22px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};

const submissionsBanner: React.CSSProperties = {
  display: "block",
  marginBottom: 20,
  padding: "16px 20px",
  background: "var(--blush)",
  border: "1px dashed rgba(153,53,86,0.3)",
  borderRadius: 14,
  textDecoration: "none",
};

const submissionsBannerInner: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 28,
  flexWrap: "wrap",
};

const submissionsEyebrow: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--pink)",
  marginBottom: 4,
};

const submissionsHeadline: React.CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 22,
  color: "var(--wine)",
  lineHeight: 1.3,
};

const submissionsStat: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  paddingLeft: 24,
  borderLeft: "1px dashed rgba(75,21,40,0.2)",
};

const submissionsStatValue: React.CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 32,
  color: "var(--wine)",
  lineHeight: 1,
};

const submissionsStatLabel: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
  marginTop: 4,
};

const submissionsCta: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--deep-pink)",
  marginLeft: "auto",
};

const tertiaryAction: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "12px 18px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const todayButton: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 999,
  cursor: "pointer",
  marginLeft: 8,
};
