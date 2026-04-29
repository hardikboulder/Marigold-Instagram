"use client";

import { TemplateFrame } from "@/components/brand/TemplateFrame";
import {
  BeforeAfterReel,
  FactStackReel,
  ListCountdownReel,
  PhotoMontageReel,
  QuoteScrollReel,
  SplitScreenTalkReel,
  TextRevealReel,
} from "@/components/templates/reels";

export default function ReelsTestPage() {
  return (
    <main style={{ background: "#f0f0f0", padding: 32, minHeight: "100vh" }}>
      <header style={{ marginBottom: 32, maxWidth: 800 }}>
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            color: "var(--wine)",
            marginBottom: 8,
          }}
        >
          Universal Reel Library — autoplay preview
        </h1>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: "var(--mauve)",
          }}
        >
          Each tile auto-plays once on mount. Reload to replay.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 320px))",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        <Card label="TextRevealReel">
          <TemplateFrame format="story">
            <TextRevealReel
              lines={[
                "Nobody tells you this",
                "but the week before your wedding",
                "you will question every single decision",
                "and then the baraat music starts",
                "and none of it matters",
              ]}
              ctaText="The Marigold — we'll get you there"
              backgroundGradient="wine-to-blush"
              font="instrument-serif"
              autoPlay
              loop
            />
          </TemplateFrame>
        </Card>

        <Card label="ListCountdownReel">
          <TemplateFrame format="story">
            <ListCountdownReel
              title="Top 5 Vendor Red Flags"
              hookText="you're not ready for #1"
              countdownItems={[
                {
                  number: 5,
                  item: "Won't put pricing in writing",
                  annotation: "run, do not walk",
                },
                {
                  number: 4,
                  item: "Pressures you to sign on the spot",
                  annotation: "real vendors give 48 hours",
                },
                {
                  number: 3,
                  item: "No portfolio of your event type",
                  annotation: "ask for 3 references",
                },
                {
                  number: 2,
                  item: "Vague contract, no cancellation",
                  annotation: "this is the one that bites",
                },
                {
                  number: 1,
                  item: "Bad reviews they refuse to address",
                  annotation: "trust the bride before you",
                },
              ]}
              ctaText="Vet every vendor on The Marigold."
              autoPlay
              loop
            />
          </TemplateFrame>
        </Card>

        <Card label="BeforeAfterReel">
          <TemplateFrame format="story">
            <BeforeAfterReel
              beforeItems={[
                "47 open tabs",
                "3am WhatsApp",
                "lost the vendor's number",
                "where's the guest list?",
                "mom just added 40 people",
              ]}
              afterItems={[
                "one dashboard",
                "all vendors tracked",
                "guest list synced",
                "you slept 8 hours",
                "mom has her own login",
              ]}
              transitionStyle="swipe"
              autoPlay
              loop
            />
          </TemplateFrame>
        </Card>

        <Card label="PhotoMontageReel">
          <TemplateFrame format="story">
            <PhotoMontageReel
              slides={[
                {
                  imageUrl: "",
                  caption: "the moment the mehndi sets in",
                  kenBurnsDirection: "zoom-in",
                },
                {
                  imageUrl: "",
                  caption: "the haldi paste, the giggling",
                  kenBurnsDirection: "pan-left",
                },
                {
                  imageUrl: "",
                  caption: "every flower, every diya",
                  kenBurnsDirection: "zoom-out",
                },
              ]}
              ctaText="Plan yours on The Marigold."
              overlayStyle="bottom-strip"
              autoPlay
              loop
            />
          </TemplateFrame>
        </Card>

        <Card label="FactStackReel">
          <TemplateFrame format="story">
            <FactStackReel
              facts={[
                { statValue: "582", statContext: "tasks tracked across every desi wedding" },
                { statValue: "13", statContext: "phases from engagement to vidaai" },
                { statValue: "47", statContext: "vendor categories — yes, all of them" },
                { statValue: "7", statContext: "events, one timeline" },
                { statValue: "1", statContext: "platform that gets it" },
              ]}
              ctaText="The Marigold — every number, every detail."
              autoPlay
              loop
            />
          </TemplateFrame>
        </Card>

        <Card label="QuoteScrollReel">
          <TemplateFrame format="story">
            <QuoteScrollReel
              headerLabel="VENDOR WISDOM"
              quotes={[
                {
                  text: "Book your photographer before your venue. Trust me.",
                  attribution: "Riya, Mumbai photographer",
                },
                {
                  text: "The decorator is your wedding's love language.",
                  attribution: "Aarti, Delhi planner",
                },
                {
                  text: "Caterers will lie about leftovers. Get it in the contract.",
                  attribution: "Meera, Bangalore caterer",
                },
                {
                  text: "If your makeup artist won't do a trial, walk away.",
                  attribution: "Naina, Pune MUA",
                },
              ]}
              ctaText="Vendors who get it — on The Marigold."
              autoPlay
              loop
            />
          </TemplateFrame>
        </Card>

        <Card label="SplitScreenTalkReel">
          <TemplateFrame format="story">
            <SplitScreenTalkReel
              topic="Guest List Size"
              exchanges={[
                {
                  bride: "Let's keep it intimate. Two hundred people, max.",
                  mom: "We have to invite the whole family. And dad's office.",
                },
                {
                  bride: "Mummy please. Two hundred is already a lot.",
                  mom: "Beta, your dad's brother's wife's sister will be hurt.",
                },
                {
                  bride: "I don't even know who that is.",
                  mom: "Exactly. So we invite her.",
                },
              ]}
              finalTagline="we have a tab for both of you"
              autoPlay
              loop
            />
          </TemplateFrame>
        </Card>
      </div>
    </main>
  );
}

function Card({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 3,
          color: "var(--mauve)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
