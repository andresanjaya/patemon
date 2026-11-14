/**
 * Balinese Wedding Day Rundown Seeds, Templates and Helpers for Patemon MVP v1 (Issue #31)
 */

import type { RundownEvent, RundownStats } from "./types";

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
  const locationSet = new Set<string>();
  const picSet = new Set<string>();
  const dateSet = new Set<string>();

  for (const e of events) {
    totalDurationMinutes += calculateDurationMinutes(e.startTime, e.endTime);
    if (e.location) locationSet.add(e.location.trim());
    if (e.personInCharge) picSet.add(e.personInCharge.trim());
    if (e.scheduledDate) dateSet.add(e.scheduledDate.trim());
  }

  return {
    totalEvents: events.length,
    totalDurationMinutes,
    distinctLocations: locationSet.size,
    distinctPICs: picSet.size,
    datesCount: dateSet.size,
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
    if (e.notes) line += `\n   📝 Catatan: ${e.notes}`;
    return line;
  });

  return `${title}${separator}${lines.join("\n\n")}\n\n${separator}Patemon · Bali Hindu Wedding Planner`;
}

/**
 * Demo Mock Rundown Events for preview in `demo` workspace.
 */
export const DEMO_RUNDOWN_EVENTS: RundownEvent[] =
  STARTER_RUNDOWN_TEMPLATES.map((tpl, index) => ({
    id: `demo-rd-${index + 1}`,
    weddingId: "demo",
    ceremonyId: null,
    segmentTitle: tpl.segmentTitle,
    scheduledDate: "2026-12-20",
    startTime: tpl.startTime,
    endTime: tpl.endTime,
    location: tpl.location,
    personInCharge: tpl.personInCharge,
    orderIndex: index + 1,
    notes: tpl.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
