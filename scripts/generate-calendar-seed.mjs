/**
 * Generates src/data/content-calendar-seed.json — 13 weeks of curated
 * content using the full template library (100+ templates, 21 series).
 *
 * Run with:  node scripts/generate-calendar-seed.mjs
 *
 * Strategy:
 *   1. Load template defs to discover editable_fields + their defaults.
 *      The shipped defaults are already on-brand copy, so we use them
 *      as the base layer and override only the per-episode unique fields.
 *   2. Walk a hand-authored 13-week SCHEDULE that obeys:
 *        - 5 feed posts + 1 carousel + 3-4 stories + 1-2 reels per week
 *        - no row of 3 grid posts has two of the same color profile
 *        - every 2 rows has at least one COLORFUL inspire anchor
 *        - pillar mix per week stays balanced
 *   3. Compute grid_position for posts/carousels in chronological order.
 *   4. Emit the seed JSON.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const templates = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/template-definitions.json"), "utf8"),
);
const series = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/content-series.json"), "utf8"),
);

const TEMPLATE_BY_SLUG = Object.fromEntries(templates.map((t) => [t.slug, t]));
const SERIES_BY_SLUG = Object.fromEntries(series.map((s) => [s.slug, s]));

// ---------------------------------------------------------------------------
// Color profile per template slug (drives grid aesthetics)
// ---------------------------------------------------------------------------

const COLOR_BY_TEMPLATE = {
  // SPLIT
  "bvm-post": "split",
  "tot-post": "split",
  "platform-before-after-post": "split",
  "platform-vs-old-way-post": "split",
  "cost-by-city-post": "split",
  "day-of-vs-full-planning-post": "split",
  "approval-matrix-post": "split",
  "venue-comparison-post": "split",
  // WINE
  "stat-callout": "wine",
  "did-you-know-post": "wine",
  "tradition-explained-post": "wine",
  "red-flags-post": "wine",
  "family-roles-post": "wine",
  "bride-life-emotional-reality": "wine",
  "budget-tips-carousel": "wine",
  "ceremony-guide-post": "wine",
  // PINK
  "feature-callout": "pink",
  "platform-feature-drop-post": "pink",
  "platform-how-it-works-carousel": "pink",
  "bride-life-self-care-post": "pink",
  "bride-connect-explainer-carousel": "pink",
  // CREAM
  "vendor-quote": "cream",
  "vendor-tip-carousel": "cream",
  "guest-management-post": "cream",
  "timeline-builder-post": "cream",
  "vendor-negotiation-post": "cream",
  "dos-and-donts-post": "cream",
  "real-numbers-post": "cream",
  "budget-reality-post": "cream",
  "planner-tips-carousel": "cream",
  "event-breakdown-carousel": "cream",
  "planner-advice-post": "cream",
  // GOLD
  "in-season-trend-post": "gold",
  "in-season-festival-inspo-post": "gold",
  "bride-of-the-week-post": "gold",
  "milestone-post": "gold",
  "edit-trending-now-post": "gold",
  "edit-top-picks-carousel": "gold",
  "budget-pie-post": "gold",
  // COLORFUL
  "lehenga-style-post": "colorful",
  "vendor-feature-post": "colorful",
  "venue-feature-post": "colorful",
  "venue-style-guide": "colorful",
  "planner-profile-post": "colorful",
  "edit-product-pick-post": "colorful",
  "regional-spotlight-carousel": "colorful",
  "fusion-wedding-post": "colorful",
  "in-season-prep-carousel": "colorful",
  "poll-results-post": "colorful",
  // BLUSH
  "bride-match-profile-post": "blush",
  "bride-match-duo-post": "blush",
  "platform-testimonial-post": "blush",
  "save-vs-splurge-post": "blush",
  "bride-life-relationship-checkin": "blush",
  "bride-life-in-law-navigation": "blush",
  "quiz-result-post": "blush",
};

// ---------------------------------------------------------------------------
// Content libraries — unique per-episode data
// ---------------------------------------------------------------------------

const BVM_EPISODES = [
  {
    topic: "Guest List Size",
    bride: "Let's keep it intimate. 200 max.",
    brideAnno: "she said, confidently",
    mom: "We have to invite the whole family. And dad's office.",
    momAnno: "and that's just dad's side",
    cta: "we have a tab for both of you",
  },
  {
    topic: "The Mehendi Theme",
    bride: "Garden party. Whites and yellows.",
    brideAnno: "Pinterest told her so",
    mom: "Why no marigolds? Are we being punished?",
    momAnno: "she has been waiting for this question",
    cta: "your moodboard, her marigolds — both fit",
  },
  {
    topic: "The Wedding Hashtag",
    bride: "Something cute. #PriyaPicksPrateek.",
    brideAnno: "she workshopped it for a week",
    mom: "Your father wants #ShahMeetsKapoor in 60-point font.",
    momAnno: "he has notes",
    cta: "we'll write the brief, you keep the peace",
  },
  {
    topic: "First Look Photos",
    bride: "We're doing a first look. It's intimate.",
    brideAnno: "she has the Pinterest board",
    mom: "Bad luck. Also, the elders won't approve.",
    momAnno: "the elders have many opinions",
    cta: "tradition or trend — we plan for both",
  },
  {
    topic: "The Bridal Lehenga Color",
    bride: "Pastel green. Trust me.",
    brideAnno: "she's seen it in 14 reels",
    mom: "Beta. Red. Always red.",
    momAnno: "this is non-negotiable",
    cta: "two outfits, two ceremonies, no fights",
  },
  {
    topic: "The Pre-Wedding Shoot",
    bride: "We're skipping the pre-wedding shoot.",
    brideAnno: "it feels cringe",
    mom: "Your cousin had one in Switzerland.",
    momAnno: "and this is your moment",
    cta: "we'll find a photographer who doesn't do cringe",
  },
  {
    topic: "The Sangeet Choreography",
    bride: "Mom please. No flash mob.",
    brideAnno: "she's begging",
    mom: "Your bua has been practicing for six months.",
    momAnno: "she will not be denied",
    cta: "the sangeet runs both routines — we'll keep them apart",
  },
  {
    topic: "The Welcome Bag",
    bride: "Just a bottle of water and granola.",
    brideAnno: "minimalist energy",
    mom: "How will guests know we love them?",
    momAnno: "love = laddoos, apparently",
    cta: "we'll source both, you'll send the brief",
  },
  {
    topic: "The Mandap Florals",
    bride: "Wildflowers. Loose. Asymmetric.",
    brideAnno: "she sent a moodboard",
    mom: "Where are the marigolds? It's a wedding.",
    momAnno: "the marigold debate, again",
    cta: "we brief both, the decorator delivers one",
  },
  {
    topic: "The Vidaai Music",
    bride: "Babul mora. Soft. Acoustic.",
    brideAnno: "she's been crying about it for weeks",
    mom: "Loud dhol. So everyone knows.",
    momAnno: "the whole society must hear",
    cta: "we run both — your tears, her dhol",
  },
  {
    topic: "The Honeymoon Plan",
    bride: "Two weeks in Japan. Just us.",
    brideAnno: "she has spreadsheets",
    mom: "Goa. So we can call you.",
    momAnno: "she means daily, hourly",
    cta: "your itinerary, her peace of mind",
  },
  {
    topic: "The After-Party Outfit",
    bride: "White slip dress. Sneakers. That's it.",
    brideAnno: "it's the mood",
    mom: "Sneakers? At a wedding? Are you being punished?",
    momAnno: "she's still recovering",
    cta: "the moodboard wins — we'll handle the explaining",
  },
];

const CONFESSIONS = [
  {
    text: "I told my mom the decorator was fully booked so she'd stop sending me mandap photos. The decorator was not booked.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "My MIL added 40 people to the guest list while I was on vacation. I found out from the caterer.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "I created a fake 'venue availability' email to convince my parents we couldn't do a Tuesday wedding.",
    attr: "— ANONYMOUS GROOM, 2025",
  },
  {
    text: "I've been hiding receipts from my fiancé. He's been hiding receipts from me. We are both broke.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "I let my chachi pick the mehendi artist because saying no would have started a feud. The mehendi was bad. The feud was avoided.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "I told my dad I couldn't change the date because of 'astrology'. The astrologer was my best friend reading a wikipedia article.",
    attr: "— ANONYMOUS BRIDE, 2025",
  },
  {
    text: "I 'lost' my mom's lehenga in the courier so I could pick a new color. We were the courier.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "My in-laws asked for the guest list. I sent them a redacted PDF. They have not noticed.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "I told the planner my mom was the decision-maker. I told my mom the planner was the decision-maker. We are 4 months in. It's working.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "I lied about my budget by 15 lakhs. To both sides. The vendors know.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
  {
    text: "My fiancé proposed in October. We told everyone November. Three weeks of peace was worth it.",
    attr: "— ANONYMOUS BRIDE, 2025",
  },
  {
    text: "I added a 'phone-free ceremony' rule because I didn't want my dadi's WhatsApp aunties tagged in everything.",
    attr: "— ANONYMOUS BRIDE, 2026",
  },
];

const VARIANT_CYCLE = ["blush", "gold", "lavender"];
const HIGHLIGHT_CYCLE = ["hot-pink", "gold", "lavender"];

const HOT_TAKES = [
  {
    lines: [
      "Everyone tells you",
      "the most important part of the wedding",
      "is the food, the décor, the photos…",
      "It's the planner. Hire the planner.",
      "",
    ],
    cta: "Bookmark hot takes on The Marigold.",
    gradient: "wine-to-blush",
    caption:
      "Unpopular opinion: the planner is the entire wedding. Fight us in the comments.",
  },
  {
    lines: [
      "Your wedding hashtag",
      "is for you and three friends.",
      "Nobody is searching it.",
      "Spend that energy on the brief instead.",
      "",
    ],
    cta: "We write briefs that actually move things.",
    gradient: "blush-to-cream",
    caption:
      "Hot take: the hashtag does not matter. The brief matters. Drop yours in the comments.",
  },
  {
    lines: [
      "Phone-free ceremonies",
      "are a love letter to your photographer.",
      "And your face.",
      "Just do it.",
      "",
    ],
    cta: "Find a phone-free-friendly photographer on The Marigold.",
    gradient: "gold-to-cream",
    caption:
      "Phone-free ceremonies: yes or no? We'll start — yes. Always yes.",
  },
  {
    lines: [
      "The 'Day Of Coordinator'",
      "is not a luxury.",
      "She's the reason your mom",
      "actually enjoys the wedding.",
      "",
    ],
    cta: "Day-of vs full planning, side-by-side on The Marigold.",
    gradient: "lavender-to-blush",
    caption:
      "If you do one thing, hire the day-of. Your mom will thank you. ✨",
  },
  {
    lines: [
      "Welcome bags",
      "are for the people who do not show up.",
      "Spend that money",
      "on the people who do.",
      "",
    ],
    cta: "Save vs splurge — the full breakdown on The Marigold.",
    gradient: "wine-to-blush",
    caption:
      "Welcome bags vs the actual welcome — which one wins your budget?",
  },
  {
    lines: [
      "Pre-wedding shoots",
      "in 14 different outfits",
      "are not a memory.",
      "They are content. Know the difference.",
      "",
    ],
    cta: "Brief your photographer like a pro.",
    gradient: "blush-to-cream",
    caption: "Memory or content? Tell us in the comments.",
  },
  {
    lines: [
      "Buffet > plated.",
      "Always.",
      "Plated is a flex for your venue,",
      "not a kindness to your guests.",
      "",
    ],
    cta: "Catering briefs that go down to the chaat counter.",
    gradient: "gold-to-cream",
    caption: "Buffet team or plated team? We're picking sides.",
  },
  {
    lines: [
      "The 'small' wedding",
      "with 300 people",
      "is not small.",
      "Your mother lied to you.",
      "",
    ],
    cta: "Plan for the headcount you'll actually have.",
    gradient: "wine-to-blush",
    caption:
      "Define 'small'. We'll wait. 😅",
  },
];

const TOT_PAIRS = [
  {
    label: "WEDDING VIBES",
    a: "Lehenga",
    aAnno: "main character energy",
    b: "Saree",
    bAnno: "classic, always",
    scheme: "pink-wine",
  },
  {
    label: "FIRST DANCE",
    a: "Bollywood medley",
    aAnno: "DDLJ to Pasoori",
    b: "Slow Sinatra",
    bAnno: "the romcom version",
    scheme: "cream-blush",
  },
  {
    label: "MANDAP FLORALS",
    a: "Wild + asymmetric",
    aAnno: "Pinterest-coded",
    b: "Marigold canopy",
    bAnno: "your dadi-coded",
    scheme: "gold-lavender",
  },
  {
    label: "VIDAAI MOOD",
    a: "Babul mora, soft",
    aAnno: "tears guaranteed",
    b: "Dhol on full blast",
    bAnno: "the society must hear",
    scheme: "pink-wine",
  },
  {
    label: "THE BAR",
    a: "Cocktail menu, signature drinks",
    aAnno: "two each, named after you",
    b: "Premium liquor only after 9pm",
    bAnno: "auntie hour is dry",
    scheme: "cream-blush",
  },
  {
    label: "GUEST LIST",
    a: "200 close, no kids",
    aAnno: "boundaries, queen",
    b: "500, including dad's barber",
    bAnno: "'he's like family'",
    scheme: "gold-lavender",
  },
];

const QUIZZES = [
  {
    theme: "What's Your Bride Energy?",
    headerAnno: "pick the one you can't stop thinking about",
    bg: "wine",
    options: [
      ["A", "Spreadsheet Queen", "14 tabs and a colour-coded vendor tracker"],
      ["B", "Pinterest Drifter", "800 pins and zero decisions"],
      ["C", "Delegator-in-Chief", "I'll handle it (you will not)"],
      ["D", "Sangeet Soul", "when in doubt, choreo it out"],
      ["E", "Quiet Romantic", "candlelight and one perfect playlist"],
    ],
    results: {
      A: {
        type: "typeA",
        label: "Spreadsheet Queen",
        quote: "if it's not in the tracker, it's not happening.",
        desc: "You don't trust vibes. You trust deadlines and ₹ totals. The 13-phase planner was made for you.",
        tieIn:
          "Run vendor briefs, payments, and timelines from one place — your spreadsheet, but the pretty version.",
        bg: "blush",
        icon: "compass",
      },
      B: {
        type: "creative",
        label: "Pinterest Drifter",
        quote: "every wedding is just a moodboard waiting to commit.",
        desc: "You see the wedding before you book a thing. Your problem is execution, not vision.",
        tieIn:
          "Lock the vision into a moodboard, then let our briefs translate it for every vendor.",
        bg: "lavender",
        icon: "paintbrush",
      },
      C: {
        type: "zen",
        label: "Delegator-in-Chief",
        quote: "I'll handle it (you will not).",
        desc: "You think you'll DIY it. You will not DIY it. We respect your confidence and your need for help.",
        tieIn:
          "The planner does the chasing, the briefing, and the reminders — so 'I'll handle it' becomes true.",
        bg: "mint",
        icon: "crown",
      },
      D: {
        type: "party",
        label: "Sangeet Soul",
        quote: "when in doubt, choreo it out.",
        desc: "Your wedding is a vibe and the vibe is dance floor. Everything else is a backdrop.",
        tieIn:
          "Brief your DJ, your choreographer, and your sound team in one place. The dance floor stays full.",
        bg: "deep-pink",
        icon: "disco-ball",
      },
      E: {
        type: "zen",
        label: "Quiet Romantic",
        quote: "if you can hear my vows, that's enough.",
        desc: "You don't want a spectacle. You want a moment. Everything is in service of that.",
        tieIn:
          "Our briefs keep your wedding intimate even when the headcount is 400.",
        bg: "peach",
        icon: "heart",
      },
    },
  },
  {
    theme: "What's Your Wedding Style?",
    headerAnno: "pick the one your gut lands on first",
    bg: "deep-pink",
    options: [
      ["A", "Classic Elegance", "ivory florals, candlelight, the whole thing whispers"],
      ["B", "Boho Garden", "wildflowers, golden hour, barefoot moments"],
      ["C", "Modern Minimalist", "clean lines, single statement, no clutter"],
      ["D", "Royal Maximalist", "marble, gold, and a chandelier in every room"],
      ["E", "Rustic Charm", "string lights, wooden tables, second helpings"],
    ],
    results: {
      A: {
        type: "classic-elegance",
        label: "Classic Elegance",
        quote: "if it's not timeless, it's not getting in the photos.",
        desc: "Ivory florals, candlelight, outfits your daughter could borrow in 2055. Restraint is your love language.",
        tieIn:
          "Our moodboards keep every vendor on-tone — so the candlelight stays warm and the florals stay ivory.",
        bg: "blush",
        icon: "crown",
      },
      B: {
        type: "boho-garden",
        label: "Boho Garden",
        quote: "if I can hear birds during the vows, we're winning.",
        desc: "Wildflowers, dappled light, food shared off long tables. Your wedding feels found, not built.",
        tieIn: "Brief your florist with a moodboard that travels — across vendors, ceremonies, and outfits.",
        bg: "mint",
        icon: "flower",
      },
      C: {
        type: "modern-minimalist",
        label: "Modern Minimalist",
        quote: "one statement piece, then nothing.",
        desc: "Clean lines, single florals, restraint as luxury. Your décor brief is a haiku.",
        tieIn: "Our briefs cut clutter. Vendors arrive aligned, not improvising.",
        bg: "sky",
        icon: "star",
      },
      D: {
        type: "royal-maximalist",
        label: "Royal Maximalist",
        quote: "if there isn't a chandelier, who are we?",
        desc: "Marble. Gold. Carved screens. You believe in main-character lighting and the back-lit entrance.",
        tieIn:
          "Royal scale needs ruthless coordination. The 13-phase planner keeps every vendor on cue.",
        bg: "wine",
        icon: "temple",
      },
      E: {
        type: "rustic-charm",
        label: "Rustic Charm",
        quote: "as long as nobody goes home hungry.",
        desc: "String lights, wooden tables, mismatched chairs, second helpings. Your wedding feels like dinner with people who love you.",
        tieIn: "We brief your caterer down to the second-helping plan.",
        bg: "peach",
        icon: "palette",
      },
    },
  },
  {
    theme: "Which Mehendi Vibe Are You?",
    headerAnno: "pick the morning that sounds like yours",
    bg: "gold-light",
    options: [
      ["A", "Garden Brunch", "fresh juice, soft yellows, no DJ till noon"],
      ["B", "Disco Mehendi", "queue starts at 11, the floor opens at 12"],
      ["C", "Intimate Courtyard", "old film songs and the cousins you actually like"],
      ["D", "Marigold Maximalism", "every wall, every ceiling, every plate"],
    ],
    results: {
      A: {
        type: "creative",
        label: "Garden Brunch Bride",
        quote: "if it's not before noon, I don't trust it.",
        desc: "Soft, fresh, citrus-forward. You want a mehendi that feels like the first hour of summer.",
        tieIn: "Our briefs keep brunch florals and brunch food on the same wavelength.",
        bg: "mint",
        icon: "flower",
      },
      B: {
        type: "party",
        label: "Disco Mehendi Bride",
        quote: "the dance floor opens with the henna.",
        desc: "You're not waiting for the sangeet. The party starts when the cones come out.",
        tieIn:
          "We brief DJs to read the room — including the room with mehendi drying.",
        bg: "deep-pink",
        icon: "disco-ball",
      },
      C: {
        type: "zen",
        label: "Intimate Courtyard Bride",
        quote: "if my naani's playlist isn't on, I don't want it.",
        desc: "Old film songs, your cousins on the floor, and your favourite people in one room.",
        tieIn:
          "Small mehendis still have ten vendors. We keep them invisible.",
        bg: "peach",
        icon: "heart",
      },
      D: {
        type: "creative",
        label: "Marigold Maximalist",
        quote: "if the décor doesn't make my dadi cry, redo it.",
        desc: "Every wall draped, every plate styled, every photo gold-soaked. You believe in giving the room a personality.",
        tieIn:
          "We brief decorators with mood + budget guardrails so the maximalism doesn't break the cap.",
        bg: "gold-light",
        icon: "palette",
      },
    },
  },
  {
    theme: "What's Your Wedding Planning Personality?",
    headerAnno: "pick the panic move that feels most like you",
    bg: "lavender",
    options: [
      ["A", "Open all 47 tabs", "spreadsheets, Pinterest, and three excel chats"],
      ["B", "Phone face-down", "denial as a strategy"],
      ["C", "Call the planner", "delegate, breathe, repeat"],
      ["D", "Doomscroll Reels", "research disguised as procrastination"],
    ],
    results: {
      A: {
        type: "typeA",
        label: "The Tab Hoarder",
        quote: "I'll close them when the wedding is over.",
        desc: "You research everything. You decide nothing. We respect the rigor.",
        tieIn:
          "The 13-phase planner closes tabs for you — every decision lives in one place.",
        bg: "blush",
        icon: "compass",
      },
      B: {
        type: "zen",
        label: "The Avoidant Calm",
        quote: "if I don't open the email, the email doesn't exist.",
        desc: "You will deal with it later. Later is the wedding day.",
        tieIn:
          "Reminders. Check-ins. Vendor follow-ups. We do the chasing so you can stay calm — without becoming late.",
        bg: "mint",
        icon: "heart",
      },
      C: {
        type: "zen",
        label: "The CEO Delegator",
        quote: "I'll approve. You'll deliver.",
        desc: "You don't want to do it. You want to sign off on it. Healthy.",
        tieIn:
          "The planner makes 'approve, don't do' easy — vendor briefs go out, you say yes or no.",
        bg: "sky",
        icon: "crown",
      },
      D: {
        type: "creative",
        label: "The Reel Researcher",
        quote: "I have seen 400 mandaps. I have not booked one.",
        desc: "Your moodboard is genius. Your timeline is fiction.",
        tieIn:
          "Pin the moodboard. We turn the moodboard into a vendor brief.",
        bg: "lavender",
        icon: "paintbrush",
      },
    },
  },
];

const VENUES = [
  {
    name: "Falaknuma Palace",
    location: "Hyderabad, Telangana",
    type: "Heritage palace",
    capacity: 300,
    setting: "indoor + courtyard",
    season: "Oct–Mar",
    starting: "₹35L+",
    style: "royal-maximalist",
    why: "Nizam-era marble, hand-carved staircases, and the kind of light that does the wedding photographer's job for them.",
    bestFor: "couples who want a black-tie wedding with biryani at 1am",
    package: "Marigold Heritage Package",
  },
  {
    name: "Devigarh Fort",
    location: "Udaipur, Rajasthan",
    type: "Aravalli fort",
    capacity: 180,
    setting: "outdoor terrace",
    season: "Nov–Feb",
    starting: "₹28L+",
    style: "royal-maximalist",
    why: "Hilltop fort, three nights of celebrations, every ceremony has its own courtyard.",
    bestFor: "destination weddings under 200 guests",
    package: "Marigold Three-Night Stay",
  },
  {
    name: "ITC Grand Goa",
    location: "Goa",
    type: "Beach resort",
    capacity: 400,
    setting: "beachside + lawn",
    season: "Oct–Apr",
    starting: "₹22L+",
    style: "boho-garden",
    why: "Sunset mandap on the lawn, beach cocktails, full-property buyout for back-to-back ceremonies.",
    bestFor: "destination weddings with kids and grandparents",
    package: "Marigold Sun + Sand",
  },
  {
    name: "The Leela Palace, Bengaluru",
    location: "Bengaluru, Karnataka",
    type: "City palace hotel",
    capacity: 350,
    setting: "indoor ballroom + garden",
    season: "Year-round",
    starting: "₹25L+",
    style: "classic-elegance",
    why: "Easy logistics, world-class catering, and a banquet that lights ivory like it was painted for photos.",
    bestFor: "cosmopolitan crowds in November–January",
    package: "Marigold City Wedding",
  },
  {
    name: "Alila Diwa Goa",
    location: "South Goa",
    type: "Resort",
    capacity: 250,
    setting: "rice paddy lawn",
    season: "Oct–Mar",
    starting: "₹18L+",
    style: "boho-garden",
    why: "Modern, calm, and surrounded by paddies — your décor breathes here.",
    bestFor: "minimalist brides who still want a buyout",
    package: "Marigold Quiet Luxe",
  },
  {
    name: "Umaid Bhawan Palace",
    location: "Jodhpur, Rajasthan",
    type: "Royal palace",
    capacity: 220,
    setting: "courtyard + indoor",
    season: "Oct–Mar",
    starting: "₹40L+",
    style: "royal-maximalist",
    why: "Art deco palace where the entrance music does itself.",
    bestFor: "couples who want a once-in-a-lifetime palace wedding",
    package: "Marigold Royal Buyout",
  },
];

const PLANNERS = [
  {
    name: "Vandana Mohan",
    agency: "The Wedding Design Co.",
    city: "Mumbai",
    yrs: 18,
    weddings: 220,
    style: "Restrained luxury — ivory, candlelight, calm.",
    famousFor: "phone-free ceremonies done with grace",
    starting: "₹15L planning fee",
    quote: "If it's loud, it's not luxury.",
  },
  {
    name: "Devika Narain",
    agency: "Devika Narain & Co.",
    city: "Delhi",
    yrs: 14,
    weddings: 160,
    style: "Botanical maximalism — wild florals, foraged textures.",
    famousFor: "outdoor mandaps that look found, not built",
    starting: "₹18L planning fee",
    quote: "Florals are not décor. They're characters.",
  },
  {
    name: "Aastha Khanna",
    agency: "The A-Cube Project",
    city: "Bengaluru",
    yrs: 9,
    weddings: 95,
    style: "Modern minimal with desi soul.",
    famousFor: "intimate weddings under 120 guests",
    starting: "₹8L planning fee",
    quote: "Edit the wedding. Don't add to it.",
  },
  {
    name: "Tarun Vohra",
    agency: "Storyteller Studios",
    city: "Hyderabad",
    yrs: 12,
    weddings: 140,
    style: "Storytelling-led — every ceremony has a thesis.",
    famousFor: "weddings that move chronologically through a couple's love story",
    starting: "₹12L planning fee",
    quote: "If your wedding doesn't have a thesis, it's a party.",
  },
];

const VENDORS = [
  {
    name: "Stories by Joseph Radhik",
    cat: "Photography",
    city: "Goa / Worldwide",
    yrs: 14,
    starting: "₹6L",
    why: "Documentary-led, no posing, the best 'mom-watching-bride' shots in the country.",
    sig: "candid + cinematic",
    quote:
      "If you don't tell us the muhurat is at 4am, we will absolutely show up at 4am.",
    series: "Things Your Vendor Wishes You Knew",
    tagline: "this is why we do vendor briefs",
    attribution: "— STORIES BY JOSEPH RADHIK",
  },
  {
    name: "Devika's Florals",
    cat: "Floral design",
    city: "Mumbai",
    yrs: 9,
    starting: "₹3.5L",
    why: "Wild, asymmetric, sourced from Pune flower markets that morning.",
    sig: "garden chaos, intentional",
    quote:
      "Tell me the season, the ceremony, the venue. Then trust me with the rest.",
    series: "Vendor Wisdom",
    tagline: "florists are partners, not order-takers",
    attribution: "— DEVIKA'S FLORALS",
  },
  {
    name: "Bhumika Sharma — Bridal",
    cat: "Couture",
    city: "Delhi",
    yrs: 11,
    starting: "₹4L",
    why: "Soft pastels, modern silhouettes, no stiff zardozi unless you want it.",
    sig: "modern bridal couture",
    quote:
      "We can do red. We can do not-red. The bride decides — not the relatives.",
    series: "Vendor Wisdom",
    tagline: "say yes to the lehenga you'll actually wear",
    attribution: "— BHUMIKA SHARMA",
  },
  {
    name: "House of Plating",
    cat: "Catering",
    city: "Mumbai / Pan-India",
    yrs: 10,
    starting: "₹2.2k pp",
    why: "Live counters with chefs you'd hire individually if you could.",
    sig: "live + plated hybrid",
    quote:
      "Don't book us if you want average butter chicken. We do the version you compare every other plate to.",
    series: "Vendor Wisdom",
    tagline: "the food is the wedding",
    attribution: "— HOUSE OF PLATING",
  },
  {
    name: "DJ Ganesh",
    cat: "Music + DJ",
    city: "Bengaluru",
    yrs: 13,
    starting: "₹1.8L",
    why: "Reads the room. The dance floor stays full from 9pm to 1am.",
    sig: "Bollywood + global mash-ups",
    quote:
      "Tell me your mom's favourite song. I'll play it at 11pm. The floor will explode.",
    series: "Vendor Wisdom",
    tagline: "DJs save dance floors. Plan accordingly.",
    attribution: "— DJ GANESH",
  },
  {
    name: "Mira Mehndi Co.",
    cat: "Mehndi artist",
    city: "Jaipur",
    yrs: 16,
    starting: "₹85k",
    why: "Fine-line designs, dries in 30, lasts 12 days.",
    sig: "minimalist henna",
    quote:
      "If you book me at 6am, I will leave at 6am. Tell me the photo schedule.",
    series: "Vendor Wisdom",
    tagline: "brief your mehndi like any other vendor",
    attribution: "— MIRA MEHNDI CO.",
  },
];

const BRIDES = [
  {
    name: "Aanya",
    age: 28,
    city: "Mumbai → Goa",
    date: "Dec 14, 2026",
    style: "Boho Garden",
    headcount: 220,
    budget: "₹38L",
    fianceName: "Rohan",
    quote: "we wanted barefoot moments and a mandap on the sand.",
    icon: "flower",
    bg: "mint",
    tagline: "Boho garden bride, full beach buyout",
    color: "mint",
  },
  {
    name: "Sara",
    age: 31,
    city: "Delhi",
    date: "Feb 9, 2027",
    style: "Royal Maximalist",
    headcount: 450,
    budget: "₹65L",
    fianceName: "Kabir",
    quote: "if my dadi doesn't cry at the entrance, I've failed.",
    icon: "temple",
    bg: "wine",
    tagline: "Delhi royal, 450 guests, zero regrets",
    color: "wine",
  },
  {
    name: "Priya",
    age: 27,
    city: "Bengaluru",
    date: "Nov 22, 2026",
    style: "Modern Minimalist",
    headcount: 110,
    budget: "₹22L",
    fianceName: "Vikram",
    quote: "one statement floral. one playlist. one perfect day.",
    icon: "star",
    bg: "sky",
    tagline: "Minimalist bride, intimate Bengaluru wedding",
    color: "sky",
  },
  {
    name: "Meher",
    age: 29,
    city: "Hyderabad",
    date: "Jan 20, 2027",
    style: "Classic Elegance",
    headcount: 280,
    budget: "₹42L",
    fianceName: "Aryan",
    quote: "ivory, candlelight, the whole thing whispers.",
    icon: "crown",
    bg: "blush",
    tagline: "Hyderabad palace wedding, ivory + candlelight",
    color: "blush",
  },
  {
    name: "Riya",
    age: 26,
    city: "Pune",
    date: "Mar 8, 2027",
    style: "Sangeet Soul",
    headcount: 320,
    budget: "₹35L",
    fianceName: "Aditya",
    quote: "the dance floor doesn't close till 2am.",
    icon: "disco-ball",
    bg: "deep-pink",
    tagline: "Pune sangeet bride, dance floor till 2am",
    color: "deep-pink",
  },
  {
    name: "Tara",
    age: 30,
    city: "Chennai → Pondicherry",
    date: "Apr 18, 2027",
    style: "Boho Garden",
    headcount: 140,
    budget: "₹26L",
    fianceName: "Karthik",
    quote: "wildflowers, golden hour, the calmest morning of my life.",
    icon: "flower",
    bg: "peach",
    tagline: "Pondicherry destination, 140 guests",
    color: "peach",
  },
];

const MOODBOARDS = [
  {
    title: "Pastel Pista",
    palette: ["#cfe6c8", "#f5e6c4", "#e8b4bc", "#a8957a"],
    desc: "Pista green, ivory, blush, and warm taupe — a daytime palette for an outdoor mehendi.",
  },
  {
    title: "Wine + Marigold",
    palette: ["#7a1f3a", "#e3a23c", "#f7e6cf", "#3a1d20"],
    desc: "Deep wine, golden marigold, cream — the classic ceremony palette, dialled up.",
  },
  {
    title: "Lavender Haldi",
    palette: ["#c4a8d4", "#fff5d3", "#f5d0e0", "#7a4f8a"],
    desc: "Soft lavender, butter yellow, blush — for a haldi that feels like sunrise.",
  },
  {
    title: "Coastal Cream",
    palette: ["#f7e9d3", "#cfb89a", "#a8c4b4", "#5a3e2b"],
    desc: "Cream, sand, sea-glass green — a Goa beach wedding without the cliché.",
  },
  {
    title: "Midnight Velvet",
    palette: ["#1a1a2e", "#7a1f3a", "#d4a853", "#f5e6c4"],
    desc: "Deep navy, wine, gold accents — for a winter reception that earns its candles.",
  },
  {
    title: "Chai + Rose",
    palette: ["#a8704a", "#e8b4bc", "#f5e6c4", "#3a1d20"],
    desc: "Warm chai brown, dusty rose, cream — for an autumn engagement.",
  },
];

const LEHENGAS = [
  {
    title: "Pista Green Anarkali",
    designer: "Anita Dongre",
    occasion: "Mehendi",
    palette: "Pista, ivory, gold thread",
    desc: "Light, breathable, embroidered just enough — the mehendi lehenga that doesn't fight the henna.",
    bg: "mint",
  },
  {
    title: "Wine Velvet Bridal",
    designer: "Sabyasachi",
    occasion: "Wedding ceremony",
    palette: "Wine, rose-gold, antique zardozi",
    desc: "The 'walking down the aisle' lehenga — heavy, structured, a heirloom in waiting.",
    bg: "wine",
  },
  {
    title: "Soft Blush Sangeet",
    designer: "Manish Malhotra",
    occasion: "Sangeet",
    palette: "Blush, silver, mirror work",
    desc: "Movement-friendly, mirror-detailed — built for the dance floor.",
    bg: "blush",
  },
  {
    title: "Ivory Reception Saree",
    designer: "Bhumika Sharma",
    occasion: "Reception",
    palette: "Ivory, pearl, soft gold",
    desc: "Pearl-embroidered drape — modern, minimal, photo-perfect.",
    bg: "cream",
  },
  {
    title: "Pastel Lavender Cocktail",
    designer: "Rahul Mishra",
    occasion: "Cocktail",
    palette: "Lavender, rose-gold, sequins",
    desc: "Couture sequins, modern silhouette — a cocktail outfit that earns the cocktail.",
    bg: "lavender",
  },
];

const PRODUCT_PICKS = [
  {
    name: "Heirloom Marigold Studs",
    brand: "Khanna Jewels",
    price: "₹32,000",
    occasion: "Daily wear → mehendi",
    why: "Hand-set polki marigolds, light enough to wear with cotton.",
    bg: "gold-light",
  },
  {
    name: "Velvet Mojaris",
    brand: "Coral Haze",
    price: "₹4,500",
    occasion: "Sangeet, reception",
    why: "Dance-floor durable, wine velvet that hides every spilled drink.",
    bg: "wine",
  },
  {
    name: "Pearl Drop Earrings",
    brand: "Outhouse",
    price: "₹18,000",
    occasion: "Reception",
    why: "Hand-strung pearls, single drop — restraint as luxury.",
    bg: "blush",
  },
  {
    name: "Embroidered Potli",
    brand: "House of Bhumika",
    price: "₹6,200",
    occasion: "Mehendi → wedding",
    why: "Holds your phone, mints, a tissue, and your mom's nervous energy.",
    bg: "mint",
  },
];

const PLATFORM_FEATURES = [
  {
    name: "Vendor Briefs",
    headline: "One brief. Every vendor on the same page.",
    desc: "Catering, decor, makeup, DJ — one source of truth, updated as you decide.",
    cta: "TRY IT",
  },
  {
    name: "13-Phase Planner",
    headline: "Wedding planning, broken into the only 13 phases that matter.",
    desc: "From engagement to vidaai. Every phase has its own checklist and vendor cohort.",
    cta: "OPEN PLANNER",
  },
  {
    name: "Moodboard Sync",
    headline: "Pin once. Brief everyone.",
    desc: "Drop your Pinterest, tag the vendor, the brief writes itself.",
    cta: "BUILD A BOARD",
  },
  {
    name: "Bride Connect",
    headline: "Real brides. Real timelines. Real DM access.",
    desc: "Match with brides 6 months ahead of you. Skip the WhatsApp aunties.",
    cta: "JOIN BRIDE CONNECT",
  },
  {
    name: "Budget Tracker",
    headline: "₹ in. ₹ out. No surprises at the cake table.",
    desc: "Live tracker, vendor invoices, payment reminders. Your dad will love it.",
    cta: "START TRACKING",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sliceField = (template, prefix) =>
  template.editable_fields.filter((f) => f.key.startsWith(prefix));

function defaultsFor(slug) {
  const t = TEMPLATE_BY_SLUG[slug];
  if (!t) throw new Error(`Unknown template: ${slug}`);
  const out = {};
  for (const f of t.editable_fields) {
    if (f.default !== undefined) out[f.key] = f.default;
    else if (f.type === "number") out[f.key] = 0;
    else out[f.key] = "";
  }
  return out;
}

function applyOverrides(base, overrides) {
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    out[k] = v;
  }
  return out;
}

function pillarFor(seriesSlug) {
  return SERIES_BY_SLUG[seriesSlug]?.pillar || "engage";
}

function colorFor(templateSlug) {
  return COLOR_BY_TEMPLATE[templateSlug] || null;
}

const HASHBANK = {
  engage: ["DesiWedding", "WeddingPlanning", "TheMarigold", "BrideConfessions", "WeddingChaos"],
  educate: ["WeddingPlanning", "DesiWedding", "TheMarigold", "WeddingTips", "Planning101"],
  inspire: ["WeddingInspo", "MoodBoard", "TheMarigold", "WeddingDecor", "DesiBride"],
  connect: ["DesiBride", "BrideTribe", "TheMarigold", "WeddingCommunity", "RealBride"],
  convert: ["WeddingPlanning", "TheMarigold", "WeddingPlanner", "DesiWedding", "PlanWithUs"],
};

function tagsLine(pillar, extras = []) {
  const set = [...new Set([...(extras || []), ...HASHBANK[pillar]])].slice(0, 6);
  return set.map((t) => `#${t}`).join(" ");
}

// ---------------------------------------------------------------------------
// Per-template content_data builders
// ---------------------------------------------------------------------------

function bvmPostData(idx) {
  const ep = BVM_EPISODES[idx % BVM_EPISODES.length];
  return applyOverrides(defaultsFor("bvm-post"), {
    episodeNumber: idx + 1,
    episodeTopic: ep.topic,
    brideQuote: ep.bride,
    brideAnnotation: ep.brideAnno,
    momQuote: ep.mom,
    momAnnotation: ep.momAnno,
    ctaTagline: ep.cta,
  });
}

function bvmStoryData(idx) {
  const ep = BVM_EPISODES[idx % BVM_EPISODES.length];
  return applyOverrides(defaultsFor("bvm-story"), {
    episodeNumber: idx + 1,
    episodeTopic: ep.topic,
    brideQuote: ep.bride,
    brideAnnotation: ep.brideAnno,
    momQuote: ep.mom,
    momAnnotation: ep.momAnno,
  });
}

function bvmReelData(idx) {
  const ep = BVM_EPISODES[idx % BVM_EPISODES.length];
  // Build 3 exchanges out of one episode (pad if needed).
  const next = BVM_EPISODES[(idx + 1) % BVM_EPISODES.length];
  const further = BVM_EPISODES[(idx + 2) % BVM_EPISODES.length];
  return applyOverrides(defaultsFor("bvm-reel"), {
    topic: ep.topic,
    "exchanges.0.bride": ep.bride,
    "exchanges.0.mom": ep.mom,
    "exchanges.1.bride": next.bride,
    "exchanges.1.mom": next.mom,
    "exchanges.2.bride": further.bride,
    "exchanges.2.mom": further.mom,
    finalTagline: ep.cta,
  });
}

function confessionalCardData(num, idx) {
  const c = CONFESSIONS[idx % CONFESSIONS.length];
  return applyOverrides(defaultsFor("confessional-card"), {
    confessionNumber: num,
    confessionText: c.text,
    attribution: c.attr,
    variant: VARIANT_CYCLE[(num - 1) % 3],
  });
}

function confessionalReelData(num, idx) {
  const c = CONFESSIONS[idx % CONFESSIONS.length];
  return applyOverrides(defaultsFor("confessional-reel"), {
    confessionNumber: num,
    confessionText: c.text,
    attribution: c.attr.toLowerCase().replace(/—\s*/, "— "),
    wordsPerMinute: 150,
    highlightColor: HIGHLIGHT_CYCLE[(num - 1) % 3],
  });
}

