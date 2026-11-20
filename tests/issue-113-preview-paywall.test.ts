import { describe, it, expect } from "vitest";
import {
  getRelativeDate,
  getPreviewCeremonies,
  getPreviewCeremonyById,
  getPreviewBantenItems,
  getPreviewTasks,
  getPreviewBudgetItems,
  getPreviewVendors,
  getPreviewGuests,
  getPreviewRundown,
  getPreviewActivityLogs,
} from "../src/features/preview/preview-data";
import { checkFeatureAccess } from "../src/features/payments/entitlements";

describe("Issue #113: Complete Preview Data & Interaction Paywall", () => {
  const weddingId = "test-preview-workspace";

  describe("1. Relative Dynamic Date Generation", () => {
    it("generates realistic future dates relative to current execution date", () => {
      const today = new Date().toISOString().split("T")[0];
      const futureDate = getRelativeDate(30);

      expect(futureDate).toBeDefined();
      expect(typeof futureDate).toBe("string");
      expect(futureDate > today).toBe(true);
    });

    it("generates realistic past dates relative to current execution date", () => {
      const today = new Date().toISOString().split("T")[0];
      const pastDate = getRelativeDate(-7);

      expect(pastDate).toBeDefined();
      expect(typeof pastDate).toBe("string");
      expect(pastDate < today).toBe(true);
    });
  });

  describe("2. Comprehensive Sample Data for Unpaid / Demo Workspaces", () => {
    it("provides interconnected ceremonies with non-empty schedules", () => {
      const ceremonies = getPreviewCeremonies(weddingId);
      expect(ceremonies.length).toBeGreaterThanOrEqual(3);

      const memadik = ceremonies.find((c) => c.title.includes("Memadik"));
      expect(memadik).toBeDefined();
      expect(memadik?.weddingId).toBe(weddingId);
      expect(memadik?.scheduledDate).toBe(getRelativeDate(-20));

      const pabyakala = ceremonies.find((c) => c.title.includes("Mebyakala"));
      expect(pabyakala).toBeDefined();
      expect(pabyakala?.weddingId).toBe(weddingId);
      expect(pabyakala?.scheduledDate).toBe(getRelativeDate(30));
    });

    it("provides interconnected banten items with realistic Balinese offerings", () => {
      const banten = getPreviewBantenItems(weddingId);
      expect(banten.length).toBeGreaterThanOrEqual(4);
      expect(banten.some((b) => b.name.includes("Pejati"))).toBe(true);
      expect(banten.every((b) => b.weddingId === weddingId)).toBe(true);
    });

    it("provides tasks with relative target dates without overdue artifacts", () => {
      const tasks = getPreviewTasks(weddingId);
      expect(tasks.length).toBeGreaterThanOrEqual(5);
      expect(tasks.every((t) => t.weddingId === weddingId)).toBe(true);
      expect(
        tasks.some(
          (t) => t.title.includes("Hari Baik") || t.title.includes("Banten")
        )
      ).toBe(true);
    });

    it("provides budget items with realistic Balinese ceremony categories and payments", () => {
      const budget = getPreviewBudgetItems(weddingId);
      expect(budget.length).toBeGreaterThanOrEqual(5);
      expect(budget.every((b) => b.weddingId === weddingId)).toBe(true);
      expect(budget.some((b) => b.category === "upakara")).toBe(true);
      expect(budget.every((b) => b.plannedAmount > 0)).toBe(true);
    });

    it("provides vendors with contact and portfolio statistics", () => {
      const { vendors, stats } = getPreviewVendors(weddingId);
      expect(vendors.length).toBeGreaterThanOrEqual(3);
      expect(vendors.every((v) => v.weddingId === weddingId)).toBe(true);
      expect(stats.totalVendors).toBe(vendors.length);
    });

    it("provides guest list with banjar/dadia groups and RSVP headcount", () => {
      const { guests, stats } = getPreviewGuests(weddingId);
      expect(guests.length).toBeGreaterThanOrEqual(3);
      expect(guests.every((g) => g.weddingId === weddingId)).toBe(true);
      expect(stats.totalInvitations).toBe(guests.length);
      expect(stats.totalHeadcount).toBeGreaterThan(0);
    });

    it("provides rundown with sequential timeline and WITA times", () => {
      const { events, stats } = getPreviewRundown(weddingId);
      expect(events.length).toBeGreaterThanOrEqual(3);
      expect(events.every((e) => e.weddingId === weddingId)).toBe(true);
      expect(stats.totalEvents).toBe(events.length);
    });

    it("provides activity logs audit trail with realistic timeline", () => {
      const logs = getPreviewActivityLogs(weddingId);
      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs.every((l) => l.weddingId === weddingId)).toBe(true);
      expect(logs[0].entityType).toBeDefined();
    });
  });

  describe("3. Server Entitlement Fail-Closed Guardrails", () => {
    it("strictly blocks mutating actions for unpaid / demo preview workspaces", async () => {
      const editCheck = await checkFeatureAccess("demo", "edit");
      expect(editCheck.allowed).toBe(false);
      expect(editCheck.reason).toContain(
        "Mode Demo tidak mengizinkan penyimpanan permanen."
      );

      const inviteCheck = await checkFeatureAccess("demo", "invite");
      expect(inviteCheck.allowed).toBe(false);
      expect(inviteCheck.reason).toContain("Akses Penuh Pawiwahan");

      // Export remains available in demo mode for offline contingency
      const exportCheck = await checkFeatureAccess("demo", "export");
      expect(exportCheck.allowed).toBe(true);
    });
  });
});
