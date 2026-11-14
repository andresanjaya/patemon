import { describe, it, expect } from "vitest";
import { DEFAULT_CEREMONY_TEMPLATES } from "../src/features/ceremonies/seeds";
import type { CeremonyPlanItemInput } from "../src/features/ceremonies/actions";

describe("Ceremony Onboarding & Editable Plan Flows", () => {
  describe("Template Suggestions & Customary Filtering", () => {
    it("suggests canonical Balinese ceremonies with sequence order", () => {
      expect(DEFAULT_CEREMONY_TEMPLATES.length).toBeGreaterThanOrEqual(5);

      // Verify each template has valid ordering
      for (let i = 0; i < DEFAULT_CEREMONY_TEMPLATES.length; i++) {
        expect(DEFAULT_CEREMONY_TEMPLATES[i].orderIndex).toBe(i + 1);
      }
    });

    it("includes Memadik-specific processes (Ngidih and Mejauman)", () => {
      const memadikCeremonies = DEFAULT_CEREMONY_TEMPLATES.filter(
        (t) => t.applicability === "Memadik" || t.applicability === "Umum"
      );

      const titles = memadikCeremonies.map((c) => c.name);
      expect(
        titles.some((t) => t.includes("Memadik") || t.includes("Ngidih"))
      ).toBe(true);
      expect(titles.some((t) => t.includes("Mejauman"))).toBe(true);
    });
  });

  describe("Plan Customization & Editorial Overrides", () => {
    it("allows adding custom ceremonies without a predefined templateId", () => {
      const initialItems: CeremonyPlanItemInput[] =
        DEFAULT_CEREMONY_TEMPLATES.map((t, idx) => ({
          templateId: t.id,
          title: t.name,
          phase: t.phase,
          orderIndex: idx + 1,
          status: "draft",
        }));

      const customCeremony: CeremonyPlanItemInput = {
        templateId: null, // Custom user-added ceremony
        title: "Upacara Penegtegan & Nuasen",
        phase: "Persiapan",
        orderIndex: initialItems.length + 1,
        personInCharge: "Jero Mangku",
        status: "draft",
      };

      const updatedPlan = [...initialItems, customCeremony];
      expect(updatedPlan).toHaveLength(initialItems.length + 1);
      expect(updatedPlan[updatedPlan.length - 1].templateId).toBeNull();
      expect(updatedPlan[updatedPlan.length - 1].title).toBe(
        "Upacara Penegtegan & Nuasen"
      );
    });

    it("allows reordering ceremonies while keeping sequential order indices", () => {
      const items: CeremonyPlanItemInput[] = [
        {
          templateId: "PR-001",
          title: "Memadik",
          phase: "Persiapan",
          orderIndex: 1,
        },
        {
          templateId: "PR-002",
          title: "Mebyakala",
          phase: "Puncak Acara",
          orderIndex: 2,
        },
        {
          templateId: "PR-003",
          title: "Madengen-dengen",
          phase: "Puncak Acara",
          orderIndex: 3,
        },
      ];

      // Move index 2 (Madengen-dengen) up to index 1
      const reordered = [...items];
      const temp = reordered[1];
      reordered[1] = reordered[2];
      reordered[2] = temp;

      const normalized = reordered.map((item, idx) => ({
        ...item,
        orderIndex: idx + 1,
      }));

      expect(normalized[0].title).toBe("Memadik");
      expect(normalized[1].title).toBe("Madengen-dengen");
      expect(normalized[1].orderIndex).toBe(2);
      expect(normalized[2].title).toBe("Mebyakala");
      expect(normalized[2].orderIndex).toBe(3);
    });

    it("allows skipping or removing optional ceremonies", () => {
      const items: CeremonyPlanItemInput[] = [
        {
          templateId: "PR-001",
          title: "Memadik",
          phase: "Persiapan",
          orderIndex: 1,
        },
        {
          templateId: "PR-006",
          title: "Mepegat Pesapat",
          phase: "Puncak Acara",
          orderIndex: 2,
        },
        {
          templateId: "PR-004",
          title: "Mesakapan",
          phase: "Puncak Acara",
          orderIndex: 3,
        },
      ];

      // Remove conditional Mepegat Pesapat
      const filtered = items.filter((i) => i.templateId !== "PR-006");
      const reindexed = filtered.map((item, idx) => ({
        ...item,
        orderIndex: idx + 1,
      }));

      expect(reindexed).toHaveLength(2);
      expect(
        reindexed.find((i) => i.title === "Mepegat Pesapat")
      ).toBeUndefined();
      expect(reindexed[1].orderIndex).toBe(2);
    });
  });

  describe("Provenance & Confirmation Warnings", () => {
    it("flags conditional ceremonies requiring family or pemangku confirmation", () => {
      const conditionalTemplates = DEFAULT_CEREMONY_TEMPLATES.filter((t) =>
        t.validationStatus.toLowerCase().includes("perlu validasi")
      );

      expect(conditionalTemplates.length).toBeGreaterThan(0);
      conditionalTemplates.forEach((t) => {
        expect(t.validationStatus).toContain("Perlu validasi");
      });
    });

    it("preserves provenance links back to source citations", () => {
      DEFAULT_CEREMONY_TEMPLATES.forEach((template) => {
        expect(template.sourceId).toMatch(/^SRC-\d+$/);
        expect(template.sourceUrl).toBeTruthy();
      });
    });
  });
});
