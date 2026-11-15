/**
t  * Balinese Wedding Day Rundown Seeds, Templates and Helpers for Patemon MVP v1 (Issue #31)
 */

import type { RundownEvent, RundownEventStatus, RundownStats } from "./types";

export const RUNDOWN_STATUS_CONFIG: Record<
  RundownEventStatus,
  { label: string; badgeClass: string; description: string }
> = {
  pending: {
    label: "Belum Mulai",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    description: "Segmen belum dimulai",
  },
  in_progress: {
    label: "Sedang Berlangsung",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 animate-pulse",
    description: "Prosesi sedang berjalan di lokasi",
  },
  completed: {
    label: "Selesai",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    description: "Segmen telah rampung dilaksanakan",
  },
  delayed: {
    label: "Tertunda / Terlambat",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    description: "Pelaksanaan mengalami keterlambatan dari jadwal",
  },
  skipped: {
    label: "Dilewati",
    badgeClass:
      "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    description: "Segmen ditiadakan atas kesepakatan bersama",
  },
};

/**
 * Get current time in Bali (WITA, UTC+8) in HH:MM format.
 */
export function getCurrentTimeWita(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(now).replace(".", ":");
}

/**
 * Calculate delay in minutes between scheduled start time and actual start time.
 * Positive = late (+15 minutes)
 * Negative = early (-5 minutes)
 * 0 = on time
 */
export function calculateDelayMinutes(
  scheduledStartTime: string,
  actualStartTime?: string | null
): number {
  if (!actualStartTime) return 0;
  const [schedH, schedM] = formatTimeDisplay(scheduledStartTime)
    .split(":")
    .map(Number);
  const [actH, actM] = formatTimeDisplay(actualStartTime)
    .split(":")
    .map(Number);

  let schedTotal = (schedH || 0) * 60 + (schedM || 0);
  let actTotal = (actH || 0) * 60 + (actM || 0);

  // Handle midnight crossover if span exceeds 12 hours
  if (actTotal < schedTotal && schedTotal - actTotal > 12 * 60) {
    actTotal += 24 * 60;
  } else if (schedTotal < actTotal && actTotal - schedTotal > 12 * 60) {
    schedTotal += 24 * 60;
  }

  return actTotal - schedTotal;
}

/**
 * Format delay into explicit text and badge styling (non-color dependent per accessibility).
 */
export function formatDelayBadge(delayMinutes: number): {
  label: string;
  badgeClass: string;
  type: "late" | "early" | "on_time";
} {
  if (delayMinutes > 5) {
    return {
      label: `Terlambat +${delayMinutes} mnt`,
      badgeClass:
        "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      type: "late",
    };
  }
  if (delayMinutes < -5) {
    return {
      label: `Lebih Awal ${Math.abs(delayMinutes)} mnt`,
      badgeClass:
        "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      type: "early",
    };
  }
  return {
    label: "Tepat Waktu",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    type: "on_time",
  };
}

export const CANONICAL_LOCATIONS = [
  "Merajan / Sanggah Gede",
  "Bale Dangin / Bale Gede",
  "Bale Dauh / Kamar Pengantin",
  "Natah / Pekarangan Rumah",
  "Pintu Gerbang / Angkul-angkul",
  "Pawon / Area Mebat",
  "Wantilan Banjar Adat",
  "Gedung Resepsi / Venue",
  "Lainnya / Umum",
];

export interface StarterRundownTemplateItem {
  startTime: string;
  endTime: string;
  segmentTitle: string;
  location: string;
  personInCharge: string;
  notes: string;
}

