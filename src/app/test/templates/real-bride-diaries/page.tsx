"use client";

import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  DiaryEntryPost,
  DiaryEntryStory,
  DiaryEntryReelStaticPreview,
} from "@/components/templates/real-bride-diaries";

const POST_SAMPLE = {
  dayOrWeek: "Day 47",
  dateLabel: "APR 14 · 11:42PM",
  diaryText:
    "Third lehenga trial today. The tailor pinned the sleeves wrong and I cried in the changing room over a sleeve. A SLEEVE. Mom held my chai and said nothing, which was somehow exactly right.",
  brideIdentifier: "A., 27, MUMBAI",
  planningStage: "4 months to go",
  marginDoodle: "stressed" as const,
};

const STORY_SAMPLE = {
  dayOrWeek: "Week 18",
  dateLabel: "MAR 02 · 7:08AM",
  diaryText:
    "Walked the venue at sunrise without telling anyone. Stood under the mandap frame for ten minutes. For the first time, this whole thing felt real and not like a spreadsheet.",
  brideIdentifier: "R., 29, BANGALORE",
  planningStage: "6 months to go",
  marginDoodle: "sparkle" as const,
};

const REEL_SAMPLE = {
  dayOrWeek: "Day 12",
  dateLabel: "APR 17 · 1:14AM",
  diaryText:
    "He sent me the muhurat at 4am. Four. A.M. I love him but I am going to be a ghost on my own wedding day. Mom is thrilled. My pandit is thrilled. I am, technically, also thrilled.",
  brideIdentifier: "S., 26, DELHI",
  planningStage: "2 weeks to go",
  marginDoodle: "ring" as const,
};

const SLIDES = [
  {
    label: "Diary Entry — Post",
    format: "post" as const,
    node: <DiaryEntryPost {...POST_SAMPLE} />,
  },
  {
    label: "Diary Entry — Story",
    format: "story" as const,
    node: <DiaryEntryStory {...STORY_SAMPLE} />,
  },
  {
    label: "Diary Entry — Reel (frozen 40%)",
    format: "story" as const,
    node: <DiaryEntryReelStaticPreview {...REEL_SAMPLE} freezeAt={0.4} />,
  },
];

export default function RealBrideDiariesTestPage() {
  return (
    <main style={{ background: "#f0f0f0", padding: 40, minHeight: "100vh" }}>
      <header style={{ marginBottom: 32, maxWidth: 720 }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "var(--pink)",
            marginBottom: 6,
          }}
        >
          REAL BRIDE DIARIES
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          Diary <i style={{ color: "var(--hot-pink)" }}>Entries</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          1080×1080 post, 1080×1920 story, and the karaoke reel (frozen at 40%).
          Lined paper, Caveat handwriting, doodle in the margin.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          overflowX: "auto",
          paddingBottom: 24,
        }}
      >
        {SLIDES.map((slide) => (
          <div key={slide.label}>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "var(--mauve)",
                marginBottom: 8,
              }}
            >
              {slide.label}
            </div>
            <TemplateFrame format={slide.format}>{slide.node}</TemplateFrame>
          </div>
        ))}
      </div>
    </main>
  );
}
