import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  BrideConnectExplainerCarousel,
  BrideConnectReelStaticPreview,
  BrideMatchDuoPost,
  BrideMatchProfilePost,
  BrideMatchStory,
} from "@/components/templates/bride-connect";

const POST_SLIDES = [
  {
    label: "Match Profile Post",
    node: (
      <BrideMatchProfilePost
        brideName="Priya"
        brideAge={27}
        planningCity="Jaipur"
        weddingMonth="DEC"
        weddingYear={2026}
        lookingFor={[
          "Vendor Recs",
          "Lehenga Shopping Buddy",
          "Someone Who Gets It",
          "Sangeet Choreo Partner",
        ]}
        promptQuestion="The thing I'm most stressed about is..."
        promptAnswer="convincing my mom that 200 guests IS a big wedding"
      />
    ),
  },
  {
    label: "Matched Duo Post",
    node: (
      <BrideMatchDuoPost
        brideAName="Priya"
        brideACity="Udaipur"
        brideADate="DEC 12, 2026"
        brideBName="Ananya"
        brideBCity="Udaipur"
        brideBDate="DEC 19, 2026"
        sharedQuote="We're both planning December weddings in Udaipur — now we're sharing vendor lists and sanity."
      />
    ),
  },
  ...[1, 2, 3, 4, 5, 6].map((slideIndex) => ({
    label: `Explainer — Slide ${slideIndex}`,
    node: (
      <BrideConnectExplainerCarousel
        slideIndex={slideIndex}
        coverHeadline="Meet Your Wedding BFF"
        coverSubtitle="The Marigold's bride matching — because your college friends are tired of hearing about centerpieces."
        createProfileBody="Share your city, wedding date, vibe, and what you're looking for. Two minutes, no pressure."
        matchedBody="Matched with brides planning in the same city, same timeframe, or same vibe. You pick who to message."
        connectBody="Chat, share vendor lists, go lehenga shopping together, coordinate if you're using the same venue."
        testimonialQuote="Met my bride match Anika two months in. Now we share a decorator, a photographer, and a 4am panic group chat."
        statsNumber="500+"
        statsLabel="BRIDES MATCHED THIS MONTH"
        closeHeadline="Your wedding planning buddy is waiting"
      />
    ),
  })),
];

const STORY_SLIDES = [
  {
    label: "Match Profile Story",
    node: (
      <BrideMatchStory
        brideName="Priya"
        brideAge={27}
        planningCity="Jaipur"
        weddingMonth="DEC"
        weddingYear={2026}
        lookingFor={[
          "Vendor Recs",
          "Lehenga Shopping Buddy",
          "Someone Who Gets It",
          "Sangeet Choreo Partner",
        ]}
        promptQuestion="The thing I'm most stressed about is..."
        promptAnswer="convincing my mom that 200 guests IS a big wedding"
        extraPrompts={[
          {
            question: "My wedding vibe is...",
            answer: "warm, loud, and slightly chaotic — like my family group chat",
          },
          {
            question: "My biggest win so far is...",
            answer: "negotiated my photographer down 30% on the second call",
          },
        ]}
      />
    ),
  },
  {
    label: "Intro Reel (frozen at 40%)",
    node: (
      <BrideConnectReelStaticPreview
        brideName="Priya"
        planningCity="Jaipur"
        weddingMonth="DEC"
        weddingYear={2026}
        personalNote="someone who gets the chaos of planning a desi wedding — the guest list drama, the vendor hunt, all of it"
        wordsPerMinute={130}
        freezeAt={0.4}
      />
    ),
  },
];

export default function BrideConnectTestPage() {
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
          SERIES 20
        </div>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          Bride <i style={{ color: "var(--pink)" }}>Connect</i>
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
            lineHeight: 1.6,
          }}
        >
          Hinge-style profiles, matched duos, the explainer carousel, and the
          intro reel — all five templates rendered at scaled preview size.
        </p>
      </header>

      <section style={{ marginBottom: 56 }}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "var(--wine)",
            marginBottom: 16,
          }}
        >
          POSTS (1080 × 1080)
        </h2>
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
          {POST_SLIDES.map((s) => (
            <div key={s.label}>
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
                {s.label}
              </div>
              <TemplateFrame format="post">{s.node}</TemplateFrame>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "var(--wine)",
            marginBottom: 16,
          }}
        >
          STORIES & REELS (1080 × 1920)
        </h2>
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
          {STORY_SLIDES.map((s) => (
            <div key={s.label}>
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
                {s.label}
              </div>
              <TemplateFrame format="story">{s.node}</TemplateFrame>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