function totPostData(idx) {
  const p = TOT_PAIRS[idx % TOT_PAIRS.length];
  return applyOverrides(defaultsFor("tot-post"), {
    topicLabel: p.label,
    optionA: p.a,
    optionAAnnotation: p.aAnno,
    optionB: p.b,
    optionBAnnotation: p.bAnno,
    colorScheme: p.scheme,
  });
}

function totStoryData(idx) {
  const p = TOT_PAIRS[idx % TOT_PAIRS.length];
  return applyOverrides(defaultsFor("tot-story"), {
    topicLabel: p.label,
    optionA: p.a,
    optionAAnnotation: p.aAnno,
    optionB: p.b,
    optionBAnnotation: p.bAnno,
    colorScheme: p.scheme,
  });
}

function totReelData(idx) {
  const p = TOT_PAIRS[idx % TOT_PAIRS.length];
  const p2 = TOT_PAIRS[(idx + 1) % TOT_PAIRS.length];
  const p3 = TOT_PAIRS[(idx + 2) % TOT_PAIRS.length];
  return applyOverrides(defaultsFor("this-or-that-reel"), {
    topic: p.label,
    "exchanges.0.bride": p.a,
    "exchanges.0.mom": p.b,
    "exchanges.1.bride": p2.a,
    "exchanges.1.mom": p2.b,
    "exchanges.2.bride": p3.a,
    "exchanges.2.mom": p3.b,
    finalTagline: "pick your team — both live on The Marigold",
  });
}

