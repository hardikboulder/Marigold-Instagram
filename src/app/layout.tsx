import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app/AppShell";
import { ToastProvider } from "@/components/app/ToastProvider";

export const metadata: Metadata = {
  title: "The Marigold Content Studio",
  description:
    "AI-powered Instagram content generator for The Marigold — South Asian wedding planning brand.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
