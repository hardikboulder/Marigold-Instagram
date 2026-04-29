"use client";

/**
 * Placeholder vendor dashboard at /vendor/dashboard.
 *
 * This is a scaffold — the real portal (profile editing, inquiry inbox,
 * analytics) ships later. For now it covers the minimum surface that makes
 * the "Create your account" CTA on the vendor thank-you screen actually
 * lead somewhere:
 *
 *   - Sign in against vendor-accounts-store.ts
 *   - Show the vendor's submission as a read-only profile card
 *   - List any blog posts they've submitted (looked up by email)
 *   - Disabled "Edit profile" and live "Write a new blog post" CTAs
 *
 * ─── PRODUCTION SWAP (Supabase) ──────────────────────────────────────────
 * The local-store reads here become a pair of Supabase queries:
 *   - supabase.auth.getSession() for the signed-in vendor
 *   - supabase.from('vendor_submissions').select() filtered by vendor_id
 * ─────────────────────────────────────────────────────────────────────────
 */

import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearVendorSession,
  getCurrentVendorSession,
  getVendorAccountById,
  verifyVendorLogin,
  type VendorAccount,
} from "@/lib/db/vendor-accounts-store";
import {
  getAllFormSubmissions,
} from "@/lib/db/form-submissions-store";
import type { FormSubmission } from "@/lib/types";

