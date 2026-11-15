/**
 * Reminder Utilities & Timezone Helpers for Asia/Makassar (WITA / UTC+8)
 * Ensures deadline computations are strictly evaluated relative to Balinese local time.
 */

import type { EmailPayload, ReminderTier } from "./types";

export const WITA_TIMEZONE = "Asia/Makassar";

/**
 * Get current date string (YYYY-MM-DD) in Asia/Makassar timezone.
 * Accepts an optional reference date for deterministic testing.
 */
export function getWitaDateString(referenceDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WITA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(referenceDate);
}

/**
 * Compute the difference in whole calendar days between two YYYY-MM-DD dates in WITA.
 * Returns targetDate - currentDate:
 * e.g. target 2026-11-22 minus current 2026-11-15 = +7 days.
 */
export function diffCalendarDays(
  currentDateStr: string,
  targetDateStr: string
): number {
  const [cy, cm, cd] = currentDateStr.split("-").map(Number);
  const [ty, tm, td] = targetDateStr.split("-").map(Number);

  const currentUtc = Date.UTC(cy, cm - 1, cd);
  const targetUtc = Date.UTC(ty, tm - 1, td);

  const diffMs = targetUtc - currentUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine the applicable reminder tier for a given day difference.
 */
export function getTierForDiffDays(diffDays: number): ReminderTier | null {
  if (diffDays === 7) return "H-7";
  if (diffDays === 3) return "H-3";
  if (diffDays === 1) return "H-1";
  if (diffDays === 0) return "H-0";
  return null;
}

/**
 * Format a YYYY-MM-DD date into human-readable Indonesian format with WITA designation.
 */
export function formatWitaDateReadable(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 4, 0, 0)); // Noon WITA

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WITA_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Generate a deterministic idempotency key for reminder deduplication.
 */
export function generateReminderIdempotencyKey(
  itemType: string,
  itemId: string,
  recipientEmail: string,
  tier: ReminderTier,
  dueDate: string
): string {
  return `${itemType}:${itemId}:${recipientEmail.toLowerCase().trim()}:${tier}:${dueDate}`;
}

/**
 * Generate clean HTML & plaintext email body.
 * Strictly avoids sensitive account numbers, bank details, or guest information.
 * Always directs the user to authenticated workspace routes.
 */
export function renderReminderEmail(payload: EmailPayload): {
  html: string;
  text: string;
} {
  const itemTypeLabel =
    payload.itemType === "task" ? "Tugas Upacara" : "Jatuh Tempo Pembayaran";
  const urgencyLabel =
    payload.daysRemaining === 0
      ? "Hari Ini!"
      : payload.daysRemaining === 1
        ? "Besok (1 Hari Lagi)"
        : `${payload.daysRemaining} Hari Lagi`;

  const text = `Halo ${payload.recipientName},

Pengingat ${itemTypeLabel} untuk Pawiwahan "${payload.weddingTitle}":

Item: ${payload.itemTitle}
Tenggat Waktu: ${payload.dueDate} (${urgencyLabel})

Untuk menjaga kelancaran persiapan upacara, mohon periksa atau perbarui status item ini melalui ruang kerja Patemon:
${payload.actionUrl}

Catatan Keamanan:
Tautan di atas memerlukan login akun Anda. Patemon tidak pernah menyertakan nomor rekening atau data tamu dalam notifikasi email.

Untuk mengubah frekuensi atau berhenti berlangganan pengingat, buka Pengaturan Pawiwahan di Patemon.
© Patemon — Panduan & Manajemen Pawiwahan Hindu Bali
`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat: ${payload.itemTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #d97706;">
      <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: 0.5px;">PATEMON</h1>
      <p style="color: #cbd5e1; font-size: 13px; margin: 6px 0 0 0;">Pengingat Persiapan Pawiwahan</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; margin-top: 0; color: #334155;">Om Swastyastu, <strong>${payload.recipientName}</strong>,</p>
      
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Berikut adalah pengingat untuk persiapan pawiwahan <strong>${payload.weddingTitle}</strong>:
      </p>

      <div style="background-color: #f1f5f9; border-left: 4px solid #d97706; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">${itemTypeLabel}</div>
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 4px 0 8px 0;">${payload.itemTitle}</div>
        <div style="font-size: 13px; color: #334155;">
          📅 <strong>Tenggat Waktu:</strong> ${payload.dueDate} 
          <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; margin-left: 6px;">
            ${urgencyLabel}
          </span>
        </div>
      </div>

      <div style="text-align: center; margin: 28px 0 20px 0;">
        <a href="${payload.actionUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Buka di Patemon →
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
        🔒 <strong>Privasi &amp; Keamanan:</strong> Tautan di atas memerlukan autentikasi login aktif Anda di Patemon. Kami tidak pernah menyertakan nomor rekening bank atau data sensitif tamu dalam pengingat email.
      </p>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      Anda menerima email ini karena terdaftar sebagai penanggung jawab di Patemon.<br>
      Untuk mengatur frekuensi pengingat atau berhenti berlangganan, kelola preferensi di pengaturan ruang kerja Anda.
    </div>
  </div>
</body>
</html>`;

  return { html, text };
}
