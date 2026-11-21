import type {
  TaskTemplate,
  TaskPriority,
  TaskStatus,
  WeddingTask,
} from "./types";
import { MASTER_TASKS } from "@/data/master-templates";

export const STARTER_TASK_TEMPLATES: TaskTemplate[] = [
  ...MASTER_TASKS,
  {
    id: "TK-001",
    phase: "Persiapan Awal (H-180 s.d H-90)",
    targetTimeline: "H-180 s.d. H-90",
    category: "adat",
    title: "Rembug Keluarga & Penentuan Hari Baik (Dewasa Ayu)",
    defaultPic: "Tetua Keluarga & Sulinggih",
    applicability: "Umum",
    priority: "urgent",
    notes:
      "Pertemuan dua keluarga inti untuk konsultasi penentuan hari baik pernikahan kepada Sulinggih atau Pemangku berdasarkan kalender Bali (Wewaran & Pawukon).",
    sourceUrl: "https://phdi.or.id",
  },
  {
    id: "TK-002",
    phase: "Persiapan Awal (H-180 s.d H-90)",
    targetTimeline: "H-120 s.d. H-60",
    category: "adat",
    title: "Konfirmasi Sulinggih / Pemangku yang Akan Muput Upacara",
    defaultPic: "Keluarga Purusa / Tetua",
    applicability: "Umum",
    priority: "high",
    notes:
      "Menghubungi dan memohon kesediaan Ida Pedanda atau Pemangku Merajan untuk memimpin prosesi Mesakapan dan Mejaya-jaya.",
    sourceUrl: "https://phdi.or.id",
  },
  {
    id: "TK-003",
    phase: "Persiapan Madya (H-90 s.d H-30)",
    targetTimeline: "H-60 s.d. H-30",
    category: "adat",
    title: "Koordinasi Rincian Banten dengan Serati Banten",
    defaultPic: "Ibu / Serati Banten",
    applicability: "Umum",
    priority: "high",
    notes:
      "Menetapkan daftar banten pokok (Pabyakala, Madengen-dengen, Mesakapan, Pejati) dan porsi yang dibuat sendiri (ngayah) vs dipesan.",
    sourceUrl: "https://baliloka.id/pustaka/tatwa-pawiwahan",
  },
  {
    id: "TK-004",
    phase: "Persiapan Madya (H-90 s.d H-30)",
    targetTimeline: "H-60 s.d. H-30",
    category: "administrasi",
    title: "Pengurusan Surat Pengantar Perkawinan Banjar Adat & Kelurahan",
    defaultPic: "Calon Mempelai Pria",
    applicability: "Umum",
    priority: "high",
    notes:
      "Surat pengantar perkawinan dari Kelihan Adat Banjar serta surat keterangan belum menikah dari kantor Desa / Kelurahan.",
  },
  {
    id: "TK-005",
    phase: "Persiapan Madya (H-90 s.d H-30)",
    targetTimeline: "H-45 s.d. H-30",
    category: "busana",
    title: "Fitting Busana Adat Pawiwahan (Payas Agung / Payas Madya)",
    defaultPic: "Kedua Mempelai",
    applicability: "Umum",
    priority: "medium",
    notes:
      "Menentukan tata rias pengantin, pemilihan ragam busana adat (Payas Agung / Modifikasi / Madya), dan fitting busana keluarga inti.",
  },
  {
    id: "TK-006",
    phase: "Persiapan Intensif (H-30 s.d H-7)",
    targetTimeline: "H-30 s.d. H-14",
    category: "administrasi",
    title: "Pendaftaran Berkas ke Dinas Dukcapil (Akta Perkawinan)",
    defaultPic: "Kedua Mempelai",
    applicability: "Umum",
    priority: "high",
    notes:
      "Pengajuan berkas pencatatan sipil agar akta perkawinan sah di mata hukum negara segera setelah pemberkatan agama.",
  },
  {
    id: "TK-007",
    phase: "Persiapan Intensif (H-30 s.d H-7)",
    targetTimeline: "H-21 s.d. H-7",
    category: "dokumentasi",
    title: "Konfirmasi Fotografer & Videografer Acara Adat",
    defaultPic: "Koordinator Dokumentasi",
    applicability: "Umum",
    priority: "medium",
    notes:
      "Briefing rundown prosesi adat Bali kepada tim fotografer agar momen sakral mesakapan dan sungkeman terabadikan dengan sopan.",
  },
  {
    id: "TK-008",
    phase: "Pekan Terakhir (H-7 s.d H-1)",
    targetTimeline: "H-5 s.d. H-3",
    category: "logistik",
    title: "Pemasangan Tetaring / Tratag Bersama Krama Banjar (Ngayah)",
    defaultPic: "Kelihan Suka-Duka / Banjar",
    applicability: "Umum",
    priority: "high",
    notes:
      "Tradisi gotong royong mendirikan tratag anyaman kelapa (tetaring) dan panggung bale upacara di pekarangan rumah.",
  },
  {
    id: "TK-009",
    phase: "Pekan Terakhir (H-7 s.d H-1)",
    targetTimeline: "H-3 s.d. H-1",
    category: "adat",
    title: "Nunas Tirta Pakuluh ring Pura Kahyangan Tiga & Kawitan",
    defaultPic: "Tetua Keluarga / Pemangku",
    applicability: "Umum",
    priority: "urgent",
    notes:
      "Memohon air suci (tirta) persaksian dari Pura Desa, Puseh, Dalem, serta Pura Paibon/Kawitan leluhur untuk upacara Mesakapan.",
    sourceUrl: "https://phdi.or.id",
  },
  {
    id: "TK-010",
    phase: "Pekan Terakhir (H-7 s.d H-1)",
    targetTimeline: "H-2 s.d. H-1",
    category: "konsumsi",
    title: "Tradisi Mebat (Pengolahan Hidangan Adat Lawar & Babi Guling)",
    defaultPic: "Sekaa Mebat Banjar",
    applicability: "Umum",
    priority: "high",
    notes:
      "Penyembelihan dan pengolahan hidangan tradisional Bali bersama krama banjar untuk santap ngayah dan jamuan keluarga.",
  },
  {
    id: "TK-011",
    phase: "Pekan Terakhir (H-7 s.d H-1)",
    targetTimeline: "H-1",
    category: "adat",
    title: "Pengecekan Sarana Upacara Simbolis (Tegen-tegenan & Suun-suunan)",
    defaultPic: "Ibu / Saksi Adat",
    applicability: "Kondisional (Sesuai Dresta)",
    priority: "medium",
    notes:
      "Memastikan kelengkapan bakul tegen-tegenan (hasil bumi, tebu, ayam/bebek) dan suun-suunan untuk prosesi Madengen-dengen.",
    sourceUrl: "https://baliloka.id/pustaka/tatwa-pawiwahan",
  },
  {
    id: "TK-012",
    phase: "Hari H Pawiwahan",
    targetTimeline: "Hari H",
    category: "adat",
    title: "Pengawalan Rundown & Waktu Muput Sulinggih saat Mesakapan",
    defaultPic: "Koordinator Acara Keluarga",
    applicability: "Umum",
    priority: "urgent",
    notes:
      "Memastikan kedua mempelai siap tepat waktu sebelum waktu puncak upacara (puputan) oleh Ida Pedanda / Pemangku Merajan.",
  },
  {
    id: "TK-013",
    phase: "Hari H Pawiwahan",
    targetTimeline: "Hari H",
    category: "administrasi",
    title: "Penandatanganan Berkas Akta Perkawinan & Saksi Adat",
    defaultPic: "Petugas Disdukcapil & Saksi",
    applicability: "Umum",
    priority: "urgent",
    notes:
      "Penandatanganan akta perkawinan resmi di hadapan Prajuru Desa Adat dan petugas Dinas Dukcapil yang hadir di lokasi.",
  },
  {
    id: "TK-014",
    phase: "Pasca Pawiwahan",
    targetTimeline: "H+3 s.d. H+7",
    category: "adat",
    title: "Persiapan Upacara Mejauman / Ketipat Bantal ke Rumah Pradana",
    defaultPic: "Keluarga Purusa & Pradana",
    applicability: "Memadik",
    priority: "medium",
    notes:
      "Mempersiapkan banten mejauman, tipat bantal, dan oleh-oleh adat untuk kunjungan resmi pertama pasangan pengantin ke keluarga istri.",
    sourceUrl: "https://baliloka.id/pustaka/tatwa-pawiwahan",
  },
];

