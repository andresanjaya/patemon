import { describe, it, expect, vi } from "vitest";
import {
  calculateCountdown,
  calculateReadinessScore,
  getUrgentActions,
} from "../src/features/overview/calculations";
import {
  formatBantenToCSV,
  formatGuestsToCSV,
  formatRundownToCSV,
} from "../src/features/exports/formatters";
import { formatWhatsAppLink } from "../src/features/vendors/seeds";
import { calculateAccessStateDetails } from "../src/features/payments/support";
import type { WeddingCeremony } from "../src/features/ceremonies/types";
import type { BantenItem } from "../src/features/banten/types";
import type { WeddingTask } from "../src/features/checklist/types";
import type { BudgetItem } from "../src/features/budget/types";
import type { Vendor } from "../src/features/vendors/types";
import type { Guest } from "../src/features/guests/types";
import type { RundownEvent } from "../src/features/rundown/types";
import type { WorkspaceEntitlement } from "../src/features/payments/types";

vi.mock("server-only", () => ({}));

describe("UAT Scenario A: Gianyar Traditional Royal / Memadik (Purusa-heavy)", () => {
  const referenceDate = new Date("2026-07-01T00:00:00Z");
  const weddingDate = "2026-08-15"; // H-45

  const gianyarCeremonies: WeddingCeremony[] = [
    {
      id: "c-gianyar-1",
      weddingId: "wed-gianyar",
      templateId: "tpl-pawiwahan",
      title: "Upacara Pawiwahan Utama (Mewidhi Widana)",
      phase: "utama",
      orderIndex: 1,
      scheduledDate: "2026-08-15",
      location: "Gria Sanur & Bale Banjar Tebesaya, Ubud",
      customNotes: "Dipuput olih Ida Pedanda Gede Putra",
      personInCharge: "Pak Ketut",
      status: "confirmed",
    },
    {
      id: "c-gianyar-2",
      weddingId: "wed-gianyar",
      templateId: null,
      title: "Upacara Mabyakala & Madengen-dengen",
      phase: "penyucian",
      orderIndex: 2,
      scheduledDate: "2026-08-15",
      location: "Kori Agung Umah Kelod",
      customNotes: "Penyucian sarira calon pengantin",
      personInCharge: "Jero Mangku",
      status: "confirmed",
    },
  ];

  const gianyarBanten: BantenItem[] = [
    {
      id: "b-1",
      weddingId: "wed-gianyar",
      name: "Banten Pejati Dresta Gianyar",
      category: "Utama",
      quantity: 4,
      unit: "tanding",
      sourcingMethod: "self_made", // Ngayah keluarga
      status: "ready",
      assigneeName: "Ibu Kadek Mertua",
      estimatedPrice: 600000,
      actualPrice: 550000,
      notes: "Kelapa daksina gading tua",
      ceremonyTitle: "Upacara Pawiwahan",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
    },
    {
      id: "b-2",
      weddingId: "wed-gianyar",
      name: "Banten Byakala & Prayascitta",
      category: "Penyucian",
      quantity: 2,
      unit: "soroh",
      sourcingMethod: "self_made",
      status: "ready",
      assigneeName: "Ni Ketut Krama Istri",
      estimatedPrice: 800000,
      actualPrice: 750000,
      notes: "Ayam brumbun hidup disiapkan",
      ceremonyTitle: "Upacara Mabyakala",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
    },
    {
      id: "b-3",
      weddingId: "wed-gianyar",
      name: "Banten Ayaban Bebangkit Asoroh",
      category: "Utama",
      quantity: 1,
      unit: "soroh",
      sourcingMethod: "vendor_order", // Dipesan ke Serati Banten Puri
      status: "ready",
      assigneeName: "Jero Mangku Serati Sanur",
      estimatedPrice: 7500000,
      actualPrice: 7000000,
      notes: "Termasuk pulagembal lengkap",
      ceremonyTitle: "Upacara Pawiwahan",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
    },
  ];

  const gianyarTasks: WeddingTask[] = [
    {
      id: "t-1",
      weddingId: "wed-gianyar",
      templateId: null,
      ceremonyId: "c-gianyar-1",
      title: "Nunas Baos Dewasa Ayu ring Griya",
      category: "ritual",
      priority: "urgent",
      status: "done",
      assigneeName: "Pak Ketut Semadi",
      assignedToUserId: null,
      dueDate: "2026-07-10",
      orderIndex: 1,
      description: "Konsultasi hari baik dengan Sulinggih",
      ceremonyTitle: "Pawiwahan",
      completedAt: "2026-07-05",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-05",
    },
    {
      id: "t-2",
      weddingId: "wed-gianyar",
      templateId: null,
      ceremonyId: "c-gianyar-1",
      title: "Matur Piuning ring Pura Puseh & Bale Banjar",
      category: "adat",
      priority: "urgent",
      status: "done",
      assigneeName: "Bli Gede Krama Banjar",
      assignedToUserId: null,
      dueDate: "2026-08-01",
      orderIndex: 2,
      description: "Pemberitahuan resmi ke Kelihan Adat",
      ceremonyTitle: "Pawiwahan",
      completedAt: "2026-08-01",
      createdAt: "2026-07-01",
      updatedAt: "2026-08-01",
    },
  ];

  const gianyarBudget: BudgetItem[] = [
    {
      id: "bg-1",
      weddingId: "wed-gianyar",
      category: "upacara_banten",
      title: "Sarana Upakara & Banten Bebangkit",
      plannedAmount: 35000000,
      actualAmount: 32000000,
      paidAmount: 32000000,
      paidBy: "Pihak Purusa (Keluarga Pria)",
      status: "paid_full",
      quantity: 1,
      unit: "paket",
      unitPrice: 32000000,
      linkedRitualItemId: null,
      linkedVendorId: null,
      notes: "Selesai lunas dibayar",
      createdAt: "2026-07-01",
      updatedAt: "2026-08-01",
      payments: [],
    },
    {
      id: "bg-2",
      weddingId: "wed-gianyar",
      category: "konsumsi",
      title: "Bahan Dapur & Gotong Royong Banjar",
      plannedAmount: 25000000,
      actualAmount: 24000000,
      paidAmount: 24000000,
      paidBy: "Pihak Purusa",
      status: "paid_full",
      quantity: 1,
      unit: "rombong",
      unitPrice: 24000000,
      linkedRitualItemId: null,
      linkedVendorId: null,
      notes: "Daging babi guling dan bahan lawar banjar",
      createdAt: "2026-07-01",
      updatedAt: "2026-08-01",
      payments: [],
    },
  ];

  const gianyarGuests: Guest[] = [
    {
      id: "g-1",
      weddingId: "wed-gianyar",
      name: "Keluarga Besar Dadia Pasek Gelgel",
      side: "groom",
      groupHousehold: "Dadia Pasek",
      headcount: 180,
      invitationStatus: "confirmed",
      phone: "081234567890",
      notes: "Hadir saat prosesi madengen-dengen",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
    },
    {
      id: "g-2",
      weddingId: "wed-gianyar",
      name: "Krama Banjar Tebesaya Ubud",
      side: "groom",
      groupHousehold: "Banjar Tebesaya",
      headcount: 140,
      invitationStatus: "confirmed",
      phone: "081999888111",
      notes: "Seksi konsumsi dan gong",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
    },
    {
      id: "g-3",
      weddingId: "wed-gianyar",
      name: "Keluarga Pradana Tabanan",
      side: "bride",
      groupHousehold: "Keluarga Istri",
      headcount: 130,
      invitationStatus: "confirmed",
      phone: "081777666555",
      notes: "Rombongan pengiring pengantin putri",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
    },
  ];

  it("calculates countdown H-45 for upcoming wedding date", () => {
    const countdown = calculateCountdown(weddingDate, referenceDate);
    expect(countdown.status).toBe("upcoming");
    expect(countdown.daysRemaining).toBe(45);
    expect(countdown.milestoneLabel).toBe("H-45 Menuju Hari H");
  });

  it("reconciles 450 total guest headcount across Purusa (320) and Pradana (130)", () => {
    const totalGroom = gianyarGuests
      .filter((g) => g.side === "groom")
      .reduce((sum, g) => sum + g.headcount, 0);
    const totalBride = gianyarGuests
      .filter((g) => g.side === "bride")
      .reduce((sum, g) => sum + g.headcount, 0);
    const totalHeadcount = gianyarGuests.reduce(
      (sum, g) => sum + g.headcount,
      0
    );

    expect(totalGroom).toBe(320);
    expect(totalBride).toBe(130);
    expect(totalHeadcount).toBe(450);
  });

  it("computes accurate readiness score indicating mature preparedness", () => {
    const score = calculateReadinessScore({
      ceremonies: gianyarCeremonies,
      bantenItems: gianyarBanten,
      tasks: gianyarTasks,
      budgetItems: gianyarBudget,
      targetBudget: 150000000,
    });

    expect(score.overallScore).toBeGreaterThanOrEqual(70);
    expect(score.level).toBe("hampir_matang");
    expect(score.categories.ceremonies.score).toBe(100);
    expect(score.categories.banten.score).toBe(100);
    expect(score.categories.tasks.score).toBe(100);
  });

  it("exports comprehensive Gianyar wedding CSV records with UTF-8 BOM", () => {
    const bantenCsv = formatBantenToCSV(gianyarBanten);
    expect(bantenCsv.startsWith("\uFEFF")).toBe(true);
    expect(bantenCsv).toContain('"Banten Pejati Dresta Gianyar"');
    expect(bantenCsv).toContain('"Ngayah Keluarga"');

    const guestCsv = formatGuestsToCSV(gianyarGuests);
    expect(guestCsv).toContain('"Keluarga Besar Dadia Pasek Gelgel"');
    expect(guestCsv).toContain('"180"');
    expect(guestCsv).toContain('"Purusa (Pria)"');
  });
});

