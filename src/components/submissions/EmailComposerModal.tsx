"use client";

/**
 * Rich in-app email composer for outreach.
 *
 * Two-pane layout:
 *   - Left (55%): live HTML preview of the branded email exactly as it
 *     will land in the recipient's inbox.
 *   - Right (45%): To, Template, Vendor/Bride name, Category, Subject,
 *     Personal note, and the Send button.
 *
 * Sends via POST /api/email/send (Resend). When no Resend API key is
 * configured the API returns 503 and the modal switches to fallback mode:
 * a "Copy as HTML" button and an "Open in Mail Client" mailto: link.
 *
 * Used in three places:
 *   - Submissions inbox "Request Content" button (pick form + send)
 *   - Settings → Submission Forms card "Send via Email" action
 *   - Settings → Submission Forms card "Preview Email" button (preview-only)
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  FORM_TEMPLATE_SEEDS,
  getFormTemplateSeed,
} from "@/lib/db/form-templates";
import {
  generateEmail,
  generatePlainTextFallback,
} from "@/lib/email/templates";
import { logOutreach } from "@/lib/db/outreach-log";
import type { FormTemplateType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  /** Initial form template type. */
  initialFormType: FormTemplateType;
  /** Form id used when logging outreach (defaults to the template type). */
  formId?: string;
  /**
   * Public submission URL used in the email body.
   *
   * When `allowFormTypeChange` is true, this is used as the initial URL but
   * the modal recomputes `${origin}/submit/${formType}` whenever the user
   * picks a different form type — so each template links to the right form.
   */
  url: string;
  /** When true, shows a form-type picker; otherwise the type is locked. */
  allowFormTypeChange?: boolean;
  /**
   * When true, the composer opens in preview-only mode: sample data is
   * pre-filled, fields are editable but the Send button is replaced with
   * a "Close Preview" button. Used by the "Preview Email" button in
   * Settings.
   */
  previewOnly?: boolean;
  /** Pre-fill the recipient field. */
  defaultTo?: string;
  /** Pre-fill the vendor/bride name field. */
  defaultVendorName?: string;
}

interface ConfigStatus {
  configured: boolean;
  from?: string;
  replyTo?: string | null;
}

const VENDOR_CATEGORY_OPTIONS = [
  "",
  "Photographer",
  "Videographer",
  "Decorator",
  "Caterer",
  "Makeup Artist",
  "Mehndi Artist",
  "DJ/Music",
  "Florist",
  "Invitation Designer",
  "Jeweler",
  "Outfit Designer",
  "Wedding Planner",
];

function isVendorCategoryRelevant(formType: FormTemplateType): boolean {
  return (
    formType === "vendor" ||
    formType === "vendor-portfolio" ||
    formType === "vendor-tips"
  );
}

function audienceNoun(formType: FormTemplateType): string {
  const seed = getFormTemplateSeed(formType);
  switch (seed?.audience) {
    case "vendor":
      return "Vendor name";
    case "venue":
      return "Venue contact name";
    case "bride":
      return "Bride name";
    case "couple":
      return "Couple names";
    default:
      return "Recipient name";
  }
}

function defaultPreviewName(formType: FormTemplateType): string {
  const seed = getFormTemplateSeed(formType);
  switch (seed?.audience) {
    case "vendor":
      return "Priya";
    case "venue":
      return "Aanya";
    case "bride":
      return "Riya";
    case "couple":
      return "Aarav & Priya";
    default:
      return "friend";
  }
}

