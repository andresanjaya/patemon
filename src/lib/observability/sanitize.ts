/**
 * Sanitizes data structures to prevent sensitive payloads, PII,
 * credentials, and authorization tokens from leaking into error logs.
 */

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /token/i,
  /secret/i,
  /auth(orization)?/i,
  /bearer/i,
  /cookie/i,
  /key/i,
  /credit[-_]?card/i,
  /cvv/i,
  /ssn/i,
  /phone/i,
];

const SENSITIVE_VALUE_PATTERNS = [
  /sb_secret_[a-zA-Z0-9_\-]+/g,
  /gh[pous]_[a-zA-Z0-9_\-]+/g,
  /Bearer\s+[a-zA-Z0-9_\.\-]+/gi,
];

export function sanitizePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    let sanitized: string = input;
    for (const pattern of SENSITIVE_VALUE_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
    }
    return sanitized as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (typeof input === "object" && !(input instanceof Error)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) =>
        pattern.test(key)
      );

      if (isSensitiveKey) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned as unknown as T;
  }

  return input;
}

