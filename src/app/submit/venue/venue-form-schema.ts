/**
 * Declarative schema for the venue submission wizard at /submit/venue.
 *
 * The wizard (and the draft / submit API routes) read from this single
 * source of truth. Keep field ids stable — they're stored in submission
 * records and consumed by the venue-profile auto-mapper in
 * `src/app/api/submit/venue/route.ts`.
 */

export type VenueFieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "select"
  | "multi-select"
  | "yesno"
  | "checkbox"
  | "file";

export interface VenueField {
  id: string;
  type: VenueFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  maxLength?: number;
  /** File upload only. */
  maxFiles?: number;
  /** File upload only — MB. */
  maxFileSize?: number;
  /** File upload only — accepted MIME prefixes. */
  acceptedTypes?: string[];
  /**
   * Conditionally show a field based on another field's value. When the
   * predicate fails, the field is hidden AND its value is treated as
   * empty for validation. Useful for "if yes, please explain"-style flows.
   */
  showIf?: { fieldId: string; equals?: string[]; isYes?: boolean };
}

export interface VenueStep {
  id: string;
  number: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  fields: VenueField[];
}

// ---------------------------------------------------------------------------
// Reusable option lists
// ---------------------------------------------------------------------------

export const VENUE_TYPE_OPTIONS = [
  "Palace/Fort",
  "Garden/Outdoor Estate",
  "Beach/Waterfront",
  "Farmhouse/Ranch",
  "Hotel/Resort",
  "Heritage Haveli",
  "Rooftop",
  "Banquet Hall",
  "Country Club/Golf Course",
  "Vineyard/Winery",
  "Temple-Adjacent",
  "Restaurant/Private Dining",
  "Warehouse/Industrial",
  "Other",
];

const MULTI_SPACE_OPTIONS = [
  "Yes — multiple indoor/outdoor areas",
  "Yes — one main space with breakout areas",
  "No — single event space",
];

const COVERED_OUTDOOR_OPTIONS = ["Yes", "No", "Available for rental"];

const SA_WEDDINGS_HOSTED_OPTIONS = [
  "None yet — but we'd love to",
  "1-5",
  "6-15",
  "16-30",
  "30+",
  "We specialize in South Asian weddings",
];

const BARAAT_POLICY_OPTIONS = [
  "Yes — no restrictions",
  "Yes — with designated path/area",
  "Yes — but with a fee",
  "No",
];

const BARAAT_HORSE_OPTIONS = [
  "Yes",
  "Yes — with approval and insurance",
  "No",
  "N/A — we don't allow baraats",
];

const BARAAT_DHOL_OPTIONS = [
  "Yes",
  "Yes — with noise/time restrictions",
  "No",
];

const CEREMONY_TIME_OPTIONS = [
  "No restrictions — morning or evening ceremonies welcome",
  "Ceremonies must be in the afternoon/evening only",
  "Ceremonies must end before a certain time",
  "Other",
];

const FIRE_CEREMONY_OPTIONS = [
  "Yes — we have experience with this",
  "Yes — with safety precautions and approval",
  "Outdoors only",
  "No",
];

const PETAL_OPTIONS = [
  "Yes",
  "Outdoors only",
  "No — but we allow alternatives like confetti/bubbles",
];

const MANDAP_OPTIONS = [
  "Yes — indoor with high ceilings",
  "Yes — outdoor open sky",
  "Both options available",
  "Would need to discuss",
];

const MULTI_DAY_OPTIONS = [
  "Yes — we regularly host 2-3 day weddings",
  "Yes — but it's less common",
  "No — but we're open to it",
  "We only host single-day events",
];

const CATERING_POLICY_OPTIONS = [
  "In-house catering only — no outside caterers",
  "In-house catering preferred — outside caterers allowed with a fee",
  "Outside catering welcome — no restrictions",
  "No in-house catering — must bring your own caterer",
];

const INDIAN_CHEF_OPTIONS = [
  "Yes — we have an Indian chef on staff",
  "Yes — we have experience and can prepare Indian cuisine",
  "We can prepare Indian food if you provide recipes",
  "Limited — we can do some dishes but recommend supplementing with an outside caterer",
  "No — but we welcome outside Indian caterers",
];

