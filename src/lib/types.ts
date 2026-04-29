/**
 * The Marigold — shared type definitions.
 *
 * Single source of truth for the shapes that flow through the local data
 * layer (JSON seed files + localStorage). Templates, AI prompts, the editor,
 * and the calendar all import from this module.
 */

// ---------------------------------------------------------------------------
// Brand config
// ---------------------------------------------------------------------------

export type BrandColorPalette = Record<string, string>;

export interface BrandTypography {
  display: string;
  ui: string;
  body: string;
  handwritten: string;
}

export interface BrandVoice {
  tone: string[];
  pillars: string[];
  do: string[];
  dont: string[];
  example_phrases: string[];
}

export interface BrandContentStrategy {
  posting_cadence: { format: ContentFormat; per_week: number }[];
  /**
   * Target distribution across the five Content Pillars. Replaces the
   * legacy `series_mix` as the strategic source of truth — series remain
   * useful as template groupings, but the calendar is balanced by pillar.
   */
  pillar_mix: { pillar_slug: PillarSlug; share: number }[];
  /**
   * @deprecated Retained so legacy seed data still parses. The active
   * generator reads `pillar_mix` instead.
   */
  series_mix?: { series_slug: string; share: number }[];
  notes: string[];
}

export type BrandConfigValue =
  | BrandColorPalette
  | BrandTypography
  | BrandVoice
  | BrandContentStrategy
  | Record<string, unknown>;

export interface BrandConfigEntry<V extends BrandConfigValue = BrandConfigValue> {
  config_key: string;
  config_value: V;
  description: string;
}

export interface BrandConfig {
  color_palette: BrandConfigEntry<BrandColorPalette>;
  typography: BrandConfigEntry<BrandTypography>;
  brand_voice: BrandConfigEntry<BrandVoice>;
  content_strategy: BrandConfigEntry<BrandContentStrategy>;
}

// ---------------------------------------------------------------------------
// Content pillars (top-level strategic purpose)
// ---------------------------------------------------------------------------

/**
 * The five Content Pillars are the primary organizing principle for the
 * studio. Every series and template maps to exactly one pillar. Pillars
 * are the way creators think about WHY a piece of content exists; series
 * are how related templates are grouped WITHIN a purpose.
 */
export type PillarSlug =
  | "engage"
  | "educate"
  | "inspire"
  | "connect"
  | "convert";

export interface ContentPillar {
  slug: PillarSlug;
  name: string;
  /** One-line description of the pillar's strategic purpose. */
  description: string;
  /** Tagline shown beneath section headers in the gallery. */
  tagline: string;
  /** Hex value also exposed via --pillar-{slug} CSS variable. */
  color: string;
  /** Target share of the weekly mix (0–1). */
  default_share: number;
  /** Display order in filter bars, gallery, summaries. */
  sort_order: number;
}

export const PILLAR_SLUGS: readonly PillarSlug[] = [
  "engage",
  "educate",
  "inspire",
  "connect",
  "convert",
] as const;

// ---------------------------------------------------------------------------
// Content series + templates
// ---------------------------------------------------------------------------

export type ContentFormat = "story" | "post" | "reel";

export type ContentSeriesPurpose =
  | "engagement"
  | "shares"
  | "awareness"
  | "ugc"
  | "value"
  | "conversion"
  | "community"
  | "general";

/**
 * Dominant grid colour for a piece of content. Used by the Feed Grid to
 * sequence posts so adjacent cells (horizontally and vertically) don't
 * collide on the same hue.
 *
 *   pink     — soft pink/blush tones (BvM bride side, Feature Callout, Hot Take Story)
 *   wine     — deep wine/burgundy tones (Confessional Title, Hot Take Post, Stat Callout)
 *   cream    — neutral cream/off-white tones (Confessional cards, Diary Entry, Vendor Tips)
 *   colorful — image-led or multi-colour tiles (Mood Board, Vendor Feature, Color Palette)
 */
export type GridColorProfile = "pink" | "wine" | "cream" | "colorful";

/**
 * Strategic role a series plays in the feed mix. Used to alternate posts
 * across a 3-column row so the grid reads as a balanced rhythm rather than
 * three of the same kind in a stripe.
 *
 *   engagement — comment-bait / share-bait (BvM, Confessional, Hot Take, ToT)
 *   value      — actionable info (Countdown, Vendor Tips, Planning 101, Budget)
 *   aesthetic  — image-led mood/colour (Mood Board, Vendor Feature, Venue, In Season)
 *   community  — UGC / shoutouts (Bride Life, Bride Connect, Community, Quiz shares)
 */