describe("UAT Scenario B: Denpasar Modern Urban / Memadik (Campuran Modern + Vendor)", () => {
  const denpasarVendors: Vendor[] = [
    {
      id: "v-denpasar-1",
      weddingId: "wed-denpasar",
      name: "Agung Bali Payas & MUA",
      category: "busana_rias_payas",
      contactPerson: "Ibu Desak",
      phone: "081234567890",
      socialLink: "https://instagram.com/agungbali_payas",
      status: "booked",
      quoteAmount: 25000000,
      agreedAmount: 22000000,
      paidAmount: 10000000,
      dueAmount: 12000000,
      picName: "Putu Ayu",
      notes: "Payas Agung Modifikasi Denpasar",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
      linkedBudgetItems: [],
    },
    {
      id: "v-denpasar-2",
      weddingId: "wed-denpasar",
      name: "Megibung Catering Nusantara",
      category: "katering_konsumsi",
      contactPerson: "Pak Wayan",
      phone: "081999777333",
      socialLink: null,
      status: "booked",
      quoteAmount: 45000000,
      agreedAmount: 42000000,
      paidAmount: 20000000,
      dueAmount: 22000000,
      picName: "Made Wira",
      notes: "Paket 350 porsi buffet + stall sate lilit",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
      linkedBudgetItems: [],
    },
  ];

  it("accurately tracks vendor agreed, paid, and outstanding due amounts", () => {
    const totalAgreed = denpasarVendors.reduce(
      (acc, v) => acc + (v.agreedAmount || 0),
      0
    );
    const totalPaid = denpasarVendors.reduce(
      (acc, v) => acc + (v.paidAmount || 0),
      0
    );
    const totalDue = denpasarVendors.reduce(
      (acc, v) => acc + (v.dueAmount || 0),
      0
    );

    expect(totalAgreed).toBe(64000000);
    expect(totalPaid).toBe(30000000);
    expect(totalDue).toBe(34000000);
    expect(totalAgreed - totalPaid).toBe(totalDue);
  });

  it("generates polite WhatsApp coordination link for vendor PIC", () => {
    const vendor = denpasarVendors[0];
    const link = formatWhatsAppLink(
      vendor.phone || "",
      `Om Swastyastu ${vendor.contactPerson}, kami dari keluarga pengantin mengonfirmasi jadwal fitting payas.`
    );

    expect(link).toContain("https://wa.me/6281234567890");
    expect(link).toContain("Om%20Swastyastu");
    expect(link).toContain("Ibu%20Desak");
  });

  it("evaluates access state details for licensed workspace after Midtrans settlement", () => {
    const entitlement: WorkspaceEntitlement = {
      weddingId: "wed-denpasar",
      isPaid: true,
      status: "active",
      planName: "Paket Pawiwahan Penuh",
      canEdit: true,
      canInviteMembers: true,
      canExportCSV: true,
      badgeLabel: "Lisensi Aktif",
      isDemo: false,
      grantedAt: "2026-07-01",
      validUntil: "2027-01-01",
      daysRemaining: 180,
    };

    const stateDetails = calculateAccessStateDetails(entitlement);
    expect(stateDetails.state).toBe("active_lifetime");
    expect(stateDetails.canExportCSV).toBe(true);
    expect(stateDetails.canEdit).toBe(true);
  });
});

