/**
 * The Marigold — Design Token System
 *
 * Source of truth for brand colors and typography. Every template, component,
 * and stylesheet should reference these tokens (or the CSS variables they map
 * to) rather than hardcoding values.
 *
 * See docs/SPEC.md §1.3 (Visual Identity) and §7.3 (Design Token System).
 */

export const marigoldColors = {
  pink: "#D4537E",
  hotPink: "#ED93B1",
  deepPink: "#993556",
  blush: "#FBEAF0",
  cream: "#FFF8F2",
  wine: "#4B1528",
  mauve: "#8A6070",
  gold: "#D4A853",
  goldLight: "#F5E6C8",
  lavender: "#E0D0F0",
  mint: "#C8EDDA",
  peach: "#FFD8B8",
  sky: "#C8DFF5",
} as const;

/**
 * Content Pillar palette — strategic purpose colors used in filter pills,
 * tile dot indicators, gallery section headers, grid health charts, and
 * weekly summary visualizations.
 */
export const pillarColors = {
  engage: "#ED93B1",
  educate: "#D4A853",
  inspire: "#C4A8D4",
  connect: "#F5D6E0",
  convert: "#D4537E",
} as const;

export const marigoldFonts = {
  display: "'Instrument Serif', serif",
  ui: "'Syne', sans-serif",
  body: "'Space Grotesk', sans-serif",
  handwritten: "'Caveat', cursive",
} as const;

export const marigoldFontWeights = {
  display: { regular: 400 },
  ui: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  body: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 },
  handwritten: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

export const marigoldDimensions = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
  reel: { width: 1080, height: 1920 },
} as const;

export const marigoldTheme = {
  colors: marigoldColors,
  fonts: marigoldFonts,
  fontWeights: marigoldFontWeights,
  dimensions: marigoldDimensions,
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap",
} as const;

/**
 * CSS variable string — drop into a `:root` block (or any selector) so that
 * Tailwind utilities like `bg-pink`, `text-wine`, `font-display`, etc. resolve
 * to the correct brand values via `var(--…)`.
 */
export const marigoldCssVariables = `
  --pink: ${marigoldColors.pink};
  --hot-pink: ${marigoldColors.hotPink};
  --deep-pink: ${marigoldColors.deepPink};
  --blush: ${marigoldColors.blush};
  --cream: ${marigoldColors.cream};
  --wine: ${marigoldColors.wine};
  --mauve: ${marigoldColors.mauve};
  --gold: ${marigoldColors.gold};
  --gold-light: ${marigoldColors.goldLight};
  --lavender: ${marigoldColors.lavender};
  --mint: ${marigoldColors.mint};
  --peach: ${marigoldColors.peach};
  --sky: ${marigoldColors.sky};

  --pillar-engage: ${pillarColors.engage};
  --pillar-educate: ${pillarColors.educate};
  --pillar-inspire: ${pillarColors.inspire};
  --pillar-connect: ${pillarColors.connect};
  --pillar-convert: ${pillarColors.convert};

  --font-display: ${marigoldFonts.display};
  --font-ui: ${marigoldFonts.ui};
  --font-body: ${marigoldFonts.body};
  --font-handwritten: ${marigoldFonts.handwritten};
`.trim();

export type MarigoldColor = keyof typeof marigoldColors;
export type MarigoldFont = keyof typeof marigoldFonts;
export type MarigoldFormat = keyof typeof marigoldDimensions;
export type PillarSlug = keyof typeof pillarColors;
