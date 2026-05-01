"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--cream)",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--cream)",
          border: "1px solid rgba(75,21,40,0.15)",
          borderRadius: 14,
          padding: 28,
          boxShadow: "4px 4px 0 var(--gold)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--pink)",
          }}
        >
          The Marigold
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 40,
            color: "var(--wine)",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Studio sign-in
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            color: "var(--mauve)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Enter your studio admin credentials.
        </p>

        <label style={labelStyle}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
        </label>

        <label style={labelStyle}>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
        </label>

        {error && (
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              color: "var(--deep-pink)",
              padding: "8px 10px",
              background: "var(--blush)",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            padding: "12px 18px",
            background: busy ? "var(--mauve)" : "var(--wine)",
            color: "var(--cream)",
            border: "none",
            borderRadius: 6,
            cursor: busy ? "wait" : "pointer",
            marginTop: 4,
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.6,
  textTransform: "uppercase" as const,
  color: "var(--mauve)",
};

const inputStyle = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  padding: "10px 12px",
  background: "white",
  border: "1px solid rgba(75,21,40,0.18)",
  borderRadius: 6,
  color: "var(--wine)",
};
