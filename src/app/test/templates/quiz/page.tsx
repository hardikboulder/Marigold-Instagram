import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  QuizResult,
  QuizTitle,
} from "@/components/templates/bride-energy-quiz";

const SLIDES = [
  {
    label: "Title Slide",
    node: (
      <QuizTitle
        quizTitle={"What's Your\nBride Energy?"}
        options={[
          'Zen Queen — "beautiful and stress-free"',
          'Type-A Goddess — "I have a Gantt chart"',
          'Creative Visionary — "saving inspo since 2019"',
          'Party Starter — "how\'s the DJ?"',
        ]}
      />
    ),
  },
  {
    label: "Result A — Zen Queen",
    node: (
      <QuizResult
        type="zen"
        resultLabel="Zen Queen"
        resultQuote={
          '"I just want it to be beautiful. The details will work themselves out. They always do."'
        }
        resultDescription="You need: a platform that handles the chaos while you stay calm. Moodboards over spreadsheets. Briefs that write themselves."
      />
    ),
  },
  {
    label: "Result B — Type-A Goddess",
    node: (
      <QuizResult
        type="typeA"
        resultLabel="Type-A Goddess"
        resultQuote={
          '"I have a colour-coded Gantt chart, a backup venue, and a spreadsheet for the spreadsheets."'
        }
        resultDescription="You need: 582 tasks across 13 phases. Filters by status, priority, and due date. A checklist that finally matches your energy."
      />
    ),
  },
  {
    label: "Result C — Creative Visionary",
    node: (
      <QuizResult
        type="creative"
        resultLabel="Creative Visionary"
        resultQuote={
          '"My Pinterest has 12 boards and I know the difference between editorial and documentary photography."'
        }
        resultDescription="You need: moodboards that flow across workspaces. A colour & tone slider. Style keyword chips. The Brief that makes your vendor cry happy tears."
      />
    ),
  },
  {
    label: "Result D — Party Starter",
    node: (
      <QuizResult
        type="party"
        resultLabel="Party Starter"
        resultQuote={
          '"Less planning, more dancing. Is the DJ confirmed? That\'s literally all I need to know."'
        }
        resultDescription="You need: Guest Experience Lab for photo booths and sparkler exits. A sangeet playlist builder. And someone else to handle the rest (hi, that's us)."
      />
    ),
  },
];

export default function QuizTestPage() {
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
          SERIES 03
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          What&apos;s Your{" "}
          <i style={{ color: "var(--hot-pink)" }}>Bride Energy?</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Title slide plus four shareable result cards (Zen Queen, Type-A
          Goddess, Creative Visionary, Party Starter) — sample copy lifted from{" "}
          <code>docs/marigold-instagram-templates.html</code>.
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
              {slide.label} (1080 × 1920)
            </div>
            <TemplateFrame format="story">{slide.node}</TemplateFrame>
          </div>
        ))}
      </div>
    </main>
  );
}
