"use client";

import { AddPostDialog } from "@/components/calendar/AddPostDialog";
import { ReelTemplateModal } from "@/components/gallery/ReelTemplateModal";
import { addCalendarItem } from "@/lib/db/content-calendar-store";
import { useToast } from "@/components/app/ToastProvider";
import type { CalendarItemInput } from "@/lib/types";

// Slugs that represent reel templates — show the reel-specific dialog instead
// of the generic AddPostDialog.
const REEL_TEMPLATE_SLUGS = new Set(["confessional-reel"]);

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

  if (templateSlug && REEL_TEMPLATE_SLUGS.has(templateSlug)) {
    return (
      <ReelTemplateModal
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
