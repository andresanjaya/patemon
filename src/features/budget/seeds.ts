import type {
  BudgetItem,
  BudgetItemStatus,
  BudgetItemTemplate,
  BudgetPayment,
  BudgetStats,
} from "./types";

export const BUDGET_CATEGORIES = [
  {
    id: "upakara",
    label: "Upakara & Banten",
    desc: "Paket banten pawiwahan, sesari sulinggih, tirta pakuluh",
  },
  {
    id: "tempat_dekorasi",
    label: "Tempat, Tratag & Dekorasi",
    desc: "Tetaring banjar, penjor, sound system, pelaminan adat",
  },
  {
    id: "busana_rias",
    label: "Busana Adat & Tata Rias",
    desc: "Payas agung/madya pengantin, rias keluarga, busana seragam",
  },
  {
    id: "konsumsi",
    label: "Konsumsi & Mebat Adat",
    desc: "Babi guling, olahan lawar sekaa banjar, konsumsi ngayah",
  },
  {
    id: "dokumentasi",
    label: "Foto, Video & Drone",
    desc: "Dokumentasi mesakapan, video cinematic, album kolase",
  },
  {
    id: "musik_hiburan",
    label: "Gamelan & Gong Adat",
    desc: "Sekaa gong banjar, gender wayang, kidung/pesantian",
  },
  {
    id: "administrasi",
    label: "Administrasi & Legalitas",
    desc: "Surat banjar, dinas catatan sipil, akta perkawinan",
  },
  {
    id: "lainnya",
    label: "Operasional & Tak Terduga",
    desc: "Transportasi keluarga, dana tak terduga, logistik harian",
  },
];

export const PAYMENT_METHODS = [
  "Transfer Bank",
  "Tunai / Cash",
  "QRIS",
  "Kartu Debit / Kredit",
];

export const STARTER_BUDGET_TEMPLATES: BudgetItemTemplate[] = [
  {
    id: "BG-001",
    category: "upakara",
    title: "Paket Pokok Banten Pawiwahan (Mebyakala, Dengen-dengen, Mesakapan)",
    unit: "Paket",
    defaultQty: 1,
    estimatedPrice: 7500000,
    notes:
      "Paket sarana banten lengkap dari Serati Banten terpercaya untuk seluruh prosesi inti.",
    defaultPaidBy: "Bersama (Kedua Mempelai)",
  },
  {
    id: "BG-002",
    category: "upakara",
    title: "Sesari & Dana Punia Sulinggih / Pemangku Merajan",
    unit: "Orang",
    defaultQty: 2,
    estimatedPrice: 1500000,
    notes:
      "Penghormatan dan persembahan sesari kepada Ida Pedanda dan Pemangku yang muput upacara.",
    defaultPaidBy: "Keluarga Purusa",
  },
  {
    id: "BG-003",
    category: "tempat_dekorasi",
    title: "Pemasangan Tetaring / Tratag & Sewa Kursi Banjar",
    unit: "Set",
    defaultQty: 1,
    estimatedPrice: 4000000,
    notes:
      "Anyaman kelapa tetaring gotong royong krama banjar beserta sewa teratak pelindung cuaca.",
    defaultPaidBy: "Keluarga Purusa",
  },
  {
    id: "BG-004",
    category: "tempat_dekorasi",
    title: "Dekorasi Penjor Janur & Panggung Pengantin Adat Bali",
    unit: "Paket",
    defaultQty: 1,
    estimatedPrice: 6000000,
    notes:
      "Sepasang penjor megah di depan pekarangan serta dekorasi gebyok adat Bali.",
    defaultPaidBy: "Bersama (Kedua Mempelai)",
  },
  {
    id: "BG-005",
    category: "busana_rias",
    title: "Sewa Busana Payas Agung Mempelai & Tata Rias (MUA)",
    unit: "Paket",
    defaultQty: 1,
    estimatedPrice: 8500000,
    notes:
      "Busana Payas Agung lengkap mahkota emas/badong, kain prada, dan rias sanggar adat.",
    defaultPaidBy: "Bersama (Kedua Mempelai)",
  },
  {
    id: "BG-006",
    category: "busana_rias",
    title: "Rias & Busana Seragam Keluarga Inti (Orang Tua & Saudara)",
    unit: "Orang",
    defaultQty: 6,
    estimatedPrice: 500000,
    notes: "Tata rias dan busana adat madya untuk orang tua kedua belah pihak.",
    defaultPaidBy: "Bersama (Kedua Mempelai)",
  },
  {
    id: "BG-007",
    category: "konsumsi",
    title: "Bahan Mebat Adat Banjar (Babi Guling & Daging Lawar)",
    unit: "Ekor",
    defaultQty: 2,
    estimatedPrice: 4500000,
    notes:
      "Bahan mentah babi guling dan bumbu mebat untuk konsumsi tradisi bersama krama banjar.",
    defaultPaidBy: "Keluarga Purusa",
  },
  {
    id: "BG-008",
    category: "konsumsi",
    title: "Konsumsi Jamuan Prasmanan Tamu & Undangan",
    unit: "Porsi",
    defaultQty: 200,
    estimatedPrice: 45000,
    notes:
      "Hidangan prasmanan lezat untuk keluarga besar dan para undangan resepsi.",
    defaultPaidBy: "Bersama (Kedua Mempelai)",
  },
  {
    id: "BG-009",
    category: "dokumentasi",
    title: "Jasa Foto & Video Liputan Upacara Pawiwahan (Full Day)",
    unit: "Hari",
    defaultQty: 1,
    estimatedPrice: 5000000,
    notes:
      "Fotografer & videografer khusus mengabadikan momen sakral dari pagi hingga resepsi.",
    defaultPaidBy: "Bersama (Kedua Mempelai)",
  },
  {
    id: "BG-010",
    category: "musik_hiburan",
    title: "Punia Sekaa Gong Banjar / Tabuh Gender Wayang",
    unit: "Sekaa",
    defaultQty: 1,
    estimatedPrice: 2000000,
    notes:
      "Punia sekaa tabuh gamelan tradisional pengiring jalannya prosesi upacara mesakapan.",
    defaultPaidBy: "Keluarga Purusa",
  },
  {
    id: "BG-011",
    category: "administrasi",
    title: "Administrasi Surat Banjar Adat & Dinas Catatan Sipil",
    unit: "Paket",
    defaultQty: 1,
    estimatedPrice: 500000,
    notes:
      "Legalisasi surat keterangan perkawinan banjar dan akta perkawinan resmi Disdukcapil.",
    defaultPaidBy: "Keluarga Purusa",
  },
  {
    id: "BG-012",
    category: "lainnya",
    title: "Dana Cadangan Operasional & Tak Terduga",
    unit: "Paket",
    defaultQty: 1,
    estimatedPrice: 3000000,
    notes:
      "Alokasi dana darurat untuk perlengkapan tambahan atau kebutuhan mendadak.",
    defaultPaidBy: "Bersama (Kedua Mempelai)",
  },
];

