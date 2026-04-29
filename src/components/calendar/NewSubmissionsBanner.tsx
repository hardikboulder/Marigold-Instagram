"use client";

/**
 * Subtle banner shown on the Feed Calendar when there are new form
 * submissions waiting in the inbox. Polls the public submissions index on
 * mount so it picks up anything that came in since the studio was opened.
 */

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import {
  getNewSubmissionCount,
  syncFromPublicIndex,
} from "@/lib/db/form-submissions-store";

export function NewSubmissionsBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setCount(getNewSubmissionCount());
    }
    refresh();
    syncFromPublicIndex().then(refresh);
    const handle = window.setInterval(refresh, 5000);
    window.addEventListener("marigold:storage-changed", refresh);
    return () => {
      window.clearInterval(handle);
      window.removeEventListener("marigold:storage-changed", refresh);
    };
  }, []);

  if (count === 0) return null;

  return (
    <div style={bannerStyle} role="status">
      <span style={dotStyle} aria-hidden="true" />
      <span>
        <strong style={strongStyle}>
          {count} new submission{count === 1 ? "" : "s"}
        </strong>{" "}
        waiting from your public forms.
      </span>
      <Link href="/submissions" style={linkStyle}>
        View →
      </Link>
    </div>
  );
}

const bannerStyle: CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto 16px",
  padding: "10px 16px",
  background: "var(--blush)",
  border: "1px solid rgba(193,56,95,0.25)",
  borderRadius: 999,
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13,
  color: "var(--wine)",
  flexWrap: "wrap",
};

const strongStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
};

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "var(--deep-pink)",
  display: "inline-block",
  flexShrink: 0,
};

const linkStyle: CSSProperties = {
  marginLeft: "auto",
  fontFamily: "'Syne', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1.4,
  color: "var(--deep-pink)",
  textDecoration: "none",
  padding: "6px 12px",
  background: "white",
  borderRadius: 999,
  border: "1px solid rgba(193,56,95,0.2)",
};