export type ContentMixCategory =
  | "engagement"
  | "value"
  | "aesthetic"
  | "community";

export interface ContentSeries {
  slug: string;
  name: string;
  description: string;
  /** The pillar this series belongs to — its strategic purpose. */
  pillar: PillarSlug;
  purpose: ContentSeriesPurpose;
  supported_formats: ContentFormat[];
  /** Default dominant grid colour for templates in this series. */
  grid_color_profile?: GridColorProfile;
  /** Strategic role this series plays in the feed mix. */
  content_mix_category?: ContentMixCategory;
  episode_seed_data?: Record<string, unknown>;
  ai_generation_prompt: string;
  is_active: boolean;
  sort_order: number;
}

export type EditableFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select";

export interface EditableFieldOption {
  value: string;
  label: string;
}

export interface EditableField {
  key: string;
  type: EditableFieldType;
  label: string;
  /** Default value used to seed new content for this field. */
  default?: string | number;
  /** Help text shown below the field in the editor. */
  helpText?: string;
  /** Validation: max character count for `text` / `textarea`. */
  maxLength?: number;
  /** Validation: min/max for `number`. */
  min?: number;
  max?: number;
  /** Options for `select`. */
  options?: EditableFieldOption[];
  /** When true, the field is required to mark content as approved. */
  required?: boolean;
}

export interface TemplateDimensions {
  width: number;
  height: number;
}

export interface TemplateVariantConfig {
  /** Variant key (e.g. "blush", "gold", "lavender"). */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Optional metadata used by the editor / AI (color, pin, etc.). */
  meta?: Record<string, unknown>;
}

