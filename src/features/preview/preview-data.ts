import type { WeddingCeremony } from "@/features/ceremonies/types";
import type { BantenItem } from "@/features/banten/types";
import type { WeddingTask } from "@/features/checklist/types";
import type { BudgetItem } from "@/features/budget/types";
import type { Vendor, VendorStats } from "@/features/vendors/types";
import type { Guest, GuestStats } from "@/features/guests/types";
import type { RundownEvent, RundownStats } from "@/features/rundown/types";
import type { ActivityLog } from "@/features/activity-logs/types";

import { DEMO_BUDGET_ITEMS } from "@/features/budget/seeds";
import { DEMO_TASKS } from "@/features/checklist/seeds";
import { DEMO_VENDORS, calculateVendorStats } from "@/features/vendors/seeds";
import { DEMO_GUESTS, calculateGuestStats } from "@/features/guests/seeds";
import { DEMO_RUNDOWN_EVENTS, calculateRundownStats } from "@/features/rundown/seeds";
import { DEMO_ACTIVITY_LOGS } from "@/features/activity-logs/seeds";

/**
 * Returns an ISO date string (YYYY-MM-DD) shifted relative to today.
 * Ensures preview sample dates are always realistic, current, and never look outdated.
 */
export function getRelativeDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/**
 * Generates sample ceremonies for preview mode with relative dates.
 */
export function getPreviewCeremonies(weddingId: string): WeddingCeremony[] {
  return [
    {
      id: `${weddingId}-preview-c1`,
      weddingId,
      templateId: "PR-001",
      title: "Memadik / Ngidih (Peminangan Resmi)",
      phase: "Persiapan",
      scheduledDate: getRelativeDate(-20),
      startTime: "09:00",
      endTime: "12:00",
      location: "Rumah Pradana (Sanur)",
      personInCharge: "Keluarga Purusa & Kelihan Banjar",
      orderIndex: 1,
      status: "confirmed",
      customNotes: "Peminangan adat resmi dihadiri prajuru banjar kedua pihak.",
    },
    {
      id: `${weddingId}-preview-c2`,
      weddingId,
      templateId: "PR-002",
      title: "Mebyakala / Pabyakalaan",
      phase: "Puncak Acara",
      scheduledDate: getRelativeDate(30),
      startTime: "08:00",
      endTime: "10:00",
      location: "Pekarangan Rumah Purusa (Denpasar)",
      personInCharge: "Jero Mangku Griya",
      orderIndex: 2,
      status: "draft",
      customNotes: "Penyucian rohani kedua mempelai dari noda bhuta kala.",
    },
    {
      id: `${weddingId}-preview-c3`,
      weddingId,
      templateId: "PR-003",
      title: "Madengen-dengen / Metegen-tegenan",
      phase: "Puncak Acara",
      scheduledDate: getRelativeDate(30),
      startTime: "10:00",
      endTime: "11:30",
      location: "Halaman Sanggah Kamulan",
      personInCharge: "Serati Banten & Saksi Adat",
      orderIndex: 3,
      status: "draft",
      customNotes: "Simbol tegen-tegenan purusa dan suun-suunan pradana.",
    },
    {
      id: `${weddingId}-preview-c4`,
      weddingId,
      templateId: "PR-004",
      title: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
      phase: "Puncak Acara",
      scheduledDate: getRelativeDate(30),
      startTime: "11:30",
      endTime: "13:00",
      location: "Merajan Gede Keluarga",
      personInCharge: "Ida Pedanda Gede",
      orderIndex: 4,
      status: "draft",
      customNotes: "Penyatuan di hadapan Hyang Widhi Wasa dan leluhur.",
    },
    {
      id: `${weddingId}-preview-c5`,
      weddingId,
      templateId: "PR-005",
      title: "Mejaya-jaya",
      phase: "Puncak Acara",
      scheduledDate: getRelativeDate(30),
      startTime: "13:00",
      endTime: "14:00",
      location: "Merajan Gede Keluarga",
      personInCharge: "Ida Pedanda Gede",
      orderIndex: 5,
      status: "draft",
      customNotes: "Pemberkatan rohani pamungkas pawiwahan.",
    },
  ];
}

/**
 * Retrieves a single preview ceremony by ID.
 */
export function getPreviewCeremonyById(
  weddingId: string,
  ceremonyId: string
): WeddingCeremony | null {
  const ceremonies = getPreviewCeremonies(weddingId);
  return ceremonies.find((c) => c.id === ceremonyId) || null;
}

/**
 * Generates sample banten and ritual procurement items for preview mode.
 */
