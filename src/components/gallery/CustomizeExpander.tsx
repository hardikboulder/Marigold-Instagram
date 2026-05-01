"use client";

import { useMemo, useState, useRef } from "react";
import { TemplateFrame } from "@/components/brand/TemplateFrame";
import { renderTemplate } from "@/components/calendar/template-renderer";
import { getTemplateBySlug } from "@/lib/db/data-loader";
import { defaultContentForTemplate } from "@/components/calendar/utils";
import { exportImage, exportThumbnailDataUrl } from "@/lib/export/export-image";
import { saveAssetRecord } from "@/lib/db/asset-store";
import { uploadToBucket, dataUrlToBlob } from "@/lib/export/storage-upload";
import type { ContentData, EditableField } from "@/lib/types";

interface CustomizeExpanderProps {
  templateSlug: string;
  onClose: () => void;
}

const FORMAT_DIMENSIONS = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
} as const;

export function CustomizeExpander({
  templateSlug,
  onClose,
}: CustomizeExpanderProps) {
  const template = getTemplateBySlug(templateSlug);
  const initial = useMemo<ContentData>(
    () => defaultContentForTemplate(templateSlug),
    [templateSlug],
  );
  const [data, setData] = useState<ContentData>(initial);
  const innerRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  if (!template) {
    return (
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <span style={panelTitleStyle}>Customize sample</span>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Close">
            ×
          </button>
        </div>
        <p style={emptyMessageStyle}>
          This template isn&apos;t registered in the data layer yet — its
          sample is hard-coded. Open the editor to iterate on a calendar item
          using this look.
        </p>
      </div>
    );
  }

  const previewFormat: "story" | "post" =
    template.format === "story" ? "story" : "post";

  function update(key: string, value: string | number) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setData(initial);
  }

  async function handleExport() {
    if (!innerRef.current || busy || !template) return;
    setBusy(true);
    try {
      const dims = FORMAT_DIMENSIONS[previewFormat];
      const filename = `${templateSlug}-custom`;
      const blob = await exportImage(innerRef.current, {
        filename,
        download: true,
        width: dims.width,
        height: dims.height,
        overrideTransform: "scale(1)",
      });
      try {
        const recordId = (typeof crypto !== "undefined" && "randomUUID" in crypto)
          ? crypto.randomUUID()
          : `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

        let assetPath: string | undefined;
        try {
          const up = await uploadToBucket("assets", `${recordId}.png`, blob);
          assetPath = up.path;
        } catch (e) {
          console.warn("[customize] asset upload failed", e);
        }

        const thumbScale = 320 / dims.width;
        const thumbnailDataUrl = await exportThumbnailDataUrl(
          innerRef.current,
          Math.round(dims.width * thumbScale),
          Math.round(dims.height * thumbScale),
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
          console.warn("[customize] thumbnail upload failed", e);
        }

        saveAssetRecord({
          id: recordId,
          calendar_item_id: `customize_${templateSlug}_${Date.now()}`,
          template_slug: templateSlug,
          series_slug: template.series_slug,
          file_type: "png",
          file_path: assetPath,
          file_url: assetPath ? undefined : URL.createObjectURL(blob),
          thumbnail: thumbPublicUrl ?? thumbnailDataUrl,
          thumbnail_path: thumbPath,
          filename: `${filename}.png`,
          dimensions: dims,
          file_size_bytes: blob.size,
          render_config: {
            template_slug: templateSlug,
            format: template.format,
            content_data: data,
            caption: null,
            hashtags: [],
          },
        });
      } catch (saveErr) {
        console.warn(`[customize] could not save asset record`, saveErr);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <span style={panelTitleStyle}>Customize sample · {template.name}</span>
        <button onClick={onClose} style={closeBtnStyle} aria-label="Close">
          ×
        </button>
      </div>

      <div style={panelBodyStyle}>
        <div style={previewColumnStyle}>
          <TemplateFrame
            format={previewFormat}
            innerRef={innerRef}
            scale={previewFormat === "story" ? 0.22 : 0.26}
          >
            {renderTemplate(templateSlug, data)}
          </TemplateFrame>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleExport}
              disabled={busy}
              style={primaryBtnStyle}
            >
              {busy ? "Exporting…" : "Export this version"}
            </button>
            <button type="button" onClick={reset} style={secondaryBtnStyle}>
              Reset
            </button>
          </div>
        </div>

        <div style={fieldsColumnStyle}>
          {template.editable_fields.length === 0 && (
            <p style={emptyMessageStyle}>
              This template has no editable fields — it&apos;s a static
              composition.
            </p>
          )}
          {template.editable_fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={data[field.key]}
              onChange={(v) => update(field.key, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FieldInputProps {
  field: EditableField;
  value: unknown;
  onChange: (next: string | number) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const stringValue = value == null ? "" : String(value);

  return (
    <label style={fieldWrapperStyle}>
      <span style={fieldLabelStyle}>
        {field.label}
        {field.required && <span style={{ color: "var(--deep-pink)" }}> *</span>}
      </span>

      {field.type === "textarea" ? (
        <textarea
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          maxLength={field.maxLength}
          style={inputStyle}
        />
      ) : field.type === "select" ? (
        <select
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          type="number"
          value={stringValue}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
        />
      ) : (
        <input
          type="text"
          value={stringValue}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {field.helpText && <span style={helpTextStyle}>{field.helpText}</span>}
    </label>
  );
}

const panelStyle: React.CSSProperties = {
  marginTop: 16,
  background: "var(--blush)",
  border: "1px dashed rgba(75,21,40,0.25)",
  borderRadius: 12,
  padding: 16,
  width: "100%",
  maxWidth: 880,
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const panelTitleStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.8,
  color: "var(--wine)",
};

const closeBtnStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 22,
  color: "var(--mauve)",
  cursor: "pointer",
  lineHeight: 1,
  padding: 4,
};

const panelBodyStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(240px, auto) 1fr",
  gap: 24,
  alignItems: "flex-start",
};

const previewColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const fieldsColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minWidth: 0,
};

const fieldWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--wine)",
};

const inputStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "8px 10px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.2)",
  borderRadius: 6,
  color: "var(--wine)",
  width: "100%",
  resize: "vertical" as const,
};

const helpTextStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 10,
  color: "var(--mauve)",
  lineHeight: 1.4,
};

const primaryBtnStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "9px 14px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold)",
};

const secondaryBtnStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "9px 14px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px solid var(--wine)",
  borderRadius: 4,
  cursor: "pointer",
};

const emptyMessageStyle: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  lineHeight: 1.5,
};
