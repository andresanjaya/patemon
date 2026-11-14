import { describe, expect, it } from "vitest";
import {
  calculateCountdown,
  calculateReadinessScore,
  getUrgentActions,
  getNextUpcomingCeremony,
} from "../src/features/overview/calculations";
import type { WeddingCeremony } from "../src/features/ceremonies/types";
import type { BantenItem } from "../src/features/banten/types";
import type { WeddingTask } from "../src/features/checklist/types";
import type { BudgetItem } from "../src/features/budget/types";
import type { Vendor } from "../src/features/vendors/types";
import type { RundownEvent } from "../src/features/rundown/types";

function createMockTask(
  overrides: Partial<WeddingTask> & { id: string; title: string }
): WeddingTask {
  return {
    weddingId: "w1",
    templateId: null,
    ceremonyId: null,
    description: null,
    category: "adat",
    priority: "medium",
    status: "todo",
    dueDate: null,
    assignedToUserId: null,
    assigneeName: null,
    orderIndex: 1,
    completedAt: null,
    createdAt: "2026-11-14",
    updatedAt: "2026-11-14",
    ...overrides,
  };
}

describe("Overview Dashboard & Readiness Calculations (Issue #32)", () => {
  const referenceDate = new Date("2026-11-14T00:00:00Z");

  describe("calculateCountdown", () => {
    it("handles null or empty date gracefully", () => {
      const countdown = calculateCountdown(null);
      expect(countdown.status).toBe("not_set");
      expect(countdown.daysRemaining).toBeNull();
      expect(countdown.milestoneLabel).toBe("Dewasa Ayu Belum Ditentukan");
    });

    it("calculates future countdown accurately (H-30)", () => {
      const countdown = calculateCountdown("2026-12-14", referenceDate);
      expect(countdown.status).toBe("upcoming");
      expect(countdown.daysRemaining).toBe(30);
      expect(countdown.milestoneLabel).toContain("H-30");
      expect(countdown.formattedDate).toBeDefined();
    });

    it("identifies H-1 correctly", () => {
      const countdown = calculateCountdown("2026-11-15", referenceDate);
      expect(countdown.status).toBe("upcoming");
      expect(countdown.daysRemaining).toBe(1);
      expect(countdown.milestoneLabel).toContain("H-1");
    });

    it("identifies today (Hari H) correctly", () => {
      const countdown = calculateCountdown("2026-11-14", referenceDate);
      expect(countdown.status).toBe("today");
      expect(countdown.daysRemaining).toBe(0);
      expect(countdown.milestoneLabel).toContain("Rahina Pawiwahan");
    });

    it("handles past dates correctly", () => {
      const countdown = calculateCountdown("2026-11-10", referenceDate);
      expect(countdown.status).toBe("past");
      expect(countdown.daysRemaining).toBe(4);
      expect(countdown.milestoneLabel).toContain("Telah Terlaksana");
    });
  });

  describe("calculateReadinessScore", () => {
    it("returns 0% and 'persiapan_awal' for completely empty workspace", () => {
      const score = calculateReadinessScore({});
      expect(score.overallScore).toBe(0);
      expect(score.level).toBe("persiapan_awal");
      expect(score.categories.banten.score).toBe(0);
      expect(score.categories.ceremonies.score).toBe(0);
    });

    it("calculates partial readiness when items are in progress", () => {
      const ceremonies: WeddingCeremony[] = [
        {
          id: "c1",
          weddingId: "w1",
          title: "Upacara Memadik",
          scheduledDate: "2026-12-01",
          location: "Bale Dangin",
          personInCharge: "Wayan",
          orderIndex: 1,
          status: "confirmed",
        },
      ];

      const bantenItems: BantenItem[] = [
        {
          id: "b1",
          weddingId: "w1",
          name: "Pejati",
          category: "utama",
          quantity: 2,
          unit: "tanding",
          sourcingMethod: "self_made",
          status: "ready",
          estimatedPrice: 200000,
          actualPrice: 200000,
        },
        {
          id: "b2",
          weddingId: "w1",
          name: "Sorohan",
          category: "madya",
          quantity: 1,
          unit: "paket",
          sourcingMethod: "vendor_order",
          status: "making",
          estimatedPrice: 500000,
          actualPrice: 500000,
        },
      ];

      const tasks: WeddingTask[] = [
        createMockTask({
          id: "t1",
          title: "Sewa tenda",
          category: "logistik",
          priority: "high",
          status: "done",
          dueDate: "2026-11-20",
        }),
      ];

      const score = calculateReadinessScore({
        ceremonies,
        bantenItems,
        tasks,
      });

      expect(score.overallScore).toBeGreaterThan(20);
      expect(score.categories.ceremonies.score).toBe(100); // Has date and location
      expect(score.categories.banten.score).toBeGreaterThan(70); // 1 ready, 1 making
      expect(score.categories.tasks.score).toBe(100); // 1 done
    });

    it("awards 100% and 'siap_hari_h' when all dimensions are fully fulfilled", () => {
      const ceremonies: WeddingCeremony[] = [
        {
          id: "c1",
          weddingId: "w1",
          title: "Mewidhi Widhana",
          scheduledDate: "2026-12-01",
          location: "Pamerajan",
          personInCharge: "Gede",
          orderIndex: 1,
          status: "confirmed",
        },
      ];

      const bantenItems: BantenItem[] = [
        {
          id: "b1",
          weddingId: "w1",
          name: "Banten Pejati & Suci",
          category: "utama",
          quantity: 1,
          unit: "paket",
          sourcingMethod: "family_assigned",
          status: "ready",
          estimatedPrice: 1000000,
          actualPrice: 1000000,
        },
      ];

      const tasks: WeddingTask[] = [
        createMockTask({
          id: "t1",
          title: "Konfirmasi Pemangku",
          category: "upacara",
          priority: "urgent",
          status: "done",
          dueDate: "2026-11-25",
        }),
      ];

      const budgetItems: BudgetItem[] = [
        {
          id: "bg1",
          weddingId: "w1",
          category: "upakara",
          title: "Paket Banten",
          unit: "paket",
          quantity: 1,
          unitPrice: 5000000,
          plannedAmount: 5000000,
          actualAmount: 5000000,
          paidAmount: 5000000,
          paidBy: "Purusa",
          status: "paid_full",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: null,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-14",
          payments: [],
        },
      ];

      const vendors: Vendor[] = [
        {
          id: "v1",
          weddingId: "w1",
          category: "busana_rias",
          name: "Salon Ayodya",
          contactPerson: "Ibu Ketut",
          phone: "08123456789",
          socialLink: null,
          quoteAmount: 4000000,
          status: "booked",
          picName: "Luh",
          notes: null,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-14",
          agreedAmount: 4000000,
          paidAmount: 4000000,
          dueAmount: 0,
          linkedBudgetItems: [],
        },
      ];

      const rundownEvents: RundownEvent[] = Array.from(
        { length: 8 },
        (_, i) => ({
          id: `r${i}`,
          weddingId: "w1",
          ceremonyId: "c1",
          segmentTitle: `Acara ${i + 1}`,
          scheduledDate: "2026-12-01",
          startTime: "08:00",
          endTime: "09:00",
          location: "Bale Dangin",
          personInCharge: "Kadek",
          orderIndex: i + 1,
          notes: null,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-14",
        })
      );

      const score = calculateReadinessScore({
        ceremonies,
        bantenItems,
        tasks,
        budgetItems,
        targetBudget: 10000000,
        vendors,
        rundownEvents,
      });

      expect(score.overallScore).toBe(100);
      expect(score.level).toBe("siap_hari_h");
      expect(score.levelLabel).toBe("Siap Menuju Hari H");
    });
  });

  describe("getUrgentActions", () => {
    it("flags overdue tasks as urgent priority", () => {
      const tasks: WeddingTask[] = [
        createMockTask({
          id: "t-overdue",
          title: "Bayar DP Serati Banten",
          category: "upakara",
          priority: "urgent",
          status: "todo",
          dueDate: "2026-11-10", // 4 days ago
        }),
        createMockTask({
          id: "t-future",
          title: "Beli Penjor",
          category: "dekorasi",
          priority: "medium",
          status: "todo",
          dueDate: "2026-12-01",
        }),
      ];

      const actions = getUrgentActions({
        weddingId: "w1",
        tasks,
        referenceDateInput: referenceDate,
      });

      expect(actions.length).toBeGreaterThan(0);
      const overdue = actions.find((a) => a.id === "task-overdue-t-overdue");
      expect(overdue).toBeDefined();
      expect(overdue?.isOverdue).toBe(true);
      expect(overdue?.priority).toBe("urgent");
    });

    it("flags needed banten without sources", () => {
      const bantenItems: BantenItem[] = [
        {
          id: "b-need",
          weddingId: "w1",
          name: "Banten Suci Alit",
          category: "utama",
          quantity: 1,
          unit: "soroh",
          sourcingMethod: "vendor_order",
          status: "needed",
          estimatedPrice: 1500000,
          actualPrice: 0,
        },
      ];

      const actions = getUrgentActions({
        weddingId: "w1",
        bantenItems,
        referenceDateInput: referenceDate,
      });

      const bantenAction = actions.find((a) => a.type === "banten");
      expect(bantenAction).toBeDefined();
      expect(bantenAction?.actionUrl).toContain("/banten");
    });

    it("flags unscheduled ceremonies", () => {
      const ceremonies: WeddingCeremony[] = [
        {
          id: "c-unscheduled",
          weddingId: "w1",
          title: "Upacara Madengen-dengen",
          scheduledDate: null,
          location: "Halaman Tengah",
          personInCharge: null,
          orderIndex: 1,
          status: "draft",
        },
      ];

      const actions = getUrgentActions({
        weddingId: "w1",
        ceremonies,
        referenceDateInput: referenceDate,
      });

      const ceremonyAction = actions.find((a) => a.type === "ceremony");
      expect(ceremonyAction).toBeDefined();
      expect(ceremonyAction?.actionUrl).toContain("/ceremonies");
    });
  });

  describe("getNextUpcomingCeremony", () => {
    it("returns null if ceremonies list is empty", () => {
      const ceremony = getNextUpcomingCeremony({ ceremonies: [] });
      expect(ceremony).toBeNull();
    });

    it("selects the earliest upcoming ceremony", () => {
      const ceremonies: WeddingCeremony[] = [
        {
          id: "c-late",
          weddingId: "w1",
          title: "Resepsi Adat",
          scheduledDate: "2026-12-10",
          location: "Bale Banjar",
          personInCharge: "Made",
          orderIndex: 2,
          status: "confirmed",
        },
        {
          id: "c-early",
          weddingId: "w1",
          title: "Upacara Memadik",
          scheduledDate: "2026-11-20",
          location: "Griya Pradana",
          personInCharge: "Ketut",
          orderIndex: 1,
          status: "confirmed",
        },
      ];

      const bantenItems: BantenItem[] = [
        {
          id: "b1",
          weddingId: "w1",
          ceremonyId: "c-early",
          name: "Canang Sari",
          category: "sarana_pelengkap",
          quantity: 20,
          unit: "celemik",
          sourcingMethod: "self_made",
          status: "ready",
          estimatedPrice: 50000,
          actualPrice: 50000,
        },
      ];

      const next = getNextUpcomingCeremony({
        ceremonies,
        bantenItems,
        referenceDateInput: referenceDate,
      });

      expect(next).toBeDefined();
      expect(next?.id).toBe("c-early");
      expect(next?.title).toBe("Upacara Memadik");
      expect(next?.daysUntil).toBe(6); // 2026-11-20 minus 2026-11-14
      expect(next?.bantenCount).toBe(1);
    });
  });
});
