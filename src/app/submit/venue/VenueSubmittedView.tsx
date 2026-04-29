"use client";

/**
 * Post-submission thank-you view for /submit/venue.
 *
 * Special-cased (vs. the generic /submit/[formId] thank-you) so we can
 * preview the venue card the studio will use as the spotlight post — a
 * subtle promise that the venue's submission is going somewhere visible.
 */

import { useEffect, useState, type CSSProperties } from "react";
import {
  VenueFeaturePost,
  type VenueType,
} from "@/components/templates/venue-spotlight/VenueFeaturePost";

interface Props {
  venueProfile: {
    venueType: string;
    venueName: string;
    venueLocation: string;
    capacity: number;
    bestFor: string;
    startingPriceText?: string;
  };
  firstPhoto?: { name: string; dataUrl: string };
}

const POST_SIZE = 1080;

export function VenueSubmittedView({ venueProfile, firstPhoto }: Props) {
  // Scale the 1080x1080 post to fit the responsive preview slot.
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    function recalc() {
      const w = Math.min(window.innerWidth - 80, 520);
      setScale(Math.max(0.25, Math.min(0.5, w / POST_SIZE)));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const previewName = venueProfile.venueName || "Your venue";
  const previewLocation = venueProfile.venueLocation || "City, State";
  const previewCapacity = venueProfile.capacity || 0;
  const previewBestFor = venueProfile.bestFor || "the bride who knows the vibe";

  return (
    <div style={pageWrap}>
      <div style={pageInner}>
        <header style={brandHeader}>
          <span style={brandThe}>The </span>
          <span style={brandMari}>Marigold</span>
        </header>

        <div style={marigoldFlower} aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <g fill="#D4A853">
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 360) / 12;
                return (
                  <ellipse
                    key={i}
                    cx="40"
                    cy="20"
                    rx="6"
                    ry="14"
                    transform={`rotate(${angle} 40 40)`}
                    opacity={0.85}
                  />
                );
              })}
            </g>
            <circle cx="40" cy="40" r="8" fill="#9C2647" />
          </svg>
        </div>

        <h1 style={thankYouTitle}>
          Thank you for submitting <i>{previewName}</i>!
        </h1>

        <p style={thankYouMessage}>
          We'll review your submission and reach out when your feature goes
          live.
        </p>
        <p style={thankYouMessage}>
          In the meantime — if you have South Asian couples inquiring, send
          them to{" "}
          <a
            href="https://instagram.com/themarigold"
            target="_blank"
            rel="noopener noreferrer"
            style={instagramLink}
          >
            The Marigold
          </a>
          . We'll help them plan the whole wedding, not just find the venue.
        </p>

        <div style={previewSection}>
          <div style={previewLabel}>A peek at your venue card</div>
          <div style={previewSubLabel}>
            This is what we'll work from to feature {previewName} on Instagram.
          </div>
          <div
            style={{
              ...previewSlot,
              height: POST_SIZE * scale + 24,
            }}
          >
            <div
              style={{
                width: POST_SIZE,
                height: POST_SIZE,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <VenueFeaturePost
                venueType={normaliseVenueType(venueProfile.venueType)}
                venueName={previewName}
                venueLocation={previewLocation}
                capacity={previewCapacity}
                bestFor={previewBestFor}
                imageUrl={firstPhoto?.dataUrl}
              />
            </div>
          </div>
          {venueProfile.startingPriceText && (
            <div style={priceCallout}>
              Starting price: {venueProfile.startingPriceText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normaliseVenueType(value: string): VenueType {
  const allowed: VenueType[] = [
    "palace",
    "garden",
    "beachfront",
    "farmhouse",
    "ballroom",
    "heritage-haveli",
    "rooftop",
    "resort",
    "temple-adjacent",
  ];
  return (allowed as string[]).includes(value)
    ? (value as VenueType)
    : "palace";
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const pageWrap: CSSProperties = {
  minHeight: "100vh",
  background: "var(--cream)",
  display: "flex",
  justifyContent: "center",
  padding: "40px 20px 80px",
};

const pageInner: CSSProperties = {
  width: "100%",
  maxWidth: 640,
  textAlign: "center",
};

const brandHeader: CSSProperties = {
  marginBottom: 24,
};

const brandThe: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 400,
  fontSize: 16,
  color: "var(--mauve)",
  letterSpacing: 0.5,
};

const brandMari: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 26,
  color: "var(--wine)",
};

const marigoldFlower: CSSProperties = {
  margin: "0 auto 18px",
  display: "flex",
  justifyContent: "center",
};

const thankYouTitle: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontSize: 48,
  color: "var(--wine)",
  margin: "0 0 16px",
  lineHeight: 1.05,
};

const thankYouMessage: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  color: "var(--mauve)",
  lineHeight: 1.7,
  margin: "0 auto 14px",
  maxWidth: 540,
};

const instagramLink: CSSProperties = {
  color: "var(--deep-pink)",
  textDecoration: "underline",
};

const previewSection: CSSProperties = {
  marginTop: 36,
  padding: "20px 18px 28px",
  background: "var(--blush)",
  borderRadius: 16,
  border: "1px solid rgba(193,56,95,0.18)",
};

const previewLabel: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 2.5,
  textTransform: "uppercase",
  color: "var(--deep-pink)",
};

const previewSubLabel: CSSProperties = {
  fontFamily: "'Caveat', cursive",
  fontSize: 22,
  color: "var(--wine)",
  marginTop: 6,
  marginBottom: 18,
};

const previewSlot: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  overflow: "hidden",
  background: "transparent",
};

const priceCallout: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 14,
  color: "var(--wine)",
  marginTop: 16,
  fontWeight: 600,
};
