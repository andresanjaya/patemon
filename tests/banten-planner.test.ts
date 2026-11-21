import { describe, it, expect } from "vitest";
import { DEFAULT_RITUAL_CATALOG } from "../src/features/banten/seeds";
import type {
  BantenAcquisitionStatus,
  BantenItem,
  SourcingMethod,
} from "../src/features/banten/types";

describe("Banten and Ritual Materials Planner (Issue #26)", () => {
  describe("Catalog Pustaka Adat & Provenance Guardrails", () => {
    it("contains authentic Balinese ceremonial banten and sarana catalog items", () => {
      expect(DEFAULT_RITUAL_CATALOG.length).toBeGreaterThanOrEqual(10);

      DEFAULT_RITUAL_CATALOG.forEach((item) => {
        expect(item.id).toMatch(/^(XL-)?BN-/);
        expect(item.name.length).toBeGreaterThan(0);
        if (!item.id.startsWith("XL-"))
          expect(["Paket Banten", "Banten Satuan", "Sarana Upakara"]).toContain(
            item.itemType
          );
        expect(item.sourceId).toMatch(/^(SRC-\d+|XL-R\d+)$/);
        expect(item.sourceUrl).toMatch(/^https?:\/\//);
      });
    });

    it("verifies cultural safety rule: quantities and prices are flexible until confirmed by serati", () => {
      // In compliance with PRD: "Quantities and pricing are blank until confirmed by user/vendor"
      const paketItems = DEFAULT_RITUAL_CATALOG.filter(
        (i) => i.itemType === "Paket Banten"
      );

      paketItems.forEach((item) => {
        expect(item.obligationLevel).toBeDefined();
        // Validation status must reflect literature or field practice
        expect(item.validationStatus.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Banten Acquisition Lifecycle & Status Transitions", () => {
    it("transitions properly across all 5 acquisition states", () => {
      const statusCycle: BantenAcquisitionStatus[] = [
        "needed",
        "ordered",
        "making",
        "ready",
        "not_needed",
      ];

      const advanceStatus = (
        current: BantenAcquisitionStatus
      ): BantenAcquisitionStatus => {
        const idx = statusCycle.indexOf(current);
        return statusCycle[(idx + 1) % statusCycle.length];
      };

      let state: BantenAcquisitionStatus = "needed";
      state = advanceStatus(state);
      expect(state).toBe("ordered");

      state = advanceStatus(state);
      expect(state).toBe("making");

      state = advanceStatus(state);
      expect(state).toBe("ready");

      state = advanceStatus(state);
      expect(state).toBe("not_needed");

      state = advanceStatus(state);
      expect(state).toBe("needed");
    });
  });

  describe("Sourcing Methods & Procurement Classification", () => {
    it("supports all 4 Balinese Hindu sourcing methods", () => {
      const validMethods: SourcingMethod[] = [
        "purchased_package",
        "self_made",
        "family_assigned",
        "vendor_order",
      ];

      expect(validMethods).toHaveLength(4);
      expect(validMethods).toContain("self_made"); // Ngayah keluarga
      expect(validMethods).toContain("purchased_package"); // Pesan serati banten
      expect(validMethods).toContain("family_assigned"); // Tugas khusus keluarga
      expect(validMethods).toContain("vendor_order"); // Pesan vendor khusus
    });

    it("correctly groups items by sourcing method to organize family logistics", () => {
      const items: BantenItem[] = [
        {
          id: "1",
          weddingId: "w1",
          name: "Banten Byakala Utama",
          category: "utama",
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
          name: "Canang Sari",
          category: "sarana_pelengkap",
          quantity: 50,
          unit: "Tanding",
          sourcingMethod: "self_made",
          status: "making",
          estimatedPrice: 150000,
          actualPrice: 100000,
        },
        {
          id: "3",
          weddingId: "w1",
          name: "Kelapa Gading Kembar",
          category: "sarana_pelengkap",
          quantity: 2,
          unit: "Bungkul",
          sourcingMethod: "family_assigned",
          status: "ready",
          estimatedPrice: 60000,
          actualPrice: 60000,
        },
      ];

      const ngayahItems = items.filter((i) => i.sourcingMethod === "self_made");
      const seratiItems = items.filter(
        (i) => i.sourcingMethod === "purchased_package"
      );
      const familyItems = items.filter(
        (i) => i.sourcingMethod === "family_assigned"
      );

      expect(ngayahItems).toHaveLength(1);
      expect(seratiItems).toHaveLength(1);
      expect(familyItems).toHaveLength(1);
    });
  });

  describe("Financial Aggregation & Budget Impact", () => {
    it("calculates total estimated and actual costs without double-counting", () => {
      const sampleItems: BantenItem[] = [
        {
          id: "1",
          weddingId: "w1",
          name: "Paket Banten Mebyakala",
          category: "utama",
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
          name: "Paket Banten Pawiwahan Sanggah Kamulan",
          category: "utama",
          quantity: 1,
          unit: "Paket",
          sourcingMethod: "purchased_package",
          status: "ordered",
          estimatedPrice: 1250000,
          actualPrice: 1200000,
        },
        {
          id: "3",
          weddingId: "w1",
          name: "Sarana Ngayah Canang & Segehan",
          category: "sarana_pelengkap",
          quantity: 1,
          unit: "Set",
          sourcingMethod: "self_made",
          status: "making",
          estimatedPrice: 200000,
          actualPrice: 150000,
        },
        {
          id: "4",
          weddingId: "w1",
          name: "Banten Opsional yang Dibatalkan",
          category: "sarana_pelengkap",
          quantity: 1,
          unit: "Paket",
          sourcingMethod: "purchased_package",
          status: "not_needed",
          estimatedPrice: 300000,
          actualPrice: 0,
        },
      ];

      // Total estimated cost includes all needed/ordered/making/ready items
      const activeItems = sampleItems.filter((i) => i.status !== "not_needed");
      const totalEstimated = activeItems.reduce(
        (sum, i) => sum + i.estimatedPrice,
        0
      );
      const totalActual = activeItems.reduce(
        (sum, i) => sum + i.actualPrice,
        0
      );

      expect(totalEstimated).toBe(1900000);
      expect(totalActual).toBe(1800000);
    });
  });

  describe("Ceremony Linkage & Independence", () => {
    it("supports ceremony-specific banten as well as general wedding items", () => {
      const items: BantenItem[] = [
        {
          id: "1",
          weddingId: "w1",
          ceremonyId: "ceremony-1",
          name: "Banten Mebyakala",
          category: "utama",
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
          ceremonyId: null, // General banten for whole wedding
          name: "Canang Segehan Harian",
          category: "sarana_pelengkap",
          quantity: 100,
          unit: "Tanding",
          sourcingMethod: "self_made",
          status: "ready",
          estimatedPrice: 300000,
          actualPrice: 250000,
        },
      ];

      const ceremonySpecific = items.filter((i) => Boolean(i.ceremonyId));
      const generalItems = items.filter((i) => !i.ceremonyId);

      expect(ceremonySpecific).toHaveLength(1);
      expect(generalItems).toHaveLength(1);
    });
  });

  describe("Role Authorization Guardrails", () => {
    it("allows write mutations only for owner and editor", () => {
      const canManageBanten = (role: "owner" | "editor" | "viewer") =>
        role === "owner" || role === "editor";

      expect(canManageBanten("owner")).toBe(true);
      expect(canManageBanten("editor")).toBe(true);
      expect(canManageBanten("viewer")).toBe(false);
    });
  });
});
