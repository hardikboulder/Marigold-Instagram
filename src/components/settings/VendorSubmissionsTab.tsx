"use client";

/**
 * Vendor Submissions tab — manages the library of pre-written request
 * messages the studio team copies to vendors. Each template is editable;
 * "Reset" restores the seed wording from `DEFAULT_SUBMISSION_TEMPLATES`.
 */

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import {
  DEFAULT_SUBMISSION_TEMPLATES,
  getSubmissionTemplates,
  resetSubmissionTemplates,
  setSubmissionTemplates,
  type SubmissionRequestTemplate,
} from "@/lib/db/submissions-store";
import {
  cardHeader,
  cardStyle,
  eyebrow,
  fieldLabel,
  inputStyle,
  primaryButton,
  secondaryButton,
  sectionHeader,
  sectionLead,
  textareaStyle,
} from "./styles";

interface Props {
  onToast: (msg: string) => void;
}

export function VendorSubmissionsTab({ onToast }: Props) {
  const [templates, setTemplates] = useState<SubmissionRequestTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SubmissionRequestTemplate | null>(null);

  useEffect(() => {
    setTemplates(getSubmissionTemplates());
  }, []);

  function startEdit(template: SubmissionRequestTemplate) {
    setEditingId(template.id);
    setDraft({ ...template });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!draft) return;
    const next = templates.map((t) => (t.id === draft.id ? draft : t));
    setTemplates(next);
    setSubmissionTemplates(next);
    setEditingId(null);
    setDraft(null);
    onToast("Request template saved.");
  }

  function resetAll() {
    if (
      !window.confirm(
        "Reset all request templates to defaults? Your edits will be lost.",
      )
    ) {
      return;
    }
    resetSubmissionTemplates();
    setTemplates(DEFAULT_SUBMISSION_TEMPLATES);
    setEditingId(null);
    setDraft(null);
    onToast("Request templates reset to defaults.");
  }

  async function copyToClipboard(body: string, name: string) {
    try {
      await navigator.clipboard.writeText(body);
      onToast(`"${name}" copied to clipboard.`);
    } catch {
      onToast("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  return (
    <div>
      <div style={headerRow}>
        <div>
          <div style={eyebrow}>Vendor submissions</div>
          <h2 style={sectionHeader}>Request templates.</h2>
          <p style={sectionLead}>
            Pre-written messages you copy and send to vendors when you need
            content. Edit the wording to match your voice — placeholders like{" "}
            <code style={codeStyle}>{`{{vendor_name}}`}</code> and{" "}
            <code style={codeStyle}>{`{{category}}`}</code> are fill-in-the-blank
            cues; replace them by hand before sending.
          </p>
          <p
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: 18,
              color: "var(--mauve)",
              marginTop: -12,
              marginBottom: 24,
            }}
          >
            Submissions land in the{" "}
            <Link href="/submissions" style={inlineLinkStyle}>
              Submission Inbox
            </Link>
            .
          </p>
        </div>
        <div>
          <button type="button" onClick={resetAll} style={secondaryButton}>
            Reset to defaults
          </button>
        </div>
      </div>

      <div style={listStyle}>
        {templates.map((template) => {
          const isEditing = editingId === template.id;
          const view = isEditing && draft ? draft : template;
          return (
            <article
              key={template.id}
              style={{
                ...cardStyle,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <header style={cardHead}>
                <div>
                  <div style={cardHeader}>{view.name}</div>
                  <p style={cardDescription}>{view.description}</p>
                </div>
                <div style={cardActions}>
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(view.body, view.name)}
                        style={primaryButton}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(template)}
                        style={secondaryButton}
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        style={secondaryButton}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        style={primaryButton}
                      >
                        Save
                      </button>
                    </>
                  )}
                </div>
              </header>

              <div style={cardBody}>
                {isEditing && draft ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <label style={{ display: "block" }}>
                      <span style={fieldLabel}>Name</span>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) =>
                          setDraft({ ...draft, name: e.target.value })
                        }
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={fieldLabel}>Description</span>
                      <input
                        type="text"
                        value={draft.description}
                        onChange={(e) =>
                          setDraft({ ...draft, description: e.target.value })
                        }
                        style={inputStyle}
                      />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={fieldLabel}>Message body</span>
                      <textarea
                        value={draft.body}
                        onChange={(e) =>
                          setDraft({ ...draft, body: e.target.value })
                        }
                        rows={Math.min(20, draft.body.split("\n").length + 2)}
                        style={{
                          ...textareaStyle,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: 13,
                          minHeight: 240,
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <pre style={preStyle}>{view.body}</pre>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  marginBottom: 24,
  flexWrap: "wrap",
};

const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const cardHead: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  padding: "20px 24px 14px",
  borderBottom: "1px dashed rgba(75,21,40,0.12)",
  flexWrap: "wrap",
};

const cardActions: CSSProperties = {
  display: "flex",
  gap: 8,
  flexShrink: 0,
};

const cardDescription: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
  lineHeight: 1.5,
  margin: 0,
  maxWidth: 540,
};

const cardBody: CSSProperties = {
  padding: 24,
};

const preStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 13,
  lineHeight: 1.55,
  color: "var(--wine)",
  background: "var(--blush)",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 8,
  padding: 16,
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const codeStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  background: "rgba(75,21,40,0.06)",
  padding: "1px 6px",
  borderRadius: 4,
  color: "var(--wine)",
};

const inlineLinkStyle: CSSProperties = {
  color: "var(--deep-pink)",
  textDecoration: "underline",
};
