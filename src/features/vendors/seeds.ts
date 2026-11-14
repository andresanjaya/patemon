/**
 * Balinese Wedding Vendor Seeds, Categories & Starter Templates for Patemon MVP v1 (Issue #29)
 */

import type {
  Vendor,
  VendorCategoryInfo,
  VendorStats,
  VendorStatus,
  VendorTemplate,
} from "./types";

export const VENDOR_CATEGORIES: VendorCategoryInfo[] = [
  {
    id: "banten_serati",
    name: "Serati Banten & Tukang Banten",
    description: "Pengadaan sarana upakara, banten pawiwahan, suci, dan caru",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    iconName: "Flower2",
  },
  {
    id: "busana_rias",
    name: "Tata Rias & Busana Adat (MUA)",
    description: "Payas Agung, Payas Modifikasi, busana keluarga & pengiring",
    badgeClass:
      "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800",
    iconName: "Sparkles",
  },
  {
    id: "fotografi_videografi",
    name: "Fotografi & Videografi",
    description: "Dokumentasi prosesi sakral, cinematic video & album kenangan",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    iconName: "Camera",
  },
  {
    id: "dekorasi_tenda",
    name: "Dekorasi, Tenda & Penjor",
    description:
      "Dekorasi angkul-angkul, pelaminan adat, tenda terob & penjor pawiwahan",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    iconName: "Palette",
  },
  {
    id: "katering_mebat",
    name: "Katering, Mebat & Prasmanan",
    description:
      "Olahan mebat tradisional, lawar, sate lilit, dan prasmanan resepsi",
    badgeClass:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    iconName: "Utensils",
  },
  {
    id: "musik_sound_gong",
    name: "Gong, Gambelan & Sound System",
    description:
      "Sekaa Gong Baleganjur, Semar Pegulingan & audio tata suara prosesi",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    iconName: "Music",
  },
  {
    id: "venue_bale",
    name: "Venue & Bale Pawiwahan",
    description:
      "Sewa wantilan banjar, gedung resepsi, atau penataan pekarangan bale dangin",
    badgeClass:
      "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
    iconName: "Home",
  },
  {
    id: "undangan_souvenir",
    name: "Undangan & Cendera Mata",
    description:
      "Cetak undangan fisik motif Bali, undangan digital & souvenir adat",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    iconName: "Mail",
  },
  {
    id: "lainnya",
    name: "Lainnya / Umum",
    description:
      "Transportasi keluarga, keamanan pecalang & kebutuhan tambahan",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    iconName: "Package",
  },
];

export const VENDOR_STATUS_CONFIG: Record<
  VendorStatus,
  { label: string; badgeClass: string; description: string }
> = {
  prospect: {
    label: "Rencana / Prospek",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    description:
      "Daftar rekanan yang baru dipertimbangkan oleh keluarga/pasangan",
  },
  contacted: {
    label: "Sudah Dihubungi",
    badgeClass:
      "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    description:
      "Sedang berdiskusi perihal tanggal hari baik & ketersediaan slot",
  },
  quoted: {
    label: "Penawaran Diterima",
    badgeClass:
      "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    description: "Rincian proposal & estimasi biaya penawaran sudah diperoleh",
  },
  booked: {
    label: "Telah Dipesan (Booked)",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    description: "Sudah ada kesepakatan / uang muka DP dan slot terkunci",
  },
  completed: {
    label: "Selesai / Lunas",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    description: "Layanan telah tuntas dilaksanakan dan pelunasan selesai",
  },
  canceled: {
    label: "Batal",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    description: "Tidak jadi menggunakan jasa vendor ini",
  },
};