export const CATEGORY_OPTIONS: { id: string; label: string; desc: string }[] = [
  {
    id: "adat",
    label: "Adat & Upakara",
    desc: "Dewasa ayu, banten, sulinggih, tirta pakuluh",
  },
  {
    id: "administrasi",
    label: "Administrasi & Hukum",
    desc: "Surat banjar, dinas dukcapil, akta nikah",
  },
  {
    id: "logistik",
    label: "Logistik & Tratag",
    desc: "Tetaring banjar, sound system, penataan merajan",
  },
  {
    id: "busana",
    label: "Busana & Tata Rias",
    desc: "Payas agung/madya, rias keluarga, fitting pakaian",
  },
  {
    id: "konsumsi",
    label: "Konsumsi & Mebat",
    desc: "Mebat krama banjar, babi guling, jamuan prasmanan",
  },
  {
    id: "dokumentasi",
    label: "Dokumentasi & Media",
    desc: "Fotografi adat, video cinematic, peliputan drone",
  },
  {
    id: "keuangan",
    label: "Keuangan & DP",
    desc: "Uang muka vendor, sesari pemangku, dana punia",
  },
  {
    id: "umum",
    label: "Persiapan Umum",
    desc: "Tugas koordinasi keluarga lainnya",
  },
];

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return "Umum";
  const found = CATEGORY_OPTIONS.find(
    (c) => c.id.toLowerCase() === category.toLowerCase()
  );
  return found ? found.label : category;
}