const REGIONAL_CUISINE_OPTIONS = [
  "North Indian/Punjabi",
  "South Indian",
  "Gujarati",
  "Bengali",
  "Rajasthani",
  "Indo-Chinese/Fusion",
  "Mughlai",
  "Street Food/Chaat",
  "Multiple — we're versatile",
  "We'd need to discuss specific menus",
];

const LIVE_STATION_OPTIONS = [
  "Yes",
  "Yes — with setup fee",
  "Space constraints — would need to discuss",
  "No",
];

const VEG_KITCHEN_OPTIONS = [
  "Yes — we can do fully vegetarian events",
  "Yes — we have separate prep areas",
  "We can accommodate but not a fully separate kitchen",
  "No",
];

const BUYOUT_OPTIONS = [
  "Yes — exclusive use of entire property",
  "Yes — for an additional fee",
  "No — other events may be happening simultaneously",
];

const FURNITURE_OPTIONS = [
  "Tables",
  "Chairs",
  "Linens/tablecloths",
  "Centerpiece vases",
  "Dance floor",
  "Stage/riser",
  "Sound system/speakers",
  "Microphone",
  "Projector/screen",
  "Lighting (basic)",
  "Uplighting",
  "Cocktail tables",
  "Lounge furniture",
  "None — all rentals are separate",
];

const WATER_OPTIONS = [
  "No — included in catering",
  "Yes — charged per gallon/per person",
  "Depends on the package",
];

const PARKING_OPTIONS = [
  "Free on-site parking for all guests",
  "On-site parking with fee",
  "Valet available — included",
  "Valet available — additional cost",
  "Street parking only",
  "Shuttle service available",
];

const DAY_BEFORE_OPTIONS = ["Yes", "No", "With fee"];
const SIMPLE_YN_NA = ["Yes", "No", "N/A"];

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const TOTAL = 6;

