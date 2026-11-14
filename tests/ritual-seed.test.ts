import { describe, it, expect } from "vitest";
import sources from "../supabase/seeds/sources.json";
import ceremonies from "../supabase/seeds/ceremonies.json";
import rituals from "../supabase/seeds/rituals.json";
import { DEFAULT_CEREMONY_TEMPLATES } from "../src/features/ceremonies/seeds";
import {
  DEFAULT_RITUAL_CATALOG,
  DEFAULT_SOURCES,
} from "../src/features/banten/seeds";

describe("Ritual Seed Data & Provenance Pipeline", () => {
  const validSourceIds = new Set(sources.map((s) => s.id));

  describe("Sources & Citations (Provenance)", () => {
    it("contains authentic Balinese ceremonial literature references", () => {
      expect(sources.length).toBeGreaterThanOrEqual(3);
      sources.forEach((source) => {
        expect(source.id).toMatch(/^SRC-\d+$/);
        expect(source.title.length).toBeGreaterThan(5);
        expect(source.source_type.length).toBeGreaterThan(3);
        expect(source.source_url).toMatch(/^https?:\/\//);
      });
    });

    it("matches default in-memory sources for client-side fallback", () => {
      expect(DEFAULT_SOURCES).toHaveLength(sources.length);
      expect(DEFAULT_SOURCES.map((s) => s.id)).toEqual(
        sources.map((s) => s.id)
      );
    });
  });

  describe("Ceremony Templates", () => {
    it("contains sequential ceremony steps covering preparation, peak, and post-wedding", () => {
      expect(ceremonies.length).toBeGreaterThanOrEqual(5);

      const phases = new Set(ceremonies.map((c) => c.phase));
      expect(phases).toContain("Persiapan");
      expect(phases).toContain("Puncak Acara");
      expect(phases).toContain("Pasca Pawiwahan");

      // Verify sequence ordering
      for (let i = 0; i < ceremonies.length; i++) {
        expect(ceremonies[i].order_index).toBe(i + 1);
      }
    });

    it("ensures every ceremony has a valid bibliographic source_id", () => {
      ceremonies.forEach((ceremony) => {
        expect(validSourceIds.has(ceremony.source_id)).toBe(true);
        expect(ceremony.source_url).toBeTruthy();
      });
    });

    it("adheres to PRD guardrail: draft items are never flagged as verified", () => {
      ceremonies.forEach((c) => {
        if (c.source_id === "SRC-004") {
          // Field research / unreviewed items must never claim verified status
          expect(c.validation_status).not.toBe("Tervalidasi Literatur Adat");
        }
      });
    });

    it("matches default ceremony template in-memory seeds", () => {
      expect(DEFAULT_CEREMONY_TEMPLATES).toHaveLength(ceremonies.length);
    });
  });

  describe("Ritual Catalog (Banten & Sarana)", () => {
    it("strictly separates package items from constituent components", () => {
      const packages = rituals.filter((r) => r.item_type === "Paket Banten");
      const components = rituals.filter((r) => r.item_type !== "Paket Banten");

      expect(packages.length).toBeGreaterThan(0);
      expect(components.length).toBeGreaterThan(0);

      packages.forEach((pkg) => {
        expect(pkg.id).toMatch(/^BN-PKT-/);
        expect(pkg.unit).toBe("paket");
      });

      components.forEach((item) => {
        expect(item.id).toMatch(/^BN-ITM-/);
        expect(["tanding", "buah", "set", "gulung", "pasang"]).toContain(
          item.unit
        );
      });
    });

    it("verifies all ritual items link to valid bibliographic sources", () => {
      rituals.forEach((ritual) => {
        expect(validSourceIds.has(ritual.source_id)).toBe(true);
        expect(ritual.source_url).toBeTruthy();
        expect(ritual.validation_status).toBeTruthy();
      });
    });

    it("ensures quantities and pricing are blank or non-coercive", () => {
      rituals.forEach((r) => {
        if (r.default_quantity !== null) {
          expect(r.default_quantity).toBeGreaterThan(0);
        }
        // Fixed pricing is not hardcoded into ritual seed catalog
        expect(r).not.toHaveProperty("price");
      });
    });

    it("matches default in-memory ritual catalog seeds", () => {
      expect(DEFAULT_RITUAL_CATALOG).toHaveLength(rituals.length);
    });
  });
});
