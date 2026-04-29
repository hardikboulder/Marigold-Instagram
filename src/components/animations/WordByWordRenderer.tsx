"use client";

/**
 * WordByWordRenderer — pure visual layer for a karaoke timeline.
 *
 * Given a `WordTimeline[]` and the current playhead, this renders the words
 * with three distinct states (past / active / future) and a sweep highlight
 * behind the active word. It owns the scroll-line behaviour so reels that
 * exceed the visible window glide upward smoothly instead of jumping.
 *
 * The component is purely presentational — no RAF, no scrubber. Drive it via
 * `currentTimeMs` from the parent (a real player, a static preview, or a
 * Remotion frame).
 */

import {
  CSSProperties,
  useMemo,
  type ReactNode,
} from "react";

import {
  activeLineIndexAt,
  groupTimelineByLine,
  wordStateAt,
  type WordTimeline,
  type WordVisualState,
} from "@/lib/animations/word-by-word";

export type HighlightStyle = "sweep" | "underline" | "glow" | "none";

export interface WordByWordRendererProps {
  timeline: WordTimeline[];
  currentTimeMs: number;

  /** CSS font-family — e.g. "'Instrument Serif', serif". */
  font: string;
  /** Size in px applied to each word. */
  fontSize: number;

  /** Color for the active (currently being read) word. */
  activeColor: string;
  /** Color for past/future words. Opacity is overlaid by state. */
  dimColor: string;
  /** Highlight color used by sweep / underline / glow behind the active word. */
  highlightColor: string;

  textAlign?: "center" | "left";
  /** Italic display — used by the Confessional / Vendor Quote reels. */
  italic?: boolean;
  /** Visual treatment for the active word's highlight. Default "sweep". */
  highlightStyle?: HighlightStyle;
  /** How tall a single line is, in px. Default = `fontSize * 1.4`. */
  lineHeight?: number;
  /** Number of lines visible inside the masked window. Default 4. */
  visibleLines?: number;
  /** Horizontal gap between words on the same line, in px. Default 18. */
  wordGapPx?: number;
  /** Padding applied left/right on each line, in px. Default 96. */
  linePaddingPx?: number;
  /** Opacity of the past words. Default 0.7. */
  pastOpacity?: number;
  /** Opacity of the future words. Default 0.3. */
  futureOpacity?: number;
  /** Optional container className passthrough (e.g. for outer positioning). */
  className?: string;
  /** Optional outer style override / merge. */
  style?: CSSProperties;
  /**
   * When true, do not render the masked / scrolling stage — just emit a flat
   * column of lines. Useful for templates that want their own framing.
   */
  flat?: boolean;
}

/**
 * Render a karaoke-timed line + per-word treatment. The component is fully
 * deterministic given `(timeline, currentTimeMs)` so it is safe for SSR
 * snapshots and Remotion frame rendering.
 */
export function WordByWordRenderer(props: WordByWordRendererProps): ReactNode {
  const {
    timeline,
    currentTimeMs,
    font,
    fontSize,
    activeColor,
    dimColor,
    highlightColor,
    textAlign = "center",
    italic = false,
    highlightStyle = "sweep",
    lineHeight: lineHeightProp,
    visibleLines = 4,
    wordGapPx = 18,
    linePaddingPx = 96,
    pastOpacity = 0.7,
    futureOpacity = 0.3,
    className,
    style,
    flat = false,
  } = props;

  const lines = useMemo(() => groupTimelineByLine(timeline), [timeline]);
  const lineHeight = lineHeightProp ?? Math.round(fontSize * 1.4);

  const activeLine = useMemo(
    () => activeLineIndexAt(timeline, currentTimeMs),
    [timeline, currentTimeMs],
  );
  // Keep the active line one row down from the top so users see one finished
  // line and ~2 upcoming lines.
  const scrollLine = Math.max(0, activeLine - 1);
  const translateY = -scrollLine * lineHeight;

  const linesNode = (
    <>
      {lines.map((line, li) => (
        <RenderedLine
          key={li}
          line={line}
          currentTimeMs={currentTimeMs}
          font={font}
          fontSize={fontSize}
          activeColor={activeColor}
          dimColor={dimColor}
          highlightColor={highlightColor}
          textAlign={textAlign}
          italic={italic}
          highlightStyle={highlightStyle}
          lineHeight={lineHeight}
          wordGapPx={wordGapPx}
          linePaddingPx={linePaddingPx}
          pastOpacity={pastOpacity}
          futureOpacity={futureOpacity}
        />
      ))}
    </>
  );

  if (flat) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: textAlign === "center" ? "center" : "flex-start",
          ...style,
        }}
      >
        {linesNode}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        height: lineHeight * visibleLines,
        overflow: "hidden",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: lineHeight,
          left: 0,
          right: 0,
          transform: `translateY(${translateY}px)`,
          transition: "transform 480ms cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          alignItems: textAlign === "center" ? "center" : "flex-start",
        }}
      >
        {linesNode}
      </div>
    </div>
  );
}

