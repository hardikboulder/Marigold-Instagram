"use client";

/**
 * DiaryReelTemplateModal — same end-to-end flow as ReelTemplateModal
 * (Groq Whisper → NVIDIA correction → preview → WebM export) but renders
 * the "Real Bride Diaries" diary-paper visual instead of the dark-wine
 * Confessional theme.
 *
 * The transcription / correction / export pipeline is intentionally the
 * same so improvements to one carry to the other. Only the canvas drawing
 * function differs.
 */

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

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ---------------------------------------------------------------------------
// Diary canvas — matches the Real Bride Diaries reference image exactly
// ---------------------------------------------------------------------------
//
// Layout:
//   • Cream paper (#FFFDF8) with horizontal lined ruling
//   • Header at ~140px: "REAL BRIDE DIARIES" pink letter-spaced + Day label
//     + date stamp + horizontal hairline divider
//   • Margin doodle: small ring symbol on the right edge ~520px down
//   • Handwritten text (Caveat-like) starting ~720px down, sitting ON the
//     ruling lines. Active word gets a soft pink highlight pill.
//   • Future words appear in a faded mauve so the reader sees what's coming.

interface DiaryOpts {
  topTitle: string;       // e.g. "REAL BRIDE DIARIES"
  dayLabel: string;       // e.g. "Day 12"
  dateLabel: string;      // e.g. "APR 17 · 1:14AM"
}

const PAPER_BG = "#FFFDF8";
const LINE_COLOR = "rgba(212,83,126,0.18)";
const PINK = "#d4537e";
const WINE = "#4b1528";
const MAUVE = "#8a6070";
const HIGHLIGHT_BG = "rgba(244,193,210,0.55)"; // soft pink pill
const HIGHLIGHT_GLOW = "rgba(212,83,126,0.4)";