export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case "urgent":
      return "Mendesak";
    case "high":
      return "Tinggi";
    case "medium":
      return "Sedang";
    case "low":
      return "Rendah";
    default:
      return priority;
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "todo":
      return "Belum Mulai";
    case "in_progress":
      return "Dalam Proses";
    case "done":
      return "Selesai";
    case "canceled":
      return "Dibatalkan";
    default:
      return status;
  }
}

export function getPriorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case "urgent":
      return "border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 font-medium";
    case "high":
      return "border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300 font-medium";
    case "medium":
      return "border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300 font-medium";
    case "low":
      return "border border-[#e9e9ed] bg-[#f4f4f7] text-[#65656f] dark:border-border dark:bg-muted/40 dark:text-muted-foreground font-medium";
    default:
      return "border border-[#e9e9ed] bg-[#f4f4f7] text-[#65656f]";
  }
}

export function getStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case "done":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 font-medium";
    case "in_progress":
      return "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300 font-medium";
    case "todo":
      return "border border-[#e9e9ed] bg-[#f4f4f7] text-[#65656f] dark:border-border dark:bg-muted/40 dark:text-muted-foreground font-medium";
    case "canceled":
      return "border border-[#e9e9ed] bg-[#f4f4f7] text-zinc-400 line-through dark:border-border";
    default:
      return "border border-[#e9e9ed] bg-[#f4f4f7] text-[#65656f]";
  }
}

