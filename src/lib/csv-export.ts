/**
 * CSV Export & Sanitization Engine
 *
 * Implements RFC-4180 compliant CSV serialization with:
 * - Excel-compatible UTF-8 BOM (\uFEFF)
 * - CSV Injection (Formula Injection) mitigation
 * - Proper escaping of quotes, commas, and newlines
 * - Browser download helpers for CSV and JSON files
 */

/**
 * Characters that could trigger spreadsheet formula execution when opened in Excel/Google Sheets.
 */
const FORMULA_INJECTION_CHARS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Sanitizes and escapes a single CSV cell value according to RFC 4180.
 */
export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value).trim();

  // Guard against CSV formula injection (OWASP guideline)
  if (
    FORMULA_INJECTION_CHARS.some((char) => str.startsWith(char)) &&
    // Allow ordinary negative numbers (e.g. -500 or -12.5) without prefixing quote
    !/^-?\d+(\.\d+)?$/.test(str)
  ) {
    str = `'${str}`;
  }

  // Escape existing double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Converts a table of headers and rows into an RFC-4180 CSV string with UTF-8 BOM.
 */
export function generateCSV(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCSVCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCSVCell).join(","));

  const csvBody = [headerLine, ...rowLines].join("\r\n");

  // Prepend UTF-8 Byte Order Mark (BOM) so Microsoft Excel displays Indonesian & Balinese diacritics correctly
  return `\uFEFF${csvBody}`;
}

/**
 * Triggers a browser download of a CSV file.
 * Safely handles DOM anchor creation and memory cleanup.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Triggers a browser download of a JSON data file (e.g., for takeout or raw contingency backup).
 */
export function downloadJSON(filename: string, data: unknown): void {
  if (typeof window === "undefined") return;

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.setAttribute(
    "download",
    filename.endsWith(".json") ? filename : `${filename}.json`
  );
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