function hotTakeReelData(idx) {
  const ht = HOT_TAKES[idx % HOT_TAKES.length];
  return applyOverrides(defaultsFor("hot-take-reel"), {
    "lines.0": ht.lines[0] || "",
    "lines.1": ht.lines[1] || "",
    "lines.2": ht.lines[2] || "",
    "lines.3": ht.lines[3] || "",
    "lines.4": ht.lines[4] || "",
    ctaText: ht.cta,
    seriesTag: "HOT TAKE",
    backgroundGradient: ht.gradient,
    font: idx % 2 ? "caveat" : "instrument-serif",
    holdTimeMs: 2000,
  });
}

function quizTitleV2Data(idx) {
  const q = QUIZZES[idx % QUIZZES.length];
  const o = q.options;
  return applyOverrides(defaultsFor("quiz-title-v2"), {
    quizTheme: q.theme,
    headerAnnotation: q.headerAnno,
    backgroundColor: q.bg,
    "options.0.letter": o[0][0],
    "options.0.label": o[0][1],
    "options.0.subtitle": o[0][2],
    "options.1.letter": o[1][0],
    "options.1.label": o[1][1],
    "options.1.subtitle": o[1][2],
    "options.2.letter": o[2][0],
    "options.2.label": o[2][1],
    "options.2.subtitle": o[2][2],
    "options.3.letter": o[3][0],
    "options.3.label": o[3][1],
    "options.3.subtitle": o[3][2],
    "options.4.letter": o[4]?.[0] || "E",
    "options.4.label": o[4]?.[1] || "",
    "options.4.subtitle": o[4]?.[2] || "",
  });
}

