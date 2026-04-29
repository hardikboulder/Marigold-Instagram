/**
 * Declarative schema for the smart vendor intake form at /submit/vendor.
 *
 * Unlike the venue form, the vendor form is a single scrolling page with
 * progressive disclosure: a short universal section opens with the form,
 * then category-specific questions slide in once the vendor picks "What
 * do you do?", and a universal closing section caps the form.
 *
 * The schema below is read by both the form component and the
 * /api/submit/vendor route, so field ids stay stable.
 */

export type VendorFieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "select"
  | "multi-select"
  | "yesno"
  | "checkbox"
  | "file";

export interface VendorField {
  id: string;
  type: VendorFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  /** Per-category override for helpText shown on the photos uploader. */
  helpTextByCategory?: Record<string, string>;
  options?: string[];
  maxLength?: number;
  maxFiles?: number;
  /** Per-file size limit in MB. */
  maxFileSize?: number;
  acceptedTypes?: string[];
  /** Use @ as a hint prefix for Instagram handle inputs. */
  prefix?: string;
  /**
   * Conditionally show a field based on another field's value. When the
   * predicate fails, the field is hidden AND its value is treated as
   * empty for validation. `equals` works for select/yesno fields;
   * `includes` works for multi-select fields ("show me when this option
   * is checked").
   */
  showIf?: {
    fieldId: string;
    equals?: string[];
    includes?: string;
  };
}

export interface VendorCategory {
  /** Stable id used as a key inside CATEGORY_FIELDS. */
  id: string;
  /** Human label shown in the dropdown and submitted with the form. */
  label: string;
  /** Section heading for the dropdown grouping. */
  group: VendorCategoryGroup;
  /**
   * Estimated minutes a vendor will spend on the form when this category
   * is selected. Used to update "Takes about N minutes" in the header.
   */
  estimatedMinutes: number;
}

export type VendorCategoryGroup =
  | "Creative"
  | "Design & Decor"
  | "Food & Drink"
  | "Beauty"
  | "Fashion"
  | "Planning"
  | "Ceremony"
  | "Entertainment"
  | "Transport"
  | "Art"
  | "Other";

// ---------------------------------------------------------------------------
// Universal sections
// ---------------------------------------------------------------------------

export const UNIVERSAL_OPENING_FIELDS: VendorField[] = [
  {
    id: "contact_name",
    type: "text",
    label: "Your name",
    required: true,
  },
  {
    id: "business_name",
    type: "text",
    label: "Business name",
    required: true,
  },
  {
    id: "category",
    type: "select",
    label: "What do you do?",
    required: true,
    helpText:
      "Pick the category that fits best. Type to search — we'll show questions tailored to your craft.",
  },
  {
    id: "cities_served",
    type: "text",
    label: "City / cities you serve",
    required: true,
    placeholder: "e.g., Mumbai, Pune & Destination",
  },
  {
    id: "instagram",
    type: "text",
    label: "Instagram handle",
    placeholder: "yourhandle",
    prefix: "@",
  },
  {
    id: "website",
    type: "url",
    label: "Website",
    placeholder: "https://…",
  },
  {
    id: "contact_email",
    type: "email",
    label: "Contact email",
    required: true,
    placeholder: "you@business.com",
  },
  {
    id: "contact_phone",
    type: "text",
    label: "Phone number",
    placeholder: "e.g., +91 98765 43210",
  },
  {
    id: "business_address",
    type: "text",
    label: "Business address or studio location",
    placeholder: "e.g., 14 Link Road, Bandra West, Mumbai 400050",
  },
  {
    id: "years_in_industry",
    type: "select",
    label: "How long have you been in the wedding industry?",
    options: [
      "Less than 1 year",
      "1-3 years",
      "3-5 years",
      "5-10 years",
      "10+ years",
    ],
  },
  {
    id: "starting_price",
    type: "text",
    label: "Approximate starting price for weddings",
    placeholder: "e.g., ₹1.5 lakh or $3,000",
  },
  {
    id: "destination_weddings",
    type: "select",
    label: "Do you do destination weddings?",
    options: [
      "Yes — I travel anywhere",
      "Yes — within US",
      "Yes — international",
      "Only within my city/region",
      "Open to it but haven't yet",
    ],
  },
  {
    id: "virtual_consultations",
    type: "select",
    label: "Do you offer virtual consultations?",
    options: [
      "Yes",
      "For initial consultation only",
      "No — in-person only",
    ],
  },
  {
    id: "languages_spoken",
    type: "multi-select",
    label: "Languages you speak",
    helpText:
      "Brides often want a vendor who can chat with their parents — this matters more than people realize.",
    options: [
      "English",
      "Hindi",
      "Gujarati",
      "Punjabi",
      "Tamil",
      "Telugu",
      "Kannada",
      "Bengali",
      "Marathi",
      "Urdu",
      "Malayalam",
      "Other",
    ],
  },
  {
    id: "languages_other",
    type: "text",
    label: "Which other languages?",
    placeholder: "e.g., Sindhi, Konkani, Oriya",
    showIf: { fieldId: "languages_spoken", includes: "Other" },
  },
  {
    id: "booking_method",
    type: "select",
    label: "How do clients typically book you?",
    helpText:
      "Helps us know how to connect couples to you when we feature your work.",
    options: [
      "Inquiry form on my website",
      "DM on Instagram",
      "Phone/WhatsApp",
      "Email",
      "Through a planner",
      "Any of the above",
    ],
  },
];

