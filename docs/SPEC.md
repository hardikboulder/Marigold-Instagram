# The Marigold Content Studio — Project Specification

## Executive Summary

The Marigold Content Studio is an AI-powered content generation platform for **The Marigold** — a South Asian wedding planning brand. The platform generates Instagram-ready stories, posts, reels, and video content using a codified brand design system, driven by an AI engine that understands the brand's voice, product, audience, and content strategy.

The system takes a library of branded templates (currently defined in a static HTML file), converts them into a parameterized, renderable component architecture, layers an AI content strategist on top, and outputs production-ready assets at native Instagram dimensions — static images and animated video — with zero manual design work.

---

## 1. Brand Context

### 1.1 What Is The Marigold?

The Marigold is a wedding planning platform targeting South Asian brides navigating the unique chaos of desi weddings — large guest lists, multi-event ceremonies, family dynamics, vendor coordination across sangeet/mehndi/haldi/ceremony/reception, and the cultural specifics that mainstream wedding planners don't account for.

### 1.2 Brand Voice

- **Playful and irreverent** — not corporate, not cutesy. Real talk.
- **Insider tone** — speaks like a bride's best friend who's been through it.
- **Culturally specific** — references baraat horses, mandap décor, lehenga drama, MIL guest list politics. Never generic "wedding" content.
- **Slightly chaotic energy** — sticky notes, pins, tape, handwritten annotations. Organized mess aesthetic.

### 1.3 Visual Identity

**Typography (4 fonts, each with a role):**

| Font | Role | Usage |
|------|------|-------|
| Instrument Serif | Display / Logo | Headlines, "The *Marigold*" wordmark, large quotes |
| Syne | UI / Labels | Category headers, CTAs, handles, all-caps labels |
| Space Grotesk | Body | Descriptions, supporting text, readability |
| Caveat | Handwritten / Editorial | Annotations, asides, playful commentary, confessions |

**Color Palette (CSS Variables):**

| Token | Hex | Role |
|-------|-----|------|
| `--pink` | #D4537E | Primary brand / section backgrounds |
| `--hot-pink` | #ED93B1 | Accents, logo italic |
| `--deep-pink` | #993556 | Dark pink for emphasis |
| `--blush` | #FBEAF0 | Confession card (blush variant) |
| `--cream` | #FFF8F2 | Default light background |
| `--wine` | #4B1528 | Dark backgrounds, CTA bars, text |
| `--mauve` | #8A6070 | Secondary text, attributions |
| `--gold` | #D4A853 | Accents, dividers, "vs." text |
| `--gold-light` | #F5E6C8 | Card backgrounds, tape elements |
| `--lavender` | #E0D0F0 | Confession card (lavender variant) |
| `--mint` | #C8EDDA | Quiz result (Zen Queen) |
| `--peach` | #FFD8B8 | Quiz result (Party Starter) |
| `--sky` | #C8DFF5 | Reserved accent |

**Decorative Elements (recurring across all templates):**

- **Tape strips** — semi-transparent gold rectangles, slightly rotated. Evoke a scrapbook/mood board.
- **Push pins** — circular with radial gradient. Four variants: pink, red, gold, blue.
- **CTA bar** — persistent bottom bar on every template. Wine background, "The *Marigold*" logo left, @themarigold handle right.

---

## 2. Content Architecture

### 2.1 Content Series

The Marigold's Instagram strategy is built around recurring content series, each with a distinct format, purpose, and set of templates.

#### Series 01: Bridezilla vs. Momzilla

**Purpose:** Engagement driver. Relatable split-screen comparisons that generate comments and shares.

**Formats:** Story (1080×1920), Post (1080×1080)

**Template Structure:**
- **Story:** Vertical split — top half (pink, bride's quote), "vs." divider (cream with Caveat script), bottom half (wine, mom's quote), CTA bar.
- **Post:** Horizontal split — left (pink, bride), right (wine, mom), "vs." overlay center, CTA bar bottom.