function renderDiaryFrame(
  ctx: CanvasRenderingContext2D,
  time: number,
  words: WordToken[],
  opts: DiaryOpts,
) {
  const W = 1080;
  const H = 1920;

  // Paper background
  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(0, 0, W, H);

  // Horizontal ruling lines every 120px (matches the static reel)
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1.5;
  for (let y = 360; y < H; y += 120) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // ── Header ──
  // "REAL BRIDE DIARIES" — pink, letter-spaced, uppercase
  ctx.textAlign = "left";
  ctx.font = `800 28px "Syne", sans-serif`;
  ctx.fillStyle = PINK;
  ctx.letterSpacing = "8px";
  ctx.fillText(opts.topTitle, 96, 168);
  ctx.letterSpacing = "0px";

  // Day label — wine, italic serif
  ctx.font = `italic 96px "Instrument Serif", serif`;
  ctx.fillStyle = WINE;
  ctx.fillText(opts.dayLabel, 96, 280);

  // Date label — mauve, uppercase, right-aligned
  ctx.textAlign = "right";
  ctx.font = `500 22px "Space Grotesk", sans-serif`;
  ctx.fillStyle = MAUVE;
  ctx.letterSpacing = "2px";
  ctx.fillText(opts.dateLabel.toUpperCase(), W - 96, 280);
  ctx.letterSpacing = "0px";

  // Hairline divider under header
  ctx.strokeStyle = "rgba(75,21,40,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, 320);
  ctx.lineTo(W - 96, 320);
  ctx.stroke();

  // Margin doodle — small ring near right edge at ~520px down
  drawMarginRing(ctx, W - 180, 540, 46);

  // ── Handwritten diary text — TELEPROMPTER scroll ──
  // Lines rise from the bottom of the page and scroll smoothly upward.
  // Past lines fade out at the top, the active line sits ~45% from top,
  // and future lines preview below in a faded mauve.
  // No karaoke fill bars or word pills — just a soft pink underline on the
  // currently-spoken word so the reader knows where they are without the
  // bouncy sing-along treatment.
  ctx.textAlign = "left";
  ctx.font = `500 78px "Caveat", cursive`;

  const maxWidth = W * 0.78;
  const lineHeight = 134;
  const ANCHOR_Y = Math.round(H * 0.45);
  const TOP_FADE_Y = 380;       // header bottom + small gap
  const BOTTOM_FADE_Y = H - 80;

  // Word-wrap into lines
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

  // Active line: whichever line contains the currently spoken word, or the
  // last line whose start time we've already passed
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

  // Smooth easeOutCubic upward scroll when line changes
  const timeSince = time - activeLineStartTime;
  let scrollOffset = activeLineIdx;
  if (timeSince < 0.5 && activeLineIdx > 0) {
    const p = timeSince / 0.5;
    const ease = 1 - Math.pow(1 - clamp(p, 0, 1), 3);
    scrollOffset = activeLineIdx - 1 + ease;
  }

  const baseY = ANCHOR_Y - scrollOffset * lineHeight;

  // Clip below the header so scrolling text never overlaps the title block
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 360, W, H - 360);
  ctx.clip();

  lines.forEach((line, lineIdx) => {
    const lineY = baseY + lineIdx * lineHeight;
    // Skip lines fully off-screen on either side
    if (lineY + lineHeight < TOP_FADE_Y - 60 || lineY > H + 60) return;

    // Vertical fade — lines near the top edge fade out as they scroll off,
    // lines near the bottom edge fade in as they scroll in
    let lineAlpha = 1;
    if (lineY < TOP_FADE_Y + 100) {
      lineAlpha = clamp((lineY - TOP_FADE_Y) / 100, 0, 1);
    } else if (lineY > BOTTOM_FADE_Y - 200) {
      lineAlpha = clamp((BOTTOM_FADE_Y - lineY) / 200, 0, 1);
    }

    // Decide line state for colour: past = wine, current = wine, future = mauve dim
    const lineFirstStart = line.words.find((wt) => wt.start !== null)?.start ?? null;
    const lineLastEnd = [...line.words].reverse().find((wt) => wt.end !== null)?.end ?? null;
    const isFutureLine = lineFirstStart !== null && time < lineFirstStart;
    const isPastLine = lineLastEnd !== null && time > lineLastEnd;

    // Center this line horizontally
    const startX = (W - line.width) / 2;
    let x = startX;

    line.words.forEach((wt) => {
      const ws = wt.start ?? 999999;
      const we = wt.end ?? ws + 0.5;
      const isCurrent = time >= ws && time <= we;
      const tw = ctx.measureText(wt.text).width;

      // Colour by state — wine for spoken/current, mauve for upcoming
      let color: string;
      let alpha = lineAlpha;
      if (isFutureLine) {
        color = MAUVE;
        alpha *= 0.45;
      } else if (isPastLine) {
        color = WINE;
        alpha *= 0.55;            // gently dim past lines
      } else {
        // Active line — words before playhead get full wine, after get mauve
        if (time >= ws) {
          color = WINE;
        } else {
          color = MAUVE;
          alpha *= 0.55;
        }
      }

      ctx.globalAlpha = alpha;

      // Subtle underline on the currently-spoken word so the reader can
      // track position without a bouncy karaoke pill
      if (isCurrent) {
        const wordDur = Math.max(0.08, we - ws);
        const progress = clamp((time - ws) / wordDur, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha * (0.5 + 0.5 * progress);
        ctx.fillStyle = HIGHLIGHT_BG;
        ctx.fillRect(x - 4, lineY + 14, tw + 8, 18);
        ctx.restore();
      }

      ctx.fillStyle = color;
      ctx.fillText(wt.text, x, lineY);
      ctx.globalAlpha = 1;

      x += tw + ctx.measureText(" ").width;
    });
  });

  ctx.restore();
}

