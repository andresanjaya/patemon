/**
 * Offline Day-of Packet Generator for Balinese Weddings (Issue #89)
 *
 * Produces a standalone, single-file HTML document that:
 * - Requires ZERO remote assets, CDN scripts, or web fonts.
 * - Opens reliably on any mobile/desktop browser when offline with zero signal.
 * - Contains snapshot metadata & clear non-synchronized read-only indicators.
 * - Formats neatly for A4 monochrome/grayscale printing without clipping columns.
 * - Contains NO session tokens, keys, passwords, or guest personal numbers.
 */

import type { RundownEvent } from "@/features/rundown/types";
import type { BantenItem } from "@/features/banten/types";
import type { WeddingTask } from "@/features/checklist/types";
import {
  formatTimeDisplay,
  formatDurationString,
  calculateDurationMinutes,
  RUNDOWN_STATUS_CONFIG,
} from "@/features/rundown/seeds";

export interface OfflinePackOptions {
  includeRundown: boolean;
  includeBanten: boolean;
  includePicContacts: boolean;
  includeChecklistTasks?: boolean;
}

export interface PicContactEntry {
  name: string;
  phone?: string | null;
  roles: string[];
}

export interface OfflinePackData {
  weddingTitle: string;
  coupleNames: string;
  prospectiveDate?: string | null;
  location?: string | null;
  generatedAtWita: string;
  rundownEvents?: RundownEvent[];
  bantenItems?: BantenItem[];
  tasks?: WeddingTask[];
}

/**
 * Escapes HTML characters to prevent XSS injection in standalone HTML packets.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Extract and deduplicate all PIC contacts and their assigned roles across rundown, banten, and tasks.
 */
