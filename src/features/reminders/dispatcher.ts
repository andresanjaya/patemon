/**
 * Email Dispatcher Service for Deadline Reminders (Issue #84)
 * Provides robust email dispatch with retry logic, idempotency checks,
 * and test sandbox mocking.
 */

import { logger } from "@/lib/observability/logger";
import type { EmailPayload, ReminderDispatchLog } from "./types";
import { renderReminderEmail } from "./utils";

export interface SendEmailOptions {
  maxRetries?: number;
  isMockMode?: boolean;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attempts: number;
}

// In-memory dispatch audit store for mock/test runs and fallback
const inMemoryDispatchLogs: Map<string, ReminderDispatchLog> = new Map();

/**
 * Dispatch an email to the recipient with bounded retries.
 */
export async function sendReminderEmail(
  payload: EmailPayload,
  options: SendEmailOptions = {}
): Promise<EmailSendResult> {
  const maxRetries = options.maxRetries ?? 3;
  const isMockMode =
    options.isMockMode ??
    (process.env.NODE_ENV === "test" || !process.env.RESEND_API_KEY);

  const { text } = renderReminderEmail(payload);

  let attempt = 0;
  let lastError = "";

  while (attempt < maxRetries) {
    attempt++;
    try {
      if (isMockMode) {
        // Deterministic mock behavior for test suite
        if (payload.to.includes("fail-always@")) {
          throw new Error("Simulated upstream SMTP failure");
        }
        if (payload.to.includes("fail-once@") && attempt === 1) {
          throw new Error("Simulated transient connection timeout");
        }

        logger.info("Mock email reminder dispatched successfully", {
          to: payload.to,
          subject: payload.subject,
          itemTitle: payload.itemTitle,
          attempt,
        });

        return {
          success: true,
          messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          attempts: attempt,
        };
      }

      // Live integration (e.g. Resend / Supabase mailer if configured)
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "Patemon <notifikasi@patemon.app>",
            to: payload.to,
            subject: payload.subject,
            text,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(
            `Resend API Error HTTP ${response.status}: ${errBody}`
          );
        }

        const data = await response.json();
        return {
          success: true,
          messageId: data.id,
          attempts: attempt,
        };
      }

      // Fallback log
      return {
        success: true,
        messageId: `log-fallback-${Date.now()}`,
        attempts: attempt,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn("Email reminder dispatch attempt failed", {
        to: payload.to,
        attempt,
        maxRetries,
        error: lastError,
      });

      // Small backoff before retry (skip in test mode to keep tests instant)
      if (attempt < maxRetries && process.env.NODE_ENV !== "test") {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt,
  };
}

/**
 * Record a dispatch log in memory (used for fallback or fast test assertions).
 */
export function recordInMemoryDispatchLog(log: ReminderDispatchLog): void {
  inMemoryDispatchLogs.set(log.idempotencyKey, log);
}

/**
 * Check if a dispatch log exists in memory for this idempotency key.
 */
export function getInMemoryDispatchLog(
  idempotencyKey: string
): ReminderDispatchLog | undefined {
  return inMemoryDispatchLogs.get(idempotencyKey);
}

/**
 * Clear in-memory dispatch logs (useful for unit tests).
 */
export function clearInMemoryDispatchLogs(): void {
  inMemoryDispatchLogs.clear();
}
