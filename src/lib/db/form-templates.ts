/**
 * Pre-built form template definitions.
 *
 * Each template seeds a new FormConfig with sensible defaults — title,
 * description, default field set, thank-you message. Users can customize
 * everything before sharing.
 */

import type {
  FormConfig,
  FormField,
  FormTemplateType,
} from "@/lib/types";

const VENDOR_CATEGORY_OPTIONS = [
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
  "Venue",
  "Other",
];

const VENUE_TYPE_OPTIONS = [
  "Palace",
  "Garden",
  "Beachfront",
  "Farmhouse",
  "Ballroom",
  "Heritage Haveli",
  "Rooftop",
  "Resort",
  "Temple-Adjacent",
  "Banquet Hall",
  "Other",
];

const WEDDING_YEAR_OPTIONS = ["2024", "2025", "2026", "2027", "2028"];

const BRIDE_CONNECT_OPTIONS = [
  "Vendor Recs",
  "Lehenga Shopping Buddy",
  "Budget Planning Partner",
  "Sangeet Choreo Partner",
  "Decor Inspo Swap",
  "Someone Who Gets It",
  "General Planning Buddy",
];

const WEDDING_EVENT_OPTIONS = [
  "Mehndi",
  "Haldi",
  "Sangeet",
  "Ceremony",
  "Reception",
  "Cocktails",
  "After-party",
  "Other",
];

const BRIDE_CREDIT_OPTIONS = [
  "Anonymous Bride",
  "Anonymous Groom",
  "Anonymous Couple",
];

function f(field: Omit<FormField, "enabled"> & { enabled?: boolean }): FormField {
  return { enabled: true, ...field };
}

const IMAGE_TYPES = ["image/"];
const IMAGE_AND_VIDEO = ["image/", "video/"];

// ---------------------------------------------------------------------------
// Template field definitions
// ---------------------------------------------------------------------------

/**
 * Field list shown on the Settings card for the smart vendor intake form.
 * The actual fields are owned by `src/app/submit/vendor/vendor-form-schema.ts`
 * (the form is a dedicated route, not the generic [formId] handler), so this
 * array exists only to populate the field-count stat. Keep it close to the
 * universal opening + closing fields the vendor sees regardless of category.
 */