export function EmailComposerModal({
  open,
  onClose,
  onToast,
  initialFormType,
  formId,
  url,
  allowFormTypeChange = false,
  previewOnly = false,
  defaultTo = "",
  defaultVendorName = "",
}: Props) {
  const [formType, setFormType] = useState<FormTemplateType>(initialFormType);
  const [to, setTo] = useState(defaultTo);
  const [vendorName, setVendorName] = useState(defaultVendorName);
  const [category, setCategory] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [subjectOverride, setSubjectOverride] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [origin, setOrigin] = useState("");
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  // When the user picks a different form type, recompute the URL from origin
  // so the email links to the right public form. If no origin is available
  // yet, fall back to the URL the parent passed in.
  const effectiveUrl = useMemo(() => {
    if (allowFormTypeChange && origin) {
      return `${origin}/submit/${formType}`;
    }
    return url;
  }, [allowFormTypeChange, origin, formType, url]);

  // Reset on open / form-type change.
  useEffect(() => {
    if (!open) return;
    setFormType(initialFormType);
    setSubjectOverride(null);
    setSending(false);
    if (previewOnly) {
      setTo("preview@example.com");
      setVendorName(defaultPreviewName(initialFormType));
      setPersonalNote("");
      setCategory(
        isVendorCategoryRelevant(initialFormType) ? "Photographer" : "",
      );
    } else {
      setTo(defaultTo);
      setVendorName(defaultVendorName);
      setPersonalNote("");
      setCategory("");
    }
  }, [open, initialFormType, previewOnly, defaultTo, defaultVendorName]);

  // Probe the email send API on mount to know whether we can actually send.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/email/send", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setConfig({
          configured: Boolean(data?.configured),
          from: data?.from,
          replyTo: data?.replyTo ?? null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setConfig({ configured: false });
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const generated = useMemo(
    () =>
      generateEmail({
        formType,
        vendorName: vendorName.trim() || (previewOnly ? defaultPreviewName(formType) : ""),
        formUrl: effectiveUrl,
        category: isVendorCategoryRelevant(formType) ? category : undefined,
        personalNote,
      }),
    [formType, vendorName, url, category, personalNote, previewOnly],
  );

  const subject = subjectOverride ?? generated.subject;

  // Push the latest HTML into the preview iframe whenever it changes.
  useEffect(() => {
    if (!open) return;
    const iframe = previewIframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(generated.html);
    doc.close();
  }, [open, generated.html]);

  const handleSend = useCallback(async () => {
    if (!to.trim()) {
      onToast("Add at least one email address.");
      return;
    }
    setSending(true);
    try {
      const recipients = to
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          subject,
          htmlBody: generated.html,
          formType,
          vendorName: vendorName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const msg = data?.error || "Couldn't send the email.";
        onToast(msg);
        if (data?.reason === "missing-api-key") {
          setConfig({ configured: false });
        }
        return;
      }
      logOutreach({
        formId: formId ?? formType,
        templateType: formType,
        recipient: recipients.join(", "),
        channel: "email",
        url: effectiveUrl,
        note: subject,
      });
      onToast(
        recipients.length === 1
          ? `Email sent to ${recipients[0]}.`
          : `Email sent to ${recipients.length} recipients.`,
      );
      onClose();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Couldn't reach the email service.",
      );
    } finally {
      setSending(false);
    }
  }, [
    to,
    subject,
    generated.html,
    formType,
    vendorName,
    formId,
    effectiveUrl,
    onToast,
    onClose,
  ]);

  function handleCopyHtml() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      onToast("Couldn't copy — your browser blocked clipboard access.");
      return;
    }
    navigator.clipboard
      .writeText(generated.html)
      .then(() => onToast("Email HTML copied to clipboard."))
      .catch(() => onToast("Couldn't copy — try again."));
  }

  function handleOpenInBrowser() {
    if (typeof window === "undefined") return;
    const blob = new Blob([generated.html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    // Browsers keep blob URLs alive for the tab session; revoke after 1 min
    // so we don't leak forever.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  function handleOpenMailClient() {
    if (!to.trim()) {
      onToast("Add an email address first.");
      return;
    }
    const recipients = to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(",");
    const fallback = generatePlainTextFallback({
      formType,
      vendorName,
      formUrl: effectiveUrl,
      category: isVendorCategoryRelevant(formType) ? category : undefined,
      personalNote,
    });
    const href = `mailto:${encodeURIComponent(recipients)}?subject=${encodeURIComponent(fallback.subject)}&body=${encodeURIComponent(fallback.body)}`;
    if (typeof window !== "undefined") {
      window.location.href = href;
    }
    logOutreach({
      formId: formId ?? formType,
      templateType: formType,
      recipient: recipients,
      channel: "email",
      url: effectiveUrl,
      note: `${fallback.subject} (mailto fallback)`,
    });
    onToast(`Opened your email client to send to ${recipients}.`);
    onClose();
  }

  if (!open) return null;

  const canSend = !previewOnly && config?.configured === true;
  const showFallback = !previewOnly && config !== null && !config.configured;

  const seed = getFormTemplateSeed(formType);

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>
              {previewOnly ? "Email preview" : "Compose email"}
            </div>
            <h2 style={titleStyle}>
              <i>{seed?.label ?? "Outreach Email"}</i>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={closeBtn}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div style={layoutStyle}>
          {/* Left — preview */}
          <section style={previewPaneStyle}>
            <div style={paneEyebrow}>Inbox preview</div>
            <iframe
              ref={previewIframeRef}
              title="Email preview"
              sandbox="allow-same-origin"
              style={previewIframeStyle}
            />
            <div style={previewActions}>
              <button
                type="button"
                style={ghostBtn}
                onClick={handleOpenInBrowser}
              >
                Open in browser
              </button>
            </div>
          </section>

          {/* Right — compose */}
          <section style={composePaneStyle}>
            <div style={paneEyebrow}>
              {previewOnly ? "Sample data" : "Compose"}
            </div>

            {showFallback && (
              <div style={fallbackBanner}>
                <strong style={{ fontWeight: 700 }}>
                  Email sending isn't configured.
                </strong>
                <span style={{ display: "block", marginTop: 4 }}>
                  Add{" "}
                  <code style={inlineCode}>RESEND_API_KEY</code> to{" "}
                  <code style={inlineCode}>.env.local</code> to send directly,
                  or use the fallback buttons below.
                </span>
              </div>
            )}

            <Field label="To (comma-separated)">
              <input
                type="text"
                value={to}
                placeholder="priya@example.com, raj@example.com"
                onChange={(e) => setTo(e.target.value)}
                style={inputStyle}
              />
            </Field>

            {allowFormTypeChange && (
              <Field label="Template">
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as FormTemplateType)
                  }
                  style={selectStyle}
                >
                  {FORM_TEMPLATE_SEEDS.map((s) => (
                    <option key={s.type} value={s.type}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={audienceNoun(formType)}>
              <input
                type="text"
                value={vendorName}
                placeholder={defaultPreviewName(formType)}
                onChange={(e) => setVendorName(e.target.value)}
                style={inputStyle}
              />
            </Field>

            {isVendorCategoryRelevant(formType) && (
              <Field label="Category (optional)">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={selectStyle}
                >
                  {VENDOR_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt || "— None —"}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Subject">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubjectOverride(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Personal note (optional)">
              <textarea
                value={personalNote}
                rows={3}
                placeholder="I saw your work at the Sharma wedding last month — stunning."
                onChange={(e) => setPersonalNote(e.target.value)}
                style={textareaStyle}
              />
              <div style={fieldHint}>
                Adds an italic line beneath the body — great for a single
                personal touch that proves the email isn't a blast.
              </div>
            </Field>

            <div style={publicUrlBlock}>
              <span style={publicUrlLabel}>Public URL</span>
              <code style={publicUrlValue}>{effectiveUrl || "loading…"}</code>
            </div>

            <div style={actionsRow}>
              {previewOnly ? (
                <button
                  type="button"
                  style={primaryBtn}
                  onClick={onClose}
                >
                  Close Preview
                </button>
              ) : canSend ? (
                <button
                  type="button"
                  style={{ ...primaryBtn, opacity: sending ? 0.6 : 1 }}
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Send Email"}
                </button>
              ) : (
                <button
                  type="button"
                  style={{ ...primaryBtn, opacity: 0.4, cursor: "not-allowed" }}
                  disabled
                  title="Add RESEND_API_KEY to .env.local to enable sending"
                >
                  Send Email
                </button>
              )}

              {showFallback && (
                <>
                  <button type="button" style={secondaryBtn} onClick={handleCopyHtml}>
                    Copy HTML
                  </button>
                  <button
                    type="button"
                    style={ghostBtn}
                    onClick={handleOpenMailClient}
                  >
                    Open in Mail Client
                  </button>
                </>
              )}
            </div>

            {config?.configured && config.from && (
              <div style={{ ...fieldHint, marginTop: 4 }}>
                Sending from <strong>{config.from}</strong>
                {config.replyTo ? (
                  <>
                    {" "}
                    · Reply-to <strong>{config.replyTo}</strong>
                  </>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={fieldGroup}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(75,21,40,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1100,
  padding: 20,
};

const modalStyle: CSSProperties = {
  background: "var(--cream)",
  borderRadius: 16,
  width: "min(1080px, 100%)",
  maxHeight: "92vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "8px 8px 0 var(--gold)",
  border: "1px solid rgba(75,21,40,0.12)",
};

const headerStyle: CSSProperties = {
  padding: "20px 24px 14px",
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

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 55fr) minmax(0, 45fr)",
  flex: 1,
  minHeight: 0,
  borderTop: "1px solid rgba(75,21,40,0.06)",
};

const previewPaneStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "16px 18px 18px",
  background: "var(--blush)",
  borderRight: "1px solid rgba(75,21,40,0.08)",
  minWidth: 0,
  overflow: "hidden",
};

const composePaneStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: "16px 22px 22px",
  overflowY: "auto",
};

const paneEyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
};

const previewIframeStyle: CSSProperties = {
  flex: 1,
  width: "100%",
  minHeight: 420,
  background: "#fff",
  border: "1px solid rgba(75,21,40,0.12)",
  borderRadius: 8,
};

const previewActions: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const fieldGroup: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const fieldLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
};

const fieldHint: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  lineHeight: 1.5,
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
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.55,
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  paddingRight: 36,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'><path fill='%239C2647' d='M3 5l4 4 4-4'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
};

const publicUrlBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "8px 12px",
  background: "rgba(212,168,83,0.1)",
  borderRadius: 6,
  border: "1px dashed rgba(75,21,40,0.18)",
};

const publicUrlLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--gold)",
};

const publicUrlValue: CSSProperties = {
  fontFamily: "'Space Grotesk', monospace",
  fontSize: 11,
  color: "var(--wine)",
  wordBreak: "break-all",
};

const fallbackBanner: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--wine)",
  background: "rgba(212,168,83,0.18)",
  border: "1px solid rgba(212,168,83,0.5)",
  padding: "10px 14px",
  borderRadius: 8,
};

const inlineCode: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  background: "rgba(75,21,40,0.08)",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 11,
};

const actionsRow: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 6,
};

const primaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "12px 22px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "2px 2px 0 var(--gold)",
};

const secondaryBtn: CSSProperties = {
  ...primaryBtn,
  background: "var(--deep-pink)",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "10px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};