function quizResultV2Data(quizIdx, letter) {
  const q = QUIZZES[quizIdx % QUIZZES.length];
  const r = q.results[letter];
  return applyOverrides(defaultsFor("quiz-result-v2"), {
    resultType: r.type,
    resultLabel: r.label,
    resultEmoji: "",
    resultQuote: r.quote,
    resultDescription: r.desc,
    productTieIn: r.tieIn,
    backgroundColor: r.bg,
    iconType: r.icon,
  });
}

function quizResultPostData(quizIdx, letter) {
  const q = QUIZZES[quizIdx % QUIZZES.length];
  const r = q.results[letter];
  return applyOverrides(defaultsFor("quiz-result-post"), {
    resultType: r.type,
    resultLabel: r.label,
    resultEmoji: "",
    resultQuote: r.quote,
    resultDescription: r.desc,
    productTieIn: r.tieIn,
    backgroundColor: r.bg,
    iconType: r.icon,
  });
}

function venueFeatureData(idx) {
  const v = VENUES[idx % VENUES.length];
  return applyOverrides(defaultsFor("venue-feature-post"), {
    venueName: v.name,
    location: v.location,
    venueType: v.type,
    capacity: `Up to ${v.capacity} guests`,
    setting: v.setting,
    bestSeason: v.season,
    startingPrice: v.starting,
    designStyle: v.style,
    whyWeLikeIt: v.why,
    bestFor: v.bestFor,
    packageName: v.package,
  });
}

function venueComparisonData(idx) {
  const a = VENUES[idx % VENUES.length];
  const b = VENUES[(idx + 1) % VENUES.length];
  return applyOverrides(defaultsFor("venue-comparison-post"), {
    title: "Two takes on a destination wedding",
    "venueA.name": a.name,
    "venueA.location": a.location,
    "venueA.headcount": String(a.capacity),
    "venueA.starting": a.starting,
    "venueA.bestFor": a.bestFor,
    "venueB.name": b.name,
    "venueB.location": b.location,
    "venueB.headcount": String(b.capacity),
    "venueB.starting": b.starting,
    "venueB.bestFor": b.bestFor,
    annotation: "both buyout-ready, both on The Marigold",
  });
}

function venueStyleGuideData(idx) {
  const v = VENUES[idx % VENUES.length];
  return applyOverrides(defaultsFor("venue-style-guide"), {
    venueName: v.name,
    location: v.location,
  });
}

function dreamVenueReelData(idx) {
  const v = VENUES[idx % VENUES.length];
  return applyOverrides(defaultsFor("dream-venue-reel"), {
    venueName: v.name,
    location: v.location,
    revealLine: `${v.name} — ${v.bestFor}.`,
    ctaText: "Tour it on The Marigold.",
  });
}

function venueReelData(idx) {
  const v = VENUES[idx % VENUES.length];
  return applyOverrides(defaultsFor("venue-reel"), {
    venueName: v.name,
    location: v.location,
    ctaText: "See more venues on The Marigold.",
  });
}

function plannerProfileData(idx) {
  const p = PLANNERS[idx % PLANNERS.length];
  return applyOverrides(defaultsFor("planner-profile-post"), {
    plannerName: p.name,
    agencyName: p.agency,
    city: p.city,
    yearsExperience: p.yrs,
    weddingsPlanned: p.weddings,
    style: p.style,
    famousFor: p.famousFor,
    startingPrice: p.starting,
    quote: p.quote,
  });
}

function plannerAdviceData(idx) {
  const p = PLANNERS[idx % PLANNERS.length];
  return applyOverrides(defaultsFor("planner-advice-post"), {
    plannerName: p.name,
    agencyName: p.agency,
    advice: p.quote,
  });
}

function plannerTipsCarouselData(idx) {
  const p = PLANNERS[idx % PLANNERS.length];
  return applyOverrides(defaultsFor("planner-tips-carousel"), {
    plannerName: p.name,
    agencyName: p.agency,
  });
}

function dayOfVsFullData() {
  return applyOverrides(defaultsFor("day-of-vs-full-planning-post"), {});
}

function vendorQuoteData(idx) {
  const v = VENDORS[idx % VENDORS.length];
  return applyOverrides(defaultsFor("vendor-quote"), {
    quote: v.quote,
    attribution: v.attribution,
    tagline: v.tagline,
    seriesLabel: v.series,
  });
}

function vendorFeatureData(idx) {
  const v = VENDORS[idx % VENDORS.length];
  return applyOverrides(defaultsFor("vendor-feature-post"), {
    vendorName: v.name,
    category: v.cat,
    city: v.city,
    yearsExperience: v.yrs,
    startingPrice: v.starting,
    whyWeLikeThem: v.why,
    signatureStyle: v.sig,
  });
}

function vendorTipCarouselData(idx) {
  const v = VENDORS[idx % VENDORS.length];
  return applyOverrides(defaultsFor("vendor-tip-carousel"), {
    vendorName: v.name,
    category: v.cat,
  });
}

function vendorQuoteReelData(idx) {
  const v = VENDORS[idx % VENDORS.length];
  return applyOverrides(defaultsFor("vendor-quote-reel"), {
    quote: v.quote,
    attribution: v.attribution,
  });
}

function vendorPortfolioReelData(idx) {
  const v = VENDORS[idx % VENDORS.length];
  return applyOverrides(defaultsFor("vendor-portfolio-reel"), {
    vendorName: v.name,
    category: v.cat,
  });
}

function moodBoardReelData(idx) {
  const m = MOODBOARDS[idx % MOODBOARDS.length];
  return applyOverrides(defaultsFor("mood-board-reel"), {
    "slides.0.caption": m.title,
    "slides.1.caption": m.desc,
    "slides.2.caption": "the palette",
    "slides.3.caption": `${m.palette[0]} · ${m.palette[1]}`,
    "slides.4.caption": "build yours on The Marigold",
    ctaText: "Build your moodboard on The Marigold.",
    overlayStyle: "full-overlay",
  });
}

function lehengaStyleData(idx) {
  const l = LEHENGAS[idx % LEHENGAS.length];
  return applyOverrides(defaultsFor("lehenga-style-post"), {
    title: l.title,
    designerName: l.designer,
    occasion: l.occasion,
    palette: l.palette,
    description: l.desc,
    backgroundColor: l.bg,
  });
}

function productPickData(idx) {
  const p = PRODUCT_PICKS[idx % PRODUCT_PICKS.length];
  return applyOverrides(defaultsFor("edit-product-pick-post"), {
    productName: p.name,
    brand: p.brand,
    price: p.price,
    occasion: p.occasion,
    whyWePickedIt: p.why,
    backgroundColor: p.bg,
  });
}

function trendingNowData(idx) {
  return applyOverrides(defaultsFor("edit-trending-now-post"), {});
}

function topPicksCarouselData(idx) {
  return applyOverrides(defaultsFor("edit-top-picks-carousel"), {});
}

function brideOfWeekData(idx) {
  const b = BRIDES[idx % BRIDES.length];
  return applyOverrides(defaultsFor("bride-of-the-week-post"), {
    brideName: b.name,
    fianceName: b.fianceName,
    weddingDate: b.date,
    city: b.city,
    style: b.style,
    headcount: String(b.headcount),
    quote: b.quote,
  });
}

function brideMatchProfileData(idx) {
  const b = BRIDES[idx % BRIDES.length];
  return applyOverrides(defaultsFor("bride-match-profile-post"), {
    brideName: b.name,
    age: b.age,
    city: b.city,
    weddingDate: b.date,
    style: b.style,
    headcount: String(b.headcount),
    quote: b.quote,
    iconType: b.icon,
    backgroundColor: b.bg,
  });
}

function brideMatchStoryData(idx) {
  const b = BRIDES[idx % BRIDES.length];
  return applyOverrides(defaultsFor("bride-match-story"), {
    brideName: b.name,
    age: b.age,
    city: b.city,
    weddingDate: b.date,
    style: b.style,
    headcount: String(b.headcount),
    quote: b.quote,
    iconType: b.icon,
    backgroundColor: b.bg,
  });
}

function brideMatchDuoData(idx) {
  const a = BRIDES[idx % BRIDES.length];
  const b = BRIDES[(idx + 1) % BRIDES.length];
  return applyOverrides(defaultsFor("bride-match-duo-post"), {
    "brideA.name": a.name,
    "brideA.city": a.city,
    "brideA.date": a.date,
    "brideA.style": a.style,
    "brideB.name": b.name,
    "brideB.city": b.city,
    "brideB.date": b.date,
    "brideB.style": b.style,
  });
}

function brideConnectExplainerData() {
  return applyOverrides(defaultsFor("bride-connect-explainer-carousel"), {});
}

function brideConnectReelData(idx) {
  const b = BRIDES[idx % BRIDES.length];
  return applyOverrides(defaultsFor("bride-connect-reel"), {
    brideName: b.name,
    weddingDate: b.date,
    city: b.city,
  });
}

function brideConnectStoriesReelData(idx) {
  return applyOverrides(defaultsFor("bride-connect-stories-reel"), {});
}

function platformFeatureDropData(idx) {
  const f = PLATFORM_FEATURES[idx % PLATFORM_FEATURES.length];
  return applyOverrides(defaultsFor("platform-feature-drop-post"), {
    featureName: f.name,
    headline: f.headline,
    description: f.desc,
    ctaText: f.cta,
  });
}

function platformBeforeAfterData() {
  return applyOverrides(defaultsFor("platform-before-after-post"), {});
}

function platformHowItWorksCarouselData() {
  return applyOverrides(defaultsFor("platform-how-it-works-carousel"), {});
}

function platformVsOldWayData() {
  return applyOverrides(defaultsFor("platform-vs-old-way-post"), {});
}

function platformTestimonialData(idx) {
  const b = BRIDES[idx % BRIDES.length];
  return applyOverrides(defaultsFor("platform-testimonial-post"), {
    brideName: b.name,
    city: b.city,
    quote: `${b.tagline} — and The Marigold made the brief work for every vendor.`,
  });
}

function platformStatStoryData() {
  return applyOverrides(defaultsFor("platform-stat-story"), {});
}

function brideLifeSelfCareData(idx) {
  const lines = [
    "Self-care for the bride who hasn't slept in three weeks.",
    "Five things that aren't a face mask.",
    "How to take a Sunday off (yes, really).",
  ];
  return applyOverrides(defaultsFor("bride-life-self-care-post"), {
    headline: lines[idx % lines.length],
  });
}

function brideLifeRelationshipCheckinData() {
  return applyOverrides(defaultsFor("bride-life-relationship-checkin"), {});
}

function brideLifeEmotionalRealityData(idx) {
  const headlines = [
    "It's okay to cry at the menu tasting.",
    "The pre-wedding overwhelm is not a personal failing.",
    "Your fiancé is not your therapist. Hire a therapist.",
  ];
  return applyOverrides(defaultsFor("bride-life-emotional-reality"), {
    headline: headlines[idx % headlines.length],
  });
}

function brideLifeInLawData() {
  return applyOverrides(defaultsFor("bride-life-in-law-navigation"), {});
}

function affirmationStoryData(idx) {
  const lines = [
    "the wedding is one day. the marriage is the rest.",
    "your peace is the décor.",
    "saying 'no' is a planning skill.",
    "you don't owe everyone an explanation.",
  ];
  return applyOverrides(defaultsFor("bride-life-affirmation-story"), {
    affirmation: lines[idx % lines.length],
  });
}

function brideLifeReelData(idx) {
  return applyOverrides(defaultsFor("bride-life-reel"), {});
}

