"use client";

/**
 * Persistent application shell. Top nav across the full width, on-demand
 * slide-out panel from the right for secondary actions, settings, and the
 * detailed storage breakdown. Content stretches edge-to-edge with a centered
 * 1440px max-width — the wine sidebar is gone.
 */

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopNav } from "@/components/app/TopNav";
import { SlideOutPanel } from "@/components/app/SlideOutPanel";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Public submission forms render without the studio chrome — they're for
  // external visitors (vendors, brides, etc.) who shouldn't see the studio nav.
  const isPublicSurface = pathname.startsWith("/submit");
  if (isPublicSurface) {
    return <>{children}</>;
  }

  return (
    <div className="marigold-shell">
      <TopNav onOpenPanel={() => setOpen(true)} />
      <main className="marigold-shell__main">
        <div className="marigold-shell__content">{children}</div>
      </main>
      <SlideOutPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
