/**
 * word-by-word.ts — Spotify-lyrics style timeline engine.
 *
 * The single source of truth for converting plain text into a per-word
 * playback timeline. Used by every reel template that does text animation
 * (Confessional, Vendor Quote, Diary Entry, and any future variant).
 *
 * The output is a flat `WordTimeline[]`. Renderers can also call
 * `groupTimelineByLine` if they want to paint line-by-line.
 *
 * Pacing rules:
 *   - Base per-word duration is `60_000 / wpm`. Default wpm is 150.
 *   - ALL-CAPS words read at 0.8x pace (so 1.25x the duration) — this is the
 *     "emphasis" feel users expect when they type a word in shouting case.
 *   - Pause after a word, based on its trailing punctuation:
 *       comma                  → +200ms
 *       period / ! / ?         → +400ms
 *       em-dash (—)            → +300ms
 *       ellipsis (… or ...)    → +100ms
 *       semicolon / colon      → +300ms (treated as em-dash-like clause break)
 *   - Lines pack 3–5 words. The packer prefers breaking after sentence
 *     terminals so phrases stay visually intact.
 */

export const DEFAULT_WPM = 150;
export const DEFAULT_SOFT_LINE_CAP = 4;
export const DEFAULT_HARD_LINE_CAP = 5;
/** Minimum words a line must hold before we can wrap on a clause boundary. */
export const DEFAULT_MIN_LINE_WORDS = 3;

export interface WordTimeline {
  /** The word, sans trailing punctuation. */
  word: string;
  /** Trailing punctuation glued to the word ("," "." "—" "" …). */
  trailing: string;
  /** When the word becomes "active", in ms from the start of the timeline. */
  startTime: number;
  /** When the word finishes being "active" (before its tail pause). */
  endTime: number;
  /** Pause held *after* `endTime`, before the next word activates. */
  pauseAfter: number;
  /** Which packed line this word belongs to. */
  lineIndex: number;
  /** Position within `lineIndex` (0-based). */
  wordIndex: number;
  /** Overall position across the whole timeline (0-based). Stable key. */
  globalIndex: number;
  /** True if the source word was written in ALL CAPS (used for emphasis). */
  emphasized: boolean;
}

export interface ParseTimelineOptions {
  /** Words per minute for the base pace. Defaults to {@link DEFAULT_WPM}. */
  wpm?: number;
  /** Empty padding before the first word fires (ms). Default 600ms. */
  leadInMs?: number;
  /** Preferred max words per line. Default 4. */
  softLineCap?: number;
  /** Hard ceiling — packer always wraps once a line hits this. Default 5. */
  hardLineCap?: number;
  /** Floor for line packing — never break before this many words. Default 3. */
  minLineWords?: number;
  /** Multiplier for ALL-CAPS word duration. Default 1.25 (= 0.8x pace). */
  emphasisDurationFactor?: number;
}

const TRAILING_PUNCTUATION_RE = /([,.!?;:—…]|\.{2,})+$/;
const SENTENCE_TERMINALS = new Set([".", "!", "?"]);
const ALL_CAPS_LETTER_RE = /[A-Z]/;

interface RawToken {
  word: string;
  trailing: string;
}

function tokenize(text: string): RawToken[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).map((piece) => {
    const match = piece.match(TRAILING_PUNCTUATION_RE);
    const trailing = match ? match[0] : "";
    const word = trailing ? piece.slice(0, -trailing.length) : piece;
    return { word, trailing };
  });
}

/**
 * Pause to add after a word given its trailing punctuation. The longest
 * applicable pause wins when a token has multiple symbols (e.g. "?!" → 400).
 */
export function pauseForTrailing(trailing: string): number {
  if (!trailing) return 0;
  if (trailing.includes("…") || /\.{2,}/.test(trailing)) return 100;
  let pause = 0;
  for (const ch of trailing) {
    if (SENTENCE_TERMINALS.has(ch)) pause = Math.max(pause, 400);
    else if (ch === "—") pause = Math.max(pause, 300);
    else if (ch === ";" || ch === ":") pause = Math.max(pause, 300);
    else if (ch === ",") pause = Math.max(pause, 200);
  }
  return pause;
}

function isAllCaps(word: string): boolean {
  if (word.length < 2) return false; // single letters like "I" don't count
  if (!ALL_CAPS_LETTER_RE.test(word)) return false;
  return word === word.toUpperCase() && /[A-Z]/.test(word);
}

interface PackOptions {
  softCap: number;
  hardCap: number;
  minWords: number;
}