export function getPreviewBantenItems(weddingId: string): BantenItem[] {
  return [
    {
      id: `${weddingId}-preview-b1`,
      weddingId,
      ceremonyId: `${weddingId}-preview-c2`,
      ceremonyTitle: "Mebyakala / Pabyakalaan",
      catalogId: "BN-PKT-001",
      name: "Paket Banten Mebyakala Lengkap",
      category: "utama",
      quantity: 1,
      unit: "Paket",
      sourcingMethod: "purchased_package",
      status: "ready",
      reviewStatus: "approved",
      reviewerName: "Jero Mangku Griya Sanur",
      reviewerType: "external_practitioner",
      recordedByName: "Dicatat oleh Keluarga Purusa",
      reviewedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      reviewNotes:
        "Sesuai dresta Griya Sanur, ayam brumbun dan sanggah cucuk lengkap.",
      sourceReference: "Pedoman Pawiwahan PHDI & Griya Sanur",
      assigneeName: "Serati Griya Sanur",
      estimatedPrice: 450000,
      actualPrice: 450000,
      notes:
        "Lengkap dengan sanggah cucuk, ayam brumbun, dan tetabuhan arak-berem.",
    },
    {
      id: `${weddingId}-preview-b2`,
      weddingId,
      ceremonyId: `${weddingId}-preview-c2`,
      ceremonyTitle: "Mebyakala / Pabyakalaan",
      catalogId: "BN-SAT-002",
      name: "Banten Prayascita Luwih",
      category: "madya",
      quantity: 1,
      unit: "Paket",
      sourcingMethod: "purchased_package",
      status: "ordered",
      reviewStatus: "approved",
      reviewerName: "Serati Banten Ibu Nyoman",
      reviewerType: "external_practitioner",
      recordedByName: "Dicatat oleh Keluarga Pradana",
      reviewedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      reviewNotes:
        "Perlengkapan prayascita disetujui untuk pembersihan penganten.",
      sourceReference: "Dresta Bali Selatan",
      assigneeName: "Serati Griya Sanur",
      estimatedPrice: 350000,
      actualPrice: 350000,
      notes: "Penyucian sarwa prani dan perlengkapan sembahyang penganten.",
    },
    {
      id: `${weddingId}-preview-b3`,
      weddingId,
      ceremonyId: `${weddingId}-preview-c2`,
      ceremonyTitle: "Mebyakala / Pabyakalaan",
      catalogId: "BN-SAT-003",
      name: "Banten Durmanggala",
      category: "sarana_pelengkap",
      quantity: 1,
      unit: "Paket",
      sourcingMethod: "self_made",
      status: "making",
      reviewStatus: "needs_review",
      reviewNotes: "Perlu konfirmasi apakah perlu panyapsap tambahan.",
      assigneeName: "Ibu & Tante Mempelai",
      estimatedPrice: 150000,
      actualPrice: 120000,
      notes: "Dibuat bersama keluarga besar saat mareresik.",
    },
    {
      id: `${weddingId}-preview-b4`,
      weddingId,
      ceremonyId: `${weddingId}-preview-c4`,
      ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
      catalogId: "BN-PKT-003",
      name: "Paket Banten Pawiwahan Sanggah Kamulan",
      category: "utama",
      quantity: 1,
      unit: "Paket",
      sourcingMethod: "purchased_package",
      status: "ordered",
      reviewStatus: "needs_revision",
      reviewerName: "Ida Bagus Made (Ketua Panitia)",
      reviewerType: "internal_member",
      recordedByName: "Dicatat oleh Ida Bagus Made",
      reviewedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      reviewNotes:
        "Perlu disesuaikan tumpeng 7 tanding sesuai dresta keluarga griya.",
      assigneeName: "Griya Pedanda Gede",
      estimatedPrice: 1250000,
      actualPrice: 1250000,
      notes: "Penyatuan di hadapan Hyang Guru dan Bhatara Hyang Kamulan.",
    },
    {
      id: `${weddingId}-preview-b5`,
      weddingId,
      ceremonyId: `${weddingId}-preview-c3`,
      ceremonyTitle: "Madengen-dengen / Metegen-tegenan",
      catalogId: "BN-SRN-001",
      name: "Sarana Tegen-tegenan & Suun-suunan",
      category: "sarana_pelengkap",
      quantity: 1,
      unit: "Set",
      sourcingMethod: "family_assigned",
      status: "needed",
      reviewStatus: "needs_review",
      assigneeName: "Keluarga Purusa (Bli Wayan)",
      estimatedPrice: 250000,
      actualPrice: 0,
      notes: "Kukusan, tebu, pala gantung, pala bungkah, dan bakul belanja.",
    },
    {
      id: `${weddingId}-preview-b6`,
      weddingId,
      ceremonyId: `${weddingId}-preview-c4`,
      ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
      catalogId: "BN-SRN-002",
      name: "Kelapa Gading Kembar",
      category: "sarana_pelengkap",
      quantity: 2,
      unit: "Bungkul",
      sourcingMethod: "family_assigned",
      status: "ready",
      reviewStatus: "approved",
      reviewerName: "Paman Klungkung (Keluarga)",
      reviewerType: "internal_member",
      recordedByName: "Dicatat oleh Keluarga",
      reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      reviewNotes: "Sudah diukir motif Semara Ratih sesuai tradisi.",
      assigneeName: "Paman Klungkung",
      estimatedPrice: 75000,
      actualPrice: 60000,
      notes: "Diukir gambar Sang Hyang Semara Ratih.",
    },
    {
      id: `${weddingId}-preview-b7`,
      weddingId,
      ceremonyId: `${weddingId}-preview-c4`,
      ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
      catalogId: "BN-SAT-004",
      name: "Banten Pejati Lengkap",
      category: "madya",
      quantity: 4,
      unit: "Tanding",
      sourcingMethod: "self_made",
      status: "making",
      reviewStatus: "approved",
      reviewerName: "Jero Mangku Griya Sanur",
      reviewerType: "external_practitioner",
      recordedByName: "Dicatat oleh Keluarga",
      reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      reviewNotes:
        "4 tanding untuk Kamulan, Lebuh, Surya, dan Penganten disetujui.",
      assigneeName: "Ibu & Bibi",
      estimatedPrice: 300000,
      actualPrice: 280000,
      notes: "Daksina, ketupat kelanan, peras, dan ajuman.",
    },
  ];
}