export const STARTER_VENDOR_TEMPLATES: VendorTemplate[] = [
  {
    id: "tpl_serati_banten",
    category: "banten_serati",
    name: "Serati Banten Griya / Tukang Banten",
    recommendedScope:
      "Paket banten pawiwahan lengkap (Suci, Peras Panyeneng, Pabyakala, Tataban, Caru Ayam Brumbun)",
    estimatedQuoteRange: "Rp 10.000.000 - Rp 25.000.000",
    notes:
      "Pastikan koordinasi daftar sarana yang digarap serati vs bahan mentah yang disiapkan ngayah keluarga.",
    defaultPicRole: "Keluarga Bidang Upakara / Serati",
  },
  {
    id: "tpl_sanggar_rias",
    category: "busana_rias",
    name: "Sanggar Rias & Payas Bali",
    recommendedScope:
      "Busana Payas Agung / Modifikasi resepsi, payas madya prosesi adat, serta tata rias orang tua & saksi",
    estimatedQuoteRange: "Rp 8.000.000 - Rp 18.000.000",
    notes:
      "Tanyakan jadwal fitting baju adat 2-3 minggu sebelum hari H dan tim standby touch-up.",
    defaultPicRole: "Mempelai & Pendamping Rias",
  },
  {
    id: "tpl_dokumentasi",
    category: "fotografi_videografi",
    name: "Studio Dokumentasi Pawiwahan",
    recommendedScope:
      "Foto liputan adat sakral, teaser cinematic reels, video dokumenter & album cetak eksklusif",
    estimatedQuoteRange: "Rp 6.000.000 - Rp 15.000.000",
    notes:
      "Diskusikan rundown prosesi adat secara rinci agar momen sakral pabyakala & natab terabadikan utuh.",
    defaultPicRole: "Seksi Dokumentasi",
  },
  {
    id: "tpl_dekorasi",
    category: "dekorasi_tenda",
    name: "Dekorasi Angkul-angkul & Pelaminan Adat",
    recommendedScope:
      "Dekorasi angkul-angkul janur tradisional, pelaminan adat Bali, panggung, terob tenda tamu, meja prasmanan",
    estimatedQuoteRange: "Rp 12.000.000 - Rp 30.000.000",
    notes:
      "Sertakan pemasangan sepasang Penjor Pawiwahan di pintu gerbang pekarangan rumah.",
    defaultPicRole: "Seksi Perlengkapan & Dekorasi",
  },
  {
    id: "tpl_sekaa_gong",
    category: "musik_sound_gong",
    name: "Sekaa Gong Baleganjur / Gambelan Banjar",
    recommendedScope:
      "Tabuh panyambutan temu manten, pengiring prosesi adat sakral & tata suara wireless mic sulinggih",
    estimatedQuoteRange: "Rp 3.500.000 - Rp 7.500.000",
    notes:
      "Bisa berdayakan sekaa gong pemuda banjar setempat sebagai bentuk pasuketan banjar.",
    defaultPicRole: "Seksi Upacara & Acara",
  },
  {
    id: "tpl_katering_mebat",
    category: "katering_mebat",
    name: "Kelompok Mebat & Katering Tradisional",
    recommendedScope:
      "Penyediaan daging babi guling, lawar barak/putih, sate lembat, juk ares, dan prasmanan tamu undangan",
    estimatedQuoteRange: "Rp 15.000.000 - Rp 45.000.000",
    notes:
      "Tentukan porsi hidangan untuk krama ngayah banjar saat wewantenan dan prasmanan tamu undangan umum.",
    defaultPicRole: "Seksi Konsumsi & Mebat",
  },
  {
    id: "tpl_undangan_cetak",
    category: "undangan_souvenir",
    name: "Percetakan Undangan Adat & Digital",
    recommendedScope:
      "Cetak undangan fisik beraksara Bali / motif prada emas, landing page undangan digital & souvenir khas Bali",
    estimatedQuoteRange: "Rp 2.500.000 - Rp 6.000.000",
    notes:
      "Periksa ketepatan penulisan nama sulinggih saksi, gelar adat, serta peta lokasi pekarangan / griya.",
    defaultPicRole: "Seksi Kesekretariatan",
  },
  {
    id: "tpl_venue_wantilan",
    category: "venue_bale",
    name: "Wantilan Banjar / Gedung Resepsi",
    recommendedScope:
      "Sewa tempat resepsi, kursi tamu, kebersihan pekarangan, listrik dan koordinasi parkir pecalang",
    estimatedQuoteRange: "Rp 3.000.000 - Rp 10.000.000",
    notes:
      "Koordinasikan perijinan dengan Prajuru Banjar Adat dan tim pecalang setempat.",
    defaultPicRole: "Ketua Panitia Pawiwahan",
  },
];

export function getCategoryInfo(category: string): VendorCategoryInfo {
  const match = VENDOR_CATEGORIES.find((c) => c.id === category);
  if (match) return match;
  return {
    id: "lainnya",
    name: category || "Lainnya",
    description: "Kategori pendukung pernikahan",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    iconName: "Package",
  };
}

export function getStatusConfig(status: VendorStatus) {
  return VENDOR_STATUS_CONFIG[status] || VENDOR_STATUS_CONFIG.prospect;
}

/**
 * Format Indonesian telephone numbers into valid WhatsApp click-to-chat links.
 * E.g., 08123456789 -> https://wa.me/628123456789
 */