export function extractPicDirectory(
  rundown: RundownEvent[] = [],
  banten: BantenItem[] = [],
  tasks: WeddingTask[] = []
): PicContactEntry[] {
  const map = new Map<
    string,
    { name: string; phone?: string | null; roles: Set<string> }
  >();

  // 1. Rundown PICs
  for (const event of rundown) {
    if (event.personInCharge?.trim()) {
      const key = event.personInCharge.trim().toLowerCase();
      const existing = map.get(key) || {
        name: event.personInCharge.trim(),
        phone: event.picPhone?.trim() || null,
        roles: new Set<string>(),
      };
      if (event.picPhone?.trim() && !existing.phone) {
        existing.phone = event.picPhone.trim();
      }
      existing.roles.add(
        `Rundown: ${event.segmentTitle} (${formatTimeDisplay(event.startTime)})`
      );
      map.set(key, existing);
    }
  }

  // 2. Banten Assignees
  for (const item of banten) {
    if (item.assigneeName?.trim()) {
      const key = item.assigneeName.trim().toLowerCase();
      const existing = map.get(key) || {
        name: item.assigneeName.trim(),
        phone: null,
        roles: new Set<string>(),
      };
      existing.roles.add(`Banten: ${item.name}`);
      map.set(key, existing);
    }
  }

  // 3. Task Assignees
  for (const task of tasks) {
    if (task.assigneeName?.trim()) {
      const key = task.assigneeName.trim().toLowerCase();
      const existing = map.get(key) || {
        name: task.assigneeName.trim(),
        phone: null,
        roles: new Set<string>(),
      };
      existing.roles.add(`Tugas: ${task.title}`);
      map.set(key, existing);
    }
  }

  return Array.from(map.values())
    .map((entry) => ({
      name: entry.name,
      phone: entry.phone || null,
      roles: Array.from(entry.roles),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generates an entirely self-contained, offline-compatible HTML file string.
 */
export function generateOfflineHtmlPack(
  data: OfflinePackData,
  options: OfflinePackOptions
): string {
  const {
    coupleNames,
    prospectiveDate,
    location,
    generatedAtWita,
    rundownEvents = [],
    bantenItems = [],
    tasks = [],
  } = data;

  const picDirectory = options.includePicContacts
    ? extractPicDirectory(rundownEvents, bantenItems, tasks)
    : [];

  const safeCoupleNames = escapeHtml(coupleNames);
  const safeDate = escapeHtml(prospectiveDate || "Dewasa Ayu");
  const safeLocation = escapeHtml(location || "Keluarga Pawiwahan");
  const safeTimestamp = escapeHtml(generatedAtWita);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paket Panduan Hari-H - ${safeCoupleNames}</title>
  <style>
    /* ==========================================================================
       Pure System Styles - Zero Remote Network Requests, Fonts, or Scripts
       Optimized for A4 Printing & Monochrome Contrast
       ========================================================================== */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.45;
      color: #111827;
      background-color: #f9fafb;
      padding: 0;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }

    /* Screen Topbar Navigation */
    .screen-topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background-color: #18181b;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .topbar-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: #27272a;
      border: 1px solid #3f3f46;
      color: #e4e4e7;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }

    .btn-print {
      background-color: #f59e0b;
      color: #000000;
      font-weight: 700;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background-color: #d97706;
    }

    .container {
      max-width: 960px;
      margin: 20px auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    /* Snapshot Alert Banner */
    .snapshot-alert {
      background-color: #fffbeb;
      border: 2px solid #fde68a;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      color: #92400e;
    }
    .snapshot-alert h4 {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .snapshot-alert p {
      font-size: 12px;
      line-height: 1.4;
      color: #b45309;
    }

    /* Document Header */
    .doc-header {
      border-bottom: 2px solid #111827;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .doc-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #111827;
      line-height: 1.2;
    }

    .doc-subtitle {
      font-size: 15px;
      font-weight: 600;
      color: #4b5563;
      margin-top: 4px;
    }

    .doc-meta {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .doc-watermark {
      text-align: right;
      font-size: 11px;
      color: #4b5563;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      border-radius: 6px;
      min-width: 180px;
    }

    /* Section Styles */
    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #111827;
      border-left: 4px solid #f59e0b;
      padding-left: 10px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-count {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: none;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th {
      background-color: #f3f4f6;
      color: #111827;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td {
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
      color: #1f2937;
    }

    tr:nth-child(even) td {
      background-color: #f9fafb;
    }

    .nowrap {
      white-space: nowrap;
    }

    .badge-status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      border: 1px solid #d1d5db;
      background: #f3f4f6;
      color: #374151;
    }

    .badge-delay {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      border: 1px solid #fca5a5;
      background: #fee2e2;
      color: #991b1b;
    }

    .doc-footer {
      margin-top: 40px;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      font-size: 11px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* ==========================================================================
       Print-Specific Rules (A4 Monochrome/Grayscale Friendly)
       ========================================================================== */
    @media print {
      @page {
        size: A4 portrait;
        margin: 12mm 14mm;
      }

      body {
        background-color: #ffffff !important;
        font-size: 11px;
        color: #000000 !important;
      }

      .no-print {
        display: none !important;
      }

      .container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }

      .snapshot-alert {
        border: 1px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
        padding: 8px 12px !important;
        margin-bottom: 16px !important;
      }
      .snapshot-alert h4, .snapshot-alert p {
        color: #000000 !important;
      }

      .doc-header {
        border-bottom: 2px solid #000000 !important;
        padding-bottom: 12px !important;
        margin-bottom: 16px !important;
      }

      .doc-title {
        font-size: 18px !important;
        color: #000000 !important;
      }

      .section-title {
        border-left: 4px solid #000000 !important;
        color: #000000 !important;
        font-size: 13px !important;
      }

      th {
        background-color: #eeeeee !important;
        color: #000000 !important;
        border: 1px solid #333333 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      td {
        border: 1px solid #444444 !important;
        color: #000000 !important;
        padding: 6px 8px !important;
      }

      tr:nth-child(even) td {
        background-color: #ffffff !important;
      }

      .badge-status, .badge-delay {
        border: 1px solid #000000 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <!-- Screen-Only Sticky Action Toolbar -->
  <header class="screen-topbar no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span class="topbar-badge">
        <span style="color: #10b981;">●</span>
        PAKET OFFLINE TERVERIFIKASI
      </span>
      <span style="font-size: 12px; color: #a1a1aa;">
        Dapat dibuka tanpa internet di lokasi acara
      </span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        🖨️ Cetak Lembar Panitia / Simpan PDF (A4)
      </button>
    </div>
  </header>

  <main class="container">
    <!-- Non-Synchronized Snapshot Warning Banner -->
    <div class="snapshot-alert">
      <h4>⚠️ SALINAN STATIS OFFLINE (READ-ONLY)</h4>
      <p>
        Dokumen ini dihasilkan pada <strong>${safeTimestamp} WITA</strong> sebagai kontingensi bila jaringan seluler di lokasi upacara terputus.
        Perubahan jadwal atau checklist di lapangan <strong>tidak akan tersinkronisasi</strong> secara otomatis ke aplikasi Patemon.
        File disimpan secara lokal di perangkat Anda dan berisi kontak privat panitia. Harap jaga kerahasiaan berkas ini.
      </p>
    </div>

    <!-- Document Header -->
    <section class="doc-header">
      <div>
        <h1 class="doc-title">PANDUAN HARI-H PAWIWAHAN</h1>
        <div class="doc-subtitle">${safeCoupleNames}</div>
        <div class="doc-meta">
          Hari/Tanggal: <strong>${safeDate}</strong> &nbsp;·&nbsp;
          Lokasi: <strong>${safeLocation}</strong>
        </div>
      </div>
      <div class="doc-watermark">
        <div style="font-weight: 700;">PATEMON SNAPSHOT</div>
        <div>Waktu: ${safeTimestamp} WITA</div>
        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Offline Contingency Pack</div>
      </div>
    </section>

    ${
      options.includeRundown
        ? `
    <!-- Section 1: Rundown Acara Hari-H -->
    <section class="section">
      <div class="section-title">
        <span>I. Susunan Acara Jam-demi-Jam (Rundown)</span>
        <span class="section-count">${rundownEvents.length} Segmen</span>
      </div>

      ${
        rundownEvents.length === 0
          ? `<p style="color: #6b7280; font-style: italic;">Belum ada segmen rundown yang dijadwalkan.</p>`
          : `
      <table>
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">No</th>
            <th style="width: 110px;">Waktu (WITA)</th>
            <th>Nama Prosesi / Susunan Acara</th>
            <th style="width: 140px;">Lokasi</th>
            <th style="width: 140px;">PIC & Kontak</th>
            <th style="width: 140px;">Catatan Lapangan</th>
          </tr>
        </thead>
        <tbody>
          ${rundownEvents
            .map((e, idx) => {
              const dur = calculateDurationMinutes(e.startTime, e.endTime);
              const statusLabel =
                RUNDOWN_STATUS_CONFIG[e.status || "pending"]?.label ||
                e.status ||
                "Belum Mulai";
              return `
          <tr>
            <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
            <td class="nowrap">
              <strong>${escapeHtml(formatTimeDisplay(e.startTime))} - ${escapeHtml(formatTimeDisplay(e.endTime))}</strong>
              <div style="font-size: 10px; color: #6b7280;">(${escapeHtml(formatDurationString(dur))})</div>
              ${
                e.actualStartTime
                  ? `<div style="font-size: 10px; color: #047857; font-weight: 600;">Aktual: ${escapeHtml(formatTimeDisplay(e.actualStartTime))}</div>`
                  : ""
              }
            </td>
            <td>
              <strong>${escapeHtml(e.segmentTitle)}</strong>
              ${
                e.ceremonyTitle
                  ? `<div style="font-size: 11px; color: #b45309; font-weight: 500;">Upacara: ${escapeHtml(e.ceremonyTitle)}</div>`
                  : ""
              }
              <div style="margin-top: 3px;">
                <span class="badge-status">${escapeHtml(statusLabel)}</span>
                ${
                  e.delayMinutes && e.delayMinutes > 5
                    ? `<span class="badge-delay">Telat +${e.delayMinutes} mnt</span>`
                    : ""
                }
              </div>
            </td>
            <td>${escapeHtml(e.location || "-")}</td>
            <td>
              <strong>${escapeHtml(e.personInCharge || "-")}</strong>
              ${
                e.picPhone
                  ? `<div style="font-size: 11px; color: #374151;">📞 ${escapeHtml(e.picPhone)}</div>`
                  : ""
              }
            </td>
            <td>
              ${escapeHtml(e.notesDayOf || e.notes || "-")}
            </td>
          </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
      }
    </section>`
        : ""
    }

    ${
      options.includeBanten
        ? `
    <!-- Section 2: Kesiapan Sarana Upakara & Banten -->
    <section class="section ${options.includeRundown && rundownEvents.length > 6 ? "page-break" : ""}">
      <div class="section-title">
        <span>II. Kesiapan Sarana Upakara & Banten</span>
        <span class="section-count">${bantenItems.length} Sarana</span>
      </div>

      ${
        bantenItems.length === 0
          ? `<p style="color: #6b7280; font-style: italic;">Belum ada daftar sarana banten yang dicatat.</p>`
          : `
      <table>
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">No</th>
            <th>Nama Sarana Banten</th>
            <th style="width: 140px;">Rangkaian Upacara</th>
            <th style="width: 80px; text-align: center;">Jumlah</th>
            <th style="width: 110px;">Status Kesiapan</th>
            <th style="width: 130px;">Penanggung Jawab</th>
            <th style="width: 140px;">Catatan Khusus</th>
          </tr>
        </thead>
        <tbody>
          ${bantenItems
            .map((b, idx) => {
              const statusMap: Record<string, string> = {
                ready: "Siap di Lokasi",
                making: "Sedang Dibuat",
                ordered: "Dipesan Serati",
                needed: "Dibutuhkan",
                not_needed: "Tidak Diperlukan",
              };
              return `
          <tr>
            <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
            <td>
              <strong>${escapeHtml(b.name)}</strong>
              ${b.category ? `<div style="font-size: 10px; color: #6b7280;">Kategori: ${escapeHtml(b.category)}</div>` : ""}
            </td>
            <td>${escapeHtml(b.ceremonyTitle || "Umum / Semua Rangkaian")}</td>
            <td style="text-align: center; font-weight: 600;">
              ${b.quantity} ${escapeHtml(b.unit)}
            </td>
            <td>
              <span class="badge-status">${escapeHtml(statusMap[b.status] || b.status)}</span>
            </td>
            <td>${escapeHtml(b.assigneeName || "-")}</td>
            <td>${escapeHtml(b.notes || "-")}</td>
          </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
      }
    </section>`
        : ""
    }

    ${
      options.includePicContacts
        ? `
    <!-- Section 3: Direktori Kontak Panitia & PIC Lapangan -->
    <section class="section ${options.includeBanten && bantenItems.length > 8 ? "page-break" : ""}">
      <div class="section-title">
        <span>III. Direktori Kontak Panitia & PIC Lapangan</span>
        <span class="section-count">${picDirectory.length} PIC Unik</span>
      </div>

      ${
        picDirectory.length === 0
          ? `<p style="color: #6b7280; font-style: italic;">Belum ada kontak PIC yang terdaftar di rundown maupun banten.</p>`
          : `
      <table>
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">No</th>
            <th style="width: 180px;">Nama PIC / Panitia</th>
            <th style="width: 160px;">No. Telepon / WhatsApp</th>
            <th>Tugas & Tanggung Jawab Acara</th>
          </tr>
        </thead>
        <tbody>
          ${picDirectory
            .map((pic, idx) => {
              return `
          <tr>
            <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
            <td><strong>${escapeHtml(pic.name)}</strong></td>
            <td>
              ${
                pic.phone
                  ? `<strong>📞 ${escapeHtml(pic.phone)}</strong>`
                  : `<span style="color: #9ca3af; font-style: italic;">Belum ada nomor</span>`
              }
            </td>
            <td>
              <ul style="padding-left: 16px; margin: 0; font-size: 11px;">
                ${pic.roles.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
              </ul>
            </td>
          </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
      }
    </section>`
        : ""
    }

    <!-- Document Footer -->
    <footer class="doc-footer">
      <div>
        <strong>Patemon · Bali Hindu Wedding Planner</strong> · Panduan Eksekusi Hari-H Offline
      </div>
      <div>
        Waktu Cetak: ${safeTimestamp} WITA · Salinan Fisik Keluarga
      </div>
    </footer>
  </main>
</body>
</html>`;
}
