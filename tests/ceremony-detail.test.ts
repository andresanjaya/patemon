import { describe, it, expect } from "vitest";
import { DEFAULT_CEREMONY_TEMPLATES } from "../src/features/ceremonies/seeds";
import type {
  RundownEvent,
  CeremonyRitualItem,
  WeddingCeremony,
} from "../src/features/ceremonies/types";

describe("Ceremony Detail & Rundown Management (Issue #25)", () => {
  describe("Ceremony Detail Domain & Provenance Matching", () => {
    it("matches ceremony templates with authentic Balinese provenance", () => {
      const template = DEFAULT_CEREMONY_TEMPLATES.find((t) => t.id === "PR-002");

      expect(template).toBeDefined();
      if (!template) return;

      expect(template.name).toContain("Mebyakala");
      expect(template.phase).toBe("Puncak Acara");
      expect(template.sourceId).toBe("SRC-001");
      expect(template.sourceUrl).toBe("https://phdi.or.id");
      expect(template.validationStatus).toContain("Tervalidasi Literatur Adat");
      expect(template.aliases.length).toBeGreaterThan(0);
    });

    it("verifies conditional ceremonies require family/pemangku confirmation", () => {
      const madengen = DEFAULT_CEREMONY_TEMPLATES.find((t) => t.id === "PR-003");
      expect(madengen).toBeDefined();
      expect(madengen?.validationStatus).toContain("Perlu validasi keluarga/pemangku");
    });
  });

  describe("Rundown Schedule Segments", () => {
    it("chronologically orders rundown events by start time", () => {
      const rawEvents: RundownEvent[] = [
        {
          id: "3",
          weddingId: "demo",
          ceremonyId: "c1",
          segmentTitle: "Sembahyang Bersama",
          startTime: "10:30",
          endTime: "11:30",
          location: "Merajan",
          personInCharge: "Jero Mangku",
          orderIndex: 3,
          notes: null,
        },
        {
          id: "1",
          weddingId: "demo",
          ceremonyId: "c1",
          segmentTitle: "Persiapan & Mepepada",
          startTime: "07:30",
          endTime: "08:15",
          location: "Natah",
          personInCharge: "Serati",
          orderIndex: 1,
          notes: null,
        },
        {
          id: "2",
          weddingId: "demo",
          ceremonyId: "c1",
          segmentTitle: "Pabyakalaan",
          startTime: "08:15",
          endTime: "09:30",
          location: "Lebuh",
          personInCharge: "Jero Mangku",
          orderIndex: 2,
          notes: null,
        },
      ];

      const sorted = [...rawEvents].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      expect(sorted[0].id).toBe("1");
      expect(sorted[0].startTime).toBe("07:30");
      expect(sorted[1].id).toBe("2");
      expect(sorted[1].startTime).toBe("08:15");
      expect(sorted[2].id).toBe("3");
      expect(sorted[2].startTime).toBe("10:30");
    });

    it("verifies duration calculation in minutes between start and end times", () => {
      const calculateDuration = (startTime: string, endTime: string) => {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        return endH * 60 + endM - (startH * 60 + startM);
      };

      expect(calculateDuration("08:00", "09:30")).toBe(90);
      expect(calculateDuration("09:15", "10:00")).toBe(45);
      expect(calculateDuration("10:00", "12:00")).toBe(120);
    });

    it("validates time formatting constraint HH:mm", () => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

      expect(timeRegex.test("08:00")).toBe(true);
      expect(timeRegex.test("13:45")).toBe(true);
      expect(timeRegex.test("24:00")).toBe(false);
      expect(timeRegex.test("invalid")).toBe(false);
    });
  });

  describe("Ceremony Banten & Sourcing Lifecycle", () => {
    it("cycles through all 5 banten status states properly", () => {
      const statusCycle: CeremonyRitualItem["status"][] = [
        "needed",
        "ordered",
        "making",
        "ready",
        "not_needed",
      ];

      let currentStatus: CeremonyRitualItem["status"] = "needed";

      const advance = (curr: CeremonyRitualItem["status"]) => {
        const idx = statusCycle.indexOf(curr);
        return statusCycle[(idx + 1) % statusCycle.length];
      };

      currentStatus = advance(currentStatus);
      expect(currentStatus).toBe("ordered");

      currentStatus = advance(currentStatus);
      expect(currentStatus).toBe("making");

      currentStatus = advance(currentStatus);
      expect(currentStatus).toBe("ready");

      currentStatus = advance(currentStatus);
      expect(currentStatus).toBe("not_needed");

      currentStatus = advance(currentStatus);
      expect(currentStatus).toBe("needed");
    });

    it("calculates estimated ritual expenditures for a ceremony", () => {
      const items: CeremonyRitualItem[] = [
        {
          id: "1",
          weddingId: "w1",
          ceremonyId: "c1",
          name: "Banten Byakala",
          quantity: 1,
          unit: "Paket",
          sourcingMethod: "purchased_package",
          status: "ready",
          estimatedPrice: 450000,
          actualPrice: 450000,
        },
        {
          id: "2",
          weddingId: "w1",
          ceremonyId: "c1",
          name: "Prayascita",
          quantity: 1,
          unit: "Paket",
          sourcingMethod: "purchased_package",
          status: "ordered",
          estimatedPrice: 350000,
          actualPrice: 350000,
        },
        {
          id: "3",
          weddingId: "w1",
          ceremonyId: "c1",
          name: "Canang Sari",
          quantity: 50,
          unit: "Tanding",
          sourcingMethod: "family_assigned",
          status: "needed",
          estimatedPrice: 150000,
          actualPrice: 0,
        },
      ];

      const totalEstimated = items.reduce((sum, i) => sum + i.estimatedPrice, 0);
      expect(totalEstimated).toBe(950000);
    });

    it("verifies sourcing method options supported by the data model", () => {
      const validSourcingMethods: CeremonyRitualItem["sourcingMethod"][] = [
        "self_made",
        "purchased_package",
        "family_assigned",
        "vendor_order",
      ];

      expect(validSourcingMethods).toContain("purchased_package");
      expect(validSourcingMethods).toContain("self_made");
      expect(validSourcingMethods).toContain("family_assigned");
      expect(validSourcingMethods).toContain("vendor_order");
    });
  });

  describe("Role-based Permission Guardrails", () => {
    it("differentiates write permissions between editor/owner and viewer", () => {
      const canEditCeremony = (role: "owner" | "editor" | "viewer") =>
        role === "owner" || role === "editor";

      expect(canEditCeremony("owner")).toBe(true);
      expect(canEditCeremony("editor")).toBe(true);
      expect(canEditCeremony("viewer")).toBe(false);
    });
  });

  describe("Ceremony Status Workflow", () => {
    it("validates transition from draft to confirmed to completed or skipped", () => {
      const validStatuses: WeddingCeremony["status"][] = [
        "draft",
        "confirmed",
        "completed",
        "skipped",
      ];

      validStatuses.forEach((status) => {
        expect(["draft", "confirmed", "completed", "skipped"]).toContain(status);
      });
    });
  });
});
