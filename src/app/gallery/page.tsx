"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { GalleryItem } from "@/components/gallery/GalleryItem";
import { CarouselCard, type CarouselSlide } from "@/components/gallery/CarouselCard";
import { SeriesNavSidebar, type SeriesNavEntry } from "@/components/gallery/SeriesNavSidebar";
import { CreateTemplateConcept } from "@/components/gallery/CreateTemplateConcept";
import { UseTemplateModal } from "@/components/gallery/UseTemplateModal";
import { loadTemplateDefinitions } from "@/lib/db/data-loader";
import type { TemplateFormat } from "@/components/brand/TemplateFrame";
import {
  BvMPost,
  BvMStory,
} from "@/components/templates/bridezilla-vs-momzilla";
import {
  ConfessionalCard,
  ConfessionalCTA,
  ConfessionalReelStaticPreview,
  ConfessionalTitle,
} from "@/components/templates/confessional";
import {
  QuizResult,
  QuizResultPost,
  QuizResultV2,
  QuizTitle,
  QuizTitleV2,
} from "@/components/templates/bride-energy-quiz";
import {
  AskTheMarigoldStory,
  FeatureCallout,
  StatCallout,
  VendorQuote,
} from "@/components/templates/general";
import {
  ThisOrThatPost,
  ThisOrThatStory,
} from "@/components/templates/this-or-that";
import {
  CountdownCarousel,
  CountdownPost,
  CountdownStory,
} from "@/components/templates/countdown";
import {
  ColorPalettePost,
  LehengaStylePost,
  MoodBoardPost,
  MoodBoardStory,
} from "@/components/templates/mood-board";
import {
  VendorFeaturePost,
  VendorQuoteReelStaticPreview,
  VendorTipCarousel,
} from "@/components/templates/vendor-spotlight";
import {
  DreamVenueReelStaticPreview,
  VenueComparisonPost,
  VenueFeaturePost,
  VenueStyleGuide,
} from "@/components/templates/venue-spotlight";
import {
  DayOfVsFullPlanningPost,
  PlannerAdvicePost,
  PlannerProfilePost,
  PlannerTipsCarousel,
} from "@/components/templates/planner-spotlight";
import {
  ApprovalMatrixPost,
  HotTakeCarousel,
  HotTakePost,
  HotTakeStory,
} from "@/components/templates/hot-takes";
import {
  DiaryEntryPost,
  DiaryEntryReelStaticPreview,
  DiaryEntryStory,
} from "@/components/templates/real-bride-diaries";
import {
  BrideFindsReelStaticPreview,
  ProductPickPost,
  TopPicksCarousel,
  TrendingNowPost,
} from "@/components/templates/marigold-edit";
import {
  BudgetPiePost,
  BudgetRealityPost,
  BudgetTipsCarousel,
  CostByCityPost,
  RealNumbersPost,
  SaveVsSplurgePost,
  WeddingMathReelStaticPreview,
} from "@/components/templates/budget-breakdown";
import {
  CeremonyGuidePost,
  ChecklistStory,
  DidYouKnowPost,
  DosAndDontsPost,
  EventBreakdownCarousel,
  GuestManagementPost,
  RedFlagsPost,
  TimelineBuilderPost,
  VendorNegotiationPost,
} from "@/components/templates/planning-101";
import {
  BeforeAfterPost,
  FeatureDropPost,
  HowItWorksCarousel,
  MarigoldVsOldWayPost,
  PlatformStatStory,
  TestimonialPost,
  type HowItWorksStep,
} from "@/components/templates/marigold-platform";
import {
  AffirmationStory,
  EmotionalRealityPost,
  InLawNavigationPost,
  RelationshipCheckInPost,
  SelfCarePost,
} from "@/components/templates/bride-life";
import {
  FamilyRolesPost,
  FusionWeddingPost,
  RegionalSpotlightCarousel,
  TraditionExplainedPost,
} from "@/components/templates/culture-corner";
import {
  BrideOfTheWeekPost,
  MilestonePost,
  PollResultsPost,
  SubmissionCTAStory,
  UserStoryReelStaticPreview,
} from "@/components/templates/community";
import {
  BrideConnectExplainerCarousel,
  BrideConnectReelStaticPreview,
  BrideMatchDuoPost,
  BrideMatchProfilePost,
  BrideMatchStory,
} from "@/components/templates/bride-connect";
import {
  BeforeAfterReelStaticPreview,
  FactStackReelStaticPreview,
  ListCountdownReelStaticPreview,
  PhotoMontageReelStaticPreview,
  QuoteScrollReelStaticPreview,
  SplitScreenTalkReelStaticPreview,
  TextRevealReelStaticPreview,
} from "@/components/templates/reels";
import {
  FestivalInspoPost,
  MonthlyRoundupStory,
  SeasonalTrendPost,
  WeddingSeasonPrepCarousel,
} from "@/components/templates/in-season";

interface SeriesItem {
  format: TemplateFormat;
  filename: string;
  label: string;
  node: ReactNode;
  templateSlug?: string;
}

interface Series {
  number: string;
  title: ReactNode;
  description: string;
  items: SeriesItem[];
}

const COUNTDOWN_DEMO_MILESTONES = [
  {
    number: 12,
    unit: "months" as const,
    tasks: [
      "Sign the venue contract",
      "Set the budget (and a hidden buffer)",
      "Pick the wedding date with the pandit",
      "Start the vendor shortlist",
    ],
  },
  {
    number: 9,
    unit: "months" as const,
    tasks: [
      "Book photographer & decorator",
      "Send save-the-dates",
      "Order the bride's lehenga",
      "Open hotel blocks for guests",
    ],
  },
  {
    number: 6,
    unit: "months" as const,
    tasks: [
      "Finalize invites and send them",
      "Lock the muhurat with the pandit",
      "Book makeup, mehendi, and choreographer",
      "Plan welcome bags and itineraries",
    ],
  },
  {
    number: 3,
    unit: "months" as const,
    tasks: [
      "Final guest list & seating chart",
      "Menu tasting and final sign-off",
      "Confirm all vendor arrival times",
      "Bridesmaid outfits ordered",
    ],
  },
  {
    number: 1,
    unit: "months" as const,
    tasks: [
      "Final dress fitting",
      "Print signage, menus, and place cards",
      "Pay vendor balances",
      "Walk through every event with the planner",
    ],
  },
  {
    number: 1,
    unit: "weeks" as const,
    tasks: [
      "Pack the emergency kit",
      "Confirm every vendor by phone",
      "Hand off final payments to a trusted person",
      "Sleep. Hydrate. Repeat.",
    ],
  },
];

const HOT_TAKES_DEMO = [
  "The baraat horse is overrated.",
  "Nobody remembers what the centerpieces looked like.",
  "Spending more on food and less on decor is always the right call.",
  "If your lehenga doesn't have pockets, what's the point.",
  "The sangeet is more important than the ceremony. I said what I said.",
];

const CULTURE_REGIONAL_DEMO_SLIDES = [
  {
    title: "Roka, Sangeet, Phere — back to back to back",
    content:
      "A Punjabi wedding stretches across at least four events: Roka, Sangeet, Mehendi, and the wedding day itself with Anand Karaj or pheras. Expect a baraat with a horse, dhol players, and a procession that takes its time.",
  },
  {
    title: "Lehengas, paranda, and a sherwani for him",
    content:
      "Brides typically wear a heavily embroidered red or pink lehenga with kundan jewelry, a kaleera tied to the wrist, and a paranda braided into the hair. The groom wears a sherwani with a sehra or safa turban.",
  },
  {
    title: "Sarson da saag, butter chicken, and the chaat counter",
    content:
      "Punjabi weddings live and die by the food. The buffet is non-negotiable: tandoori spreads, paneer in three forms, kulfi falooda, and a live chaat counter that runs all night. Dessert is jalebi with rabri, always.",
  },
  {
    title: "Dhol, bhangra, and the DJ that knows every Diljit drop",
    content:
      "Live dhol players lead the baraat. The sangeet is choreographed by the cousins. Expect bhangra, gidda, and a DJ who can flip from old-school Daler Mehndi to Diljit without losing the dance floor for a single beat.",
  },
  {
    title: "Kaleere, joota chupai, and the chura ceremony",
    content:
      "The chura ceremony — red and white bangles slipped on by the bride's mama — is signature Punjabi. Joota chupai (stealing the groom's shoes) is a friendly ransom war. And kaleere are dropped on cousins to bless the next bride.",
  },
];

const VENUE_STYLE_DEMO_SLIDES = [
  {
    title: "THE VIBE",
    body:
      "Open lawns, dappled sunlight, and the soft sound of a tabla drifting from somewhere behind the hedges. The garden wedding is a long, slow afternoon you'll wish lasted longer.",
    annotation: "yes, your hair will move",
  },
  {
    title: "BEST MONTHS",
    body:
      "October through February. Avoid the monsoon — petrichor is romantic until it's a soaked mandap. March can work in higher altitudes, but heatstroke is not a vibe.",
    annotation: "the weather is the planner",
  },
  {
    title: "WATCH OUT FOR",
    body:
      "Mosquitoes at dusk, sound permits in residential pockets, and the wind picking up after sunset. Plan for citronella, a backup mic, and a wrap for grandma.",
    annotation: "bug spray is a love language",
  },
  {
    title: "BUDGET RANGE",
    body:
      "Entry tier ₹15-30L (boutique gardens, ~150 guests), mid ₹40-70L (heritage estates, ~300 guests), top ₹1Cr+ (private grounds, full takeover). Florals run higher — the venue is the canvas.",
    annotation: "florals are the line item",
  },
];

const VENDOR_TIPS_DEMO = [
  {
    headline: "Book Your Trial 3 Months Out",
    detail:
      "Wedding photographers are booked solid 4-6 months before peak season. Lock the trial first, then negotiate the package.",
    annotation: "trust us on this one",
  },
  {
    headline: "Send a Shot List, Not a Pinterest Board",
    detail:
      "A 200-pin Pinterest board is a vibe, not a brief. Pick 12 photos that capture moments you want — your photographer will do the rest.",
    annotation: "twelve > two hundred",
  },
  {
    headline: "Don't Skip the Recce",
    detail:
      "A venue scout an hour before sunset tells your photographer where the light falls. Skip it, and you're shooting blind during the muhurat.",
    annotation: "one hour can save the album",
  },
  {
    headline: "Feed Your Vendors",
    detail:
      "A 14-hour shoot day on no food shows up in the photos. Plan a vendor meal and a 20-minute break — your album will thank you.",
    annotation: "we are not robots",
  },
];

const PLANNER_TIPS_DEMO = [
  {
    headline: "Lock the Venue First",
    detail:
      "Every other vendor — caterer, decorator, photographer — quotes you based on the venue. Lock it 9-12 months out and the rest of the planning gets 40% easier.",
    annotation: "this is the keystone",
  },
  {
    headline: "Build a 13-Phase Timeline",
    detail:
      "Every desi wedding has the same 13 phases — engagement, save-the-date, vendors, outfits, mehendi, sangeet, ceremony, reception, after. Map them to dates early so nothing slips.",
    annotation: "we have a template",
  },
  {
    headline: "Brief Vendors in Writing",
    detail:
      "WhatsApp voice notes are not a brief. Send every vendor a one-page brief — names, timings, family preferences, must-haves, hard nos. The day-of runs on this document.",
    annotation: "writing > talking",
  },
  {
    headline: "Pad Every Buffer by 30%",
    detail:
      "Mehendi will run long. Baraat will start late. The pandit will arrive when the muhurat says, not when you say. Add a 30% buffer to every transition and you'll stay on time.",
    annotation: "math beats optimism",
  },
  {
    headline: "Hire a Day-Of Coordinator",
    detail:
      "Even if you plan everything yourself, hire someone for the day-of. You should not be the one taking calls about missing chairs while you're in your bridal lehenga.",
    annotation: "future-you will thank you",
  },
];

const EDIT_TOP_PICKS_DEMO = [
  {
    productName: "Hand-painted ceramic favors",
    category: "favor-idea" as const,
    price: "₹220 each",
    oneLiner: "guests will actually keep these",
  },
  {
    productName: "Magnetic-clasp pearl choker",
    category: "bridal-jewelry" as const,
    price: "₹4,200",
    oneLiner: "no fumbling during the pheras",
  },
  {
    productName: "Pre-strung mogra garlands",
    category: "decor-find" as const,
    price: "₹180 / metre",
    oneLiner: "the mehendi artist can skip the prep",
  },
  {
    productName: "Hand-calligraphed escort cards",
    category: "stationery" as const,
    price: "₹85 each",
    oneLiner: "the small detail your guests will notice",
  },
  {
    productName: "Long-wear setting spray",
    category: "beauty-find" as const,
    price: "₹1,400",
    oneLiner: "lasts through three function changes",
  },
];

const BUDGET_TIPS_DEMO = [
  {
    title: "Book In The Off-Season",
    detail:
      "May–September is monsoon-shoulder pricing. Same venue, 25-40% off. Same vendors, more attention.",
  },
  {
    title: "Cap Your Guest List Early",
    detail:
      "Every 50 guests is roughly ₹2-3 lakh in catering, decor, and welcome kits. The list, not the lehenga, is the budget lever.",
  },
  {
    title: "Negotiate Decor In Sets",
    detail:
      "Lock the same decorator for sangeet + ceremony + reception. Bundled bookings save 10-15% vs. event-by-event quotes.",
  },
  {
    title: "Rent The Mandap, Not The Trends",
    detail:
      "Custom-built mandaps cost 3x rentals and you'll never use them again. Rent the structure, splurge on the florals.",
  },
  {
    title: "Skip The Save-The-Date Print",
    detail:
      "Digital STDs land in the WhatsApp group in 2 minutes. Save the print budget for the actual invite suite.",
  },
  {
    title: "Cocktail Hour, Not Open Bar",
    detail:
      "Premium liquor for the first hour, switch to house pours after. Nobody is judging the second drink — they're dancing.",
  },
  {
    title: "Rent The Outfits You'll Wear Once",
    detail:
      "The reception gown? Rent. The mehendi outfit? Rent. The wedding lehenga is the only one most brides actually re-wear.",
  },
  {
    title: "Pick A Weekday Muhurat",
    detail:
      "Mid-week dates can drop venue cost by 30%. Talk to your pandit — auspicious slots exist on Tuesdays too.",
  },
  {
    title: "Build A 12% Buffer",
    detail:
      "Plan to spend 88% of your stated budget on line items. The other 12% is for the surprises that always come.",
  },
  {
    title: "Ask For An Itemized Quote",
    detail:
      "Every vendor. Every line. 'Package pricing' hides the markup. Itemized quotes give you the room to negotiate cleanly.",
  },
];

const PLANNING_GUEST_TIPS_DEMO = [
  {
    headline: "Cap before date",
    detail:
      "Decide the maximum number of guests before you sign the venue. Venues quote based on capacity. The cap is the budget.",
    aside: "yes, this includes your dad's office",
  },
  {
    headline: "Tier the list (A, B, C)",
    detail:
      "A: must-haves. B: would-be-nice. C: only if A or B drop. Send invites in waves so the C list never knows they were the C list.",
    aside: "ruthless. necessary.",
  },
  {
    headline: "Plus-one rules upfront",
    detail:
      "Both sides agree before invites go out. Married/engaged only? Established partners only? Apply consistently or prepare for the WhatsApp wars.",
    aside: "no exceptions for cousins' new gym friends",
  },
  {
    headline: "One shared RSVP sheet",
    detail:
      "Names, dietary needs, plus-ones, RSVP status, side. Both families edit it. The caterer pulls counts from it. End of debate.",
    aside: "the spreadsheet is the source of truth",
  },
];

const PLANNING_RED_FLAGS_DEMO = [
  {
    flag: "Won't put it in writing",
    explanation:
      "If they won't email a quote, they won't honor it on the day.",
  },
  {
    flag: "Vague portfolio",
    explanation:
      "Two photos and 'trust me' is not a portfolio. Ask for a full event gallery.",
  },
  {
    flag: "Pressure to book today",
    explanation: "Real demand doesn't need a fake clock. Sleep on it.",
  },
  {
    flag: "No backup plan",
    explanation:
      "Ask what happens if they're sick. If there's no answer, walk.",
  },
  {
    flag: "Cash-only deposits",
    explanation:
      "Paper trail or no trail at all. Cash deposits leave you with no recourse.",
  },
];

