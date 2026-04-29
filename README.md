# The Marigold Content Studio

AI-powered Instagram content generator for **The Marigold**, a South Asian
wedding planning brand. The studio renders stories, posts, and reels from a
codified brand design system using parameterised React templates and Claude.

## What it does

- **Feed Calendar** — week view of every scheduled story / post / reel,
  filterable by series, status, and format. Supports a one-click 3-month seed,
  AI-generated weeks, and per-post AI generation.
- **Template Editor** — two-panel form-and-preview workspace for any single
  calendar item. Auto-saves on every keystroke. Exports a native-resolution
  1080-px PNG and records the asset alongside the content snapshot.
- **Asset Library** — every export with thumbnail, render config, and a one-
  click re-export. Filters by format, series, and date range.
- **Brand Settings** — five tabs (Voice & Tone, Product Knowledge, Content
  Strategy, Design Tokens, Template Library) backed by localStorage overrides.
  Includes JSON export/import for moving data between machines.
- **Template Gallery** — every template rendered with sample copy, ready for
  one-off exports without touching the calendar.

All data lives in your browser's localStorage under the `marigold:` namespace.
There is no backend — the studio is a single Next.js app talking directly to
the Claude API.

## Tech stack

- **Framework** — Next.js 14 (App Router), React 18, TypeScript strict
- **AI** — Claude (Sonnet) via `@anthropic-ai/sdk`
- **Storage** — `window.localStorage`, namespaced to `marigold:*`
- **Export** — `html-to-image` for static PNGs at the template's native
  dimensions
- **Styling** — Tailwind CSS plus brand CSS variables; design tokens defined
  in [`src/lib/theme.ts`](src/lib/theme.ts)
- **Fonts** — Instrument Serif, Syne, Space Grotesk, Caveat (loaded from
  Google Fonts in [`src/app/globals.css`](src/app/globals.css))

## Setup

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.local.example .env.local
# then open .env.local and paste your Claude API key:
#   ANTHROPIC_API_KEY=sk-ant-...
# Generate one at https://console.anthropic.com/settings/keys

# 3. Run
npm run dev
# → http://localhost:3000
```

Other commands:

| Script             | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `npm run dev`      | Start the dev server                              |
| `npm run build`    | Production build                                  |
| `npm run start`    | Run the production build                          |
| `npm run lint`     | ESLint over `src/`                                |
| `npm run type-check` | TypeScript no-emit check                        |

## Seeding the calendar

The repo ships with a curated 3-month plan in
[`docs/content-calendar-3-months.json`](docs/content-calendar-3-months.json).

1. Open the **Feed Calendar** (the home page).
2. Click **Seed Calendar** in the top-right toolbar.
3. Confirm the prompt — this replaces any existing calendar data with the seed
   plan and jumps to the first week.

To clear everything, click **Clear Calendar** (a confirm prompt protects you
from accidents). To start from a single hand-crafted post, click **+ Add Post**
instead.

## Generating content with AI

Three entry points, all backed by `/api/generate` which routes to Claude:

- **Generate Week** on the Feed Calendar — drafts a balanced week based on the
  brand strategy. Review the previews, then accept to drop them into the
  calendar.
- **Regenerate content** in the Template Editor — re-rolls the active calendar
  item. Optional Custom Prompt acts as your Layer-4 override.
- **Regenerate caption** in the Template Editor — regenerates only the caption
  and hashtag set against the existing visual content.

## Exporting and re-using assets

- In the editor, **Export PNG** captures the live preview at 1080-px native
  resolution, downloads the file, and records the asset (with a thumbnail and
  the full render config snapshot) in the Asset Library.
- In the Asset Library, **Re-export** re-renders the original `content_data`
  through the live template — useful when a template changes after export.
- **Copy Caption** pulls the snapshot's caption + hashtags to your clipboard,
  ready to paste into Instagram.

## Backing up and moving data

Everything lives in browser localStorage, which means switching browsers or
clearing site data will lose your work. To move between machines:

1. **Brand Settings → Data Management → Download backup** writes a single JSON
   file containing every `marigold:*` store (calendar, settings overrides,
   asset records and thumbnails).
2. On the new browser, open the same screen and **Choose file…** to import.
   Matching stores are overwritten; everything else is left alone.
3. **Reset overrides** wipes settings and the asset library back to the seeded
   defaults — the calendar is preserved.

The sidebar shows a live storage meter so you can see how close you are to the
~5MB localStorage ceiling. Export a backup before the bar turns gold.

## Keyboard shortcuts (Template Editor)

- `Cmd/Ctrl + S` — force save the current draft
- `Cmd/Ctrl + E` — export PNG
- `Cmd/Ctrl + R` — regenerate content with Claude

## Project layout

See [`CLAUDE.md`](CLAUDE.md) for the full architectural overview. Key paths:

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Feed Calendar
│   ├── editor/[id]/        # Template Editor
│   ├── gallery/            # Template Gallery
│   ├── library/            # Asset Library
│   ├── settings/           # Brand Settings
│   └── api/generate/       # Claude generate route
├── components/
│   ├── app/                # AppShell, ToastProvider, Skeleton
│   ├── brand/              # CTABar, TapeStrip, PushPin, StickyNote, TemplateFrame
│   ├── calendar/           # Feed grid + dialogs
│   ├── editor/             # Edit / preview panels
│   ├── gallery/            # Gallery tiles
│   ├── library/            # Asset library tiles + filters
│   ├── settings/           # Settings tabs + data management
│   └── templates/          # Brand templates (one file per series)
├── lib/
│   ├── ai/                 # System prompts + Claude calls
│   ├── db/                 # localStorage CRUD + storage usage util
│   ├── export/             # html-to-image helpers
│   └── theme.ts            # Design tokens (source of truth)
└── data/                   # Seeded brand config + template definitions
```

## Brand system

The studio is opinionated about the look. Don't deviate without a strong
reason — the consistency is the brand:

- **4 fonts only:** Instrument Serif, Syne, Space Grotesk, Caveat.
- **Colors via CSS variables** (`--wine`, `--pink`, `--cream`, `--gold`, …),
  never hardcoded hex.
- **Every template** ships with a `CTABar` carrying "The Marigold" wordmark.
- **Decorative elements** (tape, pins, sticky notes) are signatures — keep
  them.
