export {
  DEFAULT_WPM,
  DEFAULT_SOFT_LINE_CAP,
  DEFAULT_HARD_LINE_CAP,
  DEFAULT_MIN_LINE_WORDS,
  parseTextToTimeline,
  groupTimelineByLine,
  pauseForTrailing,
  wordStateAt,
  timelineDurationMs,
  activeLineIndexAt,
  type WordTimeline,
  type WordVisualState,
  type ParseTimelineOptions,
} from "./word-by-word";

export {
  captureReelFrames,
  captureReelFramesAsBlobs,
  framesToGif,
  exportReelAsGif,
  type CaptureReelFramesOptions,
  type CapturedReelFrame,
  type FramesToGifOptions,
  type ExportReelGifOptions,
  type ExportReelGifResult,
} from "./frame-exporter";