export const VENUE_FORM_STEPS: VenueStep[] = [
  {
    id: "basics",
    number: 1,
    totalSteps: TOTAL,
    title: "The basics",
    subtitle:
      "Just the essentials so couples can find you. Takes about a minute.",
    fields: [
      { id: "venue_name", type: "text", label: "Venue name", required: true },
      {
        id: "city_state",
        type: "text",
        label: "City and state",
        required: true,
        placeholder: "Udaipur, Rajasthan",
      },
      {
        id: "full_address",
        type: "text",
        label: "Full address",
        placeholder: "123 Lake Palace Rd…",
      },
      {
        id: "venue_type",
        type: "select",
        label: "Venue type",
        required: true,
        options: VENUE_TYPE_OPTIONS,
      },
      {
        id: "website",
        type: "url",
        label: "Website",
        placeholder: "https://…",
      },
      {
        id: "instagram",
        type: "text",
        label: "Instagram handle",
        placeholder: "@yourhandle",
      },
      {
        id: "contact_name",
        type: "text",
        label: "Contact person name",
        required: true,
      },
      {
        id: "contact_email",
        type: "email",
        label: "Contact email",
        required: true,
        placeholder: "events@venue.com",
      },
      {
        id: "contact_phone",
        type: "text",
        label: "Contact phone",
        placeholder: "+1 555 123 4567",
      },
      {
        id: "one_line_pitch",
        type: "textarea",
        label: "How would you describe your venue in one sentence?",
        maxLength: 200,
        helpText:
          "This becomes the 'best for' line on your feature card — make it count.",
      },
    ],
  },

  {
    id: "spaces",
    number: 2,
    totalSteps: TOTAL,
    title: "Tell us about your spaces",
    subtitle:
      "South Asian weddings often need multiple areas for different events — ceremony, reception, sangeet, baraat path, and more. The more detail you share, the easier it is for couples to picture their wedding at your venue.",
    fields: [
      {
        id: "max_capacity",
        type: "number",
        label: "Maximum guest capacity — largest single event",
        required: true,
        placeholder: "e.g. 400",
      },
      {
        id: "multi_space",
        type: "select",
        label: "Do you have multiple event spaces on the property?",
        required: true,
        options: MULTI_SPACE_OPTIONS,
      },
      {
        id: "spaces_description",
        type: "textarea",
        label: "Describe your spaces",
        helpText:
          "e.g. Grand Ballroom seats 400, Garden Terrace seats 200, Rooftop Lounge seats 80, Poolside for cocktails up to 150",
        showIf: {
          fieldId: "multi_space",
          equals: [
            "Yes — multiple indoor/outdoor areas",
            "Yes — one main space with breakout areas",
          ],
        },
      },
      {
        id: "indoor_ceremony",
        type: "yesno",
        label: "Indoor ceremony space available?",
        required: true,
      },
      {
        id: "indoor_ceremony_capacity",
        type: "number",
        label: "Indoor ceremony capacity",
        showIf: { fieldId: "indoor_ceremony", isYes: true },
      },
      {
        id: "outdoor_ceremony",
        type: "yesno",
        label: "Outdoor ceremony space available?",
        required: true,
      },
      {
        id: "outdoor_ceremony_capacity",
        type: "number",
        label: "Outdoor ceremony capacity",
        showIf: { fieldId: "outdoor_ceremony", isYes: true },
      },
      {
        id: "covered_outdoor",
        type: "select",
        label: "Is there a covered/tented outdoor option in case of weather?",
        options: COVERED_OUTDOOR_OPTIONS,
      },
      {
        id: "different_events_same_day",
        type: "yesno",
        label:
          "Can different events (ceremony, cocktails, reception) happen in different spaces on the same day?",
        required: true,
      },
      {
        id: "sangeet_space",
        type: "select",
        label: "Is there a separate space suitable for a sangeet or mehndi night?",
        options: ["Yes", "No", "With rental"],
      },
    ],
  },

  {
    id: "south-asian",
    number: 3,
    totalSteps: TOTAL,
    title: "Your experience with South Asian weddings",
    subtitle:
      "This is the section brides care about most. Be honest — it helps couples find the right fit and saves everyone time.",
    fields: [
      {
        id: "sa_weddings_hosted",
        type: "select",
        label: "How many South Asian / Indian weddings have you hosted?",
        required: true,
        options: SA_WEDDINGS_HOSTED_OPTIONS,
      },
      {
        id: "baraat_policy",
        type: "select",
        label: "Do you allow a baraat (groom's procession) on the property?",
        required: true,
        options: BARAAT_POLICY_OPTIONS,
      },
      {
        id: "baraat_fee",
        type: "text",
        label: "If there's a baraat fee, what's the approximate cost?",
        placeholder: "e.g. $5,000 or Varies by setup",
        showIf: {
          fieldId: "baraat_policy",
          equals: ["Yes — but with a fee"],
        },
      },
      {
        id: "baraat_horse",
        type: "select",
        label: "Can the baraat include a horse or horse-drawn carriage?",
        options: BARAAT_HORSE_OPTIONS,
      },
      {
        id: "baraat_dhol",
        type: "select",
        label:
          "Can the baraat include a dhol player and live music during the procession?",
        options: BARAAT_DHOL_OPTIONS,
      },
      {
        id: "noise_curfew",
        type: "text",
        label: "Are there any noise ordinances or sound curfews?",
        placeholder: "e.g. Outdoor music must end by 10pm, indoor until midnight",
      },
      {
        id: "ceremony_time_restrictions",
        type: "select",
        label: "Are there ceremony time restrictions?",
        required: true,
        options: CEREMONY_TIME_OPTIONS,
      },
      {
        id: "ceremony_time_explain",
        type: "textarea",
        label: "Please explain",
        showIf: {
          fieldId: "ceremony_time_restrictions",
          equals: [
            "Ceremonies must be in the afternoon/evening only",
            "Ceremonies must end before a certain time",
            "Other",
          ],
        },
      },
      {
        id: "fire_ceremony",
        type: "select",
        label:
          "Do you allow fire/flame elements for Hindu ceremonies (havan/sacred fire)?",
        required: true,
        options: FIRE_CEREMONY_OPTIONS,
      },
      {
        id: "petals_rice",
        type: "select",
        label: "Do you allow flower petal or rice tossing?",
        options: PETAL_OPTIONS,
      },
      {
        id: "mandap_setup",
        type: "select",
        label:
          "Is there a mandap/chuppah setup area with appropriate ceiling height or open sky?",
        options: MANDAP_OPTIONS,
      },
      {
        id: "multi_day_experience",
        type: "select",
        label: "Do you have experience with multi-day wedding events?",
        required: true,
        options: MULTI_DAY_OPTIONS,
      },
    ],
  },

  {
    id: "catering",
    number: 4,
    totalSteps: TOTAL,
    title: "Catering & food — the most important section for desi weddings",
    subtitle:
      "Food is typically the #1 expense and the #1 thing guests remember. Brides need to know exactly what's possible before they commit.",
    fields: [
      {
        id: "catering_policy",
        type: "select",
        label: "Catering policy",
        required: true,
        options: CATERING_POLICY_OPTIONS,
      },
      {
        id: "outside_catering_fee",
        type: "text",
        label: "If outside catering is allowed, what's the fee?",
        placeholder: "e.g. $5,000 kitchen fee or $25 per person surcharge",
        showIf: {
          fieldId: "catering_policy",
          equals: [
            "In-house catering preferred — outside caterers allowed with a fee",
          ],
        },
      },
      {
        id: "indian_chef_experience",
        type: "select",
        label: "Does your in-house kitchen/chef have experience preparing Indian food?",
        required: true,
        options: INDIAN_CHEF_OPTIONS,
      },
      {
        id: "regional_cuisines",
        type: "multi-select",
        label: "What regional Indian cuisines can your kitchen handle?",
        options: REGIONAL_CUISINE_OPTIONS,
      },
      {
        id: "live_cooking_station",
        type: "select",
        label: "Can you accommodate a live cooking station or chaat counter?",
        options: LIVE_STATION_OPTIONS,
      },
      {
        id: "vegetarian_kitchen",
        type: "select",
        label: "Can you accommodate a vegetarian-only kitchen or prep area?",
        options: VEG_KITCHEN_OPTIONS,
      },
      {
        id: "tasting_sessions",
        type: "yesno",
        label: "Do you offer tasting sessions for Indian menus?",
      },
      {
        id: "per_plate_cost",
        type: "text",
        label: "What's the approximate per-plate cost range for a full Indian meal?",
        placeholder: "e.g. $85-150 per person or ₹2,000-4,000 per plate",
      },
      {
        id: "fb_minimum",
        type: "text",
        label: "Is there a food & beverage minimum?",
        placeholder: "e.g. $25,000 F&B minimum",
      },
      {
        id: "outside_dessert_restrictions",
        type: "text",
        label: "Any restrictions on outside desserts/cake/mithai?",
      },
    ],
  },

  {
    id: "logistics",
    number: 5,
    totalSteps: TOTAL,
    title: "The practical stuff",
    subtitle:
      "These are the questions that come up in every venue call. Answering them here saves everyone 30 emails.",
    fields: [
      {
        id: "starting_price_range",
        type: "text",
        label: "Starting price range for a full-day event",
        required: true,
        placeholder: "e.g. $15,000-30,000 venue rental or ₹8-15 lakh",
      },
      {
        id: "rental_includes",
        type: "textarea",
        label: "What does the base venue rental include?",
        helpText:
          "e.g. Tables, chairs, basic linens, setup/teardown, parking, bridal suite, AV system",
      },
      {
        id: "buyout_option",
        type: "select",
        label: "Is there a venue buyout option?",
        required: true,
        options: BUYOUT_OPTIONS,
      },
      {
        id: "buyout_cost",
        type: "text",
        label: "Buyout cost range if applicable",
        showIf: {
          fieldId: "buyout_option",
          equals: [
            "Yes — exclusive use of entire property",
            "Yes — for an additional fee",
          ],
        },
      },
      {
        id: "guest_rooms_count",
        type: "number",
        label: "How many guest rooms on the property?",
        helpText: "Enter 0 if none.",
      },
      {
        id: "room_block_rate",
        type: "select",
        label: "Do you offer a room block rate for wedding guests?",
        options: SIMPLE_YN_NA,
      },
      {
        id: "room_block_minimum",
        type: "text",
        label: "Is there a room block minimum?",
      },
      {
        id: "furniture_included",
        type: "multi-select",
        label: "What furniture and equipment is included in the rental?",
        options: FURNITURE_OPTIONS,
      },
      {
        id: "not_included",
        type: "textarea",
        label: "What is NOT included that couples usually need to rent separately?",
      },
      {
        id: "water_charge",
        type: "select",
        label: "Do you charge for water/beverage service separately?",
        options: WATER_OPTIONS,
      },
      {
        id: "parking",
        type: "select",
        label: "Parking situation",
        options: PARKING_OPTIONS,
      },
      {
        id: "parking_spots",
        type: "number",
        label: "How many parking spots available?",
      },
      {
        id: "bridal_suite",
        type: "yesno",
        label: "Is there a getting-ready suite for the bride?",
      },
      {
        id: "groom_suite",
        type: "yesno",
        label: "Is there a separate getting-ready area for the groom?",
      },
      {
        id: "latest_end_time",
        type: "text",
        label: "Latest event end time allowed",
        placeholder: "e.g. Midnight or 2am with extended hours fee",
      },
      {
        id: "extended_hours_fee",
        type: "text",
        label: "Is there an extended hours fee?",
        placeholder: "e.g. $1,000 per hour after midnight",
      },
      {
        id: "setup_teardown_time",
        type: "text",
        label: "Setup and teardown — how much time is included?",
        placeholder: "e.g. 4 hours setup, 2 hours teardown included",
      },
      {
        id: "day_before_setup",
        type: "select",
        label: "Day-before setup/rehearsal available?",
        options: DAY_BEFORE_OPTIONS,
      },
    ],
  },

  {
    id: "photos",
    number: 6,
    totalSteps: TOTAL,
    title: "Show off your space",
    subtitle:
      "Great photos are what get brides to reach out. Upload your best — ceremony setups, reception layouts, outdoor spaces, and any South Asian weddings you've hosted.",
    fields: [
      {
        id: "venue_photos",
        type: "file",
        label: "Venue photos",
        required: true,
        maxFiles: 20,
        maxFileSize: 10,
        acceptedTypes: ["image/"],
        helpText:
          "Upload up to 20 photos. Include: ceremony space, reception area, outdoor areas, getting-ready suites, and any photos from Indian weddings you've hosted.",
      },
      {
        id: "virtual_tour_link",
        type: "url",
        label: "Virtual tour link (optional)",
        placeholder: "https://…",
      },
      {
        id: "video_walkthrough_link",
        type: "url",
        label: "Video walkthrough link (optional — YouTube or Vimeo)",
        placeholder: "https://…",
      },
      {
        id: "open_house_dates",
        type: "text",
        label: "Any upcoming open house dates for South Asian couples?",
      },
      {
        id: "anything_else",
        type: "textarea",
        label: "Anything else couples should know about your venue?",
        maxLength: 500,
        helpText:
          "e.g. We're pet-friendly, we have a helipad for grand entrances, our chef trained in Lucknow",
      },
      {
        id: "permission_feature",
        type: "checkbox",
        label:
          "I give The Marigold permission to feature this venue on our platform and Instagram with credit",
        required: true,
      },
    ],
  },
];

