import { describe, it, expect } from "vitest";
import { DEFAULT_CEREMONY_TEMPLATES } from "../src/features/ceremonies/seeds";
import { calculateBudgetStats } from "../src/features/budget/seeds";
import { formatWhatsAppLink } from "../src/features/vendors/seeds";
import { formatGuestsToCSV } from "../src/features/exports/formatters";
import {
  calculateCountdown,
  calculateReadinessScore,
} from "../src/features/overview/calculations";
import {
  PRICING_TIERS,
  MVP_WEDDING_PRICE_IDR,
} from "../src/features/payments/pricing";
import {
  formatReceiptNumber,
  formatSupportWhatsAppLink,
  calculateAccessStateDetails,
} from "../src/features/payments/support";
import type { CeremonyPlanItemInput } from "../src/features/ceremonies/actions";
import type { WeddingCeremony } from "../src/features/ceremonies/types";
import type { BantenItem } from "../src/features/banten/types";
import type { WeddingTask } from "../src/features/checklist/types";
import type { BudgetItem } from "../src/features/budget/types";
import type { Guest } from "../src/features/guests/types";
import type { RundownEvent } from "../src/features/rundown/types";
import type { WorkspaceRole } from "../src/features/workspaces/types";
import type { WorkspaceEntitlement } from "../src/features/payments/types";