export function VendorDashboard() {
  const [hydrated, setHydrated] = useState(false);
  const [account, setAccount] = useState<VendorAccount | null>(null);

  useEffect(() => {
    const session = getCurrentVendorSession();
    if (session) {
      const found = getVendorAccountById(session.accountId);
      if (found) setAccount(found);
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div style={shell}>
        <div style={loadingText}>loading…</div>
      </div>
    );
  }

  if (!account) {
    return <SignInView onSignedIn={(a) => setAccount(a)} />;
  }

  return <SignedInView account={account} onSignOut={() => setAccount(null)} />;
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

function SignInView({ onSignedIn }: { onSignedIn: (a: VendorAccount) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyVendorLogin(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSignedIn(result.account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={shell}>
      <div style={inner}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>

        <section style={card}>
          <h1 style={title}>
            Vendor <i>sign in</i>
          </h1>
          <p style={lead}>
            Sign in to manage your listing on The Marigold.
          </p>

          <form onSubmit={onSubmit} style={form}>
            <label style={labelStack}>
              <span style={labelText}>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={input}
                autoComplete="email"
              />
            </label>

            <label style={labelStack}>
              <span style={labelText}>Password</span>
              <div style={passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputPassword}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={togglePasswordBtn}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && <div style={errorBanner}>{error}</div>}

            <button type="submit" disabled={submitting} style={primaryBtn}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            <div style={subtleRow}>
              <span style={subtleText}>Don't have an account yet?</span>{" "}
              <a href="/submit/vendor" style={inlineLink}>
                Submit your vendor profile →
              </a>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signed-in dashboard
// ---------------------------------------------------------------------------

function SignedInView({
  account,
  onSignOut,
}: {
  account: VendorAccount;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [blogPosts, setBlogPosts] = useState<FormSubmission[]>([]);

  useEffect(() => {
    const all = getAllFormSubmissions();
    const found =
      all.find((s) => s.id === account.submissionId) ??
      all.find(
        (s) =>
          s.formId === "vendor" &&
          (s.data as Record<string, unknown>).contact_email ===
            account.email,
      ) ??
      null;
    setSubmission(found);

    const posts = all.filter(
      (s) =>
        (s.formId === "blog" || s.templateType === "vendor-blog-post") &&
        (s.data as Record<string, unknown>).contact_email === account.email,
    );
    setBlogPosts(posts);
  }, [account.email, account.submissionId]);

  function handleSignOut() {
    clearVendorSession();
    onSignOut();
  }

  function handleStartBlog() {
    try {
      sessionStorage.setItem(
        "marigold-blog-prefill",
        JSON.stringify({
          name:
            ((submission?.data as Record<string, unknown>)?.contact_name as string) ??
            "",
          businessName: account.businessName,
          categoryLabel: account.category,
          city:
            ((submission?.data as Record<string, unknown>)?.cities_served as string) ??
            "",
          instagram:
            ((submission?.data as Record<string, unknown>)?.instagram as string) ??
            "",
          submissionId: account.submissionId,
        }),
      );
    } catch {
      // ignore
    }
    router.push("/submit/blog");
  }

  const data = (submission?.data ?? {}) as Record<string, unknown>;
  const contactName = typeof data.contact_name === "string" ? data.contact_name : "";
  const cities = typeof data.cities_served === "string" ? data.cities_served : "";
  const featureQuote = typeof data.feature_quote === "string" ? data.feature_quote : "";
  const instagram = typeof data.instagram === "string" ? data.instagram : "";

  return (
    <div style={shell}>
      <div style={inner}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>

        <section style={card}>
          <div style={headerRow}>
            <div>
              <h1 style={title}>
                Welcome back, <i>{account.businessName}</i>!
              </h1>
              <p style={lead}>Manage your listing and your contributions.</p>
            </div>
            <button type="button" onClick={handleSignOut} style={ghostBtn}>
              Sign out
            </button>
          </div>

          <div style={profileCard}>
            <div style={profileLabel}>Your profile</div>
            {submission ? (
              <dl style={profileGrid}>
                <DLRow label="Business" value={account.businessName} />
                <DLRow label="Category" value={account.category} />
                <DLRow label="Contact" value={contactName} />
                <DLRow label="Email" value={account.email} />
                {cities && <DLRow label="Cities served" value={cities} />}
                {instagram && <DLRow label="Instagram" value={`@${instagram}`} />}
                {featureQuote && <DLRow label="Feature quote" value={featureQuote} />}
              </dl>
            ) : (
              <p style={emptyHint}>
                We couldn't find your full submission in this browser's storage
                — your data is still safe with the Marigold team. The full
                vendor portal will pull this from our database soon.
              </p>
            )}
            <div style={editRow}>
              <button
                type="button"
                disabled
                title="Coming soon"
                style={disabledBtn}
              >
                Edit profile
              </button>
              <span style={comingSoon}>Coming soon</span>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={headerRow}>
            <div>
              <h2 style={subTitle}>Your blog posts</h2>
              <p style={lead}>
                Posts you've contributed to The Marigold.
              </p>
            </div>
            <button type="button" onClick={handleStartBlog} style={primaryBtn}>
              Write a new blog post
            </button>
          </div>

          {blogPosts.length === 0 ? (
            <p style={emptyHint}>
              You haven't submitted a blog post yet. Sharing one is the fastest
              way to get a backlink and feature on Instagram.
            </p>
          ) : (
            <ul style={blogList}>
              {blogPosts.map((post) => {
                const headline =
                  (post.data as Record<string, unknown>).blog_post_headline ??
                  "Untitled draft";
                const status = post.status;
                return (
                  <li key={post.id} style={blogItem}>
                    <div style={blogItemHeadline}>{String(headline)}</div>
                    <div style={blogItemMeta}>
                      Submitted{" "}
                      {new Date(post.submittedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · status: {status}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function DLRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <>
      <dt style={dt}>{label}</dt>
      <dd style={dd}>{value}</dd>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const shell: CSSProperties = {
  minHeight: "100vh",
  background: "var(--cream)",
  display: "flex",
  justifyContent: "center",
  padding: "32px 16px 64px",
};

const inner: CSSProperties = {
  width: "100%",
  maxWidth: 720,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const loadingText: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve)",
};

const brandHeader: CSSProperties = {
  textAlign: "center",
};

const brandThe: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 16,
  color: "var(--mauve)",
};

const brandMari: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 26,
  color: "var(--wine)",
};

const card: CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 28,
  border: "1px solid rgba(75,21,40,0.08)",
  boxShadow: "0 12px 32px rgba(75,21,40,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const title: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 32,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.15,
};

const subTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 24,
  color: "var(--wine)",
  margin: 0,
};

const lead: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.6,
  margin: "8px 0 0",
};

const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const form: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const labelStack: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelText: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: "var(--wine)",
};

const input: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 15,
  padding: "12px 14px",
  background: "var(--cream)",
  border: "1.5px solid rgba(75,21,40,0.15)",
  borderRadius: 8,
  color: "var(--wine)",
  outline: "none",
  width: "100%",
  minHeight: 46,
};

const passwordWrap: CSSProperties = { position: "relative", display: "flex" };

const inputPassword: CSSProperties = { ...input, paddingRight: 70 };

const togglePasswordBtn: CSSProperties = {
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  cursor: "pointer",
  padding: "6px 8px",
};

const errorBanner: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  padding: "10px 14px",
  background: "rgba(193,56,95,0.1)",
  color: "var(--deep-pink)",
  border: "1px solid rgba(193,56,95,0.3)",
  borderRadius: 8,
};

const primaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2.2,
  padding: "14px 22px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  boxShadow: "4px 4px 0 var(--gold)",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 16px",
  background: "transparent",
  color: "var(--wine)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 8,
  cursor: "pointer",
};

const disabledBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "10px 18px",
  background: "rgba(75,21,40,0.1)",
  color: "var(--mauve)",
  border: "1px solid rgba(75,21,40,0.1)",
  borderRadius: 8,
  cursor: "not-allowed",
};

const comingSoon: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 16,
  color: "var(--mauve)",
};

const subtleRow: CSSProperties = { textAlign: "center", marginTop: 4 };

const subtleText: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
};

const inlineLink: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--deep-pink)",
  textDecoration: "underline",
};

const profileCard: CSSProperties = {
  background: "var(--cream)",
  borderRadius: 12,
  padding: 18,
  border: "1px solid rgba(75,21,40,0.08)",
};

const profileLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 2.2,
  textTransform: "uppercase",
  color: "var(--deep-pink)",
  marginBottom: 12,
};

const profileGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "max-content 1fr",
  rowGap: 10,
  columnGap: 14,
  margin: 0,
};

const dt: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "var(--mauve)",
};

const dd: CSSProperties = {
  margin: 0,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  lineHeight: 1.5,
};

const editRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 16,
};

const emptyHint: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
  lineHeight: 1.6,
  margin: 0,
};

const blogList: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const blogItem: CSSProperties = {
  background: "var(--cream)",
  borderRadius: 10,
  padding: "12px 14px",
  border: "1px solid rgba(75,21,40,0.08)",
};

const blogItemHeadline: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 18,
  color: "var(--wine)",
};

const blogItemMeta: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  marginTop: 4,
};