/**
 * Flat lookup of every field across every step. Used by the API routes
 * to validate ids on incoming submissions.
 */
export function getAllVenueFields(): VenueField[] {
  return VENUE_FORM_STEPS.flatMap((step) => step.fields);
}

export function getVenueFieldById(id: string): VenueField | undefined {
  return getAllVenueFields().find((f) => f.id === id);
}

/**
 * Maps the human-readable venue type from the form to the
 * VenueFeaturePost component's `VenueType` enum. Anything that doesn't
 * map cleanly falls back to "palace" — the user can change it in the
 * editor before publishing.
 */
export function mapVenueTypeToTemplate(value: string): string {
  const v = value.toLowerCase();
  if (v.startsWith("palace") || v.includes("fort")) return "palace";
  if (v.startsWith("garden") || v.includes("outdoor estate")) return "garden";
  if (v.startsWith("beach") || v.includes("waterfront")) return "beachfront";
  if (v.startsWith("farmhouse") || v.includes("ranch")) return "farmhouse";
  if (v.startsWith("hotel") || v.includes("resort")) return "resort";
  if (v.includes("haveli")) return "heritage-haveli";
  if (v.startsWith("rooftop")) return "rooftop";
  if (v.includes("temple")) return "temple-adjacent";
  if (v.includes("banquet") || v.includes("ballroom")) return "ballroom";
  return "palace";
}
