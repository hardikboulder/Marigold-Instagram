/**
 * Confessional Reel — word-level timing.
 *
 * Splits a confession into karaoke-style word tokens, then assigns each word a
 * start/end time on a single timeline. The same logic is consumed by the
 * browser preview (`ConfessionalReel`) and by the Remotion composition
 * (`ConfessionalLyrics`) so the visual timing stays identical between them.
 *
 * Pacing rules:
 *   - Base per-word duration is `60_000 / wordsPerMinute`.
 *   - Trailing comma adds +200ms.
 *   - Trailing period / ? / ! adds +400ms.
 *   - Other terminal punctuation (; : —) adds +300ms.
 *
 * Lines are filled greedily with a soft cap (default 4 words) and a hard cap
 * (default 5). The packer prefers breaking after a word whose trailing
 * punctuation is a sentence boundary, so phrases stay visually intact.
 */
import type { CSSProperties } from "react";

export const DEFAULT_WORDS_PER_MINUTE = 150;
export const SOFT_LINE_CAP = 4;
export const HARD_LINE_CAP = 5;

export type ConfessionalHighlightColor = "hot-pink" | "gold" | "lavender";

export interface HighlightPalette {
  /** Glow / sweep color behind the current word. */
  highlight: string;
  /** Soft outer halo color, used for box-shadow. */
  halo: string;
}

export const HIGHLIGHT_PALETTES: Record<
  ConfessionalHighlightColor,
  HighlightPalette
> = {
  "hot-pink": { highlight: "var(--hot-pink)", halo: "rgba(237,147,177,0.55)" },
  gold: { highlight: "var(--gold)", halo: "rgba(212,168,83,0.55)" },
  lavender: { highlight: "var(--lavender)", halo: "rgba(224,208,240,0.65)" },
};

export interface WordToken {
  /** Display text without the trailing punctuation. */
  word: string;
  /** Trailing punctuation glued to the word ("," ".", "!", "—", "" …). */
  trailing: string;
  /** Index into the source text — useful for stable keys. */
  index: number;
}

export interface TimedWord extends WordToken {
  startMs: number;
  /** Duration the word stays "highlighted". */
  durationMs: number;
  /** Extra dwell time after `start + duration` before the next word starts. */
  pauseAfterMs: number;
  lineIndex: number;
}

export interface ConfessionalTimeline {
  words: TimedWord[];
  lines: TimedWord[][];
  /** Total duration of the karaoke pass — last word's endMs. */
  totalMs: number;
  /** When the attribution should fade in (slightly after the last word). */
  attributionStartMs: number;
  /** When the CTA bar fades in (after the attribution). */
  ctaStartMs: number;
}

const TRAILING_PUNCTUATION_RE = /([,.!?;:—…])+$/;
const SENTENCE_TERMINALS = new Set([".", "!", "?"]);
const CLAUSE_TERMINALS = new Set([",", ";", ":", "—", "…"]);

function pauseForTrailing(trailing: string): number {
  if (!trailing) return 0;
  let pause = 0;
  for (const ch of trailing) {
    if (SENTENCE_TERMINALS.has(ch)) pause = Math.max(pause, 400);
    else if (ch === ",") pause = Math.max(pause, 200);
    else if (CLAUSE_TERMINALS.has(ch)) pause = Math.max(pause, 300);
  }
  return pause;
}

export function tokenizeConfession(text: string): WordToken[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const raw = trimmed.split(/\s+/);
  return raw.map((piece, index) => {
    const match = piece.match(TRAILING_PUNCTUATION_RE);
    const trailing = match ? match[0] : "";
    const word = trailing ? piece.slice(0, -trailing.length) : piece;
    return { word, trailing, index };
  });
}

interface PackOptions {
  softCap?: number;
  hardCap?: number;
}