const VENDOR_SMART_FIELDS: FormField[] = [
  f({ id: "contact_name", type: "text", label: "Your name", required: true }),
  f({ id: "business_name", type: "text", label: "Business name", required: true }),
  f({ id: "category", type: "select", label: "What do you do?", required: true, options: VENDOR_CATEGORY_OPTIONS, helpText: "Picks the category-specific question set." }),
  f({ id: "cities_served", type: "text", label: "City / cities you serve", required: true }),
  f({ id: "instagram", type: "text", label: "Instagram handle", required: false }),
  f({ id: "website", type: "text", label: "Website", required: false }),
  f({ id: "years_in_industry", type: "select", label: "Years in the wedding industry", required: false, options: ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"] }),
  f({ id: "starting_price", type: "text", label: "Starting price for weddings", required: false }),
  f({ id: "portfolio_photos", type: "file", label: "Photos of your best work", required: true, maxFiles: 10, maxFileSize: 10, acceptedTypes: IMAGE_TYPES, helpText: "Helper text adapts to the vendor's category." }),
  f({ id: "headshot_or_logo", type: "file", label: "Headshot or logo", required: false, maxFiles: 1, maxFileSize: 10, acceptedTypes: IMAGE_TYPES }),
  f({ id: "feature_quote", type: "textarea", label: "One quote about your craft", required: false, maxLength: 150 }),
  f({ id: "planners_worked_with", type: "textarea", label: "Planners you've worked with", required: false }),
  f({ id: "anything_else", type: "textarea", label: "Anything else couples should know?", required: false, maxLength: 300 }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to feature my work with credit.", required: true }),
];

const VENDOR_PORTFOLIO_FIELDS: FormField[] = [
  f({ id: "vendor_name", type: "text", label: "Your name", required: true, placeholder: "Riya Kapoor" }),
  f({ id: "business_name", type: "text", label: "Business name", required: false, placeholder: "Riya K Photo" }),
  f({ id: "category", type: "select", label: "Category", required: true, options: VENDOR_CATEGORY_OPTIONS }),
  f({ id: "city", type: "text", label: "City / Region", required: true, placeholder: "Mumbai, Maharashtra" }),
  f({ id: "instagram", type: "text", label: "Instagram handle", required: false, placeholder: "@yourhandle" }),
  f({ id: "website", type: "text", label: "Website", required: false, placeholder: "https://…" }),
  f({ id: "bio", type: "textarea", label: "Tell us about yourself", required: false, maxLength: 500, helpText: "2–3 sentences about your work (500 char max)." }),
  f({ id: "signature_quote", type: "textarea", label: "A quote about your craft", required: false, maxLength: 200, helpText: "Something we can feature (200 char max)." }),
  f({ id: "portfolio_photos", type: "file", label: "Your best work", required: false, maxFiles: 10, maxFileSize: 10, acceptedTypes: IMAGE_TYPES, helpText: "Upload 5–10 photos, 10MB each." }),
  f({ id: "headshot", type: "file", label: "Headshot", required: false, maxFiles: 1, maxFileSize: 5, acceptedTypes: IMAGE_TYPES, helpText: "A photo of you (5MB max)." }),
  f({ id: "anything_else", type: "textarea", label: "Anything else?", required: false }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to feature my work on Instagram with credit.", required: true }),
];

/**
 * Field list shown on the Settings card for the Vendor Blog Post intake form
 * at /submit/blog. Like the smart vendor form, the actual form lives in its
 * own dedicated route (it's a multi-step wizard with topic cards, guided
 * questions, and an AI-generated preview), so this array exists only to
 * populate the field-count stat on the Settings card.
 */
const VENDOR_BLOG_POST_FIELDS: FormField[] = [
  f({ id: "vendor_name", type: "text", label: "Your name", required: true }),
  f({ id: "business_name", type: "text", label: "Business name", required: true }),
  f({ id: "category", type: "select", label: "What do you do?", required: true, options: VENDOR_CATEGORY_OPTIONS, helpText: "Picks the topic suggestions tailored to your craft." }),
  f({ id: "city", type: "text", label: "City", required: false }),
  f({ id: "instagram", type: "text", label: "Instagram handle", required: false }),
  f({ id: "bio", type: "text", label: "One-line bio", required: false, maxLength: 150 }),
  f({ id: "headshot", type: "file", label: "Headshot or logo", required: false, maxFiles: 1, maxFileSize: 10, acceptedTypes: IMAGE_TYPES }),
  f({ id: "topic_id", type: "select", label: "Topic", required: true, options: ["Curated topic", "Pitch your own"], helpText: "Vendor picks one curated topic — or pitches their own." }),
  f({ id: "topic_title", type: "text", label: "Topic title", required: true }),
  f({ id: "guided_questions", type: "textarea", label: "Guided questions (5-7)", required: true, helpText: "Topic-specific interview prompts." }),
  f({ id: "photos", type: "file", label: "Up to 5 supporting photos", required: false, maxFiles: 5, maxFileSize: 10, acceptedTypes: IMAGE_TYPES }),
  f({ id: "blog_post_html", type: "textarea", label: "AI-generated blog post (HTML)", required: true, helpText: "Generated by Claude from the vendor's answers." }),
  f({ id: "permission_feature", type: "checkbox", label: "Permission to publish on The Marigold with credit", required: true }),
];

const VENDOR_TIPS_FIELDS: FormField[] = [
  f({ id: "vendor_name", type: "text", label: "Your name", required: true }),
  f({ id: "business_name", type: "text", label: "Business name", required: false }),
  f({ id: "category", type: "select", label: "Category", required: true, options: VENDOR_CATEGORY_OPTIONS }),
  f({ id: "instagram", type: "text", label: "Instagram handle", required: false, placeholder: "@yourhandle" }),
  f({ id: "tip1_headline", type: "text", label: "Tip 1 — headline", required: true, maxLength: 60, placeholder: "The thing brides always get wrong…" }),
  f({ id: "tip1_detail", type: "textarea", label: "Tip 1 — detail", required: true, maxLength: 200 }),
  f({ id: "tip2_headline", type: "text", label: "Tip 2 — headline", required: true, maxLength: 60 }),
  f({ id: "tip2_detail", type: "textarea", label: "Tip 2 — detail", required: true, maxLength: 200 }),
  f({ id: "tip3_headline", type: "text", label: "Tip 3 — headline", required: true, maxLength: 60 }),
  f({ id: "tip3_detail", type: "textarea", label: "Tip 3 — detail", required: true, maxLength: 200 }),
  f({ id: "tip4_headline", type: "text", label: "Tip 4 — headline (optional)", required: false, maxLength: 60 }),
  f({ id: "tip4_detail", type: "textarea", label: "Tip 4 — detail", required: false, maxLength: 200 }),
  f({ id: "tip5_headline", type: "text", label: "Tip 5 — headline (optional)", required: false, maxLength: 60 }),
  f({ id: "tip5_detail", type: "textarea", label: "Tip 5 — detail", required: false, maxLength: 200 }),
  f({ id: "headshot", type: "file", label: "Headshot photo", required: false, maxFiles: 1, maxFileSize: 5, acceptedTypes: IMAGE_TYPES }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to feature these tips on Instagram with credit.", required: true }),
];

const VENUE_FIELDS: FormField[] = [
  f({ id: "venue_name", type: "text", label: "Venue name", required: true }),
  f({ id: "location", type: "text", label: "City and state", required: true, placeholder: "Udaipur, Rajasthan" }),
  f({ id: "venue_type", type: "select", label: "Venue type", required: true, options: VENUE_TYPE_OPTIONS }),
  f({ id: "capacity", type: "number", label: "Guest capacity", required: true }),
  f({ id: "price_range", type: "text", label: "Starting price range", required: false, placeholder: "₹8–15 lakh" }),
  f({ id: "best_for", type: "textarea", label: "What's this venue best for?", required: false, maxLength: 200 }),
  f({ id: "contact_name", type: "text", label: "Contact name", required: false }),
  f({ id: "contact_email", type: "text", label: "Contact email", required: false }),
  f({ id: "instagram", type: "text", label: "Instagram handle", required: false }),
  f({ id: "website", type: "text", label: "Website", required: false }),
  f({ id: "venue_photos", type: "file", label: "Venue photos", required: true, maxFiles: 15, maxFileSize: 10, acceptedTypes: IMAGE_TYPES, helpText: "Upload up to 15 photos." }),
  f({ id: "virtual_tour", type: "text", label: "Virtual tour link (optional)", required: false }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to feature this venue on Instagram with credit.", required: true }),
];

const BRIDE_CONFESSION_FIELDS: FormField[] = [
  f({ id: "confession", type: "textarea", label: "Your confession", required: true, maxLength: 500, placeholder: "I love him but I cannot stand his mom's taste in lehengas…" }),
  f({ id: "credit_as", type: "select", label: "Credit line", required: false, options: BRIDE_CREDIT_OPTIONS, helpText: "How would you like to be credited?" }),
  f({ id: "wedding_year", type: "select", label: "Wedding year", required: false, options: WEDDING_YEAR_OPTIONS }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to share this anonymously on Instagram.", required: true, helpText: "You'll stay anonymous unless you ask otherwise." }),
];

const BRIDE_CONNECT_FIELDS: FormField[] = [
  f({ id: "first_name", type: "text", label: "First name", required: true }),
  f({ id: "age", type: "number", label: "Age", required: false }),
  f({ id: "city", type: "text", label: "City you're planning in", required: true }),
  f({ id: "wedding_month_year", type: "month-year", label: "Wedding month & year", required: true }),
  f({ id: "looking_for", type: "multi-select", label: "What are you looking for?", required: false, options: BRIDE_CONNECT_OPTIONS }),
  f({ id: "stress_prompt", type: "textarea", label: "The thing I'm most stressed about is…", required: false, maxLength: 200 }),
  f({ id: "vibe_prompt", type: "textarea", label: "My wedding vibe is…", required: false, maxLength: 200 }),
  f({ id: "profile_photo", type: "file", label: "Profile photo (optional)", required: false, maxFiles: 1, maxFileSize: 10, acceptedTypes: IMAGE_TYPES }),
  f({ id: "instagram", type: "text", label: "Instagram handle (optional)", required: false }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to share my profile on Instagram with other brides.", required: true }),
];

const BRIDE_DIARY_FIELDS: FormField[] = [
  f({ id: "name_or_initial", type: "text", label: "First name or initial", required: true, placeholder: "S." }),
  f({ id: "age", type: "number", label: "Age", required: false }),
  f({ id: "city", type: "text", label: "City", required: false }),
  f({ id: "time_to_wedding", type: "text", label: "How far out is your wedding?", required: false, placeholder: "4 months" }),
  f({ id: "diary_entry", type: "textarea", label: "Your diary entry — where are you in planning right now?", required: true, maxLength: 1000 }),
  f({ id: "advice", type: "textarea", label: "One piece of advice for other brides", required: false, maxLength: 200 }),
  f({ id: "photo", type: "file", label: "Photo of yourself (optional)", required: false, maxFiles: 1, maxFileSize: 10, acceptedTypes: IMAGE_TYPES }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to share this entry on Instagram.", required: true }),
];

const WEDDING_RECAP_FIELDS: FormField[] = [
  f({ id: "couple_names", type: "text", label: "Couple names", required: false, placeholder: "Aarav & Priya" }),
  f({ id: "wedding_date", type: "date", label: "Wedding date", required: false }),
  f({ id: "wedding_city", type: "text", label: "City", required: false }),
  f({ id: "guest_count", type: "number", label: "Number of guests", required: false }),
  f({ id: "events_held", type: "multi-select", label: "Events", required: false, options: WEDDING_EVENT_OPTIONS }),
  f({ id: "story", type: "textarea", label: "Your story — how did you meet, what was the wedding like?", required: false, maxLength: 1000 }),
  f({ id: "favorite_moment", type: "textarea", label: "Favorite moment", required: false, maxLength: 200 }),
  f({ id: "vendor_recs", type: "textarea", label: "Vendors you'd recommend", required: false, helpText: "Name, category, handle — one per line works great." }),
  f({ id: "wedding_photos", type: "file", label: "Wedding photos", required: true, maxFiles: 20, maxFileSize: 10, acceptedTypes: IMAGE_AND_VIDEO, helpText: "Upload up to 20 images." }),
  f({ id: "highlights_link", type: "text", label: "Video link — YouTube or Drive (optional)", required: false, placeholder: "https://…" }),
  f({ id: "permission_feature", type: "checkbox", label: "I give The Marigold permission to feature our wedding on Instagram.", required: true }),
];

const GENERAL_FIELDS: FormField[] = [
  f({ id: "name", type: "text", label: "Name", required: false }),
  f({ id: "email", type: "text", label: "Email", required: false }),
  f({ id: "message", type: "textarea", label: "Message", required: false }),
  f({ id: "attachments", type: "file", label: "File attachments", required: false, maxFiles: 10, maxFileSize: 25, acceptedTypes: IMAGE_AND_VIDEO }),
];

// ---------------------------------------------------------------------------
// Template seed metadata
// ---------------------------------------------------------------------------

export interface FormTemplateSeed {
  type: FormTemplateType;
  label: string;
  /** Short description shown when picking a template. */
  pitch: string;
  /** Audience tag — used by the Share Modal to pre-fill copy. */
  audience: "vendor" | "venue" | "bride" | "couple" | "anyone";
  /** Default form title shown at the top of the public page. */
  defaultTitle: string;
  /** Default description shown below the title. */
  defaultDescription: string;
  defaultThankYou: string;
  fields: FormField[];
}

export const FORM_TEMPLATE_SEEDS: FormTemplateSeed[] = [
  {
    type: "vendor",
    label: "Vendor — Smart Intake",
    pitch:
      "Adaptive form: universal basics, then category-specific questions for photographers, planners, MUAs, pandits, and 20+ more.",
    audience: "vendor",
    defaultTitle: "Submit your vendor profile",
    defaultDescription:
      "Tell us about your work — quick, friendly, no government-form energy. We'll use this to feature you to the South Asian couples who already love The Marigold.",
    defaultThankYou:
      "Thanks! We'll review your submission and reach out when your feature is ready.",
    fields: VENDOR_SMART_FIELDS,
  },
  {
    type: "vendor-portfolio",
    label: "Vendor Portfolio",
    pitch: "Photographers, decorators, and the rest — bio, signature quote, portfolio photos.",
    audience: "vendor",
    defaultTitle: "Share your work with The Marigold",
    defaultDescription:
      "We'd love to feature your work on our Instagram. Fill this out — it takes about 3 minutes.",
    defaultThankYou:
      "We'll review your submission and reach out when your feature goes live. Keep an eye on @themarigold!",
    fields: VENDOR_PORTFOLIO_FIELDS,
  },
  {
    type: "vendor-tips",
    label: "Vendor Tips Submission",
    pitch: "3–5 punchy tips you wish brides knew, plus a headshot.",
    audience: "vendor",
    defaultTitle: "Share your vendor tips",
    defaultDescription:
      "We're putting together a vendor-tips series. Share 3–5 things you wish every bride knew about working with you — punchy is better than thorough.",
    defaultThankYou:
      "Thank you — got your tips. We'll tag you when the cards drop.",
    fields: VENDOR_TIPS_FIELDS,
  },
  {
    type: "vendor-blog-post",
    label: "Vendor Blog Post",
    pitch:
      "Vendors answer guided questions, AI writes the post. They preview before submitting.",
    audience: "vendor",
    defaultTitle: "Write for The Marigold",
    defaultDescription:
      "Tell us a story — we'll write the blog post. Pick a topic tailored to your craft, answer 5-7 questions, and our AI assembles a polished post you review before submitting.",
    defaultThankYou:
      "Your blog post draft has been submitted! We'll review it, polish it up if needed, and publish it on The Marigold with full credit and a link to your business.",
    fields: VENDOR_BLOG_POST_FIELDS,
  },
  {
    type: "venue",
    label: "Venue Submission",
    pitch: "Capacity, photos, price range, the works.",
    audience: "venue",
    defaultTitle: "Submit your venue",
    defaultDescription:
      "We feature venues that South Asian couples actually want to book. Tell us the essentials — capacity, vibe, ballpark — and drop a few photos.",
    defaultThankYou:
      "Thank you — venue noted. We'll reach out when we're ready to feature it.",
    fields: VENUE_FIELDS,
  },
  {
    type: "bride-confession",
    label: "Bride Confession",
    pitch: "Anonymous confessions for the Confessional series.",
    audience: "bride",
    defaultTitle: "Confess (anonymously)",
    defaultDescription:
      "The Marigold's Confessional series runs on real, raw, anonymous truths from brides. Drop yours — we'll keep you anonymous unless you ask otherwise.",
    defaultThankYou:
      "Your secret is safe with us. Watch our stories for The Confessional.",
    fields: BRIDE_CONFESSION_FIELDS,
  },
  {
    type: "bride-connect",
    label: "Bride Connect Profile",
    pitch: "Match-making profile for our Bride Connect series.",
    audience: "bride",
    defaultTitle: "Join Bride Connect",
    defaultDescription:
      "Find a planning buddy who actually gets it. Fill out a short profile — what you're stressed about, what you're looking for, and your wedding vibe.",
    defaultThankYou:
      "We'll share your profile soon. Your planning bestie might be right around the corner.",
    fields: BRIDE_CONNECT_FIELDS,
  },
  {
    type: "bride-diary",
    label: "Real Bride Diary Entry",
    pitch: "Long-form journal entry from where she is in planning right now.",
    audience: "bride",
    defaultTitle: "Submit a diary entry",
    defaultDescription:
      "We feature real brides mid-planning — the messy middle, not just the highlight reel. Write about where you are right now. Be honest.",
    defaultThankYou:
      "Thank you for sharing. Other brides will read this and feel less alone — that's the whole point.",
    fields: BRIDE_DIARY_FIELDS,
  },
  {
    type: "wedding-recap",
    label: "Wedding Recap / Real Wedding",
    pitch: "Photos, story, vendor credits — the whole event.",
    audience: "couple",
    defaultTitle: "Submit your wedding",
    defaultDescription:
      "Just got married? We'd love to feature your wedding. Drop the story, the photos, and the vendors who made it — we'll credit everyone.",
    defaultThankYou:
      "Thank you — congratulations again. We'll review and reach out when we're ready to feature your wedding.",
    fields: WEDDING_RECAP_FIELDS,
  },
  {
    type: "general",
    label: "General / Custom",
    pitch: "Blank slate — add any custom fields you need.",
    audience: "anyone",
    defaultTitle: "Get in touch",
    defaultDescription:
      "Tell us what's on your mind. We read everything.",
    defaultThankYou: "Thank you — message received.",
    fields: GENERAL_FIELDS,
  },
];

export function getFormTemplateSeed(
  type: FormTemplateType,
): FormTemplateSeed | null {
  return FORM_TEMPLATE_SEEDS.find((t) => t.type === type) ?? null;
}

export function templateLabel(type: FormTemplateType): string {
  return getFormTemplateSeed(type)?.label ?? type;
}

export function buildFormFromSeed(seed: FormTemplateSeed): Omit<
  FormConfig,
  "id" | "createdAt" | "updatedAt" | "submissionCount"
> {
  return {
    templateType: seed.type,
    title: seed.defaultTitle,
    description: seed.defaultDescription,
    thankYouMessage: seed.defaultThankYou,
    isActive: true,
    // Deep clone the fields so future edits don't mutate the seed.
    fields: seed.fields.map((field) => ({ ...field })),
  };
}