/**
 * Generates sample checklist tasks with relative due dates.
 */
export function getPreviewTasks(weddingId: string): WeddingTask[] {
  return DEMO_TASKS.map((t, idx) => ({
    ...t,
    id: `${weddingId}-preview-task-${idx + 1}`,
    weddingId,
    dueDate: getRelativeDate((idx - 3) * 7),
  }));
}

/**
 * Generates sample budget line items.
 */
export function getPreviewBudgetItems(weddingId: string): BudgetItem[] {
  return DEMO_BUDGET_ITEMS.map((b, idx) => ({
    ...b,
    id: `${weddingId}-preview-budget-${idx + 1}`,
    weddingId,
    payments: b.payments.map((p, pIdx) => ({
      ...p,
      id: `${weddingId}-preview-payment-${idx + 1}-${pIdx + 1}`,
      budgetItemId: `${weddingId}-preview-budget-${idx + 1}`,
      weddingId,
      paymentDate: getRelativeDate(-15 + pIdx * 5),
    })),
  }));
}

/**
 * Generates sample vendors for preview mode.
 */
export function getPreviewVendors(weddingId: string): {
  vendors: Vendor[];
  stats: VendorStats;
} {
  const vendors = DEMO_VENDORS.map((v, idx) => ({
    ...v,
    id: `${weddingId}-preview-vendor-${idx + 1}`,
    weddingId,
  }));
  return {
    vendors,
    stats: calculateVendorStats(vendors),
  };
}

/**
 * Generates sample guests for preview mode.
 */
export function getPreviewGuests(weddingId: string): {
  guests: Guest[];
  stats: GuestStats;
} {
  const guests = DEMO_GUESTS.map((g, idx) => ({
    ...g,
    id: `${weddingId}-preview-guest-${idx + 1}`,
    weddingId,
  }));
  return {
    guests,
    stats: calculateGuestStats(guests),
  };
}

/**
 * Generates sample rundown events with relative day date.
 */
export function getPreviewRundown(weddingId: string): {
  events: RundownEvent[];
  stats: RundownStats;
} {
  const weddingDay = getRelativeDate(30);
  const events = DEMO_RUNDOWN_EVENTS.map((e, idx) => ({
    ...e,
    id: `${weddingId}-preview-rd-${idx + 1}`,
    weddingId,
    scheduledDate: weddingDay,
  }));
  return {
    events,
    stats: calculateRundownStats(events),
  };
}

/**
 * Generates sample activity log audit trail for preview mode.
 */
export function getPreviewActivityLogs(weddingId: string): ActivityLog[] {
  return DEMO_ACTIVITY_LOGS.map((log, idx) => ({
    ...log,
    id: `${weddingId}-preview-log-${idx + 1}`,
    weddingId,
    createdAt: new Date(Date.now() - (idx + 1) * 3600 * 1000 * 6).toISOString(),
  }));
}
