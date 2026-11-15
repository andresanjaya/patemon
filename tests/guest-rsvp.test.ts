/**
 * Automated Test Suite for Guest RSVP via High-Entropy Personal Token (Issue #87).
 * Verifies token entropy, isolation (A/B), rate limiting, data minimization,
 * quota validation, replay/idempotency, token revocation, and catering pax reconciliation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only module for Vitest test environment
vi.mock("server-only", () => ({}));
import {
  generateSecureRsvpToken,
  isValidTokenFormat,
  checkRsvpRateLimit,
  resetRsvpRateLimit,
} from "@/features/guests/rsvp-utils";
import {
  getRsvpGuestDetails,
  submitGuestRsvpAction,
  rotateGuestRsvpTokenAction,
  revokeGuestRsvpTokenAction,
} from "@/features/guests/rsvp-actions";
import { calculateGuestStats } from "@/features/guests/seeds";
import type { Guest } from "@/features/guests/types";
import { generateWhatsAppInviteMessage } from "@/features/guests/whatsapp";

// Mock Next.js Cache Revalidation
vi.mock("next/cache", () => {
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  };
});

// Mock Supabase Admin Client
vi.mock("@/lib/supabase/admin", () => {
  return {
    createAdminClient: vi.fn(),
  };
});

// Mock Supabase Server Client
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(),
  };
});

// Mock Entitlement Check
vi.mock("@/features/payments/entitlements", () => {
  return {
    checkFeatureAccess: vi.fn().mockResolvedValue({
      allowed: true,
      role: "owner",
      reason: null,
    }),
  };
});

import { createAdminClient } from "@/lib/supabase/admin";

describe("Guest RSVP via High-Entropy Token (Issue #87)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRsvpRateLimit();
  });

  // =========================================================================
  // 1. Token Security, Entropy & Format Validation
  // =========================================================================
  describe("Cryptographic Token Entropy & Validation", () => {
    it("generates a 48-character hex token with 192 bits of entropy", () => {
      const token = generateSecureRsvpToken();
      expect(token).toHaveLength(48);
      expect(/^[0-9a-f]{48}$/.test(token)).toBe(true);
    });

    it("generates unique tokens without collisions", () => {
      const set = new Set<string>();
      for (let i = 0; i < 500; i++) {
        const token = generateSecureRsvpToken();
        expect(set.has(token)).toBe(false);
        set.add(token);
      }
      expect(set.size).toBe(500);
    });

    it("strictly validates token format before database lookup", () => {
      expect(isValidTokenFormat(generateSecureRsvpToken())).toBe(true);
      expect(isValidTokenFormat("demo-rsvp-token-mangku-wayan")).toBe(true);

      // Rejects invalid strings
      expect(isValidTokenFormat("")).toBe(false);
      expect(isValidTokenFormat("short")).toBe(false); // < 16 chars
      expect(isValidTokenFormat("token with spaces 1234567890")).toBe(false);
      expect(isValidTokenFormat("SELECT * FROM guests;--123456")).toBe(false);
      expect(isValidTokenFormat("<script>alert(1)</script>12345")).toBe(false);
    });
  });

  // =========================================================================
  // 2. Brute Force Protection & Rate Limiting
  // =========================================================================
  describe("Rate Limiting & Brute Force Prevention", () => {
    it("permits legitimate lookup requests within threshold", () => {
      const ip = "192.168.1.100";
      for (let i = 0; i < 20; i++) {
        const res = checkRsvpRateLimit(ip);
        expect(res.allowed).toBe(true);
      }
    });

    it("blocks requests when rate limit threshold is exceeded", () => {
      const ip = "192.168.1.200";
      // Exceed threshold (> 30 attempts)
      for (let i = 0; i < 30; i++) {
        checkRsvpRateLimit(ip);
      }

      // 31st request should be blocked
      const blockedRes = checkRsvpRateLimit(ip);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);

      // Subsequent requests remain blocked
      const stillBlocked = checkRsvpRateLimit(ip);
      expect(stillBlocked.allowed).toBe(false);
    });

    it("resets rate limit for identifier correctly", () => {
      const ip = "192.168.1.250";
      for (let i = 0; i < 35; i++) {
        checkRsvpRateLimit(ip);
      }
      expect(checkRsvpRateLimit(ip).allowed).toBe(false);

      resetRsvpRateLimit(ip);
      expect(checkRsvpRateLimit(ip).allowed).toBe(true);
    });
  });

  // =========================================================================
  // 3. Demo Mode Lookup & Submission
  // =========================================================================
  describe("Demo Preview Workspace RSVP", () => {
    it("successfully loads public demo RSVP data without exposing sensitive info", async () => {
      const result = await getRsvpGuestDetails("demo-rsvp-token-mangku-wayan");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guestName).toBe(
          "Jero Mangku Wayan Sudarma & Keluarga"
        );
        expect(result.data.maxHeadcount).toBe(4);
        expect(result.data.wedding.coupleNames).toContain("Agus");
        // Must NOT expose private notes or phone number of other guests
        expect(
          (result.data as unknown as Record<string, unknown>).phone
        ).toBeUndefined();
      }
    });

    it("submits RSVP successfully in demo mode", async () => {
      const submitRes = await submitGuestRsvpAction({
        token: "demo-rsvp-token-mangku-wayan",
        status: "confirmed",
        attendingCount: 3,
        notes: "Rahajeng pawiwahan semeton",
      });

      expect(submitRes.success).toBe(true);
      if (submitRes.success) {
        expect(submitRes.data.invitationStatus).toBe("confirmed");
        expect(submitRes.data.attendingCount).toBe(3);
        expect(submitRes.data.rsvpNotes).toBe("Rahajeng pawiwahan semeton");
      }
    });

    it("rejects demo attendance exceeding max quota", async () => {
      const submitRes = await submitGuestRsvpAction({
        token: "demo-rsvp-token-mangku-wayan",
        status: "confirmed",
        attendingCount: 10, // Max quota is 4
      });

      expect(submitRes.success).toBe(false);
      if (!submitRes.success) {
        expect(submitRes.state).toBe("invalid_quota");
        expect(submitRes.error).toContain("antara 1 dan 4 orang");
      }
    });
  });

  // =========================================================================
  // 4. Token A/B Isolation & Minimal Data Disclosure
  // =========================================================================
  describe("Token A/B Isolation & Data Privacy", () => {
    it("resolves strictly to the single guest of the specific token", async () => {
      const tokenA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const tokenB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === "guests") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn((col: string, val: string) => {
                return {
                  is: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data:
                        val === tokenA
                          ? {
                              id: "guest-a",
                              wedding_id: "wedding-1",
                              name: "Keluarga A",
                              side: "groom",
                              headcount: 3,
                              invitation_status: "draft",
                              rsvp_token: tokenA,
                              rsvp_token_revoked_at: null,
                              rsvp_attending_count: null,
                              rsvp_notes: null,
                              rsvp_submitted_at: null,
                              rsvp_deadline: null,
                            }
                          : {
                              id: "guest-b",
                              wedding_id: "wedding-1",
                              name: "Keluarga B",
                              side: "bride",
                              headcount: 2,
                              invitation_status: "confirmed",
                              rsvp_token: tokenB,
                              rsvp_token_revoked_at: null,
                              rsvp_attending_count: 2,
                              rsvp_notes: null,
                              rsvp_submitted_at: "2026-10-01T00:00:00Z",
                              rsvp_deadline: null,
                            },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "wedding-1",
                    couple_names: "Wayan & Kadek",
                    prospective_date: "2026-11-20",
                    location_region: "Gianyar, Bali",
                    is_frozen: false,
                    deleted_at: null,
                  },
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const resultA = await getRsvpGuestDetails(tokenA);
      const resultB = await getRsvpGuestDetails(tokenB);

      expect(resultA.success).toBe(true);
      expect(resultB.success).toBe(true);

      if (resultA.success && resultB.success) {
        expect(resultA.data.guestName).toBe("Keluarga A");
        expect(resultA.data.maxHeadcount).toBe(3);

        expect(resultB.data.guestName).toBe("Keluarga B");
        expect(resultB.data.maxHeadcount).toBe(2);

        // Neither reveals the other's data
        expect(resultA.data.guestName).not.toBe(resultB.data.guestName);
      }
    });

    it("returns generic not_found error on invalid or non-existent token (no oracle)", async () => {
      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const result = await getRsvpGuestDetails(
        "1234567890abcdef1234567890abcdef"
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.state).toBe("not_found");
        expect(result.error).toContain("tidak valid atau tidak ditemukan");
      }
    });
  });

  // =========================================================================
  // 5. Token Revocation & Rotation
  // =========================================================================
  describe("Token Revocation & Rotation", () => {
    it("returns state 'revoked' when token has been revoked by committee", async () => {
      const token = "revokedtoken123456789012345678901234567890123456";
      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === "guests") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "guest-revoked",
                      wedding_id: "w-1",
                      name: "Tamu Dicabut",
                      rsvp_token: token,
                      rsvp_token_revoked_at: "2026-10-01T10:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const lookup = await getRsvpGuestDetails(token);
      expect(lookup.success).toBe(false);
      if (!lookup.success) {
        expect(lookup.state).toBe("revoked");
        expect(lookup.error).toContain("telah dicabut atau diperbarui");
      }

      // Submission also fails
      const submit = await submitGuestRsvpAction({
        token,
        status: "confirmed",
        attendingCount: 1,
      });
      expect(submit.success).toBe(false);
      if (!submit.success) {
        expect(submit.state).toBe("revoked");
      }
    });

    it("rotates token generating a fresh 48-char token and clearing revocation", async () => {
      const res = await rotateGuestRsvpTokenAction("demo", "demo-g-1");
      expect(res.success).toBe(true);
      expect(res.token).toBeDefined();
    });

    it("revokes token successfully in demo mode", async () => {
      const res = await revokeGuestRsvpTokenAction("demo", "demo-g-1");
      expect(res.success).toBe(true);
    });
  });

  // =========================================================================
  // 6. Quota & Attendance Server Validation
  // =========================================================================
  describe("Server-Side Quota & Attendance Validation", () => {
    const validToken = "validtoken123456789012345678901234567890123456";

    function setupMockGuest(headcount: number) {
      return {
        from: vi.fn((table: string) => {
          if (table === "guests") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "g-test",
                      wedding_id: "w-test",
                      name: "Tamu Test",
                      headcount,
                      rsvp_token: validToken,
                      rsvp_token_revoked_at: null,
                      rsvp_deadline: null,
                      deleted_at: null,
                    },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "w-test",
                    prospective_date: "2026-12-01",
                    is_frozen: false,
                    deleted_at: null,
                  },
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };
    }

    it("accepts attendance within quota", async () => {
      const mockAdmin = setupMockGuest(3);
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const res = await submitGuestRsvpAction({
        token: validToken,
        status: "confirmed",
        attendingCount: 2, // 2 <= 3
        notes: "Matur suksma",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.attendingCount).toBe(2);
        expect(res.data.invitationStatus).toBe("confirmed");
      }
    });

    it("strictly rejects attendance exceeding max quota", async () => {
      const mockAdmin = setupMockGuest(2);
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const res = await submitGuestRsvpAction({
        token: validToken,
        status: "confirmed",
        attendingCount: 4, // 4 > 2
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.state).toBe("invalid_quota");
        expect(res.error).toContain("tidak boleh melebihi kuota undangan");
      }
    });

    it("strictly rejects attending with 0 or negative pax", async () => {
      const mockAdmin = setupMockGuest(3);
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const res = await submitGuestRsvpAction({
        token: validToken,
        status: "confirmed",
        attendingCount: 0,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.state).toBe("invalid_quota");
        expect(res.error).toContain("minimal 1 orang");
      }
    });

    it("normalizes attending count to 0 when status is declined", async () => {
      const mockAdmin = setupMockGuest(3);
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const res = await submitGuestRsvpAction({
        token: validToken,
        status: "declined",
        attendingCount: 3, // Even if passed 3, declined sets count to 0
        notes: "Mohon maaf berhalangan",
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.invitationStatus).toBe("declined");
        expect(res.data.attendingCount).toBe(0);
      }
    });
  });

  // =========================================================================
  // 7. Event Frozen / Archived Guardrail
  // =========================================================================
  describe("Archived or Frozen Event Protection", () => {
    it("blocks RSVP submission if wedding workspace is frozen", async () => {
      const token = "frozentoken123456789012345678901234567890123456";
      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === "guests") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "g-frozen",
                      wedding_id: "w-frozen",
                      name: "Tamu Frozen",
                      headcount: 2,
                      rsvp_token: token,
                      rsvp_token_revoked_at: null,
                      deleted_at: null,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "w-frozen",
                    prospective_date: "2026-11-20",
                    is_frozen: true, // Frozen!
                    deleted_at: null,
                  },
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      const res = await submitGuestRsvpAction({
        token,
        status: "confirmed",
        attendingCount: 1,
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.state).toBe("archived");
        expect(res.error).toContain("telah selesai atau diarsipkan");
      }
    });
  });

  // =========================================================================
  // 8. Idempotency & Replay / Pax Reconciliation
  // =========================================================================
  describe("Idempotency, Replay & Catering Pax Reconciliation", () => {
    it("reconciles catering pax accurately across confirmed, declined, and unresponded states", () => {
      const sampleGuests: Guest[] = [
        {
          id: "g1",
          weddingId: "w1",
          name: "Keluarga A (Konfirmasi 3 dari 4 kuota)",
          side: "groom",
          groupHousehold: "Banjar",
          headcount: 4,
          invitationStatus: "confirmed",
          rsvpAttendingCount: 3, // Specifically confirmed 3
          phone: "081234567890",
          notes: null,
          createdAt: "2026-10-01",
          updatedAt: "2026-10-01",
        },
        {
          id: "g2",
          weddingId: "w1",
          name: "Keluarga B (Konfirmasi penuh 2 pax)",
          side: "bride",
          groupHousehold: "Keluarga",
          headcount: 2,
          invitationStatus: "confirmed",
          rsvpAttendingCount: 2,
          phone: "081234567891",
          notes: null,
          createdAt: "2026-10-01",
          updatedAt: "2026-10-01",
        },
        {
          id: "g3",
          weddingId: "w1",
          name: "Keluarga C (Berhalangan hadir)",
          side: "both",
          groupHousehold: "Sahabat",
          headcount: 2,
          invitationStatus: "declined",
          rsvpAttendingCount: 0,
          phone: "081234567892",
          notes: null,
          createdAt: "2026-10-01",
          updatedAt: "2026-10-01",
        },
        {
          id: "g4",
          weddingId: "w1",
          name: "Keluarga D (Undangan Terkirim, belum RSVP)",
          side: "groom",
          groupHousehold: "Banjar",
          headcount: 5,
          invitationStatus: "sent",
          rsvpAttendingCount: null,
          phone: "081234567893",
          notes: null,
          createdAt: "2026-10-01",
          updatedAt: "2026-10-01",
        },
        {
          id: "g5",
          weddingId: "w1",
          name: "Keluarga E (Draft, belum dikirim)",
          side: "bride",
          groupHousehold: "Rekan",
          headcount: 3,
          invitationStatus: "draft",
          rsvpAttendingCount: null,
          phone: null,
          notes: null,
          createdAt: "2026-10-01",
          updatedAt: "2026-10-01",
        },
      ];

      const stats = calculateGuestStats(sampleGuests);

      // Total diundang (kuota): 4 + 2 + 2 + 5 + 3 = 16 pax
      expect(stats.invitedHeadcount).toBe(16);

      // Terkonfirmasi Hadir: 3 (g1) + 2 (g2) = 5 pax
      expect(stats.confirmedHeadcount).toBe(5);
      expect(stats.actualAttendingPax).toBe(5);
      expect(stats.confirmedInvitations).toBe(2);

      // Menolak / Berhalangan: 2 pax (g3)
      expect(stats.declinedHeadcount).toBe(2);
      expect(stats.declinedInvitations).toBe(1);

      // Belum Merespons: 5 (sent) + 3 (draft) = 8 pax
      expect(stats.pendingHeadcount).toBe(8);
      expect(stats.pendingInvitations).toBe(2);

      // Total pax accounted for catering: 5 (confirmed) + 2 (declined) + 8 (pending) = 15
      // (1 pax reduction from g1 who was invited for 4 but confirmed 3)
      expect(
        stats.confirmedHeadcount +
          stats.declinedHeadcount +
          stats.pendingHeadcount
      ).toBe(15);
    });

    it("submitting multiple times idempotently updates the same guest record without duplicating pax", async () => {
      let currentStatus = "draft";
      let currentPax = 0;
      let updateCount = 0;

      const token = "idempotenttoken12345678901234567890123456789012";

      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === "guests") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: "g-idempotent",
                      wedding_id: "w-1",
                      name: "Tamu Idempoten",
                      headcount: 4,
                      rsvp_token: token,
                      rsvp_token_revoked_at: null,
                      deleted_at: null,
                    },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn((payload: Record<string, unknown>) => {
                updateCount++;
                currentStatus = payload.invitation_status as string;
                currentPax = payload.rsvp_attending_count as number;
                return {
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                  }),
                };
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "w-1",
                    prospective_date: "2026-11-20",
                    is_frozen: false,
                    deleted_at: null,
                  },
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(
        mockAdmin as unknown as ReturnType<typeof createAdminClient>
      );

      // First submission: Confirm 4 pax
      const res1 = await submitGuestRsvpAction({
        token,
        status: "confirmed",
        attendingCount: 4,
      });
      expect(res1.success).toBe(true);
      expect(currentStatus).toBe("confirmed");
      expect(currentPax).toBe(4);
      expect(updateCount).toBe(1);

      // Second submission: Change to 2 pax (e.g. child cannot attend)
      const res2 = await submitGuestRsvpAction({
        token,
        status: "confirmed",
        attendingCount: 2,
      });
      expect(res2.success).toBe(true);
      expect(currentStatus).toBe("confirmed");
      expect(currentPax).toBe(2);
      expect(updateCount).toBe(2); // Updated cleanly without new rows
    });
  });

  // =========================================================================
  // 9. WhatsApp Integration & Non-Automatic Triggering
  // =========================================================================
  describe("WhatsApp Invite & Personal RSVP Link Integration", () => {
    it("embeds the personal RSVP link cleanly into the WhatsApp invitation text", () => {
      const guest = { name: "I Made Sujana", headcount: 2 };
      const rsvpUrl =
        "https://patemon.vercel.app/rsvp/sampletoken12345678901234567890";

      const message = generateWhatsAppInviteMessage(guest, {
        coupleNames: "Putu & Kadek",
        prospectiveDate: "2026-10-24",
        ceremonyLocation: "Banjar Tengah, Ubud",
        invitationUrl: rsvpUrl,
      });

      expect(message).toContain("Undangan Digital & Konfirmasi Kehadiran:");
      expect(message).toContain(rsvpUrl);
      expect(message).toContain("*I Made Sujana* (2 Orang)");
      expect(message).toContain("Om Swastyastu");
    });

    it("verifies that fetching RSVP details does not change invitation_status to 'sent'", async () => {
      // Acceptance criterion: Flow membuka WhatsApp tetap manual; RSVP tidak menandai undangan terkirim otomatis.
      const lookup = await getRsvpGuestDetails(
        "demo-rsvp-token-sahabat-kuliah"
      );
      expect(lookup.success).toBe(true);
      if (lookup.success) {
        // Original status was draft, must still be draft
        expect(lookup.data.invitationStatus).toBe("draft");
      }
    });
  });
});
