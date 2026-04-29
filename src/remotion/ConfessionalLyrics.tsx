/**
 * ConfessionalLyrics — Remotion composition (Phase 4).
 *
 * Server-side video render of the karaoke confession. Reuses the same
 * timeline math (`computeConfessionalTimeline`) and the same visual stage
 * (`ReelStage`) as the browser preview, so a frame at `T ms` looks identical
 * in both runtimes.
 *
 * NOTE: This file lives outside the Next.js compile graph (excluded in
 * tsconfig.json) because the `remotion` package is not yet installed. Once
 * Phase 4 lands and `remotion` + `@remotion/cli` are added, register this
 * composition in `src/remotion/Root.tsx` and render with the Remotion CLI.
 *
 * Audio hook: pass `audioSrc` to overlay an ambient track. When omitted the
 * composition renders silent — the karaoke timing is the load-bearing part
 * for now and audio can be layered in later without a re-edit.
 */

import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  parseTextToTimeline,
  timelineDurationMs,
} from "../lib/animations/word-by-word";
import {
  ReelStage,
  type ConfessionalHighlightColor,
} from "../components/templates/confessional/ConfessionalReel";

const PALETTES: Record<
  ConfessionalHighlightColor,
  { highlight: string; halo: string }
> = {
  "hot-pink": { highlight: "var(--hot-pink)", halo: "rgba(237,147,177,0.55)" },
  gold: { highlight: "var(--gold)", halo: "rgba(212,168,83,0.55)" },
  lavender: { highlight: "var(--lavender)", halo: "rgba(224,208,240,0.65)" },
};

const ATTRIBUTION_LEAD_MS = 250;
const CTA_DELAY_MS = 900;
const REMOTION_OUTRO_TAIL_MS = 1500;

export interface ConfessionalLyricsProps {
  confessionNumber: number;
  confessionText: string;
  attribution: string;
  wordsPerMinute?: number;
  highlightColor?: ConfessionalHighlightColor;
  /**
   * Path (relative to Remotion's `public/` dir) of an ambient background
   * track. Optional — leave undefined to render silent.
   */
  audioSrc?: string;
  /** Audio loudness 0..1 (default 0.6). */
  audioVolume?: number;
}

/**
 * Compute how many frames a karaoke pass takes given the wpm and timeline.
 * Use this when registering the Composition in Root.tsx so the duration
 * matches the actual content.
 */
export function getConfessionalDurationInFrames(
  fps: number,
  confessionText: string,
  wordsPerMinute = 150,
): number {
  const timeline = parseTextToTimeline(confessionText, wordsPerMinute);
  const totalMs = timelineDurationMs(timeline);
  const ctaStartMs = totalMs + ATTRIBUTION_LEAD_MS + CTA_DELAY_MS;
  return Math.ceil(((ctaStartMs + REMOTION_OUTRO_TAIL_MS) / 1000) * fps);
}

export function ConfessionalLyrics(props: ConfessionalLyricsProps) {
  const {
    confessionNumber,
    confessionText,
    attribution,
    wordsPerMinute = 150,
    highlightColor = "hot-pink",
    audioSrc,
    audioVolume = 0.6,
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const timeline = parseTextToTimeline(confessionText, wordsPerMinute);
  const totalMs = timelineDurationMs(timeline);
  const attributionStartMs = totalMs + ATTRIBUTION_LEAD_MS;
  const ctaStartMs = attributionStartMs + CTA_DELAY_MS;
  const palette = PALETTES[highlightColor];
  const currentMs = (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        background: "var(--wine, #4B1528)",
        // Inline the brand variables so the composition renders correctly in
        // the Remotion preview server (which doesn't load globals.css).
        // Match marigoldCssVariables in src/lib/theme.ts.
        // Remotion picks these up via CSS custom-property inheritance.
        ["--wine" as string]: "#4B1528",
        ["--cream" as string]: "#FFF8F2",
        ["--hot-pink" as string]: "#ED93B1",
        ["--gold" as string]: "#D4A853",
        ["--gold-light" as string]: "#F5E6C8",
        ["--lavender" as string]: "#E0D0F0",
        ["--pink" as string]: "#D4537E",
        ["--mauve" as string]: "#8A6070",
      }}
    >
      <ReelStage
        timeline={timeline}
        attributionStartMs={attributionStartMs}
        ctaStartMs={ctaStartMs}
        palette={palette}
        currentMs={currentMs}
        confessionNumber={confessionNumber}
        attribution={attribution}
      />
      {audioSrc && (
        <Audio src={staticFile(audioSrc)} volume={audioVolume} />
      )}
    </AbsoluteFill>
  );
}

export default ConfessionalLyrics;