export const DEMO_PAYMENTS: BudgetPayment[] = [
  {
    id: "demo-pay-1",
    weddingId: "demo",
    budgetItemId: "demo-bg-1",
    amount: 3000000,
    paymentDate: "2026-08-15",
    paymentMethod: "Transfer Bank",
    recipient: "Serati Banten Griya Sanur",
    notes: "Uang muka (DP) pemesanan paket banten utama",
    receiptUrl: null,
    createdBy: null,
    createdAt: "2026-08-15T10:00:00Z",
  },
  {
    id: "demo-pay-2",
    weddingId: "demo",
    budgetItemId: "demo-bg-2",
    amount: 3000000,
    paymentDate: "2026-08-20",
    paymentMethod: "Transfer Bank",
    recipient: "Sanggar Rias Kusuma Adat",
    notes: "Uang muka booking tanggal busana payas agung",
    receiptUrl: null,
    createdBy: null,
    createdAt: "2026-08-20T11:00:00Z",
  },
  {
    id: "demo-pay-3",
    weddingId: "demo",
    budgetItemId: "demo-bg-3",
    amount: 2000000,
    paymentDate: "2026-09-01",
    paymentMethod: "Tunai / Cash",
    recipient: "Bendahara Banjar",
    notes: "DP sewa tratag & sound system banjar",
    receiptUrl: null,
    createdBy: null,
    createdAt: "2026-09-01T09:00:00Z",
  },
];

