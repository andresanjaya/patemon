import { sanitizePayload } from "./sanitize";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  userId?: string;
  weddingId?: string;
  path?: string;
  [key: string]: unknown;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  environment: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured, sanitized logger that prevents sensitive data leaks.
 */
export function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  err?: unknown
): StructuredLog {
  const sanitizedContext = context
    ? (sanitizePayload(context) as Record<string, unknown>)
    : undefined;

  let errorDetails: StructuredLog["error"] | undefined;
  if (err instanceof Error) {
    errorDetails = {
      name: err.name,
      message: sanitizePayload(err.message),
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    };
  } else if (err) {
    errorDetails = {
      name: "UnknownError",
      message: String(sanitizePayload(err)),
    };
  }

  const structuredLog: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment:
      process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development",
    context: sanitizedContext,
    error: errorDetails,
  };

  const output = JSON.stringify(structuredLog);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }

  return structuredLog;
}

/**
 * Captures and logs application errors with sanitized context.
 */
export function captureError(
  error: unknown,
  context?: LogContext
): StructuredLog {
  const message = error instanceof Error ? error.message : "Application Error";
  return log("error", message, context, error);
}
