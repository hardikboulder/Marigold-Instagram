import { CTABar } from "@/components/brand/CTABar";
import { PushPin } from "@/components/brand/PushPin";
import { TapeStrip } from "@/components/brand/TapeStrip";

export type EditCategory =
  | "bridal-jewelry"
  | "decor-find"
  | "mehndi-inspo"
  | "outfit-accessory"
  | "beauty-find"
  | "stationery"
  | "favor-idea"
  | "tech-tool";

export interface ProductPickPostProps {
  productName: string;
  category: EditCategory;
  price?: string;
  whyWeLoveIt: string;
  imageUrl?: string;
}

export const EDIT_CATEGORY_LABELS: Record<EditCategory, string> = {
  "bridal-jewelry": "BRIDAL JEWELRY",
  "decor-find": "DECOR FIND",
  "mehndi-inspo": "MEHNDI INSPO",
  "outfit-accessory": "OUTFIT ACCESSORY",
  "beauty-find": "BEAUTY FIND",
  stationery: "STATIONERY",
  "favor-idea": "FAVOR IDEA",
  "tech-tool": "TECH TOOL",
};

const SCRAPBOOK_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg width='220' height='220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23g)' opacity='0.06'/%3E%3C/svg%3E\")";

export function ProductPickPost({
  productName,
  category,
  price,
  whyWeLoveIt,
  imageUrl,
}: ProductPickPostProps) {
  const categoryLabel = EDIT_CATEGORY_LABELS[category] ?? category.toUpperCase();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--cream)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: SCRAPBOOK_TEXTURE,
          opacity: 0.7,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "var(--hot-pink)",
          }}
        >
          THE MARIGOLD EDIT
        </div>
        <div
          style={{
            marginTop: 10,
            width: 80,
            height: 2,
            background: "var(--gold)",
            margin: "10px auto 0",
            opacity: 0.6,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 142,
          left: 200,
          right: 200,
          height: 460,
          background: "#FFFFFF",
          boxShadow: "0 16px 36px rgba(75,21,40,0.18)",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 24,
              border: "3px dashed rgba(75,21,40,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              background: "var(--blush)",
            }}
          >
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 36,
                color: "var(--mauve)",
                opacity: 0.7,
              }}
            >
              product photo
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "var(--mauve)",
                opacity: 0.5,
              }}
            >
              tap to upload
            </div>
          </div>
        )}
      </div>

      <TapeStrip
        top={120}
        left={232}
        rotation={-8}
        width={200}
        height={50}
      />
      <TapeStrip
        top={120}
        right={232}
        rotation={6}
        width={200}
        height={50}
      />
      <TapeStrip
        bottom={372}
        left={196}
        rotation={4}
        width={180}
        height={44}
      />

      <PushPin variant="gold" top={92} left={140} size={42} />
      <PushPin variant="pink" top={108} right={130} size={38} />

      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 622,
          background: "var(--blush)",
          border: "2px solid var(--hot-pink)",
          padding: "28px 36px 30px",
          transform: "rotate(-1.5deg)",
          boxShadow: "0 10px 22px rgba(75,21,40,0.14)",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--deep-pink)",
          }}
        >
          {categoryLabel}
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 56,
            lineHeight: 1.0,
            color: "var(--wine)",
          }}
        >
          {productName}
        </div>
        {price && (
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 1,
              color: "var(--deep-pink)",
              marginTop: 4,
            }}
          >
            {price}
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 168,
          textAlign: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 38,
            lineHeight: 1.2,
            color: "var(--wine)",
            transform: "rotate(-1deg)",
          }}
        >
          {whyWeLoveIt}
        </div>
      </div>

      <CTABar variant="overlay" handleText="THE MARIGOLD EDIT" />
    </div>
  );
}
