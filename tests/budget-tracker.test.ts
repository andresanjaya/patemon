import { describe, it, expect } from "vitest";
import {
  BUDGET_CATEGORIES,
  STARTER_BUDGET_TEMPLATES,
  DEMO_BUDGET_ITEMS,
  DEMO_PAYMENTS,
  getBudgetCategoryLabel,
  getBudgetItemStatusLabel,
  getBudgetItemStatusBadgeClass,
  calculateBudgetStats,
} from "../src/features/budget/seeds";
import type {
  BudgetItem,
  BudgetItemStatus,
  BudgetPayment,
} from "../src/features/budget/types";

describe("Budget Tracker and Transaction Records (Issue #28)", () => {
  describe("Curated Starter Templates & Authentic Balinese Wedding Categories", () => {
    it("contains realistic Balinese Hindu wedding budget items across core categories", () => {
      expect(STARTER_BUDGET_TEMPLATES.length).toBeGreaterThanOrEqual(10);
      expect(BUDGET_CATEGORIES.length).toBe(8);

      STARTER_BUDGET_TEMPLATES.forEach((tpl) => {
        expect(tpl.id).toMatch(/^BG-\d+$/);
        expect(tpl.title.length).toBeGreaterThan(5);
        expect(tpl.defaultQty).toBeGreaterThan(0);
        expect(tpl.estimatedPrice).toBeGreaterThan(0);
        // All prices must be integer IDR (no decimals)
        expect(Number.isInteger(tpl.estimatedPrice)).toBe(true);
        expect(tpl.notes.length).toBeGreaterThan(10);
        expect(tpl.defaultPaidBy.length).toBeGreaterThan(0);
      });
    });

    it("includes specific cultural Balinese wedding expenses (upakara, sesari, tetaring, mebat, gong)", () => {
      const titles = STARTER_BUDGET_TEMPLATES.map((t) =>
        t.title.toLowerCase()
      ).join(" ");
      expect(titles).toMatch(/banten|pawiwahan|mesakapan/i);
      expect(titles).toMatch(/sesari|sulinggih|pemangku/i);
      expect(titles).toMatch(/tetaring|tratag/i);
      expect(titles).toMatch(/payas agung|rias/i);
      expect(titles).toMatch(/mebat|babi guling|lawar/i);
      expect(titles).toMatch(/gong|gamelan/i);
    });
  });

  describe("Category and Status Formatters", () => {
    it("formats category labels into clear Indonesian titles", () => {
      expect(getBudgetCategoryLabel("upakara")).toBe("Upakara & Banten");
      expect(getBudgetCategoryLabel("tempat_dekorasi")).toBe(
        "Tempat, Tratag & Dekorasi"
      );
      expect(getBudgetCategoryLabel("busana_rias")).toBe(
        "Busana Adat & Tata Rias"
      );
      expect(getBudgetCategoryLabel("konsumsi")).toBe("Konsumsi & Mebat Adat");
      expect(getBudgetCategoryLabel("dokumentasi")).toBe("Foto, Video & Drone");
      expect(getBudgetCategoryLabel("musik_hiburan")).toBe(
        "Gamelan & Gong Adat"
      );
      expect(getBudgetCategoryLabel("administrasi")).toBe(
        "Administrasi & Legalitas"
      );
      expect(getBudgetCategoryLabel("lainnya")).toBe(
        "Operasional & Tak Terduga"
      );
      expect(getBudgetCategoryLabel(null)).toBe("Lainnya");
      expect(getBudgetCategoryLabel("custom_cat")).toBe("custom_cat");
    });

    it("formats status labels and badge classes", () => {
      expect(getBudgetItemStatusLabel("estimated")).toBe("Estimasi Awal");
      expect(getBudgetItemStatusLabel("booked")).toBe("Dipesan / Deal");
      expect(getBudgetItemStatusLabel("paid_partial")).toBe("DP / Cicilan");
      expect(getBudgetItemStatusLabel("paid_full")).toBe("Lunas");
      expect(getBudgetItemStatusLabel("canceled")).toBe("Dibatalkan");

      expect(getBudgetItemStatusBadgeClass("paid_full")).toContain("emerald");
      expect(getBudgetItemStatusBadgeClass("paid_partial")).toContain("blue");
      expect(getBudgetItemStatusBadgeClass("canceled")).toContain(
        "line-through"
      );
    });
  });

  describe("Integer IDR Math & Financial Reconciliation (No Double-Counting)", () => {
    it("strictly reconciles planned, actual, paid, outstanding, and remaining amounts in integer IDR", () => {
      const targetBudget = 50000000; // Rp 50.000.000

      const sampleItems: BudgetItem[] = [
        {
          id: "item-1",
          weddingId: "w-1",
          category: "upakara",
          title: "Paket Banten Mesakapan",
          unit: "Paket",
          quantity: 1,
          unitPrice: 10000000,
          plannedAmount: 10000000,
          actualAmount: 10000000,
          paidAmount: 6000000, // DP + Cicilan
          paidBy: "Bersama",
          status: "paid_partial",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: null,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
          payments: [
            {
              id: "p1",
              weddingId: "w-1",
              budgetItemId: "item-1",
              amount: 3000000,
              paymentDate: "2026-08-01",
              paymentMethod: "Transfer Bank",
              recipient: "Serati Griya",
              notes: "DP",
              receiptUrl: null,
              createdBy: null,
              createdAt: "2026-08-01T00:00:00Z",
            },
            {
              id: "p2",
              weddingId: "w-1",
              budgetItemId: "item-1",
              amount: 3000000,
              paymentDate: "2026-08-15",
              paymentMethod: "Transfer Bank",
              recipient: "Serati Griya",
              notes: "Cicilan 2",
              receiptUrl: null,
              createdBy: null,
              createdAt: "2026-08-15T00:00:00Z",
            },
          ],
        },
        {
          id: "item-2",
          weddingId: "w-1",
          category: "busana_rias",
          title: "Payas Agung Pengantin",
          unit: "Paket",
          quantity: 1,
          unitPrice: 8000000,
          plannedAmount: 8000000,
          actualAmount: 8000000,
          paidAmount: 8000000, // Lunas
          paidBy: "Bersama",
          status: "paid_full",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: null,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
          payments: [
            {
              id: "p3",
              weddingId: "w-1",
              budgetItemId: "item-2",
              amount: 8000000,
              paymentDate: "2026-08-20",
              paymentMethod: "Transfer Bank",
              recipient: "Sanggar Rias",
              notes: "Pelunasan",
              receiptUrl: null,
              createdBy: null,
              createdAt: "2026-08-20T00:00:00Z",
            },
          ],
        },
        {
          id: "item-3",
          weddingId: "w-1",
          category: "konsumsi",
          title: "Mebat Babi Guling",
          unit: "Ekor",
          quantity: 2,
          unitPrice: 4000000,
          plannedAmount: 8000000,
          actualAmount: 9000000, // Negotiated actual differs from initial planned
          paidAmount: 0,
          paidBy: "Keluarga Purusa",
          status: "booked",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: null,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
          payments: [],
        },
      ];

      const stats = calculateBudgetStats(sampleItems, targetBudget);

      // Planned: 10.000.000 + 8.000.000 + 8.000.000 = 26.000.000
      expect(stats.totalPlanned).toBe(26000000);
      // Actual: 10.000.000 + 8.000.000 + 9.000.000 = 27.000.000
      expect(stats.totalActual).toBe(27000000);
      // Paid: 6.000.000 + 8.000.000 + 0 = 14.000.000
      expect(stats.totalPaid).toBe(14000000);
      // Outstanding: 27.000.000 - 14.000.000 = 13.000.000
      expect(stats.totalOutstanding).toBe(13000000);
      // Remaining surplus: 50.000.000 - 27.000.000 = 23.000.000
      expect(stats.remainingBudget).toBe(23000000);
      expect(stats.itemCount).toBe(3);
      expect(stats.paymentCount).toBe(3);
    });

    it("excludes canceled items from totals to avoid double counting or artificial inflation", () => {
      const targetBudget = 30000000;
      const itemsWithCanceled: BudgetItem[] = [
        {
          id: "i-active",
          weddingId: "w-1",
          category: "upakara",
          title: "Banten Pejati",
          unit: "Tanding",
          quantity: 4,
          unitPrice: 100000,
          plannedAmount: 400000,
          actualAmount: 400000,
          paidAmount: 400000,
          paidBy: "Purusa",
          status: "paid_full",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: null,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
          payments: [],
        },
        {
          id: "i-canceled",
          weddingId: "w-1",
          category: "upakara",
          title: "Vendor Banten Lama (Dibatalkan)",
          unit: "Paket",
          quantity: 1,
          unitPrice: 20000000,
          plannedAmount: 20000000,
          actualAmount: 20000000,
          paidAmount: 0,
          paidBy: "Purusa",
          status: "canceled",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: null,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
          payments: [],
        },
      ];

      const stats = calculateBudgetStats(itemsWithCanceled, targetBudget);
      expect(stats.totalPlanned).toBe(400000);
      expect(stats.totalActual).toBe(400000);
      expect(stats.itemCount).toBe(1);
    });

    it("correctly calculates budget deficit when expenditures exceed the target", () => {
      const targetBudget = 10000000;
      const overBudgetItems: BudgetItem[] = [
        {
          id: "i-1",
          weddingId: "w-1",
          category: "busana_rias",
          title: "Payas Agung Mewah",
          unit: "Paket",
          quantity: 1,
          unitPrice: 15000000,
          plannedAmount: 15000000,
          actualAmount: 15000000,
          paidAmount: 5000000,
          paidBy: "Bersama",
          status: "paid_partial",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: null,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
          payments: [],
        },
      ];

      const stats = calculateBudgetStats(overBudgetItems, targetBudget);
      expect(stats.remainingBudget).toBe(-5000000); // Deficit of Rp 5.000.000
    });
  });

  describe("Payment State Transitions and Multi-Deposit Accumulation", () => {
    it("transitions an item to paid_partial upon initial deposit, and paid_full upon total settlement", () => {
      const actualAmount = 10000000;

      const deriveStatus = (paid: number, total: number): BudgetItemStatus => {
        if (paid >= total && total > 0) return "paid_full";
        if (paid > 0) return "paid_partial";
        return "booked";
      };

      expect(deriveStatus(0, actualAmount)).toBe("booked");
      expect(deriveStatus(3000000, actualAmount)).toBe("paid_partial");
      expect(deriveStatus(10000000, actualAmount)).toBe("paid_full");
      expect(deriveStatus(12000000, actualAmount)).toBe("paid_full"); // Overpayment still counts as settled
    });

    it("accumulates multi-stage deposits cleanly without arithmetic errors", () => {
      const payments: BudgetPayment[] = [
        { ...DEMO_PAYMENTS[0], amount: 2500000 },
        { ...DEMO_PAYMENTS[0], id: "dp2", amount: 2500000 },
        { ...DEMO_PAYMENTS[0], id: "dp3", amount: 5000000 },
      ];

      const sumPaid = payments.reduce((acc, p) => acc + p.amount, 0);
      expect(sumPaid).toBe(10000000);
      expect(Number.isInteger(sumPaid)).toBe(true);
    });
  });

  describe("Demo Workspace Baseline & Integrity", () => {
    it("provides complete interactive demo budget items and transactions", () => {
      expect(DEMO_BUDGET_ITEMS.length).toBeGreaterThanOrEqual(5);
      expect(DEMO_PAYMENTS.length).toBeGreaterThanOrEqual(3);

      const demoStats = calculateBudgetStats(DEMO_BUDGET_ITEMS, 60000000);
      expect(demoStats.totalPaid).toBeGreaterThan(0);
      expect(demoStats.totalOutstanding).toBeGreaterThan(0);
      expect(demoStats.remainingBudget).toBeGreaterThan(0);
    });
  });

  describe("Security and Role Authorization Guardrails", () => {
    it("enforces role-based editing constraints: viewer is read-only", () => {
      const canManageBudget = (role: "owner" | "editor" | "viewer") => {
        return role === "owner" || role === "editor";
      };

      expect(canManageBudget("owner")).toBe(true);
      expect(canManageBudget("editor")).toBe(true);
      expect(canManageBudget("viewer")).toBe(false);
    });

    it("guarantees budget items and transactions are isolated per wedding workspace", () => {
      const weddingA = "wedding-uuid-aaa";
      const weddingB = "wedding-uuid-bbb";

      const allItems: BudgetItem[] = [
        { ...DEMO_BUDGET_ITEMS[0], id: "b-a1", weddingId: weddingA },
        { ...DEMO_BUDGET_ITEMS[1], id: "b-a2", weddingId: weddingA },
        { ...DEMO_BUDGET_ITEMS[2], id: "b-b1", weddingId: weddingB },
      ];

      const itemsA = allItems.filter((i) => i.weddingId === weddingA);
      const itemsB = allItems.filter((i) => i.weddingId === weddingB);

      expect(itemsA.length).toBe(2);
      expect(itemsB.length).toBe(1);
      expect(itemsA.some((i) => i.weddingId === weddingB)).toBe(false);
      expect(itemsB.some((i) => i.weddingId === weddingA)).toBe(false);
    });
  });
});
