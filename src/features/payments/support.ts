import type { WorkspaceEntitlement } from "./types";

export type SupportCategory =
  | "payment_issue"
  | "license_activation"
  | "adat_consultation"
  | "technical_support"
  | "refund_request"
  | "other";

export interface SupportTopicConfig {
  id: SupportCategory;
  label: string;
  description: string;
  badge: string;
}

export const DEFAULT_SUPPORT_WHATSAPP_PHONE = "6281234567890";

export const SUPPORT_TOPICS: SupportTopicConfig[] = [
  {
    id: "payment_issue",
    label: "Kendala Pembayaran",
    description: "Kendala saat transaksi Midtrans, QRIS, VA, atau kartu kredit",
    badge: "Prioritas Cepat",
  },
  {
    id: "license_activation",
    label: "Aktivasi Lisensi",
    description:
      "Konfirmasi status lisensi, kuitansi digital, atau sinkronisasi pesanan",
    badge: "Bantuan Lisensi",
  },
  {
    id: "adat_consultation",
    label: "Konsultasi Adat Pawiwahan",
    description:
      "Panduan rangkaian prosesi adat Bali, variasi dresta, atau banten",
    badge: "Konsultasi Adat",
  },
  {
    id: "technical_support",
    label: "Bantuan Teknis & Fitur",
    description:
      "Penggunaan rundown, pembagian tugas keluarga, buku tamu, atau ekspor",
    badge: "Dukungan Fitur",
  },
  {
    id: "refund_request",
    label: "Kebijakan Garansi & Refund",
    description: "Bantuan pembatalan pesanan atau permohonan pengembalian dana",
    badge: "Garansi",
  },
  {
    id: "other",
    label: "Pertanyaan Umum Lainnya",
    description:
      "Pertanyaan seputar kemitraan serati banten, vendor, atau saran",
    badge: "Umum",
  },
];

export interface SupportMessageOptions {
  category: SupportCategory | string;
  weddingId?: string;
  coupleNames?: string;
  orderNumber?: string;
  userMessage?: string;
  phone?: string;
}

/**
 * Standardizes receipt number formatting for Patemon verified transactions.
 * E.g. ORD-20261114-ABCD -> KW-ORD-20261114-ABCD
 */
export function formatReceiptNumber(orderNumber: string): string {
  if (!orderNumber) return "KW-UNKNOWN";
  if (orderNumber.startsWith("KW-")) return orderNumber;
  return `KW-${orderNumber}`;
}

/**
 * Normalizes phone numbers to standard international WhatsApp format without leading plus or zeroes.
 */
export function sanitizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) {
    return (
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
      DEFAULT_SUPPORT_WHATSAPP_PHONE
    );
  }

  const digits = phone.replace(/\D/g, "");
  if (!digits) return DEFAULT_SUPPORT_WHATSAPP_PHONE;

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (!digits.startsWith("62")) {
    return `62${digits}`;
  }
  return digits;
}

/**
 * Formats a contextual WhatsApp click-to-chat URL with pre-populated workspace metadata.
 */