interface RenderedLineProps {
  line: WordTimeline[];
  currentTimeMs: number;
  font: string;
  fontSize: number;
  activeColor: string;
  dimColor: string;
  highlightColor: string;
  textAlign: "center" | "left";
  italic: boolean;
  highlightStyle: HighlightStyle;
  lineHeight: number;
  wordGapPx: number;
  linePaddingPx: number;
  pastOpacity: number;
  futureOpacity: number;
}

function RenderedLine(props: RenderedLineProps) {
  const {
    line,
    currentTimeMs,
    font,
    fontSize,
    activeColor,
    dimColor,
    highlightColor,
    textAlign,
    italic,
    highlightStyle,
    lineHeight,
    wordGapPx,
    linePaddingPx,
    pastOpacity,
    futureOpacity,
  } = props;

  return (
    <div
      style={{
        height: lineHeight,
        display: "flex",
        flexWrap: "nowrap",
        justifyContent: textAlign === "center" ? "center" : "flex-start",
        alignItems: "center",
        gap: wordGapPx,
        fontFamily: font,
        fontSize,
        lineHeight: 1.1,
        fontStyle: italic ? "italic" : "normal",
        padding: `0 ${linePaddingPx}px`,
        textAlign,
      }}
    >
      {line.map((word) => {
        const state = wordStateAt(word, currentTimeMs);
        return (
          <RenderedWord
            key={word.globalIndex}
            word={word}
            state={state}
            activeColor={activeColor}
            dimColor={dimColor}
            highlightColor={highlightColor}
            highlightStyle={highlightStyle}
            pastOpacity={pastOpacity}
            futureOpacity={futureOpacity}
          />
        );
      })}
    </div>
  );
}

interface RenderedWordProps {
  word: WordTimeline;
  state: WordVisualState;
  activeColor: string;
  dimColor: string;
  highlightColor: string;
  highlightStyle: HighlightStyle;
  pastOpacity: number;
  futureOpacity: number;
}

function RenderedWord(props: RenderedWordProps) {
  const {
    word,
    state,
    activeColor,
    dimColor,
    highlightColor,
    highlightStyle,
    pastOpacity,
    futureOpacity,
  } = props;

  const wordTextStyle = textStyleForState(state, {
    activeColor,
    dimColor,
    highlightColor,
    pastOpacity,
    futureOpacity,
    glow: highlightStyle === "glow" || highlightStyle === "sweep",
  });

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      <HighlightLayer
        state={state}
        highlightColor={highlightColor}
        style={highlightStyle}
      />
      <span style={{ position: "relative", ...wordTextStyle }}>
        {word.word}
        {word.trailing}
      </span>
    </span>
  );
}

interface HighlightLayerProps {
  state: WordVisualState;
  highlightColor: string;
  style: HighlightStyle;
}

function HighlightLayer({ state, highlightColor, style }: HighlightLayerProps) {
  if (style === "none" || style === "glow") return null;

  if (style === "underline") {
    const opacity = state.active ? 0.55 : state.past ? 0.35 : 0;
    const width = state.active
      ? `calc(${state.progress * 100}% + 8px)`
      : state.past
        ? "calc(100% + 8px)"
        : "0%";
    return (
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: -4,
          right: -4,
          bottom: "0.18em",
          height: "0.16em",
          background: highlightColor,
          opacity,
          width,
          borderRadius: 6,
          transition: "opacity 160ms linear, width 80ms linear",
          pointerEvents: "none",
        }}
      />
    );
  }

  // Default: "sweep" — block of color that grows behind the word as it reads.
  const width = state.active
    ? `calc(${state.progress * 100}% + 12px)`
    : "0%";
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: -6,
        right: -6,
        top: "0.12em",
        bottom: "0.18em",
        background: highlightColor,
        opacity: state.active ? 0.32 : 0,
        width,
        borderRadius: 4,
        transition:
          "opacity 120ms linear, width 80ms linear, background 200ms linear",
        pointerEvents: "none",
      }}
    />
  );
}

interface TextStyleOptions {
  activeColor: string;
  dimColor: string;
  highlightColor: string;
  pastOpacity: number;
  futureOpacity: number;
  glow: boolean;
}

function textStyleForState(
  state: WordVisualState,
  opts: TextStyleOptions,
): CSSProperties {
  if (state.active) {
    return {
      color: opts.activeColor,
      opacity: 1,
      textShadow: opts.glow
        ? `0 0 18px ${opts.highlightColor}, 0 0 4px ${opts.highlightColor}`
        : "none",
      transition: "color 80ms linear, text-shadow 80ms linear",
    };
  }
  if (state.past) {
    return {
      color: opts.dimColor,
      opacity: opts.pastOpacity,
      textShadow: "none",
      transition: "opacity 200ms linear",
    };
  }
  return {
    color: opts.dimColor,
    opacity: opts.futureOpacity,
    textShadow: "none",
  };
}
