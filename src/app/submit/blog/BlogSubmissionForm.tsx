"use client";

/**
 * Public Vendor Blog Post intake form (/submit/blog).
 *
 * Four steps:
 *   1. Who are you (vendor identity).
 *   2. Pick a topic — curated cards + a "pitch your own" panel.
 *   3. Guided questions specific to the chosen topic.
 *   4. AI-generated blog post preview, with Regenerate / Edit / Submit.
 *
 * Keeps state local + sessionStorage so a tab refresh doesn't blow away
 * progress. File uploads are not session-persisted (browser limitation).
 *
 * Submits to /api/submit/blog. The generated post itself is produced by
 * /api/blog/generate (Claude). Both routes live alongside this page.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import {
  groupedVendorCategories,
  getCategoryById,
  getCategoryByLabel,
  type VendorCategory,
} from "@/app/submit/vendor/vendor-form-schema";
import {
  getTopicById,
  getTopicsForCategory,
  type BlogTopic,
  type BlogTopicQuestion,
} from "@/lib/blog/topics";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4 | 5;

interface VendorIdentity {
  name: string;
  businessName: string;
  categoryLabel: string;
  /**
   * Free-text "what do you call yourself" — only collected when the vendor
   * picks "My category isn't listed". Used as the category label sent to
   * the AI so generated copy doesn't reference the literal dropdown
   * placeholder.
   */
  selfDescribedCategory: string;
  city: string;
  instagram: string;
  bio: string;
}

interface CustomTopic {
  title: string;
  pitch: string;
}

interface GeneratedPost {
  headline: string;
  markdown: string;
  html: string;
  readingTimeMin: number;
}

const SESSION_KEY = "marigold-blog-draft";
const PREFILL_KEY = "marigold-blog-prefill";

interface BlogPrefillPayload {
  name?: string;
  businessName?: string;
  categoryLabel?: string;
  categoryId?: string;
  city?: string;
  instagram?: string;
  bio?: string;
  headshotDataUrl?: string;
  submissionId?: string;
}

/**
 * Read a one-shot prefill blob handed off from /submit/vendor's thank-you
 * screen (or, as a fallback, URL params the user could share or bookmark).
 * sessionStorage is cleared after read so a refresh doesn't keep restoring
 * the same vendor's data once they've made their own edits.
 */
function readPrefillOnce(): BlogPrefillPayload | null {
  if (typeof window === "undefined") return null;
  let payload: BlogPrefillPayload | null = null;
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (raw) {
      payload = JSON.parse(raw) as BlogPrefillPayload;
      sessionStorage.removeItem(PREFILL_KEY);
    }
  } catch {
    // ignore — fall through to URL params
  }
  if (!payload || isPrefillEmpty(payload)) {
    const params = new URLSearchParams(window.location.search);
    const fromQuery: BlogPrefillPayload = {
      name: params.get("name") ?? undefined,
      businessName: params.get("business") ?? undefined,
      categoryLabel: params.get("category") ?? undefined,
      city: params.get("city") ?? undefined,
      instagram: params.get("handle") ?? undefined,
    };
    if (!isPrefillEmpty(fromQuery)) payload = fromQuery;
  }
  return payload;
}

function isPrefillEmpty(p: BlogPrefillPayload): boolean {
  return !(
    p.name ||
    p.businessName ||
    p.categoryLabel ||
    p.city ||
    p.instagram
  );
}

/**
 * True when the vendor identity is complete enough to skip Step 1. We don't
 * require Instagram or bio — those are optional in the form already.
 */
function isStep1Complete(v: VendorIdentity): boolean {
  if (!v.name.trim() || !v.businessName.trim() || !v.categoryLabel.trim()) {
    return false;
  }
  return true;
}

function emptyVendor(): VendorIdentity {
  return {
    name: "",
    businessName: "",
    categoryLabel: "",
    selfDescribedCategory: "",
    city: "",
    instagram: "",
    bio: "",
  };
}

const OTHER_CATEGORY_LABEL = "My category isn't listed";

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

interface PersistedDraft {
  step: Step;
  vendor: VendorIdentity;
  selectedTopicId: string;
  customTopic: CustomTopic;
  answers: Record<string, string>;
  sessionToken: string;
}

function readDraft(): Partial<PersistedDraft> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedDraft>;
  } catch {
    return null;
  }
}

