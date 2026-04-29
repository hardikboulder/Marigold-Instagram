import { CTABar } from "@/components/brand/CTABar";

export interface DosAndDontsPostProps {
  vendorCategory: string;
  dos: string[];
  donts: string[];
  bottomNote?: string;
}

function CheckIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <circle cx="16" cy="16" r="14" fill="rgba(200,237,218,0.4)" />
      <path
        d="M9 16.5 L14 21 L23 11"
        fill="none"
        stroke="#2E7D5B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <circle cx="16" cy="16" r="14" fill="rgba(237,147,177,0.35)" />
      <path
        d="M11 11 L21 21 M21 11 L11 21"
        fill="none"
        stroke="var(--deep-pink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DosAndDontsPost({
  vendorCategory,
  dos,
  donts,
  bottomNote,
}: DosAndDontsPostProps) {
  const validDos = (dos || []).filter((d) => d && d.trim()).slice(0, 4);
  const validDonts = (donts || []).filter((d) => d && d.trim()).slice(0, 4);

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
        padding: "70px 60px 140px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 36,
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 44,
            color: "var(--wine)",
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {vendorCategory}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--deep-pink)",
            lineHeight: 1,
          }}
        >
          Do&rsquo;s &amp; Don&rsquo;ts
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <Column
          header="Do"
          headerBg="var(--mint)"
          headerColor="#2E7D5B"
          items={validDos}
          icon={<CheckIcon />}
        />
        <Column
          header="Don't"
          headerBg="var(--blush)"
          headerColor="var(--deep-pink)"
          items={validDonts}
          icon={<XIcon />}
        />
      </div>

      {bottomNote && bottomNote.trim() && (
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 38,
            color: "var(--mauve)",
            textAlign: "center",
            transform: "rotate(-1deg)",
            marginTop: 28,
            marginBottom: 8,
          }}
        >
          {bottomNote}
        </div>
      )}

      <CTABar variant="overlay" />
    </div>
  );
}

function Column({
  header,
  headerBg,
  headerColor,
  items,
  icon,
}: {
  header: string;
  headerBg: string;
  headerColor: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          background: headerBg,
          borderRadius: 12,
          padding: "14px 20px",
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: headerColor,
        }}
      >
        {header}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 21,
              fontWeight: 500,
              lineHeight: 1.32,
              color: "var(--wine)",
            }}
          >
            {icon}
            <span style={{ flex: 1 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