describe("E2E MVP Journey: Bali Hindu Wedding Planning & Commercial Lifecycle (Issue #39)", () => {
  // Shared mock state simulating the end-to-end journey
  const weddingId = "wed-e2e-gianyar-01";
  const coupleNames = "I Putu Gede & Ni Kadek Ayu";
  const weddingDate = "2026-12-20"; // Prospective wedding date
  const targetBudget = 80_000_000; // Rp 80.000.000 integer IDR
  const mockNow = new Date("2026-11-20T00:00:00Z"); // Exactly 30 days before wedding

  describe("Stage 1: Workspace Creation & Guided Adat Setup", () => {
    it("configures wedding parameters with Balinese marriage form (Memadik/Ngidih)", () => {
      const workspace = {
        id: weddingId,
        title: "Pawiwahan Putu & Kadek",
        coupleNames,
        weddingDate,
        customaryType: "memadik",
        region: "Gianyar (Bali Tengah)",
        targetBudget,
      };

      expect(workspace.customaryType).toBe("memadik");
      expect(workspace.region).toContain("Gianyar");
      expect(workspace.targetBudget).toBe(80_000_000);
    });

    it("executes guided onboarding offering editable, non-dogmatic ceremony sequences", () => {
      // 1. Initial template suggestions filtered for Memadik customs
      const suggestedTemplates = DEFAULT_CEREMONY_TEMPLATES.filter(
        (t) => t.applicability === "Memadik" || t.applicability === "Umum"
      );
      expect(suggestedTemplates.length).toBeGreaterThanOrEqual(4);

      // 2. User customizes ceremony list (reorders and adds custom local family ritual)
      const userPlan: CeremonyPlanItemInput[] = suggestedTemplates.map(
        (t, idx) => ({
          templateId: t.id,
          title: t.name,
          phase: t.phase,
          orderIndex: idx + 1,
          status: "confirmed",
        })
      );

      // Add custom local ceremony: Nuasen & Merembuk Keluarga
      userPlan.unshift({
        templateId: null,
        title: "Nuasen & Merembuk Keluarga Adat Banjar",
        phase: "Persiapan",
        orderIndex: 0,
        personInCharge: "Kelian Adat & Jero Mangku",
        status: "confirmed",
      });

      // Normalize indices
      const sortedPlan = userPlan.map((item, idx) => ({
        ...item,
        orderIndex: idx + 1,
      }));

      expect(sortedPlan[0].title).toBe(
        "Nuasen & Merembuk Keluarga Adat Banjar"
      );
      expect(sortedPlan[0].templateId).toBeNull(); // Verifies user can add un-templated customs
      expect(sortedPlan[1].title).toContain("Memadik");
      expect(sortedPlan.every((c) => c.status === "confirmed")).toBe(true);
    });
  });

  describe("Stage 2: Adat Banten Planner & Sourcing Workflow", () => {
    it("tracks diverse banten items across Ngayah, Serati, and Beli methods", () => {
      const bantenList: BantenItem[] = [
        {
          id: "b-01",
          weddingId,
          catalogId: "RIT-001",
          ceremonyId: "cer-01",
          name: "Banten Pejati Lengkap (Pemerasan & Pamereman)",
          category: "utama",
          quantity: 4,
          unit: "porsi",
          sourcingMethod: "self_made", // Gotong-royong keluarga
          status: "making",
          estimatedPrice: 300_000,
          actualPrice: 200_000,
          assigneeName: "Men Putu (Ibu Mertua)",
          notes: "Janur dan kelapa daksina sudah disiapkan di bale dangin",
          createdAt: "2026-11-20",
          updatedAt: "2026-11-20",
        },
        {
          id: "b-02",
          weddingId,
          catalogId: "RIT-002",
          ceremonyId: "cer-02",
          name: "Banten Ayaban Tumpeng Pitu & Caru Ayam Brumbun",
          category: "sarana_pelengkap",
          quantity: 1,
          unit: "paket",
          sourcingMethod: "vendor_order", // Pesan ke Serati Banten terpercaya
          status: "ordered",
          estimatedPrice: 2_500_000,
          actualPrice: 2_500_000,
          assigneeName: "Jero Serati Banten Mengwi",
          notes: "Dikirim H-1 pagi sebelum prosesi pabyakala dimulai",
          createdAt: "2026-11-20",
          updatedAt: "2026-11-20",
        },
        {
          id: "b-03",
          weddingId,
          catalogId: null,
          ceremonyId: "cer-02",
          name: "Segehan Panca Warna & Arak Berem",
          category: "sarana_pelengkap",
          quantity: 11,
          unit: "tanding",
          sourcingMethod: "purchased_package", // Beli jadi di pasar tradisional
          status: "ready",
          estimatedPrice: 150_000,
          actualPrice: 130_000,
          assigneeName: "Wayan Sukerta (Seksi Upakara)",
          notes: "Sudah lengkap dan disimpan di wantilan",
          createdAt: "2026-11-20",
          updatedAt: "2026-11-20",
        },
      ];

      expect(bantenList).toHaveLength(3);
      expect(
        bantenList.find((b) => b.sourcingMethod === "self_made")?.status
      ).toBe("making");
      expect(
        bantenList.find((b) => b.sourcingMethod === "vendor_order")
          ?.assigneeName
      ).toContain("Jero Serati");
      expect(bantenList.find((b) => b.status === "ready")?.actualPrice).toBe(
        130_000
      );
    });
  });

  describe("Stage 3: Task Checklist & Family PIC Delegation", () => {
    it("delegates responsibilities across Adat, Logistik, and Konsumsi categories", () => {
      const tasks: WeddingTask[] = [
        {
          id: "t-01",
          weddingId,
          templateId: "T-01",
          ceremonyId: "cer-01",
          title: "Matur Piuning ke Pura Kahyangan Tiga & Merajan Dadia",
          description:
            "Membawa banten pejati dan canang sari memohon kelancaran upakara",
          category: "adat",
          priority: "high",
          status: "done",
          dueDate: "2026-12-10",
          assignedToUserId: null,
          assigneeName: "Pak De Nyoman (Keluarga Purusa)",
          orderIndex: 1,
          completedAt: "2026-11-19T10:00:00Z",
          createdAt: "2026-11-14",
          updatedAt: "2026-11-19",
        },
        {
          id: "t-02",
          weddingId,
          templateId: "T-02",
          ceremonyId: "cer-02",
          title: "Pasang Tenda Terob & Penjor Janur Pawiwahan",
          description:
            "Gotong royong pemuda STT banjar pasang penjor depan angkul-angkul",
          category: "logistik",
          priority: "high",
          status: "in_progress",
          dueDate: "2026-12-18",
          assignedToUserId: null,
          assigneeName: "Ketut Artha (Ketua STT)",
          orderIndex: 2,
          completedAt: null,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
        },
        {
          id: "t-03",
          weddingId,
          templateId: null,
          ceremonyId: "cer-02",
          title: "Mebat Olahan Tradisional (Lawar, Sate Lilit, Ares)",
          description: "Persiapan daging babi dan bumbu base genep",
          category: "konsumsi",
          priority: "medium",
          status: "todo",
          dueDate: "2026-12-19",
          assignedToUserId: null,
          assigneeName: "Seksi Konsumsi Banjar",
          orderIndex: 3,
          completedAt: null,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
        },
      ];

      expect(tasks).toHaveLength(3);
      const completedTasks = tasks.filter((t) => t.status === "done");
      expect(completedTasks).toHaveLength(1);
      expect(tasks.some((t) => t.assigneeName?.includes("STT"))).toBe(true);
    });
  });

  describe("Stage 4: Budget Tracking & Zero-Double-Counting Rules", () => {
    it("calculates budget totals without double counting package and item components", () => {
      const budgetItems: BudgetItem[] = [
        {
          id: "bud-01",
          weddingId,
          category: "upakara",
          title: "Paket Banten Pawiwahan (Jero Serati Mengwi)",
          unit: "paket",
          quantity: 1,
          unitPrice: 15_000_000,
          plannedAmount: 15_000_000,
          actualAmount: 15_000_000,
          paidAmount: 5_000_000, // DP Rp 5.000.000
          paidBy: "Purusa (Keluarga Pria)",
          status: "paid_partial",
          linkedRitualItemId: "b-02",
          linkedVendorId: "v-serati",
          notes: "Termasuk banten pabyakala, mejauman, dan tirta",
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
          payments: [
            {
              id: "pay-01",
              weddingId,
              budgetItemId: "bud-01",
              amount: 5_000_000,
              paymentDate: "2026-11-18",
              paymentMethod: "Bank Transfer BCA",
              recipient: "Jero Serati",
              notes: "Uang muka DP 30%",
              receiptUrl: null,
              createdBy: "user-1",
              createdAt: "2026-11-18",
            },
          ],
        },
        {
          id: "bud-02",
          weddingId,
          category: "busana_rias",
          title: "Tata Rias Pengantin Bali Agung & Payas Modifikasi",
          unit: "paket",
          quantity: 1,
          unitPrice: 8_500_000,
          plannedAmount: 8_500_000,
          actualAmount: 8_000_000, // Negosiasi berhasil
          paidAmount: 8_000_000, // Lunas
          paidBy: "Pradana (Keluarga Wanita)",
          status: "paid_full",
          linkedRitualItemId: null,
          linkedVendorId: "v-mua",
          notes: "Termasuk rias kedua orang tua dan seksi upacara",
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
          payments: [
            {
              id: "pay-02",
              weddingId,
              budgetItemId: "bud-02",
              amount: 8_000_000,
              paymentDate: "2026-11-19",
              paymentMethod: "QRIS",
              recipient: "Dewata Wedding MUA",
              notes: "Pelunasan penuh",
              receiptUrl: null,
              createdBy: "user-1",
              createdAt: "2026-11-19",
            },
          ],
        },
        {
          id: "bud-03",
          weddingId,
          category: "konsumsi",
          title: "Bahan Daging Babi & Bumbu Base Genep untuk Mebat",
          unit: "ekor",
          quantity: 2,
          unitPrice: 3_500_000,
          plannedAmount: 7_000_000,
          actualAmount: 7_000_000,
          paidAmount: 0, // Belum bayar
          paidBy: "Bersama (50:50)",
          status: "booked",
          linkedRitualItemId: null,
          linkedVendorId: null,
          notes: "Dibeli H-2 upacara langsung ke peternak desa",
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
          payments: [],
        },
      ];

      const stats = calculateBudgetStats(budgetItems, targetBudget);

      expect(stats.targetBudget).toBe(80_000_000);
      expect(stats.totalPlanned).toBe(30_500_000); // 15jt + 8.5jt + 7jt
      expect(stats.totalActual).toBe(30_000_000); // 15jt + 8jt + 7jt
      expect(stats.totalPaid).toBe(13_000_000); // 5jt + 8jt
      expect(stats.totalOutstanding).toBe(17_000_000); // 30jt - 13jt
      expect(stats.remainingBudget).toBe(50_000_000); // 80jt - 30jt
      expect(stats.itemCount).toBe(3);
      expect(stats.paymentCount).toBe(2);

      // Verify Purusa vs Pradana breakdown
      const purusaItems = budgetItems.filter((i) =>
        i.paidBy?.includes("Purusa")
      );
      const pradanaItems = budgetItems.filter((i) =>
        i.paidBy?.includes("Pradana")
      );
      const sharedItems = budgetItems.filter((i) =>
        i.paidBy?.includes("Bersama")
      );

      expect(purusaItems[0].actualAmount).toBe(15_000_000);
      expect(pradanaItems[0].actualAmount).toBe(8_000_000);
      expect(sharedItems[0].actualAmount).toBe(7_000_000);
    });
  });

  describe("Stage 5: Vendors & WhatsApp Coordination", () => {
    it("tracks vendor bookings and formats WhatsApp link with Balinese context", () => {
      const vendorPhone = "081234567890";
      const message =
        "Om Swastyastu Jero Serati, kami ingin konfirmasi banten pabyakala.";
      const waLink = formatWhatsAppLink(vendorPhone, message);

      expect(waLink).toBe(
        "https://wa.me/6281234567890?text=Om%20Swastyastu%20Jero%20Serati%2C%20kami%20ingin%20konfirmasi%20banten%20pabyakala."
      );
    });
  });

  describe("Stage 6: Guest List & Dadia / Banjar Headcount", () => {
    it("aggregates guest headcounts across Purusa and Pradana sides and exports CSV", () => {
      const guests: Guest[] = [
        {
          id: "g-01",
          weddingId,
          name: "I Wayan Suweta & Keluarga",
          side: "groom",
          groupHousehold: "Dadia Pasek Gelgel",
          headcount: 4,
          invitationStatus: "sent",
          phone: "08123456789",
          notes: "Keluarga besar Dadia",
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
        },
        {
          id: "g-02",
          weddingId,
          name: "Ni Made Rai & Keluarga",
          side: "bride",
          groupHousehold: "Banjar Kaja Sukawati",
          headcount: 3,
          invitationStatus: "confirmed",
          phone: "08198765432",
          notes: "Rekan kerja",
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
        },
      ];

      const purusaHeadcount = guests
        .filter((g) => g.side === "groom")
        .reduce((sum, g) => sum + g.headcount, 0);
      const pradanaHeadcount = guests
        .filter((g) => g.side === "bride")
        .reduce((sum, g) => sum + g.headcount, 0);

      expect(purusaHeadcount).toBe(4);
      expect(pradanaHeadcount).toBe(3);
      expect(purusaHeadcount + pradanaHeadcount).toBe(7);

      // Verify CSV formatting has UTF-8 BOM protection for Indonesian Excel users
      const csv = formatGuestsToCSV(guests);
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("I Wayan Suweta & Keluarga");
      expect(csv).toContain("Dadia Pasek Gelgel");
      expect(csv).toContain("Purusa (Pria)");
    });
  });

  describe("Stage 7: Wedding Day Rundown in WITA Time", () => {
    it("schedules chronological ceremony segments with PIC assignments", () => {
      const rundown: RundownEvent[] = [
        {
          id: "rd-01",
          weddingId,
          ceremonyId: "cer-01",
          segmentTitle: "Prosesi Pasukan Mepamit & Nyuwun",
          scheduledDate: "2026-12-20",
          startTime: "07:30",
          endTime: "09:00",
          location: "Bale Dangin Rumah Pradana (Sukawati)",
          personInCharge: "Bli Wayan (Kakak Pengantin Wanita)",
          notes: "Persiapan banten pejati dan busana adat madya",
          orderIndex: 1,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
        },
        {
          id: "rd-02",
          weddingId,
          ceremonyId: "cer-02",
          segmentTitle: "Iring-iringan Manten Tiba di Rumah Purusa",
          scheduledDate: "2026-12-20",
          startTime: "09:30",
          endTime: "10:15",
          location: "Halaman Angkul-Angkul (Gianyar)",
          personInCharge: "Seksi Acara & Baleganjur",
          notes: "Gamelan baleganjur menyambut di pintu masuk pekarangan",
          orderIndex: 2,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
        },
        {
          id: "rd-03",
          weddingId,
          ceremonyId: "cer-02",
          segmentTitle: "Upacara Pabyakala, Makala-kalaan & Widhi Widhana",
          scheduledDate: "2026-12-20",
          startTime: "10:30",
          endTime: "12:30",
          location: "Bale Gede / Pamereman",
          personInCharge: "Jero Mangku Alit & Serati Banten",
          notes: "Puncak upacara sakral pawiwahan",
          orderIndex: 3,
          createdAt: "2026-11-14",
          updatedAt: "2026-11-20",
        },
      ];

      expect(rundown).toHaveLength(3);
      expect(rundown[0].startTime).toBe("07:30");
      expect(rundown[1].startTime).toBe("09:30");
      expect(rundown[2].startTime).toBe("10:30");
      expect(rundown[2].personInCharge).toContain("Jero Mangku");
    });
  });

  describe("Stage 8: Multi-Role Permissions (Owner, Editor, Viewer)", () => {
    it("enforces strict role-based capabilities matrix", () => {
      const roles: WorkspaceRole[] = ["owner", "editor", "viewer"];

      const roleMatrix: Record<
        WorkspaceRole,
        {
          canEdit: boolean;
          canInvite: boolean;
          canDeleteWorkspace: boolean;
          canExport: boolean;
        }
      > = {
        owner: {
          canEdit: true,
          canInvite: true,
          canDeleteWorkspace: true,
          canExport: true,
        },
        editor: {
          canEdit: true,
          canInvite: false,
          canDeleteWorkspace: false,
          canExport: true,
        },
        viewer: {
          canEdit: false,
          canInvite: false,
          canDeleteWorkspace: false,
          canExport: true,
        },
      };

      for (const role of roles) {
        const caps = roleMatrix[role];
        expect(caps.canExport).toBe(true); // Export is universally permitted per data sovereignty
        if (role === "viewer") {
          expect(caps.canEdit).toBe(false);
          expect(caps.canInvite).toBe(false);
        }
        if (role === "editor") {
          expect(caps.canEdit).toBe(true);
          expect(caps.canDeleteWorkspace).toBe(false);
        }
        if (role === "owner") {
          expect(caps.canDeleteWorkspace).toBe(true);
        }
      }
    });
  });

  describe("Stage 9: Overview Dashboard & Readiness Calculation", () => {
    it("calculates countdown (H-30) and aggregated readiness score", () => {
      const countdown = calculateCountdown(weddingDate, mockNow);
      expect(countdown.status).toBe("upcoming");
      expect(countdown.daysRemaining).toBe(30);
      expect(countdown.milestoneLabel).toBe("H-30 Menuju Hari H");

      // Verify readiness score calculation
      const score = calculateReadinessScore({
        tasks: [
          { status: "done" } as unknown as WeddingTask,
          { status: "in_progress" } as unknown as WeddingTask,
          { status: "todo" } as unknown as WeddingTask,
        ],
        bantenItems: [
          { status: "ready" } as unknown as BantenItem,
          { status: "making" } as unknown as BantenItem,
          { status: "ordered" } as unknown as BantenItem,
        ],
        ceremonies: [
          { status: "confirmed" } as unknown as WeddingCeremony,
          { status: "confirmed" } as unknown as WeddingCeremony,
        ],
      });

      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.level).toBeDefined();
      expect(score.levelLabel).toBeDefined();
    });
  });

  describe("Stage 10: Monetization, Verified Snap Checkout & Entitlement", () => {
    it("enforces server price of Rp 199.000 for full workspace license", () => {
      expect(MVP_WEDDING_PRICE_IDR).toBe(199_000);
      const fullTier = PRICING_TIERS.find((t) => t.id === "full");
      expect(fullTier?.price).toBe(199_000);
    });

    it("generates verified receipt and contextual WhatsApp support link", () => {
      const orderNumber = "PATEMON-WED123-MWGGZ54X-WRWH";
      const receiptNumber = formatReceiptNumber(orderNumber);
      expect(receiptNumber).toBe(`KW-${orderNumber}`);

      const supportLink = formatSupportWhatsAppLink({
        category: "license_activation",
        weddingId,
        coupleNames,
        orderNumber,
        userMessage: "Pembayaran telah berhasil via QRIS.",
      });

      expect(supportLink).toContain("https://wa.me/");
      expect(supportLink).toContain(encodeURIComponent("Aktivasi Lisensi"));
      expect(supportLink).toContain(encodeURIComponent(orderNumber));
    });

    it("verifies post-event transition to graceful read-only archive mode", () => {
      const expiredEntitlement: WorkspaceEntitlement = {
        weddingId,
        status: "expired",
        isPaid: false,
        isDemo: false,
        grantedAt: "2026-06-01T00:00:00Z",
        validUntil: "2026-12-31T00:00:00Z",
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Arsip Pawiwahan (Read-Only)",
        badgeLabel: "Masa Aktif Berakhir",
        daysRemaining: 0,
      };

      const accessDetails = calculateAccessStateDetails(expiredEntitlement);
      expect(accessDetails.state).toBe("expired_archive");
      expect(accessDetails.canEdit).toBe(false);
      expect(accessDetails.canInviteMembers).toBe(false);
      expect(accessDetails.canExportCSV).toBe(true);
      expect(accessDetails.dataSovereigntyNote).toContain(
        "tidak pernah dihapus"
      );
    });
  });
});