export interface TemplateDefinition {
  slug: string;
  name: string;
  /** Slug of the parent ContentSeries (the template's "home" series). */
  series_slug: string;
  /**
   * Pillar this template belongs to. Inherited from the home series — kept
   * denormalized on the template so filters and grids don't have to
   * re-resolve the series for every render.
   */
  pillar: PillarSlug;
  /**
   * Additional series this template is compatible with. Used for "universal"
   * reel formats (e.g. TextRevealReel, PhotoMontageReel) that any series can
   * pull from. Omit or leave empty for series-specific templates.
   */
  compatible_series?: string[];
  format: ContentFormat;
  dimensions: TemplateDimensions;
  /** React component name as exported under src/components/templates/. */
  component_name: string;
  editable_fields: EditableField[];
  variant_config?: TemplateVariantConfig[];
  decorative_elements?: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Brand knowledge
// ---------------------------------------------------------------------------

export type BrandKnowledgeCategory =
  | "product_features"
  | "audience"
  | "tone"
  | "stats"
  | "competitors";

export interface BrandKnowledgeEntry {
  id: string;
  category: BrandKnowledgeCategory;
  title: string;
  content: string;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Content calendar (runtime — stored in localStorage)
// ---------------------------------------------------------------------------

export type CalendarStatus =
  | "suggested"
  | "approved"
  | "editing"
  | "exported"
  | "posted";

/** Free-form bag of values matching a template's editable_fields. */
export type ContentData = Record<string, unknown>;

/**
 * Recommended grid-cell coordinates for a feed post (1080×1080).
 *
 * The grid reads chronologically (newest top-left, oldest bottom-right),
 * but the AI generator stamps a *recommended* position so the editor can
 * surface "this lands at row 2, col 3" hints and so the Grid Health
 * sequencer has a stable target to rebalance against.
 *
 * Stories and reels don't appear on the grid (reels show via their cover),
 * so this stays null for non-post formats.
 */
export interface GridPosition {
  row: number; // 0-indexed, counted from the top of the grid
  column: number; // 0..2
}

export interface CalendarItem {
  id: string;
  /** ISO date — YYYY-MM-DD. */
  scheduled_date: string;
  /** 24h time — HH:MM. Optional for "no specific time" items. */
  scheduled_time: string | null;
  /** Optional planning bucket; the AI seed plan uses week numbers. */
  week_number?: number;
  /** Day of week for the scheduled date (lower-case, e.g. "monday"). */
  day_of_week?: string;
  series_slug: string;
  /** Pillar (denormalized from the chosen series) — primary calendar grouping. */
  pillar: PillarSlug;
  template_slug: string;
  format: ContentFormat;
  status: CalendarStatus;
  content_data: ContentData;
  caption: string | null;
  hashtags: string[];
  ai_rationale: string | null;
  generation_prompt: string | null;
  /**
   * Recommended grid coordinates for the post (null for stories/reels).
   * Set by the AI week generator; the rendered grid still sorts by date.
   */
  grid_position?: GridPosition | null;
  /** Sort order within a single day. */
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Input shape for `addCalendarItem` / `bulkAddCalendarItems`. The store
 * materializes a full CalendarItem from this — `pillar` is resolved from
 * the chosen series at write time, so callers don't have to know it.
 */
export type CalendarItemInput = Omit<
  CalendarItem,
  "id" | "created_at" | "updated_at" | "pillar"
> & {
  id?: string;
  pillar?: PillarSlug;
  created_at?: string;
  updated_at?: string;
};

// ---------------------------------------------------------------------------
// Exported assets (runtime — stored in localStorage)
// ---------------------------------------------------------------------------

export type AssetFileType = "png" | "jpg" | "mp4";

export interface AssetRecord {
  id: string;
  calendar_item_id: string;
  template_slug: string;
  series_slug?: string;
  file_type: AssetFileType;
  /** A data URL or blob URL — we don't persist the binary itself. */
  file_url: string;
  /**
   * Small base64 data URL preview (~320px wide). Persists across sessions in
   * localStorage so the Asset Library can render thumbnails after a reload,
   * unlike `file_url` (a session-scoped blob URL that the browser revokes).
   */
  thumbnail?: string;
  filename: string;
  dimensions: TemplateDimensions;
  file_size_bytes: number | null;
  /** Snapshot of the content_data + template at export time. */
  render_config: {
    template_slug: string;
    format: ContentFormat;
    content_data: ContentData;
    caption?: string | null;
    hashtags?: string[];
  };
  created_at: string;
}

export type AssetRecordInput = Omit<AssetRecord, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Vendor submissions (runtime — stored in localStorage)
// ---------------------------------------------------------------------------

export type VendorCategory =
  | "photographer"
  | "decorator"
  | "planner"
  | "venue"
  | "caterer"
  | "makeup"
  | "videographer"
  | "florist"
  | "mehndi"
  | "dj"
  | "other";

export type SubmissionType =
  | "photos"
  | "quote"
  | "tips"
  | "bio"
  | "wedding_recap"
  | "venue_package";

export type SubmissionStatus = "new" | "planned" | "used";

export interface VendorSubmission {
  id: string;
  vendor_name: string;
  category: VendorCategory;
  submission_type: SubmissionType;
  /** Long-form text content — quotes, tips, bio, testimonials. */
  text_content: string;
  /** Image URLs (hosted elsewhere). Storage upload comes later. */
  image_urls: string[];
  /** Internal notes about how to use this content. */
  notes: string;
  status: SubmissionStatus;
  /** When the submission has been turned into a calendar post, link back. */
  linked_calendar_item_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type VendorSubmissionInput = Omit<
  VendorSubmission,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

// ---------------------------------------------------------------------------
// Public submission forms (shareable links → /submit/[formId])
// ---------------------------------------------------------------------------

export type FormTemplateType =
  | "vendor"
  | "vendor-portfolio"
  | "vendor-tips"
  | "vendor-blog-post"
  | "venue"
  | "bride-confession"
  | "bride-connect"
  | "bride-diary"
  | "wedding-recap"
  | "general";

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multi-select"
  | "file"
  | "date"
  | "checkbox"
  | "month-year";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  /** When false, the field is hidden from the public form but kept in config. */
  enabled?: boolean;
  /** Help text shown beneath the field. */
  helpText?: string;
  /** Options for select / multi-select. */
  options?: string[];
  /** Character limit for text / textarea. */
  maxLength?: number;
  /** File upload: max number of files. */
  maxFiles?: number;
  /** File upload: max size per file in MB. */
  maxFileSize?: number;
  /** File upload: accepted MIME type prefixes (e.g. ["image/", "video/"]). */
  acceptedTypes?: string[];
}

export interface FormConfig {
  id: string;
  templateType: FormTemplateType;
  title: string;
  description: string;
  fields: FormField[];
  thankYouMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
}

export interface SubmissionFile {
  fieldId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  /** Local path under /public/submissions/... or remote URL. */
  filePath: string;
  thumbnailPath?: string;
}

export type FormSubmissionStatus =
  | "new"
  | "reviewed"
  | "saved-to-library"
  | "used"
  | "rejected";

export interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  templateType: FormTemplateType;
  /** Field values keyed by field ID. */
  data: Record<string, unknown>;
  files: SubmissionFile[];
  submittedAt: string;
  status: FormSubmissionStatus;
  notes: string;
}