export function packIntoLines(
  tokens: WordToken[],
  opts: PackOptions = {},
): WordToken[][] {
  const softCap = opts.softCap ?? SOFT_LINE_CAP;
  const hardCap = opts.hardCap ?? HARD_LINE_CAP;
  const lines: WordToken[][] = [];
  let buffer: WordToken[] = [];

  function flush() {
    if (buffer.length) {
      lines.push(buffer);
      buffer = [];
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    buffer.push(tok);
    const endsSentence =
      tok.trailing && [...tok.trailing].some((c) => SENTENCE_TERMINALS.has(c));
    const endsClause =
      tok.trailing && [...tok.trailing].some((c) => CLAUSE_TERMINALS.has(c));

    if (buffer.length >= hardCap) {
      flush();
      continue;
    }
    if (buffer.length >= softCap && (endsSentence || endsClause)) {
      flush();
      continue;
    }
    if (endsSentence && buffer.length >= 2) {
      flush();
      continue;
    }
  }
  flush();
  return lines;
}

export interface ComputeTimelineOptions {
  wordsPerMinute?: number;
  /** Empty padding before the first word fires (ms). */
  leadInMs?: number;
  /** Pause between attribution fade-in and the CTA fade-in. */
  ctaDelayMs?: number;
}

export function computeConfessionalTimeline(
  text: string,
  opts: ComputeTimelineOptions = {},
): ConfessionalTimeline {
  const wpm = opts.wordsPerMinute ?? DEFAULT_WORDS_PER_MINUTE;
  const leadIn = opts.leadInMs ?? 600;
  const ctaDelay = opts.ctaDelayMs ?? 900;
  const baseMs = Math.max(120, 60_000 / Math.max(40, wpm));

  const tokens = tokenizeConfession(text);
  const lines = packIntoLines(tokens);
  const lineIndexByToken = new Map<number, number>();
  lines.forEach((line, li) => {
    line.forEach((tok) => lineIndexByToken.set(tok.index, li));
  });

  const timed: TimedWord[] = [];
  let cursor = leadIn;
  for (const tok of tokens) {
    const pauseAfter = pauseForTrailing(tok.trailing);
    const word: TimedWord = {
      ...tok,
      startMs: cursor,
      durationMs: baseMs,
      pauseAfterMs: pauseAfter,
      lineIndex: lineIndexByToken.get(tok.index) ?? 0,
    };
    timed.push(word);
    cursor += baseMs + pauseAfter;
  }

  const totalMs = timed.length
    ? timed[timed.length - 1].startMs + timed[timed.length - 1].durationMs
    : leadIn;
  const attributionStartMs = totalMs + 250;
  const ctaStartMs = attributionStartMs + ctaDelay;

  const groupedLines: TimedWord[][] = lines.map((line) =>
    line.map((tok) => timed[tok.index]),
  );

  return {
    words: timed,
    lines: groupedLines,
    totalMs,
    attributionStartMs,
    ctaStartMs,
  };
}

export interface WordVisualState {
  /** 0 = unread (dim), 0–1 ramping = currently being read, 1 = done. */
  progress: number;
  /** Whether this word is the active highlight target right now. */
  active: boolean;
  /** Whether the word is fully past — used for the "already-read" tone. */
  past: boolean;
}

export function wordVisualStateAt(word: TimedWord, nowMs: number): WordVisualState {
  if (nowMs < word.startMs) return { progress: 0, active: false, past: false };
  const end = word.startMs + word.durationMs;
  if (nowMs >= end) return { progress: 1, active: false, past: true };
  return {
    progress: (nowMs - word.startMs) / word.durationMs,
    active: true,
    past: false,
  };
}

/** Visual styling for a word given its current state and palette. */
export function wordStyleForState(
  state: WordVisualState,
  palette: HighlightPalette,
): CSSProperties {
  if (state.active) {
    return {
      color: "var(--cream)",
      opacity: 1,
      textShadow: `0 0 18px ${palette.halo}, 0 0 4px ${palette.halo}`,
      transition: "color 80ms linear, text-shadow 80ms linear",
    };
  }
  if (state.past) {
    return {
      color: "var(--cream)",
      opacity: 0.7,
      textShadow: "none",
      transition: "opacity 200ms linear",
    };
  }
  return {
    color: "var(--cream)",
    opacity: 0.3,
    textShadow: "none",
  };
}
