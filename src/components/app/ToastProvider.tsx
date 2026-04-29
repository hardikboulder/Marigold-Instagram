"use client";

/**
 * Lightweight toast provider for the whole studio.
 *
 * Anywhere in the tree: `const toast = useToast(); toast.success("Saved");`
 * Toasts auto-dismiss after ~4s, stack at the bottom, and are styled with the
 * brand wine/cream palette. Errors get a deep-pink accent. Success stays wine
 * with the gold drop-shadow that matches the rest of the app.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type ToastTone = "success" | "error" | "info";

interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;
const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, tone }]);
      if (typeof window !== "undefined") {
        window.setTimeout(() => remove(id), TOAST_DURATION_MS);
      }
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, "success"),
      error: (m) => show(m, "error"),
      info: (m) => show(m, "info"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={stackStyle} aria-live="polite" role="status">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              ...toastStyle,
              ...(t.tone === "error" ? errorToneStyle : null),
              ...(t.tone === "success" ? successToneStyle : null),
            }}
          >
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Dismiss notification"
              style={dismissStyle}
            >
              ×
            </button>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // In SSR or before mount we fall back to a no-op so call sites don't
    // throw. Real toasts surface as soon as the provider mounts.
    return {
      show: () => undefined,
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    };
  }
  return ctx;
}

const stackStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  zIndex: 1000,
  pointerEvents: "none",
};

const toastStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 0.4,
  padding: "14px 22px 14px 18px",
  borderRadius: 8,
  background: "var(--wine)",
  color: "var(--cream)",
  boxShadow: "4px 4px 0 var(--gold)",
  pointerEvents: "auto",
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 240,
  maxWidth: "min(560px, 92vw)",
};

const successToneStyle: CSSProperties = {
  background: "var(--wine)",
  boxShadow: "4px 4px 0 var(--gold)",
};

const errorToneStyle: CSSProperties = {
  background: "var(--deep-pink)",
  color: "white",
  boxShadow: "4px 4px 0 var(--wine)",
};

const dismissStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "inherit",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
  opacity: 0.75,
  padding: 0,
};