function traditionExplainedData(idx) {
  const traditions = [
    {
      title: "Haldi, explained",
      desc: "Turmeric paste, applied by family, on the morning of the wedding. Symbolic of cleansing and a soft glow on camera.",
    },
    {
      title: "Saat Phere, explained",
      desc: "Seven vows around the sacred fire. Each phera is a promise — health, strength, wealth, family, progeny, harmony, partnership.",
    },
    {
      title: "Joota Chupai, explained",
      desc: "The bride's sisters steal the groom's shoes. Negotiation, bribery, and laughter ensue. Budget for it.",
    },
    {
      title: "Vidaai, explained",
      desc: "The bride's farewell from her parents' home. Soft. Loud. Always emotional.",
    },
  ];
  const t = traditions[idx % traditions.length];
  return applyOverrides(defaultsFor("tradition-explained-post"), {
    title: t.title,
    description: t.desc,
  });
}

function regionalSpotlightData(idx) {
  const regions = ["South Indian wedding", "Punjabi wedding", "Bengali wedding", "Marwari wedding"];
  return applyOverrides(defaultsFor("regional-spotlight-carousel"), {
    region: regions[idx % regions.length],
  });
}

function fusionWeddingData(idx) {
  const pairs = ["Punjabi + Tamil", "Gujarati + Bengali", "Marwari + Christian", "Sindhi + Malayali"];
  return applyOverrides(defaultsFor("fusion-wedding-post"), {
    fusionTitle: pairs[idx % pairs.length],
  });
}

function familyRolesData() {
  return applyOverrides(defaultsFor("family-roles-post"), {});
}

function traditionReelData(idx) {
  return applyOverrides(defaultsFor("tradition-reel"), {});
}

function inSeasonTrendData(idx) {
  const trends = [
    {
      label: "WINTER 2026",
      headline: "Chiffon-light lehengas are the new heavy.",
      desc: "Designers are stripping back the zardozi. Movement matters more than weight.",
    },
    {
      label: "SPRING 2027",
      headline: "Pastel mehendi mornings are everywhere.",
      desc: "Pista, lavender, butter — the saturated reds are taking the season off.",
    },
    {
      label: "SUMMER 2027",
      headline: "Beach mandaps are getting smaller and tighter.",
      desc: "60-guest beach buyouts are this year's destination flex.",
    },
  ];
  const t = trends[idx % trends.length];
  return applyOverrides(defaultsFor("in-season-trend-post"), {
    seasonLabel: t.label,
    headline: t.headline,
    description: t.desc,
  });
}

function festivalInspoData(idx) {
  const festivals = [
    "Diwali engagement parties",
    "Karwa Chauth date-night ideas",
    "Holi mehendi mornings",
    "Lohri cocktail nights",
  ];
  return applyOverrides(defaultsFor("in-season-festival-inspo-post"), {
    festival: festivals[idx % festivals.length],
  });
}

function inSeasonPrepCarouselData() {
  return applyOverrides(defaultsFor("in-season-prep-carousel"), {});
}

function monthlyRoundupStoryData(idx) {
  const months = ["April", "May", "June", "July"];
  return applyOverrides(defaultsFor("in-season-monthly-roundup-story"), {
    month: months[idx % months.length],
  });
}

function seasonalReelData() {
  return applyOverrides(defaultsFor("seasonal-reel"), {});
}

function pollResultsData(idx) {
  const polls = [
    { q: "Buffet or plated?", a: "Buffet — 71%", b: "Plated — 29%" },
    { q: "Phone-free ceremony?", a: "Yes — 64%", b: "No — 36%" },
    { q: "Save-the-dates?", a: "WhatsApp blast — 58%", b: "Paper invite — 42%" },
  ];
  const p = polls[idx % polls.length];
  return applyOverrides(defaultsFor("poll-results-post"), {
    pollQuestion: p.q,
    optionA: p.a,
    optionB: p.b,
  });
}

function milestoneData(idx) {
  const milestones = [
    { n: "10,000", l: "BRIDES", d: "are planning their wedding on The Marigold this season." },
    { n: "1,200", l: "VENDORS", d: "now live on the platform — across 18 cities." },
    { n: "₹84 Cr", l: "BRIEFED", d: "in vendor briefs since launch — and counting." },
  ];
  const m = milestones[idx % milestones.length];
  return applyOverrides(defaultsFor("milestone-post"), {
    statNumber: m.n,
    statLabel: m.l,
    description: m.d,
  });
}

function userStoryReelData(idx) {
  const b = BRIDES[idx % BRIDES.length];
  return applyOverrides(defaultsFor("user-story-reel"), {
    brideName: b.name,
    city: b.city,
  });
}

function communityReelData() {
  return applyOverrides(defaultsFor("community-reel"), {});
}

function submissionCTAStoryData() {
  return applyOverrides(defaultsFor("submission-cta-story"), {});
}

function checklistStoryData(idx) {
  const lists = [
    {
      title: "12 weeks out",
      items: [
        "Finalize the venue contract",
        "Book the photographer",
        "Send save-the-dates",
        "Lock the catering brief",
        "Approve the moodboard",
      ],
    },
    {
      title: "6 weeks out",
      items: [
        "Bridal trial",
        "Final guest count to caterer",
        "Vendor payment schedule",
        "Sangeet rehearsal",
        "Welcome bag sourcing",
      ],
    },
    {
      title: "2 weeks out",
      items: [
        "Confirm muhurat with priest",
        "Final fitting",
        "DJ playlist freeze",
        "Vendor day-of contacts",
        "Bridesmaid timeline",
      ],
    },
  ];
  const l = lists[idx % lists.length];
  return applyOverrides(defaultsFor("checklist-story"), {
    checklistTitle: l.title,
    "items.0": l.items[0],
    "items.1": l.items[1],
    "items.2": l.items[2],
    "items.3": l.items[3],
    "items.4": l.items[4],
  });
}

function ceremonyGuideData(idx) {
  const cs = ["Mehendi", "Sangeet", "Haldi", "Wedding Day"];
  return applyOverrides(defaultsFor("ceremony-guide-post"), {
    ceremony: cs[idx % cs.length],
  });
}

function guestManagementData() {
  return applyOverrides(defaultsFor("guest-management-post"), {});
}

function redFlagsData(idx) {
  const heads = [
    "Vendor red flags you should not ignore.",
    "5 red flags in your photographer contract.",
    "Caterer red flags: read before you sign.",
  ];
  return applyOverrides(defaultsFor("red-flags-post"), {
    headline: heads[idx % heads.length],
  });
}

function timelineBuilderData() {
  return applyOverrides(defaultsFor("timeline-builder-post"), {});
}

function vendorNegotiationData() {
  return applyOverrides(defaultsFor("vendor-negotiation-post"), {});
}

function eventBreakdownCarouselData(idx) {
  const events = ["Mehendi", "Sangeet", "Cocktail", "Haldi"];
  return applyOverrides(defaultsFor("event-breakdown-carousel"), {
    eventName: events[idx % events.length],
  });
}

function didYouKnowData(idx) {
  const facts = [
    {
      label: "DID YOU KNOW",
      headline: "Every vendor brief\nincludes *582* planning tasks",
      annotation: "yes, we counted them",
    },
    {
      label: "DID YOU KNOW",
      headline: "The average desi wedding\ntouches *27* vendors",
      annotation: "across 13 ceremonies",
    },
    {
      label: "DID YOU KNOW",
      headline: "70% of brides\nover-spend by *15-20%*",
      annotation: "the 'miscellaneous' line is the silent killer",
    },
  ];
  const f = facts[idx % facts.length];
  return applyOverrides(defaultsFor("did-you-know-post"), {
    categoryLabel: f.label,
    headline: f.headline,
    annotation: f.annotation,
    ctaText: "START YOUR PLAN",
  });
}

function dosAndDontsData(idx) {
  const titles = [
    "Vendor calls — do's and don'ts",
    "Booking the photographer — do's and don'ts",
    "Sangeet planning — do's and don'ts",
  ];
  return applyOverrides(defaultsFor("dos-and-donts-post"), {
    title: titles[idx % titles.length],
  });
}

function planning101ReelData() {
  return applyOverrides(defaultsFor("planning-101-reel"), {});
}

function listCountdownReelData(idx) {
  const sets = [
    {
      title: "5 things to do 12 weeks out",
      items: [
        "Lock the venue contract",
        "Brief the photographer",
        "Send save-the-dates",
        "Approve the moodboard",
        "Book the planner",
      ],
    },
    {
      title: "5 red flags in vendor calls",
      items: [
        "They won't share recent work",
        "They keep dodging the brief",
        "Quotes change every call",
        "References go quiet",
        "They push 'packages' you didn't ask for",
      ],
    },
    {
      title: "5 budget hacks that actually work",
      items: [
        "Cut welcome bag, keep welcome dinner",
        "Buffet > plated, every time",
        "Hire a day-of coordinator",
        "Keep premium liquor for the dance floor",
        "Don't over-floral the mandap",
      ],
    },
  ];
  const s = sets[idx % sets.length];
  return applyOverrides(defaultsFor("list-countdown-reel"), {
    title: s.title,
    "items.0": s.items[0],
    "items.1": s.items[1],
    "items.2": s.items[2],
    "items.3": s.items[3],
    "items.4": s.items[4],
    ctaText: "Save this for your next vendor call.",
  });
}

function countdownReelData() {
  return applyOverrides(defaultsFor("countdown-reel"), {});
}

function budgetPieData(idx) {
  const totals = [
    "Based on a ₹30 lakh wedding",
    "Based on a ₹50 lakh wedding",
    "Based on a ₹15 lakh wedding",
  ];
  return applyOverrides(defaultsFor("budget-pie-post"), {
    budgetTotal: totals[idx % totals.length],
  });
}

function saveVsSplurgeData() {
  return applyOverrides(defaultsFor("save-vs-splurge-post"), {});
}

function budgetRealityData() {
  return applyOverrides(defaultsFor("budget-reality-post"), {});
}

function costByCityData(idx) {
  const cities = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Goa"];
  return applyOverrides(defaultsFor("cost-by-city-post"), {
    cityName: cities[idx % cities.length],
  });
}

function budgetTipsCarouselData() {
  return applyOverrides(defaultsFor("budget-tips-carousel"), {});
}

function realNumbersData(idx) {
  const heads = [
    "What a ₹30L Goa beach wedding actually cost.",
    "What a ₹50L Delhi farmhouse wedding actually cost.",
    "What a ₹22L Bengaluru wedding actually cost.",
  ];
  return applyOverrides(defaultsFor("real-numbers-post"), {
    headline: heads[idx % heads.length],
  });
}

function weddingMathReelData() {
  return applyOverrides(defaultsFor("wedding-math-reel"), {});
}

function budgetReelData() {
  return applyOverrides(defaultsFor("budget-reel"), {});
}

function approvalMatrixData() {
  return applyOverrides(defaultsFor("approval-matrix-post"), {});
}

function statCalloutData(idx) {
  const stats = [
    { num: "582", label: "PLANNING TASKS", desc: "every desi wedding, every detail, tracked across 13 planning phases." },
    { num: "27", label: "VENDORS", desc: "the average wedding touches — and we brief every single one." },
    { num: "₹84 Cr", label: "BRIEFED", desc: "across vendor partners on The Marigold this season." },
  ];
  const s = stats[idx % stats.length];
  return applyOverrides(defaultsFor("stat-callout"), {
    statNumber: s.num,
    statLabel: s.label,
    description: s.desc,
  });
}

function featureCalloutData(idx) {
  const feats = [
    {
      label: "DID YOU KNOW",
      headline: "Every vendor brief\nincludes *582* planning tasks",
      annotation: "yes, we counted them",
    },
    {
      label: "NOW LIVE",
      headline: "Bride Connect — match\nwith brides 6 months ahead",
      annotation: "skip the WhatsApp aunties",
    },
    {
      label: "ON THE PLATFORM",
      headline: "1,200 vetted vendors\nacross 18 cities",
      annotation: "all reviewed by real brides",
    },
  ];
  const f = feats[idx % feats.length];
  return applyOverrides(defaultsFor("feature-callout"), {
    categoryLabel: f.label,
    headline: f.headline,
    annotation: f.annotation,
    ctaText: "START YOUR PLAN",
  });
}

function diarySnippetReelData(idx) {
  const b = BRIDES[idx % BRIDES.length];
  return applyOverrides(defaultsFor("diary-snippet-reel"), {
    brideName: b.name,
    city: b.city,
    excerpt: `Day 1 of the brief: I sent it. ${b.fianceName} is impressed. ${b.fianceName}'s mom has questions.`,
  });
}

function quoteScrollReelData(idx) {
  const v = VENDORS[idx % VENDORS.length];
  return applyOverrides(defaultsFor("quote-scroll-reel"), {
    quote: v.quote,
    attribution: v.attribution,
  });
}

function factStackReelData() {
  return applyOverrides(defaultsFor("fact-stack-reel"), {});
}

function textRevealReelData(idx) {
  return applyOverrides(defaultsFor("text-reveal-reel"), {});
}

function beforeAfterReelData() {
  return applyOverrides(defaultsFor("before-after-reel"), {});
}

function photoMontageReelData() {
  return applyOverrides(defaultsFor("photo-montage-reel"), {});
}

function platformReelData() {
  return applyOverrides(defaultsFor("platform-reel"), {});
}

function editReelData() {
  return applyOverrides(defaultsFor("edit-reel"), {});
}

function editBrideFindsReelData() {
  return applyOverrides(defaultsFor("edit-bride-finds-reel"), {});
}

function splitScreenReelData(idx) {
  return bvmReelData(idx);
}

function askMarigoldStoryData(idx) {
  const qs = [
    "Q: Should I send save-the-dates?\nA: Yes — at 12 weeks out, in the format your guests check (WhatsApp, mostly).",
    "Q: How do I handle a 4am muhurat?\nA: Tell every vendor in writing. Twice. We do this for you in the brief.",
    "Q: My MIL wants to add 60 people. What now?\nA: A 'venue capacity' email from the planner solves 80% of this.",
  ];
  return applyOverrides(defaultsFor("ask-the-marigold-story"), {
    question: qs[idx % qs.length].split("\n")[0],
    answer: qs[idx % qs.length].split("\n")[1] || "",
  });
}

