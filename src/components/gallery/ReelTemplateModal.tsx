"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WordToken {
  text: string;
  start: number | null;
  end: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) }
    : { r: 255, g: 180, b: 200 };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Silence-aware chunking removed — whisper-large-v3 transcribes the full
// file in a single Groq call, eliminating chunk-boundary skipped-words
// issues that plagued the chunked approach.

// ---------------------------------------------------------------------------
// Canvas rendering (matches the Marigold dark wine theme)
// ---------------------------------------------------------------------------

function renderKaraokeFrame(
  ctx: CanvasRenderingContext2D,
  time: number,
  words: WordToken[],
  opts: {
    topTitle: string;
    subTitle: string;
    themeBg: string;
    themeTitle: string;
    themeSubtitle: string;
    themeText: string;
    themeHighlight: string;
  }
) {
  const W = 1080;
  const H = 1920;
  const { topTitle, subTitle, themeBg, themeTitle, themeSubtitle, themeText, themeHighlight } = opts;
  const highlightRgb = hexToRgb(themeHighlight);

  // Background
  ctx.fillStyle = themeBg;
  ctx.fillRect(0, 0, W, H);

  // Top title — letter-spaced
  ctx.textAlign = "center";
  ctx.font = `bold 20px "Syne", sans-serif`;
  ctx.fillStyle = themeTitle;
  ctx.letterSpacing = "8px";
  ctx.fillText(topTitle, W / 2, 150);
  ctx.letterSpacing = "0px";

  // Subtitle
  ctx.font = `italic 28px "Instrument Serif", serif`;
  ctx.fillStyle = themeSubtitle;
  ctx.fillText(subTitle, W / 2, 210);

  // Lyrics clipping zone
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 260, W, H - 260);
  ctx.clip();

  ctx.font = `italic 84px "Instrument Serif", serif`;
  const maxWidth = W * 0.85;
  const lineHeight = 148;
  // Active line sits at 35% from top — leaves room above for past lines
  // and fills ~60% of remaining canvas below with future lines
  const ANCHOR_Y = Math.round(H * 0.35);

  // Word-wrap
  const lines: { words: WordToken[]; width: number }[] = [];
  let currentLine: WordToken[] = [];
  let currentW = 0;

  words.forEach((w) => {
    const ww = ctx.measureText(w.text).width;
    const sw = ctx.measureText(" ").width;
    if (currentW + ww > maxWidth && currentLine.length > 0) {
      lines.push({ words: currentLine, width: currentW - sw });
      currentLine = [w];
      currentW = ww + sw;
    } else {
      currentLine.push(w);
      currentW += ww + sw;
    }
  });
  if (currentLine.length > 0) {
    lines.push({ words: currentLine, width: currentW - ctx.measureText(" ").width });
  }

  // Active line — whichever line has a word currently spoken, or the last
  // line whose start time we've already passed
  let activeLineIdx = 0;
  let activeLineStartTime = 0;
  for (let i = 0; i < lines.length; i++) {
    const first = lines[i].words.find((wt) => wt.start !== null);
    const ls = first?.start ?? 0;
    if (time >= ls && ls > 0) {
      activeLineIdx = i;
      activeLineStartTime = ls;
    }
  }

  // Smooth easeOutCubic scroll when line changes
  const timeSince = time - activeLineStartTime;
  let scrollOffset = activeLineIdx;
  if (timeSince < 0.35 && activeLineIdx > 0) {
    const p = timeSince / 0.35;
    const ease = 1 - Math.pow(1 - clamp(p, 0, 1), 3);
    scrollOffset = activeLineIdx - 1 + ease;
  }

  // y of the first line so that active line lands at ANCHOR_Y
  const baseY = ANCHOR_Y - scrollOffset * lineHeight;

  lines.forEach((line, lineIdx) => {
    const lineY = baseY + lineIdx * lineHeight;
    // Skip lines fully above the clipping zone
    if (lineY + lineHeight < 260) return;

    let x = (W - line.width) / 2;
    line.words.forEach((wt) => {
      const ws = wt.start ?? 999999;
      const we = wt.end ?? ws + 0.5;
      const isCurrent = time >= ws && time <= we;
      const tw = ctx.measureText(wt.text).width;

      if (time >= ws) {
        // Words that have been spoken: full opacity
        const elapsed = time - ws;
        let popY = 0;
        let alpha = 1;
        if (elapsed < 0.12) {
          const p = elapsed / 0.12;
          alpha = p;
          popY = 24 * (1 - p);
        }

        ctx.globalAlpha = alpha;

        if (isCurrent) {
          // Interpolate highlight progress across the word's duration.
          // This smooths over sub-100ms timestamp jitter from Whisper —
          // the highlight grows continuously from 0→1 instead of snapping
          // on/off when the playhead crosses ws.
          const wordDur = Math.max(0.08, we - ws); // floor at 80ms to avoid div-by-zero
          const progress = clamp((time - ws) / wordDur, 0, 1);
          // Eased fill: easeOutQuad — fast at start, smooth into the next word
          const ease = 1 - (1 - progress) * (1 - progress);

          // Glow pill behind the word — fade in over the first 30% of the word
          const glowAlpha = clamp(progress * 3, 0, 1);
          ctx.fillStyle = `rgba(${highlightRgb.r},${highlightRgb.g},${highlightRgb.b},${0.12 + 0.10 * ease})`;
          ctx.shadowColor = `rgba(${highlightRgb.r},${highlightRgb.g},${highlightRgb.b},${0.55 * glowAlpha})`;
          ctx.shadowBlur = 20 + 10 * ease;
          ctx.beginPath();
          (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void })
            .roundRect(x - 14, lineY + popY - 96, tw + 28, 118, 14);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Karaoke-style left-to-right colour fill bar that grows with `ease`
          ctx.save();
          ctx.beginPath();
          ctx.rect(x - 14, lineY + popY - 96, (tw + 28) * ease, 118);
          ctx.clip();
          ctx.fillStyle = `rgba(${highlightRgb.r},${highlightRgb.g},${highlightRgb.b},0.28)`;
          ctx.fillRect(x - 14, lineY + popY - 96, tw + 28, 118);
          ctx.restore();
        }

        ctx.fillStyle = themeText;
        ctx.fillText(wt.text, x + tw / 2, lineY + popY);
        ctx.globalAlpha = 1;
      } else {
        // Future words: dim so upcoming text is visible but not distracting
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = themeText;
        ctx.fillText(wt.text, x + tw / 2, lineY);
        ctx.globalAlpha = 1;
      }

      x += tw + ctx.measureText(" ").width;
    });
  });

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepPip({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: active ? "var(--wine)" : done ? "var(--hot-pink)" : "var(--blush)",
        color: active || done ? "var(--cream)" : "var(--wine)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        border: `2px solid ${active ? "var(--wine)" : done ? "var(--hot-pink)" : "var(--blush)"}`,
        transition: "all 0.2s",
      }}
    >
      {done ? "✓" : n}
    </div>
  );
}

function SynButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  small?: boolean;
}) {
  const base: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: small ? 11 : 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    padding: small ? "8px 14px" : "11px 20px",
    border: "none",
    borderRadius: 4,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "opacity 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };
  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "var(--wine)",
          color: "var(--cream)",
          boxShadow: disabled ? "none" : "3px 3px 0 var(--hot-pink)",
        }}
      >
        {children}
      </button>
    );
  }
  if (variant === "secondary") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "var(--hot-pink)",
          color: "var(--cream)",
          boxShadow: disabled ? "none" : "3px 3px 0 var(--wine)",
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        background: "none",
        color: "var(--wine)",
        border: "1.5px solid var(--wine)",
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

interface ReelTemplateModalProps {
  open: boolean;
  templateName: string;
  onClose: () => void;
}

const DEFAULT_OPTS = {
  topTitle: "THE CONFESSIONAL",
  subTitle: "№ 04",
  themeBg: "#3a1824",
  themeTitle: "#a88d98",
  themeSubtitle: "#d296ac",
  themeText: "#ffffff",
  themeHighlight: "#ffb4c8",
};

export function ReelTemplateModal({ open, templateName, onClose }: ReelTemplateModalProps) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [opts, setOpts] = useState(DEFAULT_OPTS);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState("");
  const [transcribeStatus, setTranscribeStatus] = useState(""); // e.g. "Chunk 2/4…"

  // Step 2 state
  const [words, setWords] = useState<WordToken[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncIndex, setSyncIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Step 3 state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const exportAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync words from script text when on step 1
  useEffect(() => {
    if (step !== 1) return;
    const tokens = scriptText.trim().split(/\s+/).filter(Boolean);
    setWords(tokens.map((t) => ({ text: t, start: null, end: null })));
  }, [scriptText, step]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setAudioFile(null);
      setAudioUrl("");
      setScriptText("");
      setWords([]);
      setVideoUrl("");
      setTranscribeError("");
      setTranscribeStatus("");
      setIsExporting(false);
      setExportProgress(0);
      setIsSyncing(false);
      setSyncIndex(0);
    }
  }, [open]);

  // Canvas preview loop (step 3)
  useEffect(() => {
    if (step !== 3 || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    let rafId: number;
    const loop = () => {
      const t = audioRef.current?.currentTime ?? 0;
      renderKaraokeFrame(ctx, t, words, opts);
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, [step, words, opts]);

  // Spacebar handler for manual sync
  const stopSyncing = useCallback(() => {
    setIsSyncing(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code !== "Space" || !isSyncing) return;
      e.preventDefault();
      const t = audioRef.current?.currentTime ?? 0;
      setWords((prev) => {
        const next = [...prev];
        if (syncIndex < next.length) {
          next[syncIndex] = { ...next[syncIndex], start: t };
          if (syncIndex > 0) next[syncIndex - 1] = { ...next[syncIndex - 1], end: t };
        }
        return next;
      });
      setSyncIndex((prev) => {
        const n = prev + 1;
        if (n >= words.length) {
          setWords((wds) => {
            const final = [...wds];
            final[final.length - 1] = { ...final[final.length - 1], end: t + 1 };
            return final;
          });
          setTimeout(stopSyncing, 500);
        }
        return n;
      });
    },
    [isSyncing, syncIndex, words.length, stopSyncing]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Audio file handler
  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setTranscribeError("");
  }

  // Single-shot Groq transcription → NVIDIA correction pass.
  // No chunking — whisper-large-v3 handles the full file in one call,
  // which eliminates all chunk-boundary skipped-words / drift issues.
  // Groq's 25 MB request limit fits ~13 minutes of mono 16kHz audio.
  async function handleAutoTranscribe() {
    if (!audioFile) return;
    setIsTranscribing(true);
    setTranscribeError("");
    setTranscribeStatus("Decoding audio…");

    try {
      // ── 1. Decode audio into PCM via Web Audio API ──────────────────────
      const arrayBuffer = await audioFile.arrayBuffer();
      let decoded: AudioBuffer;
      try {
        decoded = await new Promise<AudioBuffer>((resolve, reject) => {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          ctx.decodeAudioData(arrayBuffer.slice(0), (buf) => { resolve(buf); ctx.close(); }, reject);
        });
      } catch {
        throw new Error("Could not decode audio file. Try MP3 or WAV format.");
      }

      // ── 2. Downsample to mono 16kHz WAV (Whisper's optimal input) ───────
      setTranscribeStatus("Preparing audio…");
      const sampleRate = decoded.sampleRate;
      const totalSamples = decoded.length;

      // Build a mono buffer at native sample rate
      const monoBuf = new AudioBuffer({
        numberOfChannels: 1,
        length: totalSamples,
        sampleRate,
      });
      const monoData = monoBuf.getChannelData(0);
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        const chData = decoded.getChannelData(ch);
        for (let s = 0; s < totalSamples; s++) {
          monoData[s] += chData[s] / decoded.numberOfChannels;
        }
      }

      // Render through OfflineAudioContext at 16kHz to shrink the upload
      const targetLen = Math.ceil(totalSamples * (16000 / sampleRate));
      const offCtx = new OfflineAudioContext(1, targetLen, 16000);
      const src = offCtx.createBufferSource();
      src.buffer = monoBuf;
      src.connect(offCtx.destination);
      src.start();
      const rendered = await offCtx.startRendering();
      const wavBlob = audioBufferToWav(rendered);

      console.log(
        `[Karaoke] Decoded ${decoded.duration.toFixed(2)}s, ` +
        `single-shot upload ${(wavBlob.size / 1024 / 1024).toFixed(2)} MB to Groq whisper-large-v3`
      );

      // ── 3. Single-shot Groq transcription ───────────────────────────────
      setTranscribeStatus("Transcribing with Groq Whisper…");
      const fd = new FormData();
      fd.append("audio", wavBlob, "audio.wav");
      // No offset needed — timestamps are already absolute from sample 0
      fd.append("offsetSec", "0");
      if (scriptText.trim()) fd.append("script", scriptText.trim());

      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Transcription failed.");

      let allWords: WordToken[] = data.words as WordToken[];

      if (allWords.length > 0) {
        const firstW = allWords[0];
        const lastW = allWords[allWords.length - 1];
        console.log(
          `[Karaoke] ${allWords.length} words, ` +
          `first: "${firstW.text}" @ ${firstW.start?.toFixed(2)}s, ` +
          `last: "${lastW.text}" @ ${lastW.end?.toFixed(2)}s, ` +
          `audio: ${decoded.duration.toFixed(2)}s`
        );
      }

      // ── 4. NVIDIA correction pass ───────────────────────────────────────
      setTranscribeStatus("Correcting with NVIDIA…");
      try {
        const corrRes = await fetch("/api/transcribe-correct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words: allWords, script: scriptText.trim() || undefined }),
        });
        const corrData = await corrRes.json();
        if (corrData.ok && corrData.words) allWords = corrData.words;
      } catch {
        // Correction is best-effort — continue with raw Groq output
      }

      // ── 4. Done ─────────────────────────────────────────────────────────
      setWords(allWords);
      setScriptText(allWords.map((w) => w.text).join(" "));
      setStep(3);
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : "Unknown transcription error.");
    } finally {
      setIsTranscribing(false);
      setTranscribeStatus("");
    }
  }

  // Encode an AudioBuffer to a PCM WAV Blob
  function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;
    const samples = buffer.length * numChannels;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = samples * 2;

    const ab = new ArrayBuffer(44 + dataSize);
    const view = new DataView(ab);
    const write = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    write(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    write(36, "data");
    view.setUint32(40, dataSize, true);

    const channelData = Array.from({ length: numChannels }, (_, ch) => buffer.getChannelData(ch));
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, channelData[ch][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  // Manual sync start
  function startSyncing() {
    if (!audioRef.current) return;
    setSyncIndex(0);
    setWords((w) => w.map((t) => ({ ...t, start: null, end: null })));
    setIsSyncing(true);
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }

  // Browser-side video export.
  //
  // Rendering policy:
  //   • Source of truth for AUDIO is the ORIGINAL uploaded file (audioUrl).
  //     The silence-detected chunks are ONLY used for Groq transcription —
  //     never re-encoded into the final video.
  //   • Source of truth for DURATION is the original audio's metadata.
  //     We render frames for exactly that long, no shorter, no longer.
  //   • The render loop is driven by wall-clock time anchored to the audio's
  //     currentTime, NOT by the audio's paused/ended events — those fire
  //     unreliably (transient buffering pauses freeze the canvas mid-render).
  async function handleExport() {
    if (!audioUrl) return;

    // Pause the preview audio so it doesn't double-play
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsExporting(true);
    setExportProgress(0);
    setVideoUrl("");

    // Pre-load audio to discover its true duration before starting the recorder
    const exportAudio = new Audio(audioUrl);
    exportAudio.crossOrigin = "anonymous";
    exportAudioRef.current = exportAudio;

    // Wait for metadata so duration is known and finite
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        if (Number.isFinite(exportAudio.duration) && exportAudio.duration > 0) {
          exportAudio.removeEventListener("loadedmetadata", onLoaded);
          resolve();
        }
      };
      const onErr = () => reject(new Error("Failed to load audio metadata."));
      exportAudio.addEventListener("loadedmetadata", onLoaded);
      exportAudio.addEventListener("error", onErr, { once: true });
      // If metadata is already there
      if (exportAudio.readyState >= 1) onLoaded();
    });

    // HARDCODED render duration — strictly the original audio's length.
    // Never derived from the last word timestamp (which would freeze early).
    const RENDER_DURATION_SEC = exportAudio.duration;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d")!;

    const audioCtx = new AudioContext();
    const src = audioCtx.createMediaElementSource(exportAudio);
    const dest = audioCtx.createMediaStreamDestination();
    // Capture-only: never connect to audioCtx.destination (would double-play
    // through speakers AND can cause trailing-buffer duplication at end).
    src.connect(dest);

    const combined = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const recorder = new MediaRecorder(combined, { mimeType: "video/webm" });
    const recordedChunks: BlobPart[] = [];
    let stopped = false;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    recorder.onstop = () => {
      if (stopped) return; // guard against double-fire
      stopped = true;
      setVideoUrl(URL.createObjectURL(new Blob(recordedChunks, { type: "video/webm" })));
      setIsExporting(false);
      exportAudioRef.current = null;
      audioCtx.close().catch(() => {});
    };

    // Stop helper — disconnects audio graph FIRST, then stops recorder on
    // the next tick. This prevents the trailing audio buffer from being
    // captured into the final segment, which is what caused the loop/duplicate
    // at the end of the WebM.
    const stopAll = () => {
      if (stopped) return;
      try { exportAudio.pause(); } catch {}
      try { src.disconnect(); } catch {}
      // One-tick delay so any in-flight audio packet drains harmlessly
      setTimeout(() => {
        try { if (recorder.state !== "inactive") recorder.stop(); } catch {}
      }, 50);
    };

    recorder.start();
    await exportAudio.play();

    // Wall-clock-driven render loop. We render for EXACTLY RENDER_DURATION_SEC
    // regardless of what the audio element thinks its state is. The audio's
    // currentTime is used only to drive subtitle timing, with a fallback to
    // the wall-clock elapsed time if the element stalls.
    const startWall = performance.now();
    const drawFrame = () => {
      if (stopped) return;
      const wallElapsed = (performance.now() - startWall) / 1000;
      // Prefer audio.currentTime when it's progressing; otherwise fall back
      // to wall-clock so the canvas keeps animating even if audio stalls.
      const t = exportAudio.currentTime > 0 ? exportAudio.currentTime : wallElapsed;
      setExportProgress(Math.min(100, (t / RENDER_DURATION_SEC) * 100));
      renderKaraokeFrame(ctx, t, words, opts);

      if (wallElapsed >= RENDER_DURATION_SEC) {
        stopAll();
        return;
      }
      requestAnimationFrame(drawFrame);
    };
    drawFrame();
  }

  function handleCancelExport() {
    // Pausing the audio causes the wall-clock loop to keep running but the
    // outer stopAll() guard inside handleExport will fire when wall time
    // catches up. For an immediate cancel we just pause + clear UI state;
    // any recorded partial blob is discarded by the user clicking Re-Render.
    if (exportAudioRef.current) {
      try { exportAudioRef.current.pause(); } catch {}
      exportAudioRef.current = null;
    }
    setIsExporting(false);
    setExportProgress(0);
  }

  if (!open) return null;

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const pOpt = (key: keyof typeof opts) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setOpts((o) => ({ ...o, [key]: e.target.value }));

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "var(--cream)",
          borderRadius: 10,
          boxShadow: "6px 6px 0 var(--wine)",
          border: "2px solid var(--wine)",
          width: "min(980px, 96vw)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px 16px",
            borderBottom: "1.5px solid var(--blush)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--hot-pink)", marginBottom: 4 }}>
                Karaoke Reel
              </div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "var(--wine)", lineHeight: 1.1 }}>
                {templateName}
              </div>
            </div>
            {/* Step pips */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
              {[1, 2, 3].map((n) => (
                <StepPip key={n} n={n} active={step === n} done={step > n} />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--wine)", fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: controls */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "var(--wine)" }}>
                  1. Prepare Content
                </div>

                {/* Audio upload */}
                <div>
                  <label style={labelStyle}>🎵 Audio Track (voiceover)</label>
                  <label
                    htmlFor="reel-audio-file"
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: "white", border: "1.5px dashed var(--wine)",
                      borderRadius: 6, padding: "14px 16px", cursor: "pointer",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: "var(--wine)", fontWeight: 600 }}>
                        {audioFile ? audioFile.name : "Choose audio file"}
                      </div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "var(--wine)", opacity: 0.5, marginTop: 2 }}>
                        MP3, WAV, M4A · max 25 MB
                      </div>
                    </div>
                    {audioFile && (
                      <button type="button" onClick={(e) => { e.preventDefault(); setAudioFile(null); setAudioUrl(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--wine)", opacity: 0.5, fontSize: 16 }}>✕</button>
                    )}
                    <input id="reel-audio-file" type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: "none" }} />
                  </label>
                </div>

                {/* Script */}
                <div>
                  <label style={labelStyle}>📝 Script <span style={{ fontWeight: 400, opacity: 0.55, textTransform: "none", letterSpacing: 0 }}>(optional — AI will transcribe if blank)</span></label>
                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    placeholder="Paste your confession script here, or leave blank and let Groq Whisper transcribe it…"
                    rows={4}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: 14,
                      color: "var(--wine)", background: "white",
                      border: "1.5px solid var(--wine)", borderRadius: 6,
                      padding: "12px 14px", resize: "vertical", outline: "none", lineHeight: 1.6,
                    }}
                  />
                </div>

                {/* Template settings */}
                <div style={{ border: "1.5px solid var(--blush)", borderRadius: 6, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setShowSettings((v) => !v)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "var(--blush)", border: "none", cursor: "pointer",
                      fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
                      letterSpacing: 1.6, textTransform: "uppercase", color: "var(--wine)",
                    }}
                  >
                    Template Settings {showSettings ? "▲" : "▼"}
                  </button>
                  {showSettings && (
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={miniLabel}>Top Title</label>
                          <input value={opts.topTitle} onChange={pOpt("topTitle")} style={inputStyle} />
                        </div>
                        <div>
                          <label style={miniLabel}>Subtitle</label>
                          <input value={opts.subTitle} onChange={pOpt("subTitle")} style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={miniLabel}>Colors</label>
                        <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                          {(
                            [
                              ["themeBg", "BG"],
                              ["themeTitle", "Title"],
                              ["themeSubtitle", "Sub"],
                              ["themeText", "Text"],
                              ["themeHighlight", "Glow"],
                            ] as [keyof typeof opts, string][]
                          ).map(([key, lbl]) => (
                            <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <label style={{ ...miniLabel, marginBottom: 0 }}>{lbl}</label>
                              <input type="color" value={opts[key]} onChange={pOpt(key)}
                                style={{ width: 32, height: 32, border: "none", padding: 0, cursor: "pointer", background: "transparent" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {transcribeError && (
                  <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#991b1b" }}>
                    ⚠ {transcribeError}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <SynButton onClick={handleAutoTranscribe} disabled={!audioFile || isTranscribing} variant="secondary">
                    {isTranscribing
                      ? (transcribeStatus || "⏳ Transcribing…")
                      : "✦ Auto-Transcribe & Sync (AI)"}
                  </SynButton>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--blush)" }} />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--wine)", opacity: 0.5 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: "var(--blush)" }} />
                  </div>
                  <SynButton
                    onClick={() => { if (words.length === 0 && scriptText.trim()) { setWords(scriptText.trim().split(/\s+/).filter(Boolean).map((t) => ({ text: t, start: null, end: null }))); } setStep(2); }}
                    disabled={!audioFile || !scriptText.trim()}
                    variant="ghost"
                  >
                    Sync Manually with Spacebar →
                  </SynButton>
                </div>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "var(--wine)" }}>
                  2. Tap-Sync Timestamps
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "var(--wine)", opacity: 0.7, lineHeight: 1.6 }}>
                  Play audio then press <strong>Space</strong> at the start of each highlighted word.
                </div>

                {audioUrl && (
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsSyncing(false)} style={{ display: "none" }} />
                )}

                {/* Word display */}
                <div style={{
                  background: "white", border: "1.5px solid var(--blush)", borderRadius: 6,
                  padding: "16px", maxHeight: 220, overflowY: "auto",
                  fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 18, lineHeight: 2,
                }}>
                  {words.map((w, i) => (
                    <span
                      key={i}
                      style={{
                        marginRight: 8,
                        padding: "2px 4px",
                        borderRadius: 4,
                        background: i === syncIndex && isSyncing ? "var(--hot-pink)" : "transparent",
                        color: i === syncIndex && isSyncing ? "white" : w.start !== null ? "var(--wine)" : "var(--blush)",
                        transition: "background 0.1s",
                      }}
                    >
                      {w.text}
                    </span>
                  ))}
                </div>

                {/* Sync controls */}
                <div style={{ display: "flex", gap: 10 }}>
                  {!isSyncing ? (
                    <SynButton onClick={startSyncing} variant="secondary">▶ Start Sync</SynButton>
                  ) : (
                    <SynButton onClick={stopSyncing} variant="ghost">■ Stop</SynButton>
                  )}
                  <SynButton
                    onClick={() => { setWords((w) => w.map((t) => ({ ...t, start: null, end: null }))); setSyncIndex(0); }}
                    variant="ghost"
                    small
                  >
                    ↺ Reset
                  </SynButton>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--blush)" }}>
                  <SynButton onClick={() => setStep(1)} variant="ghost" small>← Back</SynButton>
                  <SynButton onClick={() => setStep(3)} variant="primary" small>Preview →</SynButton>
                </div>
              </>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "var(--wine)" }}>
                  3. Preview & Export
                </div>

                {audioUrl && (
                  <audio ref={audioRef} src={audioUrl} controls
                    style={{ width: "100%", height: 40, borderRadius: 4 }} />
                )}

                {/* Render button — always visible */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <SynButton
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="secondary"
                  >
                    {isExporting
                      ? `Rendering ${Math.round(exportProgress)}%…`
                      : videoUrl
                        ? "↺ Re-Render Video"
                        : "⬇ Render Video (WebM)"}
                  </SynButton>

                  {/* Progress bar + cancel */}
                  {isExporting && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--blush)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${exportProgress}%`, background: "var(--hot-pink)", transition: "width 0.3s" }} />
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelExport}
                        style={{
                          fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700,
                          letterSpacing: 1.4, textTransform: "uppercase",
                          padding: "5px 10px", background: "none", color: "var(--wine)",
                          border: "1.5px solid var(--wine)", borderRadius: 4, cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  )}

                  {/* Download — always shows latest rendered video */}
                  {videoUrl && !isExporting && (
                    <a
                      key={videoUrl}
                      href={videoUrl}
                      download={`marigold-confessional-reel-${Date.now()}.webm`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
                        letterSpacing: 1.4, textTransform: "uppercase",
                        padding: "11px 20px", background: "var(--wine)", color: "var(--cream)",
                        borderRadius: 4, textDecoration: "none",
                        boxShadow: "3px 3px 0 var(--hot-pink)",
                      }}
                    >
                      ✓ Download Latest WebM
                    </a>
                  )}

                  <div style={{ padding: "10px 14px", background: "var(--blush)", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--wine)", opacity: 0.8, lineHeight: 1.5 }}>
                    🎬 Renders in your browser — no upload needed. Re-render any time after editing template settings.
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-start", paddingTop: 12, borderTop: "1px solid var(--blush)" }}>
                  <SynButton onClick={() => setStep(2)} variant="ghost" small>← Back to Sync</SynButton>
                </div>
              </>
            )}
          </div>

          {/* Right: canvas preview */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              background: "#1a0d10",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 16px",
              gap: 10,
              borderLeft: "1.5px solid var(--wine)",
            }}
          >
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#a88d98" }}>
              Preview
            </div>
            <div style={{ position: "relative", width: 252, aspectRatio: "9/16", borderRadius: 10, overflow: "hidden", border: "3px solid #3a1824" }}>
              <canvas
                ref={canvasRef}
                width={1080}
                height={1920}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {step < 3 && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)",
                  textAlign: "center", padding: 12,
                }}>
                  Preview<br />unlocks in Step 3
                </div>
              )}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: "#a88d98", opacity: 0.6, textAlign: "center", lineHeight: 1.4 }}>
              1080 × 1920 · scaled for preview
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared micro-styles
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: "var(--wine)",
  marginBottom: 8,
};

const miniLabel: React.CSSProperties = {
  display: "block",
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "var(--wine)",
  opacity: 0.65,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
  background: "white",
  border: "1.5px solid var(--blush)",
  borderRadius: 4,
  padding: "8px 10px",
  outline: "none",
};
