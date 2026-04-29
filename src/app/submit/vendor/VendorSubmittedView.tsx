"use client";

/**
 * Post-submission onboarding screen at /submit/vendor.
 *
 * Replaces the old single-card thank-you with a multi-section flow:
 *   1. Confirmation     — green checkmark, hero greeting, mini preview card
 *   2. Create account   — opt-in vendor portal signup (writes to localStorage)
 *   3. Write a blog post — pre-filled handoff to /submit/blog
 *   4. Stay connected    — Instagram, contact email, logo
 *
 * The intent is to convert "you submitted, thanks" into two valuable next
 * steps for the vendor without making either feel mandatory.
 */

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createVendorAccount } from "@/lib/db/vendor-accounts-store";
import { getCategoryById } from "@/app/submit/vendor/vendor-form-schema";
import { getTopicsForCategory } from "@/lib/blog/topics";

export interface VendorProfile {
  vendorCategory: string;
  vendorName: string;
  vendorLocation: string;
  vendorQuote: string;
  startingPriceText?: string;
  imageUrl?: string;
}

/** Subset of the raw vendor form values we hand off to the blog prefill. */
export interface VendorOnboardingContext {
  contactName: string;
  businessName: string;
  categoryId: string;
  categoryLabel: string;
  city: string;
  instagramHandle: string;
  contactEmail: string;
  bioOrQuote: string;
  headshotDataUrl?: string;
}

interface Props {
  vendorProfile: VendorProfile;
  submissionId: string;
  firstPhoto?: { name: string; dataUrl: string };
  onboardingContext: VendorOnboardingContext;
}