// Small ring doodle (matches the diary template margin marker)
function drawMarginRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.save();
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 4;
  // Ring band
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Diamond stone
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r - 18);
  ctx.lineTo(cx - 14, cy - r);
  ctx.lineTo(cx + 14, cy - r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Shared sub-components (reused look from ReelTemplateModal)
// ---------------------------------------------------------------------------

function StepPip({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      style={{
        width: 28, height: 28, borderRadius: "50%",
        background: active ? "var(--wine)" : done ? "var(--hot-pink)" : "var(--blush)",
        color: active || done ? "var(--cream)" : "var(--wine)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
        border: `2px solid ${active ? "var(--wine)" : done ? "var(--hot-pink)" : "var(--blush)"}`,
        transition: "all 0.2s",
      }}
    >
      {done ? "✓" : n}
    </div>
  );
}

function SynButton({
  children, onClick, disabled, variant = "primary", small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  small?: boolean;
}) {
  const base: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif", fontWeight: 700,
    fontSize: small ? 11 : 12, letterSpacing: 1.6, textTransform: "uppercase",
    padding: small ? "8px 14px" : "11px 20px",
    border: "none", borderRadius: 4,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1, transition: "opacity 0.15s",
    display: "flex", alignItems: "center", gap: 6,
  };
  if (variant === "primary") {
    return <button type="button" onClick={onClick} disabled={disabled}
      style={{ ...base, background: "var(--wine)", color: "var(--cream)",
        boxShadow: disabled ? "none" : "3px 3px 0 var(--hot-pink)" }}>{children}</button>;
  }
  if (variant === "secondary") {
    return <button type="button" onClick={onClick} disabled={disabled}
      style={{ ...base, background: "var(--hot-pink)", color: "var(--cream)",
        boxShadow: disabled ? "none" : "3px 3px 0 var(--wine)" }}>{children}</button>;
  }
  return <button type="button" onClick={onClick} disabled={disabled}
    style={{ ...base, background: "none", color: "var(--wine)", border: "1.5px solid var(--wine)" }}>{children}</button>;
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

interface DiaryReelTemplateModalProps {
  open: boolean;
  templateName: string;
  onClose: () => void;
}

const DEFAULT_OPTS: DiaryOpts = {
  topTitle: "REAL BRIDE DIARIES",
  dayLabel: "Day 12",
  dateLabel: "APR 17 · 1:14AM",
};

export function DiaryReelTemplateModal({
  open, templateName, onClose,
}: DiaryReelTemplateModalProps) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [opts, setOpts] = useState<DiaryOpts>(DEFAULT_OPTS);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState("");
  const [transcribeStatus, setTranscribeStatus] = useState("");

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

  useEffect(() => {
    if (step !== 1) return;
    const tokens = scriptText.trim().split(/\s+/).filter(Boolean);
    setWords(tokens.map((t) => ({ text: t, start: null, end: null })));
  }, [scriptText, step]);

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

  useEffect(() => {
    if (step !== 3 || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    let rafId: number;
    const loop = () => {
      const t = audioRef.current?.currentTime ?? 0;
      renderDiaryFrame(ctx, t, words, opts);
      rafId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafId);
  }, [step, words, opts]);

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
    [isSyncing, syncIndex, words.length, stopSyncing],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setTranscribeError("");
  }

  // Single-shot Groq transcription → NVIDIA correction (same as ReelTemplateModal)
  async function handleAutoTranscribe() {
    if (!audioFile) return;
    setIsTranscribing(true);
    setTranscribeError("");
    setTranscribeStatus("Decoding audio…");

    try {
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

      setTranscribeStatus("Preparing audio…");
      const sampleRate = decoded.sampleRate;
      const totalSamples = decoded.length;

      const monoBuf = new AudioBuffer({ numberOfChannels: 1, length: totalSamples, sampleRate });
      const monoData = monoBuf.getChannelData(0);
      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        const chData = decoded.getChannelData(ch);
        for (let s = 0; s < totalSamples; s++) {
          monoData[s] += chData[s] / decoded.numberOfChannels;
        }
      }

      const targetLen = Math.ceil(totalSamples * (16000 / sampleRate));
      const offCtx = new OfflineAudioContext(1, targetLen, 16000);
      const src = offCtx.createBufferSource();
      src.buffer = monoBuf;
      src.connect(offCtx.destination);
      src.start();
      const rendered = await offCtx.startRendering();
      const wavBlob = audioBufferToWav(rendered);

      setTranscribeStatus("Transcribing with Groq Whisper…");
      const fd = new FormData();
      fd.append("audio", wavBlob, "audio.wav");
      fd.append("offsetSec", "0");
      if (scriptText.trim()) fd.append("script", scriptText.trim());

      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Transcription failed.");

      let allWords: WordToken[] = data.words as WordToken[];

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
        // Best-effort
      }

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

  function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
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
    view.setUint16(20, 1, true);
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

  function startSyncing() {
    if (!audioRef.current) return;
    setSyncIndex(0);
    setWords((w) => w.map((t) => ({ ...t, start: null, end: null })));
    setIsSyncing(true);
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  }

  async function handleExport() {
    if (!audioUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsExporting(true);
    setExportProgress(0);
    setVideoUrl("");

    const exportAudio = new Audio(audioUrl);
    exportAudio.crossOrigin = "anonymous";
    exportAudioRef.current = exportAudio;

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
      if (exportAudio.readyState >= 1) onLoaded();
    });

    const RENDER_DURATION_SEC = exportAudio.duration;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d")!;

    const audioCtx = new AudioContext();
    const src = audioCtx.createMediaElementSource(exportAudio);
    const dest = audioCtx.createMediaStreamDestination();
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
      if (stopped) return;
      stopped = true;
      setVideoUrl(URL.createObjectURL(new Blob(recordedChunks, { type: "video/webm" })));
      setIsExporting(false);
      exportAudioRef.current = null;
      audioCtx.close().catch(() => {});
    };

    const stopAll = () => {
      if (stopped) return;
      try { exportAudio.pause(); } catch {}
      try { src.disconnect(); } catch {}
      setTimeout(() => {
        try { if (recorder.state !== "inactive") recorder.stop(); } catch {}
      }, 50);
    };

    recorder.start();
    await exportAudio.play();

    const startWall = performance.now();
    const drawFrame = () => {
      if (stopped) return;
      const wallElapsed = (performance.now() - startWall) / 1000;
      const t = exportAudio.currentTime > 0 ? exportAudio.currentTime : wallElapsed;
      setExportProgress(Math.min(100, (t / RENDER_DURATION_SEC) * 100));
      renderDiaryFrame(ctx, t, words, opts);

      if (wallElapsed >= RENDER_DURATION_SEC) {
        stopAll();
        return;
      }
      requestAnimationFrame(drawFrame);
    };
    drawFrame();
  }

  function handleCancelExport() {
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

  const pOpt = (key: keyof DiaryOpts) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setOpts((o) => ({ ...o, [key]: e.target.value }));

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{
        background: "var(--cream)", borderRadius: 10, boxShadow: "6px 6px 0 var(--wine)",
        border: "2px solid var(--wine)", width: "min(980px, 96vw)", maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 28px 16px", borderBottom: "1.5px solid var(--blush)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: 2, textTransform: "uppercase", color: "var(--hot-pink)", marginBottom: 4,
              }}>
                Diary Reel
              </div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "var(--wine)", lineHeight: 1.1 }}>
                {templateName}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
              {[1, 2, 3].map((n) => (
                <StepPip key={n} n={n} active={step === n} done={step > n} />
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--wine)", fontSize: 20, lineHeight: 1, padding: 4 }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: controls */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
            {step === 1 && (
              <>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "var(--wine)" }}>
                  1. Prepare Content
                </div>

                <div>
                  <label style={labelStyle}>🎵 Audio Track (voiceover)</label>
                  <label htmlFor="diary-audio-file" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "white", border: "1.5px dashed var(--wine)",
                    borderRadius: 6, padding: "14px 16px", cursor: "pointer",
                  }}>
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
                    <input id="diary-audio-file" type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: "none" }} />
                  </label>
                </div>

                <div>
                  <label style={labelStyle}>📝 Diary Text <span style={{ fontWeight: 400, opacity: 0.55, textTransform: "none", letterSpacing: 0 }}>(optional — AI will transcribe)</span></label>
                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    placeholder="Paste your diary entry here, or leave blank and let Groq Whisper transcribe it…"
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

                <div style={{ border: "1.5px solid var(--blush)", borderRadius: 6, overflow: "hidden" }}>
                  <button type="button" onClick={() => setShowSettings((v) => !v)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "var(--blush)", border: "none", cursor: "pointer",
                      fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
                      letterSpacing: 1.6, textTransform: "uppercase", color: "var(--wine)",
                    }}>
                    Diary Header {showSettings ? "▲" : "▼"}
                  </button>
                  {showSettings && (
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={miniLabel}>Top Title</label>
                        <input value={opts.topTitle} onChange={pOpt("topTitle")} style={inputStyle} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={miniLabel}>Day Label</label>
                          <input value={opts.dayLabel} onChange={pOpt("dayLabel")} style={inputStyle} />
                        </div>
                        <div>
                          <label style={miniLabel}>Date Stamp</label>
                          <input value={opts.dateLabel} onChange={pOpt("dateLabel")} style={inputStyle} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {transcribeError && (
                  <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: "#991b1b" }}>
                    ⚠ {transcribeError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <SynButton onClick={handleAutoTranscribe} disabled={!audioFile || isTranscribing} variant="secondary">
                    {isTranscribing ? (transcribeStatus || "⏳ Transcribing…") : "✦ Auto-Transcribe & Sync (AI)"}
                  </SynButton>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--blush)" }} />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--wine)", opacity: 0.5 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: "var(--blush)" }} />
                  </div>
                  <SynButton
                    onClick={() => { if (words.length === 0 && scriptText.trim()) { setWords(scriptText.trim().split(/\s+/).filter(Boolean).map((t) => ({ text: t, start: null, end: null }))); } setStep(2); }}
                    disabled={!audioFile || !scriptText.trim()}
                    variant="ghost">
                    Sync Manually with Spacebar →
                  </SynButton>
                </div>
              </>
            )}

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

                <div style={{
                  background: "white", border: "1.5px solid var(--blush)", borderRadius: 6,
                  padding: "16px", maxHeight: 220, overflowY: "auto",
                  fontFamily: "'Caveat', cursive", fontSize: 22, lineHeight: 1.6,
                }}>
                  {words.map((w, i) => (
                    <span key={i} style={{
                      marginRight: 8, padding: "2px 4px", borderRadius: 4,
                      background: i === syncIndex && isSyncing ? "var(--hot-pink)" : "transparent",
                      color: i === syncIndex && isSyncing ? "white" : w.start !== null ? "var(--wine)" : "var(--blush)",
                      transition: "background 0.1s",
                    }}>
                      {w.text}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  {!isSyncing
                    ? <SynButton onClick={startSyncing} variant="secondary">▶ Start Sync</SynButton>
                    : <SynButton onClick={stopSyncing} variant="ghost">■ Stop</SynButton>}
                  <SynButton
                    onClick={() => { setWords((w) => w.map((t) => ({ ...t, start: null, end: null }))); setSyncIndex(0); }}
                    variant="ghost" small>
                    ↺ Reset
                  </SynButton>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--blush)" }}>
                  <SynButton onClick={() => setStep(1)} variant="ghost" small>← Back</SynButton>
                  <SynButton onClick={() => setStep(3)} variant="primary" small>Preview →</SynButton>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: "var(--wine)" }}>
                  3. Preview & Export
                </div>

                {audioUrl && (
                  <audio ref={audioRef} src={audioUrl} controls
                    style={{ width: "100%", height: 40, borderRadius: 4 }} />
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <SynButton onClick={handleExport} disabled={isExporting} variant="secondary">
                    {isExporting
                      ? `Rendering ${Math.round(exportProgress)}%…`
                      : videoUrl ? "↺ Re-Render Video" : "⬇ Render Video (WebM)"}
                  </SynButton>

                  {isExporting && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--blush)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${exportProgress}%`, background: "var(--hot-pink)", transition: "width 0.3s" }} />
                      </div>
                      <button type="button" onClick={handleCancelExport}
                        style={{
                          fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700,
                          letterSpacing: 1.4, textTransform: "uppercase",
                          padding: "5px 10px", background: "none", color: "var(--wine)",
                          border: "1.5px solid var(--wine)", borderRadius: 4, cursor: "pointer",
                          flexShrink: 0,
                        }}>
                        ✕ Cancel
                      </button>
                    </div>
                  )}

                  {videoUrl && !isExporting && (
                    <a key={videoUrl} href={videoUrl} download={`marigold-diary-reel-${Date.now()}.webm`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
                        letterSpacing: 1.4, textTransform: "uppercase",
                        padding: "11px 20px", background: "var(--wine)", color: "var(--cream)",
                        borderRadius: 4, textDecoration: "none",
                        boxShadow: "3px 3px 0 var(--hot-pink)",
                      }}>
                      ✓ Download Latest WebM
                    </a>
                  )}

                  <div style={{ padding: "10px 14px", background: "var(--blush)", borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: "var(--wine)", opacity: 0.8, lineHeight: 1.5 }}>
                    🎬 Renders in your browser — no upload needed. Re-render any time after editing the diary header.
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-start", paddingTop: 12, borderTop: "1px solid var(--blush)" }}>
                  <SynButton onClick={() => setStep(2)} variant="ghost" small>← Back to Sync</SynButton>
                </div>
              </>
            )}
          </div>

          {/* Right: canvas preview (light paper background to match diary) */}
          <div style={{
            width: 320, flexShrink: 0,
            background: "#f5ede4",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "20px 16px", gap: 10,
            borderLeft: "1.5px solid var(--wine)",
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--wine)" }}>
              Preview
            </div>
            <div style={{ position: "relative", width: 252, aspectRatio: "9/16", borderRadius: 10, overflow: "hidden", border: "3px solid var(--wine)" }}>
              <canvas ref={canvasRef} width={1080} height={1920}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {step < 3 && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(75,21,40,0.65)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.6)",
                  textAlign: "center", padding: 12,
                }}>
                  Preview<br />unlocks in Step 3
                </div>
              )}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: "var(--wine)", opacity: 0.55, textAlign: "center", lineHeight: 1.4 }}>
              1080 × 1920 · scaled for preview
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700,
  letterSpacing: 1.6, textTransform: "uppercase", color: "var(--wine)", marginBottom: 8,
};

const miniLabel: React.CSSProperties = {
  display: "block", fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700,
  letterSpacing: 1.4, textTransform: "uppercase", color: "var(--wine)",
  opacity: 0.65, marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  fontFamily: "'Space Grotesk', sans-serif", fontSize: 13,
  color: "var(--wine)", background: "white",
  border: "1.5px solid var(--blush)", borderRadius: 4,
  padding: "8px 10px", outline: "none",
};
