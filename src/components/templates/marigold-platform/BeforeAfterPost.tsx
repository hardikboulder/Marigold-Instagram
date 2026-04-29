import { CTABar } from "@/components/brand/CTABar";

export interface BeforeAfterPostProps {
  beforeItems: string[];
  afterItems: string[];
}

const BEFORE_FONT_POOL = [
  "'Caveat', cursive",
  "'Space Grotesk', sans-serif",
  "'Syne', sans-serif",
  "'Instrument Serif', serif",
];

function MessyChip({
  text,
  index,
  total,
}: {
  text: string;
  index: number;
  total: number;
}) {
  const angle = ((index * 137) % 30) - 15;
  const top = 120 + (index * 92) % 580;
  const left = 30 + ((index * 53) % 220);
  const fontFamily = BEFORE_FONT_POOL[index % BEFORE_FONT_POOL.length];
  const isHandwritten = fontFamily === "'Caveat', cursive";
  const isSerif = fontFamily === "'Instrument Serif', serif";
  const colors = ["var(--blush)", "var(--peach)", "var(--gold-light)", "var(--cream)", "var(--lavender)"];
  const bg = colors[index % colors.length];
  const fontSize = isHandwritten ? 32 : isSerif ? 24 : 18;
  const totalScale = total > 0 ? Math.min(1, 6 / total) : 1;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        transform: `rotate(${angle}deg) scale(${0.85 + totalScale * 0.15})`,
        background: bg,
        color: "var(--wine)",
        padding: isHandwritten ? "6px 14px" : "10px 16px",
        fontFamily,
        fontSize,
        fontStyle: isSerif ? "italic" : undefined,
        fontWeight: isHandwritten || isSerif ? 400 : 600,
        boxShadow: "3px 3px 0 rgba(75,21,40,0.15)",
        border: "1.5px solid rgba(75,21,40,0.2)",
        maxWidth: 220,
        textAlign: "center",
        zIndex: 10 - (index % 5),
      }}
    >
      {text}
    </div>
  );
}

function CleanRow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 22,
        fontWeight: 500,
        color: "var(--wine)",
        background: "white",
        padding: "12px 16px",
        borderLeft: "3px solid var(--gold)",
        boxShadow: "0 2px 8px rgba(75,21,40,0.06)",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
        <circle cx="11" cy="11" r="10" fill="var(--gold)" />
        <path
          d="M6.5 11.5L9.5 14.5L15.5 8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>{text}</div>
    </div>
  );
}

function MessyDoodleSpreadsheet() {
  return (
    <svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      style={{ position: "absolute", top: 50, right: 60, transform: "rotate(8deg)", opacity: 0.6 }}
    >
      <rect x="2" y="2" width="116" height="76" fill="white" stroke="var(--wine)" strokeWidth="2" />
      <line x1="2" y1="22" x2="118" y2="22" stroke="var(--wine)" strokeWidth="1.5" />
      <line x1="2" y1="42" x2="118" y2="42" stroke="var(--wine)" strokeWidth="1" />
      <line x1="2" y1="62" x2="118" y2="62" stroke="var(--wine)" strokeWidth="1" />
      <line x1="40" y1="2" x2="40" y2="78" stroke="var(--wine)" strokeWidth="1" />
      <line x1="80" y1="2" x2="80" y2="78" stroke="var(--wine)" strokeWidth="1" />
    </svg>
  );
}

function MessyDoodleWhatsApp() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 40,
        width: 70,
        height: 70,
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(-12deg)",
        opacity: 0.55,
        boxShadow: "3px 4px 0 rgba(75,21,40,0.15)",
      }}
    >
      <div style={{ fontSize: 36 }}>💬</div>
    </div>
  );
}

function CleanDashboardMock() {
  return (
    <div
      style={{
        background: "white",
        border: "2px solid var(--wine)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 4px 12px rgba(75,21,40,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--hot-pink)" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mint)" }} />
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "var(--wine)",
          marginBottom: 8,
        }}
      >
        The Marigold
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, height: 8, background: "var(--gold)", borderRadius: 4 }} />
        <div style={{ flex: 1, height: 8, background: "var(--blush)", borderRadius: 4 }} />
        <div style={{ flex: 1, height: 8, background: "var(--mint)", borderRadius: 4 }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1, height: 6, background: "var(--lavender)", borderRadius: 3 }} />
        <div style={{ flex: 2, height: 6, background: "var(--peach)", borderRadius: 3 }} />
      </div>
    </div>
  );
}

export function BeforeAfterPost({ beforeItems, afterItems }: BeforeAfterPostProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: "var(--cream)",
      }}
    >
      <div
        style={{
          width: "50%",
          height: "100%",
          background: "var(--cream)",
          position: "relative",
          overflow: "hidden",
          padding: 40,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 40,
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "var(--wine)",
            transform: "rotate(-4deg)",
            zIndex: 20,
            background: "var(--gold-light)",
            padding: "10px 16px",
            border: "2px dashed var(--wine)",
          }}
        >
          Before The Marigold
        </div>

        <MessyDoodleSpreadsheet />
        <MessyDoodleWhatsApp />

        {beforeItems.map((item, i) => (
          <MessyChip key={i} text={item} index={i} total={beforeItems.length} />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 100,
          width: 4,
          background:
            "linear-gradient(to bottom, transparent 0%, var(--gold) 15%, var(--gold) 85%, transparent 100%)",
          transform: "translateX(-50%)",
          zIndex: 30,
        }}
      />

      <div
        style={{
          width: "50%",
          height: "100%",
          background: "var(--blush)",
          position: "relative",
          padding: "70px 40px 120px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 4,
            color: "var(--deep-pink)",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          After The Marigold
        </div>

        <CleanDashboardMock />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {afterItems.slice(0, 6).map((item, i) => (
            <CleanRow key={i} text={item} />
          ))}
        </div>
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
