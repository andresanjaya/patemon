/**
 * Personalized WhatsApp Message & Link Generator for Guests (Issue #86)
 * Generates culturally respectful Balinese wedding invitations with custom guest names,
 * ceremony schedules, location details, and direct wa.me links.
 */

import type { Guest } from "./types";

export interface WeddingInviteContext {
  coupleNames: string;
  groomName?: string | null;
  brideName?: string | null;
  prospectiveDate?: string | null; // YYYY-MM-DD
  ceremonyTimeWita?: string | null; // e.g. "10:00 WITA"
  ceremonyLocation?: string | null; // e.g. "Banjar Tengah, Ubud, Gianyar"
  invitationUrl?: string | null;
}

/**
 * Format a YYYY-MM-DD date into readable Balinese Indonesian wedding date.
 */
function formatCeremonyDate(dateStr?: string | null): string {
  if (!dateStr) return "Hari & Tanggal akan segera diumumkan";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 4, 0, 0));
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Generate personal WhatsApp invite message for a guest.
 */
export function generateWhatsAppInviteMessage(
  guest: Pick<Guest, "name" | "headcount">,
  context: WeddingInviteContext
): string {
  const ceremonyDate = formatCeremonyDate(context.prospectiveDate);
  const time = context.ceremonyTimeWita || "10:00 WITA";
  const location = context.ceremonyLocation || "Denpasar, Bali";
  const paxLabel = guest.headcount > 1 ? ` (${guest.headcount} Orang)` : "";

  const lines = [
    `Om Swastyastu,`,
    ``,
    `Kepada Yth. Bapak/Ibu/Saudara/i:`,
    `*${guest.name}*${paxLabel}`,
    ``,
    `Atas Asung Kertha Wara Nugraha Ida Sang Hyang Widhi Wasa, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri dan memberikan doa restu pada Upacara Pawiwahan kami:`,
    ``,
    `💍 *${context.coupleNames}*`,
    ``,
    `📅 *Hari/Tanggal:* ${ceremonyDate}`,
    `⏰ *Waktu:* ${time}`,
    `📍 *Lokasi:* ${location}`,
  ];

  if (context.invitationUrl) {
    lines.push(
      ``,
      `Undangan Digital & Konfirmasi Kehadiran:`,
      context.invitationUrl
    );
  }

  lines.push(
    ``,
    `Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga apabila Bapak/Ibu/Saudara/i berkenan hadir untuk menyaksikan ikrar suci dan memberikan doa restu.`,
    ``,
    `Suksma,`,
    `Om Shanti, Shanti, Shanti, Om`,
    `_${context.coupleNames} & Keluarga Besar_`
  );

  return lines.join("\n");
}

/**
 * Clean phone number for WhatsApp wa.me API link.
 * wa.me requires phone number without leading '+' or dashes, e.g. "6281234567890".
 */
export function cleanPhoneForWhatsApp(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");

  // Convert local 08xx to 628xx
  if (digits.startsWith("08")) {
    digits = "62" + digits.substring(1);
  }
  // If starts with 8 (missing 0), prepend 62
  if (digits.startsWith("8") && digits.length >= 9 && digits.length <= 13) {
    digits = "62" + digits;
  }

  // Minimum valid length for mobile numbers
  if (digits.length < 8) return null;
  return digits;
}

/**
 * Generate a complete wa.me link with encoded invite message.
 * Returns null if the guest does not have a valid phone number.
 */
export function generateWhatsAppUrl(
  phone: string | null | undefined,
  message: string
): string | null {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  if (!cleanPhone) return null;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
