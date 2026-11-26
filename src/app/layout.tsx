import { Suspense } from "react";
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  Manrope,
  Inter,
} from "next/font/google";
import "./globals.css";
import { ActionConfirmation } from "@/components/ui/action-confirmation";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Patemon — Bali Hindu Wedding Planner",
  description:
    "Ruang kerja kolaboratif untuk perencanaan upacara pernikahan Hindu Bali (Pawiwahan), banten, sarana upakara, anggaran, dan koordinasi keluarga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        playfairDisplay.variable,
        manrope.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="bg-background text-foreground min-h-full">
        <AppShell>{children}</AppShell>
        <ActionConfirmation />
        <Suspense fallback={null}>
          <ActionFeedback />
        </Suspense>
      </body>
    </html>
  );
}
