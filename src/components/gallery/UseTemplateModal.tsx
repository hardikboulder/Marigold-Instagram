"use client";

import { AddPostDialog } from "@/components/calendar/AddPostDialog";
import { ReelTemplateModal } from "@/components/gallery/ReelTemplateModal";
import { DiaryReelTemplateModal } from "@/components/gallery/DiaryReelTemplateModal";
import { addCalendarItem } from "@/lib/db/content-calendar-store";
import { useToast } from "@/components/app/ToastProvider";
import type { CalendarItemInput } from "@/lib/types";

// Confessional-style karaoke reels (dark wine theme)
const CONFESSIONAL_REEL_SLUGS = new Set(["confessional-reel"]);

// Diary-style karaoke reels (lined paper, handwritten Caveat font)
const DIARY_REEL_SLUGS = new Set(["diary-reel-muhurat"]);

interface UseTemplateModalProps {
  open: boolean;
  seriesSlug: string;
  templateSlug?: string;
  templateName: string;
  onClose: () => void;
}

export function UseTemplateModal({
  open,
  seriesSlug,
  templateSlug,
  templateName,
  onClose,
}: UseTemplateModalProps) {
  const toast = useToast();

  function handleCreated(input: CalendarItemInput) {
    addCalendarItem(input);
    toast.success(`Added "${templateName}" to your calendar.`);
  }

  if (templateSlug && CONFESSIONAL_REEL_SLUGS.has(templateSlug)) {
    return (
      <ReelTemplateModal
        open={open}
        templateName={templateName}
        onClose={onClose}
      />
    );
  }

  if (templateSlug && DIARY_REEL_SLUGS.has(templateSlug)) {
    return (
      <DiaryReelTemplateModal
        open={open}
        templateName={templateName}
        onClose={onClose}
      />
    );
  }

  return (
    <AddPostDialog
      open={open}
      defaultDate={new Date()}
      preset={{
        seriesSlug,
        templateSlug,
        rationale: `Starting from "${templateName}". Pick a date, then choose a fill mode.`,
      }}
      onClose={onClose}
      onCreated={handleCreated}
    />
  );
}