// Master dispatcher: returns (content_data, ai_rationale) given a step.
function buildContentData(step) {
  const tpl = step.template;
  const i = step.idx ?? 0;
  switch (tpl) {
    case "bvm-post": return bvmPostData(i);
    case "bvm-story": return bvmStoryData(i);
    case "bvm-reel": return bvmReelData(i);
    case "split-screen-talk-reel": return splitScreenReelData(i);
    case "confessional-title": return defaultsFor("confessional-title");
    case "confessional-card": return confessionalCardData(step.confessionNumber, i);
    case "confessional-cta": return defaultsFor("confessional-cta");
    case "confessional-reel": return confessionalReelData(step.confessionNumber, i);
    case "tot-post": return totPostData(i);
    case "tot-story": return totStoryData(i);
    case "this-or-that-reel": return totReelData(i);
    case "hot-take-reel": return hotTakeReelData(i);
    case "approval-matrix-post": return approvalMatrixData();
    case "quiz-title-v2": return quizTitleV2Data(step.quizIdx);
    case "quiz-result-v2": return quizResultV2Data(step.quizIdx, step.letter);
    case "quiz-result-post": return quizResultPostData(step.quizIdx, step.letter);
    case "quiz-title": return quizTitleV2Data(step.quizIdx);
    case "quiz-result": return quizResultV2Data(step.quizIdx, step.letter);
    case "venue-feature-post": return venueFeatureData(i);
    case "venue-comparison-post": return venueComparisonData(i);
    case "venue-style-guide": return venueStyleGuideData(i);
    case "dream-venue-reel": return dreamVenueReelData(i);
    case "venue-reel": return venueReelData(i);
    case "planner-profile-post": return plannerProfileData(i);
    case "planner-advice-post": return plannerAdviceData(i);
    case "planner-tips-carousel": return plannerTipsCarouselData(i);
    case "day-of-vs-full-planning-post": return dayOfVsFullData();
    case "vendor-quote": return vendorQuoteData(i);
    case "vendor-feature-post": return vendorFeatureData(i);
    case "vendor-tip-carousel": return vendorTipCarouselData(i);
    case "vendor-quote-reel": return vendorQuoteReelData(i);
    case "vendor-portfolio-reel": return vendorPortfolioReelData(i);
    case "mood-board-reel": return moodBoardReelData(i);
    case "lehenga-style-post": return lehengaStyleData(i);
    case "edit-product-pick-post": return productPickData(i);
    case "edit-trending-now-post": return trendingNowData(i);
    case "edit-top-picks-carousel": return topPicksCarouselData(i);
    case "edit-bride-finds-reel": return editBrideFindsReelData();
    case "edit-reel": return editReelData();
    case "bride-of-the-week-post": return brideOfWeekData(i);
    case "bride-match-profile-post": return brideMatchProfileData(i);
    case "bride-match-story": return brideMatchStoryData(i);
    case "bride-match-duo-post": return brideMatchDuoData(i);
    case "bride-connect-explainer-carousel": return brideConnectExplainerData();
    case "bride-connect-reel": return brideConnectReelData(i);
    case "bride-connect-stories-reel": return brideConnectStoriesReelData(i);
    case "platform-feature-drop-post": return platformFeatureDropData(i);
    case "platform-before-after-post": return platformBeforeAfterData();
    case "platform-how-it-works-carousel": return platformHowItWorksCarouselData();
    case "platform-vs-old-way-post": return platformVsOldWayData();
    case "platform-testimonial-post": return platformTestimonialData(i);
    case "platform-stat-story": return platformStatStoryData();
    case "platform-reel": return platformReelData();
    case "bride-life-self-care-post": return brideLifeSelfCareData(i);
    case "bride-life-relationship-checkin": return brideLifeRelationshipCheckinData();
    case "bride-life-emotional-reality": return brideLifeEmotionalRealityData(i);
    case "bride-life-in-law-navigation": return brideLifeInLawData();
    case "bride-life-affirmation-story": return affirmationStoryData(i);
    case "bride-life-reel": return brideLifeReelData(i);
    case "tradition-explained-post": return traditionExplainedData(i);
    case "regional-spotlight-carousel": return regionalSpotlightData(i);
    case "fusion-wedding-post": return fusionWeddingData(i);
    case "family-roles-post": return familyRolesData();
    case "tradition-reel": return traditionReelData(i);
    case "in-season-trend-post": return inSeasonTrendData(i);
    case "in-season-festival-inspo-post": return festivalInspoData(i);
    case "in-season-prep-carousel": return inSeasonPrepCarouselData();
    case "in-season-monthly-roundup-story": return monthlyRoundupStoryData(i);
    case "seasonal-reel": return seasonalReelData();
    case "poll-results-post": return pollResultsData(i);
    case "milestone-post": return milestoneData(i);
    case "user-story-reel": return userStoryReelData(i);
    case "community-reel": return communityReelData();
    case "submission-cta-story": return submissionCTAStoryData();
    case "checklist-story": return checklistStoryData(i);
    case "ceremony-guide-post": return ceremonyGuideData(i);
    case "guest-management-post": return guestManagementData();
    case "red-flags-post": return redFlagsData(i);
    case "timeline-builder-post": return timelineBuilderData();
    case "vendor-negotiation-post": return vendorNegotiationData();
    case "event-breakdown-carousel": return eventBreakdownCarouselData(i);
    case "did-you-know-post": return didYouKnowData(i);
    case "dos-and-donts-post": return dosAndDontsData(i);
    case "planning-101-reel": return planning101ReelData();
    case "list-countdown-reel": return listCountdownReelData(i);
    case "countdown-reel": return countdownReelData();
    case "budget-pie-post": return budgetPieData(i);
    case "save-vs-splurge-post": return saveVsSplurgeData();
    case "budget-reality-post": return budgetRealityData();
    case "cost-by-city-post": return costByCityData(i);
    case "budget-tips-carousel": return budgetTipsCarouselData();
    case "real-numbers-post": return realNumbersData(i);
    case "wedding-math-reel": return weddingMathReelData();
    case "budget-reel": return budgetReelData();
    case "stat-callout": return statCalloutData(i);
    case "feature-callout": return featureCalloutData(i);
    case "diary-snippet-reel": return diarySnippetReelData(i);
    case "quote-scroll-reel": return quoteScrollReelData(i);
    case "fact-stack-reel": return factStackReelData();
    case "text-reveal-reel": return textRevealReelData(i);
    case "before-after-reel": return beforeAfterReelData();
    case "photo-montage-reel": return photoMontageReelData();
    case "ask-the-marigold-story": return askMarigoldStoryData(i);
    default:
      return defaultsFor(tpl);
  }
}

// ---------------------------------------------------------------------------
// 13-week schedule. Each week lists items in posting order.
// Posts/carousels build the grid (3 per row) so we tag each with grid_color.
// ---------------------------------------------------------------------------

