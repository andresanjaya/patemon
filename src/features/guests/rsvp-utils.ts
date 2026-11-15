import crypto from "crypto";
import type { GuestSide, InvitationStatus } from "./types";

export interface PublicRsvpData {
  guestId: string;
  guestName: string;
  guestSide: GuestSide;
  maxHeadcount: number;
  invitationStatus: InvitationStatus;
  rsvpAttendingCount: number | null;
  rsvpNotes: string | null;
  rsvpSubmittedAt: string | null;
  rsvpDeadline: string | null;
  isExpired: boolean;
  wedding: {
    id: string;
    coupleNames: string;
    prospectiveDate: string | null;
    ceremonyLocation: string | null;
    isFrozen: boolean;
  };
}

export type RsvpLookupResult =
  | { success: true; data: PublicRsvpData }
  | {
      success: false;
      state: "not_found" | "revoked" | "archived" | "rate_limited" | "error";
      error: string;
    };

export interface SubmitRsvpInput {
  token: string;
  status: "confirmed" | "declined";
  attendingCount: number;
  notes?: string;
  clientIp?: string;
}

export type SubmitRsvpResult =
  | {
      success: true;
      message: string;
      data: {
        invitationStatus: InvitationStatus;
        attendingCount: number;
        rsvpNotes: string | null;
        rsvpSubmittedAt: string;
      };
    }
  | {
      success: false;
      state?:
        | "invalid_quota"
        | "expired"
        | "revoked"
        | "archived"
        | "rate_limited"
        | "error";
      error: string;
    };

// ==============================================================================
// 1. In-Memory Rate Limiter for Public Token Protection
// ==============================================================================

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 10 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleRateLimitRecords(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, rec] of rateLimitMap.entries()) {
    if (now > rec.blockedUntil && now - rec.firstAttemptAt > 60 * 60 * 1000) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check rate limit for an identifier (IP address or token lookup attempt).
 * Thresholds:
 * - Max 30 attempts per minute per identifier.
 * - If exceeded, blocks requests for 5 minutes.
 */
export function checkRsvpRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  purgeStaleRateLimitRecords(now);

  const cleanKey = identifier.trim() || "anonymous";
  const record = rateLimitMap.get(cleanKey);

  if (record) {
    if (now < record.blockedUntil) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000),
      };
    }

    // Reset window after 60 seconds
    if (now - record.firstAttemptAt > 60 * 1000) {
      record.attempts = 1;
      record.firstAttemptAt = now;
      record.blockedUntil = 0;
      return { allowed: true };
    }

    record.attempts += 1;
    if (record.attempts > 30) {
      record.blockedUntil = now + 5 * 60 * 1000; // Block for 5 minutes
      return {
        allowed: false,
        retryAfterSeconds: 300,
      };
    }

    return { allowed: true };
  }

  rateLimitMap.set(cleanKey, {
    attempts: 1,
    firstAttemptAt: now,
    blockedUntil: 0,
  });

  return { allowed: true };
}

/**
 * Reset rate limit for an identifier (useful in automated tests).
 */
export function resetRsvpRateLimit(identifier?: string) {
  if (identifier) {
    rateLimitMap.delete(identifier.trim());
  } else {
    rateLimitMap.clear();
  }
}

// ==============================================================================
// 2. High-Entropy Secure Token Generation
// ==============================================================================

/**
 * Generate a 48-character cryptographically secure token with 192 bits of entropy.
 */
export function generateSecureRsvpToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Validates token string structure before performing database lookup.
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const trimmed = token.trim();
  // Valid token: 16 to 64 alphanumeric / hyphen / underscore chars
  return /^[a-zA-Z0-9_-]{16,64}$/.test(trimmed);
}