export const DEMO_BUDGET_ITEMS: BudgetItem[] = [
  {
    id: "demo-bg-1",
    weddingId: "demo",
    category: "upakara",
    title: "Paket Pokok Banten Pawiwahan (Mebyakala & Mesakapan)",
    unit: "Paket",
    quantity: 1,
    unitPrice: 7500000,
    plannedAmount: 7500000,
    actualAmount: 7500000,
    paidAmount: 3000000,
    paidBy: "Bersama (Kedua Mempelai)",
    status: "paid_partial",
    linkedRitualItemId: null,
    linkedVendorId: null,
    notes: "Dipesan pada Serati Griya Sanur.",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-15T10:00:00Z",
    payments: [DEMO_PAYMENTS[0]],
  },
  {
    id: "demo-bg-2",
    weddingId: "demo",
    category: "busana_rias",
    title: "Sewa Busana Payas Agung & Rias Mempelai",
    unit: "Paket",
    quantity: 1,
    unitPrice: 8500000,
    plannedAmount: 8500000,
    actualAmount: 8500000,
    paidAmount: 3000000,
    paidBy: "Bersama (Kedua Mempelai)",
    status: "paid_partial",
    linkedRitualItemId: null,
    linkedVendorId: null,
    notes: "Sanggar Rias Kusuma Adat Denpasar.",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-20T11:00:00Z",
    payments: [DEMO_PAYMENTS[1]],
  },
  {
    id: "demo-bg-3",
    weddingId: "demo",
    category: "tempat_dekorasi",
    title: "Pemasangan Tetaring & Tratag Banjar",
    unit: "Set",
    quantity: 1,
    unitPrice: 4000000,
    plannedAmount: 4000000,
    actualAmount: 4000000,
    paidAmount: 2000000,
    paidBy: "Keluarga Purusa",
    status: "paid_partial",
    linkedRitualItemId: null,
    linkedVendorId: null,
    notes: "Gotong royong pemuda banjar.",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-09-01T09:00:00Z",
    payments: [DEMO_PAYMENTS[2]],
  },
  {
    id: "demo-bg-4",
    weddingId: "demo",
    category: "konsumsi",
    title: "Tradisi Mebat Adat (2 Ekor Babi Guling & Lawar)",
    unit: "Ekor",
    quantity: 2,
    unitPrice: 4500000,
    plannedAmount: 9000000,
    actualAmount: 9000000,
    paidAmount: 0,
    paidBy: "Keluarga Purusa",
    status: "booked",
    linkedRitualItemId: null,
    linkedVendorId: null,
    notes: "Bahan siap dikirim H-1 oleh peternak lokal.",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-01T08:00:00Z",
    payments: [],
  },
  {
    id: "demo-bg-5",
    weddingId: "demo",
    category: "dokumentasi",
    title: "Fotografer & Videografer Dokumentasi Adat",
    unit: "Hari",
    quantity: 1,
    unitPrice: 5000000,
    plannedAmount: 5000000,
    actualAmount: 5000000,
    paidAmount: 0,
    paidBy: "Bersama (Kedua Mempelai)",
    status: "estimated",
    linkedRitualItemId: null,
    linkedVendorId: null,
    notes: "Vendor foto pawiwahan di Denpasar.",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-01T08:00:00Z",
    payments: [],
  },
];

export function getBudgetCategoryLabel(
  category: string | null | undefined
): string {
  if (!category) return "Lainnya";
  const found = BUDGET_CATEGORIES.find(
    (c) => c.id.toLowerCase() === category.toLowerCase()
  );
  return found ? found.label : category;
}

export function getBudgetItemStatusLabel(status: BudgetItemStatus): string {
  switch (status) {
    case "estimated":
      return "Estimasi Awal";
    case "booked":
      return "Dipesan / Deal";
    case "paid_partial":
      return "DP / Cicilan";
    case "paid_full":
      return "Lunas";
    case "canceled":
      return "Dibatalkan";
    default:
      return status;
  }
}

export function getBudgetItemStatusBadgeClass(
  status: BudgetItemStatus
): string {
  switch (status) {
    case "paid_full":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "paid_partial":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "booked":
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30";
    case "estimated":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "canceled":
      return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 line-through border-zinc-500/30";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

/**
 * Reconcile budget totals without double counting.
 * All math strictly in integer IDR.
 */
export function calculateBudgetStats(
  items: BudgetItem[],
  targetBudget: number
): BudgetStats {
  const activeItems = items.filter((item) => item.status !== "canceled");

  let totalPlanned = 0;
  let totalActual = 0;
  let totalPaid = 0;
  let paymentCount = 0;

  for (const item of activeItems) {
    totalPlanned += Math.round(item.plannedAmount || 0);

    // If actualAmount has been explicitly committed (>0), use it; otherwise use planned
    const effectiveActual =
      item.actualAmount > 0
        ? Math.round(item.actualAmount)
        : Math.round(item.plannedAmount || 0);
    totalActual += effectiveActual;

    const itemPaid = Math.round(item.paidAmount || 0);
    totalPaid += itemPaid;
    paymentCount += (item.payments || []).length;
  }

  const totalOutstanding = Math.max(0, totalActual - totalPaid);
  const remainingBudget = targetBudget - totalActual;

  return {
    targetBudget: Math.round(targetBudget || 0),
    totalPlanned,
    totalActual,
    totalPaid,
    totalOutstanding,
    remainingBudget,
    itemCount: activeItems.length,
    paymentCount,
  };
}
