/**
 * Domain-specific CSV Formatters for Patemon Balinese Hindu Wedding Planner
 * Converts in-memory planning state into RFC-4180 compliant CSV strings.
 */

import { generateCSV } from "@/lib/csv-export";
import type { BantenItem } from "@/features/banten/types";
import type { WeddingTask } from "@/features/checklist/types";
import type { BudgetItem } from "@/features/budget/types";
import type { Vendor } from "@/features/vendors/types";
import type { RundownEvent } from "@/features/rundown/types";
import type { Guest } from "@/features/guests/types";
import {
  formatGuestSideLabel,
  getInvitationStatusConfig,
} from "@/features/guests/seeds";
import { getCategoryLabel } from "@/features/checklist/seeds";
import { calculateDurationMinutes } from "@/features/rundown/seeds";

/**
 * Format Banten items into an Excel-ready CSV string.
 */
export function formatBantenToCSV(items: BantenItem[]): string {
  const headers = [
    "Nama Sarana Banten",
    "Upacara / Rangkaian",
    "Kategori",
    "Jumlah",
    "Satuan",
    "Metode Pengadaan",
    "Status Pengadaan",
    "Penanggung Jawab (PIC)",
    "Estimasi Biaya (IDR)",
    "Biaya Riil (IDR)",
    "Catatan Khusus",
  ];

  const methodLabels: Record<string, string> = {
    self_made: "Ngayah Keluarga",
    purchased_package: "Beli Paket Serati",
    family_assigned: "Ditugaskan ke Kerabat",
    unassigned: "Belum Ditentukan",
  };

  const statusLabels: Record<string, string> = {
    ready: "Siap di Lokasi",
    making: "Sedang Dibuat",
    ordered: "Dipesan Serati",
    needed: "Dibutuhkan",
    not_needed: "Tidak Diperlukan",
  };

  const rows = items.map((item) => [
    item.name,
    item.ceremonyTitle || "Umum / Semua Rangkaian",
    item.category || "Umum",
    item.quantity,
    item.unit,
    methodLabels[item.sourcingMethod] || item.sourcingMethod,
    statusLabels[item.status] || item.status,
    item.assigneeName || "-",
    item.estimatedPrice || 0,
    item.actualPrice || 0,
    item.notes || "-",
  ]);

  return generateCSV(headers, rows);
}

/**
 * Format wedding tasks checklist into CSV.
 */