function packLineIndices(tokens: RawToken[], opts: PackOptions): number[] {
  // Returns one entry per token: which line index it belongs to.
  const lineByToken: number[] = new Array(tokens.length);
  let line = 0;
  let inLine = 0;
  for (let i = 0; i < tokens.length; i++) {
    lineByToken[i] = line;
    inLine++;
    const trailing = tokens[i].trailing;
    const endsSentence = [...trailing].some((c) => SENTENCE_TERMINALS.has(c));
    const endsClause = trailing.length > 0;

    if (i === tokens.length - 1) break;

    if (inLine >= opts.hardCap) {
      line++;
      inLine = 0;
      continue;
    }
    if (inLine >= opts.minWords && (endsSentence || (endsClause && inLine >= opts.softCap))) {
      line++;
      inLine = 0;
      continue;
    }
    if (inLine >= opts.softCap && !endsClause) {
      line++;
      inLine = 0;
    }
  }
  return lineByToken;
}

/**
 * Convert plain text into a per-word timeline. Output words are ordered
 * left-to-right; `lineIndex` / `wordIndex` describe their grid position.
 */
export function parseTextToTimeline(
  text: string,
  wpm: number = DEFAULT_WPM,
  opts: ParseTimelineOptions = {},
): WordTimeline[] {
  const safeWpm = Math.max(40, opts.wpm ?? wpm ?? DEFAULT_WPM);
  const baseDurationMs = Math.max(120, 60_000 / safeWpm);
  const leadIn = opts.leadInMs ?? 600;
  const softCap = opts.softLineCap ?? DEFAULT_SOFT_LINE_CAP;
  const hardCap = opts.hardLineCap ?? DEFAULT_HARD_LINE_CAP;
  const minWords = opts.minLineWords ?? DEFAULT_MIN_LINE_WORDS;
  const emphasisFactor = opts.emphasisDurationFactor ?? 1.25;

  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const lineByToken = packLineIndices(tokens, {
    softCap,
    hardCap,
    minWords: Math.max(1, Math.min(minWords, softCap)),
  });

  const timeline: WordTimeline[] = [];
  let cursor = leadIn;
  let lineWordCounter = 0;
  let prevLine = -1;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const emphasized = isAllCaps(tok.word);
    const duration = emphasized ? baseDurationMs * emphasisFactor : baseDurationMs;
    const pauseAfter = pauseForTrailing(tok.trailing);
    const lineIndex = lineByToken[i];
    if (lineIndex !== prevLine) {
      lineWordCounter = 0;
      prevLine = lineIndex;
    }
    timeline.push({
      word: tok.word,
      trailing: tok.trailing,
      startTime: cursor,
      endTime: cursor + duration,
      pauseAfter,
      lineIndex,
      wordIndex: lineWordCounter,
      globalIndex: i,
      emphasized,
    });
    cursor += duration + pauseAfter;
    lineWordCounter++;
  }

  return timeline;
}

/** Group a timeline by line index. The result preserves left-to-right order. */
export function groupTimelineByLine(timeline: WordTimeline[]): WordTimeline[][] {
  const lines: WordTimeline[][] = [];
  for (const w of timeline) {
    while (lines.length <= w.lineIndex) lines.push([]);
    lines[w.lineIndex].push(w);
  }
  return lines;
}

/**
 * The visual state of a word at a particular moment. Kept identical to the
 * shape used by the existing reels so renderer code can stay simple.
 */
export interface WordVisualState {
  /** 0 = unread, 0–1 ramping = currently reading, 1 = done. */
  progress: number;
  active: boolean;
  past: boolean;
}

export function wordStateAt(word: WordTimeline, nowMs: number): WordVisualState {
  if (nowMs < word.startTime) return { progress: 0, active: false, past: false };
  if (nowMs >= word.endTime) return { progress: 1, active: false, past: true };
  const span = Math.max(1, word.endTime - word.startTime);
  return {
    progress: (nowMs - word.startTime) / span,
    active: true,
    past: false,
  };
}

/** Total duration of the karaoke pass — last word's `endTime`. */
export function timelineDurationMs(timeline: WordTimeline[]): number {
  if (timeline.length === 0) return 0;
  return timeline[timeline.length - 1].endTime;
}

/** Index of the active line at `nowMs`. Holds the last line once finished. */
export function activeLineIndexAt(
  timeline: WordTimeline[],
  nowMs: number,
): number {
  let idx = 0;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].startTime <= nowMs) idx = timeline[i].lineIndex;
    else break;
  }
  return idx;
}
