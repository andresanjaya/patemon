/**
 * Robust CSV Parser & Duplicate Detection for Guest Import (Issue #85)
 * Handles UTF-8 BOM, quoted newlines, escaped quotes, Balinese Unicode names,
 * phone normalization, and formula injection defenses.
 */

import type { Guest, GuestSide } from "./types";
import type {
  CsvImportPreview,
  CsvRowStatus,
  CsvRowValidation,
  ParsedCsvGuestRow,
} from "./csv-types";

export const MAX_IMPORT_ROWS = 500;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Sanitize formula characters (=, +, -, @, \t, \r) to prevent CSV Injection.
 */
export function sanitizeCsvFormula(value: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Normalize phone numbers to E.164-like international format without breaking foreign numbers.
 * Converts Indonesian local "08..." or "628..." to "+628...".
 */
export function normalizePhoneNumber(
  rawPhone: string | null | undefined
): string | null {
  if (!rawPhone) return null;
  const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "").trim();
  if (!cleaned) return null;

  // Indonesian local mobile prefix: 08xx -> +628xx
  if (/^08\d{8,12}$/.test(cleaned)) {
    return `+62${cleaned.substring(1)}`;
  }
  // Indonesian 628xx without + prefix -> +628xx
  if (/^628\d{8,12}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  // Already in +62 or international +1, +61, etc.
  if (/^\+\d{7,15}$/.test(cleaned)) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Normalize party/side representation from various Indonesian & Balinese terms.
 */
export function normalizeGuestSide(
  rawSide: string | null | undefined
): GuestSide {
  if (!rawSide) return "both";
  const lower = rawSide.toLowerCase().trim();

  if (
    lower === "groom" ||
    lower === "pria" ||
    lower === "purusa" ||
    lower === "mempelai pria" ||
    lower === "keluarga pria"
  ) {
    return "groom";
  }
  if (
    lower === "bride" ||
    lower === "wanita" ||
    lower === "pradana" ||
    lower === "mempelai wanita" ||
    lower === "keluarga wanita"
  ) {
    return "bride";
  }
  return "both";
}

/**
 * RFC 4180-compliant CSV Text Parser.
 * Handles newlines inside quotes, double quotes (""), and varied line endings.
 */
export function parseRawCsvLines(csvText: string): string[][] {
  // Strip UTF-8 Byte Order Mark (BOM) if present
  let text = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped double quote ("")
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
      i++;
      continue;
    }

    if (char === "\n" && !insideQuotes) {
      currentRow.push(currentField);
      // Only push non-empty rows
      if (currentRow.some((field) => field.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Push last field & row if remaining
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Map header columns dynamically to standard attributes.
 */
function resolveHeaderIndex(headers: string[]): {
  nameIdx: number;
  sideIdx: number;
  groupHouseholdIdx: number;
  headcountIdx: number;
  phoneIdx: number;
  notesIdx: number;
} {
  let nameIdx = -1;
  let sideIdx = -1;
  let groupHouseholdIdx = -1;
  let headcountIdx = -1;
  let phoneIdx = -1;
  let notesIdx = -1;

  headers.forEach((h, idx) => {
    const clean = h
      .toLowerCase()
      .trim()
      .replace(/[\s_\-\/]/g, "");
    if (
      clean === "nama" ||
      clean === "namalengkap" ||
      clean === "namatamu" ||
      clean === "name" ||
      clean === "guestname"
    ) {
      nameIdx = idx;
    } else if (
      clean === "pihak" ||
      clean === "pihakkeluarga" ||
      clean === "side"
    ) {
      sideIdx = idx;
    } else if (
      clean === "kelompok" ||
      clean === "keluarga" ||
      clean === "kelompokkeluarga" ||
      clean === "grouphousehold" ||
      clean === "group" ||
      clean === "household"
    ) {
      groupHouseholdIdx = idx;
    } else if (
      clean === "jumlah" ||
      clean === "jumlahhadir" ||
      clean === "headcount" ||
      clean === "pax"
    ) {
      headcountIdx = idx;
    } else if (
      clean === "telepon" ||
      clean === "nohp" ||
      clean === "nomor" ||
      clean === "phone" ||
      clean === "whatsapp" ||
      clean === "kontak"
    ) {
      phoneIdx = idx;
    } else if (
      clean === "catatan" ||
      clean === "notes" ||
      clean === "keterangan"
    ) {
      notesIdx = idx;
    }
  });

  // Default fallback if headers were ambiguous
  if (nameIdx === -1) nameIdx = 0;
  if (sideIdx === -1 && headers.length > 1) sideIdx = 1;
  if (groupHouseholdIdx === -1 && headers.length > 2) groupHouseholdIdx = 2;
  if (headcountIdx === -1 && headers.length > 3) headcountIdx = 3;
  if (phoneIdx === -1 && headers.length > 4) phoneIdx = 4;
  if (notesIdx === -1 && headers.length > 5) notesIdx = 5;

  return {
    nameIdx,
    sideIdx,
    groupHouseholdIdx,
    headcountIdx,
    phoneIdx,
    notesIdx,
  };
}

/**
 * Parse CSV text into validated guest rows with duplicate detection.
 */
export function parseAndValidateGuestsCsv(
  csvText: string,
  existingGuests: Guest[] = []
): CsvImportPreview {
  const rawRows = parseRawCsvLines(csvText);

  if (rawRows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
      rows: [],
    };
  }

  // Header row detection
  const firstRow = rawRows[0];
  const indices = resolveHeaderIndex(firstRow);

  // Data rows (skip header)
  const dataRows = rawRows.slice(1);
  const rowsValidation: CsvRowValidation[] = [];

  // Lookup sets for duplicates
  const existingNames = new Set(
    existingGuests.map((g) => g.name.toLowerCase().trim())
  );
  const existingPhones = new Set(
    existingGuests
      .map((g) => (g.phone ? g.phone.replace(/[\s\-\(\)\.]/g, "").trim() : ""))
      .filter(Boolean)
  );

  const batchNamesSeen = new Set<string>();
  const batchPhonesSeen = new Set<string>();

  dataRows.forEach((rowFields, index) => {
    if (index >= MAX_IMPORT_ROWS) return;

    const rawName = rowFields[indices.nameIdx] || "";
    const rawSide = rowFields[indices.sideIdx] || "";
    const rawGroup = rowFields[indices.groupHouseholdIdx] || "";
    const rawHeadcount = rowFields[indices.headcountIdx] || "";
    const rawPhone = rowFields[indices.phoneIdx] || "";
    const rawNotes = rowFields[indices.notesIdx] || "";

    const name = sanitizeCsvFormula(rawName);
    const side = normalizeGuestSide(rawSide);
    const groupHousehold = rawGroup.trim()
      ? sanitizeCsvFormula(rawGroup)
      : null;
    const phone = normalizePhoneNumber(rawPhone);
    const notes = rawNotes.trim() ? sanitizeCsvFormula(rawNotes) : null;

    // Validate headcount: positive integer (default: 1)
    let headcount = 1;
    const parsedHc = parseInt(rawHeadcount.trim(), 10);
    if (!isNaN(parsedHc) && parsedHc > 0) {
      headcount = Math.min(parsedHc, 100);
    }

    const parsedRow: ParsedCsvGuestRow = {
      originalIndex: index + 2, // 1-based, accounting for header
      name,
      side,
      groupHousehold,
      headcount,
      phone,
      notes,
    };

    const errors: string[] = [];
    if (!name.trim()) {
      errors.push("Nama tamu wajib diisi.");
    }

    const cleanNameLower = name.toLowerCase().trim();
    const cleanPhone = phone ? phone.replace(/[\s\-\(\)\.]/g, "").trim() : "";

    // Check duplicate against existing DB guests
    const duplicateWithDb =
      (cleanNameLower.length > 0 && existingNames.has(cleanNameLower)) ||
      (cleanPhone.length > 0 && existingPhones.has(cleanPhone));

    // Check duplicate within the current CSV batch
    const duplicateWithBatch =
      (cleanNameLower.length > 0 && batchNamesSeen.has(cleanNameLower)) ||
      (cleanPhone.length > 0 && batchPhonesSeen.has(cleanPhone));

    if (cleanNameLower) batchNamesSeen.add(cleanNameLower);
    if (cleanPhone) batchPhonesSeen.add(cleanPhone);

    const isDuplicate = duplicateWithDb || duplicateWithBatch;

    let status: CsvRowStatus = "valid";
    if (errors.length > 0) {
      status = "invalid";
    } else if (isDuplicate) {
      status = "duplicate";
    }

    rowsValidation.push({
      row: parsedRow,
      status,
      errors,
      isDuplicateWithExisting: duplicateWithDb,
      isDuplicateWithBatch: duplicateWithBatch,
    });
  });

  const validCount = rowsValidation.filter((r) => r.status === "valid").length;
  const duplicateCount = rowsValidation.filter(
    (r) => r.status === "duplicate"
  ).length;
  const invalidCount = rowsValidation.filter(
    (r) => r.status === "invalid"
  ).length;

  return {
    totalRows: rowsValidation.length,
    validCount,
    duplicateCount,
    invalidCount,
    rows: rowsValidation,
  };
}

/**
 * Generate starter UTF-8 CSV Template with Balinese wedding guest examples.
 */
export function generateGuestsCsvTemplate(): string {
  const headers = [
    "Nama Lengkap",
    "Pihak Keluarga",
    "Kelompok / Household",
    "Jumlah Hadir",
    "Nomor Telepon",
    "Catatan",
  ];

  const examples = [
    [
      "I Wayan Sudarma & Keluarga",
      "Mempelai Pria",
      "Keluarga Besar Sudarma",
      "2",
      "081234567890",
      "Tamu VIP Banjar Tengah",
    ],
    [
      "Ni Made Rai Suartini",
      "Mempelai Wanita",
      "Alumni Kampus",
      "1",
      "081987654321",
      "Konfirmasi hadir",
    ],
    [
      "Ida Bagus Made Alit",
      "Bersama",
      "Griya Sanur",
      "3",
      "+6281333444555",
      "Membawa keluarga",
    ],
  ];

  const lines = [
    headers.map((h) => `"${h}"`).join(","),
    ...examples.map((row) =>
      row.map((field) => `"${field.replace(/"/g, '""')}"`).join(",")
    ),
  ];

  return "\uFEFF" + lines.join("\r\n");
}