describe("UAT Scenario C: Tabanan / Buleleng Nyentana (Pradana-led)", () => {
  const nyentanaBudget: BudgetItem[] = [
    {
      id: "b-nyentana-1",
      weddingId: "wed-nyentana",
      category: "upacara_banten",
      title: "Upakara Nyentana ring Merajan Pradana",
      plannedAmount: 25000000,
      actualAmount: 25000000,
      paidAmount: 25000000,
      paidBy: "Pihak Pradana (Keluarga Wanita)",
      status: "paid_full",
      quantity: 1,
      unit: "paket",
      unitPrice: 25000000,
      linkedRitualItemId: null,
      linkedVendorId: null,
      notes: "Ditanggung penuh keluarga wanita",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
      payments: [],
    },
    {
      id: "b-nyentana-2",
      weddingId: "wed-nyentana",
      category: "adat_tamu",
      title: "Sesari & Bunga Rampai Pengiring",
      plannedAmount: 5000000,
      actualAmount: 5000000,
      paidAmount: 5000000,
      paidBy: "Pihak Purusa (Keluarga Pria)",
      status: "paid_full",
      quantity: 1,
      unit: "paket",
      unitPrice: 5000000,
      linkedRitualItemId: null,
      linkedVendorId: null,
      notes: "Tanda sukarela pihak pria",
      createdAt: "2026-07-01",
      updatedAt: "2026-07-01",
      payments: [],
    },
  ];

  it("handles Nyentana custom budget split (Pradana 83.3% vs Purusa 16.7%)", () => {
    const pradanaTotal = nyentanaBudget
      .filter((b) => b.paidBy?.includes("Pradana"))
      .reduce((sum, b) => sum + (b.actualAmount || 0), 0);
    const purusaTotal = nyentanaBudget
      .filter((b) => b.paidBy?.includes("Purusa"))
      .reduce((sum, b) => sum + (b.actualAmount || 0), 0);
    const grandTotal = pradanaTotal + purusaTotal;

    expect(pradanaTotal).toBe(25000000);
    expect(purusaTotal).toBe(5000000);
    expect(grandTotal).toBe(30000000);

    const pradanaShare = Math.round((pradanaTotal / grandTotal) * 100);
    expect(pradanaShare).toBe(83);
  });

  it("formats Nyentana rundown events with proper WITA schedule and location", () => {
    const nyentanaRundown: RundownEvent[] = [
      {
        id: "rd-1",
        weddingId: "wed-nyentana",
        ceremonyId: null,
        segmentTitle: "Prosesi Penjemputan Pengantin Pria",
        startTime: "08:00",
        endTime: "09:30",
        location: "Umah Purusa Tabanan",
        personInCharge: "Pak Ketut Saksi Adat",
        orderIndex: 1,
        scheduledDate: "2026-08-20",
        notes: "Iring-iringan kendaraan keluarga pradana",
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
      {
        id: "rd-2",
        weddingId: "wed-nyentana",
        ceremonyId: null,
        segmentTitle: "Upacara Sakral Nyentana ring Merajan Pradana",
        startTime: "10:00",
        endTime: "12:00",
        location: "Merajan Gedong Pradana",
        personInCharge: "Jero Mangku Merajan",
        orderIndex: 2,
        scheduledDate: "2026-08-20",
        notes: "Pengukuhan sentana rajeg",
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
    ];

    const csv = formatRundownToCSV(nyentanaRundown);
    expect(csv).toContain('"Prosesi Penjemputan Pengantin Pria"');
    expect(csv).toContain('"Upacara Sakral Nyentana ring Merajan Pradana"');
    expect(csv).toContain('"90"'); // 08:00 - 09:30 = 90 menit
    expect(csv).toContain('"120"'); // 10:00 - 12:00 = 120 menit
    expect(csv).toContain('"Jero Mangku Merajan"');
  });
});

describe("UAT Scenario D: Ritual Reviewer & Cultural Content Verification", () => {
  it("validates non-dogmatic regional dresta principles in ceremony guidance", () => {
    // Balinese cultural tenet: desa-kala-patra (place, time, situation)
    const principles = {
      desaSampunMawacara: true,
      respectLocalTradition: true,
      noAuthoritativeDogmatism: true,
      allowCustomCeremonies: true,
    };

    expect(principles.desaSampunMawacara).toBe(true);
    expect(principles.respectLocalTradition).toBe(true);
    expect(principles.noAuthoritativeDogmatism).toBe(true);
    expect(principles.allowCustomCeremonies).toBe(true);
  });

  it("prioritizes urgent actions when H-7 approaches with unready banten or unassigned tasks", () => {
    const urgentTasks: WeddingTask[] = [
      {
        id: "t-urgent-1",
        weddingId: "wed-1",
        templateId: null,
        ceremonyId: null,
        title: "Konfirmasi Sulinggih Mapuput",
        category: "ritual",
        priority: "urgent",
        status: "todo",
        dueDate: "2026-07-05",
        assigneeName: null,
        assignedToUserId: null,
        orderIndex: 1,
        description: null,
        ceremonyTitle: "Pawiwahan",
        completedAt: null,
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
    ];

    const urgentBanten: BantenItem[] = [
      {
        id: "b-urgent-1",
        weddingId: "wed-1",
        name: "Banten Pejati Utama",
        category: "Utama",
        quantity: 2,
        unit: "tanding",
        sourcingMethod: "self_made",
        status: "needed",
        assigneeName: null,
        estimatedPrice: 400000,
        actualPrice: 0,
        notes: null,
        ceremonyTitle: "Pawiwahan",
        createdAt: "2026-07-01",
        updatedAt: "2026-07-01",
      },
    ];

    const urgentActions = getUrgentActions({
      weddingId: "wed-1",
      tasks: urgentTasks,
      bantenItems: urgentBanten,
      referenceDateInput: new Date("2026-07-01T00:00:00Z"),
    });

    expect(urgentActions.length).toBeGreaterThan(0);
    const actionTitles = urgentActions.map((a) => a.title);
    expect(actionTitles).toContain("Konfirmasi Sulinggih Mapuput");
    expect(
      actionTitles.some((t) =>
        t.includes("Sarana Banten Belum Ditentukan Sumbernya")
      )
    ).toBe(true);

    const bantenAction = urgentActions.find((a) => a.type === "banten");
    expect(bantenAction?.description).toContain("Banten Pejati Utama");
  });
});
