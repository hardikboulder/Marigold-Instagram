"use client";

/**
 * Form editor — modal dialog for customizing a FormConfig.
 *
 * Edit title / description / thank-you copy, reorder/add/remove/disable fields,
 * tweak per-field settings (label, placeholder, required, options, char limits,
 * file constraints).
 */

import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import type { FormConfig, FormField, FormFieldType } from "@/lib/types";
import { FIELD_TYPE_LABELS, blankField } from "@/lib/db/forms-store";

interface Props {
  form: FormConfig | null;
  onClose: () => void;
  onSave: (updates: Partial<FormConfig>) => void;
}

export function FormEditorDialog({ form, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!form) return;
    setTitle(form.title);
    setDescription(form.description);
    setThankYouMessage(form.thankYouMessage);
    setFields(form.fields.map((f) => ({ ...f })));
    setExpandedFieldId(null);
  }, [form]);

  if (!form) return null;

  function updateFieldAt(index: number, patch: Partial<FormField>) {
    setFields((arr) => arr.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function moveField(index: number, dir: -1 | 1) {
    setFields((arr) => {
      const next = [...arr];
      const target = index + dir;
      if (target < 0 || target >= next.length) return arr;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeField(index: number) {
    setFields((arr) => arr.filter((_, i) => i !== index));
  }

  function addField() {
    const f = blankField();
    setFields((arr) => [...arr, f]);
    setExpandedFieldId(f.id);
  }

  const formTitle = form?.title ?? "";

  function handleSave() {
    onSave({
      title: title.trim() || formTitle,
      description,
      thankYouMessage,
      fields,
    });
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Customize form</div>
            <h2 style={titleStyle}>
              <i>{title || "Untitled form"}</i>
            </h2>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Close">
            ×
          </button>
        </header>

        <div style={bodyStyle}>
          <section style={sectionStyle}>
            <label style={labelStyle}>
              <span style={labelText}>Form title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={textareaStyle}
              />
              <span style={hintStyle}>
                Shown beneath the title on the public page.
              </span>
            </label>

            <label style={labelStyle}>
              <span style={labelText}>Thank-you message</span>
              <textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                rows={3}
                style={textareaStyle}
              />
              <span style={hintStyle}>Shown after a successful submission.</span>
            </label>
          </section>

          <section style={sectionStyle}>
            <div style={fieldsHeader}>
              <h3 style={sectionTitle}>Fields</h3>
              <button type="button" onClick={addField} style={ghostBtn}>
                + Add field
              </button>
            </div>

            <div style={fieldList}>
              {fields.length === 0 && (
                <div style={emptyHint}>
                  No fields yet — add one to start collecting submissions.
                </div>
              )}
              {fields.map((field, index) => {
                const expanded = expandedFieldId === field.id;
                return (
                  <div key={field.id} style={fieldCardStyle(field.enabled !== false)}>
                    <div style={fieldRow}>
                      <button
                        type="button"
                        style={chevronBtn}
                        onClick={() =>
                          setExpandedFieldId(expanded ? null : field.id)
                        }
                        aria-label="Expand field"
                      >
                        {expanded ? "▾" : "▸"}
                      </button>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateFieldAt(index, { label: e.target.value })
                        }
                        style={fieldLabelInput}
                      />
                      <span style={fieldTypeBadge}>
                        {FIELD_TYPE_LABELS.find((t) => t.value === field.type)
                          ?.label ?? field.type}
                      </span>
                      <label style={requiredToggle}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateFieldAt(index, { required: e.target.checked })
                          }
                        />
                        <span>Required</span>
                      </label>
                      <label style={requiredToggle}>
                        <input
                          type="checkbox"
                          checked={field.enabled !== false}
                          onChange={(e) =>
                            updateFieldAt(index, { enabled: e.target.checked })
                          }
                        />
                        <span>Enabled</span>
                      </label>
                      <div style={fieldRowActions}>
                        <button
                          type="button"
                          style={iconBtn}
                          onClick={() => moveField(index, -1)}
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          style={iconBtn}
                          onClick={() => moveField(index, 1)}
                          disabled={index === fields.length - 1}
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          style={{ ...iconBtn, color: "var(--deep-pink)" }}
                          onClick={() => removeField(index)}
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div style={fieldDetail}>
                        <div style={detailGrid}>
                          <label style={smallLabel}>
                            <span style={labelText}>Field type</span>
                            <select
                              value={field.type}
                              onChange={(e) =>
                                updateFieldAt(index, {
                                  type: e.target.value as FormFieldType,
                                })
                              }
                              style={selectStyle}
                            >
                              {FIELD_TYPE_LABELS.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label style={smallLabel}>
                            <span style={labelText}>Placeholder</span>
                            <input
                              type="text"
                              value={field.placeholder ?? ""}
                              onChange={(e) =>
                                updateFieldAt(index, {
                                  placeholder: e.target.value,
                                })
                              }
                              style={inputStyle}
                            />
                          </label>

                          <label style={smallLabel}>
                            <span style={labelText}>Help text</span>
                            <input
                              type="text"
                              value={field.helpText ?? ""}
                              onChange={(e) =>
                                updateFieldAt(index, {
                                  helpText: e.target.value,
                                })
                              }
                              style={inputStyle}
                            />
                          </label>

                          {(field.type === "text" ||
                            field.type === "textarea") && (
                            <label style={smallLabel}>
                              <span style={labelText}>Max characters</span>
                              <input
                                type="number"
                                value={field.maxLength ?? ""}
                                onChange={(e) =>
                                  updateFieldAt(index, {
                                    maxLength: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  })
                                }
                                style={inputStyle}
                              />
                            </label>
                          )}

                          {field.type === "file" && (
                            <>
                              <label style={smallLabel}>
                                <span style={labelText}>Max files</span>
                                <input
                                  type="number"
                                  value={field.maxFiles ?? 1}
                                  onChange={(e) =>
                                    updateFieldAt(index, {
                                      maxFiles: Number(e.target.value) || 1,
                                    })
                                  }
                                  style={inputStyle}
                                />
                              </label>
                              <label style={smallLabel}>
                                <span style={labelText}>
                                  Max size per file (MB)
                                </span>
                                <input
                                  type="number"
                                  value={field.maxFileSize ?? 10}
                                  onChange={(e) =>
                                    updateFieldAt(index, {
                                      maxFileSize: Number(e.target.value) || 10,
                                    })
                                  }
                                  style={inputStyle}
                                />
                              </label>
                            </>
                          )}
                        </div>

                        {(field.type === "select" ||
                          field.type === "multi-select") && (
                          <label style={smallLabel}>
                            <span style={labelText}>
                              Options (one per line)
                            </span>
                            <textarea
                              value={(field.options ?? []).join("\n")}
                              onChange={(e) =>
                                updateFieldAt(index, {
                                  options: e.target.value
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              rows={Math.max(3, field.options?.length ?? 3)}
                              style={textareaStyle}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer style={footerStyle}>
          <button type="button" onClick={onClose} style={ghostBtn}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} style={primaryBtn}>
            Save changes
          </button>
        </footer>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(75,21,40,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1100,
  padding: 20,
};

const modalStyle: CSSProperties = {
  background: "var(--cream)",
  borderRadius: 16,
  width: "min(880px, 100%)",
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: "8px 8px 0 var(--gold)",
  border: "1px solid rgba(75,21,40,0.12)",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: CSSProperties = {
  padding: "24px 28px 12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  borderBottom: "1px dashed rgba(75,21,40,0.12)",
};

const eyebrowStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 4,
  color: "var(--pink)",
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  color: "var(--wine)",
  margin: "4px 0 0",
  lineHeight: 1.1,
};

const closeBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 28,
  lineHeight: 1,
  color: "var(--mauve)",
  cursor: "pointer",
};

const bodyStyle: CSSProperties = {
  padding: "20px 28px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 28,
};

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const sectionTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  margin: 0,
};

const fieldsHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelText: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
};

const inputStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "10px 12px",
  background: "white",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 6,
  color: "var(--wine)",
};

const textareaStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "10px 12px",
  background: "white",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 6,
  color: "var(--wine)",
  resize: "vertical",
  lineHeight: 1.5,
};

const selectStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "10px 12px",
  background: "white",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 6,
  color: "var(--wine)",
};

const hintStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  fontStyle: "italic",
};

const fieldList: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const emptyHint: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 18,
  color: "var(--mauve)",
  textAlign: "center",
  padding: 24,
  borderRadius: 12,
  background: "var(--blush)",
  border: "1px dashed rgba(75,21,40,0.2)",
};

function fieldCardStyle(enabled: boolean): CSSProperties {
  return {
    border: "1px solid rgba(75,21,40,0.12)",
    borderRadius: 10,
    padding: 12,
    background: "white",
    opacity: enabled ? 1 : 0.55,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };
}

const fieldRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const chevronBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 14,
  color: "var(--mauve)",
  cursor: "pointer",
  width: 24,
  textAlign: "center",
};

const fieldLabelInput: CSSProperties = {
  flex: 1,
  minWidth: 200,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "8px 12px",
  background: "transparent",
  border: "1px solid rgba(75,21,40,0.12)",
  borderRadius: 6,
  color: "var(--wine)",
};

const fieldTypeBadge: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "4px 8px",
  background: "var(--blush)",
  color: "var(--deep-pink)",
  borderRadius: 999,
};

const requiredToggle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--mauve)",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const fieldRowActions: CSSProperties = {
  marginLeft: "auto",
  display: "inline-flex",
  gap: 4,
};

const iconBtn: CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 4,
  padding: "4px 8px",
  color: "var(--wine)",
  cursor: "pointer",
  fontSize: 12,
};

const fieldDetail: CSSProperties = {
  borderTop: "1px dashed rgba(75,21,40,0.12)",
  paddingTop: 12,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const detailGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
};

const smallLabel: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const footerStyle: CSSProperties = {
  padding: "16px 28px",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  borderTop: "1px dashed rgba(75,21,40,0.12)",
  background: "rgba(212,168,83,0.08)",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const primaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 22px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "2px 2px 0 var(--gold)",
};
