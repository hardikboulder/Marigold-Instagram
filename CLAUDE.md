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
```
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
