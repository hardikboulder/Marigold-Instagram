/**
 * Shared types for the Media Library system.
 *
 * Media items are stored in IndexedDB (`marigold-media` database) so we can
 * keep large blobs out of localStorage. Collections are an organisational
 * layer that lives in localStorage alongside the rest of the app's user
 * preferences — they are simple string lists.
 */

export type MediaItemType = "image" | "video" | "text";
export type MediaSource = "upload" | "vendor-submission" | "generated";

export interface MediaItem {
  id: string;
  type: MediaItemType;
  fileName: string;
  mimeType: string;
  /** The raw file bytes (images / videos). Empty Blob for text items. */
  fileBlob: Blob;
  /** Auto-generated 300px-wide thumbnail. Same blob for text items (placeholder). */
  thumbnailBlob: Blob;
  width?: number;
  height?: number;
  /** Video duration in seconds. */
  duration?: number;
  /** Bytes — for text items, this is the byte length of the textContent. */
  fileSize: number;
  /** For text-type items: the actual content. */
  textContent?: string;
  tags: string[];
  collection: string;
  source: MediaSource;
  vendorName?: string;
  vendorCategory?: string;
  notes: string;
  /** CalendarItem IDs that reference this media. */
  usedIn: string[];
  createdAt: string;
  updatedAt: string;
  /**
   * Optional — the source submission ID when the item was saved out of the
   * Submission Inbox. Lets the detail panel link back to the submission.
   */
  submissionId?: string;
}

/**
 * Fields safe to mutate via `updateMediaItem`. Anything that requires
 * regenerating thumbnails or replacing the underlying file should go through
 * a higher-level helper instead of a direct patch.
 */
export type MediaItemPatch = Partial<
  Pick<
    MediaItem,
    | "fileName"
    | "tags"
    | "collection"
    | "source"
    | "vendorName"
    | "vendorCategory"
    | "notes"
    | "textContent"
    | "usedIn"
  >
>;

export const DEFAULT_COLLECTIONS: readonly string[] = [
  "Vendor Photos",
  "Venue Photos",
  "Product Shots",
  "Bride Photos",
  "Textures & Patterns",
  "Logos & Brand",
  "Video Clips",
  "Text & Quotes",
];

/** All accepted MIME types for upload. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

export const ACCEPTED_MIME_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
];

/** 50 MB. Browsers can handle more, but the IndexedDB write-time stalls for bigger blobs. */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function detectMediaType(mimeType: string): MediaItemType | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return null;
}

/**
 * Calendar items reference media by id using a `media:<uuid>` sentinel string.
 * Templates render the resolved blob URL — see `media-resolver.ts`.
 */
export const MEDIA_REF_PREFIX = "media:";

export function makeMediaRef(id: string): string {
  return `${MEDIA_REF_PREFIX}${id}`;
}

export function isMediaRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(MEDIA_REF_PREFIX);
}

export function parseMediaRef(value: unknown): string | null {
  if (!isMediaRef(value)) return null;
  return value.slice(MEDIA_REF_PREFIX.length);
}

/** Shape used by the drag-and-drop layer — small enough for `dataTransfer`. */
export interface MediaDragPayload {
  id: string;
  type: MediaItemType;
  fileName: string;
  mimeType: string;
  textContent?: string;
}

export const MEDIA_DRAG_MIME = "application/x-marigold-media";