**Editable Fields:**
- `episodeNumber` — integer
- `episodeTopic` — string (e.g., "Guest List Size")
- `brideQuote` — string (the bride's take)
- `brideAnnotation` — string (Caveat aside, e.g., "she said, confidently")
- `momQuote` — string (the mom's take)
- `momAnnotation` — string (Caveat aside, e.g., "and that's just dad's side")
- `ctaTagline` — optional string (bottom bar right text, defaults to "@themarigold")

**Episode Topic Bank (AI seed data):**
Guest list size, lehenga/outfit color, mandap décor, food menu, DJ vs. live band, venue selection, who walks in first, honeymoon destination, photography style, wedding timeline, sangeet choreography, return gifts.

---

#### Series 02: The Confessional

**Purpose:** High engagement + UGC pipeline. Anonymous confessions on sticky notes. Drives DMs and submissions.

**Formats:** Story only (1080×1920)

**Template Variants:**

| Slide Type | Background | Card Color | Pin | Notes |
|------------|-----------|------------|-----|-------|
| Title Slide | Wine | N/A | Scattered (4 pins) | Series opener, "SWIPE FOR CONFESSIONS →" |
| Confession — Blush | Cream | `--blush` | Pink | Slight -2deg rotation |
| Confession — Gold | Cream | `--gold-light` | Gold | +1.5deg rotation, lined paper effect |
| Confession — Lavender | Cream | `--lavender` | Blue | -1deg rotation |
| Submit CTA | Pink | N/A | Gold + Red | "Got a confession?" + "LINK IN BIO" button |

**Editable Fields (per confession card):**
- `confessionNumber` — integer (displayed as "CONFESSION #01")
- `confessionText` — string (the confession itself, rendered in Caveat 64px)
- `attribution` — string (e.g., "— ANONYMOUS BRIDE, 2026")
- `variant` — enum: `blush` | `gold` | `lavender`

**AI Behavior:** The AI can generate confessions in-voice based on common desi wedding scenarios, or the user can input real submissions. AI-generated confessions should feel authentic — specific details, relatable chaos, slightly self-deprecating humor.

---

#### Series 03: What's Your Bride Energy?

**Purpose:** Shareability driver. Quiz results get reposted to individual Stories, expanding reach.

**Formats:** Story only (1080×1920)

**Template Variants:**

| Slide | Background | Content |
|-------|-----------|---------|
| Title Slide | Wine | Quiz question + 4 options (A/B/C/D) |
| Result A — Zen Queen | Mint | Personality description + product tie-in |
| Result B — Type-A Goddess | Gold-light (lined) | Personality description + product tie-in |
| Result C — Creative Visionary | Lavender | Personality description + product tie-in |
| Result D — Party Starter | Peach | Personality description + product tie-in |

**Editable Fields (per result card):**
- `resultLabel` — string (e.g., "Zen Queen")
- `resultQuote` — string (Caveat personality quote)
- `resultDescription` — string (Space Grotesk product tie-in)

**AI Behavior:** The AI can generate new quiz themes beyond "Bride Energy" — e.g., "What's Your Sangeet Energy?", "What's Your Vendor Communication Style?" — using the same 4-result card format with appropriate personality archetypes.

---

#### Bonus: General Purpose Templates

**Purpose:** Flexible templates for one-off content — vendor quotes, stats, feature callouts, announcements.

**Templates:**

1. **Vendor Quote Post** (1080×1080) — Quote card with tape elements, attribution, and a Marigold product tie-in tagline.
2. **Feature Callout Post** (1080×1080) — Pink background, headline text, Caveat annotation, CTA button.
3. **Stat Callout Story** (1080×1920) — Wine background, large stat number (Instrument Serif 280px), supporting context.

**Editable Fields (Vendor Quote):**
- `quote` — string
- `attribution` — string (e.g., "— ANONYMOUS PHOTOGRAPHER")
- `tagline` — string (Caveat product tie-in)

**Editable Fields (Feature Callout):**
- `categoryLabel` — string (e.g., "DID YOU KNOW")
- `headline` — string (multi-line supported)
- `annotation` — string (Caveat aside)
- `ctaText` — string (button label)

**Editable Fields (Stat Callout):**
- `statNumber` — string (e.g., "582")
- `statLabel` — string (e.g., "PLANNING TASKS")
- `description` — string (Caveat supporting copy)

---

### 2.2 Supported Formats

| Format | Dimensions | Aspect Ratio | Use Case |
|--------|-----------|-------------|----------|
| Story | 1080 × 1920 | 9:16 | Instagram Stories, Reels cover |
| Post | 1080 × 1080 | 1:1 | Instagram feed posts |
| Reel | 1080 × 1920 | 9:16 | Instagram Reels (video, 15-60s) |

---

## 3. System Architecture

### 3.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js (App Router) | Consistent with existing stack, SSR for preview rendering |
| Database | Supabase (Postgres + Storage) | Content calendar, generated assets, brand config |
| AI Engine | Claude API (Sonnet) | Content generation, strategy suggestions |
| Static Export | `html-to-image` or Puppeteer | Render React components to PNG at native resolution |
| Video Export | Remotion | React-based video compositions, export MP4 |
| Styling | Tailwind CSS + CSS Variables | Design token system from brand palette |
| Auth | Supabase Auth | Simple — this is an internal tool, not consumer-facing |
| Storage | Supabase Storage | Generated asset files (PNG, MP4) |

### 3.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CONTENT STUDIO UI                     │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Feed     │  │ Template     │  │ Asset Renderer    │  │
│  │ Calendar │  │ Editor       │  │ (Preview + Export) │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       │               │                   │              │
│  ┌────┴───────────────┴───────────────────┴──────────┐  │
│  │              AI Content Engine                     │  │
│  │  (Claude API — brand-aware system prompt)          │  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────┴──────────────────────────────┐  │
│  │              Data Layer (Supabase)                 │  │
│  │  content_calendar | templates | brand_config       │  │
│  │  generated_assets | brand_knowledge               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Core Principle: Brand Config as Data, Not Code

Following the same philosophy as the JAI Acquisitions Platform — all brand knowledge, content rules, template parameters, and AI behavior are stored as database configuration. Adding a new content series or changing the posting cadence should never require a code change.

---

## 4. Database Schema

### 4.1 `brand_config`

Stores the brand's design tokens, voice guidelines, and product knowledge as structured config.

```sql
CREATE TABLE brand_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed examples:
-- config_key: 'color_palette' → { pink: '#D4537E', wine: '#4B1528', ... }
-- config_key: 'typography' → { display: 'Instrument Serif', ui: 'Syne', ... }
-- config_key: 'brand_voice' → { tone: 'playful, irreverent...', examples: [...] }
-- config_key: 'product_knowledge' → { features: [...], stats: {...}, ... }
-- config_key: 'content_strategy' → { posting_cadence: {...}, series_mix: {...} }
```

### 4.2 `content_series`

Defines each recurring content series and its properties.

```sql
CREATE TABLE content_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- 'bridezilla-vs-momzilla'
  name TEXT NOT NULL,                  -- 'Bridezilla vs. Momzilla'
  description TEXT,
  purpose TEXT,                        -- 'engagement', 'shares', 'awareness', 'ugc'
  supported_formats TEXT[] NOT NULL,   -- ['story', 'post', 'reel']
  template_ids UUID[],                -- references to template_definitions
  episode_seed_data JSONB,            -- topic banks, personality types, etc.
  ai_generation_prompt TEXT,          -- series-specific AI instructions
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 `template_definitions`

Each unique template layout — its structure, editable fields, and variant options.

```sql
CREATE TABLE template_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES content_series(id),
  slug TEXT UNIQUE NOT NULL,           -- 'confessional-blush'
  name TEXT NOT NULL,                  -- 'Confession — Blush'
  format TEXT NOT NULL,                -- 'story' | 'post'
  dimensions JSONB NOT NULL,          -- { width: 1080, height: 1920 }
  component_name TEXT NOT NULL,       -- 'ConfessionalCard' (React component ref)
  editable_fields JSONB NOT NULL,     -- field definitions with types, defaults, validation
  variant_config JSONB,               -- color overrides, layout tweaks per variant
  decorative_elements JSONB,          -- pins, tape placements specific to this template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- editable_fields example:
-- [
--   { "key": "confessionNumber", "type": "number", "label": "Confession #", "default": 1 },
--   { "key": "confessionText", "type": "textarea", "label": "Confession", "maxLength": 200 },
--   { "key": "attribution", "type": "text", "label": "Attribution", "default": "— ANONYMOUS BRIDE, 2026" },
--   { "key": "variant", "type": "select", "label": "Color Variant", "options": ["blush", "gold", "lavender"] }
-- ]
```

### 4.4 `content_calendar`

The AI-generated (and user-curated) content plan.

```sql
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  series_id UUID REFERENCES content_series(id),
  template_id UUID REFERENCES template_definitions(id),
  format TEXT NOT NULL,                -- 'story' | 'post' | 'reel'
  status TEXT DEFAULT 'suggested',     -- 'suggested' | 'approved' | 'editing' | 'exported' | 'posted'
  content_data JSONB NOT NULL,        -- populated editable field values
  caption TEXT,                        -- AI-generated caption
  hashtags TEXT[],                     -- AI-suggested hashtags
  ai_rationale TEXT,                   -- why the AI suggested this content for this date
  generation_prompt TEXT,              -- the user's custom prompt if they overrode
  asset_urls JSONB,                   -- { png: '...', mp4: '...' } after export
  sort_order INTEGER DEFAULT 0,       -- ordering within a day
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.5 `generated_assets`

Tracks every rendered asset file.

```sql
CREATE TABLE generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES content_calendar(id),
  file_type TEXT NOT NULL,             -- 'png' | 'mp4' | 'jpg'
  file_url TEXT NOT NULL,              -- Supabase Storage URL
  dimensions JSONB NOT NULL,
  file_size_bytes INTEGER,
  render_config JSONB,                 -- snapshot of template + content data at render time
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.6 `brand_knowledge`

Chunks of brand knowledge the AI uses as context — website copy, features, stats, audience notes.

```sql
CREATE TABLE brand_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,              -- 'product_features' | 'audience' | 'tone' | 'stats' | 'competitors'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),              -- optional: for semantic retrieval if knowledge base grows large
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. AI Content Engine

### 5.1 System Prompt Architecture

The AI engine operates with a layered system prompt:

**Layer 1 — Brand Identity (always present):**
Brand voice guidelines, product knowledge, audience profile, cultural context. Loaded from `brand_config` and `brand_knowledge` tables.

**Layer 2 — Content Strategy (always present):**
Posting cadence rules, series rotation logic, content mix targets (e.g., 40% engagement, 30% awareness, 20% shares, 10% UGC), seasonal awareness (wedding season peaks, festival timing).

**Layer 3 — Series-Specific (loaded per generation):**
The `ai_generation_prompt` from the relevant `content_series` record. Contains series-specific tone, format constraints, and example outputs.

**Layer 4 — User Prompt (optional override):**
When the user provides a custom prompt like "Generate a Confessional about a bride who lied about the florist budget."

### 5.2 AI Capabilities

**Content Calendar Generation:**
Given a date range and current content state, the AI suggests a posting schedule with specific content for each slot — series, template, content data, caption, and rationale.

**Single Post Generation:**
Given a series and optional prompt, generate the complete content data for one post — all editable fields populated, plus caption and hashtags.

**Caption Generation:**
Generate Instagram captions in-voice. The Marigold's caption style: short, punchy, ends with a question or CTA, uses 1-2 relevant emojis max, hashtag block separated by line breaks.

**Content Variation:**
Given an existing post, generate 2-3 alternative versions — different angles on the same topic, alternate quotes, rephrased confessions.

**Series Expansion:**
Generate new episode ideas for existing series, or propose entirely new series concepts that fit the brand.

### 5.3 AI Guardrails

- Content must always tie back to The Marigold's product or brand in some way — never generic "wedding content."
- Humor should be self-deprecating and observational, never mean-spirited about specific cultures, families, or traditions.
- AI-generated confessions must feel authentic — specific, detailed, relatable — not generic.
- Stats and claims about the product must reference actual features from `brand_knowledge`.
- The AI should flag when it's generating content that overlaps too closely with recent posts.

---

## 6. View Specifications

### 6.1 Feed Calendar View (Primary View)

The main dashboard. Shows a visual Instagram-style grid of upcoming content.

**Layout:** A scrollable feed organized by week. Each week shows a row of content tiles in posting order. Above the grid, a horizontal timeline bar showing the current week with day markers.

**Each Tile Shows:**
- Rendered preview thumbnail of the template with content populated
- Format badge (Story / Post / Reel)
- Series label (color-coded)
- Status indicator (Suggested → Approved → Exported → Posted)
- Scheduled date and time

**Interactions:**
- Click tile → opens Template Editor (6.2)
- Drag to reorder within a day or across days
- Right-click → Regenerate / Duplicate / Delete
- "Generate Week" button → AI fills the next 7 days based on strategy
- "Add Post" button → manual creation with template picker
- Filter by series, format, or status

### 6.2 Template Editor View

Full-screen editor for a single content piece.

**Layout:** Two-panel — left side is the edit form, right side is the live preview.

**Left Panel (Edit Form):**
- Template selector (dropdown with visual previews)
- Dynamic form fields generated from the template's `editable_fields` config
- Caption editor with character count
- Hashtag suggestions (AI-generated, toggleable)
- "Regenerate" button — asks AI for a new version of the content
- Custom prompt input — "Tell the AI what you want" freeform field

**Right Panel (Live Preview):**
- The actual React template component rendered at scale with real content
- Format toggle (preview as Story / Post if template supports both)
- Zoom controls
- "Export" button → renders at full resolution and saves to Supabase Storage

**For Reels:**
- Preview includes a play button for the Remotion composition
- Timeline scrubber showing animation keyframes
- Animation preset selector (e.g., "Slide In", "Type Reveal", "Pin Drop")
- Duration control (15s / 30s / 60s)

### 6.3 Brand Settings View

Configuration panel for brand knowledge and content strategy.

**Sections:**
- **Voice & Tone** — editable brand voice guidelines, example phrases, do's and don'ts
- **Product Knowledge** — features, stats, descriptions that the AI references
- **Content Strategy** — posting cadence (posts/week by format), series rotation rules, content mix targets
- **Design Tokens** — color palette editor, font preview (read-only since fonts are fixed)
- **Template Library** — overview of all templates, ability to toggle active/inactive

### 6.4 Asset Library View

Gallery of all generated and exported assets.

**Layout:** Grid of asset thumbnails with metadata.

**Features:**
- Filter by format, series, date range, status
- Bulk download (zip)
- Re-render from stored config (if template has been updated)
- Copy caption to clipboard

---

## 7. Template Component Architecture

### 7.1 Component Hierarchy

```
<TemplateRenderer>
  ├── <TemplateFrame format="story|post">     // dimensions + scaling
  │   ├── <BridezillaVsMomzilla>              // Series 01
  │   │   ├── <SplitPanel side="bride|mom">
  │   │   ├── <VsDivider>
  │   │   └── <CTABar>
  │   │
  │   ├── <Confessional>                      // Series 02
  │   │   ├── <ConfessionalTitle>
  │   │   ├── <ConfessionalCard variant="blush|gold|lavender">
  │   │   │   ├── <StickyNote>
  │   │   │   └── <PushPin variant="pink|gold|blue">
  │   │   ├── <ConfessionalCTA>
  │   │   └── <CTABar>
  │   │
  │   ├── <BrideEnergyQuiz>                   // Series 03
  │   │   ├── <QuizTitle>
  │   │   ├── <QuizOption letter="A|B|C|D">
  │   │   ├── <QuizResult type="zen|typeA|creative|party">
  │   │   └── <CTABar>
  │   │
  │   └── <GeneralPurpose>                    // Bonus
  │       ├── <VendorQuote>
  │       ├── <FeatureCallout>
  │       ├── <StatCallout>
  │       └── <CTABar>
  │
  ├── <TapeStrip>                             // Shared decorative
  ├── <PushPin variant="pink|red|gold|blue">  // Shared decorative
  └── <CTABar>                                // Shared footer
```

### 7.2 Shared Components

**`<TemplateFrame>`** — Wraps every template. Handles dimensions (1080×1920 or 1080×1080), preview scaling (0.25x for story, 0.296x for post), and the export target (renders at 1x for final output).

**`<CTABar>`** — The persistent bottom bar. Props: `logoText`, `handleText`, `variant` (dark/overlay).

**`<TapeStrip>`** — Decorative tape element. Props: `rotation`, `width`, `position` (absolute coordinates).

**`<PushPin>`** — Decorative pin. Props: `variant` (pink/red/gold/blue), `position`, `size`.

**`<StickyNote>`** — Card component for Confessional. Props: `color`, `rotation`, `pinVariant`, `lined` (boolean for gold variant's ruled lines).

### 7.3 Design Token System

All brand values live in a `theme.ts` file that maps directly to CSS variables:

```typescript
export const marigoldTheme = {
  colors: {
    pink: '#D4537E',
    hotPink: '#ED93B1',
    deepPink: '#993556',
    blush: '#FBEAF0',
    cream: '#FFF8F2',
    wine: '#4B1528',
    mauve: '#8A6070',
    gold: '#D4A853',
    goldLight: '#F5E6C8',
    lavender: '#E0D0F0',
    mint: '#C8EDDA',
    peach: '#FFD8B8',
    sky: '#C8DFF5',
  },
  fonts: {
    display: "'Instrument Serif', serif",
    ui: "'Syne', sans-serif",
    body: "'Space Grotesk', sans-serif",
    handwritten: "'Caveat', cursive",
  },
  // Font loading via Google Fonts URL:
  // https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap
} as const;
```

---

## 8. Video / Reels Architecture (Remotion)

### 8.1 Overview

Remotion allows defining video compositions as React components with frame-based animation. Each template series gets a corresponding Remotion composition that animates the static template.

### 8.2 Animation Presets

| Preset | Description | Best For |
|--------|------------|----------|
| `slideIn` | Elements slide in from edges with spring easing | Bridezilla vs. Momzilla |
| `typeReveal` | Text appears character-by-character (typewriter) | Confessional, Vendor Quotes |
| `pinDrop` | Pin drops in from top, note swings into place | Confessional |
| `splitReveal` | Two halves slide apart from center | Bridezilla vs. Momzilla |
| `fadeStack` | Cards fade and stack on top of each other | Quiz Results |
| `numberCount` | Stat number counts up from 0 | Stat Callout |

### 8.3 Composition Structure

Each reel is a Remotion `<Composition>` that sequences template slides:

```
Reel: "Confessional Episode"
├── Frame 0-30: Title slide (fade in, pins scatter)
├── Frame 30-90: Confession #1 (pin drop, note swing, text reveal)
├── Frame 90-150: Confession #2 (variant change, same animation)
├── Frame 150-210: Confession #3
├── Frame 210-270: Submit CTA (bounce in, button pulse)
└── Frame 270-300: End card with logo
```

### 8.4 Export Pipeline

```
React Component (with Remotion) 
  → Remotion render (server-side via Lambda or Modal)
  → MP4 at 1080x1920, 30fps
  → Upload to Supabase Storage
  → Link back to content_calendar record
```

---

## 9. Export Pipeline

### 9.1 Static Image Export

```
Template Component (React)
  → Render at 1x scale (1080px native width)
  → html-to-image (dom-to-png) or Puppeteer screenshot
  → PNG output
  → Upload to Supabase Storage
  → Return download URL
```

**Key requirements:**
- Fonts must be fully loaded before screenshot (use `document.fonts.ready`)
- Export at exactly 1080×1920 (story) or 1080×1080 (post)
- PNG format for quality (Instagram re-compresses anyway)
- Include all decorative elements — tape, pins, textures

### 9.2 Batch Export

"Export Week" button renders all approved content for a given week:
- Generates all static images in parallel
- Queues video renders
- Zips everything with a manifest (filename = date_series_format.png)
- Downloads as a single zip

---

## 10. Build Phases

### Phase 1: Template Engine (Foundation)

**Goal:** Convert all HTML templates into parameterized React components with live preview and static export.

**Deliverables:**
- Next.js project scaffolding with Supabase connection
- Design token system (`theme.ts` + CSS variables)
- All shared components: `TemplateFrame`, `CTABar`, `TapeStrip`, `PushPin`, `StickyNote`
- All template components for Series 01, 02, 03, and Bonus
- Template preview page — render every template with sample data
- Static export function (html-to-image) at native resolution
- Database schema: `brand_config`, `template_definitions`
- Seed data for all existing templates

### Phase 2: AI Content Engine + Calendar

**Goal:** Wire up Claude API with brand knowledge. Build the feed calendar and AI-driven content suggestions.

**Deliverables:**
- Brand knowledge seeding — product features, voice guide, audience profile
- AI system prompt architecture (4-layer)
- Content calendar generation endpoint — "Generate next N days"
- Single post generation — pick a series, get complete content
- Caption + hashtag generation
- Feed Calendar View (6.1) — visual grid with status management
- Database schema: `content_series`, `content_calendar`, `brand_knowledge`
- Content approval workflow: Suggested → Approved → Exported → Posted

### Phase 3: Template Editor + Polish

**Goal:** Full editing experience. Refine the AI. Make the tool feel good to use.

**Deliverables:**
- Template Editor View (6.2) — two-panel edit + preview
- Dynamic form generation from `editable_fields` config
- AI regeneration within editor ("Try another version")
- Custom prompt input
- Brand Settings View (6.3)
- Asset Library View (6.4)
- Batch export + zip download

### Phase 4: Video / Reels (Remotion)

**Goal:** Animated versions of templates. Export as MP4.

**Deliverables:**
- Remotion project setup alongside Next.js app
- Animation compositions for each series
- Animation preset system (slideIn, typeReveal, pinDrop, etc.)
- Reel sequencing — multi-slide compositions
- Server-side render pipeline (Lambda or Modal)
- Video preview in Template Editor
- MP4 export to Supabase Storage

---

## 11. CLAUDE.md Template

The following should be placed at the root of the project repo:

```markdown
# CLAUDE.md — The Marigold Content Studio

## Project Overview
AI-powered Instagram content generator for The Marigold, a South Asian wedding planning brand.
Generates stories, posts, and reels using a codified brand design system + Claude API.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (Postgres + Storage + Auth)
- **AI:** Claude API (Sonnet) via Anthropic SDK
- **Video:** Remotion (Phase 4)
- **Export:** html-to-image for static, Remotion for video
- **Styling:** Tailwind CSS + brand CSS variables

## Architecture Principles
1. Brand config as data, not code — all design tokens, content rules, and AI behavior stored in database
2. Templates are parameterized React components — content in, rendered output out
3. AI is the strategist, human is the editor — AI suggests, user approves/edits/overrides
4. Every generated asset is reproducible — render config is snapshotted at export time

## Code Conventions
- TypeScript strict mode
- Components in `src/components/templates/` (one file per template)
- Shared brand components in `src/components/brand/`
- AI prompt logic in `src/lib/ai/`
- Database queries in `src/lib/db/`
- Supabase types auto-generated

## Brand System (DO NOT DEVIATE)
- 4 fonts only: Instrument Serif, Syne, Space Grotesk, Caveat
- Color palette defined in theme.ts — use CSS variables, never hardcode hex
- Every template must include CTABar with "The Marigold" logo
- Decorative elements (tape, pins) are brand signatures — include them

## File Structure
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Feed Calendar (main dashboard)
│   ├── editor/[id]/        # Template Editor
│   ├── settings/           # Brand Settings
│   └── library/            # Asset Library
├── components/
│   ├── brand/              # CTABar, TapeStrip, PushPin, StickyNote, TemplateFrame
│   ├── templates/          # BridezillaVsMomzilla, Confessional, BrideEnergyQuiz, etc.
│   ├── calendar/           # Feed grid, week view, tile components
│   └── editor/             # Edit form, preview panel, export controls
├── lib/
│   ├── ai/                 # System prompts, generation functions, content strategy
│   ├── db/                 # Supabase queries, types
│   ├── export/             # html-to-image, batch export, zip
│   └── theme.ts            # Design tokens
├── remotion/               # Remotion compositions (Phase 4)
└── supabase/
    ├── migrations/         # SQL schema
    └── seed/               # Brand config, template definitions, knowledge base
```

## Current Phase
Phase 1 — Template Engine

## Key References
- `docs/SPEC.md` — Full project specification
- `src/lib/theme.ts` — Brand design tokens (source of truth)
- `supabase/seed/` — Brand config and template seed data
- Original HTML templates: `docs/marigold-instagram-templates.html`
```

---

## 12. Open Questions / Future Considerations

1. **Instagram API Integration** — Direct posting via Instagram Graph API? Or keep it manual (export + post) for now? Recommend starting manual.
2. **User Submissions Pipeline** — For The Confessional, could add a public submission form (Typeform or custom) that feeds into the content calendar as draft confessions.
3. **A/B Content Testing** — Generate 2 versions of a post, export both, post one, save the other. Track which performs better over time.
4. **Multi-Platform** — Same templates adapted for TikTok (slightly different safe zones), Pinterest (different aspect ratios), or Twitter/X. Template components could accept a `platform` prop.
5. **Audio for Reels** — Remotion supports audio. Could add trending audio track selection or voiceover generation.
6. **Analytics Feedback Loop** — If Instagram insights API is connected, feed post performance data back to the AI to improve future suggestions.