export const STARTER_RUNDOWN_TEMPLATES: StarterRundownTemplateItem[] = [
  {
    startTime: "05:00",
    endTime: "07:30",
    segmentTitle: "Rias Pengantin & Busana Adat Payas Agung",
    location: "Bale Dauh / Kamar Pengantin",
    personInCharge: "MUA & Pendamping Rias",
    notes:
      "Mempelai mulai dirias Payas Agung Bali. Busana orang tua & pendamping siap jam 06:30.",
  },
  {
    startTime: "06:30",
    endTime: "08:30",
    segmentTitle: "Pengecekan Akhir Banten Pawiwahan & Pabyakala",
    location: "Bale Dangin / Bale Gede",
    personInCharge: "Jero Serati Mangku & Seksi Upakara",
    notes:
      "Memastikan Banten Suci, Caru Ayam Brumbun, Pabyakala, dan Daksina Linggih sudah tertata rapi.",
  },
  {
    startTime: "07:00",
    endTime: "09:00",
    segmentTitle: "Persiapan Konsumsi Mebat Krama Banjar & Sarapan",
    location: "Pawon / Area Mebat",
    personInCharge: "Seksi Konsumsi (Kelian Mebat)",
    notes:
      "Penyajian sarapan kopi/teh & jajan bali untuk keluarga dan krama banjar yang ngayah.",
  },
  {
    startTime: "08:30",
    endTime: "09:30",
    segmentTitle: "Penyambutan Mempelai & Tabuh Sekaa Gong Baleganjur",
    location: "Pintu Gerbang / Angkul-angkul",
    personInCharge: "Seksi Acara & Sekaa Gong",
    notes:
      "Arak-arakan temu manten disambut tabuh gilak baleganjur di depan angkul-angkul pekarangan.",
  },
  {
    startTime: "09:30",
    endTime: "11:00",
    segmentTitle: "Upacara Pabyakala, Makala-kalaan & Temu Manten",
    location: "Natah / Pekarangan Rumah",
    personInCharge: "Sulinggih / Pemangku & Saksi Adat",
    notes:
      "Prosesi inti penyucian lahir batin, tikeh dadakan, metegen-tegenan, dan mengitari kala hyang.",
  },
  {
    startTime: "11:00",
    endTime: "12:30",
    segmentTitle: "Sembahyang Merajan & Natab Banten Pawiwahan",
    location: "Merajan / Sanggah Gede",
    personInCharge: "Pemangku Merajan & Keluarga Inti",
    notes:
      "Mapejati dan piuning kehadapan Ida Bhatara Hyang Guru, natab banten panyeneng pawiwahan.",
  },
  {
    startTime: "12:30",
    endTime: "14:00",
    segmentTitle: "Jamuan Santap Siang Bersama & Ramah Tamah",
    location: "Bale Dangin & Area Tamu",
    personInCharge: "Seksi Konsumsi",
    notes:
      "Prasmanan masakan khas Bali (lawar, babi guling, sate lilit) untuk krama ngayah dan keluarga.",
  },
  {
    startTime: "14:00",
    endTime: "15:30",
    segmentTitle: "Penandatanganan Akta Perkawinan (Catatan Sipil)",
    location: "Bale Dangin / Ruang Tamu",
    personInCharge: "Seksi Kesekretariatan & Petugas Disdukcapil",
    notes:
      "Penandatanganan berkas sah perkawinan di hadapan prajuru desa dan saksi keluarga.",
  },
  {
    startTime: "17:30",
    endTime: "18:30",
    segmentTitle: "Touch-Up Rias & Ganti Busana Resepsi Modifikasi",
    location: "Bale Dauh / Kamar Pengantin",
    personInCharge: "Tim MUA",
    notes:
      "Persiapan busana resepsi malam dan sesi foto keluarga inti sebelum tamu tiba.",
  },
  {
    startTime: "18:30",
    endTime: "21:30",
    segmentTitle: "Resepsi Pawiwahan, Ramah Tamah Tamu & Hiburan",
    location: "Gedung Resepsi / Venue",
    personInCharge: "Ketua Panitia & MC",
    notes:
      "Penyambutan tamu undangan umum, ucapan selamat doa restu, foto bersama, dan live acoustic/rindik.",
  },
];

/**
 * Normalize time format to HH:MM (stripping seconds if present).
 */
export function formatTimeDisplay(timeStr: string | null | undefined): string {
  if (!timeStr) return "00:00";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return timeStr;
}

/**
 * Calculate duration between two HH:MM time strings in minutes.
 */
export function calculateDurationMinutes(
  startTime: string,
  endTime: string
): number {
  const [startH, startM] = formatTimeDisplay(startTime).split(":").map(Number);
  const [endH, endM] = formatTimeDisplay(endTime).split(":").map(Number);

  const startTotal = (startH || 0) * 60 + (startM || 0);
  const endTotal = (endH || 0) * 60 + (endM || 0);

  if (endTotal >= startTotal) {
    return endTotal - startTotal;
  }
  // Handles overnight span if any
  return 24 * 60 - startTotal + endTotal;
}

/**
 * Format duration into human-readable Indonesian text.
 */
