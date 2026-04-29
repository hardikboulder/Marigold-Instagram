import { CTABar } from "@/components/brand/CTABar";
import { TapeStrip } from "@/components/brand/TapeStrip";

export interface LehengaStylePostProps {
  imageUrl: string;
  styleName: string;
  colorDescription: string;
  bestFor: string;
  designerSource?: string;
}

export function LehengaStylePost({
  imageUrl,
  styleName,
  colorDescription,
  bestFor,
  designerSource,
}: LehengaStylePostProps) {
  const hasImage = Boolean(imageUrl);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--wine)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: hasImage ? `url(${imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          background: hasImage
            ? `url(${imageUrl}) center/cover`
            : "linear-gradient(135deg, var(--blush) 0%, var(--mauve) 60%, var(--wine) 100%)",
        }}
      />

      {!hasImage && (
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(255,248,242,0.55)",
          }}
        >
          Lehenga photo
        </div>
      )}

      <TapeStrip top={48} left={120} rotation={-8} width={200} height={48} />

      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          bottom: 160,
          background: "rgba(75,21,40,0.82)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: 14,
          border: "1px solid rgba(245,230,200,0.18)",
          padding: "40px 44px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          color: "var(--cream)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.32)",
        }}
      >
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 56,
            lineHeight: 1.05,
            color: "var(--gold-light)",
          }}
        >
          {styleName}
        </div>

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 38,
            color: "var(--hot-pink)",
            transform: "rotate(-1.5deg)",
            lineHeight: 1.1,
          }}
        >
          {colorDescription}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginTop: 6,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 500,
            color: "rgba(255,248,242,0.92)",
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            Best for:
          </span>
          <span>{bestFor}</span>
        </div>

        {designerSource && designerSource.trim() && (
          <div
            style={{
              marginTop: 4,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 16,
              fontWeight: 400,
              letterSpacing: 1,
              color: "rgba(255,248,242,0.55)",
              textTransform: "lowercase",
            }}
          >
            via {designerSource.trim()}
          </div>
        )}
      </div>

      <CTABar variant="overlay" />
    </div>
  );
}
