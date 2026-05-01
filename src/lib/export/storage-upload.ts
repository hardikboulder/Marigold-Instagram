/**
 * Browser-side helpers for uploading exported PNGs + thumbnails to
 * Supabase Storage via /api/storage/upload (server uses the service-role
 * key to actually write).
 */

export interface StorageUploadResult {
  path: string;
  publicUrl?: string;
}

export async function uploadToBucket(
  bucket: "assets" | "media" | "thumbnails" | "submissions",
  path: string,
  blob: Blob,
): Promise<StorageUploadResult> {
  const form = new FormData();
  form.append("bucket", bucket);
  form.append("path", path);
  form.append("file", blob);
  const res = await fetch("/api/storage/upload", { method: "POST", body: form });
  const json = (await res.json()) as {
    ok?: boolean;
    error?: string;
    path?: string;
    publicUrl?: string;
  };
  if (!json.ok || !json.path) {
    throw new Error(json.error ?? `Upload failed: ${res.status}`);
  }
  return { path: json.path, publicUrl: json.publicUrl };
}

/** Convert a base64 data URL (e.g. our thumbnail) to a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  if (!base64) throw new Error("Invalid data URL.");
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