const SCHEDULE = [
  // ---------- WEEK 1 — LAUNCH WEEK ----------
  {
    week: 1,
    items: [
      // MON: BvM post (engage/split) + Confessional story sequence
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-post", format: "post", idx: 0 },
      { day: "monday", series: "confessional", template: "confessional-title", format: "story" },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 0, confessionNumber: 1 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 1, confessionNumber: 2 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 2, confessionNumber: 3 },
      { day: "monday", series: "confessional", template: "confessional-cta", format: "story" },
      // TUE: Mood-board reel + Lehenga style post (inspire/colorful — grid anchor)
      { day: "tuesday", series: "mood-board", template: "lehenga-style-post", format: "post", idx: 0 },
      { day: "tuesday", series: "mood-board", template: "mood-board-reel", format: "reel", idx: 0 },
      // WED: Hot Take reel + Stat Callout post (engage/wine)
      { day: "wednesday", series: "general-purpose", template: "stat-callout", format: "post", idx: 0 },
      { day: "wednesday", series: "hot-takes", template: "hot-take-reel", format: "reel", idx: 0 },
      // THU: Platform feature drop (convert/pink) + Quiz story sequence (engage)
      { day: "thursday", series: "marigold-platform", template: "platform-feature-drop-post", format: "post", idx: 0 },
      { day: "thursday", series: "discover-your", template: "quiz-title-v2", format: "story", quizIdx: 0 },
      { day: "thursday", series: "discover-your", template: "quiz-result-v2", format: "story", quizIdx: 0, letter: "A" },
      { day: "thursday", series: "discover-your", template: "quiz-result-v2", format: "story", quizIdx: 0, letter: "B" },
      // FRI: Vendor quote post (educate/cream)
      { day: "friday", series: "general-purpose", template: "vendor-quote", format: "post", idx: 0 },
      // SAT: Affirmation story (connect)
      { day: "saturday", series: "bride-life", template: "bride-life-affirmation-story", format: "story", idx: 0 },
    ],
  },

  // ---------- WEEK 2 ----------
  {
    week: 2,
    items: [
      // MON: Venue feature post (inspire/colorful — anchor closes row 1 with a non-cream)
      { day: "monday", series: "venue-spotlight", template: "venue-feature-post", format: "post", idx: 0 },
      { day: "monday", series: "general-purpose", template: "ask-the-marigold-story", format: "story", idx: 0 },
      // TUE: Vendor Tips carousel (convert/cream — opens row 2 cleanly)
      { day: "tuesday", series: "vendor-spotlight", template: "vendor-tip-carousel", format: "carousel", idx: 0 },
      { day: "tuesday", series: "this-or-that", template: "tot-story", format: "story", idx: 0 },
      // WED: Tradition Explained (educate/wine)
      { day: "wednesday", series: "culture-corner", template: "tradition-explained-post", format: "post", idx: 0 },
      { day: "wednesday", series: "general-purpose", template: "vendor-quote-reel", format: "reel", idx: 0 },
      // THU: Bride match profile (connect/blush)
      { day: "thursday", series: "bride-connect", template: "bride-match-profile-post", format: "post", idx: 0 },
      { day: "thursday", series: "bride-connect", template: "bride-match-story", format: "story", idx: 1 },
      // FRI: Budget Pie (educate/gold)
      { day: "friday", series: "budget-breakdown", template: "budget-pie-post", format: "post", idx: 0 },
      // SAT: Confession reel
      { day: "saturday", series: "confessional", template: "confessional-reel", format: "reel", idx: 3, confessionNumber: 4 },
    ],
  },

  // ---------- WEEK 3 ----------
  {
    week: 3,
    items: [
      // MON: BvM post (engage/split)
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-post", format: "post", idx: 1 },
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-story", format: "story", idx: 1 },
      // TUE: Lehenga style post (inspire/colorful)
      { day: "tuesday", series: "mood-board", template: "lehenga-style-post", format: "post", idx: 1 },
      // WED: Did You Know (educate/wine)
      { day: "wednesday", series: "planning-101", template: "did-you-know-post", format: "post", idx: 0 },
      { day: "wednesday", series: "planning-101", template: "checklist-story", format: "story", idx: 0 },
      // THU: Save vs Splurge (educate/blush)
      { day: "thursday", series: "budget-breakdown", template: "save-vs-splurge-post", format: "post", idx: 0 },
      { day: "thursday", series: "hot-takes", template: "hot-take-reel", format: "reel", idx: 1 },
      // FRI: Bride of the Week carousel-coverable post (connect/gold)
      { day: "friday", series: "community", template: "bride-of-the-week-post", format: "post", idx: 0 },
      // SAT/SUN: Affirmation + ToT story
      { day: "saturday", series: "this-or-that", template: "tot-story", format: "story", idx: 1 },
      { day: "sunday", series: "bride-life", template: "bride-life-affirmation-story", format: "story", idx: 1 },
    ],
  },

  // ---------- WEEK 4 ----------
  {
    week: 4,
    items: [
      // MON: This or That post (engage/split)
      { day: "monday", series: "this-or-that", template: "tot-post", format: "post", idx: 0 },
      { day: "monday", series: "confessional", template: "confessional-title", format: "story" },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 4, confessionNumber: 5 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 5, confessionNumber: 6 },
      { day: "monday", series: "confessional", template: "confessional-cta", format: "story" },
      // TUE: Vendor Feature (convert/colorful — anchor)
      { day: "tuesday", series: "vendor-spotlight", template: "vendor-feature-post", format: "post", idx: 0 },
      // WED: Real Numbers (educate/cream)
      { day: "wednesday", series: "budget-breakdown", template: "real-numbers-post", format: "post", idx: 0 },
      { day: "wednesday", series: "budget-breakdown", template: "wedding-math-reel", format: "reel", idx: 0 },
      // THU: Feature Callout (convert/pink)
      { day: "thursday", series: "general-purpose", template: "feature-callout", format: "post", idx: 0 },
      // FRI: Seasonal Trend (inspire/gold)
      { day: "friday", series: "in-season", template: "in-season-trend-post", format: "post", idx: 0 },
      // SAT: Ask Marigold story
      { day: "saturday", series: "general-purpose", template: "ask-the-marigold-story", format: "story", idx: 1 },
    ],
  },

  // ---------- WEEK 5 ----------
  {
    week: 5,
    items: [
      // MON: Hot Take reel + Stat Callout (engage/wine)
      { day: "monday", series: "general-purpose", template: "stat-callout", format: "post", idx: 1 },
      { day: "monday", series: "hot-takes", template: "hot-take-reel", format: "reel", idx: 2 },
      // TUE: Venue Style Guide carousel (inspire/colorful — anchor)
      { day: "tuesday", series: "venue-spotlight", template: "venue-style-guide", format: "carousel", idx: 1 },
      // WED: Cost by City (educate/split)
      { day: "wednesday", series: "budget-breakdown", template: "cost-by-city-post", format: "post", idx: 0 },
      { day: "wednesday", series: "planning-101", template: "checklist-story", format: "story", idx: 1 },
      // THU: Self-care (connect/pink)
      { day: "thursday", series: "bride-life", template: "bride-life-self-care-post", format: "post", idx: 0 },
      { day: "thursday", series: "discover-your", template: "quiz-title-v2", format: "story", quizIdx: 1 },
      { day: "thursday", series: "discover-your", template: "quiz-result-v2", format: "story", quizIdx: 1, letter: "C" },
      // FRI: Vendor Quote (educate/cream)
      { day: "friday", series: "general-purpose", template: "vendor-quote", format: "post", idx: 1 },
      // SAT: BvM reel
      { day: "saturday", series: "bridezilla-vs-momzilla", template: "bvm-reel", format: "reel", idx: 2 },
    ],
  },

  // ---------- WEEK 6 ----------
  {
    week: 6,
    items: [
      // MON: BvM post (engage/split)
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-post", format: "post", idx: 3 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 6, confessionNumber: 7 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 7, confessionNumber: 8 },
      // TUE: Mood Board lehenga (inspire/colorful)
      { day: "tuesday", series: "mood-board", template: "lehenga-style-post", format: "post", idx: 2 },
      // WED: Planning 101 — Red Flags (educate/wine)
      { day: "wednesday", series: "planning-101", template: "red-flags-post", format: "post", idx: 0 },
      { day: "wednesday", series: "planning-101", template: "list-countdown-reel", format: "reel", idx: 0 },
      // THU: Platform How It Works carousel (convert/pink)
      { day: "thursday", series: "marigold-platform", template: "platform-how-it-works-carousel", format: "carousel" },
      // FRI: Bride Match Duo (connect/blush)
      { day: "friday", series: "bride-connect", template: "bride-match-duo-post", format: "post", idx: 1 },
      // SAT: Affirmation story
      { day: "saturday", series: "bride-life", template: "bride-life-affirmation-story", format: "story", idx: 2 },
    ],
  },

  // ---------- WEEK 7 ----------
  {
    week: 7,
    items: [
      // MON: This or That post (engage/split)
      { day: "monday", series: "this-or-that", template: "tot-post", format: "post", idx: 1 },
      { day: "monday", series: "this-or-that", template: "tot-story", format: "story", idx: 2 },
      // TUE: Planner Profile (convert/colorful — anchor)
      { day: "tuesday", series: "planner-spotlight", template: "planner-profile-post", format: "post", idx: 0 },
      // WED: Vendor Negotiation (educate/cream)
      { day: "wednesday", series: "planning-101", template: "vendor-negotiation-post", format: "post", idx: 0 },
      { day: "wednesday", series: "general-purpose", template: "ask-the-marigold-story", format: "story", idx: 2 },
      // THU: Budget Pie (educate/gold)
      { day: "thursday", series: "budget-breakdown", template: "budget-pie-post", format: "post", idx: 1 },
      { day: "thursday", series: "the-countdown", template: "countdown-reel", format: "reel" },
      // FRI: Marigold Edit Product Pick (inspire/colorful — splits the gold/gold/split row)
      { day: "friday", series: "the-marigold-edit", template: "edit-product-pick-post", format: "post", idx: 0 },
      // SAT: Confessional reel
      { day: "saturday", series: "confessional", template: "confessional-reel", format: "reel", idx: 8, confessionNumber: 9 },
    ],
  },

  // ---------- WEEK 8 ----------
  {
    week: 8,
    items: [
      // MON: Confessional title sequence + BvM-as-post (engage/split)
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-post", format: "post", idx: 4 },
      { day: "monday", series: "confessional", template: "confessional-title", format: "story" },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 9, confessionNumber: 10 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 10, confessionNumber: 11 },
      { day: "monday", series: "confessional", template: "confessional-cta", format: "story" },
      // TUE: Venue Feature (inspire/colorful)
      { day: "tuesday", series: "venue-spotlight", template: "venue-feature-post", format: "post", idx: 2 },
      { day: "tuesday", series: "venue-spotlight", template: "dream-venue-reel", format: "reel", idx: 2 },
      // WED: Tradition Explained (educate/wine)
      { day: "wednesday", series: "culture-corner", template: "tradition-explained-post", format: "post", idx: 1 },
      // THU: Platform Testimonial (convert/blush)
      { day: "thursday", series: "marigold-platform", template: "platform-testimonial-post", format: "post", idx: 0 },
      // FRI: Vendor Quote (educate/cream)
      { day: "friday", series: "general-purpose", template: "vendor-quote", format: "post", idx: 2 },
      // SAT: BoTW story
      { day: "saturday", series: "community", template: "submission-cta-story", format: "story" },
    ],
  },

  // ---------- WEEK 9 ----------
  {
    week: 9,
    items: [
      // MON: Approval Matrix (engage/split)
      { day: "monday", series: "hot-takes", template: "approval-matrix-post", format: "post" },
      { day: "monday", series: "hot-takes", template: "hot-take-reel", format: "reel", idx: 3 },
      // TUE: Lehenga style (inspire/colorful)
      { day: "tuesday", series: "mood-board", template: "lehenga-style-post", format: "post", idx: 3 },
      // WED: Ceremony Guide (educate/wine)
      { day: "wednesday", series: "planning-101", template: "ceremony-guide-post", format: "post", idx: 0 },
      { day: "wednesday", series: "planning-101", template: "checklist-story", format: "story", idx: 2 },
      // THU: Bride Connect explainer carousel (connect/pink)
      { day: "thursday", series: "bride-connect", template: "bride-connect-explainer-carousel", format: "carousel" },
      // FRI: Festival Inspo (inspire/gold)
      { day: "friday", series: "in-season", template: "in-season-festival-inspo-post", format: "post", idx: 0 },
      // SAT: ToT reel
      { day: "saturday", series: "this-or-that", template: "this-or-that-reel", format: "reel", idx: 3 },
    ],
  },

  // ---------- WEEK 10 ----------
  {
    week: 10,
    items: [
      // MON: BvM post (engage/split)
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-post", format: "post", idx: 5 },
      // TUE: Vendor Feature (convert/colorful — anchor)
      { day: "tuesday", series: "vendor-spotlight", template: "vendor-feature-post", format: "post", idx: 3 },
      { day: "tuesday", series: "vendor-spotlight", template: "vendor-portfolio-reel", format: "reel", idx: 3 },
      // WED: Did You Know (educate/wine)
      { day: "wednesday", series: "planning-101", template: "did-you-know-post", format: "post", idx: 1 },
      // THU: Save vs Splurge (educate/blush)
      { day: "thursday", series: "budget-breakdown", template: "save-vs-splurge-post", format: "post", idx: 1 },
      { day: "thursday", series: "discover-your", template: "quiz-title-v2", format: "story", quizIdx: 2 },
      { day: "thursday", series: "discover-your", template: "quiz-result-v2", format: "story", quizIdx: 2, letter: "B" },
      // FRI: Milestone (connect/gold)
      { day: "friday", series: "community", template: "milestone-post", format: "post", idx: 0 },
      // SAT: Affirmation
      { day: "saturday", series: "bride-life", template: "bride-life-affirmation-story", format: "story", idx: 3 },
    ],
  },

  // ---------- WEEK 11 ----------
  {
    week: 11,
    items: [
      // MON: This or That post (engage/split)
      { day: "monday", series: "this-or-that", template: "tot-post", format: "post", idx: 2 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 11, confessionNumber: 12 },
      // TUE: In-Season Prep carousel (inspire/colorful — anchor for row pair 16-17)
      { day: "tuesday", series: "in-season", template: "in-season-prep-carousel", format: "carousel" },
      // WED: Day-of vs Full Planning (convert/split)
      // (skip split repeat — use cream cousin)
      { day: "wednesday", series: "planning-101", template: "timeline-builder-post", format: "post" },
      { day: "wednesday", series: "planning-101", template: "planning-101-reel", format: "reel" },
      // THU: Bride Match profile (connect/blush)
      { day: "thursday", series: "bride-connect", template: "bride-match-profile-post", format: "post", idx: 2 },
      // FRI: Real Numbers (educate/cream)
      { day: "friday", series: "budget-breakdown", template: "real-numbers-post", format: "post", idx: 1 },
      // SAT: Real Bride Diary snippet reel (connect)
      { day: "saturday", series: "real-bride-diaries", template: "diary-snippet-reel", format: "reel", idx: 4 },
    ],
  },

  // ---------- WEEK 12 ----------
  {
    week: 12,
    items: [
      // MON: BvM post (engage/split)
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-post", format: "post", idx: 7 },
      { day: "monday", series: "bridezilla-vs-momzilla", template: "bvm-story", format: "story", idx: 7 },
      // TUE: Venue Comparison (inspire/split)... use Planner Profile instead for variety (colorful — anchor)
      { day: "tuesday", series: "planner-spotlight", template: "planner-profile-post", format: "post", idx: 1 },
      // WED: Regional Spotlight carousel (educate/colorful — anchor)
      { day: "wednesday", series: "culture-corner", template: "regional-spotlight-carousel", format: "carousel", idx: 1 },
      // THU: Platform Before/After (convert/split)
      // skip split conflict; use Feature Callout (pink)
      { day: "thursday", series: "marigold-platform", template: "platform-feature-drop-post", format: "post", idx: 1 },
      { day: "thursday", series: "marigold-platform", template: "platform-stat-story", format: "story" },
      // FRI: Bride of the Week (connect/gold)
      { day: "friday", series: "community", template: "bride-of-the-week-post", format: "post", idx: 1 },
      // SAT: Hot take reel + Affirmation
      { day: "saturday", series: "hot-takes", template: "hot-take-reel", format: "reel", idx: 4 },
      { day: "saturday", series: "bride-life", template: "bride-life-affirmation-story", format: "story", idx: 0 },
    ],
  },

  // ---------- WEEK 13 ----------
  {
    week: 13,
    items: [
      // MON: Confessional sequence + Approval Matrix (engage/split)
      { day: "monday", series: "hot-takes", template: "approval-matrix-post", format: "post" },
      { day: "monday", series: "confessional", template: "confessional-title", format: "story" },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 0, confessionNumber: 13 },
      { day: "monday", series: "confessional", template: "confessional-card", format: "story", idx: 1, confessionNumber: 14 },
      { day: "monday", series: "confessional", template: "confessional-cta", format: "story" },
      // TUE: Mood Board reel + Lehenga style (inspire/colorful)
      { day: "tuesday", series: "mood-board", template: "lehenga-style-post", format: "post", idx: 4 },
      { day: "tuesday", series: "mood-board", template: "mood-board-reel", format: "reel", idx: 1 },
      // WED: Family Roles (educate/wine)
      { day: "wednesday", series: "culture-corner", template: "family-roles-post", format: "post" },
      // THU: Platform How It Works (convert/pink) — wait used wk6. Use Day-of vs Full Planning instead — split conflict.
      // Use Vendor Tip carousel (cream/educate)
      { day: "thursday", series: "vendor-spotlight", template: "vendor-tip-carousel", format: "carousel", idx: 4 },
      { day: "thursday", series: "general-purpose", template: "ask-the-marigold-story", format: "story", idx: 0 },
      // FRI: Edit Product Pick (inspire/colorful — but wait, Tue already had colorful inspire; use Trending Now (gold) instead)
      { day: "friday", series: "the-marigold-edit", template: "edit-trending-now-post", format: "post", idx: 1 },
      // SAT: Confession reel close
      { day: "saturday", series: "confessional", template: "confessional-reel", format: "reel", idx: 11, confessionNumber: 15 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Caption + rationale generator
// ---------------------------------------------------------------------------

function captionFor(step, data) {
  const tpl = step.template;
  const pillar = pillarFor(step.series);
  const tags = tagsLine(pillar);
  switch (tpl) {
    case "bvm-post":
    case "bvm-story":
    case "bvm-reel":
    case "split-screen-talk-reel":
      return `Episode ${data.episodeNumber || "—"}: ${data.episodeTopic || data.topic}.\n\nBride says ${(data.brideQuote || data["exchanges.0.bride"] || "").trim()}\nMom says ${(data.momQuote || data["exchanges.0.mom"] || "").trim()}\n\nWho's right? Drop a 🎯 for bride, 🌶️ for mom.\n\n${tags}`;
    case "confessional-card":
    case "confessional-reel":
      return `Confession #${data.confessionNumber}.\n\n"${data.confessionText}"\n\nGot one of your own? Submit anonymously — link in bio.\n\n${tags}`;
    case "confessional-title":
      return `Welcome to The Confessional.\n\nAnonymous. Unfiltered. Judgment-free.\n\nSwipe to read this week's confessions. Got one of your own? Link in bio.\n\n${tags}`;
    case "confessional-cta":
      return `Your turn.\n\nSubmit your confession anonymously — link in bio. We never share names. Promise. 🤫\n\n${tags}`;
    case "tot-post":
    case "tot-story":
    case "this-or-that-reel":
      return `${data.topicLabel || data.topic}: ${data.optionA || data["exchanges.0.bride"]} or ${data.optionB || data["exchanges.0.mom"]}?\n\nDrop your pick in the comments. We're keeping score. ✨\n\n${tags}`;
    case "hot-take-reel":
      return `${(step.idx ?? 0) % 2 === 0 ? "Hot take:" : "Unpopular opinion:"} ${(data["lines.3"] || data["lines.0"] || "").replace(/\.$/, "")}.\n\nFight us in the comments.\n\n${tags}`;
    case "approval-matrix-post":
      return `The Wedding Trend Approval Matrix.\n\nWhere does your mom land on this? Tag her in the comments — let's see how brave you are. 😅\n\n${tags}`;
    case "venue-feature-post":
    case "venue-style-guide":
    case "dream-venue-reel":
    case "venue-reel":
      return `${data.venueName} — ${data.location}.\n\n${data.whyWeLikeIt || "Tour it on The Marigold."}\n\nWould you say yes here? 💍\n\n${tags}`;
    case "venue-comparison-post":
      return `Two takes on a destination wedding — ${data["venueA.name"]} vs ${data["venueB.name"]}.\n\nWhich one are you booking? Drop your pick.\n\n${tags}`;
    case "planner-profile-post":
    case "planner-advice-post":
    case "planner-tips-carousel":
      return `${data.plannerName} — ${data.agencyName || ""}.\n\n${data.style || data.advice || ""}\n\nFind your planner on The Marigold.\n\n${tags}`;
    case "vendor-feature-post":
    case "vendor-tip-carousel":
    case "vendor-portfolio-reel":
      return `${data.vendorName} — ${data.category || ""}.\n\n${data.whyWeLikeThem || "Why we keep recommending them."}\n\nMore vetted vendors on The Marigold. ✨\n\n${tags}`;
    case "vendor-quote":
    case "vendor-quote-reel":
    case "quote-scroll-reel":
      return `"${data.quote}"\n\n${data.attribution || ""}\n\nSave this for your next vendor call.\n\n${tags}`;
    case "lehenga-style-post":
      return `${data.title} by ${data.designerName}.\n\n${data.description}\n\nWhich occasion would you wear this for? 💖\n\n${tags}`;
    case "mood-board-reel":
      return `Build your moodboard, brief every vendor — only on The Marigold.\n\nWhat's your palette? Drop the hex codes. 🎨\n\n${tags}`;
    case "edit-product-pick-post":
      return `${data.productName} — ${data.brand}.\n\n${data.whyWePickedIt}\n\nMore picks on The Marigold Edit.\n\n${tags}`;
    case "edit-trending-now-post":
    case "edit-top-picks-carousel":
    case "edit-bride-finds-reel":
    case "edit-reel":
      return `This week's Marigold Edit — what brides are loving, ranked.\n\nWhich one is on your list? 🛍️\n\n${tags}`;
    case "bride-of-the-week-post":
      return `Bride of the week: ${data.brideName} & ${data.fianceName}, ${data.weddingDate}.\n\n"${data.quote}"\n\nMeet more brides on The Marigold.\n\n${tags}`;
    case "bride-match-profile-post":
    case "bride-match-story":
      return `Meet ${data.brideName} — ${data.city}, ${data.weddingDate}.\n\n"${data.quote}"\n\nMatch with brides ahead of you on Bride Connect.\n\n${tags}`;
    case "bride-match-duo-post":
      return `${data["brideA.name"]} ↔ ${data["brideB.name"]}: matched on Bride Connect.\n\nFind your match — link in bio.\n\n${tags}`;
    case "bride-connect-explainer-carousel":
    case "bride-connect-reel":
    case "bride-connect-stories-reel":
      return `Bride Connect — match with brides 6 months ahead. Real timelines, real DMs, no aunties.\n\nJoin the waitlist — link in bio.\n\n${tags}`;
    case "platform-feature-drop-post":
    case "platform-how-it-works-carousel":
    case "platform-vs-old-way-post":
    case "platform-before-after-post":
    case "platform-stat-story":
    case "platform-reel":
      return `${data.headline || "Now live on The Marigold."}\n\n${data.description || "Try it free — link in bio."}\n\n${tags}`;
    case "platform-testimonial-post":
      return `"${data.quote}"\n\n— ${data.brideName}, ${data.city}\n\nReady to brief your wedding? Link in bio.\n\n${tags}`;
    case "bride-life-self-care-post":
    case "bride-life-relationship-checkin":
    case "bride-life-emotional-reality":
    case "bride-life-in-law-navigation":
    case "bride-life-reel":
      return `${data.headline || "Bride Life, real talk."}\n\nSave this for the week your inbox is loud. ✨\n\n${tags}`;
    case "bride-life-affirmation-story":
      return null;
    case "tradition-explained-post":
    case "tradition-reel":
      return `${data.title || "Tradition, explained."}\n\n${data.description || ""}\n\nWhat traditions are you keeping? Tell us. 🌸\n\n${tags}`;
    case "regional-spotlight-carousel":
      return `${data.region} — the wedding traditions you actually need to know.\n\nSwipe through. Save for your planning. ✨\n\n${tags}`;
    case "fusion-wedding-post":
      return `${data.fusionTitle} — fusion wedding, broken down.\n\nFusion brides, drop your origin story. 🌍\n\n${tags}`;
    case "family-roles-post":
      return `Who actually does what at a desi wedding — a family role decoder.\n\nTag the cousin who needs this. 🙃\n\n${tags}`;
    case "in-season-trend-post":
      return `${data.seasonLabel}: ${data.headline}.\n\n${data.description}\n\nWhat trend are you saying yes to?\n\n${tags}`;
    case "in-season-festival-inspo-post":
      return `Festival-coded engagement ideas — ${data.festival}. Soft. Romantic. Easy.\n\nWhich one are you stealing? ✨\n\n${tags}`;
    case "in-season-prep-carousel":
      return `Wedding-season prep, week by week. Swipe to plan your runway.\n\n${tags}`;
    case "poll-results-post":
      return `Poll results: ${data.pollQuestion}\n\nBrides have spoken. Drop your take in the comments.\n\n${tags}`;
    case "milestone-post":
      return `${data.statNumber} ${data.statLabel}.\n\n${data.description}\n\nThank you for building this with us. 🌼\n\n${tags}`;
    case "user-story-reel":
    case "community-reel":
      return `Real brides. Real stories. Real planning.\n\nSubmit yours — link in bio.\n\n${tags}`;
    case "ceremony-guide-post":
      return `${data.ceremony} — the only guide you need. Save for the planning chat. ✨\n\n${tags}`;
    case "guest-management-post":
      return `Guest list management without losing your mind. Save this for your next aunty conflict. 🛡️\n\n${tags}`;
    case "red-flags-post":
      return `${data.headline}\n\nSave this for your next vendor call. 🚩\n\n${tags}`;
    case "timeline-builder-post":
      return `Your day-of timeline, broken down. Tag your day-of coordinator.\n\n${tags}`;
    case "vendor-negotiation-post":
      return `How to negotiate vendor quotes without losing the vendor. Save it. Use it. ✨\n\n${tags}`;
    case "event-breakdown-carousel":
      return `${data.eventName} — broken down hour by hour. Swipe to see the whole flow.\n\n${tags}`;
    case "did-you-know-post":
    case "feature-callout":
    case "stat-callout":
      return `${data.headline?.replace(/\*/g, "") || data.statLabel}\n\n${data.annotation || data.description || ""}\n\nStart your plan on The Marigold. ✨\n\n${tags}`;
    case "dos-and-donts-post":
      return `${data.title} — save before your next call.\n\n${tags}`;
    case "planning-101-reel":
    case "list-countdown-reel":
    case "countdown-reel":
      return `${data.title || "Planning 101 — save and share."}\n\n${data.ctaText || ""}\n\n${tags}`;
    case "budget-pie-post":
      return `Where the ₹ actually goes — ${data.budgetTotal}.\n\nWhat's blowing your budget? Drop it in the comments. 💸\n\n${tags}`;
    case "save-vs-splurge-post":
      return `Save vs. splurge — the only list that matters.\n\nWhat's on your splurge list? 💖\n\n${tags}`;
    case "budget-reality-post":
      return `Planned vs. actual — what desi wedding budgets actually look like.\n\nHonest take: how off were you? 😅\n\n${tags}`;
    case "cost-by-city-post":
      return `What weddings actually cost in ${data.cityName}.\n\nSave for the planning chat. 💸\n\n${tags}`;
    case "real-numbers-post":
      return `${data.headline}\n\nSwipe through the actual line items. ✨\n\n${tags}`;
    case "wedding-math-reel":
    case "budget-reel":
      return `Wedding math, real numbers, no fluff.\n\nSave it before your next budget meeting.\n\n${tags}`;
    case "budget-tips-carousel":
      return `Budget tips that actually move the line. Swipe and save. 💸\n\n${tags}`;
    case "diary-snippet-reel":
      return `From the diary of ${data.brideName}, ${data.city}.\n\nReal brides. Real planning. Real Marigold.\n\n${tags}`;
    case "fact-stack-reel":
    case "text-reveal-reel":
    case "before-after-reel":
    case "photo-montage-reel":
      return `${(data.ctaText || "Save this for the planning chat.")}\n\n${tags}`;
    case "ask-the-marigold-story":
    case "in-season-monthly-roundup-story":
    case "platform-stat-story":
    case "checklist-story":
    case "submission-cta-story":
    case "quiz-title":
    case "quiz-result":
    case "quiz-title-v2":
    case "quiz-result-v2":
    case "quiz-result-post":
      return null;
    default:
      return null;
  }
}

function rationaleFor(step) {
  const pillar = pillarFor(step.series);
  const series = SERIES_BY_SLUG[step.series]?.name || step.series;
  switch (step.format) {
    case "story":
      return `${series} story — runs alongside grid posts to drive DMs and saves. Format chosen for fast tap-through.`;
    case "reel":
      return `${series} reel — no-camera format optimized for shares. Fits the ${pillar} pillar.`;
    case "carousel":
      return `${series} carousel — designed to live on the grid as a single tile (cover) and reward swipes with depth. ${pillar.toUpperCase()} pillar.`;
    default:
      return `${series} feed post — tile is positioned to balance the row's color profile and keep the ${pillar} pillar represented this week.`;
  }
}

// ---------------------------------------------------------------------------
// Build the seed
// ---------------------------------------------------------------------------

const out = [];
let gridCol = 0;
let gridRow = 0;

for (const wk of SCHEDULE) {
  for (const step of wk.items) {
    const tpl = TEMPLATE_BY_SLUG[step.template];
    if (!tpl) {
      console.warn(`!! unknown template: ${step.template}`);
      continue;
    }
    const data = buildContentData(step);
    const pillar = pillarFor(step.series);
    const color = colorFor(step.template);

    let grid_position = null;
    if (step.format === "post" || step.format === "carousel") {
      grid_position = { row: gridRow, col: gridCol };
      gridCol += 1;
      if (gridCol >= 3) {
        gridCol = 0;
        gridRow += 1;
      }
    }

    out.push({
      id: crypto.randomUUID(),
      week: wk.week,
      day: step.day,
      series: step.series,
      template: step.template,
      format: step.format,
      pillar,
      grid_color_profile: color,
      grid_position,
      content_data: data,
      caption: captionFor(step, data),
      ai_rationale: rationaleFor(step),
      status: "approved",
    });
  }
}

const result = {
  metadata: {
    brand: "The Marigold",
    handle: "@themarigold",
    period: "13 weeks (Phase 2 launch plan)",
    generated_at: new Date().toISOString(),
    item_count: out.length,
    note: "Generated by scripts/generate-calendar-seed.mjs — full-template-library plan with grid color/pillar balance.",
  },
  content: out,
};

fs.writeFileSync(
  path.join(ROOT, "src/data/content-calendar-seed.json"),
  JSON.stringify(result, null, 2),
);

// ---------------------------------------------------------------------------
// Verification + summary
// ---------------------------------------------------------------------------

console.log(`\nWrote src/data/content-calendar-seed.json — ${out.length} items.\n`);

// By format
const byFormat = {};
for (const it of out) byFormat[it.format] = (byFormat[it.format] || 0) + 1;
console.log("By format:");
for (const k of Object.keys(byFormat)) console.log(`  ${k}: ${byFormat[k]}`);

// By pillar
const byPillar = {};
for (const it of out) byPillar[it.pillar] = (byPillar[it.pillar] || 0) + 1;
console.log("\nBy pillar (all items):");
for (const k of Object.keys(byPillar)) console.log(`  ${k}: ${byPillar[k]}`);

// By pillar (feed posts only)
const feedItems = out.filter((i) => i.format === "post" || i.format === "carousel");
const feedByPillar = {};
for (const it of feedItems) feedByPillar[it.pillar] = (feedByPillar[it.pillar] || 0) + 1;
console.log("\nBy pillar (feed posts + carousels — these drive the grid):");
for (const k of Object.keys(feedByPillar)) console.log(`  ${k}: ${feedByPillar[k]}`);

// By series
const bySeries = {};
for (const it of out) bySeries[it.series] = (bySeries[it.series] || 0) + 1;
console.log("\nBy series:");
const seriesSorted = Object.entries(bySeries).sort((a, b) => b[1] - a[1]);
for (const [k, v] of seriesSorted) console.log(`  ${k}: ${v}`);

// Series coverage
const allSeries = series.map((s) => s.slug);
const missing = allSeries.filter((s) => !bySeries[s]);
console.log(`\nSeries used: ${Object.keys(bySeries).length} / ${allSeries.length}`);
if (missing.length) console.log(`  Missing: ${missing.join(", ")}`);

// Grid rows — color sequence
const rows = {};
for (const it of feedItems) {
  if (!it.grid_position) continue;
  const r = it.grid_position.row;
  rows[r] = rows[r] || [];
  rows[r].push(it);
}
console.log(`\nGrid rows: ${Object.keys(rows).length}`);
console.log("\nGrid color sequence — first 5 rows:");
for (let r = 0; r < Math.min(5, Object.keys(rows).length); r++) {
  const cells = (rows[r] || [])
    .sort((a, b) => a.grid_position.col - b.grid_position.col)
    .map((c) => `${c.grid_color_profile || "?"}/${c.pillar}`);
  console.log(`  row ${r}: ${cells.join("  |  ")}`);
}

// Verify rule: no row has 2 same color
let rowViolations = 0;
let rowsWithoutColorful = 0;
const rowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);
for (let i = 0; i < rowKeys.length; i++) {
  const r = rowKeys[i];
  const cells = rows[r];
  const colors = cells.map((c) => c.grid_color_profile);
  const dup = colors.filter((c, idx) => colors.indexOf(c) !== idx);
  if (dup.length) {
    rowViolations++;
    console.log(`  ⚠ row ${r} has duplicate color: ${colors.join(", ")}`);
  }
  // every 2 rows: at least one colorful
  if (i % 2 === 1) {
    const r0 = rowKeys[i - 1];
    const r1 = r;
    const combo = [...(rows[r0] || []), ...(rows[r1] || [])];
    if (!combo.some((c) => c.grid_color_profile === "colorful")) {
      rowsWithoutColorful++;
      console.log(`  ⚠ row pair ${r0}-${r1} has no COLORFUL anchor`);
    }
  }
}
console.log(`\nRow-color-duplicate violations: ${rowViolations}`);
console.log(`Row-pairs missing colorful anchor: ${rowsWithoutColorful}`);