function writeDraft(draft: PersistedDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlogSubmissionForm() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [vendor, setVendor] = useState<VendorIdentity>(emptyVendor);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [referenceLinks, setReferenceLinks] = useState("");

  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [customTopic, setCustomTopic] = useState<CustomTopic>({
    title: "",
    pitch: "",
  });
  const [pitchingOwn, setPitchingOwn] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);

  const [sessionToken, setSessionToken] = useState("");
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationsRemaining, setGenerationsRemaining] = useState(3);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedHeadline, setSubmittedHeadline] = useState<string | null>(
    null,
  );
  const headshotInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Headshot handed off from the vendor submission as a data URL. We can't
   * reconstruct a real File on the client, but we can show it in Step 4's
   * preview and submit it to the API as a base64 blob.
   */
  const [prefilledHeadshotDataUrl, setPrefilledHeadshotDataUrl] = useState<
    string | null
  >(null);
  const [wasPrefilled, setWasPrefilled] = useState(false);
  const [sourceVendorSubmissionId, setSourceVendorSubmissionId] = useState<
    string | null
  >(null);

  const category: VendorCategory | undefined = useMemo(
    () => getCategoryByLabel(vendor.categoryLabel),
    [vendor.categoryLabel],
  );

  const topics: BlogTopic[] = useMemo(() => {
    if (!category) return [];
    return getTopicsForCategory(category.id);
  }, [category]);

  const selectedTopic: BlogTopic | null = useMemo(() => {
    if (pitchingOwn) {
      return {
        id: "custom",
        title: customTopic.title || "Your custom topic",
        description: customTopic.pitch,
        estimatedReadingTime: "5 min",
        questions: DEFAULT_CUSTOM_QUESTIONS,
      };
    }
    if (!category || !selectedTopicId) return null;
    return getTopicById(category.id, selectedTopicId);
  }, [category, selectedTopicId, pitchingOwn, customTopic]);

  /**
   * The label we send to the AI. For "other" we prefer the vendor's free-text
   * self-description so generated copy says "wedding stylist" instead of "My
   * category isn't listed".
   */
  const aiCategoryLabel = useMemo(() => {
    if (category && category.id === "other") {
      return vendor.selfDescribedCategory.trim() || "wedding vendor";
    }
    return category?.label ?? "wedding vendor";
  }, [category, vendor.selfDescribedCategory]);

  // Hydrate from sessionStorage. Prefill data from /submit/vendor wins over
  // any in-progress draft — the vendor just told us who they are, that's the
  // freshest signal.
  useEffect(() => {
    const prefill = readPrefillOnce();

    if (prefill && !isPrefillEmpty(prefill)) {
      // Resolve the dropdown label. The vendor form ships an id, but the
      // blog form's category select is keyed by label.
      let categoryLabel = prefill.categoryLabel ?? "";
      if (!categoryLabel && prefill.categoryId) {
        categoryLabel = getCategoryById(prefill.categoryId)?.label ?? "";
      }
      const nextVendor: VendorIdentity = {
        name: prefill.name ?? "",
        businessName: prefill.businessName ?? "",
        categoryLabel,
        selfDescribedCategory: "",
        city: prefill.city ?? "",
        instagram: (prefill.instagram ?? "").replace(/^@/, ""),
        bio: (prefill.bio ?? "").slice(0, 150),
      };
      setVendor(nextVendor);
      setWasPrefilled(true);
      if (prefill.headshotDataUrl) {
        setPrefilledHeadshotDataUrl(prefill.headshotDataUrl);
      }
      if (prefill.submissionId) {
        setSourceVendorSubmissionId(prefill.submissionId);
      }
      if (isStep1Complete(nextVendor)) {
        setStep(2);
      }
    } else {
      const draft = readDraft();
      if (draft) {
        if (draft.vendor)
          setVendor({
            ...emptyVendor(),
            ...draft.vendor,
            // Old drafts may not have this field — coerce to string.
            selfDescribedCategory: draft.vendor.selfDescribedCategory ?? "",
          });
        if (typeof draft.selectedTopicId === "string")
          setSelectedTopicId(draft.selectedTopicId);
        if (draft.customTopic)
          setCustomTopic({
            title: draft.customTopic.title ?? "",
            pitch: draft.customTopic.pitch ?? "",
          });
        if (draft.answers && typeof draft.answers === "object")
          setAnswers(draft.answers);
        if (draft.step && draft.step >= 1 && draft.step <= 4)
          setStep(draft.step as Step);
        if (typeof draft.sessionToken === "string" && draft.sessionToken)
          setSessionToken(draft.sessionToken);
      }
    }

    setSessionToken((prev) => prev || newSessionToken());
    setHydrated(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!hydrated) return;
    writeDraft({
      step,
      vendor,
      selectedTopicId,
      customTopic,
      answers,
      sessionToken,
    });
  }, [hydrated, step, vendor, selectedTopicId, customTopic, answers, sessionToken]);

  // ------------------ Step 1 helpers ------------------

  function updateVendor<K extends keyof VendorIdentity>(
    key: K,
    value: VendorIdentity[K],
  ) {
    setVendor((v) => ({ ...v, [key]: value }));
  }

  function step1Valid(): boolean {
    if (
      vendor.name.trim().length === 0 ||
      vendor.businessName.trim().length === 0 ||
      vendor.categoryLabel.trim().length === 0
    ) {
      return false;
    }
    if (
      vendor.categoryLabel === OTHER_CATEGORY_LABEL &&
      vendor.selfDescribedCategory.trim().length === 0
    ) {
      return false;
    }
    return true;
  }

  // ------------------ Step 2 helpers ------------------

  function pickTopic(id: string) {
    setSelectedTopicId(id);
    setPitchingOwn(false);
    setAnswers({});
    setQuestionIndex(0);
  }

  function startCustomPitch() {
    setPitchingOwn(true);
    setSelectedTopicId("custom");
    setAnswers({});
    setQuestionIndex(0);
  }

  function step2Valid(): boolean {
    if (pitchingOwn) {
      return (
        customTopic.title.trim().length > 0 &&
        customTopic.pitch.trim().length > 0
      );
    }
    return selectedTopicId.length > 0;
  }

  // ------------------ Step 3 helpers ------------------

  const questions = selectedTopic?.questions ?? [];

  function step3Valid(): boolean {
    if (!selectedTopic) return false;
    return questions
      .filter((q) => q.required)
      .every((q) => (answers[q.id] ?? "").trim().length > 0);
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    }
  }
  function prevQuestion() {
    if (questionIndex > 0) setQuestionIndex((i) => i - 1);
  }

  // ------------------ Step 4 helpers ------------------

  async function generatePost() {
    if (!selectedTopic || !category) return;
    setErrorMsg("");
    setGenerating(true);
    try {
      const payload = {
        sessionToken,
        vendor: {
          name: vendor.name,
          businessName: vendor.businessName,
          categoryId: category.id,
          // Send the self-described label for "other" so the AI never sees
          // "My category isn't listed".
          categoryLabel: aiCategoryLabel,
          city: vendor.city || undefined,
          instagram: vendor.instagram || undefined,
          bio: vendor.bio || undefined,
        },
        topic: {
          id: selectedTopic.id,
          title: pitchingOwn ? customTopic.title : selectedTopic.title,
          description: pitchingOwn
            ? customTopic.pitch
            : selectedTopic.description,
          isCustom: pitchingOwn,
          customPitch: pitchingOwn ? customTopic.pitch : undefined,
        },
        answers: questions
          .filter((q) => (answers[q.id] ?? "").trim().length > 0)
          .map((q) => ({
            question: q.question,
            answer: answers[q.id] ?? "",
          })),
      };
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Couldn't generate the post.");
      }
      setPost({
        headline: json.headline,
        markdown: json.markdown,
        html: json.html,
        readingTimeMin: json.readingTimeMin,
      });
      setGenerationsRemaining(json.generationsRemaining ?? 0);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleStep3Continue() {
    if (!step3Valid()) {
      setErrorMsg("Answer the required questions before continuing.");
      return;
    }
    setErrorMsg("");
    setStep(4);
    await generatePost();
  }

  // ------------------ Final submission ------------------

  async function submitForm() {
    if (!post || !category || !selectedTopic) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("vendor_name", vendor.name);
      fd.append("business_name", vendor.businessName);
      fd.append("category", category.id);
      fd.append("category_label", aiCategoryLabel);
      fd.append("category_dropdown_label", category.label);
      if (vendor.selfDescribedCategory.trim()) {
        fd.append(
          "self_described_category",
          vendor.selfDescribedCategory.trim(),
        );
      }
      fd.append("city", vendor.city);
      fd.append("instagram", vendor.instagram);
      fd.append("bio", vendor.bio);
      fd.append("reference_links", referenceLinks);
      fd.append("topic_id", selectedTopic.id);
      fd.append(
        "topic_title",
        pitchingOwn ? customTopic.title : selectedTopic.title,
      );
      fd.append(
        "topic_description",
        pitchingOwn ? customTopic.pitch : selectedTopic.description,
      );
      fd.append("is_custom_topic", pitchingOwn ? "true" : "false");
      fd.append("blog_post_html", post.html);
      fd.append("blog_post_markdown", post.markdown);
      fd.append("blog_post_headline", post.headline);
      fd.append(
        "blog_post_json",
        JSON.stringify({
          headline: post.headline,
          markdown: post.markdown,
          html: post.html,
          readingTimeMin: post.readingTimeMin,
        }),
      );
      fd.append(
        "answers_json",
        JSON.stringify(
          questions.map((q) => ({
            question: q.question,
            answer: answers[q.id] ?? "",
          })),
        ),
      );
      if (headshotFile) fd.append("headshot", headshotFile);
      photos.forEach((file) => fd.append("photos", file));

      const res = await fetch("/api/submit/blog", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Submission failed.");
      }
      setSubmittedHeadline(json.headline ?? post.headline);
      setStep(5);
      // Clear draft so a new visit starts fresh.
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        // ignore
      }
      // Best-effort funnel ping for the originating vendor submission.
      if (sourceVendorSubmissionId) {
        void fetch("/api/vendor/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: sourceVendorSubmissionId,
            flag: "blogPostSubmitted",
          }),
        }).catch(() => {});
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------ Render ------------------

  if (!hydrated) {
    return <div style={loadingShell}>loading…</div>;
  }

  return (
    <main style={pageShell}>
      <div style={pageInner}>
        <Header step={step} />

        {step === 1 && (
          <Step1
            vendor={vendor}
            onUpdate={updateVendor}
            headshotFile={headshotFile}
            onPickHeadshot={(file) => setHeadshotFile(file)}
            headshotInputRef={headshotInputRef}
            valid={step1Valid()}
            onContinue={() => {
              setErrorMsg("");
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step2
            categoryLabel={vendor.categoryLabel}
            topics={topics}
            selectedTopicId={selectedTopicId}
            onPickTopic={pickTopic}
            pitchingOwn={pitchingOwn}
            customTopic={customTopic}
            onCustomTopic={setCustomTopic}
            onStartCustomPitch={startCustomPitch}
            onCancelCustomPitch={() => {
              setPitchingOwn(false);
              setCustomTopic({ title: "", pitch: "" });
              setSelectedTopicId("");
            }}
            valid={step2Valid()}
            onBack={() => setStep(1)}
            onContinue={() => {
              setErrorMsg("");
              setStep(3);
            }}
            prefillSummary={
              wasPrefilled && isStep1Complete(vendor) ? (
                <PrefillSummary
                  vendor={vendor}
                  onEdit={() => setStep(1)}
                />
              ) : null
            }
          />
        )}

        {step === 3 && selectedTopic && (
          <Step3
            topic={selectedTopic}
            answers={answers}
            onAnswerChange={(id, value) =>
              setAnswers((a) => ({ ...a, [id]: value }))
            }
            questionIndex={questionIndex}
            onJumpToQuestion={(i) => setQuestionIndex(i)}
            onPrev={prevQuestion}
            onNext={nextQuestion}
            photos={photos}
            onPickPhotos={(files) => setPhotos(files)}
            photosInputRef={photosInputRef}
            referenceLinks={referenceLinks}
            onReferenceLinks={setReferenceLinks}
            valid={step3Valid()}
            errorMsg={errorMsg}
            onBack={() => setStep(2)}
            onContinue={handleStep3Continue}
          />
        )}

        {step === 4 && (
          <Step4
            generating={generating}
            post={post}
            errorMsg={errorMsg}
            generationsRemaining={generationsRemaining}
            vendor={vendor}
            categoryLabel={aiCategoryLabel}
            headshotFile={headshotFile}
            prefilledHeadshotUrl={prefilledHeadshotDataUrl}
            photos={photos}
            submitting={submitting}
            onRegenerate={generatePost}
            onEditAnswers={() => setStep(3)}
            onSubmit={submitForm}
          />
        )}

        {step === 5 && (
          <Step5 headline={submittedHeadline ?? post?.headline ?? ""} />
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Header / progress
// ---------------------------------------------------------------------------

function Header({ step }: { step: Step }) {
  return (
    <header style={headerStyle}>
      <div style={eyebrow}>The Marigold</div>
      <h1 style={titleStyle}>
        <i>Tell us a story.</i> We'll write the blog post.
      </h1>
      <p style={leadStyle}>
        You don't need to write anything long-form. Pick a topic, answer a
        few honest questions, and we'll assemble a polished post you can
        review before submitting.
      </p>
      {step <= 4 && <ProgressBar step={step} />}
    </header>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const labels = ["You", "Topic", "Answers", "Preview"];
  return (
    <div style={progressBarRow}>
      {labels.map((label, idx) => {
        const stepN = (idx + 1) as Step;
        const active = step === stepN;
        const done = step > stepN;
        return (
          <div key={label} style={progressItem}>
            <div
              style={{
                ...progressDot,
                ...(active ? progressDotActive : null),
                ...(done ? progressDotDone : null),
              }}
            >
              {done ? "✓" : idx + 1}
            </div>
            <span
              style={{
                ...progressLabel,
                ...(active || done ? progressLabelActive : null),
              }}
            >
              {label}
            </span>
            {idx < labels.length - 1 && <div style={progressLine} />}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Who Are You
// ---------------------------------------------------------------------------

interface Step1Props {
  vendor: VendorIdentity;
  onUpdate: <K extends keyof VendorIdentity>(
    key: K,
    value: VendorIdentity[K],
  ) => void;
  headshotFile: File | null;
  onPickHeadshot: (file: File | null) => void;
  headshotInputRef: React.MutableRefObject<HTMLInputElement | null>;
  valid: boolean;
  onContinue: () => void;
}

function Step1({
  vendor,
  onUpdate,
  headshotFile,
  onPickHeadshot,
  headshotInputRef,
  valid,
  onContinue,
}: Step1Props) {
  const grouped = groupedVendorCategories();
  const isOtherCategory = vendor.categoryLabel === OTHER_CATEGORY_LABEL;
  return (
    <section style={cardSection}>
      <h2 style={stepTitle}>Who's writing this?</h2>
      <p style={stepLead}>
        Just enough so we know who you are when we publish — takes about a
        minute.
      </p>

      <div style={fieldGrid}>
        <Field label="Your name" required>
          <input
            type="text"
            value={vendor.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            style={inputStyle}
            placeholder="e.g., Riya Kapoor"
          />
        </Field>

        <Field label="Business name" required>
          <input
            type="text"
            value={vendor.businessName}
            onChange={(e) => onUpdate("businessName", e.target.value)}
            style={inputStyle}
            placeholder="e.g., Riya K Photo"
          />
        </Field>

        <Field
          label="What do you do?"
          required
          fullWidth
          help="Pick the closest match — we'll show you topic ideas tailored to your craft."
        >
          <select
            value={vendor.categoryLabel}
            onChange={(e) => onUpdate("categoryLabel", e.target.value)}
            style={inputStyle}
          >
            <option value="">Select a category…</option>
            {grouped.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.categories.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        {isOtherCategory && (
          <Field
            label="Tell us what you do"
            required
            fullWidth
            help="A short, specific phrase — we'll use this everywhere your category would show up in the post (e.g., 'wedding stylist', 'live wedding painter')."
          >
            <input
              type="text"
              value={vendor.selfDescribedCategory}
              onChange={(e) =>
                onUpdate(
                  "selfDescribedCategory",
                  e.target.value.slice(0, 80),
                )
              }
              style={inputStyle}
              placeholder="e.g., wedding stylist, live wedding painter, baraat horse handler"
              maxLength={80}
            />
          </Field>
        )}

        <Field label="Location">
          <input
            type="text"
            value={vendor.city}
            onChange={(e) => onUpdate("city", e.target.value)}
            style={inputStyle}
            placeholder="e.g., New Jersey, Mumbai, or London & Destination"
          />
        </Field>

        <Field label="Instagram handle">
          <div style={inputWithPrefix}>
            <span style={prefixSlot}>@</span>
            <input
              type="text"
              value={vendor.instagram}
              onChange={(e) =>
                onUpdate("instagram", e.target.value.replace(/^@/, ""))
              }
              style={prefixedInputStyle}
              placeholder="yourhandle"
            />
          </div>
        </Field>

        <Field
          label="One-line bio"
          fullWidth
          help={`${vendor.bio.length}/150 characters`}
        >
          <input
            type="text"
            value={vendor.bio}
            onChange={(e) => onUpdate("bio", e.target.value.slice(0, 150))}
            style={inputStyle}
            placeholder="e.g., Mumbai-based wedding photographer specializing in candid storytelling"
            maxLength={150}
          />
        </Field>

        <Field label="Headshot or logo (optional)" fullWidth>
          <input
            ref={headshotInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              onPickHeadshot(file);
            }}
          />
          <div style={fileRow}>
            <button
              type="button"
              style={ghostBtn}
              onClick={() => headshotInputRef.current?.click()}
            >
              {headshotFile ? "Change photo" : "Choose a photo"}
            </button>
            {headshotFile && (
              <span style={fileName}>
                {headshotFile.name}{" "}
                <button
                  type="button"
                  style={textBtn}
                  onClick={() => onPickHeadshot(null)}
                >
                  remove
                </button>
              </span>
            )}
          </div>
        </Field>
      </div>

      <FooterRow>
        <button
          type="button"
          style={valid ? primaryBtn : disabledBtn}
          disabled={!valid}
          onClick={onContinue}
        >
          Continue →
        </button>
      </FooterRow>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Prefill summary chip (rendered atop Step 2 when the form was pre-populated
// from /submit/vendor and Step 1 is complete)
// ---------------------------------------------------------------------------

function PrefillSummary({
  vendor,
  onEdit,
}: {
  vendor: VendorIdentity;
  onEdit: () => void;
}) {
  const meta = [vendor.categoryLabel, vendor.city]
    .filter((s) => s.trim().length > 0)
    .join(" · ");
  return (
    <div style={prefillSummaryRow}>
      <div style={prefillSummaryText}>
        Writing as <b>{vendor.name || "—"}</b> from{" "}
        <b>{vendor.businessName || "—"}</b>
        {meta ? ` (${meta})` : ""}
      </div>
      <button type="button" onClick={onEdit} style={prefillSummaryEdit}>
        Edit
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Pick a topic
// ---------------------------------------------------------------------------

interface Step2Props {
  categoryLabel: string;
  topics: BlogTopic[];
  selectedTopicId: string;
  onPickTopic: (id: string) => void;
  pitchingOwn: boolean;
  customTopic: CustomTopic;
  onCustomTopic: (next: CustomTopic) => void;
  onStartCustomPitch: () => void;
  onCancelCustomPitch: () => void;
  valid: boolean;
  onBack: () => void;
  onContinue: () => void;
  prefillSummary?: React.ReactNode;
}

function Step2({
  categoryLabel,
  topics,
  selectedTopicId,
  onPickTopic,
  pitchingOwn,
  customTopic,
  onCustomTopic,
  onStartCustomPitch,
  onCancelCustomPitch,
  valid,
  onBack,
  onContinue,
  prefillSummary,
}: Step2Props) {
  return (
    <section style={cardSection}>
      {prefillSummary}
      <h2 style={stepTitle}>Pick a topic</h2>
      <p style={stepLead}>
        These topics are tailored to {categoryLabel || "your craft"}. Choose
        one — or scroll to the bottom and pitch your own.
      </p>

      <div style={topicGrid}>
        {topics.map((topic) => {
          const active = selectedTopicId === topic.id && !pitchingOwn;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onPickTopic(topic.id)}
              style={active ? { ...topicCard, ...topicCardActive } : topicCard}
            >
              {active && <span style={topicCheck}>✓</span>}
              <div style={topicMeta}>{topic.estimatedReadingTime} read</div>
              <div style={topicCardTitle}>{topic.title}</div>
              <div style={topicDescription}>{topic.description}</div>
              {topic.questions.length > 0 && (
                <div style={topicQuestionCount}>
                  {topic.questions.length} guided question
                  {topic.questions.length === 1 ? "" : "s"}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={pitchBlock}>
        <h3 style={pitchTitle}>Have a different topic in mind?</h3>
        {!pitchingOwn ? (
          <button type="button" onClick={onStartCustomPitch} style={ghostBtn}>
            Pitch your own topic →
          </button>
        ) : (
          <div style={fieldGrid}>
            <Field
              label="Your topic title"
              required
              fullWidth
              help={`${customTopic.title.length}/200 characters`}
            >
              <input
                type="text"
                value={customTopic.title}
                onChange={(e) =>
                  onCustomTopic({
                    ...customTopic,
                    title: e.target.value.slice(0, 200),
                  })
                }
                style={inputStyle}
                placeholder="e.g., Why I Stopped Doing Sangeet Choreography Two Weeks Out"
                maxLength={200}
              />
            </Field>
            <Field
              label="Tell us briefly what you'd cover"
              required
              fullWidth
              help={`${customTopic.pitch.length}/500 characters`}
            >
              <textarea
                value={customTopic.pitch}
                onChange={(e) =>
                  onCustomTopic({
                    ...customTopic,
                    pitch: e.target.value.slice(0, 500),
                  })
                }
                style={textareaStyle}
                rows={4}
                placeholder="A few sentences about the angle and what readers will take away."
                maxLength={500}
              />
            </Field>
            <button
              type="button"
              onClick={onCancelCustomPitch}
              style={textBtn}
            >
              ← Back to suggested topics
            </button>
          </div>
        )}
      </div>

      <FooterRow>
        <button type="button" onClick={onBack} style={ghostBtn}>
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          style={valid ? primaryBtn : disabledBtn}
          disabled={!valid}
        >
          Continue →
        </button>
      </FooterRow>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Guided questions
// ---------------------------------------------------------------------------

interface Step3Props {
  topic: BlogTopic;
  answers: Record<string, string>;
  onAnswerChange: (id: string, value: string) => void;
  questionIndex: number;
  onJumpToQuestion: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  photos: File[];
  onPickPhotos: (files: File[]) => void;
  photosInputRef: React.MutableRefObject<HTMLInputElement | null>;
  referenceLinks: string;
  onReferenceLinks: (value: string) => void;
  valid: boolean;
  errorMsg: string;
  onBack: () => void;
  onContinue: () => void;
}

function Step3({
  topic,
  answers,
  onAnswerChange,
  questionIndex,
  onJumpToQuestion,
  onPrev,
  onNext,
  photos,
  onPickPhotos,
  photosInputRef,
  referenceLinks,
  onReferenceLinks,
  valid,
  errorMsg,
  onBack,
  onContinue,
}: Step3Props) {
  const total = topic.questions.length;
  const current = topic.questions[questionIndex];
  const answered = topic.questions.filter(
    (q) => (answers[q.id] ?? "").trim().length > 0,
  ).length;

  function handlePhotoPick(e: ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, 5);
    onPickPhotos(list);
  }

  return (
    <section style={cardSection}>
      <div style={interviewHeader}>
        <div style={interviewTopicLine}>
          <span style={miniBadge}>Your topic</span>
          <span style={interviewTopicTitle}>{topic.title}</span>
        </div>
        <div style={progressInfo}>
          Question {questionIndex + 1} of {total} · {answered}/
          {total} answered
        </div>
      </div>

      <div style={questionDots}>
        {topic.questions.map((q, idx) => {
          const filled = (answers[q.id] ?? "").trim().length > 0;
          const isCurrent = idx === questionIndex;
          return (
            <button
              key={q.id}
              type="button"
              style={{
                ...questionDot,
                ...(filled ? questionDotFilled : null),
                ...(isCurrent ? questionDotActive : null),
              }}
              onClick={() => onJumpToQuestion(idx)}
              aria-label={`Go to question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {current && (
        <div style={questionBlock}>
          <label style={questionLabel}>
            <span style={questionNumber}>Q{questionIndex + 1}</span>
            <span>{current.question}</span>
            {current.required && <span style={requiredMark}>*</span>}
          </label>
          <p style={questionHelper}>
            Answer however feels natural — a few sentences is plenty. Don't
            overthink it.
          </p>
          <textarea
            value={answers[current.id] ?? ""}
            onChange={(e) =>
              onAnswerChange(
                current.id,
                e.target.value.slice(0, current.maxLength),
              )
            }
            placeholder={current.placeholder ?? ""}
            rows={6}
            style={textareaStyle}
            maxLength={current.maxLength}
          />
          <div style={charCount}>
            {(answers[current.id] ?? "").length}/{current.maxLength}
          </div>
          <div style={questionNav}>
            <button
              type="button"
              onClick={onPrev}
              disabled={questionIndex === 0}
              style={questionIndex === 0 ? disabledGhost : ghostBtn}
            >
              ← Previous
            </button>
            {questionIndex < total - 1 ? (
              <button type="button" onClick={onNext} style={primaryBtn}>
                Next question →
              </button>
            ) : (
              <span style={questionNavHint}>
                You've reached the last question.
              </span>
            )}
          </div>
        </div>
      )}

      <div style={extrasBlock}>
        <h3 style={pitchTitle}>Bonus material (optional)</h3>
        <Field
          label="Drop 3-5 photos that could accompany this post"
          fullWidth
          help="We'll lay them in between sections of the published article."
        >
          <input
            ref={photosInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handlePhotoPick}
          />
          <div style={fileRow}>
            <button
              type="button"
              style={ghostBtn}
              onClick={() => photosInputRef.current?.click()}
            >
              {photos.length > 0
                ? `Replace photos (${photos.length})`
                : "Choose up to 5 photos"}
            </button>
            {photos.length > 0 && (
              <span style={fileName}>
                {photos.map((f) => f.name).join(", ")}
              </span>
            )}
          </div>
        </Field>
        <Field
          label="Any specific weddings or examples we should reference?"
          fullWidth
          help="Names, links, or quick context — we'll handle the credit and any links."
        >
          <textarea
            value={referenceLinks}
            onChange={(e) =>
              onReferenceLinks(e.target.value.slice(0, 800))
            }
            rows={3}
            style={textareaStyle}
            placeholder="e.g., Anjali & Karan's wedding at Taj Lake Palace, March 2025"
            maxLength={800}
          />
        </Field>
      </div>

      {errorMsg && <div style={errorBanner}>{errorMsg}</div>}

      <FooterRow>
        <button type="button" onClick={onBack} style={ghostBtn}>
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          style={valid ? primaryBtn : disabledBtn}
          disabled={!valid}
        >
          Generate my blog post →
        </button>
      </FooterRow>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Preview
// ---------------------------------------------------------------------------

interface Step4Props {
  generating: boolean;
  post: GeneratedPost | null;
  errorMsg: string;
  generationsRemaining: number;
  vendor: VendorIdentity;
  categoryLabel: string;
  headshotFile: File | null;
  prefilledHeadshotUrl: string | null;
  photos: File[];
  submitting: boolean;
  onRegenerate: () => void;
  onEditAnswers: () => void;
  onSubmit: () => void;
}

function Step4({
  generating,
  post,
  errorMsg,
  generationsRemaining,
  vendor,
  categoryLabel,
  headshotFile,
  prefilledHeadshotUrl,
  photos,
  submitting,
  onRegenerate,
  onEditAnswers,
  onSubmit,
}: Step4Props) {
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!headshotFile) {
      setHeadshotUrl(prefilledHeadshotUrl);
      return;
    }
    const url = URL.createObjectURL(headshotFile);
    setHeadshotUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [headshotFile, prefilledHeadshotUrl]);

  useEffect(() => {
    if (photos.length === 0) {
      setPhotoUrls([]);
      return;
    }
    const urls = photos.map((p) => URL.createObjectURL(p));
    setPhotoUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  if (generating && !post) {
    return (
      <section style={cardSection}>
        <div style={loadingBlock}>
          <div style={loadingPulse} />
          <h2 style={stepTitle}>Crafting your post…</h2>
          <p style={stepLead}>
            Pulling your stories together. This usually takes 5-15 seconds.
          </p>
        </div>
      </section>
    );
  }

  if (errorMsg && !post) {
    return (
      <section style={cardSection}>
        <h2 style={stepTitle}>Something went wrong</h2>
        <p style={errorBanner}>{errorMsg}</p>
        <FooterRow>
          <button type="button" onClick={onEditAnswers} style={ghostBtn}>
            ← Back to my answers
          </button>
          <button type="button" onClick={onRegenerate} style={primaryBtn}>
            Try again
          </button>
        </FooterRow>
      </section>
    );
  }

  if (!post) {
    return (
      <section style={cardSection}>
        <h2 style={stepTitle}>Ready to generate?</h2>
        <FooterRow>
          <button type="button" onClick={onEditAnswers} style={ghostBtn}>
            ← Back
          </button>
          <button type="button" onClick={onRegenerate} style={primaryBtn}>
            Generate my blog post
          </button>
        </FooterRow>
      </section>
    );
  }

  return (
    <section style={previewSection}>
      <div style={previewBadge}>Preview · For your review</div>
      <article style={blogArticle}>
        <header style={blogHeader}>
          <div style={blogReadingTime}>
            {post.readingTimeMin} min read · By {vendor.name}
          </div>
          <h1 style={blogHeadline}>{post.headline}</h1>
        </header>

        <div style={authorCard}>
          {headshotUrl ? (
            <img src={headshotUrl} alt={vendor.name} style={authorAvatar} />
          ) : (
            <div style={authorAvatarFallback}>
              {vendor.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div style={authorName}>{vendor.name}</div>
            <div style={authorMeta}>
              {vendor.businessName}
              {categoryLabel && ` · ${categoryLabel}`}
            </div>
            {vendor.bio && <div style={authorBio}>{vendor.bio}</div>}
          </div>
        </div>

        <BlogBody html={post.html} photoUrls={photoUrls} />
      </article>

      {generationsRemaining > 0 ? (
        <p style={regenHint}>
          You can regenerate {generationsRemaining} more time
          {generationsRemaining === 1 ? "" : "s"} for a different take.
        </p>
      ) : (
        <p style={regenHint}>You've used all your regenerations.</p>
      )}

      {errorMsg && <div style={errorBanner}>{errorMsg}</div>}

      <FooterRow>
        <button type="button" onClick={onEditAnswers} style={textBtn}>
          I want to edit my answers
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          style={generationsRemaining > 0 ? ghostBtn : disabledGhost}
          disabled={generationsRemaining <= 0 || generating}
        >
          {generating ? "Regenerating…" : "Regenerate"}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          style={submitting ? disabledBtn : primaryBtn}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "This looks great — submit it!"}
        </button>
      </FooterRow>
    </section>
  );
}

function BlogBody({
  html,
  photoUrls,
}: {
  html: string;
  photoUrls: string[];
}) {
  // Naive but effective: split the HTML on closing <h2> tags and intersperse
  // the vendor's uploaded photos between sections.
  const parts = useMemo(() => splitOnH2(html), [html]);
  return (
    <div style={blogBody}>
      {parts.map((part, idx) => {
        const photo = photoUrls[idx];
        return (
          <div key={`part-${idx}`}>
            <div
              style={blogProse}
              dangerouslySetInnerHTML={{ __html: part }}
            />
            {photo && idx < parts.length - 1 && (
              <figure style={blogPhotoFigure}>
                <img src={photo} alt="" style={blogPhotoImage} />
              </figure>
            )}
          </div>
        );
      })}
    </div>
  );
}

function splitOnH2(html: string): string[] {
  if (!html.includes("</h2>")) return [html];
  const parts: string[] = [];
  let remaining = html;
  while (true) {
    const idx = remaining.indexOf("</h2>");
    if (idx === -1) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.slice(0, idx + "</h2>".length));
    remaining = remaining.slice(idx + "</h2>".length);
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Step 5 — Thank you
// ---------------------------------------------------------------------------

function Step5({ headline }: { headline: string }) {
  return (
    <section style={cardSection}>
      <h2 style={stepTitle}>Your blog post draft has been submitted!</h2>
      <p style={stepLead}>
        We'll review it, polish it up if needed, and publish it on The
        Marigold with full credit and a link to your business.
      </p>
      {headline && (
        <blockquote style={thankYouHeadline}>“{headline}”</blockquote>
      )}
      <p style={stepLead}>
        Watch your inbox — we'll be in touch when it goes live.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Generic field
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  fullWidth,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  fullWidth?: boolean;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ ...fieldStyle, ...(fullWidth ? fieldFullWidth : null) }}>
      <span style={fieldLabel}>
        {label}
        {required && <span style={requiredMark}> *</span>}
      </span>
      {children}
      {help && <span style={fieldHelp}>{help}</span>}
    </label>
  );
}

function FooterRow({ children }: { children: React.ReactNode }) {
  return <div style={footerRow}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Defaults / data
// ---------------------------------------------------------------------------

const DEFAULT_CUSTOM_QUESTIONS: BlogTopicQuestion[] = [
  {
    id: "q1",
    question: "What's the central insight or argument of your post?",
    placeholder: "The one thing you want couples to walk away believing.",
    maxLength: 400,
    required: true,
  },
  {
    id: "q2",
    question: "What background do readers need before you make your point?",
    placeholder: "Set the stage — what's the context?",
    maxLength: 500,
    required: true,
  },
  {
    id: "q3",
    question: "Walk us through the main ideas, in order.",
    placeholder: "Three or four points works well.",
    maxLength: 700,
    required: true,
  },
  {
    id: "q4",
    question: "Share a specific story or example that proves your point.",
    placeholder: "Real examples beat generic advice every time.",
    maxLength: 600,
    required: true,
  },
  {
    id: "q5",
    question: "What's the one practical takeaway readers can act on?",
    placeholder: "Your closing line.",
    maxLength: 400,
    required: true,
  },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pageShell: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(ellipse at top, rgba(252,228,236,0.6) 0%, transparent 60%), var(--cream, #FFF8EC)",
  padding: "48px 24px 80px",
  fontFamily: "'Space Grotesk', sans-serif",
  color: "var(--wine, #4B1528)",
};

const pageInner: CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 28,
};

const headerStyle: CSSProperties = {
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const eyebrow: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 4,
  color: "var(--deep-pink, #C1385F)",
};

const titleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 42,
  lineHeight: 1.05,
  color: "var(--wine, #4B1528)",
  margin: 0,
};

const leadStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 15,
  color: "var(--mauve, #8E6B7B)",
  lineHeight: 1.6,
  margin: "0 auto",
  maxWidth: 600,
};

const progressBarRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  marginTop: 12,
  flexWrap: "wrap",
};

const progressItem: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const progressDot: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  background: "white",
  border: "1px solid rgba(75,21,40,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--mauve, #8E6B7B)",
};

const progressDotActive: CSSProperties = {
  background: "var(--wine, #4B1528)",
  color: "var(--cream, #FFF8EC)",
  borderColor: "var(--wine, #4B1528)",
};

const progressDotDone: CSSProperties = {
  background: "var(--gold, #D4A853)",
  color: "var(--wine, #4B1528)",
  borderColor: "var(--gold, #D4A853)",
};

const progressLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve, #8E6B7B)",
};

const progressLabelActive: CSSProperties = {
  color: "var(--wine, #4B1528)",
};

const progressLine: CSSProperties = {
  width: 24,
  height: 1,
  background: "rgba(75,21,40,0.15)",
  margin: "0 4px",
};

const cardSection: CSSProperties = {
  background: "white",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 18,
  padding: "32px 32px 28px",
  boxShadow: "4px 4px 0 rgba(212,168,83,0.18)",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const prefillSummaryRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 10,
  background: "var(--blush, #FCE4EC)",
  border: "1px solid rgba(193,56,95,0.2)",
  borderRadius: 10,
  padding: "10px 14px",
  margin: "-8px 0 4px",
};

const prefillSummaryText: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine, #4B1528)",
  lineHeight: 1.5,
};

const prefillSummaryEdit: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  background: "transparent",
  color: "var(--deep-pink, #C1385F)",
  border: "1px solid rgba(193,56,95,0.4)",
  borderRadius: 999,
  padding: "6px 14px",
  cursor: "pointer",
};

const stepTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 30,
  color: "var(--wine, #4B1528)",
  margin: 0,
  lineHeight: 1.15,
};

const stepLead: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve, #8E6B7B)",
  lineHeight: 1.6,
  margin: 0,
};

const fieldGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fieldFullWidth: CSSProperties = {
  gridColumn: "1 / -1",
};

const fieldLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--wine, #4B1528)",
};

const fieldHelp: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 14,
  color: "var(--mauve, #8E6B7B)",
};

const requiredMark: CSSProperties = {
  color: "var(--deep-pink, #C1385F)",
};

const inputStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  paddingTop: 10,
  paddingRight: 12,
  paddingBottom: 10,
  paddingLeft: 12,
  border: "1px solid rgba(75,21,40,0.18)",
  borderRadius: 8,
  background: "white",
  color: "var(--wine, #4B1528)",
  outline: "none",
};

const prefixedInputStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  paddingTop: 10,
  paddingRight: 12,
  paddingBottom: 10,
  paddingLeft: 32,
  border: "1px solid rgba(75,21,40,0.18)",
  borderRadius: 8,
  background: "transparent",
  color: "var(--wine, #4B1528)",
  outline: "none",
  width: "100%",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 100,
  lineHeight: 1.55,
};

const inputWithPrefix: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  border: "1px solid rgba(75,21,40,0.18)",
  borderRadius: 8,
  background: "white",
};

const prefixSlot: CSSProperties = {
  position: "absolute",
  left: 12,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve, #8E6B7B)",
};

const fileRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const fileName: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve, #8E6B7B)",
};

const footerRow: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: 8,
};

const primaryBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "12px 22px",
  background: "var(--wine, #4B1528)",
  color: "var(--cream, #FFF8EC)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  boxShadow: "3px 3px 0 var(--gold, #D4A853)",
};

const disabledBtn: CSSProperties = {
  ...primaryBtn,
  background: "rgba(75,21,40,0.25)",
  color: "rgba(255,248,236,0.7)",
  boxShadow: "none",
  cursor: "not-allowed",
};

const ghostBtn: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  padding: "10px 18px",
  background: "transparent",
  color: "var(--wine, #4B1528)",
  border: "1px dashed rgba(75,21,40,0.3)",
  borderRadius: 4,
  cursor: "pointer",
};

const disabledGhost: CSSProperties = {
  ...ghostBtn,
  color: "rgba(75,21,40,0.4)",
  borderColor: "rgba(75,21,40,0.15)",
  cursor: "not-allowed",
};

const textBtn: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  background: "transparent",
  border: "none",
  color: "var(--deep-pink, #C1385F)",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
};

const errorBanner: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  background: "rgba(193,56,95,0.08)",
  border: "1px solid rgba(193,56,95,0.25)",
  color: "var(--deep-pink, #C1385F)",
  padding: "10px 14px",
  borderRadius: 8,
  margin: 0,
};

const topicGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 14,
};

const topicCard: CSSProperties = {
  position: "relative",
  textAlign: "left",
  background: "white",
  border: "1px solid rgba(75,21,40,0.1)",
  borderRadius: 14,
  paddingTop: 20,
  paddingRight: 18,
  paddingBottom: 20,
  paddingLeft: 18,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const topicCardActive: CSSProperties = {
  background: "#FBEAF0",
  border: "2px solid var(--wine, #4B1528)",
  paddingTop: 19,
  paddingRight: 17,
  paddingBottom: 19,
  paddingLeft: 17,
  transform: "translateY(-2px)",
  boxShadow: "4px 4px 0 var(--wine, #4B1528)",
};

const topicCheck: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "var(--wine, #4B1528)",
  color: "var(--cream, #FFF8EC)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 12,
};

const topicMeta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--deep-pink, #C1385F)",
};

const topicCardTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  lineHeight: 1.15,
  color: "var(--wine, #4B1528)",
};

const topicDescription: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve, #8E6B7B)",
  lineHeight: 1.5,
};

const topicQuestionCount: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 14,
  color: "var(--wine, #4B1528)",
  marginTop: "auto",
};

const pitchBlock: CSSProperties = {
  borderTop: "1px dashed rgba(75,21,40,0.2)",
  paddingTop: 22,
  marginTop: 8,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const pitchTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 20,
  margin: 0,
  color: "var(--wine, #4B1528)",
};

const interviewHeader: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  paddingBottom: 14,
  borderBottom: "1px dashed rgba(75,21,40,0.15)",
};

const interviewTopicLine: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const miniBadge: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 9,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  padding: "3px 8px",
  background: "var(--blush, #FCE4EC)",
  color: "var(--deep-pink, #C1385F)",
  borderRadius: 999,
};

const interviewTopicTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  color: "var(--wine, #4B1528)",
};

const progressInfo: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--mauve, #8E6B7B)",
};

const questionDots: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const questionDot: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid rgba(75,21,40,0.2)",
  background: "white",
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--mauve, #8E6B7B)",
  cursor: "pointer",
};

const questionDotFilled: CSSProperties = {
  background: "var(--blush, #FCE4EC)",
  color: "var(--deep-pink, #C1385F)",
  borderColor: "var(--blush, #FCE4EC)",
};

const questionDotActive: CSSProperties = {
  background: "var(--wine, #4B1528)",
  color: "var(--cream, #FFF8EC)",
  borderColor: "var(--wine, #4B1528)",
};

const questionBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  background:
    "linear-gradient(180deg, rgba(252,228,236,0.25) 0%, transparent 100%)",
  padding: "20px 22px 24px",
  borderRadius: 12,
  border: "1px solid rgba(75,21,40,0.08)",
};

const questionLabel: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  fontFamily: "'Instrument Serif', serif",
  fontSize: 22,
  lineHeight: 1.3,
  color: "var(--wine, #4B1528)",
};

const questionNumber: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.4,
  background: "var(--wine, #4B1528)",
  color: "var(--cream, #FFF8EC)",
  padding: "4px 8px",
  borderRadius: 4,
  whiteSpace: "nowrap",
  marginTop: 4,
};

const questionHelper: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 18,
  color: "var(--deep-pink, #C1385F)",
  margin: 0,
};

const charCount: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve, #8E6B7B)",
  alignSelf: "flex-end",
};

const questionNav: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
  flexWrap: "wrap",
  gap: 10,
};

const questionNavHint: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 16,
  color: "var(--mauve, #8E6B7B)",
};

const extrasBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  paddingTop: 8,
  borderTop: "1px dashed rgba(75,21,40,0.15)",
};

const previewSection: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const previewBadge: CSSProperties = {
  alignSelf: "center",
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2.4,
  padding: "6px 14px",
  background: "var(--gold, #D4A853)",
  color: "var(--wine, #4B1528)",
  borderRadius: 999,
};

const blogArticle: CSSProperties = {
  background: "white",
  border: "1px solid rgba(75,21,40,0.08)",
  borderRadius: 18,
  padding: "44px 56px 56px",
  boxShadow: "0 12px 40px rgba(75,21,40,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

const blogHeader: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  paddingBottom: 14,
  borderBottom: "1px solid rgba(75,21,40,0.08)",
};

const blogReadingTime: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--deep-pink, #C1385F)",
};

const blogHeadline: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 44,
  lineHeight: 1.05,
  color: "var(--wine, #4B1528)",
  margin: 0,
};

const authorCard: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "12px 14px",
  background: "var(--blush, #FCE4EC)",
  border: "1px solid rgba(193,56,95,0.18)",
  borderRadius: 12,
};

const authorAvatar: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 999,
  objectFit: "cover",
  flexShrink: 0,
};

const authorAvatarFallback: CSSProperties = {
  ...authorAvatar,
  background: "var(--wine, #4B1528)",
  color: "var(--cream, #FFF8EC)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Instrument Serif', serif",
  fontSize: 26,
};

const authorName: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 18,
  color: "var(--wine, #4B1528)",
};

const authorMeta: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--deep-pink, #C1385F)",
};

const authorBio: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--mauve, #8E6B7B)",
  marginTop: 4,
};

const blogBody: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const blogProse: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  lineHeight: 1.75,
  color: "#2A0C18",
};

const blogPhotoFigure: CSSProperties = {
  margin: 0,
  borderRadius: 12,
  overflow: "hidden",
};

const blogPhotoImage: CSSProperties = {
  width: "100%",
  height: "auto",
  display: "block",
};

const regenHint: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 18,
  color: "var(--mauve, #8E6B7B)",
  textAlign: "center",
  margin: 0,
};

const loadingShell: CSSProperties = {
  ...pageShell,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Caveat', cursive",
  fontSize: 28,
  color: "var(--mauve, #8E6B7B)",
};

const loadingBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 14,
  padding: "40px 0",
  textAlign: "center",
};

const loadingPulse: CSSProperties = {
  width: 60,
  height: 60,
  borderRadius: 999,
  background:
    "conic-gradient(var(--blush, #FCE4EC), var(--gold, #D4A853), var(--deep-pink, #C1385F), var(--blush, #FCE4EC))",
  animation: "marigold-spin 1.4s linear infinite",
};

const thankYouHeadline: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 28,
  fontStyle: "italic",
  color: "var(--wine, #4B1528)",
  borderLeft: "3px solid var(--deep-pink, #C1385F)",
  margin: 0,
  padding: "8px 18px",
  background: "var(--blush, #FCE4EC)",
  borderRadius: "0 12px 12px 0",
};
