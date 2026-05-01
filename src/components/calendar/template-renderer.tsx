/**
 * Maps a stored CalendarItem (template_slug + content_data) to a rendered
 * React element. The Feed Calendar uses this for thumbnail previews; the
 * editor (Phase 3) will reuse it for the live preview pane.
 *
 * Each branch normalises the loose `content_data` shape (which may include
 * dotted keys like `options.A` or be partially populated) into the strict
 * props each template component expects.
 */

import type { ReactNode } from "react";
import {
  BvMPost,
  BvMReelStaticPreview,
  BvMStory,
} from "@/components/templates/bridezilla-vs-momzilla";
import {
  ConfessionalCard,
  ConfessionalCTA,
  ConfessionalReelStaticPreview,
  ConfessionalTitle,
  type ConfessionalVariant,
} from "@/components/templates/confessional";
import type { ConfessionalHighlightColor } from "@/lib/confessional-timing";
import {
  QuizResult,
  QuizResultPost,
  QuizResultV2,
  QuizTitle,
  QuizTitleV2,
  type QuizBackgroundColor,
  type QuizIconType,
  type QuizResultType,
  type QuizTitleV2Option,
} from "@/components/templates/bride-energy-quiz";
import {
  AskTheMarigoldStory,
  FeatureCallout,
  StatCallout,
  VendorQuote,
} from "@/components/templates/general";
import {
  VendorFeaturePost,
  VendorPortfolioReelStaticPreview,
  VendorTipCarousel,
  VendorQuoteReelStaticPreview,
  type VendorAccentColor,
  type VendorTip,
} from "@/components/templates/vendor-spotlight";
import {
  DayOfVsFullPlanningPost,
  PlannerAdvicePost,
  PlannerProfilePost,
  PlannerTipsCarousel,
  type PlannerAdviceAccent,
  type PlannerTip,
} from "@/components/templates/planner-spotlight";
import {
  DreamVenueReelStaticPreview,
  VenueComparisonPost,
  VenueFeaturePost,
  VenueReelStaticPreview,
  VenueStyleGuide,
  type VenueComparisonAttributes,
  type VenueStyleBackground,
  type VenueStyleSlide,
  type VenueType,
} from "@/components/templates/venue-spotlight";
import {
  ThisOrThatPost,
  ThisOrThatReelStaticPreview,
  ThisOrThatStory,
  type ThisOrThatColorScheme,
} from "@/components/templates/this-or-that";
import {
  BrideFindsReelStaticPreview,
  EditReelStaticPreview,
  ProductPickPost,
  TopPicksCarousel,
  TrendingNowPost,
  type BrideFind,
  type EditCategory,
  type TopPick,
  type TrendCategory,
} from "@/components/templates/marigold-edit";
import {
  CeremonyGuidePost,
  ChecklistStory,
  DidYouKnowPost,
  DosAndDontsPost,
  EventBreakdownCarousel,
  GuestManagementPost,
  Planning101ReelStaticPreview,
  RedFlagsPost,
  TimelineBuilderPost,
  VendorNegotiationPost,
  type BudgetLine,
  type CeremonyHeaderColor,
  type EventBreakdownTimelineEntry,
  type EventColor,
  type GuestManagementTip,
  type NegotiationTip,
  type RedFlag,
  type RedFlagCategory,
  type TimelineEntry,
} from "@/components/templates/planning-101";
import {
  AffirmationStory,
  BrideLifeReelStaticPreview,
  EmotionalRealityPost,
  InLawNavigationPost,
  RelationshipCheckInPost,
  SelfCarePost,
  type AffirmationGradient,
  type SelfCareIcon,
  type SelfCareItem,
} from "@/components/templates/bride-life";
import {
  FamilyRolesPost,
  FusionWeddingPost,
  RegionalSpotlightCarousel,
  TraditionExplainedPost,
  TraditionReelStaticPreview,
  type CultureIconType,
  type FamilyRole,
  type RegionalSlide,
  type RegionColor,
} from "@/components/templates/culture-corner";
import {
  BrideOfTheWeekPost,
  CommunityReelStaticPreview,
  MilestonePost,
  PollResultsPost,
  SubmissionCTAStory,
  UserStoryReelStaticPreview,
  type SubmissionButtonType,
} from "@/components/templates/community";
import {
  BrideConnectExplainerCarousel,
  BrideConnectReelStaticPreview,
  BrideConnectStoriesReelStaticPreview,
  BrideMatchDuoPost,
  BrideMatchProfilePost,
  BrideMatchStory,
  type BrideMatchStoryExtraPrompt,
} from "@/components/templates/bride-connect";
import {
  BeforeAfterReelStaticPreview,
  FactStackReelStaticPreview,
  ListCountdownReelStaticPreview,
  PhotoMontageReelStaticPreview,
  QuoteScrollReelStaticPreview,
  SplitScreenTalkReelStaticPreview,
  TextRevealReelStaticPreview,
  type BeforeAfterTransition,
  type CountdownItem,
  type FactStackColor,
  type FactStackFact,
  type KenBurnsDirection,
  type PhotoMontageOverlay,
  type PhotoMontageSlide,
  type ScrollQuote,
  type SplitScreenExchange,
  type TextRevealFont,
  type TextRevealGradient,
} from "@/components/templates/reels";
import {
  ApprovalMatrixPost,
  HotTakeCarousel,
  HotTakePost,
  HotTakeReelStaticPreview,
  HotTakeStory,
  type ApprovalMatrixItem,
} from "@/components/templates/hot-takes";
import {
  CountdownCarousel,
  CountdownPost,
  CountdownReelStaticPreview,
  type CountdownMilestone,
} from "@/components/templates/countdown";
import {
  BudgetPiePost,
  BudgetRealityPost,
  BudgetReelStaticPreview,
  BudgetTipsCarousel,
  CostByCityPost,
  RealNumbersPost,
  SaveVsSplurgePost,
  WeddingMathReelStaticPreview,
  type BudgetCategory,
  type BudgetCategoryColor,
  type BudgetRealityCategory,
  type BudgetTip,
  type CityCostRow,
  type RealNumbersLineItem,
  type WeddingMathEquation,
} from "@/components/templates/budget-breakdown";
import {
  BeforeAfterPost,
  FeatureDropPost,
  HowItWorksCarousel,
  MarigoldVsOldWayPost,
  PlatformReelStaticPreview,
  PlatformStatStory,
  TestimonialPost,
  type ComparisonRow,
  type FeatureLabel,
  type HowItWorksStep,
} from "@/components/templates/marigold-platform";
import {
  FestivalInspoPost,
  MonthlyRoundupStory,
  SeasonalReelStaticPreview,
  SeasonalTrendPost,
  WeddingSeasonPrepCarousel,
  type FestivalConnection,
  type RoundupIconType,
  type RoundupItem,
  type SeasonalTrend,
  type TrendDirection,
} from "@/components/templates/in-season";
import {
  ColorPalettePost,
  LehengaStylePost,
  MoodBoardPost,
  MoodBoardReelStaticPreview,
} from "@/components/templates/mood-board";
import {
  DiaryEntryPost,
  DiarySnippetReelStaticPreview,
} from "@/components/templates/real-bride-diaries";
import type { ContentData } from "@/lib/types";

const CULTURE_ICONS: CultureIconType[] = [
  "diya",
  "marigold-flower",
  "paisley",
  "lotus",
  "kalash",
  "rangoli",
  "henna-hand",
  "om",
];

function cultureIcon(data: ContentData): CultureIconType {
  const raw = str(data, "decorativeIcon", "diya");
  return (CULTURE_ICONS as string[]).includes(raw)
    ? (raw as CultureIconType)
    : "diya";
}

const REGION_COLORS: RegionColor[] = [
  "wine",
  "deep-pink",
  "hot-pink",
  "pink",
  "gold",
  "gold-light",
  "mint",
  "peach",
  "lavender",
  "sky",
  "blush",
  "cream",
];

function regionColor(
  data: ContentData,
  key: string,
  fallback: RegionColor,
): RegionColor {
  const raw = str(data, key, fallback);
  return (REGION_COLORS as string[]).includes(raw)
    ? (raw as RegionColor)
    : fallback;
}

function regionalSlide(data: ContentData, n: number): RegionalSlide {
  const imageUrl = str(data, `slides.${n}.imageUrl`);
  return {
    title: str(data, `slides.${n}.title`),
    content: str(data, `slides.${n}.content`),
    imageUrl: imageUrl || undefined,
  };
}

function familyRole(data: ContentData, n: number): FamilyRole | null {
  const title = str(data, `roles.${n}.title`).trim();
  if (!title) return null;
  return {
    title,
    relationship: str(data, `roles.${n}.relationship`),
    description: str(data, `roles.${n}.description`),
    annotation: str(data, `roles.${n}.annotation`),
  };
}

const SELF_CARE_ICONS: SelfCareIcon[] = [
  "leaf",
  "book",
  "bath",
  "walk",
  "coffee",
  "music",
  "sleep",
  "call",
  "journal",
  "yoga",
];

function selfCareIcon(data: ContentData, index: number): SelfCareIcon {
  const raw = str(data, `items.${index}.icon`, "leaf");
  return (SELF_CARE_ICONS as string[]).includes(raw)
    ? (raw as SelfCareIcon)
    : "leaf";
}

function selfCareItems(data: ContentData): SelfCareItem[] {
  const items: SelfCareItem[] = [];
  for (let i = 0; i < 5; i += 1) {
    const text = str(data, `items.${i}.text`).trim();
    if (!text) continue;
    items.push({ text, icon: selfCareIcon(data, i) });
  }
  return items;
}

const AFFIRMATION_GRADIENTS: AffirmationGradient[] = [
  "blush-cream",
  "lavender-cream",
  "gold-cream",
  "mint-cream",
];

function affirmationGradient(data: ContentData): AffirmationGradient {
  const raw = str(data, "gradientColors", "blush-cream");
  return (AFFIRMATION_GRADIENTS as string[]).includes(raw)
    ? (raw as AffirmationGradient)
    : "blush-cream";
}

