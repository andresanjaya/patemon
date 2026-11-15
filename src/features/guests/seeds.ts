/**
 * Guest List & Household Seeds, Helpers and Calculations for Patemon MVP v1 (Issue #30)
 */

import type { Guest, GuestSide, GuestStats, InvitationStatus } from "./types";

export const GUEST_SIDES: {
  id: GuestSide;
  label: string;
  description: string;
  badgeClass: string;
}[] = [
  {
    id: "groom",
    label: "Purusa (Pria)",
    description: "Keluarga, kerabat & undangan mempelai pria",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  },
  {
    id: "bride",
    label: "Pradana (Wanita)",
    description: "Keluarga, kerabat & undangan mempelai wanita",
    badgeClass:
      "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800",
  },
  {
    id: "both",
    label: "Kedua Pihak / Bersama",
    description: "Sahabat bersama, rekan kerja, dan undangan umum",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  },
];

export const CANONICAL_GUEST_GROUPS = [
  "Keluarga Besar Dadia / Paibon",
  "Krama Banjar Adat & Tempekan",
  "Prajuru Adat & Tokoh Masyarakat",
  "Rekan Kerja & Instansi",
  "Sahabat / Teman Kuliah & Sekolah",
  "Kerabat Luar Daerah / Merantau",
  "Lainnya / Umum",
];

export const INVITATION_STATUS_CONFIG: Record<
  InvitationStatus,
  { label: string; badgeClass: string; description: string }
> = {
  draft: {
    label: "Konsep / Rencana",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    description:
      "Nama masuk dalam daftar undangan namun fisik/digital belum dikirim",
  },
  sent: {
    label: "Terkirim",
    badgeClass:
      "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    description: "Undangan fisik atau pesan undangan digital sudah disampaikan",
  },
  confirmed: {
    label: "Hadir (Konfirmasi)",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    description:
      "Telah mengonfirmasi kehadiran beserta jumlah rombongan keluarga",
  },
  declined: {
    label: "Berhalangan Hadir",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    description: "Menyampaikan permohonan maaf belum dapat hadir langsung",
  },
};

export function formatGuestSideLabel(side: GuestSide): string {
  if (side === "groom") return "Purusa (Pria)";
  if (side === "bride") return "Pradana (Wanita)";
  return "Kedua Pihak / Bersama";
}

export function getGuestSideBadgeClass(side: GuestSide): string {
  const match = GUEST_SIDES.find((s) => s.id === side);
  return (
    match?.badgeClass ||
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
  );
}

export function getInvitationStatusConfig(status: InvitationStatus) {
  return INVITATION_STATUS_CONFIG[status] || INVITATION_STATUS_CONFIG.draft;
}

/**
 * Calculate aggregated statistics for guests and expected headcounts.
 */
export function calculateGuestStats(guests: Guest[]): GuestStats {
  let totalHeadcount = 0;
  let invitedHeadcount = 0;
  let confirmedHeadcount = 0;
  let declinedHeadcount = 0;
  let pendingHeadcount = 0;
  let confirmedInvitations = 0;
  let sentInvitations = 0;
  let draftInvitations = 0;
  let pendingInvitations = 0;
  let declinedInvitations = 0;
  let groomHeadcount = 0;
  let brideHeadcount = 0;
  let mutualHeadcount = 0;

  for (const g of guests) {
    const quota = Number(g.headcount) > 0 ? Number(g.headcount) : 1;
    invitedHeadcount += quota;

    if (g.invitationStatus === "declined") {
      declinedHeadcount += quota;
      declinedInvitations += 1;
    } else {
      totalHeadcount += quota;

      if (g.side === "groom") {
        groomHeadcount += quota;
      } else if (g.side === "bride") {
        brideHeadcount += quota;
      } else {
        mutualHeadcount += quota;
      }

      if (g.invitationStatus === "confirmed") {
        // If specific RSVP attending pax was confirmed, count actual attending pax
        const attendingCount =
          typeof g.rsvpAttendingCount === "number" && g.rsvpAttendingCount >= 0
            ? g.rsvpAttendingCount
            : quota;
        confirmedHeadcount += attendingCount;
        confirmedInvitations += 1;
      } else if (g.invitationStatus === "sent") {
        sentInvitations += 1;
        pendingHeadcount += quota;
        pendingInvitations += 1;
      } else {
        draftInvitations += 1;
        pendingHeadcount += quota;
        pendingInvitations += 1;
      }
    }
  }

  return {
    totalInvitations: guests.length,
    totalHeadcount,
    invitedHeadcount,
    confirmedHeadcount,
    confirmedInvitations,
    sentInvitations,
    draftInvitations,
    pendingHeadcount,
    pendingInvitations,
    declinedHeadcount,
    declinedInvitations,
    actualAttendingPax: confirmedHeadcount,
    groomHeadcount,
    brideHeadcount,
    mutualHeadcount,
  };
}

/**
 * Format custom WhatsApp invitation link.
 */