export function VendorSubmittedView({
  vendorProfile,
  submissionId,
  firstPhoto,
  onboardingContext,
}: Props) {
  const blogSectionRef = useRef<HTMLDivElement | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);

  function handleAccountCreated() {
    setAccountCreated(true);
    // Smooth scroll to the blog section once the success message is visible.
    window.setTimeout(() => {
      blogSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 600);
  }

  return (
    <div style={pageWrap}>
      <KeyframesStyle />
      <div style={pageInner}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>

        <ConfirmationSection
          vendorProfile={vendorProfile}
          firstPhoto={firstPhoto}
        />

        <AccountSection
          submissionId={submissionId}
          context={onboardingContext}
          accountCreated={accountCreated}
          onAccountCreated={handleAccountCreated}
        />

        <div ref={blogSectionRef}>
          <BlogSection
            submissionId={submissionId}
            context={onboardingContext}
          />
        </div>

        <FooterSection />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1 — Confirmation
// ---------------------------------------------------------------------------

function ConfirmationSection({
  vendorProfile,
  firstPhoto,
}: {
  vendorProfile: VendorProfile;
  firstPhoto?: { name: string; dataUrl: string };
}) {
  const previewName = vendorProfile.vendorName || "Your business";
  const previewLocation = vendorProfile.vendorLocation || "Your city";
  const previewQuote =
    vendorProfile.vendorQuote ||
    "Every wedding is a love story you'll never forget.";
  const previewCategory = vendorProfile.vendorCategory || "WEDDING VENDOR";
  const previewImage = firstPhoto?.dataUrl ?? vendorProfile.imageUrl;

  return (
    <section style={confirmationCard}>
      <CheckmarkBadge />

      <h1 style={confirmationTitle}>
        You're in, <i>{previewName}</i>!
      </h1>
      <p style={confirmationLead}>
        We'll review your profile and reach out when your feature goes live on
        The Marigold.
      </p>

      <div style={previewCard}>
        <div style={previewCardLabel}>A peek at your listing</div>
        <div style={previewCardBody}>
          {previewImage ? (
            <div
              style={{
                ...previewImageWrap,
                backgroundImage: `url(${previewImage})`,
              }}
            />
          ) : (
            <div style={previewImagePlaceholder} aria-hidden="true">
              <span>📷</span>
            </div>
          )}
          <div style={previewCardContent}>
            <div style={previewCardCategory}>{previewCategory}</div>
            <div style={previewCardName}>{previewName}</div>
            <div style={previewCardLocation}>{previewLocation}</div>
            <blockquote style={previewCardQuote}>"{previewQuote}"</blockquote>
            {vendorProfile.startingPriceText && (
              <div style={previewCardPrice}>
                Starting at {vendorProfile.startingPriceText}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckmarkBadge() {
  return (
    <div style={checkmarkWrap} aria-hidden="true">
      <svg viewBox="0 0 56 56" width="64" height="64" style={checkmarkSvg}>
        <circle
          cx="28"
          cy="28"
          r="26"
          fill="#E5F4EA"
          stroke="#2E7D4E"
          strokeWidth="2"
          style={checkmarkCircle}
        />
        <path
          d="M16 29 L25 38 L41 20"
          fill="none"
          stroke="#2E7D4E"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={checkmarkPath}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Account creation
// ---------------------------------------------------------------------------

function AccountSection({
  submissionId,
  context,
  accountCreated,
  onAccountCreated,
}: {
  submissionId: string;
  context: VendorOnboardingContext;
  accountCreated: boolean;
  onAccountCreated: () => void;
}) {
  const [email, setEmail] = useState(context.contactEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  if (accountCreated) {
    return (
      <section style={accountCardSuccess}>
        <div style={successDot} aria-hidden="true">
          ✓
        </div>
        <div>
          <h2 style={accountSuccessTitle}>Account created</h2>
          <p style={accountSuccessLead}>
            You can sign in anytime to update your profile.{" "}
            <a href="/vendor/dashboard" style={inlineLink}>
              Go to your dashboard →
            </a>
          </p>
        </div>
      </section>
    );
  }

  if (skipped) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await createVendorAccount({
        email,
        password,
        submissionId,
        businessName: context.businessName,
        category: context.categoryLabel || context.categoryId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Best-effort funnel ping.
      void fetch("/api/vendor/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submissionId, flag: "accountCreated" }),
      }).catch(() => {});
      onAccountCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't create your account. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={accountCard}>
      <h2 style={sectionTitle}>
        Want to <i>manage your listing?</i>
      </h2>
      <p style={sectionLead}>
        Create a free vendor account to update your profile, track inquiries,
        and get discovered by couples on The Marigold.
      </p>

      <ul style={benefitList}>
        <BenefitRow
          icon={<RefreshIcon />}
          text="Update your photos, pricing, and bio anytime"
        />
        <BenefitRow
          icon={<MailIcon />}
          text="Get notified when couples save or inquire about you"
        />
        <BenefitRow
          icon={<SparkleIcon />}
          text="Show up in The Marigold's vendor directory"
        />
      </ul>

      <form onSubmit={onSubmit} style={accountForm}>
        <div style={fieldsRow}>
          <label style={fieldLabel}>
            <span style={fieldLabelText}>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              style={inputStyle}
              autoComplete="email"
            />
          </label>
          <label style={fieldLabel}>
            <span style={fieldLabelText}>Password</span>
            <div style={passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={inputPassword}
                autoComplete="new-password"
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
        </div>

        {error && <div style={errorBanner}>{error}</div>}

        <button type="submit" disabled={submitting} style={primaryBtn}>
          {submitting ? "Creating…" : "Create account"}
        </button>

        <div style={subtleRow}>
          <span style={subtleText}>Already have an account?</span>{" "}
          <a href="/vendor/dashboard" style={inlineLink}>
            Sign in
          </a>
        </div>

        <button
          type="button"
          onClick={() => setSkipped(true)}
          style={skipLink}
        >
          Skip for now
        </button>
      </form>
    </section>
  );
}

function BenefitRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li style={benefitRow}>
      <span style={benefitIcon} aria-hidden="true">
        {icon}
      </span>
      <span style={benefitText}>{text}</span>
    </li>
  );
}

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3M21 4v5h-5M3 20v-5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m3 7 9 7 9-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1ZM15 8a4 4 0 0 1 0 8M19 5a8 8 0 0 1 0 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — Blog post invite
// ---------------------------------------------------------------------------

function BlogSection({
  submissionId,
  context,
}: {
  submissionId: string;
  context: VendorOnboardingContext;
}) {
  const router = useRouter();
  const [skipped, setSkipped] = useState(false);

  const topicSuggestions = useMemo(() => {
    if (!context.categoryId) return [];
    const topics = getTopicsForCategory(context.categoryId);
    return topics.slice(0, 3);
  }, [context.categoryId]);

  if (skipped) return null;

  function handleStartBlog() {
    // sessionStorage handoff — cleaner than long URL params and no length cap.
    try {
      sessionStorage.setItem(
        "marigold-blog-prefill",
        JSON.stringify({
          name: context.contactName,
          businessName: context.businessName,
          categoryLabel: context.categoryLabel,
          categoryId: context.categoryId,
          city: context.city,
          instagram: context.instagramHandle,
          bio: context.bioOrQuote,
          headshotDataUrl: context.headshotDataUrl,
          submissionId,
        }),
      );
    } catch {
      // Storage might be full — fall back to URL params below.
    }

    void fetch("/api/vendor/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: submissionId, flag: "blogPostStarted" }),
    }).catch(() => {});

    const params = new URLSearchParams();
    if (context.contactName) params.set("name", context.contactName);
    if (context.businessName) params.set("business", context.businessName);
    if (context.categoryLabel) params.set("category", context.categoryLabel);
    if (context.city) params.set("city", context.city);
    if (context.instagramHandle) params.set("handle", context.instagramHandle);

    const qs = params.toString();
    router.push(`/submit/blog${qs ? `?${qs}` : ""}`);
  }

  return (
    <section style={blogCard}>
      <h2 style={sectionTitle}>
        Want to <i>share your expertise?</i>
      </h2>
      <p style={sectionLead}>
        Write a blog post for The Marigold — we'll help. You answer a few
        questions, we'll craft a polished article with your name on it.
      </p>

      <ul style={benefitList}>
        <BenefitRow
          icon={<PenIcon />}
          text="Pick a topic, answer guided questions — we write the post"
        />
        <BenefitRow
          icon={<LinkIcon />}
          text="Published on The Marigold with your bio, photo, and backlink"
        />
        <BenefitRow
          icon={<MegaphoneIcon />}
          text="Shared to our Instagram audience and newsletter"
        />
      </ul>

      {topicSuggestions.length > 0 && (
        <>
          <div style={topicsLabel}>Topics built for {context.categoryLabel || "your craft"}</div>
          <div style={topicGrid}>
            {topicSuggestions.map((topic) => (
              <div key={topic.id} style={topicChip}>
                <div style={topicChipTitle}>{topic.title}</div>
                <div style={topicChipDesc}>{topic.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={handleStartBlog} style={primaryBtnFull}>
        WRITE A BLOG POST →
      </button>

      <button
        type="button"
        onClick={() => setSkipped(true)}
        style={skipLink}
      >
        Maybe later
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 4 — Footer
// ---------------------------------------------------------------------------

function FooterSection() {
  return (
    <footer style={footerSection}>
      <div style={footerRow}>
        <a
          href="https://instagram.com/themarigold"
          target="_blank"
          rel="noopener noreferrer"
          style={inlineLink}
        >
          Follow us @themarigold
        </a>
      </div>
      <div style={footerRow}>
        Questions?{" "}
        <a href="mailto:hello@themarigold.in" style={inlineLink}>
          hello@themarigold.in
        </a>
      </div>
      <div style={footerLogo}>
        <span style={brandThe}>The </span>
        <span style={brandMari}>Marigold</span>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Inline keyframes (checkmark stroke draw)
// ---------------------------------------------------------------------------

function KeyframesStyle() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@keyframes marigold-checkmark-circle {
  from { stroke-dashoffset: 165; }
  to { stroke-dashoffset: 0; }
}
@keyframes marigold-checkmark-path {
  from { stroke-dashoffset: 60; }
  to { stroke-dashoffset: 0; }
}
@keyframes marigold-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.marigold-confirm-card { animation: marigold-fade-in 0.5s ease both; }
        `,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers (used by the submitting form to derive the onboarding context)
// ---------------------------------------------------------------------------

export function deriveOnboardingContext(
  values: Record<string, unknown>,
  vendorProfile: VendorProfile,
  headshotDataUrl?: string,
): VendorOnboardingContext {
  const get = (key: string): string =>
    typeof values[key] === "string" ? (values[key] as string) : "";
  const categoryId = get("category");
  const cat = categoryId ? getCategoryById(categoryId) : undefined;
  return {
    contactName: get("contact_name"),
    businessName: get("business_name") || vendorProfile.vendorName,
    categoryId,
    categoryLabel: cat?.label ?? "",
    city: get("cities_served") || vendorProfile.vendorLocation,
    instagramHandle: get("instagram"),
    contactEmail: get("contact_email"),
    bioOrQuote: get("feature_quote") || get("anything_else"),
    headshotDataUrl,
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pageWrap: CSSProperties = {
  minHeight: "100vh",
  background: "var(--cream)",
  display: "flex",
  justifyContent: "center",
  padding: "32px 16px 64px",
};

const pageInner: CSSProperties = {
  width: "100%",
  maxWidth: 640,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const brandHeader: CSSProperties = {
  textAlign: "center",
  marginBottom: 4,
};

const brandThe: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 400,
  fontSize: 16,
  color: "var(--mauve)",
  letterSpacing: 0.5,
};

const brandMari: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 26,
  color: "var(--wine)",
};

// Section 1
const confirmationCard: CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 28,
  textAlign: "center",
  border: "1px solid rgba(75,21,40,0.06)",
  boxShadow: "0 12px 32px rgba(75,21,40,0.07)",
};

const checkmarkWrap: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 12,
};

const checkmarkSvg: CSSProperties = {
  display: "block",
};

const checkmarkCircle: CSSProperties = {
  strokeDasharray: 165,
  strokeDashoffset: 165,
  animation:
    "marigold-checkmark-circle 0.55s cubic-bezier(0.65, 0, 0.45, 1) forwards",
};

const checkmarkPath: CSSProperties = {
  strokeDasharray: 60,
  strokeDashoffset: 60,
  animation:
    "marigold-checkmark-path 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.45s forwards",
};

const confirmationTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 38,
  color: "var(--wine)",
  margin: "10px 0 12px",
  lineHeight: 1.1,
};

const confirmationLead: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 15,
  color: "var(--mauve)",
  lineHeight: 1.6,
  margin: "0 auto",
  maxWidth: 480,
};

const previewCard: CSSProperties = {
  marginTop: 24,
  background: "var(--cream)",
  borderRadius: 14,
  padding: 16,
  textAlign: "left",
  border: "1px solid rgba(75,21,40,0.08)",
};

const previewCardLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 2.4,
  textTransform: "uppercase",
  color: "var(--deep-pink)",
  marginBottom: 10,
};

const previewCardBody: CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
};

const previewImageWrap: CSSProperties = {
  width: 100,
  height: 130,
  flexShrink: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
  borderRadius: 10,
  border: "1px solid rgba(75,21,40,0.12)",
};

const previewImagePlaceholder: CSSProperties = {
  width: 100,
  height: 130,
  flexShrink: 0,
  borderRadius: 10,
  background: "var(--blush)",
  border: "1px dashed rgba(193,56,95,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
};

const previewCardContent: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const previewCardCategory: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.8,
  textTransform: "uppercase",
  color: "var(--deep-pink)",
};

const previewCardName: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine)",
  lineHeight: 1.15,
};

const previewCardLocation: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
};

const previewCardQuote: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 14,
  color: "var(--wine)",
  lineHeight: 1.45,
  borderLeft: "2px solid var(--gold)",
  paddingLeft: 10,
};

const previewCardPrice: CSSProperties = {
  marginTop: 8,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--wine)",
};

// Sections 2 & 3 shared
const sectionTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  color: "var(--wine)",
  margin: 0,
  lineHeight: 1.2,
};

const sectionLead: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.6,
  margin: "10px 0 18px",
};

const benefitList: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "0 0 22px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const benefitRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const benefitIcon: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(75,21,40,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--deep-pink)",
  flexShrink: 0,
};

const benefitText: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  lineHeight: 1.45,
};

// Section 2
const accountCard: CSSProperties = {
  background: "var(--blush)",
  borderRadius: 16,
  padding: 28,
  border: "1px solid rgba(193,56,95,0.18)",
  boxShadow: "0 12px 32px rgba(193,56,95,0.08)",
};

const accountCardSuccess: CSSProperties = {
  background: "#E5F4EA",
  border: "1px solid #2E7D4E",
  borderRadius: 14,
  padding: 18,
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const successDot: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#2E7D4E",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 800,
  flexShrink: 0,
};

const accountSuccessTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "#1F4D31",
  margin: "0 0 4px",
};

const accountSuccessLead: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "#1F4D31",
  margin: 0,
  lineHeight: 1.5,
};

const accountForm: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const fieldsRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
};

const fieldLabel: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const fieldLabelText: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--wine)",
};

const inputStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 15,
  padding: "12px 14px",
  background: "white",
  border: "1.5px solid rgba(75,21,40,0.15)",
  borderRadius: 8,
  color: "var(--wine)",
  outline: "none",
  width: "100%",
  minHeight: 46,
};

const passwordWrap: CSSProperties = {
  position: "relative",
  display: "flex",
};

const inputPassword: CSSProperties = {
  ...inputStyle,
  paddingRight: 70,
};

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
  letterSpacing: 2.4,
  padding: "16px 24px",
  background: "var(--wine)",
  color: "var(--cream)",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  boxShadow: "4px 4px 0 var(--gold)",
  width: "100%",
};

const primaryBtnFull: CSSProperties = {
  ...primaryBtn,
  marginTop: 4,
};

const subtleRow: CSSProperties = {
  textAlign: "center",
  marginTop: 4,
};

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

const skipLink: CSSProperties = {
  alignSelf: "center",
  marginTop: 4,
  background: "transparent",
  border: "none",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 8,
};

// Section 3
const blogCard: CSSProperties = {
  background: "var(--cream)",
  borderRadius: 16,
  padding: 28,
  border: "1px solid rgba(75,21,40,0.1)",
  boxShadow: "0 12px 32px rgba(75,21,40,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const topicsLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 2.2,
  textTransform: "uppercase",
  color: "var(--deep-pink)",
  marginBottom: -6,
};

const topicGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
  marginBottom: 6,
};

const topicChip: CSSProperties = {
  background: "white",
  border: "1px solid rgba(75,21,40,0.12)",
  borderRadius: 10,
  padding: "12px 14px",
};

const topicChipTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 16,
  color: "var(--wine)",
  lineHeight: 1.25,
};

const topicChipDesc: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve)",
  marginTop: 4,
  lineHeight: 1.45,
};

// Section 4
const footerSection: CSSProperties = {
  textAlign: "center",
  padding: "20px 0 8px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
};

const footerRow: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve)",
};

const footerLogo: CSSProperties = {
  marginTop: 6,
};