export function formatDurationString(minutes: number): string {
  if (minutes <= 0) return "0 menit";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours} jam ${mins} mnt`;
  }
  if (hours > 0) {
    return `${hours} jam`;
  }
  return `${mins} menit`;
}

/**
 * Calculate aggregated statistics for a list of rundown events.
 */
export function calculateRundownStats(events: RundownEvent[]): RundownStats {
  let totalDurationMinutes = 0;
  let completedCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;
  let delayedCount = 0;
  let totalDelayMinutes = 0;

  const locationSet = new Set<string>();
  const picSet = new Set<string>();
  const dateSet = new Set<string>();

  for (const e of events) {
    totalDurationMinutes += calculateDurationMinutes(e.startTime, e.endTime);
    if (e.location) locationSet.add(e.location.trim());
    if (e.personInCharge) picSet.add(e.personInCharge.trim());
    if (e.scheduledDate) dateSet.add(e.scheduledDate.trim());

    if (e.status === "completed") {
      completedCount++;
    } else if (e.status === "in_progress") {
      inProgressCount++;
    } else if (e.status === "delayed") {
      delayedCount++;
    } else {
      pendingCount++;
    }

    if (e.delayMinutes && e.delayMinutes > 0) {
      totalDelayMinutes += e.delayMinutes;
    }
  }

  return {
    totalEvents: events.length,
    totalDurationMinutes,
    distinctLocations: locationSet.size,
    distinctPICs: picSet.size,
    datesCount: dateSet.size,
    completedCount,
    inProgressCount,
    pendingCount,
    delayedCount,
    totalDelayMinutes,
  };
}

/**
 * Generate formatted plain text rundown for easy sharing via WhatsApp or printing.
 */
export function formatRundownPlainText(
  events: RundownEvent[],
  coupleNames?: string,
  weddingDate?: string
): string {
  const title = `RUNDOWN ACARA PAWIWAHAN\n${coupleNames ? `${coupleNames}\n` : ""}${weddingDate ? `Hari/Tanggal: ${weddingDate}\n` : ""}`;
  const separator = "========================================\n";

  if (events.length === 0) {
    return `${title}${separator}Belum ada susunan acara rundown.`;
  }

  const lines = events.map((e, idx) => {
    const time = `${formatTimeDisplay(e.startTime)} - ${formatTimeDisplay(e.endTime)}`;
    const dur = formatDurationString(
      calculateDurationMinutes(e.startTime, e.endTime)
    );
    let line = `${idx + 1}. [${time}] (${dur}) ${e.segmentTitle}`;
    if (e.location) line += `\n   📍 Lokasi : ${e.location}`;
    if (e.personInCharge) line += `\n   👤 PIC    : ${e.personInCharge}`;
    if (e.status && e.status !== "pending") {
      line += `\n   ⚡ Status : ${RUNDOWN_STATUS_CONFIG[e.status]?.label || e.status}`;
    }
    if (e.actualStartTime) {
      line += ` (Aktual: ${e.actualStartTime}${e.actualEndTime ? ` - ${e.actualEndTime}` : ""})`;
    }
    if (e.notes) line += `\n   📝 Catatan: ${e.notes}`;
    return line;
  });

  return `${title}${separator}${lines.join("\n\n")}\n\n${separator}Patemon · Bali Hindu Wedding Planner`;
}

/**
 * Demo Mock Rundown Events for preview in `demo` workspace.
 */
export const DEMO_RUNDOWN_EVENTS: RundownEvent[] =
  STARTER_RUNDOWN_TEMPLATES.map((tpl, index) => {
    let status: RundownEventStatus = "pending";
    let actualStartTime: string | null = null;
    let actualEndTime: string | null = null;
    let delayMinutes = 0;

    if (index === 0) {
      status = "completed";
      actualStartTime = "05:00";
      actualEndTime = "07:25";
      delayMinutes = 0;
    } else if (index === 1) {
      status = "completed";
      actualStartTime = "06:30";
      actualEndTime = "08:30";
      delayMinutes = 0;
    } else if (index === 2) {
      status = "completed";
      actualStartTime = "07:15";
      actualEndTime = "09:05";
      delayMinutes = 15;
    } else if (index === 3) {
      status = "in_progress";
      actualStartTime = "08:45";
      delayMinutes = 15;
    } else if (index === 4) {
      status = "delayed";
      delayMinutes = 20;
    }

    return {
      id: `demo-rd-${index + 1}`,
      weddingId: "demo",
      ceremonyId: null,
      segmentTitle: tpl.segmentTitle,
      scheduledDate: "2026-12-20",
      startTime: tpl.startTime,
      endTime: tpl.endTime,
      location: tpl.location,
      personInCharge: tpl.personInCharge,
      picPhone: "081234567890",
      orderIndex: index + 1,
      notes: tpl.notes,
      status,
      actualStartTime,
      actualEndTime,
      delayMinutes,
      notesDayOf:
        status === "in_progress"
          ? "Rombongan pengantin telah tiba di depan angkul-angkul."
          : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
