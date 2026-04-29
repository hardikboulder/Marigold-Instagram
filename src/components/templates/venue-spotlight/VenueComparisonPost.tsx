import type { ReactNode } from "react";
import { CTABar } from "@/components/brand/CTABar";

export interface VenueComparisonAttributes {
  capacity: string;
  vibe: string;
  priceRange: string;
  bestFor: string;
}

export interface VenueComparisonPostProps {
  venueAName: string;
  venueAImage?: string;
  venueAAttributes: VenueComparisonAttributes;
  venueBName: string;
  venueBImage?: string;
  venueBAttributes: VenueComparisonAttributes;
  verdict: string;
}

export function VenueComparisonPost({
  venueAName,
  venueAImage,
  venueAAttributes,
  venueBName,
  venueBImage,
  venueBAttributes,
  verdict,
}: VenueComparisonPostProps) {
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
      }}
    >
      <div
        style={{
          paddingTop: 56,
          textAlign: "center",
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "var(--gold)",
        }}
      >
        VENUE SHOWDOWN
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          padding: "32px 40px 0 40px",
          position: "relative",
          minHeight: 0,
        }}
      >
        <VenueColumn
          name={venueAName}
          imageUrl={venueAImage}
          attributes={venueAAttributes}
          align="left"
        />

        <div
          style={{
            width: 4,
            margin: "0 8px",
            background: "var(--gold)",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-6deg)",
              background: "var(--cream)",
              padding: "4px 12px",
              fontFamily: "'Caveat', cursive",
              fontSize: 56,
              color: "var(--hot-pink)",
              lineHeight: 1,
            }}
          >
            vs.
          </div>
        </div>

        <VenueColumn
          name={venueBName}
          imageUrl={venueBImage}
          attributes={venueBAttributes}
          align="right"
        />
      </div>

      <div
        style={{
          background: "var(--blush)",
          padding: "28px 56px 32px 56px",
          textAlign: "center",
          fontFamily: "'Caveat', cursive",
          fontSize: 38,
          color: "var(--wine)",
          lineHeight: 1.15,
          marginBottom: 84,
        }}
      >
        <span style={{ color: "var(--mauve)" }}>Our take: </span>
        {verdict}
      </div>

      <CTABar variant="overlay" handleText="VENUE SHOWDOWN" />
    </div>
  );
}

function VenueColumn({
  name,
  imageUrl,
  attributes,
  align,
}: {
  name: string;
  imageUrl?: string;
  attributes: VenueComparisonAttributes;
  align: "left" | "right";
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "0 12px",
        textAlign: align === "left" ? "left" : "right",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          maxHeight: 360,
          background: "var(--blush)",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          marginBottom: 20,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
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
              inset: 16,
              border: "2px dashed rgba(75,21,40,0.2)",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "var(--mauve)",
              opacity: 0.6,
            }}
          >
            VENUE PHOTO
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 44,
          lineHeight: 1.05,
          color: "var(--wine)",
          marginBottom: 16,
        }}
      >
        {name}
      </div>

      <AttributeRow label="Capacity" value={attributes.capacity} align={align} />
      <AttributeRow label="Vibe" value={attributes.vibe} align={align} />
      <AttributeRow label="Price" value={attributes.priceRange} align={align} />
      <AttributeRow label="Best for" value={attributes.bestFor} align={align} />
    </div>
  );
}

function AttributeRow({
  label,
  value,
  align,
}: {
  label: string;
  value: ReactNode;
  align: "left" | "right";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "left" ? "flex-start" : "flex-end",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "var(--mauve)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 20,
          fontWeight: 500,
          color: "var(--wine)",
          lineHeight: 1.25,
        }}
      >
        {value}
      </div>
    </div>
  );
}