const PLANNING_TIMELINE_DEMO = [
  { time: "6:00 AM", activity: "Hair & makeup begins", note: "earlier than you think" },
  { time: "11:00 AM", activity: "Bride into outfit; first-look photos" },
  { time: "3:00 PM", activity: "Baraat arrives at venue", note: "yes, it will be late. plan accordingly." },
  { time: "4:30 PM", activity: "Pheras (the actual ceremony)", note: "phone the pandit at 4:00 to triple-confirm" },
  { time: "7:00 PM", activity: "Reception cocktails & dinner", note: "eat. you haven't all day." },
  { time: "10:00 PM", activity: "First dance & dance floor opens" },
  { time: "12:00 AM", activity: "Vidaai & send-off", note: "tissues in every direction" },
];

const PLANNING_NEGOTIATION_TIPS_DEMO = [
  {
    headline: "Lead with the package",
    detail:
      "Don't ask for the price. Ask what's included in the standard package, then negotiate items in or out. The price reveals itself.",
    aside: "scope first, money second",
  },
  {
    headline: "Bundle the events",
    detail:
      "Mehndi + Sangeet + Wedding + Reception is four events to one vendor. The per-event rate drops 20-30% when bundled.",
    aside: "you have leverage. use it.",
  },
  {
    headline: "Get three quotes",
    detail:
      "Three written quotes for the same scope. Share the lowest with the others — politely. Real vendors will match or explain why.",
    aside: "competition does the talking",
  },
  {
    headline: "Lock the deliverables",
    detail:
      "Get every deliverable on paper — counts, formats, deadlines. 'Edited photos' isn't a deliverable. '500 edited photos in 6 weeks' is.",
    aside: "specifics save weddings",
  },
];

const PLANNING_EVENT_BREAKDOWN_DEMO = {
  vibeText:
    "A warm, music-filled afternoon where the bride's hands and feet are decorated in intricate mehndi while the women in her family eat, gossip, and slow-dance their way through the day.",
  checklist: [
    "Book the mehndi artist (3+ months out)",
    "Finalize the guest list (women + close family)",
    "Decor: low seating, fairy lights, marigold garlands",
    "Music: dhol player or curated Bollywood playlist",
    "Food: chaat counter, mocktails, light bites",
    "Favors: glass bangles, kajal, mehndi oil",
    "Outfit: yellow/green, comfortable seating-friendly",
    "Photo/video: at least one dedicated mehndi shooter",
  ],
  budgetTotal: "₹2 - ₹6 lakh, depending on guest count",
  budgetLines: [
    { label: "Mehndi artist (bride + guests)", range: "₹40K - ₹2L" },
    { label: "Decor & florals", range: "₹60K - ₹2.5L" },
    { label: "Catering", range: "₹50K - ₹1.5L" },
    { label: "Photo / video", range: "₹30K - ₹1L" },
    { label: "Music & favors", range: "₹20K - ₹50K" },
  ],
  timeline: [
    { time: "11:00 AM", activity: "Bride's mehndi begins (intricate, full design)" },
    { time: "1:00 PM", activity: "Guests arrive; lunch served" },
    { time: "2:30 PM", activity: "Guest mehndi stations open" },
    { time: "4:00 PM", activity: "Dhol player + dancing" },
    { time: "6:00 PM", activity: "Wrap; bride's mehndi finishing touches" },
  ],
  mistakes: [
    "Booking the artist too late — top artists are out 6+ months",
    "Underestimating bride's mehndi time (2-3 hours minimum)",
    "Not having stations for guests — line gets out of control",
    "Forgetting the cocoa butter / oil for stain depth",
    "Scheduling photos right after — wet mehndi smudges everything",
  ],
  marigoldFeatures: [
    "Vendor briefs pre-filled with mehndi-specific scope",
    "Day-of timeline auto-built around artist hours",
    "Budget tracker with mehndi-line item defaults",
    "RSVP tools with women-only filter for the guest list",
  ],
  marigoldClosingLine: "you focus on the henna. we'll handle the rest.",
};

const EDIT_BRIDE_FINDS_DEMO = [
  {
    productName: "Pearl drop hair pin",
    category: "bridal-jewelry" as const,
    price: "₹2,800",
  },
  {
    productName: "Magnetic-clasp pearl choker",
    category: "bridal-jewelry" as const,
    price: "₹4,200",
  },
  {
    productName: "Hand-calligraphed escort cards",
    category: "stationery" as const,
    price: "₹85 each",
  },
  {
    productName: "Long-wear setting spray",
    category: "beauty-find" as const,
    price: "₹1,400",
  },
];

const PLATFORM_HOW_IT_WORKS_DEMO: HowItWorksStep[] = [
  {
    number: 1,
    title: "Set your wedding date",
    description:
      "We auto-build your 13-phase timeline around it. No spreadsheets required.",
  },
  {
    number: 2,
    title: "Add your events",
    description:
      "Mehndi, sangeet, pheras, reception — each gets its own workspace, vendors, and timeline.",
  },
  {
    number: 3,
    title: "Invite your team",
    description:
      "Mom, fiance, planner, coordinator — everyone gets their own login and the right access.",
  },
  {
    number: 4,
    title: "Brief your vendors",
    description:
      "Pre-filled briefs by category. Your photographer gets photos. Your decorator gets hex codes.",
  },
];

