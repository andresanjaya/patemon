import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PRICING_TIERS, PRICING_FAQS } from "../src/features/payments/pricing";
import {
  DEFAULT_SOURCES,
  DEFAULT_RITUAL_CATALOG,
} from "../src/features/banten/seeds";

describe("Public Content & Clean Marketing Presentation (Issue #79)", () => {
  const rootDir = path.resolve(__dirname, "..");
  const pagePath = path.join(rootDir, "src/app/page.tsx");
  const navbarPath = path.join(rootDir, "src/components/layout/navbar.tsx");
  const footerPath = path.join(rootDir, "src/components/layout/footer.tsx");
  const pricingPagePath = path.join(rootDir, "src/app/pricing/page.tsx");
  const ceremoniesWizardPath = path.join(
    rootDir,
    "src/features/ceremonies/components/ceremony-onboarding-wizard.tsx"
  );

  const homeContent = fs.readFileSync(pagePath, "utf-8");
  const navbarContent = fs.readFileSync(navbarPath, "utf-8");
  const footerContent = fs.readFileSync(footerPath, "utf-8");
  const pricingPageContent = fs.readFileSync(pricingPagePath, "utf-8");
  const ceremoniesWizardContent = fs.readFileSync(
    ceremoniesWizardPath,
    "utf-8"
  );

  describe("Home Page (src/app/page.tsx)", () => {
    it("does not render engineering badges, internal dev stack, or backlog links", () => {
      // Must not contain development status
      expect(homeContent).not.toContain(
        "MVP v1 · Development Foundation Active"
      );
      expect(homeContent).not.toContain("Stack MVP");
      expect(homeContent).not.toContain("Next.js App Router");
      expect(homeContent).not.toContain("TypeScript Strict");
      expect(homeContent).not.toContain("Lihat GitHub Backlog");
      expect(homeContent).not.toContain("https://github.com");
      expect(homeContent).not.toContain("Phase 03 Foundation");
      expect(homeContent).not.toContain("Issue #13 In Progress");
      expect(homeContent).not.toContain("Tiket #");
    });

    it("presents customer-facing value proposition and how-it-works workflow", () => {
      expect(homeContent).toContain("Platform Manajemen Pawiwahan Hindu Bali");
      expect(homeContent).toContain("Rencanakan");
      expect(homeContent).toContain("Pawiwahan");
      expect(homeContent).toContain("dengan Tertata, Khidmat, & Transparan");

      // How It Works section
      expect(homeContent).toContain('id="how-it-works"');
      expect(homeContent).toContain("Cara Kerja Perencanaan di Patemon");
      expect(homeContent).toContain("Daftar & Buat Workspace");
      expect(homeContent).toContain("Eksplorasi Katalog & Draft");
      expect(homeContent).toContain("Aktivasi Lisensi Sekali Bayar");
      expect(homeContent).toContain("Kolaborasi & Kawal Hari-H");

      // Valid customer action CTAs
      expect(homeContent).toContain("Mulai Rencanakan Gratis");
      expect(homeContent).toContain("Jelajahi Demo Interaktif");
    });

    it("defines valid anchor targets matching public navigation", () => {
      expect(homeContent).toContain('id="how-it-works"');
      expect(homeContent).toContain('id="features"');
      expect(homeContent).toContain('id="principles"');
    });
  });

  describe("Navigation Bar (src/components/layout/navbar.tsx)", () => {
    it("does not contain internal roadmap links", () => {
      expect(navbarContent).not.toContain("/#roadmap");
      expect(navbarContent).not.toContain("Roadmap MVP");
    });

    it("contains customer-centric navigation items", () => {
      expect(navbarContent).toContain('href="/#features"');
      expect(navbarContent).toContain('href="/#how-it-works"');
      expect(navbarContent).toContain('href="/#principles"');
      expect(navbarContent).toContain('href="/pricing"');
      expect(navbarContent).toContain('href="/faq"');
    });
  });

  describe("Footer (src/components/layout/footer.tsx)", () => {
    it("does not contain GitHub repository or PRD documentation links", () => {
      expect(footerContent).not.toContain(
        "https://github.com/andresanjaya/patemon"
      );
      expect(footerContent).not.toContain("GitHub Repository");
      expect(footerContent).not.toContain("Dokumentasi PRD");
    });

    it("contains essential legal, help, and customer support links", () => {
      expect(footerContent).toContain('href="/pricing"');
      expect(footerContent).toContain('href="/faq"');
      expect(footerContent).toContain('href="/privacy"');
      expect(footerContent).toContain('href="/terms"');
      expect(footerContent).toContain('href="/#how-it-works"');
      expect(footerContent).toContain("Bantuan WhatsApp");
    });
  });

  describe("Pricing & Onboarding Copy Verification", () => {
    it("ensures public pricing page has no developer backlog links or issue tokens", () => {
      expect(pricingPageContent).not.toContain("https://github.com");
      expect(pricingPageContent).not.toContain("Tiket #");
      expect(pricingPageContent).not.toContain("Issue #");
    });

    it("does not expose internal MVP badges in pricing tiers", () => {
      for (const tier of PRICING_TIERS) {
        if (tier.badge) {
          expect(tier.badge).not.toContain("MVP");
        }
      }
    });

    it("clearly details one-time payment and 7-day guarantee in FAQs", () => {
      const refundFaq = PRICING_FAQS.find((f) =>
        f.question.toLowerCase().includes("uang kembali")
      );
      expect(refundFaq).toBeDefined();
      expect(refundFaq?.answer).toContain("100%");
      expect(refundFaq?.answer).toContain("7 hari");
    });

    it("does not expose internal PRD references in ceremony onboarding UI", () => {
      expect(ceremoniesWizardContent).not.toContain("PRD Section");
      expect(ceremoniesWizardContent).toContain(
        "Prinsip Keluwesan Dresta Adat:"
      );
    });
  });

  describe("Master Ritual Catalog Data Seeds", () => {
    it("ensures no sourceUrls point to private internal GitHub repo documents", () => {
      for (const source of DEFAULT_SOURCES) {
        if (source.sourceUrl) {
          expect(source.sourceUrl).not.toContain(
            "github.com/andresanjaya/patemon"
          );
        }
      }

      for (const item of DEFAULT_RITUAL_CATALOG) {
        if (item.sourceUrl) {
          expect(item.sourceUrl).not.toContain(
            "github.com/andresanjaya/patemon"
          );
        }
      }
    });
  });
});