function inLawSteps(data: ContentData): string[] {
  const out: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const v = str(data, `steps.${i}`).trim();
    if (v) out.push(v);
  }
  return out;
}

function str(data: ContentData, key: string, fallback = ""): string {
  const v = data[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function num(data: ContentData, key: string, fallback = 1): number {
  const v = data[key];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return fallback;
}

function quizOptions(data: ContentData): [string, string, string, string] {
  const flat: [string, string, string, string] = [
    str(data, "options.A"),
    str(data, "options.B"),
    str(data, "options.C"),
    str(data, "options.D"),
  ];
  if (flat.some(Boolean)) return flat;
  const nested = data.options;
  if (
    nested
    && typeof nested === "object"
    && !Array.isArray(nested)
  ) {
    const obj = nested as Record<string, unknown>;
    return [
      typeof obj.A === "string" ? obj.A : "",
      typeof obj.B === "string" ? obj.B : "",
      typeof obj.C === "string" ? obj.C : "",
      typeof obj.D === "string" ? obj.D : "",
    ];
  }
  if (Array.isArray(nested)) {
    return [
      typeof nested[0] === "string" ? nested[0] : "",
      typeof nested[1] === "string" ? nested[1] : "",
      typeof nested[2] === "string" ? nested[2] : "",
      typeof nested[3] === "string" ? nested[3] : "",
    ];
  }
  return ["", "", "", ""];
}

const CONFESSIONAL_VARIANTS: ConfessionalVariant[] = [
  "blush",
  "gold",
  "lavender",
];
const CONFESSIONAL_HIGHLIGHTS: ConfessionalHighlightColor[] = [
  "hot-pink",
  "gold",
  "lavender",
];
const QUIZ_TYPES: QuizResultType[] = ["zen", "typeA", "creative", "party"];
const QUIZ_BACKGROUND_COLORS: QuizBackgroundColor[] = [
  "wine",
  "deep-pink",
  "mint",
  "gold-light",
  "lavender",
  "peach",
  "blush",
  "sky",
  "cream",
];
const QUIZ_ICON_TYPES: QuizIconType[] = [
  "crown",
  "flower",
  "paintbrush",
  "disco-ball",
  "temple",
  "compass",
  "heart",
  "star",
  "palette",
];

function quizBackgroundColor(
  data: ContentData,
  fallback: QuizBackgroundColor,
): QuizBackgroundColor {
  const raw = str(data, "backgroundColor", fallback);
  return (QUIZ_BACKGROUND_COLORS as string[]).includes(raw)
    ? (raw as QuizBackgroundColor)
    : fallback;
}

function quizIconType(data: ContentData): QuizIconType | undefined {
  const raw = str(data, "iconType");
  if (!raw) return undefined;
  return (QUIZ_ICON_TYPES as string[]).includes(raw)
    ? (raw as QuizIconType)
    : undefined;
}

function quizV2Options(data: ContentData): QuizTitleV2Option[] {
  const out: QuizTitleV2Option[] = [];
  for (let i = 0; i < 5; i += 1) {
    const letter = str(data, `options.${i}.letter`).trim();
    const label = str(data, `options.${i}.label`).trim();
    if (!label) continue;
    const subtitle = str(data, `options.${i}.subtitle`).trim();
    out.push({
      letter: letter || String.fromCharCode(65 + i),
      label,
      subtitle: subtitle || undefined,
    });
  }
  return out;
}
const VENDOR_ACCENTS: VendorAccentColor[] = ["gold", "pink", "lavender"];
const TOT_SCHEMES: ThisOrThatColorScheme[] = [
  "pink-wine",
  "cream-blush",
  "gold-lavender",
];

function totScheme(data: ContentData): ThisOrThatColorScheme {
  const raw = str(data, "colorScheme", "pink-wine");
  return (TOT_SCHEMES as string[]).includes(raw)
    ? (raw as ThisOrThatColorScheme)
    : "pink-wine";
}

function vendorAccent(data: ContentData): VendorAccentColor {
  const raw = str(data, "accentColor", "gold");
  return (VENDOR_ACCENTS as string[]).includes(raw)
    ? (raw as VendorAccentColor)
    : "gold";
}

function vendorTip(data: ContentData, n: number): VendorTip {
  return {
    headline: str(data, `tip${n}.headline`),
    detail: str(data, `tip${n}.detail`),
    annotation: str(data, `tip${n}.annotation`),
  };
}

const PLANNER_ACCENTS: PlannerAdviceAccent[] = ["gold", "pink", "lavender"];

function plannerAccent(data: ContentData): PlannerAdviceAccent {
  const raw = str(data, "accentColor", "gold");
  return (PLANNER_ACCENTS as string[]).includes(raw)
    ? (raw as PlannerAdviceAccent)
    : "gold";
}

function plannerTip(data: ContentData, n: number): PlannerTip {
  return {
    headline: str(data, `tip${n}.headline`),
    detail: str(data, `tip${n}.detail`),
    annotation: str(data, `tip${n}.annotation`),
  };
}

function brideConnectExtraPrompt(
  data: ContentData,
  n: number,
): BrideMatchStoryExtraPrompt | null {
  const question = str(data, `extraPrompts.${n}.question`).trim();
  const answer = str(data, `extraPrompts.${n}.answer`).trim();
  if (!question && !answer) return null;
  return { question, answer };
}

function splitLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function arrayField(data: ContentData, key: string, max = 8): string[] {
  const out: string[] = [];
  for (let i = 0; i < max; i += 1) {
    const v = str(data, `${key}.${i}`).trim();
    if (v) out.push(v);
  }
  return out;
}

function realNumbersLineItems(data: ContentData): RealNumbersLineItem[] {
  const out: RealNumbersLineItem[] = [];
  for (let i = 0; i < 12; i += 1) {
    const category = str(data, `lineItems.${i}.category`).trim();
    const amount = str(data, `lineItems.${i}.amount`).trim();
    if (!category && !amount) continue;
    out.push({
      section: str(data, `lineItems.${i}.section`),
      category,
      amount,
    });
  }
  return out;
}

function weddingMathEquations(data: ContentData): WeddingMathEquation[] {
  const out: WeddingMathEquation[] = [];
  for (let i = 0; i < 8; i += 1) {
    const number = str(data, `equations.${i}.number`).trim();
    const text = str(data, `equations.${i}.text`).trim();
    if (!number && !text) continue;
    out.push({ number, text });
  }
  return out;
}

function approvalMatrixItems(data: ContentData): ApprovalMatrixItem[] {
  const out: ApprovalMatrixItem[] = [];
  for (let i = 0; i < 12; i += 1) {
    const label = str(data, `items.${i}.label`).trim();
    if (!label) continue;
    out.push({
      label,
      x: num(data, `items.${i}.x`, 0),
      y: num(data, `items.${i}.y`, 0),
    });
  }
  return out;
}

const VENUE_TYPES: VenueType[] = [
  "palace",
  "garden",
  "beachfront",
  "farmhouse",
  "ballroom",
  "heritage-haveli",
  "rooftop",
  "resort",
  "temple-adjacent",
];

const VENUE_STYLE_BACKGROUNDS: VenueStyleBackground[] = [
  "mint",
  "wine",
  "peach",
  "gold-light",
  "blush",
  "lavender",
];

function venueType(data: ContentData): VenueType {
  const raw = str(data, "venueType", "palace");
  return (VENUE_TYPES as string[]).includes(raw)
    ? (raw as VenueType)
    : "palace";
}

function venueComparisonAttrs(
  data: ContentData,
  side: "A" | "B",
): VenueComparisonAttributes {
  const prefix = `venue${side}Attributes`;
  return {
    capacity: str(data, `${prefix}.capacity`),
    vibe: str(data, `${prefix}.vibe`),
    priceRange: str(data, `${prefix}.priceRange`),
    bestFor: str(data, `${prefix}.bestFor`),
  };
}

function venueStyleSlide(data: ContentData, n: number): VenueStyleSlide {
  return {
    title: str(data, `slides.${n}.title`),
    body: str(data, `slides.${n}.body`),
    annotation: str(data, `slides.${n}.annotation`),
    imageUrl: str(data, `slides.${n}.imageUrl`) || undefined,
  };
}

function venueStyleBackground(data: ContentData): VenueStyleBackground {
  const raw = str(data, "coverBackground", "mint");
  return (VENUE_STYLE_BACKGROUNDS as string[]).includes(raw)
    ? (raw as VenueStyleBackground)
    : "mint";
}

const EDIT_CATEGORIES: EditCategory[] = [
  "bridal-jewelry",
  "decor-find",
  "mehndi-inspo",
  "outfit-accessory",
  "beauty-find",
  "stationery",
  "favor-idea",
  "tech-tool",
];

const TREND_CATEGORIES: TrendCategory[] = [
  "decor",
  "fashion",
  "food",
  "entertainment",
  "stationery",
  "beauty",
  "venue",
];

function editCategory(data: ContentData, key: string): EditCategory {
  const raw = str(data, key, "bridal-jewelry");
  return (EDIT_CATEGORIES as string[]).includes(raw)
    ? (raw as EditCategory)
    : "bridal-jewelry";
}

function trendCategory(data: ContentData): TrendCategory {
  const raw = str(data, "trendCategory", "decor");
  return (TREND_CATEGORIES as string[]).includes(raw)
    ? (raw as TrendCategory)
    : "decor";
}

function topPick(data: ContentData, n: number): TopPick {
  const price = str(data, `picks.${n}.price`);
  const imageUrl = str(data, `picks.${n}.imageUrl`);
  return {
    productName: str(data, `picks.${n}.productName`),
    category: editCategory(data, `picks.${n}.category`),
    price: price || undefined,
    oneLiner: str(data, `picks.${n}.oneLiner`),
    imageUrl: imageUrl || undefined,
  };
}

const CEREMONY_HEADER_COLORS: CeremonyHeaderColor[] = [
  "mint",
  "gold",
  "pink",
  "wine",
  "gold-light",
  "lavender",
  "peach",
  "blush",
];

const RED_FLAG_CATEGORIES: RedFlagCategory[] = [
  "vendor",
  "venue",
  "contract",
  "caterer",
  "photographer",
  "decorator",
];

const EVENT_COLORS: EventColor[] = [
  "mint",
  "gold",
  "pink",
  "wine",
  "gold-light",
  "lavender",
  "peach",
  "blush",
];

function ceremonyHeaderColor(data: ContentData): CeremonyHeaderColor {
  const raw = str(data, "headerColor", "gold");
  return (CEREMONY_HEADER_COLORS as string[]).includes(raw)
    ? (raw as CeremonyHeaderColor)
    : "gold";
}

function redFlagCategory(data: ContentData): RedFlagCategory {
  const raw = str(data, "flagCategory", "vendor");
  return (RED_FLAG_CATEGORIES as string[]).includes(raw)
    ? (raw as RedFlagCategory)
    : "vendor";
}

function eventColor(data: ContentData): EventColor {
  const raw = str(data, "eventColor", "mint");
  return (EVENT_COLORS as string[]).includes(raw)
    ? (raw as EventColor)
    : "mint";
}

function guestTip(data: ContentData, n: number): GuestManagementTip {
  return {
    headline: str(data, `tips.${n}.headline`),
    detail: str(data, `tips.${n}.detail`),
    aside: str(data, `tips.${n}.aside`),
  };
}

function negotiationTip(data: ContentData, n: number): NegotiationTip {
  return {
    headline: str(data, `tips.${n}.headline`),
    detail: str(data, `tips.${n}.detail`),
    aside: str(data, `tips.${n}.aside`),
  };
}

function redFlag(data: ContentData, n: number): RedFlag {
  return {
    flag: str(data, `flags.${n}.flag`),
    explanation: str(data, `flags.${n}.explanation`),
  };
}

function timelineEntry(data: ContentData, n: number): TimelineEntry {
  return {
    time: str(data, `entries.${n}.time`),
    activity: str(data, `entries.${n}.activity`),
    note: str(data, `entries.${n}.note`) || undefined,
  };
}

function eventBudgetLine(data: ContentData, n: number): BudgetLine {
  return {
    label: str(data, `slides.budgetLines.${n}.label`),
    range: str(data, `slides.budgetLines.${n}.range`),
  };
}

function eventTimelineEntry(
  data: ContentData,
  n: number,
): EventBreakdownTimelineEntry {
  return {
    time: str(data, `slides.timeline.${n}.time`),
    activity: str(data, `slides.timeline.${n}.activity`),
  };
}

function brideFind(data: ContentData, n: number): BrideFind | null {
  const productName = str(data, `finds.${n}.productName`);
  if (!productName) return null;
  const price = str(data, `finds.${n}.price`);
  const imageUrl = str(data, `finds.${n}.imageUrl`);
  return {
    productName,
    category: editCategory(data, `finds.${n}.category`),
    price: price || undefined,
    imageUrl: imageUrl || undefined,
  };
}

// ---------------------------------------------------------------------------
// Universal reel helpers
// ---------------------------------------------------------------------------

const TEXT_REVEAL_GRADIENTS: TextRevealGradient[] = [
  "wine-to-blush",
  "blush-to-cream",
  "gold-to-cream",
  "lavender-to-blush",
];
const TEXT_REVEAL_FONTS: TextRevealFont[] = ["instrument-serif", "caveat"];

function textRevealLines(data: ContentData): string[] {
  const out: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    const v = str(data, `lines.${i}`).trim();
    if (v) out.push(v);
  }
  return out;
}

function textRevealGradient(data: ContentData): TextRevealGradient {
  const raw = str(data, "backgroundGradient", "wine-to-blush");
  return (TEXT_REVEAL_GRADIENTS as string[]).includes(raw)
    ? (raw as TextRevealGradient)
    : "wine-to-blush";
}

function textRevealFont(data: ContentData): TextRevealFont {
  const raw = str(data, "font", "instrument-serif");
  return (TEXT_REVEAL_FONTS as string[]).includes(raw)
    ? (raw as TextRevealFont)
    : "instrument-serif";
}

function countdownItems(data: ContentData): CountdownItem[] {
  const out: CountdownItem[] = [];
  for (let i = 0; i < 10; i += 1) {
    const itemText = str(data, `items.${i}.item`).trim();
    if (!itemText) continue;
    out.push({
      number: num(data, `items.${i}.number`, i + 1),
      item: itemText,
      annotation: str(data, `items.${i}.annotation`),
    });
  }
  return out;
}

const BEFORE_AFTER_TRANSITIONS: BeforeAfterTransition[] = [
  "swipe",
  "dissolve",
  "split",
];

function beforeAfterTransition(data: ContentData): BeforeAfterTransition {
  const raw = str(data, "transitionStyle", "swipe");
  return (BEFORE_AFTER_TRANSITIONS as string[]).includes(raw)
    ? (raw as BeforeAfterTransition)
    : "swipe";
}

const KEN_BURNS_DIRECTIONS: KenBurnsDirection[] = [
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
];
const PHOTO_OVERLAY_STYLES: PhotoMontageOverlay[] = [
  "bottom-strip",
  "center-card",
  "full-overlay",
];

function kenBurnsDirection(data: ContentData, n: number): KenBurnsDirection {
  const raw = str(data, `slides.${n}.kenBurnsDirection`, "zoom-in");
  return (KEN_BURNS_DIRECTIONS as string[]).includes(raw)
    ? (raw as KenBurnsDirection)
    : "zoom-in";
}

function photoMontageSlides(data: ContentData): PhotoMontageSlide[] {
  const out: PhotoMontageSlide[] = [];
  for (let i = 0; i < 8; i += 1) {
    const imageUrl = str(data, `slides.${i}.imageUrl`).trim();
    const caption = str(data, `slides.${i}.caption`).trim();
    if (!imageUrl && !caption) continue;
    out.push({
      imageUrl,
      caption,
      kenBurnsDirection: kenBurnsDirection(data, i),
    });
  }
  return out;
}

function photoOverlayStyle(data: ContentData): PhotoMontageOverlay {
  const raw = str(data, "overlayStyle", "bottom-strip");
  return (PHOTO_OVERLAY_STYLES as string[]).includes(raw)
    ? (raw as PhotoMontageOverlay)
    : "bottom-strip";
}

function factStackFacts(data: ContentData): FactStackFact[] {
  const out: FactStackFact[] = [];
  for (let i = 0; i < 8; i += 1) {
    const value = str(data, `facts.${i}.statValue`).trim();
    const context = str(data, `facts.${i}.statContext`).trim();
    if (!value && !context) continue;
    out.push({ statValue: value, statContext: context });
  }
  return out;
}

function factStackColors(data: ContentData): FactStackColor[] | undefined {
  const raw = str(data, "colorSequence").trim();
  if (!raw) return undefined;
  const valid: FactStackColor[] = [
    "wine",
    "deep-pink",
    "pink",
    "blush",
    "gold",
    "gold-light",
    "lavender",
  ];
  const parsed = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is FactStackColor =>
      (valid as string[]).includes(s),
    );
  return parsed.length ? parsed : undefined;
}