const SERIES: Series[] = [
  {
    number: "Series 01",
    title: (
      <>
        Bridezilla <i style={{ color: "var(--pink)" }}>vs.</i> Momzilla
      </>
    ),
    description:
      "The two-character format. Side-by-side quotes that catch the daughter–mother gap every South Asian bride lives through. Ships as a 1080×1920 story or a 1080×1080 post.",
    items: [
      {
        format: "story",
        filename: "bvm-story-guest-list",
        label: "Story — Guest List",
        node: (
          <BvMStory
            brideQuote={"80 people,\nmax."}
            brideAnnotation="she said, confidently"
            momQuote={"I have 347\non my list."}
            momAnnotation="and that's just dad's side"
          />
        ),
      },
      {
        format: "post",
        filename: "bvm-post-guest-list",
        templateSlug: "bvm-post",
        label: "Post — Guest List",
        node: (
          <BvMPost
            brideQuote={"80 people,\nmax."}
            brideAnnotation="she said, confidently"
            momQuote={"I have 347\non my list."}
            momAnnotation="and that's just dad's side"
            ctaTagline="we have a tab for both of you"
          />
        ),
      },
    ],
  },
  {
    number: "Series 02",
    title: (
      <>
        The <i style={{ color: "var(--hot-pink)" }}>Confessional</i>
      </>
    ),
    description:
      "Anonymous, unfiltered, very real. A title slide, three sticky-note confession variants (blush / gold / lavender), and a Submit CTA that closes the carousel.",
    items: [
      {
        format: "story",
        filename: "confessional-title",
        label: "Title Slide",
        node: <ConfessionalTitle />,
      },
      {
        format: "story",
        filename: "confessional-01-blush",
        label: "Confession — Blush",
        node: (
          <ConfessionalCard
            variant="blush"
            confessionNumber={1}
            confessionText={`"I told my mom the decorator was fully booked so she'd stop sending me mandap photos. The decorator was not booked."`}
            attribution="— ANONYMOUS BRIDE, 2026"
          />
        ),
      },
      {
        format: "story",
        filename: "confessional-02-gold",
        label: "Confession — Gold",
        node: (
          <ConfessionalCard
            variant="gold"
            confessionNumber={2}
            confessionText={`"My MIL added 40 people to the guest list while I was on vacation. I found out from the caterer."`}
            attribution="— ANONYMOUS BRIDE, 2026"
          />
        ),
      },
      {
        format: "story",
        filename: "confessional-03-lavender",
        label: "Confession — Lavender",
        node: (
          <ConfessionalCard
            variant="lavender"
            confessionNumber={3}
            confessionText={`"I created a fake 'venue availability' email to convince my parents we couldn't do a Tuesday wedding."`}
            attribution="— ANONYMOUS GROOM, 2025"
          />
        ),
      },
      {
        format: "story",
        filename: "confessional-cta",
        label: "Submit CTA",
        node: <ConfessionalCTA />,
      },
      {
        format: "story",
        filename: "confessional-karaoke-reel",
        label: "Karaoke Reel (frozen at 40%)",
        node: (
          <ConfessionalReelStaticPreview
            confessionNumber={4}
            confessionText={`I told my mom the decorator was fully booked, so she'd stop sending me mandap photos. The decorator was not booked.`}
            attribution="— anonymous bride, 2026"
            highlightColor="hot-pink"
          />
        ),
      },
    ],
  },
  {
    number: "Series 03",
    title: (
      <>
        Discover <i style={{ color: "var(--hot-pink)" }}>Your...</i>
      </>
    ),
    description:
      "Open-ended personality/discovery quiz engine. Title slide + 3-5 result cards (now configurable: any quiz theme, any background color, any icon). Includes a square post format so results land on the grid, not just stories.",
    items: [
      {
        format: "story",
        filename: "quiz-title-v2-wedding-style",
        label: "V2 Title — Wedding Style (lavender, 5 options)",
        node: (
          <QuizTitleV2
            quizTheme="What's Your Wedding Style?"
            headerAnnotation="pick the one you can't stop thinking about"
            backgroundColor="lavender"
            options={[
              { letter: "A", label: "Classic Elegance", subtitle: "ivory florals, candlelight, the whole thing whispers" },
              { letter: "B", label: "Boho Garden", subtitle: "wildflowers, golden hour, barefoot moments" },
              { letter: "C", label: "Modern Minimalist", subtitle: "clean lines, single statement, no clutter" },
              { letter: "D", label: "Royal Maximalist", subtitle: "marble, gold, and a chandelier in every room" },
              { letter: "E", label: "Rustic Charm", subtitle: "string lights, wooden tables, second helpings" },
            ]}
          />
        ),
      },
      {
        format: "story",
        filename: "quiz-title-v2-decor-personality",
        label: "V2 Title — Décor Personality (deep-pink, 3 options)",
        node: (
          <QuizTitleV2
            quizTheme="What's Your Décor Personality?"
            headerAnnotation="answer fast. don't overthink it."
            backgroundColor="deep-pink"
            options={[
              { letter: "A", label: "The Maximalist", subtitle: "more florals, more candles, more chandeliers" },
              { letter: "B", label: "The Minimalist", subtitle: "one statement piece and a perfectly set table" },
              { letter: "C", label: "The Romantic", subtitle: "soft pinks, fresh florals, candlelight everywhere" },
            ]}
          />
        ),
      },
      {
        format: "story",
        filename: "quiz-result-v2-classic-elegance",
        label: "V2 Result — Classic Elegance (blush + crown)",
        node: (
          <QuizResultV2
            resultType="classic-elegance"
            resultLabel="Classic Elegance"
            resultQuote="if it's not timeless, it's not getting in the photos."
            resultDescription="You're drawn to ivory florals, candlelight, and outfits your daughter could borrow in 2055. Restraint is your love language. Trends come and go — your wedding does not."
            productTieIn="Our moodboards and the 13-phase planner keep every vendor brief on-tone — so the candlelight stays warm, the florals stay ivory, and nothing veers off-script on the day."
            backgroundColor="blush"
            iconType="crown"
          />
        ),
      },
      {
        format: "story",
        filename: "quiz-result-v2-royal-maximalist",
        label: "V2 Result — Royal Maximalist (wine + temple)",
        node: (
          <QuizResultV2
            resultType="royal-maximalist"
            resultLabel="Royal Maximalist"
            resultQuote="more is more. and then a little more."
            resultDescription="Marble, gold, ten different floral varieties, and a guest list that needs its own zip code. You don't believe in restraint and frankly, neither do your aunties."
            productTieIn="The 582-task checklist and our vendor brief library keep the maximalism organized — every chandelier, every cocktail garnish, every entrance moment, accounted for."
            backgroundColor="wine"
            iconType="temple"
          />
        ),
      },
      {
        format: "story",
        filename: "quiz-result-v2-modern-minimalist",
        label: "V2 Result — Modern Minimalist (cream + compass)",
        node: (
          <QuizResultV2
            resultType="modern-minimalist"
            resultLabel="Modern Minimalist"
            resultQuote="one statement piece. one perfect angle. that's the brief."
            resultDescription="You can spot a too-busy mandap from across the room. Clean lines, single statements, intentional negative space. Your wedding will look like a magazine — because you've already laid it out in your head."
            productTieIn="Our visual brief tools and tone sliders translate 'less but better' into something your decorator can actually build — no overcorrection, no second-guessing."
            backgroundColor="cream"
            iconType="compass"
          />
        ),
      },
      {
        format: "post",
        filename: "quiz-result-post-classic-elegance",
        templateSlug: "quiz-result-post",
        label: "V2 Square Post — Classic Elegance",
        node: (
          <QuizResultPost
            resultType="classic-elegance"
            resultLabel="Classic Elegance"
            resultQuote="if it's not timeless, it's not getting in the photos."
            resultDescription="Ivory florals, candlelight, outfits your daughter could borrow in 2055. Restraint is your love language. Trends come and go — your wedding doesn't."
            productTieIn="Our moodboards and the 13-phase planner keep every vendor on-tone, on-time, and on-script — so the day looks exactly like the brief."
            backgroundColor="blush"
            iconType="crown"
          />
        ),
      },
      {
        format: "post",
        filename: "quiz-result-post-royal-maximalist",
        templateSlug: "quiz-result-post",
        label: "V2 Square Post — Royal Maximalist",
        node: (
          <QuizResultPost
            resultType="royal-maximalist"
            resultLabel="Royal Maximalist"
            resultQuote="more is more. and then a little more."
            resultDescription="Marble, gold, ten floral varieties, and a guest list that needs its own zip code. Restraint? You'll think about it next lifetime."
            productTieIn="The 582-task checklist and our vendor brief library keep the maximalism organized — every chandelier and entrance moment, accounted for."
            backgroundColor="wine"
            iconType="temple"
          />
        ),
      },
      {
        format: "post",
        filename: "quiz-result-post-party-animals",
        templateSlug: "quiz-result-post",
        label: "V2 Square Post — Party Animals",
        node: (
          <QuizResultPost
            resultType="the-party-animals"
            resultLabel="The Party Animals"
            resultQuote="less planning, more sangeet."
            resultDescription="If the DJ slaps and the dance floor is full, the wedding worked. Everything else is logistics — and somebody else's problem."
            productTieIn="Our Guest Experience Lab handles photo booths, sparkler exits, and sangeet playlists, so you can stay on the dance floor where you belong."
            backgroundColor="deep-pink"
            iconType="disco-ball"
          />
        ),
      },
      {
        format: "story",
        filename: "quiz-title-legacy",
        label: "Legacy V1 Title — Bride Energy",
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
        format: "story",
        filename: "quiz-result-zen",
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
        format: "story",
        filename: "quiz-result-typea",
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
        format: "story",
        filename: "quiz-result-creative",
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
        format: "story",
        filename: "quiz-result-party",
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
    ],
  },
  {
    number: "Series 04",
    title: (
      <>
        This <i style={{ color: "var(--pink)" }}>or</i> That
      </>
    ),
    description:
      "Quick-fire visual polls. Two wedding options, side by side. Drives taps, replies, and saves on stories — and stops the scroll on posts. Three color schemes for any mood.",
    items: [
      {
        format: "story",
        filename: "tot-story-lehenga-saree",
        label: "Story — Lehenga vs. Saree",
        node: (
          <ThisOrThatStory
            topicLabel="WEDDING VIBES"
            optionA="Lehenga"
            optionAAnnotation="main character energy"
            optionB="Saree"
            optionBAnnotation="classic, always"
            colorScheme="pink-wine"
          />
        ),
      },
      {
        format: "post",
        filename: "tot-post-band-dj",
        templateSlug: "tot-post",
        label: "Post — Live Band vs. DJ",
        node: (
          <ThisOrThatPost
            topicLabel="THE SOUNDTRACK"
            optionA="Live Band"
            optionAAnnotation="goosebumps, every song"
            optionB="DJ"
            optionBAnnotation="dance floor never sleeps"
            colorScheme="pink-wine"
          />
        ),
      },
      {
        format: "story",
        filename: "tot-story-mandap",
        label: "Story — Traditional vs. Modern Mandap",
        node: (
          <ThisOrThatStory
            topicLabel="MANDAP STYLE"
            optionA="Traditional"
            optionAAnnotation="grandma approved"
            optionB="Modern"
            optionBAnnotation="minimalist, magical"
            colorScheme="gold-lavender"
          />
        ),
      },
    ],
  },
  {
    number: "Series 05",
    title: (
      <>
        The <i style={{ color: "var(--gold)" }}>Countdown</i>
      </>
    ),
    description:
      "Milestone-based planning posts. The countdown number is the hero — paired with one concrete task and a Caveat aside that admits how late everyone always is. Urgency colors shift as the wedding approaches.",
    items: [
      {
        format: "post",
        filename: "countdown-post-12-months",
        templateSlug: "countdown-post",
        label: "Post — 12 Months Out",
        node: (
          <CountdownPost
            countdownNumber={12}
            countdownUnit="months"
            taskHeadline="Lock Down Your Venue"
            taskDetail="Venues book 12-18 months out for prime dates. Tour three, sit on none of them, and put a deposit on the one your gut won't shut up about."
            annotation="yes, it's already late. go."
            urgencyLevel="chill"
          />
        ),
      },
      {
        format: "post",
        filename: "countdown-post-6-months",
        templateSlug: "countdown-post",
        label: "Post — 6 Months Out",
        node: (
          <CountdownPost
            countdownNumber={6}
            countdownUnit="months"
            taskHeadline="Send the Save-the-Dates"
            taskDetail="Outfits ordered, invites at the printer, muhurat to the pandit. This is the month your group chat starts getting opinions about font choices."
            annotation="future-you says thanks"
            urgencyLevel="getting-real"
          />
        ),
      },
      {
        format: "post",
        filename: "countdown-post-1-week",
        templateSlug: "countdown-post",
        label: "Post — 1 Week Out",
        node: (
          <CountdownPost
            countdownNumber={1}
            countdownUnit="weeks"
            taskHeadline="Confirm Every Vendor"
            taskDetail="Call. Don't text. Confirm arrival times, payment status, and the one thing you forgot to ask. Then drink water and pretend you're calm."
            annotation="GO. NOW."
            urgencyLevel="panic"
          />
        ),
      },
      {
        format: "story",
        filename: "countdown-story-3-months",
        label: "Story — 3 Months Out",
        node: (
          <CountdownStory
            countdownNumber={3}
            countdownUnit="months"
            taskHeadline="Finalize the Menu"
            taskDetail="Tasting day is real. Bring your mother-in-law, an empty stomach, and a strong opinion about paneer. Sign off on the menu before week's end."
            annotation="taste everything, decide nothing — kidding, decide today"
            urgencyLevel="getting-real"
          />
        ),
      },
      {
        format: "post",
        filename: "countdown-carousel-cover",
        templateSlug: "countdown-carousel",
        label: "Carousel — Cover",
        node: (
          <CountdownCarousel
            slideIndex={0}
            milestones={COUNTDOWN_DEMO_MILESTONES}
          />
        ),
      },
      {
        format: "post",
        filename: "countdown-carousel-12-months",
        templateSlug: "countdown-carousel",
        label: "Carousel — 12 Months",
        node: (
          <CountdownCarousel
            slideIndex={1}
            milestones={COUNTDOWN_DEMO_MILESTONES}
          />
        ),
      },
      {
        format: "post",
        filename: "countdown-carousel-3-months",
        templateSlug: "countdown-carousel",
        label: "Carousel — 3 Months",
        node: (
          <CountdownCarousel
            slideIndex={4}
            milestones={COUNTDOWN_DEMO_MILESTONES}
          />
        ),
      },
      {
        format: "post",
        filename: "countdown-carousel-1-week",
        templateSlug: "countdown-carousel",
        label: "Carousel — 1 Week",
        node: (
          <CountdownCarousel
            slideIndex={6}
            milestones={COUNTDOWN_DEMO_MILESTONES}
          />
        ),
      },
      {
        format: "post",
        filename: "countdown-carousel-close",
        templateSlug: "countdown-carousel",
        label: "Carousel — Close",
        node: (
          <CountdownCarousel
            slideIndex={7}
            milestones={COUNTDOWN_DEMO_MILESTONES}
          />
        ),
      },
    ],
  },
  {
    number: "Series 06",
    title: (
      <>
        Mood <i style={{ color: "var(--pink)" }}>Board</i>
      </>
    ),
    description:
      "Aesthetic breathing room. Pinterest-style collages, vertical mood stories, and Pantone-style palette cards — the gorgeous posts that balance the comment-bait and quiz content.",
    items: [
      {
        format: "post",
        filename: "mood-board-post-romantic-garden",
        templateSlug: "mood-board-post",
        label: "Post — Romantic Garden",
        node: (
          <MoodBoardPost
            styleLabel="ROMANTIC GARDEN VIBES"
            annotation="for the bride who wants flowers in her hair"
            colorPalette={["#F4C2C2", "#E8B4A0", "#D4A853", "#A8B89F", "#FFF8F2"]}
            images={[]}
          />
        ),
      },
      {
        format: "story",
        filename: "mood-board-story-garden",
        label: "Story — Garden",
        node: (
          <MoodBoardStory
            styleLabel="Romantic Garden"
            panels={[
              { label: "the table setting" },
              { label: "the florals" },
              { label: "the venue" },
            ]}
            fallbackColors={["#F4C2C2", "#A8B89F", "#D4A853"]}
          />
        ),
      },
      {
        format: "post",
        filename: "color-palette-garden-romance",
        templateSlug: "color-palette-post",
        label: "Palette — Garden Romance",
        node: (
          <ColorPalettePost
            paletteName="Garden Romance"
            seasonNote="perfect for a spring ceremony"
            colors={[
              { hex: "#F4C2C2", name: "Dusty Rose" },
              { hex: "#E8B4A0", name: "Apricot Blush" },
              { hex: "#D4A853", name: "Champagne Gold" },
              { hex: "#A8B89F", name: "Sage Whisper" },
              { hex: "#FFF8F2", name: "Bridal Cream" },
            ]}
          />
        ),
      },
      {
        format: "post",
        filename: "lehenga-style-modern-minimal",
        templateSlug: "lehenga-style-post",
        label: "Lehenga Style — Modern Minimal",
        node: (
          <LehengaStylePost
            imageUrl=""
            styleName="The Modern Minimal Lehenga"
            colorDescription="dusty rose with silver thread"
            bestFor="outdoor morning ceremonies"
            designerSource="Anita Dongre"
          />
        ),
      },
    ],
  },
  {
    number: "Series 07",
    title: (
      <>
        Vendor <i style={{ color: "var(--gold)" }}>Spotlight</i>
      </>
    ),
    description:
      "The relationship-builder. Real wedding vendors — their work, tips, and personality. Reshareable to vendor audiences, which expands The Marigold's reach. Three formats: a 1080×1080 feature post, a six-slide tip carousel, and a 1080×1920 quote reel that reuses the karaoke animation.",
    items: [
      {
        format: "post",
        filename: "vendor-feature-photographer",
        templateSlug: "vendor-feature-post",
        label: "Feature Post — Photographer",
        node: (
          <VendorFeaturePost
            vendorCategory="PHOTOGRAPHER"
            vendorName="Priya Sharma Photography"
            vendorLocation="Mumbai & Destination"
            vendorQuote="Light is the first guest at every wedding."
            accentColor="gold"
          />
        ),
      },
      {
        format: "post",
        filename: "vendor-feature-decorator",
        templateSlug: "vendor-feature-post",
        label: "Feature Post — Decorator",
        node: (
          <VendorFeaturePost
            vendorCategory="DECORATOR"
            vendorName="Maison Marigold Décor"
            vendorLocation="Delhi NCR"
            vendorQuote="A mandap should look like the bride's mind feels — finally calm."
            accentColor="pink"
          />
        ),
      },
      {
        format: "post",
        filename: "vendor-tip-carousel-cover",
        templateSlug: "vendor-tip-carousel",
        label: "Tip Carousel — Cover",
        node: (
          <VendorTipCarousel
            slideIndex={1}
            vendorCategory="from your photographer"
            vendorName="Priya Sharma"
            vendorHandle="@priyasharmaphoto"
            tips={VENDOR_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "post",
        filename: "vendor-tip-carousel-tip-1",
        templateSlug: "vendor-tip-carousel",
        label: "Tip Carousel — Tip 1",
        node: (
          <VendorTipCarousel
            slideIndex={2}
            vendorCategory="from your photographer"
            vendorName="Priya Sharma"
            vendorHandle="@priyasharmaphoto"
            tips={VENDOR_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "post",
        filename: "vendor-tip-carousel-tip-3",
        templateSlug: "vendor-tip-carousel",
        label: "Tip Carousel — Tip 3",
        node: (
          <VendorTipCarousel
            slideIndex={4}
            vendorCategory="from your photographer"
            vendorName="Priya Sharma"
            vendorHandle="@priyasharmaphoto"
            tips={VENDOR_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "post",
        filename: "vendor-tip-carousel-close",
        templateSlug: "vendor-tip-carousel",
        label: "Tip Carousel — Close",
        node: (
          <VendorTipCarousel
            slideIndex={6}
            vendorCategory="from your photographer"
            vendorName="Priya Sharma"
            vendorHandle="@priyasharmaphoto"
            tips={VENDOR_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "story",
        filename: "vendor-quote-reel-photographer",
        label: "Quote Reel — Photographer (frozen at 40%)",
        node: (
          <VendorQuoteReelStaticPreview
            vendorCategory="PHOTOGRAPHER"
            vendorName="Priya Sharma"
            quote="The best wedding photos happen in the ten minutes after the ceremony, when no one is performing anymore."
            highlightColor="gold"
          />
        ),
      },
    ],
  },
  {
    number: "Series 08",
    title: (
      <>
        Hot <i style={{ color: "var(--hot-pink)" }}>Takes</i>
      </>
    ),
    description:
      "Bold, slightly provocative wedding opinions designed to drive comments and debate. The flame-and-wine treatment lands the take; the Caveat aside invites the fight. Ships as a 1080×1080 post, a 1080×1920 story with an in-frame poll, or a five-take carousel.",
    items: [
      {
        format: "post",
        filename: "hot-take-post-baraat-horse",
        label: "Post — Baraat Horse",
        templateSlug: "hot-take-post",
        node: (
          <HotTakePost
            hotTake="The baraat horse is overrated."
            responsePrompt="agree or fight me"
            ctaText="Drop your take in the comments 👇"
          />
        ),
      },
      {
        format: "post",
        filename: "hot-take-post-photographer",
        label: "Post — Photographer",
        templateSlug: "hot-take-post",
        node: (
          <HotTakePost
            hotTake="Your photographer is more important than your venue."
            responsePrompt="tell me I'm wrong"
            ctaText="Drop your take in the comments 👇"
          />
        ),
      },
      {
        format: "story",
        filename: "hot-take-story-sangeet",
        label: "Story — Sangeet > Ceremony",
        templateSlug: "hot-take-story",
        node: (
          <HotTakeStory
            hotTake="The sangeet is more important than the ceremony."
            responsePrompt="I said what I said."
            ctaText="Drop your take in the comments 👇"
          />
        ),
      },
      {
        format: "post",
        filename: "hot-takes-carousel-cover",
        label: "Carousel — Cover",
        templateSlug: "hot-takes-carousel",
        node: (
          <HotTakeCarousel slideIndex={0} takes={HOT_TAKES_DEMO} />
        ),
      },
      {
        format: "post",
        filename: "hot-takes-carousel-1",
        label: "Carousel — Take 1",
        templateSlug: "hot-takes-carousel",
        node: (
          <HotTakeCarousel slideIndex={1} takes={HOT_TAKES_DEMO} />
        ),
      },
      {
        format: "post",
        filename: "hot-takes-carousel-2",
        label: "Carousel — Take 2",
        templateSlug: "hot-takes-carousel",
        node: (
          <HotTakeCarousel slideIndex={2} takes={HOT_TAKES_DEMO} />
        ),
      },
      {
        format: "post",
        filename: "hot-takes-carousel-5",
        label: "Carousel — Take 5",
        templateSlug: "hot-takes-carousel",
        node: (
          <HotTakeCarousel slideIndex={5} takes={HOT_TAKES_DEMO} />
        ),
      },
      {
        format: "post",
        filename: "hot-takes-carousel-close",
        label: "Carousel — Close",
        templateSlug: "hot-takes-carousel",
        node: (
          <HotTakeCarousel slideIndex={6} takes={HOT_TAKES_DEMO} />
        ),
      },
      {
        format: "post",
        filename: "approval-matrix-trends",
        templateSlug: "approval-matrix-post",
        label: "Approval Matrix — Trends",
        node: (
          <ApprovalMatrixPost
            title="The Wedding Trend Approval Matrix"
            subtitle="where does your mom land on this"
            items={[
              { label: "Phone-free ceremony", x: -0.7, y: -0.6 },
              { label: "Sangeet flash mob", x: 0.3, y: -0.5 },
              { label: "First look", x: -0.5, y: 0.6 },
              { label: "Welcome bags", x: -0.6, y: -0.8 },
              { label: "Entry on a horse", x: 0.7, y: -0.7 },
              { label: "Skipping the haldi", x: 0.8, y: 0.7 },
              { label: "Live wedding website", x: -0.8, y: 0.2 },
              { label: "DJ over live dhol", x: 0.4, y: 0.8 },
              { label: "Custom couple hashtag", x: 0.5, y: -0.3 },
              { label: "No alcohol", x: 0.2, y: -0.9 },
            ]}
          />
        ),
      },
    ],
  },
  {
    number: "Series 09",
    title: (
      <>
        Venue <i style={{ color: "var(--gold)" }}>Spotlight</i>
      </>
    ),
    description:
      "The discovery layer. Real wedding venues with style profiles, practical details, and aspirational imagery. Ships as a 1080×1080 feature post, a side-by-side comparison post, a six-slide style guide carousel, and a 1080×1920 cinematic reel.",
    items: [
      {
        format: "post" as const,
        filename: "venue-feature-falaknuma",
        templateSlug: "venue-feature-post",
        label: "Feature — Taj Falaknuma",
        node: (
          <VenueFeaturePost
            venueType="palace"
            venueName="Taj Falaknuma Palace"
            venueLocation="Hyderabad, Telangana"
            capacity={400}
            bestFor="grand ceremonies with a royal entrance"
            startingPrice={75}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "venue-feature-alila-diwa",
        templateSlug: "venue-feature-post",
        label: "Feature — Alila Diwa Goa",
        node: (
          <VenueFeaturePost
            venueType="beachfront"
            venueName="Alila Diwa Goa"
            venueLocation="Majorda, Goa"
            capacity={250}
            bestFor="barefoot vows at golden hour"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "venue-comparison-falaknuma-grand-bharat",
        templateSlug: "venue-comparison-post",
        label: "Comparison — Falaknuma vs. Grand Bharat",
        node: (
          <VenueComparisonPost
            venueAName="Taj Falaknuma Palace"
            venueAAttributes={{
              capacity: "Up to 400",
              vibe: "Royal & grand",
              priceRange: "₹50L – ₹1Cr",
              bestFor: "Once-in-a-lifetime photos",
            }}
            venueBName="ITC Grand Bharat"
            venueBAttributes={{
              capacity: "Up to 600",
              vibe: "Resort luxe",
              priceRange: "₹35L – ₹70L",
              bestFor: "All-inclusive weekend",
            }}
            verdict="A for the photos, B for the food"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "venue-style-guide-cover",
        templateSlug: "venue-style-guide",
        label: "Style Guide — Cover",
        node: (
          <VenueStyleGuide
            slideIndex={1}
            venueStyle="The Garden Wedding"
            styleSubtitle="for the bride who wants sunlight and petals"
            coverBackground="mint"
            slides={VENUE_STYLE_DEMO_SLIDES}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "venue-style-guide-vibe",
        templateSlug: "venue-style-guide",
        label: "Style Guide — The Vibe",
        node: (
          <VenueStyleGuide
            slideIndex={2}
            venueStyle="The Garden Wedding"
            styleSubtitle="for the bride who wants sunlight and petals"
            coverBackground="mint"
            slides={VENUE_STYLE_DEMO_SLIDES}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "venue-style-guide-watch-out",
        templateSlug: "venue-style-guide",
        label: "Style Guide — Watch Out For",
        node: (
          <VenueStyleGuide
            slideIndex={4}
            venueStyle="The Garden Wedding"
            styleSubtitle="for the bride who wants sunlight and petals"
            coverBackground="mint"
            slides={VENUE_STYLE_DEMO_SLIDES}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "venue-style-guide-close",
        templateSlug: "venue-style-guide",
        label: "Style Guide — Close",
        node: (
          <VenueStyleGuide
            slideIndex={6}
            venueStyle="The Garden Wedding"
            styleSubtitle="for the bride who wants sunlight and petals"
            coverBackground="mint"
            slides={VENUE_STYLE_DEMO_SLIDES}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "dream-venue-reel-frame3",
        label: "Dream Venue Reel (frozen at 65%)",
        node: (
          <DreamVenueReelStaticPreview
            venueName="Taj Falaknuma Palace"
            venueLocation="Hyderabad, Telangana"
            venueStyle="Heritage Palace"
            capacity={400}
            hookText="imagine this."
            freezeAt={0.65}
          />
        ),
      },
    ],
  },
  {
    number: "Series 10",
    title: (
      <>
        Planner <i style={{ color: "var(--gold)" }}>Spotlight</i>
      </>
    ),
    description:
      "The referral layer. Wedding planners and coordinators featured as expert authorities — they reshare to their own audiences and become long-term partners. Profile post, single-question advice card, five-tip carousel, and a day-of vs. full-service comparison post.",
    items: [
      {
        format: "post" as const,
        filename: "planner-profile-aanya-mehta",
        templateSlug: "planner-profile-post",
        label: "Profile — Aanya Mehta",
        node: (
          <PlannerProfilePost
            plannerName="Aanya Mehta"
            companyName="Mehta Weddings & Events"
            plannerLocation="Mumbai · Destination"
            specialties={[
              "DESTINATION",
              "LUXURY",
              "SOUTH INDIAN",
              "MULTI-FAITH",
            ]}
            pullQuote="We plan weddings the way we'd plan our own — every detail, every guest, every grandparent."
            weddingsPlanned={120}
            yearsExperience={8}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "planner-advice-day-of",
        templateSlug: "planner-advice-post",
        label: "Advice — Day-Of Coordinator",
        node: (
          <PlannerAdvicePost
            question="Should I hire a day-of coordinator?"
            answer="Yes — even if you've planned every detail. A day-of coordinator manages timing, vendors, and the chaos you can't predict so you actually get to be present at your wedding. They pay for themselves the moment something goes off-script."
            plannerName="Aanya Mehta"
            companyName="Mehta Weddings & Events"
            accentColor="gold"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "planner-tips-carousel-cover",
        templateSlug: "planner-tips-carousel",
        label: "Tips Carousel — Cover",
        node: (
          <PlannerTipsCarousel
            plannerName="Aanya Mehta"
            companyName="Mehta Weddings & Events"
            plannerHandle="@mehtaweddings"
            slideIndex={1}
            tips={PLANNER_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "planner-tips-carousel-tip-1",
        templateSlug: "planner-tips-carousel",
        label: "Tips Carousel — Tip 1",
        node: (
          <PlannerTipsCarousel
            plannerName="Aanya Mehta"
            companyName="Mehta Weddings & Events"
            plannerHandle="@mehtaweddings"
            slideIndex={2}
            tips={PLANNER_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "planner-tips-carousel-tip-3",
        templateSlug: "planner-tips-carousel",
        label: "Tips Carousel — Tip 3",
        node: (
          <PlannerTipsCarousel
            plannerName="Aanya Mehta"
            companyName="Mehta Weddings & Events"
            plannerHandle="@mehtaweddings"
            slideIndex={4}
            tips={PLANNER_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "planner-tips-carousel-close",
        templateSlug: "planner-tips-carousel",
        label: "Tips Carousel — Close",
        node: (
          <PlannerTipsCarousel
            plannerName="Aanya Mehta"
            companyName="Mehta Weddings & Events"
            plannerHandle="@mehtaweddings"
            slideIndex={7}
            tips={PLANNER_TIPS_DEMO}
            accentColor="gold"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "day-of-vs-full-planning",
        templateSlug: "day-of-vs-full-planning-post",
        label: "Day-Of vs. Full Planning",
        node: (
          <DayOfVsFullPlanningPost
            dayOfBullets={[
              "Final timeline build (4-6 weeks out)",
              "Vendor confirmations & contracts review",
              "On-site coordination day-of (10-14 hrs)",
              "Emergency kit + crisis management",
              "Post-event vendor wrap-up",
            ]}
            dayOfPriceRange="₹50K – ₹1.5L"
            fullServiceBullets={[
              "End-to-end planning from engagement to honeymoon",
              "Venue + vendor sourcing & negotiation",
              "Budget management across all events",
              "Design, decor, and creative direction",
              "On-site coordination for all functions",
            ]}
            fullServicePriceRange="₹5L – ₹25L+"
            bottomLine="The Marigold works with both."
          />
        ),
      },
    ],
  },
  {
    number: "Series 11",
    title: (
      <>
        The Marigold <i style={{ color: "var(--hot-pink)" }}>Edit</i>
      </>
    ),
    description:
      "The cool-stuff-we-found series. Curated product picks, accessories, and trending finds for brides — taste authority that drives saves. Three post formats and a fast-cut reel: a single product pick on a scrapbook card, a trend recap, a five-pick carousel, and a 1080×1920 reel that flips through 3-5 finds.",
    items: [
      {
        format: "post" as const,
        filename: "edit-product-pick-jewelry",
        templateSlug: "edit-product-pick-post",
        label: "Product Pick — Bridal Jewelry",
        node: (
          <ProductPickPost
            productName="Magnetic-clasp pearl choker"
            category="bridal-jewelry"
            price="₹4,200"
            whyWeLoveIt="the clasp is magnetic so you won't fumble during pheras"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "edit-trending-now-decor",
        templateSlug: "edit-trending-now-post",
        label: "Trending Now — Decor",
        node: (
          <TrendingNowPost
            trendTitle="Dried flower bouquets are having a moment"
            trendDetails={[
              "Last for months, no wilting under mandap lights",
              "Way better photographed in close-ups than fresh",
              "Can be reused for the reception centerpieces",
              "Costs 30-40% less than peak-season fresh florals",
            ]}
            editorialTake="we're into it. your aunty won't be."
            trendCategory="decor"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "edit-top-picks-cover",
        templateSlug: "edit-top-picks-carousel",
        label: "Top Picks Carousel — Cover",
        node: (
          <TopPicksCarousel
            monthName="May Finds"
            subtitle="5 things we can't stop thinking about"
            slideIndex={1}
            picks={EDIT_TOP_PICKS_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "edit-top-picks-pick-2",
        templateSlug: "edit-top-picks-carousel",
        label: "Top Picks Carousel — Pick 2",
        node: (
          <TopPicksCarousel
            monthName="May Finds"
            subtitle="5 things we can't stop thinking about"
            slideIndex={3}
            picks={EDIT_TOP_PICKS_DEMO}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "edit-bride-finds-reel",
        label: "Bride Finds Reel (frozen at 40%)",
        node: (
          <BrideFindsReelStaticPreview
            finds={EDIT_BRIDE_FINDS_DEMO}
            freezeAt={0.4}
          />
        ),
      },
    ],
  },
  {
    number: "Series 12",
    title: (
      <>
        Real Bride <i style={{ color: "var(--hot-pink)" }}>Diaries</i>
      </>
    ),
    description:
      "First-person diary snippets from real (or realistic AI-generated) brides at different planning stages. Lined paper, handwritten Caveat, a margin doodle that fits the emotional beat — built to make followers feel seen in the messy middle of planning. Three formats: a 1080×1080 post, a 1080×1920 story with the diary text scaled up, and a 1080×1920 reel that uses the karaoke animation on lined paper instead of dark wine.",
    items: [
      {
        format: "post",
        filename: "diary-post-lehenga-trial",
        templateSlug: "diary-entry-post",
        label: "Post — Lehenga Trial Day",
        node: (
          <DiaryEntryPost
            dayOrWeek="Day 47"
            dateLabel="APR 14 · 11:42PM"
            diaryText="Third lehenga trial today. The tailor pinned the sleeves wrong and I cried in the changing room over a sleeve. A SLEEVE. Mom held my chai and said nothing, which was somehow exactly right."
            brideIdentifier="A., 27, MUMBAI"
            planningStage="4 months to go"
            marginDoodle="stressed"
          />
        ),
      },
      {
        format: "post",
        filename: "diary-post-mom-moment",
        templateSlug: "diary-entry-post",
        label: "Post — A Soft Mom Moment",
        node: (
          <DiaryEntryPost
            dayOrWeek="Day 89"
            dateLabel="FEB 02 · 9:15AM"
            diaryText="Mom showed up with the bangles she wore at her own wedding. She didn't say anything, just put them in my hand. We sat on the floor of her bedroom for an hour. I am thirty years old and I am someone's daughter."
            brideIdentifier="P., 30, DELHI"
            planningStage="3 months to go"
            marginDoodle="heart"
          />
        ),
      },
      {
        format: "story",
        filename: "diary-story-venue-sunrise",
        label: "Story — Sunrise at the Venue",
        node: (
          <DiaryEntryStory
            dayOrWeek="Week 18"
            dateLabel="MAR 02 · 7:08AM"
            diaryText="Walked the venue at sunrise without telling anyone. Stood under the mandap frame for ten minutes. For the first time, this whole thing felt real and not like a spreadsheet."
            brideIdentifier="R., 29, BANGALORE"
            planningStage="6 months to go"
            marginDoodle="sparkle"
          />
        ),
      },
      {
        format: "story",
        filename: "diary-reel-muhurat-text",
        label: "Reel — 4AM Muhurat Text (frozen at 40%)",
        node: (
          <DiaryEntryReelStaticPreview
            dayOrWeek="Day 12"
            dateLabel="APR 17 · 1:14AM"
            diaryText="He sent me the muhurat at 4am. Four. A.M. I love him but I am going to be a ghost on my own wedding day. Mom is thrilled. My pandit is thrilled. I am, technically, also thrilled."
            brideIdentifier="S., 26, DELHI"
            planningStage="2 weeks to go"
            marginDoodle="ring"
            freezeAt={0.4}
          />
        ),
      },
    ],
  },
  {
    number: "Series 13",
    title: (
      <>
        Budget <i style={{ color: "var(--gold)" }}>Breakdown</i>
      </>
    ),
    description:
      "Real talk about wedding costs. The most Googled, least transparent topic in wedding planning — turned into content that gets saved, shared, and referenced. Five 1080×1080 formats: a stylized pie chart, save-vs-splurge split, planned-vs-actual reality check, regional cost comparison bars, and a 7-slide tips carousel.",
    items: [
      {
        format: "post" as const,
        filename: "budget-pie-post",
        templateSlug: "budget-pie-post",
        label: "Budget Pie — ₹30 lakh wedding",
        node: <BudgetPiePost />,
      },
      {
        format: "post" as const,
        filename: "save-vs-splurge-post",
        templateSlug: "save-vs-splurge-post",
        label: "Save vs. Splurge",
        node: <SaveVsSplurgePost />,
      },
      {
        format: "post" as const,
        filename: "budget-reality-post",
        templateSlug: "budget-reality-post",
        label: "Budget Reality Check",
        node: <BudgetRealityPost />,
      },
      {
        format: "post" as const,
        filename: "cost-by-city-mumbai",
        templateSlug: "cost-by-city-post",
        label: "Cost by City — Mumbai",
        node: <CostByCityPost />,
      },
      {
        format: "post" as const,
        filename: "cost-by-city-jaipur",
        templateSlug: "cost-by-city-post",
        label: "Cost by City — Jaipur",
        node: (
          <CostByCityPost
            cityName="Jaipur"
            costs={[
              { category: "Venue", rangeLow: 5, rangeHigh: 20, unit: "lakh" },
              { category: "Catering (per plate)", rangeLow: 1100, rangeHigh: 3800, unit: "₹" },
              { category: "Decor", rangeLow: 3, rangeHigh: 14, unit: "lakh" },
              { category: "Photography", rangeLow: 1, rangeHigh: 4.5, unit: "lakh" },
            ]}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "budget-tips-cover",
        templateSlug: "budget-tips-carousel",
        label: "Tips Carousel — Cover",
        node: (
          <BudgetTipsCarousel
            tips={BUDGET_TIPS_DEMO}
            slideIndex={0}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "budget-tips-pair-1",
        templateSlug: "budget-tips-carousel",
        label: "Tips Carousel — Tips 1 & 2",
        node: (
          <BudgetTipsCarousel
            tips={BUDGET_TIPS_DEMO}
            slideIndex={1}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "budget-tips-pair-3",
        templateSlug: "budget-tips-carousel",
        label: "Tips Carousel — Tips 5 & 6",
        node: (
          <BudgetTipsCarousel
            tips={BUDGET_TIPS_DEMO}
            slideIndex={3}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "budget-tips-close",
        templateSlug: "budget-tips-carousel",
        label: "Tips Carousel — Close",
        node: (
          <BudgetTipsCarousel
            tips={BUDGET_TIPS_DEMO}
            slideIndex={6}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "real-numbers-42-lakh",
        templateSlug: "real-numbers-post",
        label: "Real Numbers — ₹42 lakh wedding",
        node: (
          <RealNumbersPost
            totalBudget="from a real ₹42 lakh wedding"
            lineItems={[
              { section: "Venue & Stay", category: "Resort booking (3 nights)", amount: "₹14,00,000" },
              { section: "Venue & Stay", category: "Guest room block", amount: "₹3,50,000" },
              { section: "Food & Beverage", category: "Catering (400 plates × ₹2,500)", amount: "₹10,00,000" },
              { section: "Food & Beverage", category: "Bar & beverages", amount: "₹2,75,000" },
              { section: "Décor & Production", category: "Mandap & florals", amount: "₹4,25,000" },
              { section: "Décor & Production", category: "Lighting & sound", amount: "₹1,80,000" },
              { section: "Photo & Video", category: "Photography + cinematography", amount: "₹3,20,000" },
              { section: "Miscellaneous", category: "Last-minute mandap upgrade", amount: "₹2,50,000" },
            ]}
            annotation="the 'miscellaneous ₹2.5 lakh' was the last-minute mandap upgrade. every time."
          />
        ),
      },
      {
        format: "story" as const,
        filename: "wedding-math-reel-catering",
        label: "Wedding Math Reel — Catering (frozen at 35%)",
        node: (
          <WeddingMathReelStaticPreview
            equations={[
              { number: "400 × ₹2,500 = ₹10,00,000", text: "guests × per plate = catering" },
              { number: "₹10,00,000 = 33% of budget", text: "of a ₹30 lakh wedding" },
              { number: "On food. Alone.", text: "no décor, no photography, no outfits" },
              { number: "+ ₹1,50,000", text: "the dessert counter you forgot" },
            ]}
            punchline="Run the math before the menu."
            ctaText="Use The Marigold budget tracker."
            holdTimeMs={1400}
            freezeAt={0.35}
          />
        ),
      },
    ],
  },
  {
    number: "Series 14",
    title: (
      <>
        Planning <i style={{ color: "var(--gold)" }}>101</i>
      </>
    ),
    description:
      "The save-this-post series. Comprehensive educational content covering every major topic in desi wedding planning — ceremony explainers, guest list politics, vendor red flags, day-of timelines, negotiation tactics, full event deep-dives, and quick-reference checklists. Highest utility, highest share value.",
    items: [
      {
        format: "post" as const,
        filename: "ceremony-guide-haldi",
        templateSlug: "ceremony-guide-post",
        label: "Ceremony Guide — Haldi",
        node: (
          <CeremonyGuidePost
            ceremonyName="Haldi"
            headerColor="gold"
            whatItIs="A pre-wedding ritual where turmeric paste is applied to the bride and groom for blessings, glow, and good luck. Held the morning of or day before the wedding."
            keyTraditions={[
              "Family applies haldi to the bride/groom in turn",
              "Live dhol music and singing",
              "Yellow outfits — the messier the better",
              "Flower decor: marigolds, jasmine, gerberas",
            ]}
            typicalDuration="1-2 hours"
            proTip="wear something you don't love. turmeric stains forever."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "ceremony-guide-mehndi",
        templateSlug: "ceremony-guide-post",
        label: "Ceremony Guide — Mehndi",
        node: (
          <CeremonyGuidePost
            ceremonyName="Mehndi"
            headerColor="mint"
            whatItIs="A long, music-filled afternoon where the bride's hands and feet are decorated in intricate henna while the women in her family eat, gossip, and dance through the day."
            keyTraditions={[
              "Bride's intricate mehndi (2-3 hours)",
              "Guest mehndi stations and chaat counters",
              "Dhol player and curated Bollywood playlist",
              "Glass bangles, kajal, and mehndi-oil favors",
            ]}
            typicalDuration="3-5 hours"
            proTip="darker stain = more in-laws love you (allegedly)"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "guest-management-post",
        templateSlug: "guest-management-post",
        label: "Guest List Survival Guide",
        node: (
          <GuestManagementPost
            guideTitle="Guest List Survival Guide"
            tips={PLANNING_GUEST_TIPS_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "red-flags-vendor",
        templateSlug: "red-flags-post",
        label: "Red Flags — In a Vendor",
        node: (
          <RedFlagsPost
            flagCategory="vendor"
            flags={PLANNING_RED_FLAGS_DEMO}
            bottomAdvice="Protect yourself. Read the contract. Twice."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "timeline-builder-wedding-day",
        templateSlug: "timeline-builder-post",
        label: "Timeline Builder — Wedding Day",
        node: (
          <TimelineBuilderPost
            eventName="Wedding Day"
            entries={PLANNING_TIMELINE_DEMO}
            headerAnnotation="screenshot this. you'll need it."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "vendor-negotiation-photographer",
        templateSlug: "vendor-negotiation-post",
        label: "How To Negotiate — Photographer",
        node: (
          <VendorNegotiationPost
            vendorCategory="with your photographer"
            tips={PLANNING_NEGOTIATION_TIPS_DEMO}
            bottomLine="Confidence is free. Bad contracts aren't."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "event-breakdown-mehndi-cover",
        templateSlug: "event-breakdown-carousel",
        label: "Event Breakdown — Cover",
        node: (
          <EventBreakdownCarousel
            eventName="Mehndi"
            eventColor="mint"
            slideIndex={0}
            slides={PLANNING_EVENT_BREAKDOWN_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "event-breakdown-mehndi-vibe",
        templateSlug: "event-breakdown-carousel",
        label: "Event Breakdown — The Vibe",
        node: (
          <EventBreakdownCarousel
            eventName="Mehndi"
            eventColor="mint"
            slideIndex={1}
            slides={PLANNING_EVENT_BREAKDOWN_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "event-breakdown-mehndi-checklist",
        templateSlug: "event-breakdown-carousel",
        label: "Event Breakdown — The Checklist",
        node: (
          <EventBreakdownCarousel
            eventName="Mehndi"
            eventColor="mint"
            slideIndex={2}
            slides={PLANNING_EVENT_BREAKDOWN_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "event-breakdown-mehndi-budget",
        templateSlug: "event-breakdown-carousel",
        label: "Event Breakdown — The Budget",
        node: (
          <EventBreakdownCarousel
            eventName="Mehndi"
            eventColor="mint"
            slideIndex={3}
            slides={PLANNING_EVENT_BREAKDOWN_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "event-breakdown-mehndi-timeline",
        templateSlug: "event-breakdown-carousel",
        label: "Event Breakdown — The Timeline",
        node: (
          <EventBreakdownCarousel
            eventName="Mehndi"
            eventColor="mint"
            slideIndex={4}
            slides={PLANNING_EVENT_BREAKDOWN_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "event-breakdown-mehndi-mistakes",
        templateSlug: "event-breakdown-carousel",
        label: "Event Breakdown — The Mistakes",
        node: (
          <EventBreakdownCarousel
            eventName="Mehndi"
            eventColor="mint"
            slideIndex={5}
            slides={PLANNING_EVENT_BREAKDOWN_DEMO}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "event-breakdown-mehndi-marigold",
        templateSlug: "event-breakdown-carousel",
        label: "Event Breakdown — The Marigold Has This",
        node: (
          <EventBreakdownCarousel
            eventName="Mehndi"
            eventColor="mint"
            slideIndex={6}
            slides={PLANNING_EVENT_BREAKDOWN_DEMO}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "checklist-story-venue-visit",
        label: "Checklist Story — Venue Visit",
        node: (
          <ChecklistStory
            checklistTitle="Venue Visit Checklist"
            items={[
              "Confirm capacity for your actual guest count",
              "Walk the baraat path — is it photogenic?",
              "Ask about sound restrictions and curfew",
              "Check power load for DJ + lights + caterer",
              "Locate the bridal suite and groom prep room",
              "Time the route from parking to the mandap",
              "Ask about backup options for rain / heat",
              "Request the in-house decor list and exclusions",
              "Get the catering kitchen tour (smell test included)",
              "Clarify what's locked in writing vs. 'we usually do'",
            ]}
            annotation="screenshot this. you'll thank us later."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "did-you-know-lehenga-tries",
        templateSlug: "did-you-know-post",
        label: "Did You Know — Lehenga Tries",
        node: (
          <DidYouKnowPost
            fact="The average desi bride tries on 15 lehengas before choosing one."
            source="Based on 500 Marigold users"
            annotation="some of you tried on 50. we see you."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "dos-and-donts-photographer",
        templateSlug: "dos-and-donts-post",
        label: "Do's & Don'ts — Hiring a Photographer",
        node: (
          <DosAndDontsPost
            vendorCategory="Hiring a Photographer"
            dos={[
              "Ask to see a full wedding gallery, not just highlights",
              "Get the deliverable timeline in writing",
              "Confirm who is actually shooting your wedding",
              "Lock raw-file ownership in the contract",
            ]}
            donts={[
              "Pay the full amount upfront",
              "Skip the engagement shoot test run",
              "Assume edits are unlimited",
              "Book based on Instagram alone",
            ]}
            bottomNote="screenshot before you sign anything"
          />
        ),
      },
    ],
  },
  {
    number: "Series 15",
    title: (
      <>
        The Marigold <i style={{ color: "var(--hot-pink)" }}>Platform</i>
      </>
    ),
    description:
      "The conversion series. Showcases the actual wedding planning software — feature drops, walkthroughs, before/after comparisons, and verified user testimonials. Pink-dominant grid color. The series that drives signups and product awareness.",
    items: [
      {
        format: "post" as const,
        filename: "platform-feature-drop",
        templateSlug: "platform-feature-drop-post",
        label: "Feature Drop",
        node: (
          <FeatureDropPost
            featureLabel="new"
            featureName="The Vendor Brief Builder"
            benefits={[
              "Pre-filled briefs by vendor category",
              "Reference photos, hex codes, and budget in one doc",
              "One-click share — no more 14 WhatsApp groups",
            ]}
            annotation="your vendors will actually cry happy tears"
            ctaText="Try it free"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-before-after",
        templateSlug: "platform-before-after-post",
        label: "Before / After",
        node: (
          <BeforeAfterPost
            beforeItems={[
              "47 browser tabs",
              "3am panic",
              "WhatsApp chaos",
              "Spreadsheet hell",
              "Pinterest screenshots in Notes",
              "Vendor emails buried in inbox",
              "Lost the contract again",
            ]}
            afterItems={[
              "one platform",
              "you slept 8 hours",
              "every vendor in one place",
              "the timeline builds itself",
              "moodboards by event",
              "contracts you can find",
            ]}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-how-it-works-cover",
        templateSlug: "platform-how-it-works-carousel",
        label: "How It Works — Cover",
        node: (
          <HowItWorksCarousel
            steps={PLATFORM_HOW_IT_WORKS_DEMO}
            slideIndex={0}
            ctaText="Get started free"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-how-it-works-step-1",
        templateSlug: "platform-how-it-works-carousel",
        label: "How It Works — Step 1",
        node: (
          <HowItWorksCarousel
            steps={PLATFORM_HOW_IT_WORKS_DEMO}
            slideIndex={1}
            ctaText="Get started free"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-how-it-works-step-2",
        templateSlug: "platform-how-it-works-carousel",
        label: "How It Works — Step 2",
        node: (
          <HowItWorksCarousel
            steps={PLATFORM_HOW_IT_WORKS_DEMO}
            slideIndex={2}
            ctaText="Get started free"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-how-it-works-step-3",
        templateSlug: "platform-how-it-works-carousel",
        label: "How It Works — Step 3",
        node: (
          <HowItWorksCarousel
            steps={PLATFORM_HOW_IT_WORKS_DEMO}
            slideIndex={3}
            ctaText="Get started free"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-how-it-works-step-4",
        templateSlug: "platform-how-it-works-carousel",
        label: "How It Works — Step 4",
        node: (
          <HowItWorksCarousel
            steps={PLATFORM_HOW_IT_WORKS_DEMO}
            slideIndex={4}
            ctaText="Get started free"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-how-it-works-close",
        templateSlug: "platform-how-it-works-carousel",
        label: "How It Works — Close",
        node: (
          <HowItWorksCarousel
            steps={PLATFORM_HOW_IT_WORKS_DEMO}
            slideIndex={5}
            ctaText="Get started free"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-vs-old-way",
        templateSlug: "platform-vs-old-way-post",
        label: "Marigold vs. Old Way",
        node: (
          <MarigoldVsOldWayPost
            comparisons={[
              { oldWay: "Scattered Pinterest boards", newWay: "One Moodboard per event" },
              { oldWay: "47-tab WhatsApp groups", newWay: "Vendor threads in one place" },
              { oldWay: "Random spreadsheet for budget", newWay: "Live budget tracker with line items" },
              { oldWay: "Trying to remember who agreed to what", newWay: "Decisions logged with timestamps" },
              { oldWay: "Three different to-do apps", newWay: "582-task checklist tied to your date" },
              { oldWay: "Pdf'd contracts in your downloads", newWay: "Vendor docs filed by event" },
              { oldWay: "Manually nagging RSVPs", newWay: "Automated guest reminders" },
              { oldWay: "A timeline you keep redoing", newWay: "Day-of timeline that auto-builds" },
            ]}
            tagline="your spreadsheet era is over"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "platform-testimonial",
        templateSlug: "platform-testimonial-post",
        label: "Testimonial",
        node: (
          <TestimonialPost
            testimonialText="The Marigold replaced four spreadsheets, three group chats, and one therapist. My mom even logs in now. Every vendor told me my brief was the most organized one they'd ever seen."
            rating={5}
            attribution="— P.K., December 2026 bride"
            isVerified
          />
        ),
      },
      {
        format: "story" as const,
        filename: "platform-stat-story",
        label: "Stat Story",
        node: (
          <PlatformStatStory
            statValue="2 minutes"
            statContext="TO SET UP YOUR WEDDING"
            supportingDetail="Your date, your events, your team — done before the kettle boils. The platform takes it from there."
            aside="less time than it takes to explain the guest list to your dad"
          />
        ),
      },
    ],
  },
  {
    number: "Bonus",
    title: (
      <>
        General Purpose <i style={{ color: "var(--pink)" }}>Templates</i>
      </>
    ),
    description:
      "Re-usable formats for the in-between weeks. Vendor quote postcard, feature callout for product moments, and a stat card for the data drops.",
    items: [
      {
        format: "post",
        filename: "vendor-quote",
        templateSlug: "vendor-quote",
        label: "Vendor Quote",
        node: (
          <VendorQuote
            quote="Your Pinterest board with 400 pins isn't a brief. It's a cry for help."
            attribution="— ANONYMOUS PHOTOGRAPHER"
            tagline="The Marigold turns 400 pins into one Brief."
            seriesLabel="Things Your Vendor Wishes You Knew"
          />
        ),
      },
      {
        format: "post",
        filename: "feature-callout",
        templateSlug: "feature-callout",
        label: "Feature Callout",
        node: (
          <FeatureCallout
            categoryLabel="DID YOU KNOW"
            headline="Your décor palette\nflows to *every*\nworkspace."
            annotation="stationery, wardrobe, cake — all synced"
            ctaText="EXPLORE WORKSPACES"
          />
        ),
      },
      {
        format: "story",
        filename: "stat-callout",
        label: "Stat Callout",
        node: (
          <StatCallout
            statNumber="582"
            statLabel="PLANNING TASKS"
            description={
              'From "discuss overall wedding vision" to "confirm the baraat horse." We thought of everything so you don\'t have to.'
            }
          />
        ),
      },
      {
        format: "story",
        filename: "ask-the-marigold-mil",
        label: "Ask The Marigold — MIL & 4-day wedding",
        node: (
          <AskTheMarigoldStory
            askerLabel="Anonymous DM"
            question="How do I tell my MIL we don't want a 4-day wedding without starting WW3?"
            answer="Don't lead with 'we don't want.' Lead with what you do want — one breathtaking day, fully present family, a budget that doesn't hurt. Frame the trim as devotion, not subtraction."
            annotations={[
              "say it on a walk, not at the dining table",
              "and bring her favorite chai",
            ]}
            ctaText="Ask us anything — DM or link in bio"
          />
        ),
      },
    ],
  },
  {
    number: "Series 16",
    title: (
      <>
        Bride <i style={{ color: "var(--mauve)" }}>Life</i>
      </>
    ),
    description:
      "The community series. Self-care, relationship dynamics, mental health, and post-wedding reality. Soft palettes, gentle typography — the content that builds deep loyalty by speaking to how planning FEELS, not how it gets done.",
    items: [
      {
        format: "post" as const,
        filename: "bride-life-self-care",
        templateSlug: "bride-life-self-care-post",
        label: "Self-Care Post",
        node: (
          <SelfCarePost
            title="5 Things to Do This Week That Aren't Wedding-Related"
            items={[
              { text: "Take a 20-minute walk with no podcast, no playlist.", icon: "walk" },
              { text: "Read 10 pages of a book that has nothing to do with weddings.", icon: "book" },
              { text: "Run a long bath. Phone on do-not-disturb. Door locked.", icon: "bath" },
              { text: "Call the friend you keep meaning to call back.", icon: "call" },
              { text: "Sit with a real coffee and notice the light. That's it.", icon: "coffee" },
            ]}
            bottomNote="the wedding will still be there tomorrow. your sanity might not be."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "bride-life-relationship-checkin",
        templateSlug: "bride-life-relationship-checkin",
        label: "Couple Check-In",
        node: (
          <RelationshipCheckInPost
            conversationPrompt="When was the last time we talked about something that wasn't the wedding?"
            activitySuggestion="Make a 30-minute dinner together, no phones, no spreadsheets, no vendor talk."
            annotation="marriage > wedding. always."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "bride-life-emotional-reality",
        templateSlug: "bride-life-emotional-reality",
        label: "Emotional Reality",
        node: (
          <EmotionalRealityPost
            topicTitle="Post-Wedding Blues Are Real"
            body="After 18 months of planning, the silence on the other side of the wedding can feel like a loss. The texts slow down. The group chat goes quiet. The thing that gave your weekends shape is suddenly over. That dip is real, and it doesn't mean you didn't love your wedding."
            signoff="you're not ungrateful. you're human. there's a difference."
          />
        ),
      },
      {
        format: "story" as const,
        filename: "bride-life-affirmation",
        label: "Affirmation Story",
        node: (
          <AffirmationStory
            affirmation="This wedding is yours. Not your mom's. Not Instagram's. Yours."
            gradientColors="blush-cream"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "bride-life-in-law-navigation",
        templateSlug: "bride-life-in-law-navigation",
        label: "In-Law Navigation",
        node: (
          <InLawNavigationPost
            situation="When your MIL wants to take over the décor"
            steps={[
              "Acknowledge the love behind the suggestion before responding to it. Most decor takeovers come from wanting to contribute.",
              "Loop your fiance in first. This is a team conversation, not a solo one — and the message lands softer when it comes from her son.",
              "Offer one specific corner she can fully own (the haldi setup, the welcome table) and hold the line on the rest. Calmly.",
            ]}
            note="diplomacy is an art. you're about to become Picasso."
          />
        ),
      },
    ],
  },
  {
    number: "Series 17",
    title: (
      <>
        Culture <i style={{ color: "var(--mauve)" }}>Corner</i>
      </>
    ),
    description:
      "Educational content explaining South Asian wedding traditions, regional differences, and cultural context. Serves brides learning about their own heritage and non-desi guests/partners who want to understand what's happening. Wine-dominant palette, mandala motif.",
    items: [
      {
        format: "post" as const,
        filename: "culture-tradition-explained",
        templateSlug: "tradition-explained-post",
        label: "Tradition Explained",
        node: (
          <TraditionExplainedPost
            traditionName="The Kanyadaan"
            meaning="The giving away of the bride by her father — a moment that signifies the merging of two families. Rooted in the Sanskrit kanya (daughter) and daan (gift), it is the most emotional ritual of a Hindu wedding ceremony."
            modernContext="many couples today have both parents perform the kanyadaan together — or skip it entirely."
            decorativeIcon="diya"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "culture-regional-spotlight-cover",
        templateSlug: "regional-spotlight-carousel",
        label: "Regional Spotlight — Cover",
        node: (
          <RegionalSpotlightCarousel
            regionName="The Punjabi Wedding"
            regionSubtitle="energy, emotion, and a LOT of dancing"
            regionColor="deep-pink"
            slideIndex={1}
            slides={CULTURE_REGIONAL_DEMO_SLIDES}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "culture-regional-spotlight-ceremonies",
        templateSlug: "regional-spotlight-carousel",
        label: "Regional Spotlight — Ceremonies",
        node: (
          <RegionalSpotlightCarousel
            regionName="The Punjabi Wedding"
            regionSubtitle="energy, emotion, and a LOT of dancing"
            regionColor="deep-pink"
            slideIndex={2}
            slides={CULTURE_REGIONAL_DEMO_SLIDES}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "culture-regional-spotlight-cta",
        templateSlug: "regional-spotlight-carousel",
        label: "Regional Spotlight — CTA",
        node: (
          <RegionalSpotlightCarousel
            regionName="The Punjabi Wedding"
            regionSubtitle="energy, emotion, and a LOT of dancing"
            regionColor="deep-pink"
            slideIndex={7}
            slides={CULTURE_REGIONAL_DEMO_SLIDES}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "culture-fusion-wedding",
        templateSlug: "fusion-wedding-post",
        label: "Fusion Wedding Guide",
        node: (
          <FusionWeddingPost
            tradition1="Hindu"
            tradition2="Catholic"
            color1="wine"
            color2="deep-pink"
            blendingTips={[
              "Pick one ceremony from each tradition — don't try to do all of them.",
              "Agree on the muhurat first, then the church time slots in.",
              "Brief both sets of family elders on the order of events together.",
              "Print a two-language program so guests can follow along.",
            ]}
            annotation="two families, two traditions, one (very long) ceremony"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "culture-family-roles",
        templateSlug: "family-roles-post",
        label: "Family Roles Guide",
        node: (
          <FamilyRolesPost
            guideTitle="The Extended Family Guide"
            subtitle="who's who at a desi wedding"
            roles={[
              {
                title: "The Mama",
                relationship: "maternal uncle",
                description: "Mom's brother. Will give a speech at the sangeet whether anyone asked or not.",
                annotation: "speech is non-negotiable",
              },
              {
                title: "The Bua",
                relationship: "paternal aunt",
                description: "Dad's sister. Has very specific opinions about the menu, the flowers, and the cousin's outfit.",
                annotation: "has opinions about the menu",
              },
              {
                title: "The Chacha",
                relationship: "paternal uncle (younger)",
                description: "Dad's younger brother. The cool uncle. Will sneak you the good whisky at the cocktail hour.",
                annotation: "the cool one. always.",
              },
              {
                title: "The Nani",
                relationship: "maternal grandmother",
                description: "Mom's mom. The matriarch. Will cry the moment you walk down the aisle. Bring a tissue.",
                annotation: "will cry. you will too.",
              },
              {
                title: "The Bhabhi",
                relationship: "elder brother's wife",
                description: "Your secret co-conspirator. Knows everything about everyone and shares strategically.",
                annotation: "your secret weapon",
              },
              {
                title: "The Saala",
                relationship: "wife's brother",
                description: "Bride's brother. Will steal the groom's shoes during joota chupai and demand a hefty ransom.",
                annotation: "stealing shoes since 1900",
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    number: "Series 18",
    title: (
      <>
        In <i style={{ color: "var(--mauve)" }}>Season</i>
      </>
    ),
    description:
      "Seasonal, timely, trend-driven content that keeps the feed current. Festival tie-ins, seasonal trend reports, wedding-season prep, and monthly roundups — content that says 'we're paying attention right now'.",
    items: [
      {
        format: "post" as const,
        filename: "in-season-trend-post",
        templateSlug: "in-season-trend-post",
        label: "Seasonal Trend Post",
        node: (
          <SeasonalTrendPost
            season="Winter"
            year="2026-27"
            backgroundColor="#2F5D4E"
            trends={[
              { trend: "Pastel sarees over heavy lehengas for day ceremonies", direction: "up" },
              { trend: "Custom dupatta calligraphy with the couple's vows", direction: "emerging" },
              { trend: "Live phulka and chaat counters at receptions", direction: "up" },
              { trend: "Coordinated grandparent looks at the sangeet", direction: "emerging" },
              { trend: "Heritage haveli venues over hotel ballrooms", direction: "steady" },
            ]}
            editorialTake="the season has a vibe. lean into it."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "in-season-festival-inspo",
        templateSlug: "in-season-festival-inspo-post",
        label: "Festival Inspo Post",
        node: (
          <FestivalInspoPost
            festivalName="Diwali-Inspired Décor"
            festivalColor="#D4A853"
            connections={[
              { festivalElement: "Diya arrangements", weddingApplication: "Reception table centerpieces" },
              { festivalElement: "Marigold torans at the door", weddingApplication: "Mandap entry archways" },
              { festivalElement: "Rangoli at the threshold", weddingApplication: "Welcome floor pattern at the venue" },
            ]}
            note="your mehndi night already has the Diwali energy built in."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "in-season-prep-cover",
        templateSlug: "in-season-prep-carousel",
        label: "Season Prep — Cover",
        node: (
          <WeddingSeasonPrepCarousel
            seasonName="Winter Wedding Season"
            seasonDates="November 2026 — February 2027"
            slideIndex={0}
            bookNow={{ items: [
              "Photographer (booked 6+ months out)",
              "Decorator with peak-season inventory",
              "Mehendi artist for the bridal slot",
              "Makeup artist for every event day",
            ]}}
            startNow={{ items: [
              "Lehenga consultations and first fittings",
              "Hotel block negotiations for guests",
              "Save-the-dates with travel info attached",
              "Skincare regimen with a real dermatologist",
            ]}}
            decideNow={{ items: [
              "The muhurat (long lead time with the pandit)",
              "Final venue + city (everyone else quotes from this)",
              "Wedding party — they need outfits too",
              "Honeymoon destination (visas take time)",
            ]}}
            relaxAbout={{ items: [
              "Favors and welcome bags — month-of is fine",
              "Final seating chart — wait for RSVPs",
              "Choreography polish — closer to sangeet day",
              "The exact playlist — DJs do this in week-of",
            ]}}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "in-season-prep-book-now",
        templateSlug: "in-season-prep-carousel",
        label: "Season Prep — Book Now",
        node: (
          <WeddingSeasonPrepCarousel
            seasonName="Winter Wedding Season"
            seasonDates="November 2026 — February 2027"
            slideIndex={1}
            bookNow={{ items: [
              "Photographer (booked 6+ months out)",
              "Decorator with peak-season inventory",
              "Mehendi artist for the bridal slot",
              "Makeup artist for every event day",
            ]}}
            startNow={{ items: ["", "", "", ""] }}
            decideNow={{ items: ["", "", "", ""] }}
            relaxAbout={{ items: ["", "", "", ""] }}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "in-season-prep-relax",
        templateSlug: "in-season-prep-carousel",
        label: "Season Prep — Relax About",
        node: (
          <WeddingSeasonPrepCarousel
            seasonName="Winter Wedding Season"
            seasonDates="November 2026 — February 2027"
            slideIndex={4}
            bookNow={{ items: ["", "", "", ""] }}
            startNow={{ items: ["", "", "", ""] }}
            decideNow={{ items: ["", "", "", ""] }}
            relaxAbout={{ items: [
              "Favors and welcome bags — month-of is fine",
              "Final seating chart — wait for RSVPs",
              "Choreography polish — closer to sangeet day",
              "The exact playlist — DJs do this in week-of",
            ]}}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "in-season-prep-cta",
        templateSlug: "in-season-prep-carousel",
        label: "Season Prep — CTA",
        node: (
          <WeddingSeasonPrepCarousel
            seasonName="Winter Wedding Season"
            seasonDates="November 2026 — February 2027"
            slideIndex={5}
            bookNow={{ items: ["", "", "", ""] }}
            startNow={{ items: ["", "", "", ""] }}
            decideNow={{ items: ["", "", "", ""] }}
            relaxAbout={{ items: ["", "", "", ""] }}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "in-season-monthly-roundup",
        label: "Monthly Roundup Story",
        node: (
          <MonthlyRoundupStory
            month="May"
            year="2026"
            items={[
              { text: "Trending: pastel sarees for day ceremonies", iconType: "trending" },
              { text: "Viral: that Rajasthani bride who arrived on a camel", iconType: "viral" },
              { text: "New on Marigold: the seating chart builder", iconType: "marigold" },
              { text: "Heads up: muhurat dates booking out for November", iconType: "alert" },
              { text: "On the calendar: peak sangeet weekends start mid-month", iconType: "calendar" },
            ]}
          />
        ),
      },
    ],
  },
  {
    number: "Series 19",
    title: (
      <>
        <i style={{ color: "var(--gold)" }}>Community</i>
      </>
    ),
    description:
      "User-generated content, community highlights, and audience participation. Real brides in the spotlight, audience polls, milestone celebrations, and submission CTAs — content that turns followers into advocates.",
    items: [
      {
        format: "post" as const,
        filename: "community-bride-of-the-week",
        templateSlug: "bride-of-the-week-post",
        label: "Bride of the Week",
        node: (
          <BrideOfTheWeekPost
            brideName="Meet Ananya"
            brideLocation="Delhi bride"
            weddingDate="December 2026"
            guestCount="400 guests"
            advice="Start saying no early. It gets easier."
            favoriteFeature="The Vendor Brief Builder"
          />
        ),
      },
      {
        format: "post" as const,
        filename: "community-poll-results",
        templateSlug: "poll-results-post",
        label: "Poll Results",
        node: (
          <PollResultsPost
            question="Live band or DJ at the sangeet?"
            optionA="Live band"
            optionAPercent={38}
            optionB="DJ"
            optionBPercent={62}
            totalVotes="2,847 votes"
            editorialComment="the people have spoken. and they're right."
          />
        ),
      },
      {
        format: "post" as const,
        filename: "community-milestone",
        templateSlug: "milestone-post",
        label: "Milestone Celebration",
        node: (
          <MilestonePost
            milestoneNumber="10,000"
            milestoneLabel="BRIDES IN THE MARIGOLD COMMUNITY"
            gratitudeMessage="every story, every screenshot, every late-night dm. thank you."
          />
        ),
      },
      {
        format: "story" as const,
        filename: "community-user-story-reel",
        label: "User Story Reel",
        node: (
          <UserStoryReelStaticPreview
            storyText="I almost called off the engagement three weeks before the wedding. Then my fiance learned my dad's chai recipe by heart. I knew, then. I knew."
            brideName="Priya"
            brideIdentifier="Bangalore bride, 2026"
            wordsPerMinute={120}
            freezeAt={0.45}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "community-submission-cta",
        label: "Submission CTA Story",
        node: (
          <SubmissionCTAStory
            seriesReference="THE CONFESSIONAL"
            callToAction="Share your story. We'll keep it anonymous."
            steps={[
              "Tap the link in our bio.",
              "Fill out the 4-question form. Takes 2 minutes.",
              "We'll DM you before we post — your name stays private.",
            ]}
            buttonText="link-in-bio"
          />
        ),
      },
    ],
  },
  {
    number: "Series 20",
    title: (
      <>
        Bride <i style={{ color: "var(--pink)" }}>Connect</i>
      </>
    ),
    description:
      "Marketing the bride-to-bride matchmaking feature — Hinge for brides. Profiles, matched duos, the explainer carousel, and the personal intro reel. Two jobs: make the community feel personal and alive, and drive signups for the matching feature.",
    items: [
      {
        format: "post" as const,
        filename: "bride-connect-match-profile",
        templateSlug: "bride-match-profile-post",
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
        format: "story" as const,
        filename: "bride-connect-match-profile-story",
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
                answer:
                  "warm, loud, and slightly chaotic — like my family group chat",
              },
              {
                question: "My biggest win so far is...",
                answer:
                  "negotiated my photographer down 30% on the second call",
              },
            ]}
          />
        ),
      },
      {
        format: "post" as const,
        filename: "bride-connect-matched-duo",
        templateSlug: "bride-match-duo-post",
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
        format: "post" as const,
        filename: `bride-connect-explainer-${slideIndex}`,
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
      {
        format: "story" as const,
        filename: "bride-connect-intro-reel",
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
    ],
  },
  {
    number: "Series 21",
    title: (
      <>
        Universal <i style={{ color: "var(--pink)" }}>Reel Library</i>
      </>
    ),
    description:
      "Reusable reel formats that any series can pull from. Zero filming required — every reel is text, supplied photos, or brand graphics. The Spotify-lyrics karaoke reel lives in the series-specific Confessional and Community sections; these are the broader formats that complement them.",
    items: [
      {
        format: "story" as const,
        filename: "universal-text-reveal-reel",
        label: "Text Reveal Reel (frozen at 55%)",
        node: (
          <TextRevealReelStaticPreview
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
            freezeAt={0.55}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "universal-list-countdown-reel",
        label: "List Countdown Reel (frozen at #1)",
        node: (
          <ListCountdownReelStaticPreview
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
            freezeAt={0.85}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "universal-before-after-reel",
        label: "Before / After Reel (mid-transition)",
        node: (
          <BeforeAfterReelStaticPreview
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
            freezeAt={0.55}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "universal-photo-montage-reel",
        label: "Photo Montage Reel (slide 1 frozen)",
        node: (
          <PhotoMontageReelStaticPreview
            slides={[
              {
                imageUrl: "",
                caption: "the moment the mehndi sets in",
                kenBurnsDirection: "zoom-in",
              },
              {
                imageUrl: "",
                caption: "the haldi paste, the giggling, the stains",
                kenBurnsDirection: "pan-left",
              },
              {
                imageUrl: "",
                caption: "every flower, every diya, every detail",
                kenBurnsDirection: "zoom-out",
              },
              {
                imageUrl: "",
                caption: "and then — the bride walks in",
                kenBurnsDirection: "zoom-in",
              },
            ]}
            ctaText="Plan yours on The Marigold."
            overlayStyle="bottom-strip"
            freezeAt={0.2}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "universal-fact-stack-reel",
        label: "Fact Stack Reel (fact 2 frozen)",
        node: (
          <FactStackReelStaticPreview
            facts={[
              { statValue: "582", statContext: "tasks tracked across every desi wedding" },
              { statValue: "13", statContext: "phases from engagement to vidaai" },
              { statValue: "47", statContext: "vendor categories — yes, all of them" },
              { statValue: "7", statContext: "events, one timeline" },
              { statValue: "1", statContext: "platform that gets it" },
            ]}
            ctaText="The Marigold — every number, every detail."
            freezeAt={0.3}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "universal-quote-scroll-reel",
        label: "Quote Scroll Reel (mid-scroll)",
        node: (
          <QuoteScrollReelStaticPreview
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
                text: "Caterers will lie to your face about leftovers. Get it in the contract.",
                attribution: "Meera, Bangalore caterer",
              },
              {
                text: "If your makeup artist won't do a trial, walk away.",
                attribution: "Naina, Pune MUA",
              },
              {
                text: "Pay the DJ for an extra hour. Always.",
                attribution: "Vikram, Hyderabad DJ",
              },
            ]}
            ctaText="Vendors who get it — on The Marigold."
            freezeAt={0.45}
          />
        ),
      },
      {
        format: "story" as const,
        filename: "universal-split-screen-talk-reel",
        label: "Split Screen Talk Reel (mid-exchange)",
        node: (
          <SplitScreenTalkReelStaticPreview
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
            freezeAt={0.55}
          />
        ),
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Series metadata — the series numbers in SERIES[] map to slugs/purposes that
// drive the sidebar nav, filter pills, and "Use This Template" modal preset.
// ---------------------------------------------------------------------------

type SeriesPurpose =
  | "engagement"
  | "value"
  | "awareness"
  | "community"
  | "conversion"
  | "ugc";

type GalleryPillar = "engage" | "educate" | "inspire" | "connect" | "convert";

type ContentKind = "post" | "story" | "reel" | "carousel";

interface SeriesMeta {
  slug: string;
  purpose: SeriesPurpose;
  pillar: GalleryPillar;
}

const SERIES_META: Record<string, SeriesMeta> = {
  "Series 01": { slug: "bridezilla-vs-momzilla", purpose: "engagement", pillar: "engage" },
  "Series 02": { slug: "confessional", purpose: "ugc", pillar: "engage" },
  "Series 03": { slug: "discover-your", purpose: "engagement", pillar: "engage" },
  "Series 04": { slug: "this-or-that", purpose: "engagement", pillar: "engage" },
  "Series 05": { slug: "the-countdown", purpose: "awareness", pillar: "educate" },
  "Series 06": { slug: "mood-board", purpose: "awareness", pillar: "inspire" },
  "Series 07": { slug: "vendor-spotlight", purpose: "awareness", pillar: "convert" },
  "Series 08": { slug: "hot-takes", purpose: "engagement", pillar: "engage" },
  "Series 09": { slug: "venue-spotlight", purpose: "awareness", pillar: "inspire" },
  "Series 10": { slug: "planner-spotlight", purpose: "awareness", pillar: "convert" },
  "Series 11": { slug: "the-marigold-edit", purpose: "value", pillar: "inspire" },
  "Series 12": { slug: "real-bride-diaries", purpose: "engagement", pillar: "connect" },
  "Series 13": { slug: "budget-breakdown", purpose: "value", pillar: "educate" },
  "Series 14": { slug: "planning-101", purpose: "value", pillar: "educate" },
  "Series 15": { slug: "marigold-platform", purpose: "conversion", pillar: "convert" },
  Bonus: { slug: "general-purpose", purpose: "awareness", pillar: "engage" },
  "Series 16": { slug: "bride-life", purpose: "community", pillar: "connect" },
  "Series 17": { slug: "culture-corner", purpose: "value", pillar: "educate" },
  "Series 18": { slug: "in-season", purpose: "awareness", pillar: "inspire" },
  "Series 19": { slug: "community", purpose: "community", pillar: "connect" },
  "Series 20": { slug: "bride-connect", purpose: "community", pillar: "connect" },
  "Series 21": { slug: "marigold-platform", purpose: "value", pillar: "convert" },
};

const PILLAR_INFO: Record<GalleryPillar, {
  name: string;
  tagline: string;
  color: string;
  description: string;
}> = {
  engage: {
    name: "Engage",
    tagline: "Spark conversation. Earn taps, comments, and shares.",
    color: "var(--pillar-engage)",
    description: "Content that gets people talking, commenting, tagging friends, tapping polls, and sharing.",
  },
  educate: {
    name: "Educate",
    tagline: "Teach the thing. Earn the screenshot, the save, the share.",
    color: "var(--pillar-educate)",
    description: "Content that teaches, informs, and gets saved. The “I need to screenshot this” content.",
  },
  inspire: {
    name: "Inspire",
    tagline: "Make the feed gorgeous. Aspirational, mood-led, image-first.",
    color: "var(--pillar-inspire)",
    description: "Content that's beautiful, aspirational, and makes the feed gorgeous.",
  },
  connect: {
    name: "Connect",
    tagline: "Build the community. Spotlight brides, invite belonging.",
    color: "var(--pillar-connect)",
    description: "Content that builds community and makes followers feel like they belong.",
  },
  convert: {
    name: "Convert",
    tagline: "Drive the signup. Position The Marigold as the answer.",
    color: "var(--pillar-convert)",
    description: "Content that drives signups, awareness, and positions The Marigold as the solution.",
  },
};

const PILLAR_ORDER: GalleryPillar[] = [
  "engage",
  "educate",
  "inspire",
  "connect",
  "convert",
];

const CAROUSEL_GROUPS: Array<{ pattern: RegExp; id: string; label: string }> = [
  { pattern: /^countdown-carousel-/, id: "countdown-carousel", label: "12-Month Countdown" },
  { pattern: /^vendor-tip-carousel-/, id: "vendor-tip-carousel", label: "Vendor Tips" },
  { pattern: /^planner-tips-carousel-/, id: "planner-tips-carousel", label: "Planner Tips" },
  { pattern: /^hot-takes-carousel-/, id: "hot-takes-carousel", label: "Hot Takes" },
  { pattern: /^venue-style-guide-/, id: "venue-style-guide", label: "Venue Style Guide" },
  { pattern: /^platform-how-it-works-/, id: "platform-how-it-works", label: "How It Works" },
  { pattern: /^in-season-prep-/, id: "in-season-prep", label: "Wedding Season Prep" },
  { pattern: /^culture-regional-spotlight-/, id: "culture-regional-spotlight", label: "Regional Spotlight" },
  { pattern: /^event-breakdown-mehndi-/, id: "event-breakdown-mehndi", label: "Mehndi Breakdown" },
  { pattern: /^edit-top-picks-/, id: "edit-top-picks", label: "Editor's Top Picks" },
  { pattern: /^budget-tips-/, id: "budget-tips", label: "Budget Tips" },
  { pattern: /^bride-connect-explainer/, id: "bride-connect-explainer", label: "Bride Connect Explainer" },
];

function detectCarousel(filename: string): { id: string; label: string } | null {
  for (const g of CAROUSEL_GROUPS) {
    if (g.pattern.test(filename)) return { id: g.id, label: g.label };
  }
  return null;
}

function detectKind(filename: string, format: TemplateFormat): ContentKind {
  if (filename.includes("reel")) return "reel";
  if (detectCarousel(filename)) return "carousel";
  return format;
}

function slugifyId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Walk template-definitions.json once to build a longest-prefix lookup. For a
// filename like "bvm-story-guest-list" this resolves to the "bvm-story" tem-
// plate. Items whose filename doesn't prefix-match any template get undefined
// — the "Use This Template" modal will then ask the user to pick.
const TEMPLATE_SLUG_PREFIXES = (() => {
  return loadTemplateDefinitions()
    .map((t) => t.slug)
    .sort((a, b) => b.length - a.length);
})();

const FILENAME_TEMPLATE_OVERRIDES: Record<string, string> = {
  "confessional-01-blush": "confessional-card",
  "confessional-02-gold": "confessional-card",
  "confessional-03-lavender": "confessional-card",
  "confessional-karaoke-reel": "confessional-reel",
  "diary-reel-muhurat-text": "diary-reel-muhurat",
};

function deriveTemplateSlug(filename: string): string | undefined {
  if (FILENAME_TEMPLATE_OVERRIDES[filename]) {
    return FILENAME_TEMPLATE_OVERRIDES[filename];
  }
  for (const slug of TEMPLATE_SLUG_PREFIXES) {
    if (filename === slug || filename.startsWith(slug + "-")) {
      return slug;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Section grouping — split a series' items into Posts / Stories / Reels /
// Carousels. Carousel slides are bundled into a single CarouselCard each.
// ---------------------------------------------------------------------------

interface BucketedItem {
  kind: ContentKind;
  format: TemplateFormat;
  filename: string;
  label: string;
  node: ReactNode;
  templateSlug?: string;
}

interface CarouselBucket {
  id: string;
  label: string;
  slides: CarouselSlide[];
}

interface SeriesBuckets {
  posts: BucketedItem[];
  stories: BucketedItem[];
  reels: BucketedItem[];
  carousels: CarouselBucket[];
}

function bucketItems(items: SeriesItem[]): SeriesBuckets {
  const posts: BucketedItem[] = [];
  const stories: BucketedItem[] = [];
  const reels: BucketedItem[] = [];
  const carouselMap = new Map<string, CarouselBucket>();

  for (const item of items) {
    const carousel = detectCarousel(item.filename);
    const kind = detectKind(item.filename, item.format);
    // Prefer the explicit templateSlug on the item; fall back to filename-based derivation.
    const templateSlug = item.templateSlug ?? deriveTemplateSlug(item.filename);

    if (carousel) {
      let bucket = carouselMap.get(carousel.id);
      if (!bucket) {
        bucket = { id: carousel.id, label: carousel.label, slides: [] };
        carouselMap.set(carousel.id, bucket);
      }
      bucket.slides.push({
        format: item.format,
        filename: item.filename,
        label: item.label,
        node: item.node,
        templateSlug,
      });
      continue;
    }

    const bucketed: BucketedItem = {
      kind,
      format: item.format,
      filename: item.filename,
      label: item.label,
      node: item.node,
      templateSlug,
    };

    if (kind === "reel") reels.push(bucketed);
    else if (item.format === "story") stories.push(bucketed);
    else posts.push(bucketed);
  }

  return {
    posts,
    stories,
    reels,
    carousels: Array.from(carouselMap.values()),
  };
}

function contentTypesForSeries(buckets: SeriesBuckets): ContentKind[] {
  const types: ContentKind[] = [];
  if (buckets.posts.length) types.push("post");
  if (buckets.stories.length) types.push("story");
  if (buckets.reels.length) types.push("reel");
  if (buckets.carousels.length) types.push("carousel");
  return types;
}

// ---------------------------------------------------------------------------
// Search + filter helpers
// ---------------------------------------------------------------------------

interface FilterState {
  query: string;
  kinds: Set<ContentKind>;
  purposes: Set<SeriesPurpose>;
  pillar: GalleryPillar | null;
}

function seriesMatchesFilter(
  number: string,
  titleText: string,
  description: string,
  buckets: SeriesBuckets,
  filter: FilterState,
): boolean {
  const meta = SERIES_META[number];
  const purpose = meta?.purpose;
  const pillar = meta?.pillar;

  if (filter.pillar && pillar !== filter.pillar) {
    return false;
  }

  if (filter.purposes.size > 0 && (!purpose || !filter.purposes.has(purpose))) {
    return false;
  }

  if (filter.kinds.size > 0) {
    const types = contentTypesForSeries(buckets);
    if (!types.some((k) => filter.kinds.has(k))) return false;
  }

  if (filter.query.trim()) {
    const q = filter.query.trim().toLowerCase();
    const hay = [
      number,
      titleText,
      description,
      ...buckets.posts.map((b) => `${b.label} ${b.filename}`),
      ...buckets.stories.map((b) => `${b.label} ${b.filename}`),
      ...buckets.reels.map((b) => `${b.label} ${b.filename}`),
      ...buckets.carousels.flatMap((c) =>
        c.slides.map((s) => `${s.label} ${s.filename}`),
      ),
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const seriesNumberStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 5,
  color: "var(--pink)",
  marginBottom: 8,
};

const seriesTitleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 48,
  color: "var(--wine)",
  lineHeight: 1.05,
  marginBottom: 12,
};

const seriesDescriptionStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 15,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 720,
};

const subSectionLabelStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 3,
  color: "var(--pink)",
  marginTop: 24,
  marginBottom: 12,
};

const itemRowStyle: CSSProperties = {
  display: "flex",
  gap: 32,
  flexWrap: "nowrap",
  alignItems: "flex-start",
  overflowX: "auto",
  paddingTop: 12,
  paddingBottom: 24,
};

function badgeStyle(kind: ContentKind): CSSProperties {
  const map: Record<ContentKind, { bg: string; fg: string }> = {
    post: { bg: "var(--blush)", fg: "var(--wine)" },
    story: { bg: "var(--lavender)", fg: "var(--wine)" },
    reel: { bg: "var(--hot-pink)", fg: "var(--cream)" },
    carousel: { bg: "var(--gold)", fg: "var(--wine)" },
  };
  const c = map[kind];
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    padding: "4px 10px",
    background: c.bg,
    color: c.fg,
    borderRadius: 999,
  };
}

const KIND_OPTIONS: { kind: ContentKind; label: string }[] = [
  { kind: "post", label: "Post" },
  { kind: "story", label: "Story" },
  { kind: "reel", label: "Reel" },
  { kind: "carousel", label: "Carousel" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface UseTemplateState {
  open: boolean;
  seriesSlug: string;
  templateSlug?: string;
  templateName: string;
}

export default function GalleryPage() {
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<Set<ContentKind>>(new Set());
  const [purposes, setPurposes] = useState<Set<SeriesPurpose>>(new Set());
  const [activePillar, setActivePillar] = useState<GalleryPillar | null>(null);
  const [showBySeries, setShowBySeries] = useState(false);
  const [templateModal, setUseTemplateState] = useState<UseTemplateState>({
    open: false,
    seriesSlug: "",
    templateSlug: undefined,
    templateName: "",
  });

  const filter: FilterState = useMemo(
    () => ({ query, kinds, purposes, pillar: activePillar }),
    [query, kinds, purposes, activePillar],
  );

  const enriched = useMemo(() => {
    return SERIES.map((series) => {
      const buckets = bucketItems(series.items);
      const meta = SERIES_META[series.number];
      const id = `series-${slugifyId(series.number)}`;
      const titleText =
        typeof series.title === "string"
          ? series.title
          : extractText(series.title);
      return { series, buckets, meta, id, titleText };
    });
  }, []);

  const filtered = useMemo(() => {
    return enriched.filter((e) =>
      seriesMatchesFilter(
        e.series.number,
        e.titleText,
        e.series.description,
        e.buckets,
        filter,
      ),
    );
  }, [enriched, filter]);

  const groupedByPillar = useMemo(() => {
    const groups = new Map<GalleryPillar, typeof filtered>();
    for (const pillar of PILLAR_ORDER) groups.set(pillar, []);
    for (const entry of filtered) {
      const pillar = entry.meta?.pillar ?? "engage";
      groups.get(pillar)!.push(entry);
    }
    return groups;
  }, [filtered]);

  const navEntries: SeriesNavEntry[] = PILLAR_ORDER
    .filter((p) => (groupedByPillar.get(p)?.length ?? 0) > 0)
    .map((p) => ({
      id: `pillar-${p}`,
      number: PILLAR_INFO[p].name,
      title: `${groupedByPillar.get(p)?.length ?? 0} series`,
    }));

  function toggleKind(kind: ContentKind) {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  function openUseTemplate(info: {
    templateSlug?: string;
    seriesSlug?: string;
    templateName: string;
  }) {
    if (!info.seriesSlug) return;
    setUseTemplateState({
      open: true,
      seriesSlug: info.seriesSlug,
      templateSlug: info.templateSlug,
      templateName: info.templateName,
    });
  }

  return (
    <div className="marigold-page-pad" style={pageWrapperStyle}>
      <div style={layoutStyle}>
        <SeriesNavSidebar entries={navEntries} />

        <main style={mainStyle}>
          <header style={{ marginBottom: 36 }}>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 6,
                color: "var(--pink)",
                marginBottom: 12,
              }}
            >
              THE MARIGOLD CONTENT STUDIO
            </div>
            <h1
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 80,
                color: "var(--wine)",
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              Template <i style={{ color: "var(--hot-pink)" }}>Gallery</i>
            </h1>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 17,
                color: "var(--mauve)",
                lineHeight: 1.6,
                maxWidth: 720,
                marginBottom: 24,
              }}
            >
              Every Instagram template in the system, rendered with sample copy
              and grouped by Content Pillar. Hit{" "}
              <span style={{ color: "var(--wine)", fontWeight: 600 }}>
                Export PNG
              </span>
              ,{" "}
              <span style={{ color: "var(--hot-pink)", fontWeight: 600 }}>
                Use this template
              </span>{" "}
              to start a new calendar item, or{" "}
              <span style={{ color: "var(--wine)", fontWeight: 600 }}>
                Customize sample
              </span>{" "}
              to riff on the copy in place.
            </p>

            <div style={searchRowStyle}>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates, series, or sample copy…"
                style={searchInputStyle}
              />
            </div>

            <div style={pillRowStyle}>
              <span style={pillLabelStyle}>Format</span>
              {KIND_OPTIONS.map((k) => (
                <FilterPill
                  key={k.kind}
                  active={kinds.has(k.kind)}
                  onClick={() => toggleKind(k.kind)}
                >
                  {k.label}
                </FilterPill>
              ))}
            </div>

            <div style={pillRowStyle}>
              <span style={pillLabelStyle}>Pillar</span>
              {PILLAR_ORDER.map((p) => {
                const info = PILLAR_INFO[p];
                const active = activePillar === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      setActivePillar(activePillar === p ? null : p)
                    }
                    style={pillarTabStyle(active, info.color)}
                  >
                    <span style={pillarTabDotStyle(info.color, active)} />
                    {info.name}
                  </button>
                );
              })}
              <label style={byseriesToggleStyle}>
                <input
                  type="checkbox"
                  checked={showBySeries}
                  onChange={(e) => setShowBySeries(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Show by series
              </label>
              {(kinds.size > 0 ||
                purposes.size > 0 ||
                query ||
                activePillar) && (
                <button
                  type="button"
                  onClick={() => {
                    setKinds(new Set());
                    setPurposes(new Set());
                    setQuery("");
                    setActivePillar(null);
                  }}
                  style={clearBtnStyle}
                >
                  Clear all
                </button>
              )}
            </div>
          </header>

          {filtered.length === 0 && (
            <div style={emptyStateStyle}>
              <p style={emptyMessageStyle}>
                Nothing matches those filters yet — try clearing one or
                searching for a softer keyword.
              </p>
            </div>
          )}

          {PILLAR_ORDER.map((pillarKey) => {
            const groupEntries = groupedByPillar.get(pillarKey) ?? [];
            if (groupEntries.length === 0) return null;
            const info = PILLAR_INFO[pillarKey];
            return (
              <section
                key={`pillar-${pillarKey}`}
                id={`pillar-${pillarKey}`}
                style={pillarSectionStyle}
              >
                <header style={pillarHeaderStyle(info.color)}>
                  <div style={pillarKickerStyle(info.color)}>
                    <span style={pillarKickerDotStyle(info.color)} />
                    PILLAR
                  </div>
                  <h2 style={pillarTitleStyle}>
                    {info.name}{" "}
                    <i style={{ color: info.color, fontStyle: "italic" }}>
                      ·
                    </i>
                  </h2>
                  <p style={pillarTaglineStyle}>{info.tagline}</p>
                  <p style={pillarDescriptionStyle}>{info.description}</p>
                  <div style={pillarMetaStyle}>
                    {groupEntries.length} series ·{" "}
                    {groupEntries.reduce(
                      (sum, e) =>
                        sum +
                        e.buckets.posts.length +
                        e.buckets.stories.length +
                        e.buckets.reels.length +
                        e.buckets.carousels.length,
                      0,
                    )}{" "}
                    templates
                  </div>
                </header>
                {!showBySeries ? (
                  <div style={pillarFlatGridStyle}>
                    {groupEntries.flatMap(({ series, buckets, meta }) => {
                      const seriesSlug = meta?.slug ?? "";
                      const seriesName =
                        typeof series.title === "string"
                          ? series.title
                          : extractText(series.title);
                      const onUseTemplate = (info: {
                        templateSlug?: string;
                        seriesSlug?: string;
                        templateName: string;
                      }) =>
                        openUseTemplate({
                          templateSlug: info.templateSlug,
                          seriesSlug: info.seriesSlug ?? seriesSlug,
                          templateName: info.templateName,
                        });
                      return (
                        <FlatPillarItems
                          key={series.number}
                          series={series}
                          buckets={buckets}
                          seriesSlug={seriesSlug}
                          seriesName={seriesName}
                          onUseTemplate={onUseTemplate}
                        />
                      );
                    })}
                  </div>
                ) : (
                  groupEntries.map(({ series, buckets, meta, id }) => {
                    return renderSeriesSection({
                      series,
                      buckets,
                      meta,
                      id,
                      openUseTemplate,
                    });
                  })
                )}
              </section>
            );
          })}

          {/* Legacy per-series-only renderer kept for reference; not rendered */}
          {false && filtered.map(({ series, buckets, meta, id }) => {
            const types = contentTypesForSeries(buckets);
            const seriesSlug = meta?.slug ?? "";
            const onUseTemplate = (info: {
              templateSlug?: string;
              seriesSlug?: string;
              templateName: string;
            }) =>
              openUseTemplate({
                templateSlug: info.templateSlug,
                seriesSlug: info.seriesSlug ?? seriesSlug,
                templateName: info.templateName,
              });

            return (
              <section key={series.number} id={id} style={sectionStyle}>
                <div style={seriesNumberStyle}>{series.number}</div>
                <h2 style={seriesTitleStyle}>{series.title}</h2>
                <p style={seriesDescriptionStyle}>{series.description}</p>

                <div style={badgeRowStyle}>
                  {types.map((t) => (
                    <span key={t} style={badgeStyle(t)}>
                      {t}
                    </span>
                  ))}
                  {meta?.purpose && (
                    <span style={purposeBadgeStyle}>{meta.purpose}</span>
                  )}
                </div>

                {buckets.posts.length > 0 && (
                  <>
                    <div style={subSectionLabelStyle}>
                      Posts · {buckets.posts.length}
                    </div>
                    <div style={itemRowStyle}>
                      {buckets.posts.map((item) => (
                        <GalleryItem
                          key={item.filename}
                          format={item.format}
                          filename={item.filename}
                          label={item.label}
                          kind="post"
                          templateSlug={item.templateSlug}
                          seriesSlug={seriesSlug}
                          onUseTemplate={onUseTemplate}
                        >
                          {item.node}
                        </GalleryItem>
                      ))}
                    </div>
                  </>
                )}

                {buckets.stories.length > 0 && (
                  <>
                    <div style={subSectionLabelStyle}>
                      Stories · {buckets.stories.length}
                    </div>
                    <div style={itemRowStyle}>
                      {buckets.stories.map((item) => (
                        <GalleryItem
                          key={item.filename}
                          format={item.format}
                          filename={item.filename}
                          label={item.label}
                          kind="story"
                          templateSlug={item.templateSlug}
                          seriesSlug={seriesSlug}
                          onUseTemplate={onUseTemplate}
                        >
                          {item.node}
                        </GalleryItem>
                      ))}
                    </div>
                  </>
                )}

                {buckets.reels.length > 0 && (
                  <>
                    <div style={subSectionLabelStyle}>
                      Reels · {buckets.reels.length}
                    </div>
                    <div style={itemRowStyle}>
                      {buckets.reels.map((item) => (
                        <GalleryItem
                          key={item.filename}
                          format={item.format}
                          filename={item.filename}
                          label={item.label}
                          kind="reel"
                          templateSlug={item.templateSlug}
                          seriesSlug={seriesSlug}
                          onUseTemplate={onUseTemplate}
                        >
                          {item.node}
                        </GalleryItem>
                      ))}
                    </div>
                  </>
                )}

                {buckets.carousels.length > 0 && (
                  <>
                    <div style={subSectionLabelStyle}>
                      Carousels · {buckets.carousels.length}
                    </div>
                    <div style={itemRowStyle}>
                      {buckets.carousels.map((carousel) => (
                        <CarouselCard
                          key={carousel.id}
                          title={carousel.label}
                          slides={carousel.slides}
                          seriesSlug={seriesSlug}
                          onUseTemplate={onUseTemplate}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })}

          <CreateTemplateConcept />
        </main>
      </div>

      <UseTemplateModal
        open={templateModal.open}
        seriesSlug={templateModal.seriesSlug}
        templateSlug={templateModal.templateSlug}
        templateName={templateModal.templateName}
        onClose={() =>
          setUseTemplateState((s) => ({ ...s, open: false }))
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (
    typeof node === "object" &&
    node !== null &&
    "props" in node &&
    typeof (node as { props?: { children?: ReactNode } }).props === "object"
  ) {
    return extractText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} style={filterPillStyle(active)}>
      {children}
    </button>
  );
}

const pageWrapperStyle: CSSProperties = {
  paddingTop: 24,
};

const layoutStyle: CSSProperties = {
  display: "flex",
  gap: 36,
  alignItems: "flex-start",
};

const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const sectionStyle: CSSProperties = {
  marginBottom: 64,
  paddingBottom: 36,
  borderBottom: "1px dashed rgba(75,21,40,0.12)",
  scrollMarginTop: 24,
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
};

const purposeBadgeStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.5,
  padding: "4px 10px",
  background: "transparent",
  color: "var(--mauve)",
  border: "1px solid rgba(75,21,40,0.25)",
  borderRadius: 999,
};

const searchRowStyle: CSSProperties = {
  marginBottom: 16,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  maxWidth: 560,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  padding: "12px 16px",
  background: "var(--cream)",
  border: "1px solid rgba(75,21,40,0.25)",
  borderRadius: 8,
  color: "var(--wine)",
};

const pillRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 10,
};

const pillLabelStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.8,
  color: "var(--mauve)",
  marginRight: 4,
};

function filterPillStyle(active: boolean): CSSProperties {
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    padding: "7px 14px",
    background: active ? "var(--wine)" : "transparent",
    color: active ? "var(--cream)" : "var(--wine)",
    border: "1px solid var(--wine)",
    borderRadius: 999,
    cursor: "pointer",
  };
}

const clearBtnStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  padding: "6px 10px",
  background: "transparent",
  color: "var(--deep-pink)",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
};

const emptyStateStyle: CSSProperties = {
  padding: 48,
  textAlign: "center",
  border: "1px dashed rgba(75,21,40,0.2)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.4)",
  marginTop: 24,
};

const emptyMessageStyle: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 22,
  color: "var(--mauve)",
  margin: 0,
};

// ---------------------------------------------------------------------------
// Pillar layout — section header, flat-grid renderer, by-series renderer.
// Pillars are the primary organizing principle; series are a sub-grouping.
// ---------------------------------------------------------------------------

const pillarSectionStyle: CSSProperties = {
  marginBottom: 80,
  scrollMarginTop: 24,
};

function pillarHeaderStyle(color: string): CSSProperties {
  return {
    padding: "32px 28px 28px",
    marginBottom: 32,
    background: "var(--cream)",
    borderRadius: 16,
    borderTop: `4px solid ${color}`,
    boxShadow: "0 1px 0 rgba(75,21,40,0.04)",
  };
}

function pillarKickerStyle(color: string): CSSProperties {
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 4,
    color: color,
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };
}

function pillarKickerDotStyle(color: string): CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: color,
    boxShadow: "inset 0 0 0 1px rgba(75,21,40,0.15)",
  };
}

const pillarTitleStyle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 56,
  color: "var(--wine)",
  lineHeight: 1.05,
  marginBottom: 8,
  margin: 0,
};

const pillarTaglineStyle: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 22,
  color: "var(--mauve)",
  margin: "8px 0 4px",
};

const pillarDescriptionStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--mauve)",
  lineHeight: 1.6,
  maxWidth: 720,
  marginTop: 6,
};

const pillarMetaStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.6,
  color: "var(--mauve)",
  marginTop: 14,
};

const pillarFlatGridStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 28,
};

function pillarTabStyle(active: boolean, color: string): CSSProperties {
  return {
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    padding: "6px 12px",
    background: active ? "var(--blush)" : "transparent",
    color: "var(--wine)",
    border: `2px solid ${active ? color : "rgba(75,21,40,0.18)"}`,
    borderRadius: 999,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    boxShadow: active ? `0 0 0 2px ${color}33` : "none",
    transition: "background 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
  };
}

function pillarTabDotStyle(color: string, active: boolean): CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    boxShadow: active ? "0 0 0 2px var(--wine)" : "none",
  };
}

const byseriesToggleStyle: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 12,
  color: "var(--wine)",
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
};

interface FlatPillarItemsProps {
  series: Series;
  buckets: SeriesBuckets;
  seriesSlug: string;
  seriesName: string;
  onUseTemplate: (info: {
    templateSlug?: string;
    seriesSlug?: string;
    templateName: string;
  }) => void;
}

function FlatPillarItems({
  buckets,
  seriesSlug,
  seriesName,
  onUseTemplate,
}: FlatPillarItemsProps) {
  return (
    <div>
      <div style={flatSeriesSubtitleStyle}>{seriesName}</div>
      <div style={itemRowStyle}>
        {buckets.posts.map((item) => (
          <GalleryItem
            key={item.filename}
            format={item.format}
            filename={item.filename}
            label={item.label}
            kind="post"
            templateSlug={item.templateSlug}
            seriesSlug={seriesSlug}
            onUseTemplate={onUseTemplate}
          >
            {item.node}
          </GalleryItem>
        ))}
        {buckets.stories.map((item) => (
          <GalleryItem
            key={item.filename}
            format={item.format}
            filename={item.filename}
            label={item.label}
            kind="story"
            templateSlug={item.templateSlug}
            seriesSlug={seriesSlug}
            onUseTemplate={onUseTemplate}
          >
            {item.node}
          </GalleryItem>
        ))}
        {buckets.reels.map((item) => (
          <GalleryItem
            key={item.filename}
            format={item.format}
            filename={item.filename}
            label={item.label}
            kind="reel"
            templateSlug={item.templateSlug}
            seriesSlug={seriesSlug}
            onUseTemplate={onUseTemplate}
          >
            {item.node}
          </GalleryItem>
        ))}
        {buckets.carousels.map((carousel) => (
          <CarouselCard
            key={carousel.id}
            title={carousel.label}
            slides={carousel.slides}
            seriesSlug={seriesSlug}
            onUseTemplate={onUseTemplate}
          />
        ))}
      </div>
    </div>
  );
}

const flatSeriesSubtitleStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 2,
  color: "var(--mauve)",
  marginBottom: 12,
};

interface RenderSeriesSectionArgs {
  series: Series;
  buckets: SeriesBuckets;
  meta: SeriesMeta | undefined;
  id: string;
  openUseTemplate: (info: {
    templateSlug?: string;
    seriesSlug?: string;
    templateName: string;
  }) => void;
}

function renderSeriesSection({
  series,
  buckets,
  meta,
  id,
  openUseTemplate,
}: RenderSeriesSectionArgs) {
  const types = contentTypesForSeries(buckets);
  const seriesSlug = meta?.slug ?? "";
  const onUseTemplate = (info: {
    templateSlug?: string;
    seriesSlug?: string;
    templateName: string;
  }) =>
    openUseTemplate({
      templateSlug: info.templateSlug,
      seriesSlug: info.seriesSlug ?? seriesSlug,
      templateName: info.templateName,
    });
  return (
    <section key={series.number} id={id} style={sectionStyle}>
      <div style={seriesNumberStyle}>{series.number}</div>
      <h3 style={seriesTitleStyle}>{series.title}</h3>
      <p style={seriesDescriptionStyle}>{series.description}</p>
      <div style={badgeRowStyle}>
        {types.map((t) => (
          <span key={t} style={badgeStyle(t)}>
            {t}
          </span>
        ))}
        {meta?.purpose && (
          <span style={purposeBadgeStyle}>{meta.purpose}</span>
        )}
      </div>
      {buckets.posts.length > 0 && (
        <>
          <div style={subSectionLabelStyle}>
            Posts · {buckets.posts.length}
          </div>
          <div style={itemRowStyle}>
            {buckets.posts.map((item) => (
              <GalleryItem
                key={item.filename}
                format={item.format}
                filename={item.filename}
                label={item.label}
                kind="post"
                templateSlug={item.templateSlug}
                seriesSlug={seriesSlug}
                onUseTemplate={onUseTemplate}
              >
                {item.node}
              </GalleryItem>
            ))}
          </div>
        </>
      )}
      {buckets.stories.length > 0 && (
        <>
          <div style={subSectionLabelStyle}>
            Stories · {buckets.stories.length}
          </div>
          <div style={itemRowStyle}>
            {buckets.stories.map((item) => (
              <GalleryItem
                key={item.filename}
                format={item.format}
                filename={item.filename}
                label={item.label}
                kind="story"
                templateSlug={item.templateSlug}
                seriesSlug={seriesSlug}
                onUseTemplate={onUseTemplate}
              >
                {item.node}
              </GalleryItem>
            ))}
          </div>
        </>
      )}
      {buckets.reels.length > 0 && (
        <>
          <div style={subSectionLabelStyle}>
            Reels · {buckets.reels.length}
          </div>
          <div style={itemRowStyle}>
            {buckets.reels.map((item) => (
              <GalleryItem
                key={item.filename}
                format={item.format}
                filename={item.filename}
                label={item.label}
                kind="reel"
                templateSlug={item.templateSlug}
                seriesSlug={seriesSlug}
                onUseTemplate={onUseTemplate}
              >
                {item.node}
              </GalleryItem>
            ))}
          </div>
        </>
      )}
      {buckets.carousels.length > 0 && (
        <>
          <div style={subSectionLabelStyle}>
            Carousels · {buckets.carousels.length}
          </div>
          <div style={itemRowStyle}>
            {buckets.carousels.map((carousel) => (
              <CarouselCard
                key={carousel.id}
                title={carousel.label}
                slides={carousel.slides}
                seriesSlug={seriesSlug}
                onUseTemplate={onUseTemplate}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
