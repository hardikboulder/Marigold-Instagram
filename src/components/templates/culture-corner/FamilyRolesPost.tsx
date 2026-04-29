import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";

import { CultureIcon } from "./CultureIcons";

export interface FamilyRole {
  title: string;
  relationship: string;
  description: string;
  annotation: string;
}

export interface FamilyRolesPostProps {
  roles: FamilyRole[];
  guideTitle?: string;
  subtitle?: string;
}

const PIN_PALETTE: ("pink" | "gold" | "blue")[] = [
  "pink",
  "gold",
  "pink",
  "gold",
  "blue",
  "gold",
  "pink",
  "blue",
];

const ROTATIONS = [-1.4, 1.2, -0.8, 1.6, -1.0, 0.8, -1.6, 1.0];

export function FamilyRolesPost({
  roles,
  guideTitle = "The Extended Family Guide",
  subtitle = "who's who at a desi wedding",
}: FamilyRolesPostProps) {
  const visible = roles.slice(0, 6);
  const cols = visible.length <= 4 ? 2 : 3;

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
        padding: "100px 70px 160px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 8% 10%, rgba(212,168,83,0.12), transparent 45%), radial-gradient(circle at 92% 90%, rgba(237,147,177,0.10), transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <PushPin variant="gold" top={48} left={70} />
      <PushPin variant="pink" top={48} right={70} />

      <div style={{ textAlign: "center", marginBottom: 14, position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 1,
              background: "var(--gold)",
              opacity: 0.7,
            }}
          />
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            Culture Corner
          </div>
          <div
            style={{
              width: 40,
              height: 1,
              background: "var(--gold)",
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 60,
          lineHeight: 1.05,
          color: "var(--wine)",
          textAlign: "center",
          marginBottom: 8,
          position: "relative",
          zIndex: 2,
        }}
      >
        {guideTitle}
      </div>
      <div
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: 36,
          color: "var(--mauve)",
          textAlign: "center",
          transform: "rotate(-1deg)",
          marginBottom: 36,
          position: "relative",
          zIndex: 2,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 22,
          position: "relative",
          zIndex: 2,
        }}
      >
        {visible.map((role, i) => {
          const pin = PIN_PALETTE[i % PIN_PALETTE.length];
          const rotation = ROTATIONS[i % ROTATIONS.length];
          return (
            <div
              key={`${role.title}-${i}`}
              style={{
                background: "white",
                borderRadius: 14,
                padding: "20px 18px 18px",
                boxShadow: "0 8px 18px rgba(75,21,40,0.12)",
                border: "1px solid rgba(212,168,83,0.35)",
                position: "relative",
                transform: `rotate(${rotation}deg)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                minHeight: 0,
              }}
            >
              <PushPin
                variant={pin}
                size={26}
                top={-12}
                left="50%"
                style={{ transform: "translateX(-50%)" }}
              />
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: "50%",
                  background: "var(--blush)",
                  border: "3px solid var(--hot-pink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 6,
                  marginBottom: 10,
                  flex: "0 0 auto",
                }}
              >
                <CultureIcon
                  type="paisley"
                  size={42}
                  color="var(--wine)"
                />
              </div>

              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontSize: 28,
                  lineHeight: 1.05,
                  color: "var(--wine)",
                  marginBottom: 4,
                }}
              >
                {role.title}
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 10,
                }}
              >
                {role.relationship}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                  lineHeight: 1.35,
                  color: "var(--mauve)",
                  marginBottom: 10,
                  flex: 1,
                }}
              >
                {role.description}
              </div>
              <div
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 22,
                  lineHeight: 1.1,
                  color: "var(--hot-pink)",
                  transform: "rotate(-1.5deg)",
                  borderTop: "1px dashed rgba(212,168,83,0.55)",
                  paddingTop: 8,
                  width: "100%",
                }}
              >
                {role.annotation}
              </div>
            </div>
          );
        })}
      </div>

      <CTABar variant="overlay" handleText="CULTURE CORNER" />
    </div>
  );
}