function scrollQuotes(data: ContentData): ScrollQuote[] {
  const out: ScrollQuote[] = [];
  for (let i = 0; i < 10; i += 1) {
    const text = str(data, `quotes.${i}.text`).trim();
    if (!text) continue;
    out.push({
      text,
      attribution: str(data, `quotes.${i}.attribution`),
    });
  }
  return out;
}

function splitScreenExchanges(data: ContentData): SplitScreenExchange[] {
  const out: SplitScreenExchange[] = [];
  for (let i = 0; i < 8; i += 1) {
    const bride = str(data, `exchanges.${i}.bride`).trim();
    const mom = str(data, `exchanges.${i}.mom`).trim();
    if (!bride && !mom) continue;
    out.push({ bride, mom });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Budget Breakdown helpers
// ---------------------------------------------------------------------------

const BUDGET_CATEGORY_COLORS: BudgetCategoryColor[] = [
  "pink",
  "wine",
  "gold",
  "hot-pink",
  "blush",
  "lavender",
  "mint",
  "mauve",
  "deep-pink",
  "peach",
  "sky",
];

function budgetCategoryColor(
  data: ContentData,
  key: string,
  fallback: BudgetCategoryColor,
): BudgetCategoryColor {
  const raw = str(data, key, fallback);
  return (BUDGET_CATEGORY_COLORS as string[]).includes(raw)
    ? (raw as BudgetCategoryColor)
    : fallback;
}

function budgetPieCategories(data: ContentData): BudgetCategory[] {
  const out: BudgetCategory[] = [];
  for (let i = 0; i < 10; i += 1) {
    const name = str(data, `categories.${i}.name`).trim();
    if (!name) continue;
    out.push({
      name,
      percentage: num(data, `categories.${i}.percentage`, 0),
      color: budgetCategoryColor(data, `categories.${i}.color`, "pink"),
    });
  }
  return out;
}

function budgetRealityCategories(data: ContentData): BudgetRealityCategory[] {
  const out: BudgetRealityCategory[] = [];
  for (let i = 0; i < 10; i += 1) {
    const name = str(data, `categories.${i}.name`).trim();
    if (!name) continue;
    out.push({
      name,
      planned: str(data, `categories.${i}.planned`),
      actual: str(data, `categories.${i}.actual`),
    });
  }
  return out;
}

function cityCostRows(data: ContentData): CityCostRow[] {
  const out: CityCostRow[] = [];
  for (let i = 0; i < 8; i += 1) {
    const category = str(data, `costs.${i}.category`).trim();
    if (!category) continue;
    const unitRaw = str(data, `costs.${i}.unit`, "lakh");
    const unit = unitRaw === "₹" ? "₹" : "lakh";
    out.push({
      category,
      rangeLow: num(data, `costs.${i}.rangeLow`, 0),
      rangeHigh: num(data, `costs.${i}.rangeHigh`, 0),
      unit,
    });
  }
  return out;
}

function budgetTips(data: ContentData): BudgetTip[] {
  const out: BudgetTip[] = [];
  for (let i = 0; i < 12; i += 1) {
    const title = str(data, `tips.${i}.title`).trim();
    const detail = str(data, `tips.${i}.detail`).trim();
    if (!title && !detail) continue;
    out.push({ title, detail });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The Marigold Platform helpers
// ---------------------------------------------------------------------------

const FEATURE_LABELS: FeatureLabel[] = ["new", "spotlight", "coming-soon"];

function featureLabel(data: ContentData): FeatureLabel {
  const raw = str(data, "featureLabel", "new");
  return (FEATURE_LABELS as string[]).includes(raw)
    ? (raw as FeatureLabel)
    : "new";
}

function howItWorksSteps(data: ContentData): HowItWorksStep[] {
  const out: HowItWorksStep[] = [];
  for (let i = 0; i < 6; i += 1) {
    const title = str(data, `steps.${i}.title`).trim();
    if (!title) continue;
    const mockupImageUrl = str(data, `steps.${i}.mockupImageUrl`).trim();
    out.push({
      number: num(data, `steps.${i}.number`, i + 1),
      title,
      description: str(data, `steps.${i}.description`),
      mockupImageUrl: mockupImageUrl || undefined,
    });
  }
  return out;
}

function comparisonRows(data: ContentData): ComparisonRow[] {
  const out: ComparisonRow[] = [];
  for (let i = 0; i < 10; i += 1) {
    const oldWay = str(data, `comparisons.${i}.oldWay`).trim();
    const newWay = str(data, `comparisons.${i}.newWay`).trim();
    if (!oldWay && !newWay) continue;
    out.push({ oldWay, newWay });
  }
  return out;
}

function bool(data: ContentData, key: string, fallback: boolean): boolean {
  const v = data[key];
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const lower = v.trim().toLowerCase();
    if (lower === "true" || lower === "yes" || lower === "1") return true;
    if (lower === "false" || lower === "no" || lower === "0") return false;
  }
  if (typeof v === "number") return v !== 0;
  return fallback;
}

// ---------------------------------------------------------------------------
// In Season helpers
// ---------------------------------------------------------------------------

const TREND_DIRECTIONS: TrendDirection[] = ["up", "steady", "emerging"];

function trendDirection(
  data: ContentData,
  key: string,
  fallback: TrendDirection = "up",
): TrendDirection {
  const raw = str(data, key, fallback);
  return (TREND_DIRECTIONS as string[]).includes(raw)
    ? (raw as TrendDirection)
    : fallback;
}

function seasonalTrends(data: ContentData): SeasonalTrend[] {
  const out: SeasonalTrend[] = [];
  for (let i = 0; i < 8; i += 1) {
    const trend = str(data, `trends.${i}.trend`).trim();
    if (!trend) continue;
    out.push({
      trend,
      direction: trendDirection(data, `trends.${i}.direction`, "up"),
    });
  }
  return out;
}

function festivalConnections(data: ContentData): FestivalConnection[] {
  const out: FestivalConnection[] = [];
  for (let i = 0; i < 6; i += 1) {
    const festivalElement = str(data, `connections.${i}.festivalElement`).trim();
    const weddingApplication = str(
      data,
      `connections.${i}.weddingApplication`,
    ).trim();
    if (!festivalElement && !weddingApplication) continue;
    out.push({ festivalElement, weddingApplication });
  }
  return out;
}

const ROUNDUP_ICON_TYPES: RoundupIconType[] = [
  "trending",
  "viral",
  "marigold",
  "alert",
  "calendar",
  "sparkle",
];

function roundupIconType(
  data: ContentData,
  key: string,
  fallback: RoundupIconType = "trending",
): RoundupIconType {
  const raw = str(data, key, fallback);
  return (ROUNDUP_ICON_TYPES as string[]).includes(raw)
    ? (raw as RoundupIconType)
    : fallback;
}

function roundupItems(data: ContentData): RoundupItem[] {
  const out: RoundupItem[] = [];
  for (let i = 0; i < 8; i += 1) {
    const text = str(data, `items.${i}.text`).trim();
    if (!text) continue;
    out.push({
      text,
      iconType: roundupIconType(data, `items.${i}.iconType`, "trending"),
    });
  }
  return out;
}

function prepSlideItems(data: ContentData, prefix: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const v = str(data, `${prefix}.items.${i}`).trim();
    if (v) out.push(v);
  }
  return out;
}

export function renderTemplate(
  templateSlug: string,
  data: ContentData,
): ReactNode {
  switch (templateSlug) {
    case "bvm-story":
      return (
        <BvMStory
          brideQuote={str(data, "brideQuote")}
          brideAnnotation={str(data, "brideAnnotation")}
          momQuote={str(data, "momQuote")}
          momAnnotation={str(data, "momAnnotation")}
        />
      );

    case "bvm-post":
      return (
        <BvMPost
          brideQuote={str(data, "brideQuote")}
          brideAnnotation={str(data, "brideAnnotation")}
          momQuote={str(data, "momQuote")}
          momAnnotation={str(data, "momAnnotation")}
          ctaTagline={str(data, "ctaTagline", "@themarigold")}
        />
      );

    case "confessional-title":
      return <ConfessionalTitle />;

    case "confessional-card": {
      const raw = str(data, "variant", "blush");
      const variant: ConfessionalVariant = (
        CONFESSIONAL_VARIANTS as string[]
      ).includes(raw)
        ? (raw as ConfessionalVariant)
        : "blush";
      return (
        <ConfessionalCard
          variant={variant}
          confessionNumber={num(data, "confessionNumber", 1)}
          confessionText={str(data, "confessionText")}
          attribution={str(data, "attribution", "— ANONYMOUS BRIDE, 2026")}
        />
      );
    }

    case "confessional-cta":
      return <ConfessionalCTA />;

    case "confessional-reel": {
      const rawHighlight = str(data, "highlightColor", "hot-pink");
      const highlightColor: ConfessionalHighlightColor = (
        CONFESSIONAL_HIGHLIGHTS as string[]
      ).includes(rawHighlight)
        ? (rawHighlight as ConfessionalHighlightColor)
        : "hot-pink";
      return (
        <ConfessionalReelStaticPreview
          confessionNumber={num(data, "confessionNumber", 1)}
          confessionText={str(data, "confessionText")}
          attribution={str(data, "attribution", "— anonymous bride, 2026")}
          wordsPerMinute={num(data, "wordsPerMinute", 150)}
          highlightColor={highlightColor}
          freezeAt={0.4}
        />
      );
    }

    case "quiz-title":
      return (
        <QuizTitle
          quizTitle={str(data, "quizTitle", "What's Your Bride Energy?")}
          options={quizOptions(data)}
        />
      );

    case "quiz-result": {
      const raw = str(data, "type", "zen");
      const type: QuizResultType = (QUIZ_TYPES as string[]).includes(raw)
        ? (raw as QuizResultType)
        : "zen";
      return (
        <QuizResult
          type={type}
          resultLabel={str(data, "resultLabel", "Zen Queen")}
          resultQuote={str(data, "resultQuote")}
          resultDescription={str(data, "resultDescription")}
        />
      );
    }

    case "quiz-title-v2": {
      const options = quizV2Options(data);
      return (
        <QuizTitleV2
          quizTheme={str(data, "quizTheme", "What's Your Wedding Style?")}
          headerAnnotation={str(data, "headerAnnotation") || undefined}
          backgroundColor={quizBackgroundColor(data, "wine")}
          options={options}
        />
      );
    }

    case "quiz-result-v2": {
      const emoji = str(data, "resultEmoji").trim();
      return (
        <QuizResultV2
          resultType={str(data, "resultType", "result")}
          resultLabel={str(data, "resultLabel", "Classic Elegance")}
          resultEmoji={emoji || undefined}
          resultQuote={str(data, "resultQuote")}
          resultDescription={str(data, "resultDescription")}
          productTieIn={str(data, "productTieIn")}
          backgroundColor={quizBackgroundColor(data, "blush")}
          iconType={quizIconType(data)}
        />
      );
    }

    case "quiz-result-post": {
      const emoji = str(data, "resultEmoji").trim();
      return (
        <QuizResultPost
          resultType={str(data, "resultType", "result")}
          resultLabel={str(data, "resultLabel", "Classic Elegance")}
          resultEmoji={emoji || undefined}
          resultQuote={str(data, "resultQuote")}
          resultDescription={str(data, "resultDescription")}
          productTieIn={str(data, "productTieIn")}
          backgroundColor={quizBackgroundColor(data, "blush")}
          iconType={quizIconType(data)}
        />
      );
    }

    case "vendor-quote":
      return (
        <VendorQuote
          quote={str(data, "quote")}
          attribution={str(data, "attribution", "— ANONYMOUS")}
          tagline={str(data, "tagline")}
          seriesLabel={str(data, "seriesLabel")}
        />
      );

    case "feature-callout":
      return (
        <FeatureCallout
          categoryLabel={str(data, "categoryLabel", "DID YOU KNOW")}
          headline={str(data, "headline")}
          annotation={str(data, "annotation")}
          ctaText={str(data, "ctaText", "LEARN MORE")}
        />
      );

    case "stat-callout":
      return (
        <StatCallout
          statNumber={str(data, "statNumber", "0")}
          statLabel={str(data, "statLabel", "STAT")}
          description={str(data, "description")}
        />
      );

    case "vendor-feature-post": {
      const imageUrl = str(data, "imageUrl");
      return (
        <VendorFeaturePost
          vendorCategory={str(data, "vendorCategory", "PHOTOGRAPHER")}
          vendorName={str(data, "vendorName")}
          vendorLocation={str(data, "vendorLocation")}
          vendorQuote={str(data, "vendorQuote")}
          imageUrl={imageUrl ? imageUrl : undefined}
          accentColor={vendorAccent(data)}
        />
      );
    }

    case "vendor-tip-carousel":
      return (
        <VendorTipCarousel
          vendorCategory={str(data, "vendorCategory")}
          vendorName={str(data, "vendorName")}
          vendorHandle={str(data, "vendorHandle")}
          accentColor={vendorAccent(data)}
          slideIndex={num(data, "slideIndex", 1)}
          tips={[1, 2, 3, 4].map((n) => vendorTip(data, n))}
        />
      );

    case "vendor-quote-reel": {
      const rawHighlight = str(data, "highlightColor", "gold");
      const highlightColor: ConfessionalHighlightColor = (
        CONFESSIONAL_HIGHLIGHTS as string[]
      ).includes(rawHighlight)
        ? (rawHighlight as ConfessionalHighlightColor)
        : "gold";
      return (
        <VendorQuoteReelStaticPreview
          vendorCategory={str(data, "vendorCategory", "PHOTOGRAPHER")}
          vendorName={str(data, "vendorName")}
          quote={str(data, "quote")}
          highlightColor={highlightColor}
          wordsPerMinute={num(data, "wordsPerMinute", 150)}
          freezeAt={0.4}
        />
      );
    }

    case "tot-story":
      return (
        <ThisOrThatStory
          topicLabel={str(data, "topicLabel", "WEDDING VIBES")}
          optionA={str(data, "optionA")}
          optionAAnnotation={str(data, "optionAAnnotation")}
          optionB={str(data, "optionB")}
          optionBAnnotation={str(data, "optionBAnnotation")}
          colorScheme={totScheme(data)}
        />
      );

    case "tot-post":
      return (
        <ThisOrThatPost
          topicLabel={str(data, "topicLabel", "WEDDING VIBES")}
          optionA={str(data, "optionA")}
          optionAAnnotation={str(data, "optionAAnnotation")}
          optionB={str(data, "optionB")}
          optionBAnnotation={str(data, "optionBAnnotation")}
          colorScheme={totScheme(data)}
        />
      );

    case "venue-feature-post": {
      const imageUrl = str(data, "imageUrl");
      const startingPriceRaw = num(data, "startingPrice", 0);
      return (
        <VenueFeaturePost
          venueType={venueType(data)}
          venueName={str(data, "venueName", "")}
          venueLocation={str(data, "venueLocation", "")}
          capacity={num(data, "capacity", 0)}
          bestFor={str(data, "bestFor", "")}
          imageUrl={imageUrl ? imageUrl : undefined}
          startingPrice={startingPriceRaw > 0 ? startingPriceRaw : undefined}
        />
      );
    }

    case "venue-comparison-post": {
      const aImg = str(data, "venueAImage");
      const bImg = str(data, "venueBImage");
      return (
        <VenueComparisonPost
          venueAName={str(data, "venueAName", "")}
          venueAImage={aImg ? aImg : undefined}
          venueAAttributes={venueComparisonAttrs(data, "A")}
          venueBName={str(data, "venueBName", "")}
          venueBImage={bImg ? bImg : undefined}
          venueBAttributes={venueComparisonAttrs(data, "B")}
          verdict={str(data, "verdict", "")}
        />
      );
    }

    case "venue-style-guide":
      return (
        <VenueStyleGuide
          venueStyle={str(data, "venueStyle", "")}
          styleSubtitle={str(data, "styleSubtitle", "")}
          coverBackground={venueStyleBackground(data)}
          slideIndex={num(data, "slideIndex", 1)}
          slides={[0, 1, 2, 3].map((i) => venueStyleSlide(data, i))}
        />
      );

    case "dream-venue-reel": {
      const imageUrl = str(data, "imageUrl");
      return (
        <DreamVenueReelStaticPreview
          venueName={str(data, "venueName", "")}
          venueLocation={str(data, "venueLocation", "")}
          venueStyle={str(data, "venueStyle", "")}
          capacity={num(data, "capacity", 0)}
          imageUrl={imageUrl ? imageUrl : undefined}
          hookText={str(data, "hookText", "imagine this.")}
          freezeAt={0.6}
        />
      );
    }

    case "planner-profile-post": {
      const imageUrl = str(data, "imageUrl");
      const specialtiesRaw = str(data, "specialties");
      const specialties = splitCsv(specialtiesRaw).map((s) => s.toUpperCase());
      return (
        <PlannerProfilePost
          plannerName={str(data, "plannerName")}
          companyName={str(data, "companyName")}
          plannerLocation={str(data, "plannerLocation")}
          specialties={specialties}
          pullQuote={str(data, "pullQuote")}
          weddingsPlanned={num(data, "weddingsPlanned", 0)}
          yearsExperience={num(data, "yearsExperience", 0)}
          imageUrl={imageUrl ? imageUrl : undefined}
        />
      );
    }

    case "planner-advice-post":
      return (
        <PlannerAdvicePost
          question={str(data, "question")}
          answer={str(data, "answer")}
          plannerName={str(data, "plannerName")}
          companyName={str(data, "companyName")}
          accentColor={plannerAccent(data)}
        />
      );

    case "planner-tips-carousel":
      return (
        <PlannerTipsCarousel
          plannerName={str(data, "plannerName")}
          companyName={str(data, "companyName")}
          plannerHandle={str(data, "plannerHandle")}
          accentColor={plannerAccent(data)}
          slideIndex={num(data, "slideIndex", 1)}
          tips={[1, 2, 3, 4, 5].map((n) => plannerTip(data, n))}
        />
      );

    case "day-of-vs-full-planning-post":
      return (
        <DayOfVsFullPlanningPost
          dayOfBullets={splitLines(str(data, "dayOfBullets"))}
          dayOfPriceRange={str(data, "dayOfPriceRange")}
          fullServiceBullets={splitLines(str(data, "fullServiceBullets"))}
          fullServicePriceRange={str(data, "fullServicePriceRange")}
          bottomLine={
            str(data, "bottomLine") || "The Marigold works with both."
          }
        />
      );

    case "edit-product-pick-post": {
      const imageUrl = str(data, "imageUrl");
      const price = str(data, "price");
      return (
        <ProductPickPost
          productName={str(data, "productName")}
          category={editCategory(data, "category")}
          price={price || undefined}
          whyWeLoveIt={str(data, "whyWeLoveIt")}
          imageUrl={imageUrl ? imageUrl : undefined}
        />
      );
    }

    case "edit-trending-now-post":
      return (
        <TrendingNowPost
          trendTitle={str(data, "trendTitle")}
          trendDetails={splitLines(str(data, "trendDetails"))}
          editorialTake={str(data, "editorialTake")}
          trendCategory={trendCategory(data)}
        />
      );

    case "edit-top-picks-carousel":
      return (
        <TopPicksCarousel
          monthName={str(data, "monthName", "May Finds")}
          subtitle={str(data, "subtitle")}
          slideIndex={num(data, "slideIndex", 1)}
          picks={[0, 1, 2, 3, 4].map((n) => topPick(data, n))}
        />
      );

    case "edit-bride-finds-reel": {
      const finds = [0, 1, 2, 3, 4]
        .map((n) => brideFind(data, n))
        .filter((f): f is BrideFind => f != null);
      return <BrideFindsReelStaticPreview finds={finds} freezeAt={0.4} />;
    }

    case "ceremony-guide-post":
      return (
        <CeremonyGuidePost
          ceremonyName={str(data, "ceremonyName", "Haldi")}
          headerColor={ceremonyHeaderColor(data)}
          whatItIs={str(data, "whatItIs")}
          keyTraditions={splitLines(str(data, "keyTraditions"))}
          typicalDuration={str(data, "typicalDuration")}
          proTip={str(data, "proTip")}
        />
      );

    case "guest-management-post":
      return (
        <GuestManagementPost
          guideTitle={str(data, "guideTitle", "Guest List Survival Guide")}
          tips={[0, 1, 2, 3].map((n) => guestTip(data, n))}
        />
      );

    case "red-flags-post":
      return (
        <RedFlagsPost
          flagCategory={redFlagCategory(data)}
          flags={[0, 1, 2, 3, 4].map((n) => redFlag(data, n))}
          bottomAdvice={str(data, "bottomAdvice")}
        />
      );

    case "timeline-builder-post": {
      const entries = [0, 1, 2, 3, 4, 5, 6]
        .map((n) => timelineEntry(data, n))
        .filter((e) => e.time || e.activity);
      const headerAnnotation = str(data, "headerAnnotation");
      return (
        <TimelineBuilderPost
          eventName={str(data, "eventName", "Wedding Day")}
          entries={entries}
          headerAnnotation={headerAnnotation || undefined}
        />
      );
    }

    case "vendor-negotiation-post":
      return (
        <VendorNegotiationPost
          vendorCategory={str(data, "vendorCategory")}
          tips={[0, 1, 2, 3].map((n) => negotiationTip(data, n))}
          bottomLine={str(data, "bottomLine")}
        />
      );

    case "event-breakdown-carousel": {
      const budgetLines = [0, 1, 2, 3, 4]
        .map((n) => eventBudgetLine(data, n))
        .filter((b) => b.label || b.range);
      const timeline = [0, 1, 2, 3, 4]
        .map((n) => eventTimelineEntry(data, n))
        .filter((t) => t.time || t.activity);
      return (
        <EventBreakdownCarousel
          eventName={str(data, "eventName", "Mehndi")}
          eventColor={eventColor(data)}
          slideIndex={num(data, "slideIndex", 0)}
          slides={{
            vibeText: str(data, "slides.vibeText"),
            checklist: splitLines(str(data, "slides.checklist")),
            budgetTotal: str(data, "slides.budgetTotal"),
            budgetLines,
            timeline,
            mistakes: splitLines(str(data, "slides.mistakes")),
            marigoldFeatures: splitLines(str(data, "slides.marigoldFeatures")),
            marigoldClosingLine: str(data, "slides.marigoldClosingLine"),
          }}
        />
      );
    }

    case "checklist-story": {
      const annotation = str(data, "annotation");
      return (
        <ChecklistStory
          checklistTitle={str(data, "checklistTitle")}
          items={splitLines(str(data, "items"))}
          annotation={annotation || undefined}
        />
      );
    }

    case "bride-life-self-care-post":
      return (
        <SelfCarePost
          title={str(data, "title")}
          items={selfCareItems(data)}
          bottomNote={str(data, "bottomNote")}
        />
      );

    case "bride-life-relationship-checkin":
      return (
        <RelationshipCheckInPost
          conversationPrompt={str(data, "conversationPrompt")}
          activitySuggestion={str(data, "activitySuggestion")}
          annotation={str(data, "annotation")}
        />
      );

    case "bride-life-emotional-reality":
      return (
        <EmotionalRealityPost
          topicTitle={str(data, "topicTitle")}
          body={str(data, "body")}
          signoff={str(data, "signoff")}
        />
      );

    case "bride-life-affirmation-story":
      return (
        <AffirmationStory
          affirmation={str(data, "affirmation")}
          gradientColors={affirmationGradient(data)}
        />
      );

    case "bride-life-in-law-navigation":
      return (
        <InLawNavigationPost
          situation={str(data, "situation")}
          steps={inLawSteps(data)}
          note={str(data, "note")}
        />
      );

    case "tradition-explained-post":
      return (
        <TraditionExplainedPost
          traditionName={str(data, "traditionName", "The Kanyadaan")}
          meaning={str(data, "meaning")}
          modernContext={str(data, "modernContext")}
          decorativeIcon={cultureIcon(data)}
        />
      );

    case "regional-spotlight-carousel": {
      const slides = [0, 1, 2, 3, 4].map((n) => regionalSlide(data, n));
      return (
        <RegionalSpotlightCarousel
          regionName={str(data, "regionName", "The Punjabi Wedding")}
          regionSubtitle={str(data, "regionSubtitle")}
          regionColor={regionColor(data, "regionColor", "deep-pink")}
          slides={slides}
          slideIndex={num(data, "slideIndex", 1)}
          ctaHeadline={
            str(data, "ctaHeadline") || "Build it on The Marigold"
          }
          ctaSubtitle={
            str(data, "ctaSubtitle")
            || "every ceremony, every vendor, every detail — in one place"
          }
        />
      );
    }

    case "fusion-wedding-post":
      return (
        <FusionWeddingPost
          tradition1={str(data, "tradition1", "Hindu")}
          tradition2={str(data, "tradition2", "Catholic")}
          color1={regionColor(data, "color1", "wine")}
          color2={regionColor(data, "color2", "deep-pink")}
          blendingTips={splitLines(str(data, "blendingTips"))}
          annotation={
            str(data, "annotation")
            || "two families, two traditions, one (very long) ceremony"
          }
        />
      );

    case "family-roles-post": {
      const roles = [0, 1, 2, 3, 4, 5, 6, 7]
        .map((n) => familyRole(data, n))
        .filter((r): r is FamilyRole => r != null);
      return (
        <FamilyRolesPost
          guideTitle={
            str(data, "guideTitle") || "The Extended Family Guide"
          }
          subtitle={str(data, "subtitle") || "who's who at a desi wedding"}
          roles={roles}
        />
      );
    }

    case "bride-of-the-week-post": {
      const imageUrl = str(data, "imageUrl").trim();
      return (
        <BrideOfTheWeekPost
          brideName={str(data, "brideName", "Meet Ananya")}
          brideLocation={str(data, "brideLocation")}
          weddingDate={str(data, "weddingDate")}
          guestCount={str(data, "guestCount")}
          advice={str(data, "advice")}
          favoriteFeature={str(data, "favoriteFeature")}
          imageUrl={imageUrl || undefined}
        />
      );
    }

    case "poll-results-post":
      return (
        <PollResultsPost
          question={str(data, "question")}
          optionA={str(data, "optionA")}
          optionAPercent={num(data, "optionAPercent", 50)}
          optionB={str(data, "optionB")}
          optionBPercent={num(data, "optionBPercent", 50)}
          totalVotes={str(data, "totalVotes")}
          editorialComment={str(data, "editorialComment")}
        />
      );

    case "milestone-post":
      return (
        <MilestonePost
          milestoneNumber={str(data, "milestoneNumber", "10,000")}
          milestoneLabel={str(data, "milestoneLabel")}
          gratitudeMessage={str(data, "gratitudeMessage")}
        />
      );

    case "user-story-reel":
      return (
        <UserStoryReelStaticPreview
          storyText={str(data, "storyText")}
          brideName={str(data, "brideName", "Priya")}
          brideIdentifier={str(data, "brideIdentifier", "Bangalore bride, 2026")}
          wordsPerMinute={num(data, "wordsPerMinute", 120)}
          freezeAt={0.4}
        />
      );

    case "submission-cta-story": {
      const rawButton = str(data, "buttonText", "link-in-bio");
      const buttonText: SubmissionButtonType = (
        ["link-in-bio", "dm-us", "tag-us", "email-us"] as string[]
      ).includes(rawButton)
        ? (rawButton as SubmissionButtonType)
        : "link-in-bio";
      const steps = [
        str(data, "steps.0").trim(),
        str(data, "steps.1").trim(),
        str(data, "steps.2").trim(),
      ].filter(Boolean);
      return (
        <SubmissionCTAStory
          seriesReference={str(data, "seriesReference", "THE CONFESSIONAL")}
          callToAction={str(data, "callToAction")}
          steps={steps}
          buttonText={buttonText}
        />
      );
    }

    case "bride-match-profile-post": {
      const imageUrl = str(data, "imageUrl").trim();
      const lookingFor = splitCsv(str(data, "lookingFor")).slice(0, 4);
      return (
        <BrideMatchProfilePost
          brideName={str(data, "brideName", "Priya")}
          brideAge={num(data, "brideAge", 27)}
          planningCity={str(data, "planningCity", "Jaipur")}
          weddingMonth={str(data, "weddingMonth", "DEC")}
          weddingYear={num(data, "weddingYear", 2026)}
          lookingFor={lookingFor}
          promptQuestion={str(
            data,
            "promptQuestion",
            "The thing I'm most stressed about is...",
          )}
          promptAnswer={str(data, "promptAnswer")}
          imageUrl={imageUrl || undefined}
        />
      );
    }

    case "bride-match-story": {
      const imageUrl = str(data, "imageUrl").trim();
      const lookingFor = splitCsv(str(data, "lookingFor")).slice(0, 4);
      const extras = [0, 1]
        .map((i) => brideConnectExtraPrompt(data, i))
        .filter((p): p is BrideMatchStoryExtraPrompt => p != null);
      return (
        <BrideMatchStory
          brideName={str(data, "brideName", "Priya")}
          brideAge={num(data, "brideAge", 27)}
          planningCity={str(data, "planningCity", "Jaipur")}
          weddingMonth={str(data, "weddingMonth", "DEC")}
          weddingYear={num(data, "weddingYear", 2026)}
          lookingFor={lookingFor}
          promptQuestion={str(
            data,
            "promptQuestion",
            "The thing I'm most stressed about is...",
          )}
          promptAnswer={str(data, "promptAnswer")}
          extraPrompts={extras}
          imageUrl={imageUrl || undefined}
        />
      );
    }

    case "bride-match-duo-post": {
      const aImg = str(data, "brideAImageUrl").trim();
      const bImg = str(data, "brideBImageUrl").trim();
      return (
        <BrideMatchDuoPost
          brideAName={str(data, "brideAName", "Priya")}
          brideACity={str(data, "brideACity")}
          brideADate={str(data, "brideADate")}
          brideAImageUrl={aImg || undefined}
          brideBName={str(data, "brideBName", "Ananya")}
          brideBCity={str(data, "brideBCity")}
          brideBDate={str(data, "brideBDate")}
          brideBImageUrl={bImg || undefined}
          sharedQuote={str(data, "sharedQuote")}
        />
      );
    }

    case "bride-connect-explainer-carousel":
      return (
        <BrideConnectExplainerCarousel
          coverHeadline={str(data, "coverHeadline", "Meet Your Wedding BFF")}
          coverSubtitle={str(data, "coverSubtitle")}
          createProfileBody={str(data, "createProfileBody")}
          matchedBody={str(data, "matchedBody")}
          connectBody={str(data, "connectBody")}
          testimonialQuote={str(data, "testimonialQuote")}
          statsNumber={str(data, "statsNumber", "500+")}
          statsLabel={str(data, "statsLabel", "BRIDES MATCHED THIS MONTH")}
          closeHeadline={str(
            data,
            "closeHeadline",
            "Your wedding planning buddy is waiting",
          )}
          slideIndex={num(data, "slideIndex", 1)}
        />
      );

    case "bride-connect-reel": {
      const imageUrl = str(data, "imageUrl").trim();
      return (
        <BrideConnectReelStaticPreview
          brideName={str(data, "brideName", "Priya")}
          planningCity={str(data, "planningCity", "Jaipur")}
          weddingMonth={str(data, "weddingMonth", "DEC")}
          weddingYear={num(data, "weddingYear", 2026)}
          personalNote={str(data, "personalNote")}
          imageUrl={imageUrl || undefined}
          wordsPerMinute={num(data, "wordsPerMinute", 130)}
          freezeAt={0.4}
        />
      );
    }

    case "text-reveal-reel": {
      const seriesTag = str(data, "seriesTag").trim();
      return (
        <TextRevealReelStaticPreview
          lines={textRevealLines(data)}
          ctaText={str(data, "ctaText")}
          seriesTag={seriesTag || undefined}
          backgroundGradient={textRevealGradient(data)}
          font={textRevealFont(data)}
          holdTimeMs={num(data, "holdTimeMs", 1500)}
          freezeAt={0.55}
        />
      );
    }

    case "list-countdown-reel":
      return (
        <ListCountdownReelStaticPreview
          title={str(data, "title", "Top 5 Vendor Red Flags")}
          countdownItems={countdownItems(data)}
          hookText={str(data, "hookText", "you're not ready for #1")}
          ctaText={str(data, "ctaText", "Vet every vendor on The Marigold.")}
          freezeAt={0.5}
        />
      );

    case "before-after-reel":
      return (
        <BeforeAfterReelStaticPreview
          beforeItems={splitLines(str(data, "beforeItems"))}
          afterItems={splitLines(str(data, "afterItems"))}
          transitionStyle={beforeAfterTransition(data)}
          freezeAt={0.55}
        />
      );

    case "photo-montage-reel":
      return (
        <PhotoMontageReelStaticPreview
          slides={photoMontageSlides(data)}
          ctaText={str(data, "ctaText", "Plan yours on The Marigold.")}
          overlayStyle={photoOverlayStyle(data)}
          freezeAt={0.3}
        />
      );

    case "fact-stack-reel": {
      const colorSequence = factStackColors(data);
      return (
        <FactStackReelStaticPreview
          facts={factStackFacts(data)}
          ctaText={str(
            data,
            "ctaText",
            "The Marigold — every number, every detail.",
          )}
          colorSequence={colorSequence}
          freezeAt={0.4}
        />
      );
    }

    case "quote-scroll-reel":
      return (
        <QuoteScrollReelStaticPreview
          quotes={scrollQuotes(data)}
          headerLabel={str(data, "headerLabel", "VENDOR WISDOM")}
          ctaText={str(
            data,
            "ctaText",
            "Vendors who get it — on The Marigold.",
          )}
          freezeAt={0.45}
        />
      );

    case "split-screen-talk-reel":
      return (
        <SplitScreenTalkReelStaticPreview
          topic={str(data, "topic", "Guest List Size")}
          exchanges={splitScreenExchanges(data)}
          finalTagline={str(
            data,
            "finalTagline",
            "we have a tab for both of you",
          )}
          freezeAt={0.55}
        />
      );

    case "bvm-reel":
      return (
        <BvMReelStaticPreview
          topic={str(data, "topic", "Guest List Size")}
          exchanges={splitScreenExchanges(data)}
          finalTagline={str(
            data,
            "finalTagline",
            "we have a tab for both of you",
          )}
        />
      );

    case "hot-take-reel": {
      const seriesTag = str(data, "seriesTag", "HOT TAKE").trim();
      return (
        <HotTakeReelStaticPreview
          lines={textRevealLines(data)}
          ctaText={str(data, "ctaText")}
          seriesTag={seriesTag || undefined}
          backgroundGradient={textRevealGradient(data)}
          font={textRevealFont(data)}
          holdTimeMs={num(data, "holdTimeMs", 2000)}
        />
      );
    }

    case "hot-take-post":
      return (
        <HotTakePost
          hotTake={str(data, "hotTake", "The baraat horse is overrated.")}
          responsePrompt={str(data, "responsePrompt", "agree or fight me")}
          ctaText={str(data, "ctaText", "Drop your take in the comments 👇")}
        />
      );

    case "hot-take-story":
      return (
        <HotTakeStory
          hotTake={str(
            data,
            "hotTake",
            "The sangeet is more important than the ceremony.",
          )}
          responsePrompt={str(data, "responsePrompt", "I said what I said.")}
          ctaText={str(data, "ctaText", "Drop your take in the comments 👇")}
        />
      );

    case "hot-takes-carousel": {
      const takes: string[] = [];
      for (let i = 0; i < 5; i += 1) {
        const t = str(data, `takes.${i}`).trim();
        if (t) takes.push(t);
      }
      return (
        <HotTakeCarousel
          takes={takes.length > 0 ? takes : ["Your hot take here."]}
          slideIndex={0}
          coverSubtitle={str(data, "coverSubtitle") || undefined}
          closeHeadline={str(data, "closeHeadline") || undefined}
          closeSubtitle={str(data, "closeSubtitle") || undefined}
        />
      );
    }

    case "countdown-post": {
      const unitRaw = str(data, "countdownUnit", "months").trim();
      const unit: "months" | "weeks" | "days" =
        unitRaw === "weeks" || unitRaw === "days" ? unitRaw : "months";
      const urgencyRaw = str(data, "urgencyLevel", "getting-real").trim();
      const urgency: "chill" | "getting-real" | "panic" =
        urgencyRaw === "chill" || urgencyRaw === "panic" ? urgencyRaw : "getting-real";
      return (
        <CountdownPost
          countdownNumber={num(data, "countdownNumber", 6)}
          countdownUnit={unit}
          taskHeadline={str(data, "taskHeadline", "Lock in your vendors")}
          taskDetail={str(data, "taskDetail", "")}
          annotation={str(data, "annotation", "")}
          urgencyLevel={urgency}
        />
      );
    }

    case "countdown-carousel": {
      const milestones: CountdownMilestone[] = [];
      for (let i = 0; i < 6; i += 1) {
        const numberStr = str(data, `milestones.${i}.number`).trim();
        const tasksRaw = str(data, `milestones.${i}.tasks`).trim();
        if (!numberStr && !tasksRaw) continue;
        const unitRaw = str(data, `milestones.${i}.unit`, "months").trim();
        const unit: "months" | "weeks" | "days" =
          unitRaw === "weeks" || unitRaw === "days" ? unitRaw : "months";
        milestones.push({
          number: num(data, `milestones.${i}.number`, 0) || 0,
          unit,
          tasks: splitLines(tasksRaw),
        });
      }
      return (
        <CountdownCarousel
          milestones={
            milestones.length > 0
              ? milestones
              : [{ number: 6, unit: "months", tasks: ["Lock the venue"] }]
          }
          slideIndex={0}
          coverTitle={str(data, "coverTitle") || undefined}
          coverSubtitle={str(data, "coverSubtitle") || undefined}
          closeHeadline={str(data, "closeHeadline") || undefined}
          closeCta={str(data, "closeCta") || undefined}
        />
      );
    }

    case "mood-board-post": {
      const palette = splitLines(str(data, "colorPalette")).filter(Boolean);
      const images = splitLines(str(data, "images")).filter(Boolean);
      return (
        <MoodBoardPost
          styleLabel={str(data, "styleLabel", "Romantic Garden")}
          annotation={str(data, "annotation", "")}
          colorPalette={palette}
          images={images}
        />
      );
    }

    case "color-palette-post": {
      const colors: { hex: string; name: string }[] = [];
      for (let i = 0; i < 5; i += 1) {
        const hex = str(data, `colors.${i}.hex`).trim();
        if (!hex) continue;
        colors.push({
          hex,
          name: str(data, `colors.${i}.name`, "").trim(),
        });
      }
      return (
        <ColorPalettePost
          paletteName={str(data, "paletteName", "Garden Romance")}
          seasonNote={str(data, "seasonNote", "")}
          colors={colors.length > 0 ? colors : [{ hex: "#F4C2C2", name: "Blush" }]}
        />
      );
    }

    case "diary-entry-post": {
      const doodleRaw = str(data, "marginDoodle", "heart").trim();
      const doodle: "heart" | "flower" | "stressed" | "sparkle" | "ring" =
        doodleRaw === "flower" ||
        doodleRaw === "stressed" ||
        doodleRaw === "sparkle" ||
        doodleRaw === "ring"
          ? doodleRaw
          : "heart";
      return (
        <DiaryEntryPost
          dayOrWeek={str(data, "dayOrWeek", "Day 142")}
          dateLabel={str(data, "dateLabel", "")}
          diaryText={str(
            data,
            "diaryText",
            "Tried on the lehenga today. Cried in the changing room.",
          )}
          brideIdentifier={str(data, "brideIdentifier", "")}
          planningStage={str(data, "planningStage", "")}
          marginDoodle={doodle}
        />
      );
    }

    case "countdown-reel":
      return (
        <CountdownReelStaticPreview
          title={str(data, "title", "Top 5 Things to Do 6 Months Out")}
          countdownItems={countdownItems(data)}
          hookText={str(data, "hookText", "you're behind if you haven't done #1")}
          ctaText={str(
            data,
            "ctaText",
            "Track every milestone on The Marigold.",
          )}
        />
      );

    case "budget-reel":
      return (
        <BudgetReelStaticPreview
          facts={factStackFacts(data)}
          ctaText={str(data, "ctaText", "Track every rupee on The Marigold.")}
          colorSequence={factStackColors(data)}
        />
      );

    case "planning-101-reel":
      return (
        <Planning101ReelStaticPreview
          title={str(data, "title", "5 Red Flags in a Venue Contract")}
          countdownItems={countdownItems(data)}
          hookText={str(data, "hookText", "#1 is the one that bites")}
          ctaText={str(data, "ctaText", "Vet every contract on The Marigold.")}
        />
      );

    case "platform-reel":
      return (
        <PlatformReelStaticPreview
          beforeItems={splitLines(str(data, "beforeItems"))}
          afterItems={splitLines(str(data, "afterItems"))}
          transitionStyle={beforeAfterTransition(data)}
        />
      );

    case "venue-reel":
      return (
        <VenueReelStaticPreview
          slides={photoMontageSlides(data)}
          ctaText={str(data, "ctaText", "Tour every venue on The Marigold.")}
          overlayStyle={photoOverlayStyle(data)}
        />
      );

    case "vendor-portfolio-reel":
      return (
        <VendorPortfolioReelStaticPreview
          slides={photoMontageSlides(data)}
          ctaText={str(
            data,
            "ctaText",
            "Book vendors who deliver — on The Marigold.",
          )}
          overlayStyle={photoOverlayStyle(data)}
        />
      );

    case "this-or-that-reel":
      return (
        <ThisOrThatReelStaticPreview
          topic={str(data, "topic", "Wedding Vibes")}
          exchanges={splitScreenExchanges(data)}
          finalTagline={str(
            data,
            "finalTagline",
            "pick your team — both live on The Marigold",
          )}
        />
      );

    case "tradition-reel": {
      const seriesTag = str(data, "seriesTag", "CULTURE CORNER").trim();
      return (
        <TraditionReelStaticPreview
          lines={textRevealLines(data)}
          ctaText={str(data, "ctaText")}
          seriesTag={seriesTag || undefined}
          backgroundGradient={textRevealGradient(data)}
          font={textRevealFont(data)}
          holdTimeMs={num(data, "holdTimeMs", 1800)}
        />
      );
    }

    case "bride-life-reel": {
      const seriesTag = str(data, "seriesTag", "BRIDE LIFE").trim();
      return (
        <BrideLifeReelStaticPreview
          lines={textRevealLines(data)}
          ctaText={str(data, "ctaText")}
          seriesTag={seriesTag || undefined}
          backgroundGradient={textRevealGradient(data)}
          font={textRevealFont(data)}
          holdTimeMs={num(data, "holdTimeMs", 2200)}
        />
      );
    }

    case "edit-reel":
      return (
        <EditReelStaticPreview
          facts={factStackFacts(data)}
          ctaText={str(data, "ctaText", "Shop the edit on The Marigold.")}
          colorSequence={factStackColors(data)}
        />
      );

    case "community-reel":
      return (
        <CommunityReelStaticPreview
          quotes={scrollQuotes(data)}
          headerLabel={str(data, "headerLabel", "COMMUNITY VOICES")}
          ctaText={str(data, "ctaText", "Share your story on The Marigold.")}
        />
      );

    case "bride-connect-stories-reel":
      return (
        <BrideConnectStoriesReelStaticPreview
          quotes={scrollQuotes(data)}
          headerLabel={str(data, "headerLabel", "MATCHED ON BRIDE CONNECT")}
          ctaText={str(
            data,
            "ctaText",
            "Find your planning bestie on The Marigold.",
          )}
        />
      );

    case "seasonal-reel":
      return (
        <SeasonalReelStaticPreview
          facts={factStackFacts(data)}
          ctaText={str(
            data,
            "ctaText",
            "What's trending this season — on The Marigold.",
          )}
          colorSequence={factStackColors(data)}
        />
      );

    case "mood-board-reel":
      return (
        <MoodBoardReelStaticPreview
          slides={photoMontageSlides(data)}
          ctaText={str(
            data,
            "ctaText",
            "Build your mood board on The Marigold.",
          )}
          overlayStyle={photoOverlayStyle(data)}
        />
      );

    case "diary-snippet-reel": {
      const seriesTag = str(data, "seriesTag", "DIARY ENTRY").trim();
      return (
        <DiarySnippetReelStaticPreview
          lines={textRevealLines(data)}
          ctaText={str(data, "ctaText")}
          seriesTag={seriesTag || undefined}
          backgroundGradient={textRevealGradient(data)}
          font={textRevealFont(data)}
          holdTimeMs={num(data, "holdTimeMs", 2000)}
        />
      );
    }

    case "lehenga-style-post":
      return (
        <LehengaStylePost
          imageUrl={str(data, "imageUrl")}
          styleName={str(data, "styleName")}
          colorDescription={str(data, "colorDescription")}
          bestFor={str(data, "bestFor")}
          designerSource={str(data, "designerSource") || undefined}
        />
      );

    case "did-you-know-post":
      return (
        <DidYouKnowPost
          fact={str(data, "fact")}
          source={str(data, "source")}
          annotation={str(data, "annotation") || undefined}
        />
      );

    case "dos-and-donts-post":
      return (
        <DosAndDontsPost
          vendorCategory={str(data, "vendorCategory")}
          dos={arrayField(data, "dos", 4)}
          donts={arrayField(data, "donts", 4)}
          bottomNote={str(data, "bottomNote") || undefined}
        />
      );

    case "real-numbers-post":
      return (
        <RealNumbersPost
          totalBudget={str(data, "totalBudget")}
          lineItems={realNumbersLineItems(data)}
          annotation={str(data, "annotation") || undefined}
        />
      );

    case "wedding-math-reel":
      return (
        <WeddingMathReelStaticPreview
          equations={weddingMathEquations(data)}
          punchline={str(data, "punchline")}
          ctaText={str(
            data,
            "ctaText",
            "Use The Marigold budget tracker.",
          )}
          holdTimeMs={num(data, "holdTimeMs", 1400)}
        />
      );

    case "approval-matrix-post":
      return (
        <ApprovalMatrixPost
          title={str(data, "title")}
          subtitle={str(data, "subtitle") || undefined}
          items={approvalMatrixItems(data)}
        />
      );

    case "ask-the-marigold-story":
      return (
        <AskTheMarigoldStory
          askerLabel={str(data, "askerLabel", "Anonymous DM")}
          question={str(data, "question")}
          answer={str(data, "answer")}
          annotations={arrayField(data, "annotations", 3)}
          ctaText={str(
            data,
            "ctaText",
            "Ask us anything — DM or link in bio",
          )}
        />
      );

    case "budget-pie-post": {
      const categories = budgetPieCategories(data);
      return (
        <BudgetPiePost
          budgetTotal={str(data, "budgetTotal") || undefined}
          categories={categories.length > 0 ? categories : undefined}
          annotation={str(data, "annotation") || undefined}
        />
      );
    }

    case "save-vs-splurge-post": {
      const saveItems = splitLines(str(data, "saveItems"));
      const splurgeItems = splitLines(str(data, "splurgeItems"));
      return (
        <SaveVsSplurgePost
          saveItems={saveItems.length > 0 ? saveItems : undefined}
          splurgeItems={splurgeItems.length > 0 ? splurgeItems : undefined}
          bottomLine={str(data, "bottomLine") || undefined}
        />
      );
    }

    case "budget-reality-post": {
      const categories = budgetRealityCategories(data);
      return (
        <BudgetRealityPost
          categories={categories.length > 0 ? categories : undefined}
          annotation={str(data, "annotation") || undefined}
          plannedTotal={str(data, "plannedTotal") || undefined}
          actualTotal={str(data, "actualTotal") || undefined}
        />
      );
    }

    case "cost-by-city-post": {
      const costs = cityCostRows(data);
      return (
        <CostByCityPost
          cityName={str(data, "cityName") || undefined}
          costs={costs.length > 0 ? costs : undefined}
          disclaimer={str(data, "disclaimer") || undefined}
        />
      );
    }

    case "budget-tips-carousel":
      return (
        <BudgetTipsCarousel
          tips={budgetTips(data)}
          slideIndex={num(data, "slideIndex", 0)}
          coverTitle={str(data, "coverTitle") || undefined}
          coverSubtitle={str(data, "coverSubtitle") || undefined}
          closeHeadline={str(data, "closeHeadline") || undefined}
          closeSubtitle={str(data, "closeSubtitle") || undefined}
        />
      );

    case "platform-feature-drop-post": {
      const mockupImageUrl = str(data, "mockupImageUrl").trim();
      return (
        <FeatureDropPost
          featureLabel={featureLabel(data)}
          featureName={str(data, "featureName")}
          benefits={arrayField(data, "benefits", 6)}
          annotation={str(data, "annotation")}
          ctaText={str(data, "ctaText")}
          mockupImageUrl={mockupImageUrl || undefined}
        />
      );
    }

    case "platform-before-after-post":
      return (
        <BeforeAfterPost
          beforeItems={splitLines(str(data, "beforeItems"))}
          afterItems={splitLines(str(data, "afterItems"))}
        />
      );

    case "platform-how-it-works-carousel":
      return (
        <HowItWorksCarousel
          steps={howItWorksSteps(data)}
          slideIndex={num(data, "slideIndex", 0)}
          ctaText={str(data, "ctaText") || undefined}
        />
      );

    case "platform-vs-old-way-post":
      return (
        <MarigoldVsOldWayPost
          comparisons={comparisonRows(data)}
          tagline={str(data, "tagline")}
        />
      );

    case "platform-testimonial-post":
      return (
        <TestimonialPost
          testimonialText={str(data, "testimonialText")}
          rating={num(data, "rating", 5)}
          attribution={str(data, "attribution")}
          isVerified={bool(data, "isVerified", true)}
        />
      );

    case "platform-stat-story":
      return (
        <PlatformStatStory
          statValue={str(data, "statValue")}
          statContext={str(data, "statContext")}
          supportingDetail={str(data, "supportingDetail")}
          aside={str(data, "aside")}
        />
      );

    case "in-season-trend-post":
      return (
        <SeasonalTrendPost
          season={str(data, "season", "Winter")}
          year={str(data, "year", "2026-27")}
          backgroundColor={str(data, "backgroundColor") || undefined}
          trends={seasonalTrends(data)}
          editorialTake={str(data, "editorialTake")}
        />
      );

    case "in-season-festival-inspo-post":
      return (
        <FestivalInspoPost
          festivalName={str(data, "festivalName")}
          festivalColor={str(data, "festivalColor") || undefined}
          connections={festivalConnections(data)}
          note={str(data, "note")}
        />
      );

    case "in-season-prep-carousel":
      return (
        <WeddingSeasonPrepCarousel
          seasonName={str(data, "seasonName", "Winter Wedding Season")}
          seasonDates={str(
            data,
            "seasonDates",
            "November 2026 — February 2027",
          )}
          hypeText={str(data, "hypeText") || undefined}
          bookNow={{ items: prepSlideItems(data, "bookNow") }}
          startNow={{ items: prepSlideItems(data, "startNow") }}
          decideNow={{ items: prepSlideItems(data, "decideNow") }}
          relaxAbout={{ items: prepSlideItems(data, "relaxAbout") }}
          ctaHeadline={str(data, "ctaHeadline") || undefined}
          ctaSupport={str(data, "ctaSupport") || undefined}
          ctaLine={str(data, "ctaLine") || undefined}
          slideIndex={num(data, "slideIndex", 0)}
        />
      );

    case "in-season-monthly-roundup-story":
      return (
        <MonthlyRoundupStory
          month={str(data, "month", "May")}
          year={str(data, "year", "2026")}
          items={roundupItems(data)}
          swipeText={str(data, "swipeText") || undefined}
        />
      );

    default:
      return null;
  }
}
