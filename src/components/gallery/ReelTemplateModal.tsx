"use client";

import { useState } from "react";

interface ReelTemplateModalProps {
  open: boolean;
  templateName: string;
  onClose: () => void;
}

export function ReelTemplateModal({
  open,
  templateName,
  onClose,
}: ReelTemplateModalProps) {
  const [script, setScript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  if (!open) return null;

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "var(--cream)",
          borderRadius: 8,
          boxShadow: "6px 6px 0 var(--wine)",
          border: "2px solid var(--wine)",
          width: "min(540px, 92vw)",
          padding: "36px 32px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "var(--hot-pink)",
                marginBottom: 6,
              }}
            >
              Reel Template
            </div>
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 26,
                color: "var(--wine)",
                lineHeight: 1.2,
              }}
            >
              {templateName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--wine)",
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
              marginTop: -4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Coming Soon Banner */}
        <div
          style={{
            background: "var(--blush)",
            border: "1.5px dashed var(--hot-pink)",
            borderRadius: 6,
            padding: "14px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>🎬</span>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "var(--wine)",
                marginBottom: 4,
              }}
            >
              Video generation coming in Phase 2
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                color: "var(--wine)",
                opacity: 0.75,
                lineHeight: 1.5,
              }}
            >
              Add your script and optional audio now — we&apos;ll use them to render
              the full karaoke reel once video export is live.
            </div>
          </div>
        </div>

        {/* Script Field */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            htmlFor="reel-script"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "var(--wine)",
            }}
          >
            Script / Confession Text
          </label>
          <textarea
            id="reel-script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Type the confession or script that will appear word-by-word in the reel…"
            rows={5}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14,
              color: "var(--wine)",
              background: "white",
              border: "1.5px solid var(--wine)",
              borderRadius: 6,
              padding: "12px 14px",
              resize: "vertical",
              outline: "none",
              lineHeight: 1.6,
            }}
          />
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              color: "var(--wine)",
              opacity: 0.55,
            }}
          >
            The karaoke animation highlights each word in time with the audio.
          </div>
        </div>

        {/* Audio Upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            htmlFor="reel-audio"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "var(--wine)",
            }}
          >
            Audio Track{" "}
            <span
              style={{
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
                fontSize: 11,
                opacity: 0.6,
              }}
            >
              (optional)
            </span>
          </label>
          <label
            htmlFor="reel-audio"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "white",
              border: "1.5px dashed var(--wine)",
              borderRadius: 6,
              padding: "14px 16px",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 20 }}>🎵</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 13,
                  color: "var(--wine)",
                  fontWeight: 600,
                }}
              >
                {audioFile ? audioFile.name : "Choose audio file"}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  color: "var(--wine)",
                  opacity: 0.55,
                  marginTop: 2,
                }}
              >
                MP3, WAV, or M4A · max 25 MB
              </div>
            </div>
            {audioFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setAudioFile(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--wine)",
                  opacity: 0.5,
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            )}
            <input
              id="reel-audio"
              type="file"
              accept="audio/mp3,audio/wav,audio/m4a,audio/mpeg,audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              padding: "10px 18px",
              background: "none",
              color: "var(--wine)",
              border: "1.5px solid var(--wine)",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // Phase 2: save script + audio and queue reel for rendering
              onClose();
            }}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              padding: "10px 20px",
              background: "var(--wine)",
              color: "var(--cream)",
              border: "none",
              borderRadius: 4,
              cursor: script.trim() ? "pointer" : "not-allowed",
              opacity: script.trim() ? 1 : 0.45,
              boxShadow: script.trim() ? "3px 3px 0 var(--hot-pink)" : "none",
            }}
            disabled={!script.trim()}
            title={!script.trim() ? "Add a script to continue" : undefined}
          >
            Save for Phase 2
          </button>
        </div>
      </div>
    </div>
  );
}
