import { CTABar } from "@/components/brand/CTABar";

export type BudgetCategoryColor =
  | "pink"
  | "wine"
  | "gold"
  | "hot-pink"
  | "blush"
  | "lavender"
  | "mint"
  | "mauve"
  | "deep-pink"
  | "peach"
  | "sky";

export interface BudgetCategory {
  name: string;
  percentage: number;
  color: BudgetCategoryColor;
}

export interface BudgetPiePostProps {
  budgetTotal?: string;
  categories?: BudgetCategory[];
  annotation?: string;
}

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { name: "Venue", percentage: 30, color: "pink" },
  { name: "Catering", percentage: 25, color: "wine" },
  { name: "Decor", percentage: 15, color: "gold" },
  { name: "Photography", percentage: 10, color: "hot-pink" },
  { name: "Outfits", percentage: 8, color: "blush" },
  { name: "Music/Entertainment", percentage: 5, color: "lavender" },
  { name: "Invitations", percentage: 3, color: "mint" },
  { name: "Miscellaneous", percentage: 4, color: "mauve" },
];

const COLOR_VAR: Record<BudgetCategoryColor, string> = {
  pink: "var(--pink)",
  wine: "var(--wine)",
  gold: "var(--gold)",
  "hot-pink": "var(--hot-pink)",
  blush: "var(--blush)",
  lavender: "var(--lavender)",
  mint: "var(--mint)",
  mauve: "var(--mauve)",
  "deep-pink": "var(--deep-pink)",
  peach: "var(--peach)",
  sky: "var(--sky)",
};

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
) {
  const a = polar(cx, cy, rOuter, startAngle);
  const b = polar(cx, cy, rOuter, endAngle);
  const c = polar(cx, cy, rInner, endAngle);
  const d = polar(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${a.x} ${a.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${d.x} ${d.y}`,
    "Z",
  ].join(" ");
}

export function BudgetPiePost({
  budgetTotal = "Based on a ₹30 lakh wedding",
  categories,
  annotation = "your numbers will vary. your aunty's opinions won't.",
}: BudgetPiePostProps) {
  const items = (categories && categories.length > 0
    ? categories
    : DEFAULT_CATEGORIES
  ).filter((c) => c.percentage > 0);

  const total = items.reduce((sum, c) => sum + c.percentage, 0) || 100;
  const cx = 300;
  const cy = 300;
  const rOuter = 230;
  const rInner = 128;
  const labelR = 280;

  let cursor = -Math.PI / 2;
  const slices = items.map((cat) => {
    const sweep = (cat.percentage / total) * Math.PI * 2;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    const mid = (start + end) / 2;
    const labelPos = polar(cx, cy, labelR, mid);
    return { cat, start, end, mid, labelPos };
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "90px 70px 140px",
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginBottom: 6,
        }}
      >
        Budget Breakdown
      </div>
      <div
        style={{
          width: 80,
          height: 2,
          background: "var(--gold)",
          marginBottom: 14,
        }}
      />

      <div
        style={{
          position: "relative",
          width: 600,
          height: 600,
          marginBottom: 8,
        }}
      >
        <svg
          viewBox="0 0 600 600"
          width={600}
          height={600}
          style={{ overflow: "visible" }}
        >
          {slices.map(({ cat, start, end }) => (
            <path
              key={cat.name}
              d={donutSlicePath(cx, cy, rOuter, rInner, start, end)}
              fill={COLOR_VAR[cat.color]}
              stroke="var(--cream)"
              strokeWidth={3}
              strokeLinejoin="round"
            />
          ))}

          {slices.map(({ cat, mid, labelPos }) => {
            const anchor: "start" | "middle" | "end" =
              labelPos.x > cx + 12
                ? "start"
                : labelPos.x < cx - 12
                  ? "end"
                  : "middle";
            const lineEnd = polar(cx, cy, rOuter + 12, mid);
            const lineMid = polar(cx, cy, labelR - 6, mid);
            return (
              <g key={`${cat.name}-label`}>
                <line
                  x1={lineEnd.x}
                  y1={lineEnd.y}
                  x2={lineMid.x}
                  y2={lineMid.y}
                  stroke="var(--wine)"
                  strokeWidth={1.2}
                  opacity={0.45}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y - 4}
                  textAnchor={anchor}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontSize={18}
                  fontWeight={600}
                  fill="var(--wine)"
                  letterSpacing={0.5}
                >
                  {cat.name.toUpperCase()}
                </text>
                <text
                  x={labelPos.x}
                  y={labelPos.y + 18}
                  textAnchor={anchor}
                  fontFamily="'Instrument Serif', serif"
                  fontStyle="italic"
                  fontSize={26}
                  fill="var(--deep-pink)"
                >
                  {cat.percentage}%
                </text>
              </g>
            );
          })}

          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontFamily="'Syne', sans-serif"
            fontSize={14}
            fontWeight={700}
            letterSpacing={3}
            fill="var(--wine)"
            opacity={0.55}
          >
            WHERE IT GOES
          </text>
          <text
            x={cx}
            y={cy + 22}
            textAnchor="middle"
            fontFamily="'Instrument Serif', serif"
            fontStyle="italic"
            fontSize={42}
            fill="var(--wine)"
          >
            ₹100
          </text>
          <text
            x={cx}
            y={cy + 46}
            textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
            fontSize={13}
            letterSpacing={2}
            fill="var(--mauve)"
          >
            OF EVERY 100
          </text>
        </svg>
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 42,
          color: "var(--wine)",
          textAlign: "center",
          marginTop: 4,
          maxWidth: 880,
        }}
      >
        {budgetTotal}
      </div>

      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: "var(--pink)",
          transform: "rotate(-2deg)",
          textAlign: "center",
          marginTop: 14,
          maxWidth: 760,
          lineHeight: 1.1,
        }}
      >
        {annotation}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