export const UNIVERSAL_CLOSING_FIELDS: VendorField[] = [
  {
    id: "portfolio_photos",
    type: "file",
    label: "Upload 5–10 photos of your best work",
    required: true,
    maxFiles: 10,
    maxFileSize: 10,
    acceptedTypes: ["image/"],
    helpText: "Your best work from recent weddings.",
    helpTextByCategory: {
      photographer:
        "Show a range — ceremony, portraits, candids, detail shots.",
      videographer:
        "Stills from your reels — ceremony, portraits, dance moments, detail shots.",
      "decorator-floral":
        "Mandap setups, table settings, floral arrangements, full venue shots.",
      florist:
        "Bouquets, mandap florals, garlands, centerpieces, flower walls.",
      caterer:
        "Buffet setups, plated courses, live stations, dessert displays.",
      "makeup-hair":
        "Bridal looks — multiple angles, plus mehndi/sangeet looks if you offer them.",
      mehndi:
        "Bridal hands and feet, plus a few guest mehndi designs.",
      dj:
        "You on the decks, sangeet shots, baraat moments, lighting setups.",
      "wedding-planner":
        "Setups you've coordinated — different vibes across multiple weddings.",
      stationery:
        "Suite flat-lays, individual cards, calligraphy details, custom illustrations.",
      jeweler:
        "Bridal sets, individual pieces, on-bride shots if you have them.",
      pandit:
        "Mandap setups during ceremonies, ritual moments, you officiating.",
      outfit:
        "Bridal lehengas (multiple angles), groom looks, family/bridesmaid outfits.",
      bartender:
        "Bar setups, signature cocktails, your team in action.",
      choreographer:
        "Stills or photos from sangeet performances you've choreographed.",
      "photo-booth":
        "Booth setups at past events plus a few sample prints/strips.",
      fireworks:
        "Effect shots — sparkler send-offs, cold sparklers, confetti moments.",
      "horse-baraat":
        "Decorated horse and baraat moments from past weddings.",
      "puja-supplies":
        "Sample sets, individual items, packaging.",
      cake:
        "Wedding cakes, dessert tables, mithai displays, custom cookies.",
      lighting:
        "Uplighting, gobos, fairy lights, dance floor washes, projection setups.",
      transportation:
        "Your vehicles — ideally decorated for past weddings.",
      rangoli:
        "Finished pieces from past events — different styles and sizes.",
      "turban-tying":
        "Different turban styles tied on grooms and family.",
      "henna-entertainment":
        "Activity setups, guests engaged, the vibe of your booth.",
      "coffee-chai":
        "Your cart, drinks being served, signage.",
    },
  },
  {
    id: "headshot_or_logo",
    type: "file",
    label: "A headshot or logo",
    maxFiles: 1,
    maxFileSize: 10,
    acceptedTypes: ["image/"],
    helpText: "Optional — helps us put a face or brand to your work.",
  },
  {
    id: "feature_quote",
    type: "textarea",
    label: "One quote about your craft — something we can feature",
    maxLength: 150,
    placeholder:
      "e.g., 'Every wedding has a moment nobody planned for — that's the one I live to capture.'",
  },
  {
    id: "planners_worked_with",
    type: "textarea",
    label: "Planners you've worked with",
    maxLength: 500,
    placeholder:
      "Names of wedding planners or coordinators you've collaborated with — helps couples see your network.",
  },
  {
    id: "anything_else",
    type: "textarea",
    label: "Anything else couples should know?",
    maxLength: 300,
  },
  {
    id: "permission_feature",
    type: "checkbox",
    label:
      "I give The Marigold permission to feature my work with credit",
    required: true,
  },
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const VENDOR_CATEGORIES: VendorCategory[] = [
  // Creative
  { id: "photographer", label: "Photographer", group: "Creative", estimatedMinutes: 4 },
  { id: "videographer", label: "Videographer", group: "Creative", estimatedMinutes: 4 },
  { id: "choreographer", label: "Choreographer", group: "Creative", estimatedMinutes: 3 },

  // Design & Decor
  { id: "decorator-floral", label: "Decorator / Floral Designer", group: "Design & Decor", estimatedMinutes: 4 },
  { id: "florist", label: "Florist", group: "Design & Decor", estimatedMinutes: 3 },
  { id: "stationery", label: "Invitation / Stationery Designer", group: "Design & Decor", estimatedMinutes: 4 },
  { id: "lighting", label: "Lighting / AV / Production", group: "Design & Decor", estimatedMinutes: 3 },

  // Food & Drink
  { id: "caterer", label: "Caterer", group: "Food & Drink", estimatedMinutes: 5 },
  { id: "cake", label: "Cake / Desserts / Mithai", group: "Food & Drink", estimatedMinutes: 3 },
  { id: "bartender", label: "Bartender / Bar Service", group: "Food & Drink", estimatedMinutes: 3 },
  { id: "coffee-chai", label: "Coffee / Chai Cart", group: "Food & Drink", estimatedMinutes: 3 },

  // Beauty
  { id: "makeup-hair", label: "Makeup Artist / Hair Stylist", group: "Beauty", estimatedMinutes: 4 },
  { id: "mehndi", label: "Mehndi Artist", group: "Beauty", estimatedMinutes: 3 },
  { id: "jeweler", label: "Jeweler / Accessories", group: "Beauty", estimatedMinutes: 3 },

  // Fashion
  { id: "outfit", label: "Outfit Designer / Boutique", group: "Fashion", estimatedMinutes: 3 },
  { id: "turban-tying", label: "Turban / Safa Tying", group: "Fashion", estimatedMinutes: 3 },

  // Planning
  { id: "wedding-planner", label: "Wedding Planner / Coordinator", group: "Planning", estimatedMinutes: 5 },

  // Ceremony
  { id: "pandit", label: "Pandit / Officiant", group: "Ceremony", estimatedMinutes: 4 },
  { id: "puja-supplies", label: "Pandit Supplies / Puja Items", group: "Ceremony", estimatedMinutes: 3 },

  // Entertainment
  { id: "dj", label: "DJ / Music / Entertainment", group: "Entertainment", estimatedMinutes: 4 },
  { id: "photo-booth", label: "Photo Booth", group: "Entertainment", estimatedMinutes: 3 },
  { id: "fireworks", label: "Fireworks / Special Effects", group: "Entertainment", estimatedMinutes: 3 },
  { id: "henna-entertainment", label: "Henna Party / Event Entertainment", group: "Entertainment", estimatedMinutes: 3 },

  // Transport
  { id: "transportation", label: "Transportation", group: "Transport", estimatedMinutes: 3 },
  { id: "horse-baraat", label: "Horse / Carriage for Baraat", group: "Transport", estimatedMinutes: 3 },

  // Art
  { id: "rangoli", label: "Rangoli / Kolam Artist", group: "Art", estimatedMinutes: 3 },

  // Other (free-text fallback)
  { id: "other", label: "My category isn't listed", group: "Other", estimatedMinutes: 3 },
];

// ---------------------------------------------------------------------------
// Reusable option lists (per category)
// ---------------------------------------------------------------------------

const MULTI_DAY_PHOTO = [
  "Yes — I typically cover 2-3 days",
  "Yes — for an additional day rate",
  "I only cover single-day events",
];

const TRAVEL_MUA = [
  "Yes — within my city",
  "Yes — I travel for destination weddings",
  "No — clients come to my studio",
];

// ---------------------------------------------------------------------------
// Micro-categories (shown when the vendor picks "My category isn't listed")
// ---------------------------------------------------------------------------

/**
 * Sentinel option appended to the niche dropdown. Selecting it reveals
 * the free-text "Still not here? Tell us what you do" field via showIf.
 */
export const NICHE_OTHER_SENTINEL = "Still not here — let me describe my craft";

export interface MicroCategoryGroup {
  group: string;
  options: string[];
}

export const MICRO_CATEGORIES: MicroCategoryGroup[] = [
  {
    group: "Food & Beverage Carts",
    options: [
      "Boba/Bubble Tea Cart",
      "Ice Cream Cart",
      "Gelato Cart",
      "Paan Station",
      "Juice/Smoothie Bar",
      "Cotton Candy Cart",
      "Popcorn Cart",
      "Churro Cart",
      "Dosa Station",
      "Kulfi Cart",
      "Candy/Sweet Table Stylist",
      "Hot Chocolate/Coffee Cart",
      "Cocktail Cart/Mobile Bar",
      "Milkshake Bar",
      "Fruit Cart/Fruit Carving",
    ],
  },
  {
    group: "Live Entertainment",
    options: [
      "Mentalist/Mind Reader",
      "Magician",
      "Caricature Artist",
      "Silhouette Artist",
      "Stand-up Comedian",
      "Spoken Word/Poetry Performer",
      "Classical Musician (Sitar/Tabla/Flute)",
      "Qawwali Singer",
      "Bollywood Singer",
      "Ghazal Singer",
      "Sufi Band",
      "Jazz Band",
      "Acoustic Guitarist",
      "Harpist",
      "Saxophonist",
      "String Quartet",
      "Puppet Show/Kathputli",
      "Circus/Acrobatic Performer",
      "Fire Dancer",
      "Belly Dancer",
      "Kathak Dancer",
      "Bhangra Dance Troupe",
      "Folk Dance Troupe",
      "Flash Mob Organizer",
      "Anchor/Host/MC (not DJ)",
    ],
  },
  {
    group: "Arts & Personalization",
    options: [
      "Calligrapher/Hand Lettering Artist",
      "Live Wedding Painter",
      "Portrait Sketch Artist",
      "Embroidery Artist (custom patches/gifts)",
      "Ceramic/Pottery Artist (custom favors)",
      "Candle Maker (custom wedding candles)",
      "Perfume/Fragrance Bar",
      "Custom Illustration Artist",
      "Engraver (glass/metal/wood)",
      "Wax Seal Artist",
      "Paper/Origami Artist",
    ],
  },
  {
    group: "Wellness & Beauty",
    options: [
      "Astrologer/Jyotish",
      "Numerologist",
      "Yoga/Meditation Instructor (pre-wedding wellness)",
      "Spa/Massage Service (on-site)",
      "Ayurvedic Consultant",
      "Skincare Specialist (pre-wedding prep)",
      "Nail Artist",
      "Lash/Brow Artist",
      "Teeth Whitening Service",
      "Tanning/Bronzing Artist",
    ],
  },
  {
    group: "Photo & Memory",
    options: [
      "Polaroid/Instant Photo Booth",
      "Film Photographer",
      "Drone Pilot (separate from videographer)",
      "360 Photo/Video Booth",
      "Slow Motion Video Booth",
      "Flipbook Booth",
      "Guest Book Alternatives (fingerprint tree, audio guestbook, video messages)",
      "Scrapbook/Memory Album Creator",
      "Wedding Hashtag Creator",
    ],
  },
  {
    group: "Kids & Family",
    options: [
      "Kids Entertainment/Babysitting Service",
      "Face Painter",
      "Balloon Artist/Sculptor",
      "Character Performer (princesses, superheroes)",
      "Bouncy Castle/Inflatable Rental",
      "Gaming Lounge Setup (console/arcade)",
      "Activity/Craft Station for Kids",
    ],
  },
  {
    group: "Décor Specialties",
    options: [
      "Ice Sculptor",
      "Sand Sculptor",
      "Balloon Décor Artist",
      "Fabric/Draping Specialist",
      "Neon Sign Maker/Rental",
      "Marquee Letter Rental",
      "Prop Rental/Styling",
      "Tent/Shamiyana Provider",
      "Furniture Rental Specialist",
      "Carpet/Aisle Runner Specialist",
      "Ceiling Installation Artist",
      "Living Wall/Green Wall",
      "Lantern/Candle Specialist",
    ],
  },
  {
    group: "Logistics & Services",
    options: [
      "Wedding Insurance Provider",
      "Marriage Certificate/Legal Services",
      "Passport/Visa Services (for destination)",
      "Security/Bouncer Service",
      "Valet Parking Service",
      "Portable Restroom/Luxury Restroom Trailer",
      "Generator/Power Rental",
      "Waste Management/Cleanup Crew",
      "Pet Handler/Pet-Friendly Wedding Coordinator",
      "Accessibility Coordinator",
      "Weather Contingency Planner",
    ],
  },
  {
    group: "Fashion & Accessories",
    options: [
      "Dupatta/Chunni Draping Specialist",
      "Kaleera Maker",
      "Parandi Maker",
      "Custom Juttis/Mojari",
      "Groom Accessories (sehra, kalgi, mala)",
      "Bridal Clutch/Potli Designer",
      "Custom Wedding Sneakers/Shoes",
      "Embroidered Jacket/Cape Designer",
      "Wedding Perfume Creator",
    ],
  },
  {
    group: "Gifting & Favors",
    options: [
      "Return Gift/Favor Designer",
      "Trousseau Packer/Gift Wrapper",
      "Hamper/Gift Box Creator",
      "Custom Cookie/Chocolate Maker",
      "Seed Paper/Eco Favor Creator",
      "Personalized Wine/Champagne Labels",
      "Custom Bobblehead/Figurine Maker",
      "Digital Caricature for Favors",
    ],
  },
  {
    group: "Stationery & Print",
    options: [
      "Seating Chart Designer",
      "Menu Card Designer",
      "Custom Wedding Map/Illustrated Map",
      "Wedding Newspaper/Gazette Designer",
      "Photo Wall/Gallery Curator",
      "Timeline/Program Designer",
      "Custom Stamp Maker",
      "Welcome Bag Designer",
    ],
  },
  {
    group: "Travel & Experience",
    options: [
      "Honeymoon Planner",
      "Guest Travel Coordinator",
      "Group Tour Organizer",
      "Cultural Experience Guide (for non-Indian guests)",
      "Airport Pickup/Welcome Service",
      "Hotel Welcome Bag Service",
    ],
  },
];

// ---------------------------------------------------------------------------
// Category-specific fields
// ---------------------------------------------------------------------------

export const CATEGORY_FIELDS: Record<string, VendorField[]> = {
  photographer: [
    {
      id: "photo_style",
      type: "multi-select",
      label: "What's your shooting style?",
      required: true,
      options: [
        "Candid/Documentary",
        "Editorial/Fashion",
        "Traditional/Posed",
        "Fine Art",
        "Photojournalistic",
        "Cinematic",
        "Moody/Dark",
        "Bright/Airy",
      ],
    },
    {
      id: "photo_team_size",
      type: "select",
      label: "Do you shoot solo or with a team?",
      options: ["Solo", "With a second shooter", "Full team of 3+"],
    },
    {
      id: "photo_multi_day",
      type: "select",
      label: "Do you cover multi-day weddings?",
      required: true,
      options: MULTI_DAY_PHOTO,
    },
    {
      id: "photo_edit_count",
      type: "text",
      label: "How many edited photos do couples typically receive?",
      placeholder: "e.g., 500-800 per day",
    },
    {
      id: "photo_turnaround",
      type: "select",
      label: "Turnaround time for final gallery?",
      options: ["2-4 weeks", "4-8 weeks", "8-12 weeks", "12+ weeks"],
    },
    {
      id: "photo_pre_wedding",
      type: "select",
      label: "Do you do a pre-wedding / engagement shoot?",
      options: [
        "Included in my packages",
        "Available as an add-on",
        "I don't offer this",
      ],
    },
    {
      id: "photo_indian_experience",
      type: "select",
      label: "Are you comfortable shooting Indian ceremonies (pheras, rituals, etc.)?",
      required: true,
      options: [
        "Yes — I've shot many",
        "Yes — I have some experience",
        "I haven't but I'm eager to learn",
      ],
    },
    {
      id: "photo_video_partner",
      type: "select",
      label: "Do you also offer videography or partner with a videographer?",
      options: [
        "I do both",
        "I partner with a specific videographer",
        "Photo only",
      ],
    },
  ],

  videographer: [
    {
      id: "video_style",
      type: "multi-select",
      label: "What's your video style?",
      required: true,
      options: [
        "Cinematic/Film",
        "Documentary",
        "Traditional",
        "Highlight Reel",
        "Music Video Style",
        "Drone/Aerial",
      ],
    },
    {
      id: "video_deliverables",
      type: "multi-select",
      label: "What deliverables are included?",
      options: [
        "Full ceremony edit",
        "Highlight reel (3-5 min)",
        "Trailer (1-2 min)",
        "Full reception edit",
        "Full event raw footage",
        "Social media clips",
        "Drone footage",
      ],
    },
    {
      id: "video_multi_day",
      type: "select",
      label: "Do you cover multi-day weddings?",
      options: MULTI_DAY_PHOTO,
    },
    {
      id: "video_turnaround",
      type: "select",
      label: "Turnaround time?",
      options: ["4-8 weeks", "8-12 weeks", "12-16 weeks", "16+ weeks"],
    },
    {
      id: "video_team",
      type: "select",
      label: "Do you work with a team?",
      options: ["Solo", "Team of 2", "Team of 3+"],
    },
    {
      id: "video_indian_experience",
      type: "select",
      label: "Are you experienced with Indian wedding ceremonies?",
      required: true,
      options: [
        "Yes — I've shot many",
        "Yes — I have some experience",
        "I haven't but I'm eager to learn",
      ],
    },
    {
      id: "video_same_day_edit",
      type: "yesno",
      label: "Do you provide same-day edits for the reception?",
    },
    {
      id: "video_live_stream",
      type: "select",
      label: "Do you offer live streaming?",
      options: ["Yes — included", "Yes — as an add-on", "No"],
    },
  ],

  "decorator-floral": [
    {
      id: "decor_styles",
      type: "multi-select",
      label: "What styles do you specialize in?",
      required: true,
      options: [
        "Traditional Indian",
        "Modern/Contemporary",
        "Rustic/Bohemian",
        "Luxury/Opulent",
        "Minimalist",
        "Fusion",
        "Garden/Organic",
      ],
    },
    {
      id: "decor_mandap",
      type: "select",
      label: "Do you provide mandap design and setup?",
      required: true,
      options: [
        "Yes — it's my specialty",
        "Yes — as part of full décor packages",
        "I can but it's not my primary focus",
        "No",
      ],
    },
    {
      id: "decor_florals",
      type: "select",
      label: "Do you provide floral arrangements?",
      required: true,
      options: [
        "Yes — full floral design",
        "Yes — I work with a floral partner",
        "Décor only — no florals",
      ],
    },
    {
      id: "decor_multi_event",
      type: "select",
      label:
        "Do you handle multi-event décor (mehndi, sangeet, ceremony, reception)?",
      options: [
        "Yes — I do full multi-event transformations",
        "Yes — but each event is priced separately",
        "I typically do one event per wedding",
      ],
    },
    {
      id: "decor_supplement_existing",
      type: "yesno",
      label: "Can you work with a venue's existing décor and supplement?",
    },
    {
      id: "decor_rentals",
      type: "select",
      label: "Do you offer rentals (furniture, linens, lighting)?",
      options: [
        "Yes — full rental inventory",
        "Some items — I partner with rental companies for the rest",
        "No — décor design only",
      ],
    },
    {
      id: "decor_destination",
      type: "yesno",
      label: "Do you do destination weddings?",
    },
    {
      id: "decor_lead_time",
      type: "select",
      label: "Average lead time needed to book?",
      options: [
        "3-6 months",
        "6-9 months",
        "9-12 months",
        "12+ months",
      ],
    },
  ],

  caterer: [
    {
      id: "caterer_cuisines",
      type: "multi-select",
      label: "What cuisines do you specialize in?",
      required: true,
      options: [
        "North Indian/Punjabi",
        "South Indian",
        "Gujarati",
        "Bengali",
        "Rajasthani",
        "Mughlai",
        "Indo-Chinese",
        "Street Food/Chaat",
        "Pan-Asian",
        "Western/Continental",
        "Fusion",
        "Multiple Regional",
      ],
    },
    {
      id: "caterer_service_styles",
      type: "multi-select",
      label: "Service styles offered?",
      required: true,
      options: [
        "Buffet",
        "Plated/Sit-down",
        "Family style",
        "Live cooking stations",
        "Food trucks",
        "Cocktail/Passed appetizers",
        "Dessert bars",
      ],
    },
    {
      id: "caterer_dietary",
      type: "multi-select",
      label: "Can you accommodate dietary restrictions?",
      options: [
        "Fully vegetarian events",
        "Vegan options",
        "Jain food (no onion/garlic)",
        "Halal",
        "Gluten-free",
        "Nut-free",
        "We can accommodate most dietary needs",
      ],
    },
    {
      id: "caterer_tastings",
      type: "select",
      label: "Do you do tastings before booking?",
      required: true,
      options: [
        "Yes — complimentary",
        "Yes — with a fee that goes toward the booking",
        "No",
      ],
    },
    {
      id: "caterer_staff",
      type: "select",
      label: "Do you provide staff (servers, bartenders)?",
      options: [
        "Full service — staff included",
        "Available as add-on",
        "Food only — no staff",
      ],
    },
    {
      id: "caterer_venue_flexibility",
      type: "select",
      label: "Can you work at any venue or only specific locations?",
      options: [
        "Any venue with a kitchen",
        "Any venue — I bring my own setup",
        "I have a list of approved venues",
        "I only work from my own kitchen/restaurant",
      ],
    },
    {
      id: "caterer_per_plate",
      type: "text",
      label: "Per-plate price range for a full Indian meal?",
      placeholder: "e.g., ₹1,500-3,000 per plate",
    },
    {
      id: "caterer_bar",
      type: "select",
      label: "Do you offer bar/beverage service?",
      options: [
        "Full bar service",
        "Non-alcoholic beverages only",
        "Food only — no beverages",
      ],
    },
  ],

  "makeup-hair": [
    {
      id: "mua_services",
      type: "multi-select",
      label: "What services do you offer?",
      required: true,
      options: [
        "Bridal makeup",
        "Bridal hair",
        "Party/event makeup for family",
        "Mehndi/sangeet looks",
        "Engagement shoot makeup",
        "Airbrush makeup",
        "HD/film makeup",
        "Hair extensions/styling",
        "Draping assistance",
      ],
    },
    {
      id: "mua_travel",
      type: "select",
      label: "Do you travel to the venue?",
      required: true,
      options: TRAVEL_MUA,
    },
    {
      id: "mua_trial",
      type: "select",
      label: "Do you offer a bridal trial?",
      required: true,
      options: [
        "Yes — included in bridal package",
        "Yes — with a separate fee",
        "No",
      ],
    },
    {
      id: "mua_capacity",
      type: "select",
      label: "How many people can you do in one day?",
      options: [
        "Bride only",
        "Bride + 2-3 family members",
        "Bride + full bridal party (5+)",
        "I bring a team for large groups",
      ],
    },
    {
      id: "mua_touchups",
      type: "select",
      label: "Do you stay for touch-ups through the event?",
      options: [
        "Yes — full day",
        "Yes — through ceremony",
        "I leave after the look is complete",
      ],
    },
    {
      id: "mua_sa_experience",
      type: "select",
      label: "Are you experienced with South Asian bridal looks?",
      required: true,
      options: [
        "It's my specialty",
        "Yes — I have experience",
        "I'm newer to it but trained",
      ],
    },
    {
      id: "mua_brands",
      type: "text",
      label: "Do you work with specific product brands?",
      placeholder: "e.g., MAC, Charlotte Tilbury, Bobbi Brown",
    },
  ],

  mehndi: [
    {
      id: "mehndi_styles",
      type: "multi-select",
      label: "What styles do you specialize in?",
      required: true,
      options: [
        "Traditional Indian",
        "Arabic",
        "Indo-Arabic",
        "Modern/Contemporary",
        "Minimalist",
        "Portrait mehndi",
        "Rajasthani",
        "Marwari",
      ],
    },
    {
      id: "mehndi_capacity",
      type: "select",
      label: "How many guests can you accommodate?",
      options: [
        "Bride only",
        "Bride + 5-10 guests",
        "Bride + 10-25 guests",
        "Large parties of 25+",
        "I bring a team for any size",
      ],
    },
    {
      id: "mehndi_focus",
      type: "select",
      label: "Do you do bridal mehndi and guest mehndi?",
      options: ["Both", "Bridal only", "I focus on guest/party mehndi"],
    },
    {
      id: "mehndi_time",
      type: "select",
      label: "Typical time for full bridal mehndi (both hands and feet)?",
      options: [
        "2-3 hours",
        "3-4 hours",
        "4-6 hours",
        "Depends on design complexity",
      ],
    },
    {
      id: "mehndi_organic",
      type: "select",
      label: "Do you use organic/natural henna?",
      options: [
        "Yes — always organic",
        "I offer both organic and regular",
        "Regular henna",
      ],
    },
    {
      id: "mehndi_travel",
      type: "select",
      label: "Do you travel for events?",
      options: TRAVEL_MUA,
    },
    {
      id: "mehndi_trial",
      type: "select",
      label: "Do you offer a trial/consultation?",
      options: [
        "Yes — included",
        "Yes — separate fee",
        "No — but I share a portfolio for design selection",
      ],
    },
  ],

  dj: [
    {
      id: "dj_offerings",
      type: "multi-select",
      label: "What do you offer?",
      required: true,
      options: [
        "DJ services",
        "Dhol player",
        "Live band",
        "Bollywood/Bhangra DJ",
        "Sangeet music",
        "Emcee/MC services",
        "Sound system rental",
        "Lighting/dance floor",
        "Baarat music",
      ],
    },
    {
      id: "dj_genres",
      type: "multi-select",
      label: "What genres can you mix?",
      required: true,
      options: [
        "Bollywood",
        "Bhangra/Punjabi",
        "Hindi remixes",
        "Tamil/Telugu/South Indian",
        "Gujarati garba/raas",
        "Hip-hop",
        "Top 40/Pop",
        "EDM",
        "Classical/instrumental",
        "Sufi",
        "Qawwali",
      ],
    },
    {
      id: "dj_baraat",
      type: "select",
      label: "Do you do baarat procession music?",
      options: ["Yes — with dhol", "Yes — with full setup", "No"],
    },
    {
      id: "dj_sound_system",
      type: "select",
      label: "Do you provide your own sound system?",
      required: true,
      options: [
        "Yes — full PA system",
        "Yes — but depends on venue size",
        "No — I need venue to provide",
      ],
    },
    {
      id: "dj_sangeet",
      type: "select",
      label: "Have you done sangeet nights?",
      required: true,
      options: [
        "Yes — I specialize in sangeet entertainment",
        "Yes — it's part of my services",
        "I haven't yet",
      ],
    },
    {
      id: "dj_mc",
      type: "select",
      label: "Do you MC/emcee?",
      options: [
        "Yes — I DJ and MC",
        "I work with a separate MC",
        "DJ only",
      ],
    },
    {
      id: "dj_requests",
      type: "select",
      label: "Do you take song requests from guests?",
      options: [
        "Yes — I encourage it",
        "Limited — I stick mostly to the playlist",
        "No — I curate the full experience",
      ],
    },
    {
      id: "dj_backup",
      type: "yesno",
      label: "Do you carry backup equipment?",
    },
  ],

  "wedding-planner": [
    {
      id: "planner_service_level",
      type: "multi-select",
      label: "What level of service do you offer?",
      required: true,
      options: [
        "Full-service planning (start to finish)",
        "Partial planning",
        "Month-of coordination",
        "Day-of coordination",
        "Destination wedding planning",
        "Elopement planning",
      ],
    },
    {
      id: "planner_volume",
      type: "select",
      label: "How many weddings do you take per season?",
      options: ["1-5", "5-10", "10-20", "20+"],
    },
    {
      id: "planner_sa_experience",
      type: "select",
      label: "Do you have experience with South Asian weddings?",
      required: true,
      options: [
        "It's my specialty",
        "Yes — significant experience",
        "Some experience",
        "New to it but eager",
      ],
    },
    {
      id: "planner_vendor_list",
      type: "select",
      label: "Do you have a preferred vendor list?",
      options: [
        "Yes — I work with a curated network",
        "I have recommendations but you're free to choose",
        "No — I work with whoever you hire",
      ],
    },
    {
      id: "planner_multi_event",
      type: "select",
      label:
        "Do you handle multi-event coordination (mehndi, sangeet, ceremony, reception)?",
      required: true,
      options: [
        "Yes — I coordinate all events",
        "Yes — each event is a separate engagement",
        "I focus on ceremony and reception only",
      ],
    },
    {
      id: "planner_design_or_logistics",
      type: "select",
      label: "Do you help with design/aesthetics or logistics only?",
      options: [
        "Both — design vision and logistics",
        "Primarily logistics and coordination",
        "Primarily design and creative direction",
      ],
    },
    {
      id: "planner_on_site",
      type: "select",
      label: "Do you work on-site the day of?",
      required: true,
      options: [
        "Yes — full day from setup to send-off",
        "Yes — key hours only",
        "I work remotely and coordinate with an on-site team",
      ],
    },
    {
      id: "planner_communication",
      type: "select",
      label: "What's your communication style?",
      options: [
        "Very responsive — text/WhatsApp anytime",
        "Scheduled check-ins — weekly or biweekly",
        "Email-based with planned meetings",
      ],
    },
  ],

  stationery: [
    {
      id: "stationery_offerings",
      type: "multi-select",
      label: "What do you create?",
      required: true,
      options: [
        "Wedding invitations",
        "Save the dates",
        "RSVP cards",
        "Menu cards",
        "Programs",
        "Table numbers/place cards",
        "Welcome signs",
        "Digital/e-invitations",
        "Scrolls/traditional formats",
        "Box invitations",
      ],
    },
    {
      id: "stationery_styles",
      type: "multi-select",
      label: "What's your design style?",
      required: true,
      options: [
        "Traditional Indian",
        "Modern minimalist",
        "Watercolor/illustrated",
        "Calligraphy/hand-lettered",
        "Laser cut",
        "Acrylic/transparent",
        "Photo-based",
        "Luxury/metallic foil",
      ],
    },
    {
      id: "stationery_print",
      type: "select",
      label: "Do you offer printing or design only?",
      options: [
        "Full service — design and printing",
        "Design only — you print elsewhere",
        "Both options available",
      ],
    },
    {
      id: "stationery_languages",
      type: "select",
      label: "Can you do bilingual or multi-language invitations?",
      required: true,
      options: [
        "Yes — Hindi/English",
        "Yes — multiple Indian languages",
        "English only",
        "Discuss specific language needs",
      ],
    },
    {
      id: "stationery_turnaround",
      type: "select",
      label: "Turnaround time from design approval to delivery?",
      options: ["2-4 weeks", "4-6 weeks", "6-8 weeks", "8+ weeks"],
    },
    {
      id: "stationery_proof",
      type: "select",
      label: "Do you offer sample/proof before full printing?",
      options: [
        "Yes — digital proof included",
        "Yes — physical sample available",
        "Digital proof only",
      ],
    },
    {
      id: "stationery_custom_illustrations",
      type: "yesno",
      label: "Do you offer custom illustrated or portrait invitations?",
    },
  ],

  jeweler: [
    {
      id: "jeweler_offerings",
      type: "multi-select",
      label: "What do you offer?",
      required: true,
      options: [
        "Bridal jewelry sets",
        "Artificial/fashion jewelry",
        "Real gold/diamond jewelry",
        "Polki/Kundan",
        "Temple jewelry",
        "Hair accessories/maang tikka",
        "Kalire",
        "Men's accessories (safa, sherwani buttons)",
        "Rental jewelry",
      ],
    },
    {
      id: "jeweler_custom",
      type: "select",
      label: "Do you do custom/bespoke pieces?",
      options: [
        "Yes — fully custom",
        "I customize existing designs",
        "Ready-made collections only",
      ],
    },
    {
      id: "jeweler_rental",
      type: "select",
      label: "Do you offer rental jewelry?",
      options: ["Yes", "No — purchase only"],
    },
    {
      id: "jeweler_price_range",
      type: "text",
      label: "Price range for a full bridal set?",
      placeholder: "e.g., ₹15,000-50,000 or $500-2,000",
    },
    {
      id: "jeweler_try_on",
      type: "select",
      label: "Do you offer a try-on session?",
      options: [
        "Yes — at my studio",
        "Yes — I can come to you",
        "Virtual consultation only",
        "No",
      ],
    },
    {
      id: "jeweler_shipping",
      type: "select",
      label: "Do you ship or is it in-person only?",
      options: [
        "I ship nationwide",
        "Local pickup/delivery only",
        "Both",
      ],
    },
  ],

  pandit: [
    {
      id: "pandit_ceremonies",
      type: "multi-select",
      label: "What ceremonies do you perform?",
      required: true,
      options: [
        "Hindu wedding (all rituals)",
        "Sikh wedding (Anand Karaj)",
        "Interfaith ceremony",
        "Non-denominational",
        "Engagement ceremony (sagai/roka)",
        "Ganesh puja",
        "Haldi ceremony",
        "Other pre-wedding rituals",
      ],
    },
    {
      id: "pandit_languages",
      type: "multi-select",
      label: "What languages do you conduct ceremonies in?",
      required: true,
      options: [
        "Sanskrit with English explanations",
        "Hindi",
        "Gujarati",
        "Tamil",
        "Telugu",
        "Kannada",
        "Bengali",
        "Punjabi",
        "English only",
        "Bilingual — I adapt to the couple",
      ],
    },
    {
      id: "pandit_length",
      type: "select",
      label: "How long is your typical ceremony?",
      options: [
        "30-45 minutes",
        "45-60 minutes",
        "1-2 hours",
        "I customize based on the couple's preferences",
      ],
    },
    {
      id: "pandit_consultation",
      type: "select",
      label: "Do you do a pre-ceremony consultation to personalize the rituals?",
      required: true,
      options: [
        "Yes — I always meet the couple beforehand",
        "Phone/video consultation",
        "I follow traditional format",
      ],
    },
    {
      id: "pandit_modern",
      type: "select",
      label:
        "Are you comfortable with modern adaptations (shortened rituals, English explanations for non-Indian guests)?",
      required: true,
      options: [
        "Absolutely — I specialize in modern ceremonies",
        "Yes — I can adapt",
        "I prefer traditional format",
      ],
    },
    {
      id: "pandit_supplies",
      type: "select",
      label:
        "Do you bring your own supplies (sacred fire setup, materials for rituals)?",
      options: [
        "Yes — everything included",
        "Most items — couple provides a few things",
        "Couple provides all materials",
      ],
    },
    {
      id: "pandit_travel",
      type: "select",
      label: "Do you travel?",
      options: ["Yes — anywhere", "Within my city/region", "Within my state"],
    },
  ],

  outfit: [
    {
      id: "outfit_offerings",
      type: "multi-select",
      label: "What do you offer?",
      required: true,
      options: [
        "Bridal lehengas",
        "Groom sherwanis",
        "Bridesmaids outfits",
        "Family/guest outfits",
        "Custom/bespoke design",
        "Alterations",
        "Blouse stitching",
        "Draping services",
      ],
    },
    {
      id: "outfit_custom",
      type: "select",
      label: "Do you do custom designs?",
      options: [
        "Yes — fully bespoke",
        "I customize from my collection",
        "Ready-to-wear only",
      ],
    },
    {
      id: "outfit_lehenga_range",
      type: "text",
      label: "Price range for bridal lehenga?",
      placeholder: "e.g., ₹50,000-2,00,000",
    },
    {
      id: "outfit_lead_time",
      type: "select",
      label: "How far in advance should brides order?",
      options: [
        "2-3 months",
        "3-6 months",
        "6-9 months",
        "9-12 months",
        "12+ months",
      ],
    },
    {
      id: "outfit_shipping",
      type: "select",
      label: "Do you ship or require in-store visits?",
      options: [
        "Ship nationwide",
        "In-store only",
        "Both — but fittings are in-store",
      ],
    },
    {
      id: "outfit_styling",
      type: "yesno",
      label: "Do you offer styling consultation?",
    },
  ],

  bartender: [
    {
      id: "bartender_services",
      type: "multi-select",
      label: "What services do you offer?",
      required: true,
      options: [
        "Full bar service",
        "Beer and wine only",
        "Signature cocktail creation",
        "Non-alcoholic/mocktail bar",
        "Chai bar",
        "Lassi bar",
        "Paan station",
        "Hookah service",
      ],
    },
    {
      id: "bartender_alcohol_source",
      type: "select",
      label: "Do you provide the alcohol or does the client?",
      options: [
        "We provide everything",
        "Client provides alcohol — we provide mixers and service",
        "Either option",
      ],
    },
    {
      id: "bartender_staff",
      type: "select",
      label: "Staff included?",
      options: [
        "Yes — bartenders included",
        "Yes — full bar staff",
        "No — service setup only",
      ],
    },
    {
      id: "bartender_setup",
      type: "select",
      label: "Do you bring your own bar setup?",
      options: [
        "Yes — portable bar included",
        "I need the venue's bar",
        "Either works",
      ],
    },
    {
      id: "bartender_indian_cocktails",
      type: "select",
      label: "Can you create custom Indian-inspired cocktails?",
      options: [
        "Yes — it's my specialty",
        "Yes — I can work with you on that",
        "Standard cocktail menu only",
      ],
    },
    {
      id: "bartender_insurance",
      type: "yesno",
      label: "Do you have liability insurance?",
    },
  ],

  florist: [
    {
      id: "florist_specialties",
      type: "multi-select",
      label: "What do you specialize in?",
      required: true,
      options: [
        "Bridal bouquet",
        "Ceremony florals (mandap, aisle)",
        "Reception centerpieces",
        "Garlands (varmala/jaimala)",
        "Hair flowers",
        "Car decoration",
        "Stage decoration",
        "Flower walls/backdrops",
        "Loose flower petals/rangoli",
      ],
    },
    {
      id: "florist_fresh_or_artificial",
      type: "select",
      label: "Do you work with fresh, artificial, or both?",
      options: [
        "Fresh flowers only",
        "Artificial/silk flowers",
        "Both",
      ],
    },
    {
      id: "florist_indian_flowers",
      type: "select",
      label:
        "Can you source Indian flowers (marigolds, jasmine, tuberose, roses)?",
      required: true,
      options: [
        "Yes — always in my inventory",
        "Yes — with advance notice",
        "Limited availability",
      ],
    },
    {
      id: "florist_setup_teardown",
      type: "select",
      label: "Do you do setup and teardown?",
      options: [
        "Full setup and teardown",
        "Setup only — teardown is client's responsibility",
        "Design and delivery — no on-site setup",
      ],
    },
    {
      id: "florist_minimum",
      type: "text",
      label: "Minimum order value?",
      placeholder: "e.g., ₹25,000 or $500",
    },
  ],

  choreographer: [
    {
      id: "choreographer_styles",
      type: "multi-select",
      label: "What styles do you teach?",
      required: true,
      options: [
        "Bollywood",
        "Classical (Bharatanatyam, Kathak, etc.)",
        "Bhangra",
        "Contemporary/freestyle",
        "Couple's first dance",
        "Family group choreography",
        "Flash mob",
        "Mix/mashup",
      ],
    },
    {
      id: "choreographer_session_format",
      type: "select",
      label: "How do sessions work?",
      options: [
        "In-person at my studio",
        "I come to you",
        "Virtual/video call sessions",
        "Combination",
      ],
    },
    {
      id: "choreographer_session_count",
      type: "select",
      label: "How many sessions does a typical sangeet number need?",
      options: [
        "3-5 sessions",
        "5-8 sessions",
        "8-12 sessions",
        "Depends on complexity",
      ],
    },
    {
      id: "choreographer_groups",
      type: "select",
      label: "Can you choreograph for large groups (10+ people)?",
      required: true,
      options: [
        "Yes — I love big group numbers",
        "Up to 10-12 people",
        "I focus on smaller groups or couples",
        "I can bring assistant choreographers for large groups",
      ],
    },
    {
      id: "choreographer_song",
      type: "select",
      label: "Do you help with song selection and editing?",
      options: [
        "Yes — included",
        "I can advise but you handle the edit",
        "No — bring your song ready",
      ],
    },
    {
      id: "choreographer_lead_time",
      type: "select",
      label: "How far in advance should we start?",
      options: [
        "4-6 weeks",
        "6-8 weeks",
        "2-3 months",
        "3+ months",
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // Specialty / shorter categories (3-4 questions each)
  // ---------------------------------------------------------------------------

  "henna-entertainment": [
    {
      id: "henna_ent_activities",
      type: "multi-select",
      label: "What activities do you offer?",
      required: true,
      options: [
        "Mehndi-themed games",
        "Bridal shower games",
        "Trivia/couple games",
        "Live entertainment performers",
        "Photobooth-style activities",
        "Caricature artist",
        "Tarot/astrology reader",
        "DIY craft station",
      ],
    },
    {
      id: "henna_ent_capacity",
      type: "select",
      label: "Group size you can accommodate?",
      options: [
        "Up to 25 guests",
        "25-50 guests",
        "50-100 guests",
        "100+ guests",
      ],
    },
    {
      id: "henna_ent_setup",
      type: "yesno",
      label: "Do you bring your own setup?",
    },
  ],

  "coffee-chai": [
    {
      id: "coffee_chai_serves",
      type: "multi-select",
      label: "What do you serve?",
      required: true,
      options: [
        "Espresso drinks",
        "Chai service",
        "Both",
        "Other specialty beverages",
      ],
    },
    {
      id: "coffee_chai_setup",
      type: "yesno",
      label: "Do you bring your own cart/equipment?",
    },
    {
      id: "coffee_chai_throughput",
      type: "select",
      label: "How many guests can you serve per hour?",
      options: ["Up to 50", "50-100", "100-200", "200+"],
    },
    {
      id: "coffee_chai_indoor_outdoor",
      type: "select",
      label: "Indoor or outdoor?",
      options: ["Indoor only", "Outdoor only", "Both"],
    },
  ],

  "photo-booth": [
    {
      id: "photo_booth_type",
      type: "select",
      label: "Type of booth?",
      required: true,
      options: [
        "Open air",
        "Enclosed",
        "360 video",
        "Mirror booth",
        "GIF booth",
        "Roaming",
      ],
    },
    {
      id: "photo_booth_props",
      type: "yesno",
      label: "Props included?",
    },
    {
      id: "photo_booth_outputs",
      type: "select",
      label: "Digital + print options?",
      options: [
        "Digital + unlimited prints",
        "Digital only",
        "Prints only",
        "Bride/groom can choose",
      ],
    },
    {
      id: "photo_booth_custom",
      type: "yesno",
      label: "Do you offer custom backdrops/overlays?",
    },
  ],

  fireworks: [
    {
      id: "fireworks_effects",
      type: "multi-select",
      label: "What effects?",
      required: true,
      options: [
        "Cold sparklers",
        "Fireworks",
        "Fog/haze",
        "Confetti cannons",
        "CO2 jets",
        "Sparkler send-off",
      ],
    },
    {
      id: "fireworks_indoor_outdoor",
      type: "select",
      label: "Indoor, outdoor, or both?",
      options: ["Indoor", "Outdoor", "Both"],
    },
    {
      id: "fireworks_permits",
      type: "yesno",
      label: "Do you handle permits?",
    },
    {
      id: "fireworks_insurance",
      type: "yesno",
      label: "Insurance?",
    },
  ],

  "horse-baraat": [
    {
      id: "horse_baraat_offering",
      type: "select",
      label: "What do you provide?",
      required: true,
      options: [
        "Horse only",
        "Horse with decoration",
        "Horse-drawn carriage",
        "Horse + handler/guide",
      ],
    },
    {
      id: "horse_baraat_decoration",
      type: "yesno",
      label: "Do you provide the horse decoration (ghodi)?",
    },
    {
      id: "horse_baraat_handler",
      type: "yesno",
      label: "Is the handler experienced with loud music/crowds?",
    },
    {
      id: "horse_baraat_radius",
      type: "text",
      label: "Travel radius?",
      placeholder: "e.g., 100 km from city center",
    },
  ],

  "puja-supplies": [
    {
      id: "puja_supplies_items",
      type: "multi-select",
      label: "What do you provide?",
      required: true,
      options: [
        "Havan kund and samagri",
        "Mandap/altar setup",
        "Garlands and flowers",
        "Brass utensils",
        "Coconuts and fruits",
        "Sacred threads (mauli)",
        "Ghee, camphor, incense",
        "Custom puja boxes",
        "Kalash setup",
        "Mantra books/printed materials",
      ],
    },
    {
      id: "puja_supplies_delivery",
      type: "select",
      label: "Delivery or pickup?",
      options: [
        "Delivery included",
        "Pickup only",
        "Either available",
      ],
    },
    {
      id: "puja_supplies_custom",
      type: "yesno",
      label: "Custom packages available?",
    },
  ],

  cake: [
    {
      id: "cake_offerings",
      type: "multi-select",
      label: "What do you offer?",
      required: true,
      options: [
        "Wedding cake",
        "Cupcakes",
        "Dessert table",
        "Indian mithai",
        "Chocolate/truffles",
        "Custom cookies",
        "Dessert bar",
      ],
    },
    {
      id: "cake_dietary",
      type: "multi-select",
      label: "Do you accommodate dietary needs?",
      options: [
        "Eggless",
        "Vegan",
        "Sugar-free",
        "Gluten-free",
        "Nut-free",
      ],
    },
    {
      id: "cake_tastings",
      type: "select",
      label: "Do you offer tastings?",
      options: [
        "Yes — complimentary",
        "Yes — with a fee",
        "No",
      ],
    },
    {
      id: "cake_delivery_setup",
      type: "select",
      label: "Delivery and setup included?",
      options: [
        "Yes — delivery and setup included",
        "Delivery only — setup separate",
        "Pickup only",
      ],
    },
  ],

  lighting: [
    {
      id: "lighting_services",
      type: "multi-select",
      label: "Services?",
      required: true,
      options: [
        "Uplighting",
        "String/fairy lights",
        "Gobos/monograms",
        "LED walls",
        "Projector/screen",
        "Stage lighting",
        "Dance floor lighting",
        "Fog/haze machines",
        "Pin spots",
      ],
    },
    {
      id: "lighting_sound",
      type: "select",
      label: "Do you provide sound/PA?",
      options: [
        "Yes — full sound and lighting",
        "Lighting only",
        "Sound only — no lighting",
      ],
    },
    {
      id: "lighting_setup",
      type: "yesno",
      label: "Do you handle setup and teardown?",
    },
    {
      id: "lighting_venue_partners",
      type: "text",
      label: "Do you work with specific venues regularly?",
      placeholder: "e.g., Taj Lake Palace, ITC Grand, Leela Mumbai",
    },
  ],

  transportation: [
    {
      id: "transportation_offerings",
      type: "multi-select",
      label: "What?",
      required: true,
      options: [
        "Vintage car",
        "Luxury sedan",
        "Party bus",
        "Shuttle service",
        "Limo",
        "Horse carriage",
        "Rickshaw/tuk-tuk",
      ],
    },
    {
      id: "transportation_fleet",
      type: "select",
      label: "Fleet size?",
      options: ["1-3 vehicles", "4-10 vehicles", "10+ vehicles"],
    },
    {
      id: "transportation_decoration",
      type: "select",
      label: "Decoration included?",
      options: [
        "Yes — included",
        "Available as add-on",
        "Couple arranges separately",
      ],
    },
  ],

  rangoli: [
    {
      id: "rangoli_styles",
      type: "multi-select",
      label: "Styles?",
      required: true,
      options: [
        "Traditional Rangoli",
        "Kolam",
        "Sand art",
        "Flower rangoli",
        "Acrylic/painted",
      ],
    },
    {
      id: "rangoli_size",
      type: "select",
      label: "Size range?",
      options: [
        "Up to 4 ft",
        "4-8 ft",
        "8-15 ft",
        "Custom large-scale",
      ],
    },
    {
      id: "rangoli_lead_time",
      type: "select",
      label: "How far in advance?",
      options: [
        "Same week",
        "1-2 weeks",
        "2-4 weeks",
        "1+ month",
      ],
    },
    {
      id: "rangoli_on_site",
      type: "yesno",
      label: "Do you work on-site?",
    },
  ],

  "turban-tying": [
    {
      id: "turban_travel",
      type: "yesno",
      label: "Do you travel to venue?",
    },
    {
      id: "turban_capacity",
      type: "select",
      label: "How many turbans can you tie?",
      options: [
        "Groom only",
        "Groom + immediate family (5-10)",
        "Whole baraat (20+)",
        "Any size — I bring a team",
      ],
    },
    {
      id: "turban_fabric",
      type: "select",
      label: "Do you provide the fabric/safa?",
      options: [
        "Yes — included",
        "Client provides",
        "Both options",
      ],
    },
    {
      id: "turban_styles",
      type: "multi-select",
      label: "Styles?",
      required: true,
      options: [
        "Rajasthani",
        "Marwari",
        "Sikh",
        "Modern",
        "Multiple styles",
      ],
    },
  ],

  // The "other" category opens a second searchable dropdown — vendors
  // pick a niche from MICRO_CATEGORIES (or fall through to a free-text
  // field) and answer one universal description prompt. The universal
  // closing fields render after this section, so 80+ micro-categories
  // share the same closing flow without category-specific questions.
  other: [
    {
      id: "niche",
      type: "select",
      label: "Find your niche",
      required: true,
      helpText: "Pick the closest match — type to search the full list.",
    },
    {
      id: "niche_other",
      type: "text",
      label: "Still not here? Tell us what you do",
      required: true,
      placeholder: "e.g., Drone-mounted confetti drops",
      showIf: { fieldId: "niche", equals: [NICHE_OTHER_SENTINEL] },
    },
    {
      id: "niche_description",
      type: "textarea",
      label:
        "Describe your service in 2–3 sentences — what do you offer and what makes you unique?",
      required: true,
      maxLength: 300,
      placeholder:
        "What you offer, and what sets you apart from anyone else doing similar work.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getCategoryById(id: string): VendorCategory | undefined {
  return VENDOR_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryByLabel(label: string): VendorCategory | undefined {
  return VENDOR_CATEGORIES.find((c) => c.label === label);
}

export function getFieldsForCategory(categoryId: string): VendorField[] {
  return CATEGORY_FIELDS[categoryId] ?? [];
}

export function getAllVendorFields(): VendorField[] {
  const seen = new Set<string>();
  const all: VendorField[] = [];
  const push = (f: VendorField) => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    all.push(f);
  };
  UNIVERSAL_OPENING_FIELDS.forEach(push);
  Object.values(CATEGORY_FIELDS).forEach((fields) => fields.forEach(push));
  UNIVERSAL_CLOSING_FIELDS.forEach(push);
  return all;
}

export function getVendorFieldById(id: string): VendorField | undefined {
  return getAllVendorFields().find((f) => f.id === id);
}

/**
 * Group categories by their `group` for the dropdown UI. Preserves the
 * declared order of VENDOR_CATEGORIES inside each group.
 */
export function groupedVendorCategories(): {
  group: VendorCategoryGroup;
  categories: VendorCategory[];
}[] {
  const order: VendorCategoryGroup[] = [
    "Creative",
    "Design & Decor",
    "Food & Drink",
    "Beauty",
    "Fashion",
    "Planning",
    "Ceremony",
    "Entertainment",
    "Transport",
    "Art",
    "Other",
  ];
  return order.map((group) => ({
    group,
    categories: VENDOR_CATEGORIES.filter((c) => c.group === group),
  }));
}
