import { CTABar } from "@/components/brand/CTABar";

export type VenueType =
  | "palace"
  | "garden"
  | "beachfront"
  | "farmhouse"
  | "ballroom"
  | "heritage-haveli"
  | "rooftop"
  | "resort"
  | "temple-adjacent";

export interface VenueFeaturePostProps {
  venueType: VenueType;
  venueName: string;
  venueLocation: string;
  capacity: number;
  bestFor: string;
  imageUrl?: string;
  startingPrice?: number;
}

const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  palace: "PALACE",
  garden: "GARDEN",
  beachfront: "BEACHFRONT",
  farmhouse: "FARMHOUSE",
  ballroom: "BALLROOM",
  "heritage-haveli": "HERITAGE HAVELI",
  rooftop: "ROOFTOP",
  resort: "RESORT",
  "temple-adjacent": "TEMPLE-ADJACENT",
};

export function VenueFeaturePost({
  venueType,
  venueName,
  venueLocation,
  capacity,
  bestFor,
  imageUrl,
  startingPrice,
}: VenueFeaturePostProps) {
  const typeLabel = VENUE_TYPE_LABELS[venueType] ?? venueType.toUpperCase();

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
          top: 0,
          left: 0,
          right: 0,
          height: "55%",
          background: "var(--cream)",
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={venueName}
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
              inset: 32,
              border: "3px dashed rgba(75,21,40,0.25)",
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              color: "var(--mauve)",
              background: "var(--cream)",
            }}
          >
            <CameraIcon size={64} color="var(--mauve)" />
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "var(--wine)",
                opacity: 0.55,
              }}
            >
              VENUE PHOTO
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: "55%",
          left: 0,
          right: 0,
          height: 4,
          background: "var(--gold)",
          zIndex: 4,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 56,
          right: 56,
          top: "calc(55% - 40px)",
          background: "#FFFFFF",
          borderRadius: 8,
          padding: "44px 52px 120px 52px",
          boxShadow: "0 18px 40px rgba(75,21,40,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            background: "var(--hot-pink)",
            color: "#FFFFFF",
            padding: "8px 18px",
            borderRadius: 999,
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {typeLabel}
        </div>

        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 76,
            lineHeight: 1.0,
            color: "var(--wine)",
          }}
        >
          {venueName}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            color: "var(--mauve)",
          }}
        >
          <PinIcon size={22} color="var(--gold)" />
          <span>{venueLocation}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            color: "var(--mauve)",
          }}
        >
          <PeopleIcon size={22} color="var(--gold)" />
          <span>Up to {capacity} guests</span>
        </div>

        {startingPrice != null && (
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 1,
              color: "var(--deep-pink)",
              textTransform: "uppercase",
            }}
          >
            Starting ₹{startingPrice} lakh
          </div>
        )}

        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 36,
            color: "var(--hot-pink)",
            transform: "rotate(-1deg)",
            marginTop: 4,
          }}
        >
          {bestFor}
        </div>
      </div>

      <CTABar variant="overlay" handleText="VENUE SPOTLIGHT" />
    </div>
  );
}

function CameraIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h3l2-2.5h8L18 7h3v12H3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PinIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

function PeopleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
    >
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6v1H3v-1z" />
      <path d="M14.6 13.6c1-.4 2.1-.6 2.4-.6 2.4 0 4 1.7 4 4v1h-5v-1c0-1.3-.5-2.5-1.4-3.4z" />
    </svg>
  );
}
