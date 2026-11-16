import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  calculateCountdown,
  calculateReadinessScore,
  getNextUpcomingCeremony,
} from "../src/features/overview/calculations";
import { calculateBudgetStats } from "../src/features/budget/seeds";
import type { WeddingWorkspace } from "../src/features/workspaces/types";
import type { WeddingCeremony } from "../src/features/ceremonies/types";
import type { BantenItem } from "../src/features/banten/types";
import type { WeddingTask } from "../src/features/checklist/types";
import type { BudgetItem } from "../src/features/budget/types";
import type { Vendor } from "../src/features/vendors/types";
import type { RundownEvent } from "../src/features/rundown/types";

describe("Overview Real Data Isolation, 2:1 Layout & Empty States (Issue #78)", () => {
  const rootDir = path.resolve(__dirname, "..");
  const srcDir = path.resolve(rootDir, "src");

  // Fixture A: Real in-progress wedding workspace with active custom data
  const weddingA: WeddingWorkspace = {
    id: "w-real-active",
    slug: "wayan-ketut-2027",
    coupleNames: "Wayan Gede & Ketut Ayu",
    groomName: "Wayan Gede Sentana",
    brideName: "Ni Ketut Ayu Saraswati",
    prospectiveDate: "2027-06-15",
    locationRegion: "Gianyar",
    marriageForm: "memadik",
    targetBudget: 120_000_000,
    notes: "Upacara di Griya Gianyar dengan dresta purusa.",
    createdBy: "user-alpha",
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  };

  const ceremoniesA: WeddingCeremony[] = [
    {
      id: "c-1",
      weddingId: weddingA.id,
      title: "Upacara Mapejati",
      scheduledDate: "2027-06-10",
      orderIndex: 1,
      status: "confirmed",
      location: "Merajan Gede",
      personInCharge: "Ida Pedanda Griya Gianyar",
    },
    {
      id: "c-2",
      weddingId: weddingA.id,
      title: "Puncak Pawiwahan & Mesakapan",
      scheduledDate: "2027-06-15",
      orderIndex: 2,
      status: "confirmed",
      location: "Bale Banjar",
      personInCharge: "Ida Pedanda Griya Gianyar",
    },
  ];

  const bantenA: BantenItem[] = [
    {
      id: "b-1",
      weddingId: weddingA.id,
      ceremonyId: "c-1",
      name: "Pejati Lengkap",
      category: "utama",
      quantity: 2,
      unit: "Dulang",
      sourcingMethod: "vendor_order",
      status: "ready",
      estimatedPrice: 500_000,
      actualPrice: 500_000,
    },
    {
      id: "b-2",
      weddingId: weddingA.id,
      ceremonyId: "c-2",
      name: "Banten Byakala & Prayascita",
      category: "utama",
      quantity: 1,
      unit: "Set",
      sourcingMethod: "family_assigned",
      status: "needed",
      estimatedPrice: 350_000,
      actualPrice: 0,
    },
  ];

  const tasksA: WeddingTask[] = [
    {
      id: "t-1",
      weddingId: weddingA.id,
      templateId: null,
      ceremonyId: "c-1",
      title: "Nunas Tirta Pakuluh ke Kahyangan Tiga",
      description: null,
      category: "adat",
      priority: "urgent",
      status: "todo",
      dueDate: "2027-06-08",
      assignedToUserId: null,
      assigneeName: "Wayan Gede",
      orderIndex: 1,
      completedAt: null,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "t-2",
      weddingId: weddingA.id,
      templateId: null,
      ceremonyId: null,
      title: "Pemberitahuan Krama Banjar & Prajuru",
      description: null,
      category: "administrasi",
      priority: "medium",
      status: "done",
      dueDate: "2027-05-01",
      assignedToUserId: null,
      assigneeName: "Wayan Gede",
      orderIndex: 2,
      completedAt: "2026-11-05T00:00:00Z",
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  ];

  const budgetA: BudgetItem[] = [
    {
      id: "bg-1",
      weddingId: weddingA.id,
      category: "upakara",
      title: "Paket Pokok Banten Pawiwahan",
      unit: "paket",
      quantity: 1,
      unitPrice: 35_000_000,
      plannedAmount: 35_000_000,
      actualAmount: 35_000_000,
      paidAmount: 15_000_000,
      paidBy: null,
      status: "paid_partial",
      linkedRitualItemId: null,
      linkedVendorId: null,
      notes: null,
      payments: [
        {
          id: "pay-1",
          weddingId: weddingA.id,
          budgetItemId: "bg-1",
          amount: 15_000_000,
          paymentDate: "2026-11-10",
          paymentMethod: "Transfer Bank",
          recipient: null,
          notes: null,
          receiptUrl: null,
          createdBy: null,
          createdAt: "2026-11-10T00:00:00Z",
        },
      ],
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "bg-2",
      weddingId: weddingA.id,
      category: "tempat_dekorasi",
      title: "Tetaring & Penjor Adat",
      unit: "paket",
      quantity: 1,
      unitPrice: 15_000_000,
      plannedAmount: 15_000_000,
      actualAmount: 12_000_000,
      paidAmount: 12_000_000,
      paidBy: null,
      status: "paid_full",
      linkedRitualItemId: null,
      linkedVendorId: null,
      notes: null,
      payments: [
        {
          id: "pay-2",
          weddingId: weddingA.id,
          budgetItemId: "bg-2",
          amount: 12_000_000,
          paymentDate: "2026-11-12",
          paymentMethod: "Tunai / Cash",
          recipient: null,
          notes: null,
          receiptUrl: null,
          createdBy: null,
          createdAt: "2026-11-12T00:00:00Z",
        },
      ],
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  ];

  const vendorsA: Vendor[] = [
    {
      id: "v-1",
      weddingId: weddingA.id,
      category: "dekorasi_tenda",
      name: "Sanggar Seni Penjor Gianyar",
      contactPerson: "Bli Made",
      phone: "08123456789",
      socialLink: null,
      quoteAmount: 12_000_000,
      status: "booked",
      picName: "Wayan",
      notes: null,
      agreedAmount: 12_000_000,
      paidAmount: 12_000_000,
      dueAmount: 0,
      linkedBudgetItems: [],
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  ];

  const rundownA: RundownEvent[] = [
    {
      id: "r-1",
      weddingId: weddingA.id,
      ceremonyId: null,
      scheduledDate: null,
      segmentTitle: "Penyambutan Besan & Saksi",
      startTime: "08:00",
      endTime: "09:00",
      location: "Pintu Masuk Bale Banjar",
      personInCharge: "Nyoman Pande",
      orderIndex: 1,
      notes: null,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  ];

  // Fixture B: Brand new empty wedding workspace
  const weddingB: WeddingWorkspace = {
    id: "w-real-new",
    slug: "made-kadek-2028",
    coupleNames: "Made & Kadek",
    groomName: null,
    brideName: null,
    prospectiveDate: null, // Date not yet set
    locationRegion: "Badung",
    marriageForm: "ngerorod",
    targetBudget: 50_000_000,
    notes: null,
    createdBy: "user-beta",
    createdAt: "2026-11-15T00:00:00Z",
    updatedAt: "2026-11-15T00:00:00Z",
  };

  describe("Fixture Comparison & Data Isolation (Wedding A vs Wedding B)", () => {
    it("computes accurate countdown for Wedding A without bleeding into Wedding B", () => {
      const refDate = "2027-01-01T00:00:00Z";

      const countdownA = calculateCountdown(weddingA.prospectiveDate, refDate);
      expect(countdownA.status).toBe("upcoming");
      expect(countdownA.daysRemaining).toBe(165);
      expect(countdownA.formattedDate).toContain("Juni 2027");

      // Wedding B has no prospective date
      const countdownB = calculateCountdown(weddingB.prospectiveDate, refDate);
      expect(countdownB.status).toBe("not_set");
      expect(countdownB.daysRemaining).toBeNull();
      expect(countdownB.milestoneLabel).toBe("Dewasa Ayu Belum Ditentukan");
    });

    it("computes independent readiness scores reflecting actual database entities", () => {
      const scoreA = calculateReadinessScore({
        ceremonies: ceremoniesA,
        bantenItems: bantenA,
        tasks: tasksA,
        budgetItems: budgetA,
        targetBudget: weddingA.targetBudget,
        vendors: vendorsA,
        rundownEvents: rundownA,
      });

      expect(scoreA.overallScore).toBeGreaterThan(0);
      expect(scoreA.overallScore).toBeLessThan(100);
      expect(scoreA.categories.banten.totalItems).toBe(2);
      expect(scoreA.categories.banten.completedItems).toBe(1);
      expect(scoreA.categories.tasks.totalItems).toBe(2);
      expect(scoreA.categories.tasks.completedItems).toBe(1);

      // Wedding B with zero entities and target budget set
      const scoreB = calculateReadinessScore({
        ceremonies: [],
        bantenItems: [],
        tasks: [],
        budgetItems: [],
        targetBudget: weddingB.targetBudget,
        vendors: [],
        rundownEvents: [],
      });

      // Setting a target budget contributes 30% to budget weight (10%), giving 3% overall
      expect(scoreB.overallScore).toBe(3);
      expect(scoreB.levelLabel).toBe("Persiapan Awal");
      expect(scoreB.categories.banten.totalItems).toBe(0);
      expect(scoreB.categories.banten.score).toBe(0);
      expect(scoreB.categories.ceremonies.totalItems).toBe(0);
      expect(scoreB.categories.tasks.totalItems).toBe(0);
      expect(scoreB.categories.vendors.totalItems).toBe(0);
      expect(scoreB.categories.rundown.totalItems).toBe(0);

      // Workspace with 0 target budget has strictly 0% readiness
      const scoreZero = calculateReadinessScore({
        ceremonies: [],
        bantenItems: [],
        tasks: [],
        budgetItems: [],
        targetBudget: 0,
        vendors: [],
        rundownEvents: [],
      });
      expect(scoreZero.overallScore).toBe(0);
    });

    it("extracts next upcoming ceremony specifically from Wedding A entities", () => {
      const nextA = getNextUpcomingCeremony({
        ceremonies: ceremoniesA,
        bantenItems: bantenA,
        tasks: tasksA,
        referenceDateInput: "2027-01-01",
      });

      expect(nextA).not.toBeNull();
      expect(nextA?.id).toBe("c-1");
      expect(nextA?.title).toBe("Upacara Mapejati");

      // Wedding B has no ceremonies
      const nextB = getNextUpcomingCeremony({
        ceremonies: [],
        bantenItems: [],
        tasks: [],
        referenceDateInput: "2027-01-01",
      });

      expect(nextB).toBeNull();
    });

    it("reconciles budget math strictly in integer IDR without double counting", () => {
      const budgetStatsA = calculateBudgetStats(budgetA, weddingA.targetBudget);

      // Total Actual: 35,000,000 + 12,000,000 = 47,000,000
      expect(budgetStatsA.totalActual).toBe(47_000_000);
      // Total Paid: 15,000,000 + 12,000,000 = 27,000,000
      expect(budgetStatsA.totalPaid).toBe(27_000_000);
      // Outstanding balance: 47,000,000 - 27,000,000 = 20,000,000
      expect(budgetStatsA.totalOutstanding).toBe(20_000_000);
      // Remaining Budget: 120,000,000 - 47,000,000 = 73,000,000
      expect(budgetStatsA.remainingBudget).toBe(73_000_000);
      expect(budgetStatsA.itemCount).toBe(2);
      expect(budgetStatsA.paymentCount).toBe(2);

      // Empty budget for Wedding B
      const budgetStatsB = calculateBudgetStats([], weddingB.targetBudget);
      expect(budgetStatsB.totalPlanned).toBe(0);
      expect(budgetStatsB.totalActual).toBe(0);
      expect(budgetStatsB.totalPaid).toBe(0);
      expect(budgetStatsB.totalOutstanding).toBe(0);
      expect(budgetStatsB.remainingBudget).toBe(weddingB.targetBudget);
      expect(budgetStatsB.itemCount).toBe(0);
      expect(budgetStatsB.paymentCount).toBe(0);
    });
  });

  describe("2:1 Grid Architecture & Component Verification (Metronic Demo 10)", () => {
    const dashboardComponentPath = path.resolve(
      srcDir,
      "features/overview/components/overview-dashboard.tsx"
    );

    it("verifies overview-dashboard.tsx implements the 2:1 column grid", () => {
      expect(fs.existsSync(dashboardComponentPath)).toBe(true);
      const content = fs.readFileSync(dashboardComponentPath, "utf-8");

      // 3-column container on desktop with #101/#114 token gap
      expect(content).toContain("grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-[30px]");
      // Main track (span 2)
      expect(content).toContain("lg:col-span-2");
      // Secondary highlights track (span 1)
      expect(content).toContain("lg:col-span-1");

      // Integration of modular overview cards
      expect(content).toContain("<CountdownCard");
      expect(content).toContain("<UpcomingCeremonyCard");
      expect(content).toContain("<ActionCenterCard");
      expect(content).toContain("<BantenOverviewCard");
      expect(content).toContain("<CeremonyList");
      expect(content).toContain("<ReadinessCard");
      expect(content).toContain("<BudgetOverviewCard");
      expect(content).toContain("<RundownOverviewCard");
      expect(content).toContain("<QuickModulesCard");
    });

    it("verifies budget-overview-card.tsx presents clear integer IDR metrics and empty state", () => {
      const budgetCardPath = path.resolve(
        srcDir,
        "features/overview/components/budget-overview-card.tsx"
      );
      expect(fs.existsSync(budgetCardPath)).toBe(true);
      const content = fs.readFileSync(budgetCardPath, "utf-8");

      expect(content).toContain("Total Komitmen");
      expect(content).toContain("Terbayar Lunas");
      expect(content).toContain("Belum Dibayar");
      expect(content).toContain("Sisa Pagu Dana");
      expect(content).toContain("formatRupiah");
      expect(content).toContain("Belum ada rincian pos pengeluaran");
      expect(content).toContain("Buat Pos Anggaran Pertama");
    });

    it("verifies banten-overview-card.tsx provides ready vs pending metrics and empty state", () => {
      const bantenCardPath = path.resolve(
        srcDir,
        "features/overview/components/banten-overview-card.tsx"
      );
      expect(fs.existsSync(bantenCardPath)).toBe(true);
      const content = fs.readFileSync(bantenCardPath, "utf-8");

      expect(content).toContain("Kebutuhan Banten & Sarana");
      expect(content).toContain("Siap / Dibuat");
      expect(content).toContain("Perlu Disiapkan");
      expect(content).toContain("Belum ada sarana banten yang ditambahkan");
      expect(content).toContain("Susun Kebutuhan Banten");
    });

    it("verifies rundown-overview-card.tsx provides schedule preview and empty state", () => {
      const rundownCardPath = path.resolve(
        srcDir,
        "features/overview/components/rundown-overview-card.tsx"
      );
      expect(fs.existsSync(rundownCardPath)).toBe(true);
      const content = fs.readFileSync(rundownCardPath, "utf-8");

      expect(content).toContain("Agenda Hari-H (Rundown)");
      expect(content).toContain(
        "Susunan jam-demi-jam hari perkawinan belum diatur"
      );
      expect(content).toContain("Susun Jadwal Acara");
    });

    it("verifies quick-modules-card.tsx aggregates checklist, vendor, and guest hubs", () => {
      const quickCardPath = path.resolve(
        srcDir,
        "features/overview/components/quick-modules-card.tsx"
      );
      expect(fs.existsSync(quickCardPath)).toBe(true);
      const content = fs.readFileSync(quickCardPath, "utf-8");

      expect(content).toContain("Tugas & Checklist");
      expect(content).toContain("Rekanan & Vendor");
      expect(content).toContain("Daftar Tamu Undangan");
      expect(content).toContain("/workspace/${weddingId}/tasks");
      expect(content).toContain("/workspace/${weddingId}/vendors");
      expect(content).toContain("/workspace/${weddingId}/guests");
    });
  });
});
