"use client";

import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  AffirmationStory,
  EmotionalRealityPost,
  InLawNavigationPost,
  RelationshipCheckInPost,
  SelfCarePost,
} from "@/components/templates/bride-life";

const SELF_CARE_SAMPLE = {
  title: "5 Things to Do This Week That Aren't Wedding-Related",
  items: [
    { text: "Take a 20-minute walk with no podcast, no playlist.", icon: "walk" as const },
    { text: "Read 10 pages of a book that has nothing to do with weddings.", icon: "book" as const },
    { text: "Run a long bath. Phone on do-not-disturb. Door locked.", icon: "bath" as const },
    { text: "Call the friend you keep meaning to call back.", icon: "call" as const },
    { text: "Sit with a real coffee and notice the light. That's it.", icon: "coffee" as const },
  ],
  bottomNote:
    "the wedding will still be there tomorrow. your sanity might not be.",
};

const RELATIONSHIP_SAMPLE = {
  conversationPrompt:
    "When was the last time we talked about something that wasn't the wedding?",
  activitySuggestion:
    "Make a 30-minute dinner together, no phones, no spreadsheets, no vendor talk.",
  annotation: "marriage > wedding. always.",
};

const EMOTIONAL_SAMPLE = {
  topicTitle: "Post-Wedding Blues Are Real",
  body:
    "After 18 months of planning, the silence on the other side of the wedding can feel like a loss. The texts slow down. The group chat goes quiet. The thing that gave your weekends shape is suddenly over. That dip is real, and it doesn't mean you didn't love your wedding.",
  signoff: "you're not ungrateful. you're human. there's a difference.",
};

const AFFIRMATION_SAMPLE = {
  affirmation:
    "This wedding is yours. Not your mom's. Not Instagram's. Yours.",
  gradientColors: "blush-cream" as const,
};

const IN_LAW_SAMPLE = {
  situation: "When your MIL wants to take over the décor",
  steps: [
    "Acknowledge the love behind the suggestion before responding to it. Most decor takeovers come from wanting to contribute.",
    "Loop your fiance in first. This is a team conversation, not a solo one — and the message lands softer when it comes from her son.",
    "Offer one specific corner she can fully own (the haldi setup, the welcome table) and hold the line on the rest. Calmly.",
  ],
  note: "diplomacy is an art. you're about to become Picasso.",
};

const SLIDES = [
  {
    label: "Self-Care Post",
    format: "post" as const,
    node: <SelfCarePost {...SELF_CARE_SAMPLE} />,
  },
  {
    label: "Couple Check-In Post",
    format: "post" as const,
    node: <RelationshipCheckInPost {...RELATIONSHIP_SAMPLE} />,
  },
  {
    label: "Emotional Reality Post",
    format: "post" as const,
    node: <EmotionalRealityPost {...EMOTIONAL_SAMPLE} />,
  },
  {
    label: "Affirmation Story",
    format: "story" as const,
    node: <AffirmationStory {...AFFIRMATION_SAMPLE} />,
  },
  {
    label: "In-Law Navigation Post",
    format: "post" as const,
    node: <InLawNavigationPost {...IN_LAW_SAMPLE} />,
  },
];

export default function BrideLifeTestPage() {
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
            color: "var(--mauve)",
            marginBottom: 6,
          }}
        >
          BRIDE LIFE
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          The Emotional <i style={{ color: "var(--mauve)" }}>Side</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Self-care, relationship check-ins, emotional reality, affirmations,
          and in-law navigation. Soft palettes, gentle typography.
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
