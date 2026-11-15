/**
 * Audit Trail Data Sanitizer & Retention Policy (Issue #90)
 *
 * Requirements:
 * - Tidak mencatat secret, credential, token, atau session identifiers.
 * - Masking data identitas pribadi (PII) seperti nomor telepon dan email.
 * - Kebijakan retensi dan paginasi terkelola untuk mencegah data bloat.
 */

export const ACTIVITY_LOG_RETENTION_DAYS = 90;
export const ACTIVITY_LOG_DEFAULT_PAGE_SIZE = 15;
export const ACTIVITY_LOG_MAX_PAGE_SIZE = 50;

/**
 * Sensitive field keys that must never be recorded into activity log details.
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /credit_card/i,
  /card_number/i,
  /cvv/i,
  /bank_account/i,
  /api_key/i,
  /server_key/i,
  /private_key/i,
  /access_key/i,
  /auth_code/i,
];

/**
 * Mask an Indonesian or standard phone number: e.g. "08123456789" -> "0812****6789".
 */
export function maskPhoneNumber(phone: string): string {
  const clean = phone.trim();
  if (clean.length < 7) {
    return "****";
  }
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * Mask an email address: e.g. "wayan.balinese@gmail.com" -> "w***e@gmail.com".
 */
export function maskEmail(email: string): string {
  const clean = email.trim();
  const atIndex = clean.indexOf("@");
  if (atIndex <= 1) {
    return "***@***";
  }
  const localPart = clean.slice(0, atIndex);
  const domainPart = clean.slice(atIndex);
  if (localPart.length <= 1) {
    return `*${domainPart}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}${domainPart}`;
}

/**
 * Sanitize a string value: strip URL secrets and truncate excessive length.
 */
function sanitizeStringValue(key: string, value: string): string {
  // Check if string looks like a phone number
  if (
    /phone|hp|telepon|wa_number/i.test(key) &&
    /^[+0-9\s-]{8,20}$/.test(value)
  ) {
    return maskPhoneNumber(value);
  }

  // Check if string is an email
  if (/email/i.test(key) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return maskEmail(value);
  }

  // Strip pre-signed query params or tokens from URLs
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      if (url.search) {
        url.search = ""; // Remove potential auth tokens in query params
      }
      return url.toString();
    } catch {
      // If not a valid standard URL, proceed with length limit
    }
  }

  // Prevent storing large binary/base64 blobs
  if (value.length > 500 && !/\s/.test(value)) {
    return "[BLOB_TRUNCATED]";
  }

  // Max length per string field
  const MAX_STR_LEN = 300;
  if (value.length > MAX_STR_LEN) {
    return value.slice(0, MAX_STR_LEN) + "...";
  }

  return value;
}

/**
 * Recursively sanitize details dictionary to comply with security & privacy criteria.
 */
export function sanitizeActivityDetails(
  details: Record<string, unknown> | null | undefined,
  depth = 0
): Record<string, unknown> | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }

  if (depth > 3) {
    return { _truncated: "Max nesting depth reached" };
  }

  const sanitized: Record<string, unknown> = {};

  for (const [rawKey, rawVal] of Object.entries(details)) {
    // 1. Drop sensitive keys entirely
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
      pattern.test(rawKey)
    );
    if (isSensitive) {
      continue;
    }

    if (rawVal === null || rawVal === undefined) {
      continue;
    }

    if (typeof rawVal === "string") {
      sanitized[rawKey] = sanitizeStringValue(rawKey, rawVal);
    } else if (typeof rawVal === "number" || typeof rawVal === "boolean") {
      sanitized[rawKey] = rawVal;
    } else if (Array.isArray(rawVal)) {
      // Limit array items
      sanitized[rawKey] = rawVal.slice(0, 10).map((item) => {
        if (typeof item === "string") return sanitizeStringValue(rawKey, item);
        if (typeof item === "object" && item !== null) {
          return sanitizeActivityDetails(
            item as Record<string, unknown>,
            depth + 1
          );
        }
        return item;
      });
    } else if (typeof rawVal === "object") {
      sanitized[rawKey] = sanitizeActivityDetails(
        rawVal as Record<string, unknown>,
        depth + 1
      );
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}
