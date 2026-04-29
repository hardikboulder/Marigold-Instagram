"use client";

/**
 * Share modal for a public submission form.
 *
 * Tabs: Link / Email / DM / WhatsApp / QR. Each tab has a pre-written,
 * editable message that the user can copy with a single click. The QR tab
 * renders a PNG QR code (via the `qrcode` lib) that's downloadable.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import QRCode from "qrcode";
import type { FormConfig } from "@/lib/types";
import { getFormTemplateSeed } from "@/lib/db/form-templates";
import { getFormPublicSlug } from "@/lib/db/forms-store";
import { logOutreach } from "@/lib/db/outreach-log";
import { EmailComposerModal } from "@/components/submissions/EmailComposerModal";

interface Props {
  form: FormConfig | null;
  onClose: () => void;
  onCopied: (msg: string) => void;
}

type Tab = "link" | "email" | "dm" | "whatsapp" | "qr";

const TABS: { key: Tab; label: string }[] = [
  { key: "link", label: "Link" },
  { key: "email", label: "Email" },
  { key: "dm", label: "DM / Text" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "qr", label: "QR Code" },
];

export function ShareFormModal({ form, onClose, onCopied }: Props) {
  const [tab, setTab] = useState<Tab>("link");
  const [origin, setOrigin] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const url = useMemo(() => {
    if (!form || !origin) return "";
    return `${origin}/submit/${getFormPublicSlug(form)}`;
  }, [form, origin]);

  const [composerOpen, setComposerOpen] = useState(false);

  const audience = form
    ? getFormTemplateSeed(form.templateType)?.audience ?? "anyone"
    : "anyone";

  const audienceWord = useMemo(() => {
    switch (audience) {
      case "vendor":
        return "vendors";
      case "venue":
        return "venues";
      case "bride":
        return "brides";
      case "couple":
        return "couples";
      default:
        return "people you know";
    }
  }, [audience]);

  const audienceWordSingular = useMemo(() => {
    switch (audience) {
      case "vendor":
        return "vendor";
      case "venue":
        return "venue";
      case "bride":
        return "bride";
      case "couple":
        return "couple";
      default:
        return "friend";
    }
  }, [audience]);

  const [dmBody, setDmBody] = useState("");
  const [waBody, setWaBody] = useState("");

  // Reset DM / WhatsApp bodies whenever form / url changes. Email is now
  // handled by EmailComposerModal which has its own template-driven body.
  useEffect(() => {
    if (!form) return;
    setDmBody(
      `Hey! We're featuring ${audienceWord} on @themarigold's Instagram. Would love to include you! Fill this out (takes 2 min): ${url} 💛`,
    );
    setWaBody(
      [
        `Hi 💛`,
        ``,
        `We're @themarigold — a South Asian wedding planning platform.`,
        ``,
        `We're featuring ${audienceWord} and would love to include you.`,
        ``,
        `Takes 2 minutes:`,
        `${url}`,
        ``,
        `You'll be tagged + credited when it goes live ✨`,
      ].join("\n"),
    );
  }, [form, url, audienceWord, audienceWordSingular]);

  // Render QR code
  useEffect(() => {
    if (!url || tab !== "qr") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, url, {
      width: 320,
      margin: 2,
      color: {
        dark: "#4B1528", // wine
        light: "#FFFFFF",
      },
    })
      .then(() => setQrDataUrl(canvas.toDataURL("image/png")))
      .catch(() => {
        /* ignore */
      });
  }, [url, tab]);

  if (!form) return null;

  function copy(text: string, label: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      onCopied("Couldn't copy — your browser blocked clipboard access.");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => onCopied(`${label} copied to clipboard.`))
      .catch(() => onCopied("Couldn't copy — try again."));
  }

  function trackCopyLink() {
    if (!form) return;
    logOutreach({
      formId: getFormPublicSlug(form),
      templateType: form.templateType,
      recipient: "(link copied)",
      channel: "copy-link",
      url,
    });
  }

  function downloadQR() {
    if (!qrDataUrl || !form) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `marigold-${getFormPublicSlug(form)}.png`;
    a.click();
    logOutreach({
      formId: getFormPublicSlug(form),
      templateType: form.templateType,
      recipient: "(QR exported)",
      channel: "qr",
      url,
    });
  }

  return (
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Share form</div>
            <h2 style={titleStyle}>
              <i>{form.title}</i>
            </h2>
          </div>
          <button type="button" onClick={onClose} style={closeBtn} aria-label="Close">
            ×
          </button>
        </header>

        <nav style={tabsNav} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                ...tabBtn,
                ...(tab === t.key ? tabBtnActive : null),
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section style={panelStyle}>
          {tab === "link" && (
            <div style={paneStack}>
              <div style={fieldLabel}>Public URL</div>
              <div style={urlBoxStyle}>{url || "loading…"}</div>
              <div style={hintStyle}>
                Anyone with this link can submit. The form is public — no login
                needed.
              </div>
              <div style={actionsRow}>
                <button
                  type="button"
                  style={primaryBtn}
                  onClick={() => {
                    copy(url, "Link");
                    trackCopyLink();
                  }}
                >
                  Copy Link
                </button>
                <a
                  href={url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={ghostLink}
                >
                  Preview public page →
                </a>
              </div>
            </div>
          )}

          {tab === "email" && (
            <div style={paneStack}>
              <div style={fieldLabel}>Branded HTML email</div>
              <p style={hintStyle}>
                Open the composer to send a fully branded, designed email
                with the form link, a personal note, and a "what to expect"
                strip. Sends through Resend if configured — otherwise falls
                back to Copy HTML / mailto.
              </p>
              <div style={actionsRow}>
                <button
                  type="button"
                  style={primaryBtn}
                  onClick={() => setComposerOpen(true)}
                >
                  Open Email Composer
                </button>
                <button
                  type="button"
                  style={ghostBtn}
                  onClick={() => setComposerOpen(true)}
                >
                  Preview Without Sending
                </button>
              </div>
            </div>
          )}

          {tab === "dm" && (
            <div style={paneStack}>
              <div style={fieldLabel}>DM / SMS message</div>
              <textarea
                value={dmBody}
                onChange={(e) => setDmBody(e.target.value)}
                rows={5}
                style={textareaStyle}
              />
              <div style={actionsRow}>
                <button
                  type="button"
                  style={primaryBtn}
                  onClick={() => {
                    copy(dmBody, "Message");
                    if (form) {
                      logOutreach({
                        formId: getFormPublicSlug(form),
                        templateType: form.templateType,
                        recipient: "(DM/SMS copied)",
                        channel: "dm",
                        url,
                      });
                    }
                  }}
                >
                  Copy Message
                </button>
              </div>
            </div>
          )}

          {tab === "whatsapp" && (
            <div style={paneStack}>
              <div style={fieldLabel}>WhatsApp message</div>
              <textarea
                value={waBody}
                onChange={(e) => setWaBody(e.target.value)}
                rows={10}
                style={textareaStyle}
              />
              <div style={actionsRow}>
                <button
                  type="button"
                  style={primaryBtn}
                  onClick={() => {
                    copy(waBody, "WhatsApp message");
                    if (form) {
                      logOutreach({
                        formId: getFormPublicSlug(form),
                        templateType: form.templateType,
                        recipient: "(WhatsApp copied)",
                        channel: "whatsapp",
                        url,
                      });
                    }
                  }}
                >
                  Copy Message
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(waBody)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={ghostLink}
                  onClick={() => {
                    if (form) {
                      logOutreach({
                        formId: getFormPublicSlug(form),
                        templateType: form.templateType,
                        recipient: "(opened in WhatsApp)",
                        channel: "whatsapp",
                        url,
                      });
                    }
                  }}
                >
                  Open in WhatsApp →
                </a>
              </div>
            </div>
          )}

          {tab === "qr" && (
            <div style={{ ...paneStack, alignItems: "center" }}>
              <div style={fieldLabel}>QR code</div>
              <canvas ref={canvasRef} style={canvasStyle} />
              <div style={{ ...hintStyle, textAlign: "center" }}>
                Print on flyers, business cards, or show at events. Scans
                straight to the public form.
              </div>
              <div style={actionsRow}>
                <button type="button" style={primaryBtn} onClick={downloadQR}>
                  Download PNG
                </button>
                <button type="button" style={ghostBtn} onClick={() => copy(url, "Link")}>
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <EmailComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onToast={onCopied}
        initialFormType={form.templateType}
        formId={getFormPublicSlug(form)}
        url={url}
      />
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
  width: "min(720px, 100%)",
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: "8px 8px 0 var(--gold)",
  border: "1px solid rgba(75,21,40,0.12)",
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
  fontSize: 32,
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

const tabsNav: CSSProperties = {
  display: "flex",
  gap: 6,
  padding: "12px 28px",
  flexWrap: "wrap",
  borderBottom: "1px solid rgba(75,21,40,0.08)",
};

const tabBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px solid transparent",
  borderRadius: 999,
  cursor: "pointer",
};

const tabBtnActive: CSSProperties = {
  background: "var(--wine)",
  color: "var(--cream)",
  borderColor: "var(--wine)",
};

const panelStyle: CSSProperties = {
  padding: "20px 28px 28px",
};

const paneStack: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const fieldLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
};

const urlBoxStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "12px 14px",
  background: "white",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 8,
  color: "var(--wine)",
  wordBreak: "break-all",
};

const hintStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
  lineHeight: 1.5,
};

const textareaStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "12px 14px",
  background: "white",
  border: "1px solid rgba(75,21,40,0.15)",
  borderRadius: 8,
  color: "var(--wine)",
  resize: "vertical",
  lineHeight: 1.55,
};

const actionsRow: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
  marginTop: 8,
};

const primaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "2px 2px 0 var(--gold)",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "8px 14px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const ghostLink: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  textDecoration: "none",
};

const canvasStyle: CSSProperties = {
  background: "white",
  borderRadius: 8,
  padding: 8,
  border: "1px solid rgba(75,21,40,0.12)",
  boxShadow: "3px 3px 0 var(--gold)",
};