export function formatWhatsAppInviteLink(
  phone: string | null | undefined,
  guestName: string,
  coupleNames?: string,
  formattedDate?: string
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

  const message = `Om Swastyastu ${guestName}, dengan penuh rasa syukur dan sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada upacara Pawiwahan kami (${coupleNames || "Kedua Mempelai"})${formattedDate ? ` pada hari ${formattedDate}` : ""}. Matur suksma.`;

  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}

/**
 * Export guests list to a CSV string with Excel UTF-8 BOM.
 */
export function exportGuestsToCSV(guests: Guest[]): string {
  const headers = [
    "Nama Undangan",
    "Pihak",
    "Kelompok / Dadia / Banjar",
    "Jumlah Pax (Headcount)",
    "Status Undangan",
    "Nomor Telepon",
    "Catatan Khusus",
  ];

  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = guests.map((g) => [
    escapeCSV(g.name),
    escapeCSV(formatGuestSideLabel(g.side)),
    escapeCSV(g.groupHousehold || "-"),
    escapeCSV(g.headcount),
    escapeCSV(getInvitationStatusConfig(g.invitationStatus).label),
    escapeCSV(g.phone || "-"),
    escapeCSV(g.notes || "-"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\r\n"
  );
  // Prepend UTF-8 BOM for Microsoft Excel compatibility
  return `\uFEFF${csvContent}`;
}

/**
 * Starter mock guests for demo preview workspace.
 */
export const DEMO_GUESTS: Guest[] = [
  {
    id: "demo-g-1",
    weddingId: "demo",
    name: "Jero Mangku Wayan Sudarma & Keluarga",
    side: "groom",
    groupHousehold: "Keluarga Besar Dadia / Paibon",
    headcount: 4,
    invitationStatus: "confirmed",
    phone: "081234567890",
    notes: "Sesepuh dadia, mohon tempatkan dekat bale dangin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rsvpToken: "demo-rsvp-token-mangku-wayan",
    rsvpAttendingCount: 4,
    rsvpNotes: "Rahajeng pawiwahan, dumogi langgeng riwekasan.",
    rsvpSubmittedAt: new Date().toISOString(),
  },
  {
    id: "demo-g-2",
    weddingId: "demo",
    name: "Kelian Banjar Adat & Prajuru",
    side: "groom",
    groupHousehold: "Prajuru Adat & Tokoh Masyarakat",
    headcount: 6,
    invitationStatus: "confirmed",
    phone: "081338123456",
    notes: "Undangan prajuru banjar pengiring adat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rsvpToken: "demo-rsvp-token-kelian-banjar",
    rsvpAttendingCount: 5,
    rsvpNotes: "Prajuru banjar siap ngiring upacara.",
    rsvpSubmittedAt: new Date().toISOString(),
  },
  {
    id: "demo-g-3",
    weddingId: "demo",
    name: "I Made Sukadana (Paman dari Singaraja)",
    side: "bride",
    groupHousehold: "Kerabat Luar Daerah / Merantau",
    headcount: 3,
    invitationStatus: "sent",
    phone: "081999887766",
    notes: "Tiba H-1 menginap di rumah keluarga",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rsvpToken: "demo-rsvp-token-made-sukadana",
  },
  {
    id: "demo-g-4",
    weddingId: "demo",
    name: "Krama Tempekan Kaja (10 KK)",
    side: "both",
    groupHousehold: "Krama Banjar Adat & Tempekan",
    headcount: 20,
    invitationStatus: "sent",
    phone: null,
    notes: "Undangan perwakilan krama tempekan saat resepsi sore",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rsvpToken: "demo-rsvp-token-tempekan-kaja",
  },
  {
    id: "demo-g-5",
    weddingId: "demo",
    name: "Rekan Tim Divisi IT Kantor",
    side: "both",
    groupHousehold: "Rekan Kerja & Instansi",
    headcount: 8,
    invitationStatus: "confirmed",
    phone: "085737001122",
    notes: "Hadir saat sesi resepsi malam",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rsvpToken: "demo-rsvp-token-tim-it-kantor",
    rsvpAttendingCount: 8,
  },
  {
    id: "demo-g-6",
    weddingId: "demo",
    name: "Nyoman Artha & Istri (Jakarta)",
    side: "bride",
    groupHousehold: "Kerabat Luar Daerah / Merantau",
    headcount: 2,
    invitationStatus: "declined",
    phone: "081805123999",
    notes: "Berhalangan hadir karena dinas luar kota, titip doa restu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rsvpToken: "demo-rsvp-token-nyoman-artha",
    rsvpAttendingCount: 0,
    rsvpNotes:
      "Mohon maaf belum bisa hadir langsung, selamat menempuh hidup baru.",
    rsvpSubmittedAt: new Date().toISOString(),
  },
  {
    id: "demo-g-7",
    weddingId: "demo",
    name: "Sahabat Kuliah Fakultas Teknik",
    side: "both",
    groupHousehold: "Sahabat / Teman Kuliah & Sekolah",
    headcount: 12,
    invitationStatus: "draft",
    phone: null,
    notes: "Sedang konfirmasi daftar hadir di grup WhatsApp angkatan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rsvpToken: "demo-rsvp-token-sahabat-kuliah",
  },
];