export function formatWhatsAppLink(
  phone: string | null | undefined,
  text?: string
): string | null {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return null;

  let sanitized = digitsOnly;
  if (sanitized.startsWith("0")) {
    sanitized = `62${sanitized.slice(1)}`;
  } else if (!sanitized.startsWith("62")) {
    sanitized = `62${sanitized}`;
  }

  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${sanitized}${query}`;
}

/**
 * Calculate aggregated statistics for a list of vendors.
 */
export function calculateVendorStats(vendors: Vendor[]): VendorStats {
  const activeVendors = vendors.filter((v) => v.status !== "canceled");

  let totalQuoteAmount = 0;
  let totalAgreedAmount = 0;
  let totalPaidAmount = 0;
  let totalDueAmount = 0;

  for (const v of activeVendors) {
    totalQuoteAmount += v.quoteAmount || 0;
    totalAgreedAmount += v.agreedAmount || 0;
    totalPaidAmount += v.paidAmount || 0;
    totalDueAmount += v.dueAmount || 0;
  }

  return {
    totalVendors: vendors.length,
    bookedVendors: vendors.filter((v) => v.status === "booked").length,
    prospectVendors: vendors.filter(
      (v) =>
        v.status === "prospect" ||
        v.status === "contacted" ||
        v.status === "quoted"
    ).length,
    completedVendors: vendors.filter((v) => v.status === "completed").length,
    totalQuoteAmount,
    totalAgreedAmount,
    totalPaidAmount,
    totalDueAmount,
  };
}

/**
 * Demo Mock Vendors for offline/preview testing in `demo` workspace.
 */
export const DEMO_VENDORS: Vendor[] = [
  {
    id: "demo-v-1",
    weddingId: "demo",
    category: "banten_serati",
    name: "Griya Banten Asri (Jero Serati Mangku)",
    contactPerson: "Jero Mangku Suweta",
    phone: "081238912345",
    socialLink: "https://instagram.com/griyabantenasri",
    quoteAmount: 18000000,
    status: "booked",
    picName: "I Made Wardana (Paman)",
    notes:
      "Sudah bayar uang muka Rp 5.000.000. Paket mencakup Suci, Caru Ayam Brumbun, dan Pabyakala.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agreedAmount: 18000000,
    paidAmount: 5000000,
    dueAmount: 13000000,
    linkedBudgetItems: [
      {
        id: "demo-b-1",
        title: "Paket Banten Upakara Utama",
        plannedAmount: 18000000,
        actualAmount: 18000000,
        paidAmount: 5000000,
        status: "paid_partial",
      },
    ],
  },
  {
    id: "demo-v-2",
    weddingId: "demo",
    category: "busana_rias",
    name: "Sanggar Rias Sekar Jagat",
    contactPerson: "Ibu Ketut Ariani",
    phone: "081999123456",
    socialLink: "https://instagram.com/sekarjagat_mua",
    quoteAmount: 12500000,
    status: "booked",
    picName: "Ni Putu Dewi (Pengantin)",
    notes:
      "Payas Agung Modifikasi untuk resepsi dan Payas Madya untuk prosesi sakral di Merajan.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agreedAmount: 12500000,
    paidAmount: 12500000,
    dueAmount: 0,
    linkedBudgetItems: [
      {
        id: "demo-b-2",
        title: "Sewa Busana Payas Agung & Rias Pengantin",
        plannedAmount: 12500000,
        actualAmount: 12500000,
        paidAmount: 12500000,
        status: "paid_full",
      },
    ],
  },
  {
    id: "demo-v-3",
    weddingId: "demo",
    category: "fotografi_videografi",
    name: "Pradnya Cinematic Bali",
    contactPerson: "Gede Agus Wijaya",
    phone: "085737112233",
    socialLink: "https://instagram.com/pradnyacinematic",
    quoteAmount: 9000000,
    status: "quoted",
    picName: "I Wayan Pratama",
    notes:
      "Paket 2 fotografer + 1 videografer drone liputan sehari penuh mulai prosesi pagi sampai resepsi malam.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agreedAmount: 9000000,
    paidAmount: 0,
    dueAmount: 9000000,
    linkedBudgetItems: [],
  },
  {
    id: "demo-v-4",
    weddingId: "demo",
    category: "dekorasi_tenda",
    name: "Dewata Art Decor & Tenda",
    contactPerson: "Pak Wayan Sukerta",
    phone: "081338876543",
    socialLink: "https://facebook.com/dewatadecorbali",
    quoteAmount: 16000000,
    status: "contacted",
    picName: "I Ketut Sudira (Bapak)",
    notes: "Sudah survei pekarangan rumah untuk pasang terob dan penjor janur.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agreedAmount: 16000000,
    paidAmount: 0,
    dueAmount: 16000000,
    linkedBudgetItems: [],
  },
  {
    id: "demo-v-5",
    weddingId: "demo",
    category: "musik_sound_gong",
    name: "Sekaa Gong Eka Citta Banjar",
    contactPerson: "Kelian Gong Bli Nyoman",
    phone: "087860123987",
    socialLink: null,
    quoteAmount: 4500000,
    status: "prospect",
    picName: "Seksi Acara Adat",
    notes:
      "Rencana gamelan Baleganjur saat arak-arakan temu manten dan gender wayang saat pabyakala.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agreedAmount: 4500000,
    paidAmount: 0,
    dueAmount: 4500000,
    linkedBudgetItems: [],
  },
];
