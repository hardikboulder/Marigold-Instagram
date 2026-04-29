"use client";

/**
 * Top navigation bar — replaces the wine sidebar with a quiet, typographic
 * strip across the top of the studio. Notion/Linear vibe: cream background,
 * wine type, no shadows. Center links collapse into the slide-out panel on
 * narrow viewports (<768px); the panel is the home of secondary actions and
 * the detailed storage breakdown.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import {
  computeStorageUsage,
  type StorageUsage,
} from "@/lib/db/storage-usage";
import {
  getNewSubmissionCount,
  syncFromPublicIndex,
} from "@/lib/db/form-submissions-store";

export interface NavLink {
  href: string;
  label: string;
  match?: (path: string) => boolean;
}

export const NAV_LINKS: NavLink[] = [
  {
    href: "/",
    label: "Feed Calendar",
    match: (p) => p === "/" || p.startsWith("/editor"),
  },
  { href: "/media", label: "Media" },
  { href: "/gallery", label: "Templates" },
  { href: "/library", label: "Library" },
  { href: "/submissions", label: "Submissions" },
  { href: "/settings", label: "Settings" },
];

interface Props {
  onOpenPanel: () => void;
}

export function TopNav({ onOpenPanel }: Props) {
  const pathname = usePathname() ?? "/";
  const [usage, setUsage] = useState<StorageUsage>({
    itemCount: 0,
    totalBytes: 0,
    percentage: 0,
  });
  const [newSubmissions, setNewSubmissions] = useState(0);

  useEffect(() => {
    function refresh() {
      setUsage(computeStorageUsage());
      setNewSubmissions(getNewSubmissionCount());
    }
    refresh();
    // Pull /public/submissions/_index.json on mount so the badge picks up
    // anything that came in while the studio was closed.
    syncFromPublicIndex().then(() => setNewSubmissions(getNewSubmissionCount()));
    const handle = window.setInterval(refresh, 4000);
    const sync = window.setInterval(() => {
      syncFromPublicIndex().then(() =>
        setNewSubmissions(getNewSubmissionCount()),
      );
    }, 30000);
    window.addEventListener("storage", refresh);
    window.addEventListener("marigold:storage-changed", refresh);
    return () => {
      window.clearInterval(handle);
      window.clearInterval(sync);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("marigold:storage-changed", refresh);
    };
  }, []);

  const storageWarning = usage.percentage >= 0.8;
  const itemLabel = `${usage.itemCount} item${usage.itemCount === 1 ? "" : "s"}`;

  return (
    <header className="marigold-topnav" role="banner">
      <div className="marigold-topnav__inner">
        <div className="marigold-topnav__left">
          <Link href="/" style={brandLink} aria-label="The Marigold — home">
            <span style={brandThe}>The </span>
            <span style={brandMarigold}>Marigold</span>
          </Link>
          <span aria-hidden="true" style={divider} />
        </div>

        <nav
          className="marigold-topnav__center"
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map((link) => {
            const active = link.match
              ? link.match(pathname)
              : pathname === link.href ||
                pathname.startsWith(link.href + "/");
            const showBadge =
              link.href === "/submissions" && newSubmissions > 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`marigold-topnav__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                style={{ position: "relative" }}
              >
                {link.label}
                {showBadge && (
                  <span style={badgeStyle} aria-label={`${newSubmissions} new submissions`}>
                    {newSubmissions > 99 ? "99+" : newSubmissions}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="marigold-topnav__right">
          <span
            style={storageLabel}
            title="Local storage usage — open the panel for details"
          >
            {storageWarning && (
              <span aria-hidden="true" style={warnIcon}>
                ⚠
              </span>
            )}
            {itemLabel}
          </span>
          <button
            type="button"
            className="marigold-topnav__menu"
            onClick={onOpenPanel}
            aria-label="Open quick actions"
          >
            <span style={menuLine} />
            <span style={{ ...menuLine, marginTop: 5 }} />
            <span style={{ ...menuLine, marginTop: 5 }} />
          </button>
        </div>
      </div>
    </header>
  );
}

const brandLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  textDecoration: "none",
  color: "var(--wine)",
  whiteSpace: "nowrap",
};

const brandThe: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 400,
  fontSize: 17,
  letterSpacing: 0.2,
};

const brandMarigold: CSSProperties = {
  fontFamily: "'Instrument Serif', serif",
  fontStyle: "italic",
  fontSize: 22,
  lineHeight: 1,
};

const divider: CSSProperties = {
  display: "inline-block",
  width: 1,
  height: 24,
  background: "var(--gold)",
  marginLeft: 16,
  opacity: 0.7,
};

const storageLabel: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  color: "var(--mauve)",
  opacity: 0.7,
  letterSpacing: 0.2,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const warnIcon: CSSProperties = {
  color: "var(--gold)",
  fontSize: 12,
  opacity: 1,
};

const menuLine: CSSProperties = {
  width: 18,
  height: 1.5,
  background: "var(--wine)",
  borderRadius: 2,
  display: "block",
};

const badgeStyle: CSSProperties = {
  position: "absolute",
  top: -6,
  right: -16,
  background: "var(--deep-pink)",
  color: "white",
  borderRadius: 999,
  fontSize: 9,
  fontWeight: 800,
  padding: "2px 6px",
  fontFamily: "'Syne', sans-serif",
  letterSpacing: 0.4,
  lineHeight: 1,
  minWidth: 16,
  textAlign: "center",
};