export function formatTasksToCSV(tasks: WeddingTask[]): string {
  const headers = [
    "Nama Tugas",
    "Upacara Terkait",
    "Kategori",
    "Prioritas",
    "Status Pengerjaan",
    "Penanggung Jawab (PIC)",
    "Tenggat Waktu",
    "Deskripsi & Instruksi",
  ];

  const priorityLabels: Record<string, string> = {
    urgent: "Mendesak (P0)",
    high: "Tinggi (P1)",
    medium: "Sedang (P2)",
    low: "Rendah (P3)",
  };

  const statusLabels: Record<string, string> = {
    todo: "Belum Dimulai",
    in_progress: "Dalam Pengerjaan",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  const rows = tasks.map((task) => [
    task.title,
    task.ceremonyTitle || "Umum / Keseluruhan",
    getCategoryLabel(task.category),
    priorityLabels[task.priority] || task.priority,
    statusLabels[task.status] || task.status,
    task.assigneeName || "-",
    task.dueDate || "-",
    task.description || "-",
  ]);

  return generateCSV(headers, rows);
}

/**
 * Format budget line items into CSV.
 */
export function formatBudgetItemsToCSV(items: BudgetItem[]): string {
  const headers = [
    "Kategori Anggaran",
    "Nama Pos Pengeluaran",
    "Anggaran Rencana (IDR)",
    "Biaya Aktual (IDR)",
    "Sudah Dibayar (IDR)",
    "Sisa Pembayaran (IDR)",
    "Status Pos",
    "Tanggung Jawab Pembayaran",
    "Catatan",
  ];

  const statusLabels: Record<string, string> = {
    estimated: "Estimasi / Rencana",
    booked: "Dipesan / Komitmen",
    paid_partial: "Sebagian (DP)",
    paid_full: "Lunas",
    canceled: "Dibatalkan",
  };

  const rows = items.map((item) => {
    const effectiveTotal =
      item.actualAmount > 0 ? item.actualAmount : item.plannedAmount;
    const outstanding = Math.max(0, effectiveTotal - item.paidAmount);
    return [
      item.category,
      item.title,
      item.plannedAmount,
      item.actualAmount || 0,
      item.paidAmount,
      outstanding,
      statusLabels[item.status] || item.status,
      item.paidBy || "Bersama",
      item.notes || "-",
    ];
  });

  return generateCSV(headers, rows);
}

/**
 * Format individual payment transaction history into CSV.
 */
export function formatPaymentsToCSV(items: BudgetItem[]): string {
  const headers = [
    "Tanggal Pembayaran",
    "Pos Pengeluaran",
    "Kategori",
    "Jumlah Pembayaran (IDR)",
    "Metode Pembayaran",
    "Pihak Pembayar",
    "Penerima Pembayaran",
    "Catatan & Bukti",
  ];

  const rows: (string | number | null | undefined)[][] = [];

  for (const item of items) {
    if (item.payments && item.payments.length > 0) {
      for (const p of item.payments) {
        rows.push([
          p.paymentDate,
          item.title,
          item.category,
          p.amount,
          p.paymentMethod || "Transfer Bank",
          item.paidBy || "-",
          p.recipient || "-",
          p.notes || "-",
        ]);
      }
    }
  }

  // Sort chronologically by payment date
  rows.sort((a, b) => {
    const dateA = String(a[0] || "");
    const dateB = String(b[0] || "");
    return dateA.localeCompare(dateB);
  });

  return generateCSV(headers, rows);
}

/**
 * Format vendor list into CSV.
 */
export function formatVendorsToCSV(vendors: Vendor[]): string {
  const headers = [
    "Nama Vendor",
    "Kategori Layanan",
    "Nama Kontak (PIC)",
    "Nomor Telepon",
    "Tautan / Media Sosial",
    "Status Pemesanan",
    "Nilai Kesepakatan / Estimasi (IDR)",
    "Uang Muka / Terbayar (IDR)",
    "Sisa Pembayaran (IDR)",
    "Catatan & Kesepakatan",
  ];

  const statusLabels: Record<string, string> = {
    prospect: "Riset / Prospek",
    contacted: "Dalam Diskusi",
    quoted: "Penawaran Masuk",
    booked: "Dipesan & Terkonfirmasi",
    completed: "Selesai",
    canceled: "Dibatalkan",
  };

  const rows = vendors.map((v) => {
    const totalAmount = v.agreedAmount > 0 ? v.agreedAmount : v.quoteAmount;
    return [
      v.name,
      v.category,
      v.contactPerson || v.picName || "-",
      v.phone || "-",
      v.socialLink || "-",
      statusLabels[v.status] || v.status,
      totalAmount,
      v.paidAmount,
      v.dueAmount,
      v.notes || "-",
    ];
  });

  return generateCSV(headers, rows);
}

/**
 * Format wedding day rundown into CSV (panitia coordination sheet).
 */
export function formatRundownToCSV(events: RundownEvent[]): string {
  const headers = [
    "Urutan",
    "Rangkaian Upacara",
    "Waktu Mulai (WITA)",
    "Waktu Selesai (WITA)",
    "Durasi (Menit)",
    "Nama Kegiatan / Segmen",
    "Lokasi Acara",
    "Koordinator / PIC",
    "Deskripsi Acara",
    "Catatan Khusus",
  ];

  // Sort events by orderIndex / startTime
  const sorted = [...events].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
    return a.startTime.localeCompare(b.startTime);
  });

  const rows = sorted.map((evt, idx) => [
    idx + 1,
    evt.ceremonyTitle || "Hari-H Pawiwahan",
    evt.startTime,
    evt.endTime || "-",
    calculateDurationMinutes(evt.startTime, evt.endTime),
    evt.segmentTitle,
    evt.location || "-",
    evt.personInCharge || "-",
    evt.segmentTitle,
    evt.notes || "-",
  ]);

  return generateCSV(headers, rows);
}

/**
 * Format guest list into CSV (Excel UTF-8 compatible).
 */
export function formatGuestsToCSV(guests: Guest[]): string {
  const headers = [
    "Nama Undangan",
    "Pihak",
    "Kelompok / Dadia / Banjar",
    "Jumlah Pax (Headcount)",
    "Status Undangan",
    "Nomor Telepon",
    "Catatan Khusus",
  ];

  const rows = guests.map((g) => [
    g.name,
    formatGuestSideLabel(g.side),
    g.groupHousehold || "-",
    g.headcount,
    getInvitationStatusConfig(g.invitationStatus).label,
    g.phone || "-",
    g.notes || "-",
  ]);

  return generateCSV(headers, rows);
}