export function formatSupportWhatsAppLink(
  options: SupportMessageOptions
): string {
  const categoryConfig = SUPPORT_TOPICS.find((t) => t.id === options.category);
  const categoryLabel = categoryConfig
    ? categoryConfig.label
    : options.category || "Bantuan Layanan Patemon";

  const phone = sanitizeWhatsAppPhone(options.phone);

  const lines: string[] = [
    "Om Swastyastu Tim Bantuan Patemon Bali,",
    "",
    `Saya membutuhkan bantuan perihal: *${categoryLabel}*`,
    "",
    "📋 *Detail Workspace & Akun:*",
  ];

  if (options.weddingId) {
    lines.push(`• ID Pawiwahan: ${options.weddingId}`);
  }
  if (options.coupleNames) {
    lines.push(`• Nama Mempelai: ${options.coupleNames}`);
  }
  if (options.orderNumber) {
    lines.push(`• No. Pesanan / Order ID: ${options.orderNumber}`);
  }

  if (options.userMessage && options.userMessage.trim().length > 0) {
    lines.push("");
    lines.push("💬 *Pesan / Kendala yang dialami:*");
    lines.push(options.userMessage.trim());
  }

  lines.push("");
  lines.push(
    "Mohon bantuannya untuk menindaklanjuti hal ini. Sukseme / Terima kasih."
  );

  const rawMessage = lines.join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(rawMessage)}`;
}

export interface AccessStateDetails {
  state:
    | "active_lifetime"
    | "expiring_soon"
    | "critical_expiring"
    | "expired_archive"
    | "revoked"
    | "free_preview";
  badgeLabel: string;
  badgeClass: string;
  title: string;
  description: string;
  canEdit: boolean;
  canInviteMembers: boolean;
  canExportCSV: boolean;
  daysRemaining: number | null;
  dataSovereigntyNote: string;
}

/**
 * Computes human-friendly access state indicators and explains
 * permanent data sovereignty & recovery rules for the wedding workspace.
 */
export function calculateAccessStateDetails(
  entitlement: WorkspaceEntitlement
): AccessStateDetails {
  // 1. Revoked status (e.g. chargeback or refund)
  if (entitlement.status === "revoked") {
    return {
      state: "revoked",
      badgeLabel: "Akses Ditangguhkan",
      badgeClass: "bg-destructive text-destructive-foreground",
      title: "Hak Akses Workspace Ditangguhkan",
      description:
        "Lisensi workspace ini telah dibatalkan atau ditangguhkan (misalnya karena pengembalian dana). Fitur edit dan kolaborasi dinonaktifkan.",
      canEdit: false,
      canInviteMembers: false,
      canExportCSV: true, // Data export remains available for sovereignty
      daysRemaining: 0,
      dataSovereigntyNote:
        "Sesuai prinsip kedaulatan data Patemon, Anda tetap dapat mengunduh salinan cadangan data (CSV & JSON) kapan saja.",
    };
  }

  // 2. Expired status (Graceful Read-Only Archive Mode per PRD 5.4)
  if (entitlement.status === "expired") {
    return {
      state: "expired_archive",
      badgeLabel: "Mode Arsip Baca-Saja",
      badgeClass:
        "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
      title: "Arsip Permanen Pasca-Upacara (Baca-Saja)",
      description:
        "Masa aktif perencanaan pawiwahan telah selesai. Workspace Anda kini beralih ke Mode Arsip Permanen: seluruh catatan dan momen tersimpan aman selamanya.",
      canEdit: false,
      canInviteMembers: false,
      canExportCSV: true,
      daysRemaining: 0,
      dataSovereigntyNote:
        "Data perencanaan dan buku tamu Anda tidak pernah dihapus. Anda dapat membuka atau mengunduh arsip kapan pun dibutuhkan.",
    };
  }

  // 3. Free Preview
  if (!entitlement.isPaid || entitlement.status === "free_preview") {
    return {
      state: "free_preview",
      badgeLabel: entitlement.isDemo ? "Demo Interaktif" : "Free Preview",
      badgeClass:
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300",
      title: "Pratinjau Perencanaan Pawiwahan",
      description:
        "Anda dapat mencoba fitur penyusunan banten, ritual adat, dan kalkulator kesiapan. Aktifkan lisensi penuh untuk mengundang keluarga dan panitia.",
      canEdit: entitlement.canEdit,
      canInviteMembers: false,
      canExportCSV: true,
      daysRemaining: null,
      dataSovereigntyNote:
        "Ekspor CSV dan JSON dapat diunduh kapan saja tanpa batasan.",
    };
  }

  // 4. Paid / Active with expiration date check
  if (entitlement.daysRemaining !== null) {
    if (entitlement.daysRemaining <= 14) {
      return {
        state: "critical_expiring",
        badgeLabel: `Berakhir dlm ${entitlement.daysRemaining} Hari`,
        badgeClass:
          "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300",
        title: "Masa Aktif Perencanaan Segera Berakhir",
        description: `Masa aktif penyusunan pawiwahan tersisa ${entitlement.daysRemaining} hari lagi. Setelahnya, workspace beralih secara otomatis ke Arsip Baca-Saja permanen tanpa risiko kehilangan data.`,
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        daysRemaining: entitlement.daysRemaining,
        dataSovereigntyNote:
          "Semua data Anda tetap utuh dan selalu dapat diekspor ke format CSV / JSON.",
      };
    }

    if (entitlement.daysRemaining <= 30) {
      return {
        state: "expiring_soon",
        badgeLabel: `Sisa ${entitlement.daysRemaining} Hari`,
        badgeClass:
          "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
        title: "Pengingat Masa Aktif Workspace",
        description: `Masa aktif tersisa ${entitlement.daysRemaining} hari. Setelah tanggal tersebut, workspace tetap dapat diakses dalam mode arsip baca-saja.`,
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        daysRemaining: entitlement.daysRemaining,
        dataSovereigntyNote:
          "Kedaulatan data terjamin: data tersimpan selamanya dalam mode baca.",
      };
    }
  }

  // 5. Active Lifetime (Standard)
  return {
    state: "active_lifetime",
    badgeLabel: "Lisensi Penuh Aktif",
    badgeClass: "bg-emerald-600 text-white",
    title: "Lisensi Penuh Pawiwahan Aktif",
    description:
      "Workspace Anda aktif sepenuhnya dengan akses tak terbatas untuk mengundang keluarga, koordinasi banten, anggaran, dan rundown acara.",
    canEdit: true,
    canInviteMembers: true,
    canExportCSV: true,
    daysRemaining: null,
    dataSovereigntyNote:
      "Penyimpanan data cloud privat terenkripsi dengan jaminan kedaulatan data dan ekspor seumur hidup.",
  };
}