export const DEMO_TASKS: WeddingTask[] = [
  {
    id: "demo-task-1",
    weddingId: "demo",
    templateId: "TK-001",
    ceremonyId: null,
    title: "Rembug Keluarga & Penentuan Hari Baik (Dewasa Ayu)",
    description:
      "Pertemuan dua keluarga inti untuk konsultasi penentuan hari baik pernikahan kepada Sulinggih.",
    category: "adat",
    priority: "urgent",
    status: "done",
    dueDate: "2026-08-01",
    assignedToUserId: null,
    assigneeName: "Tetua Keluarga & Sulinggih",
    orderIndex: 0,
    completedAt: "2026-08-02T10:00:00Z",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-02T10:00:00Z",
  },
  {
    id: "demo-task-2",
    weddingId: "demo",
    templateId: "TK-002",
    ceremonyId: null,
    title: "Konfirmasi Sulinggih / Pemangku yang Akan Muput Upacara",
    description:
      "Menghubungi dan memohon kesediaan Ida Pedanda atau Pemangku Merajan.",
    category: "adat",
    priority: "high",
    status: "in_progress",
    dueDate: "2026-09-15",
    assignedToUserId: "demo-u1",
    assigneeName: "I Made Dharma (Purusa)",
    orderIndex: 1,
    completedAt: null,
    createdAt: "2026-08-05T08:00:00Z",
    updatedAt: "2026-08-10T09:30:00Z",
  },
  {
    id: "demo-task-3",
    weddingId: "demo",
    templateId: "TK-003",
    ceremonyId: null,
    title: "Koordinasi Rincian Banten dengan Serati Banten",
    description: "Menetapkan daftar banten pokok dan porsi ngayah vs dipesan.",
    category: "adat",
    priority: "high",
    status: "in_progress",
    dueDate: "2026-10-01",
    assignedToUserId: "demo-u3",
    assigneeName: "Jero Mangku Serati (Koordinator Banten)",
    orderIndex: 2,
    completedAt: null,
    createdAt: "2026-08-05T08:00:00Z",
    updatedAt: "2026-08-10T09:30:00Z",
  },
  {
    id: "demo-task-4",
    weddingId: "demo",
    templateId: "TK-004",
    ceremonyId: null,
    title: "Pengurusan Surat Pengantar Perkawinan Banjar Adat & Kelurahan",
    description:
      "Surat pengantar perkawinan dari Kelihan Adat Banjar serta surat keterangan belum menikah.",
    category: "administrasi",
    priority: "high",
    status: "todo",
    dueDate: "2026-10-15",
    assignedToUserId: "demo-u2",
    assigneeName: "Ni Putu Lestari (Pradana)",
    orderIndex: 3,
    completedAt: null,
    createdAt: "2026-08-05T08:00:00Z",
    updatedAt: "2026-08-05T08:00:00Z",
  },
  {
    id: "demo-task-5",
    weddingId: "demo",
    templateId: "TK-005",
    ceremonyId: null,
    title: "Fitting Busana Adat Pawiwahan (Payas Agung & Madya)",
    description:
      "Menentukan tata rias pengantin dan fitting busana kedua mempelai.",
    category: "busana",
    priority: "medium",
    status: "todo",
    dueDate: "2026-10-20",
    assignedToUserId: null,
    assigneeName: "Ni Putu Saraswati (Mempelai Wanita)",
    orderIndex: 4,
    completedAt: null,
    createdAt: "2026-08-05T08:00:00Z",
    updatedAt: "2026-08-05T08:00:00Z",
  },
  {
    id: "demo-task-6",
    weddingId: "demo",
    templateId: "TK-008",
    ceremonyId: null,
    title: "Pemasangan Tetaring / Tratag Bersama Krama Banjar (Ngayah)",
    description:
      "Gotong royong mendirikan tratag dan teratak anyaman kelapa di pekarangan.",
    category: "logistik",
    priority: "high",
    status: "todo",
    dueDate: "2026-10-25",
    assignedToUserId: null,
    assigneeName: "Kelihan Suka Duka Banjar",
    orderIndex: 5,
    completedAt: null,
    createdAt: "2026-08-05T08:00:00Z",
    updatedAt: "2026-08-05T08:00:00Z",
  },
];
