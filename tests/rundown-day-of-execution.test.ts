/**
 * Automated Test Suite for Day-Of Rundown Execution & Live Tracking (Issue #88).
 * Verifies status transitions, actual execution timestamps, non-color delay indicators,
 * midnight crossover math, fail-closed role authorization (Viewer read-only),
 * and optimistic concurrency conflict protection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only module for Vitest test environment
vi.mock("server-only", () => ({}));

// Mock Next.js Cache Revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock Entitlement Check & Supabase
const { mockCheckFeatureAccess, mockGetUser, mockSupabase } = vi.hoisted(() => {
  const mockCheckFeatureAccess = vi.fn();
  const mockGetUser = vi.fn();

  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => {
      if (table === "wedding_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };
    }),
  };

  return {
    mockCheckFeatureAccess,
    mockGetUser,
    mockSupabase,
  };
});

type MockSupabaseFrom = ReturnType<typeof mockSupabase.from>;

vi.mock("@/features/payments/entitlements", () => ({
  checkFeatureAccess: (...args: unknown[]) => mockCheckFeatureAccess(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

import {
  calculateDelayMinutes,
  calculateDurationMinutes,
  formatDelayBadge,
  formatDurationString,
  getCurrentTimeWita,
  calculateRundownStats,
  RUNDOWN_STATUS_CONFIG,
} from "@/features/rundown/seeds";
import {
  verifyRundownWritePermission,
  updateRundownEventStatusAction,
  updateRundownEventAction,
  createRundownEventAction,
} from "@/features/rundown/actions";
import type { RundownEvent } from "@/features/rundown/types";

describe("Wedding Day Rundown Day-of Execution (Issue #88)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckFeatureAccess.mockResolvedValue({
      allowed: true,
      role: "owner",
      reason: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "panitia@patemon.id" } },
    });
  });

  // =========================================================================
  // 1. Midnight & Multiday Crossover Math
  // =========================================================================
  describe("Midnight & Multiday Crossover Math", () => {
    it("should calculate positive duration for events crossing midnight (e.g., 23:30 to 01:30)", () => {
      const duration = calculateDurationMinutes("23:30", "01:30");
      expect(duration).toBe(120); // 30 min before midnight + 90 min after midnight
      expect(duration).toBeGreaterThan(0);
      expect(formatDurationString(duration)).toBe("2 jam");
    });

    it("should calculate overnight ceremony span (22:00 to 02:00)", () => {
      const duration = calculateDurationMinutes("22:00", "02:00");
      expect(duration).toBe(240);
      expect(formatDurationString(duration)).toBe("4 jam");
    });

    it("should handle same-day standard duration (08:00 to 10:15)", () => {
      const duration = calculateDurationMinutes("08:00", "10:15");
      expect(duration).toBe(135);
      expect(formatDurationString(duration)).toBe("2 jam 15 mnt");
    });

    it("should calculate delay minutes across midnight crossover accurately", () => {
      // Scheduled 23:50, actual start 00:10 (20 minutes late)
      const lateDelay = calculateDelayMinutes("23:50", "00:10");
      expect(lateDelay).toBe(20);

      // Scheduled 00:15, actual start 23:55 (20 minutes early)
      const earlyDelay = calculateDelayMinutes("00:15", "23:55");
      expect(earlyDelay).toBe(-20);

      // Scheduled 09:00, actual start 09:15 (15 minutes late)
      expect(calculateDelayMinutes("09:00", "09:15")).toBe(15);

      // Scheduled 09:00, actual start 09:00 (on time)
      expect(calculateDelayMinutes("09:00", "09:00")).toBe(0);

      // Scheduled 09:00, no actual start
      expect(calculateDelayMinutes("09:00", null)).toBe(0);
    });

    it("should return valid Bali WITA time format (HH:MM)", () => {
      const timeWita = getCurrentTimeWita();
      expect(timeWita).toMatch(/^\d{2}:\d{2}$/);
      const [h, m] = timeWita.split(":").map(Number);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(24);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThan(60);
    });
  });

  // =========================================================================
  // 2. Accessibility & Non-Color Delay Badges
  // =========================================================================
  describe("Accessibility & Non-Color Delay Badges", () => {
    it("should format delayed events with explicit text and late type", () => {
      const badge = formatDelayBadge(15);
      expect(badge.type).toBe("late");
      expect(badge.label).toBe("Terlambat +15 mnt");
      expect(badge.badgeClass).toContain("rose");
    });

    it("should format early events with explicit text and early type", () => {
      const badge = formatDelayBadge(-10);
      expect(badge.type).toBe("early");
      expect(badge.label).toBe("Lebih Awal 10 mnt");
      expect(badge.badgeClass).toContain("blue");
    });

    it("should format on-time events within threshold (+/- 5 min)", () => {
      const onTimeBadge = formatDelayBadge(3);
      expect(onTimeBadge.type).toBe("on_time");
      expect(onTimeBadge.label).toBe("Tepat Waktu");

      const onTimeEarlyBadge = formatDelayBadge(-2);
      expect(onTimeEarlyBadge.type).toBe("on_time");
      expect(onTimeEarlyBadge.label).toBe("Tepat Waktu");
    });

    it("should include readable descriptions for all rundown status states", () => {
      const statuses = [
        "pending",
        "in_progress",
        "completed",
        "delayed",
        "skipped",
      ] as const;
      statuses.forEach((st) => {
        const config = RUNDOWN_STATUS_CONFIG[st];
        expect(config).toBeDefined();
        expect(config.label.length).toBeGreaterThan(0);
        expect(config.description.length).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // 3. Fail-Closed Authorization & Role Enforcement
  // =========================================================================
  describe("Fail-Closed Authorization & Role Enforcement", () => {
    it("should allow demo workspace write bypass", async () => {
      const result = await verifyRundownWritePermission("demo");
      expect(result.allowed).toBe(true);
    });

    it("should block unauthenticated user from modifying rundown", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await verifyRundownWritePermission("wedding-123");
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Autentikasi diperlukan");
    });

    it("should block non-member from modifying rundown", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({ data: null }),
      } as unknown as MockSupabaseFrom);

      const result = await verifyRundownWritePermission("wedding-123");
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("bukan anggota aktif");
    });

    it("should block inactive member from modifying rundown", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: "editor", status: "suspended" },
        }),
      } as unknown as MockSupabaseFrom);

      const result = await verifyRundownWritePermission("wedding-123");
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("bukan anggota aktif");
    });

    it("should strictly reject Viewer role with read-only notice", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: "viewer", status: "active" },
        }),
      } as unknown as MockSupabaseFrom);

      const result = await verifyRundownWritePermission("wedding-123");
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Viewer");
    });

    it("should allow active Owner role", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: "owner", status: "active" },
        }),
      } as unknown as MockSupabaseFrom);

      const result = await verifyRundownWritePermission("wedding-123");
      expect(result.allowed).toBe(true);
      expect(result.userId).toBe("user-1");
    });

    it("should allow active Editor role", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: "editor", status: "active" },
        }),
      } as unknown as MockSupabaseFrom);

      const result = await verifyRundownWritePermission("wedding-123");
      expect(result.allowed).toBe(true);
    });

    it("should block write if workspace has no active entitlement", async () => {
      mockCheckFeatureAccess.mockResolvedValueOnce({
        allowed: false,
        role: "owner",
        reason: "Workspace dibekukan atau belum berlangganan.",
      });

      const result = await verifyRundownWritePermission("wedding-123");
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Workspace dibekukan");
    });
  });

  // =========================================================================
  // 4. Concurrency & Anti-Silent Overwrite Protection
  // =========================================================================
  describe("Concurrency & Anti-Silent Overwrite Protection", () => {
    it("should detect concurrency conflict when updating status if expectedUpdatedAt mismatches", async () => {
      // Setup member auth check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: "owner", status: "active" },
        }),
      } as unknown as MockSupabaseFrom);

      // Existing record has newer updated_at
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: "ev-1",
            wedding_id: "wedding-123",
            start_time: "08:00",
            updated_at: "2026-11-15T10:30:00Z", // Newer than expected
          },
          error: null,
        }),
      } as unknown as MockSupabaseFrom);

      const res = await updateRundownEventStatusAction("wedding-123", "ev-1", {
        status: "in_progress",
        expectedUpdatedAt: "2026-11-15T10:00:00Z", // Stale timestamp
      });

      expect(res.success).toBe(false);
      expect(res.conflict).toBe(true);
      expect(res.error).toContain("diperbarui oleh panitia lain");
    });

    it("should detect concurrency conflict on full segment update if expectedUpdatedAt mismatches", async () => {
      // Setup member auth check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: "owner", status: "active" },
        }),
      } as unknown as MockSupabaseFrom);

      // Existing record has newer updated_at
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: {
            id: "ev-1",
            wedding_id: "wedding-123",
            updated_at: "2026-11-15T10:30:00Z",
          },
          error: null,
        }),
      } as unknown as MockSupabaseFrom);

      const res = await updateRundownEventAction("wedding-123", "ev-1", {
        segmentTitle: "Judul Baru",
        expectedUpdatedAt: "2026-11-15T10:00:00Z",
      });

      expect(res.success).toBe(false);
      expect(res.conflict).toBe(true);
      expect(res.error).toContain("diperbarui oleh panitia lain");
    });

    it("should succeed status update when expectedUpdatedAt matches server state", async () => {
      // 1. Member auth
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { role: "editor", status: "active" },
        }),
      } as unknown as MockSupabaseFrom);

      const currentTimestamp = "2026-11-15T10:00:00Z";

      // 2. Fetch current record
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: "ev-1",
            wedding_id: "wedding-123",
            start_time: "08:00",
            end_time: "09:00",
            segment_title: "Upacara Pabyakala",
            updated_at: currentTimestamp,
          },
          error: null,
        }),
      } as unknown as MockSupabaseFrom);

      // 3. Update execution
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: {
            id: "ev-1",
            wedding_id: "wedding-123",
            ceremony_id: null,
            segment_title: "Upacara Pabyakala",
            scheduled_date: "2026-12-01",
            start_time: "08:00",
            end_time: "09:00",
            location: "Natah Rumah",
            person_in_charge: "Jero Mangku",
            pic_phone: "08123456789",
            order_index: 1,
            notes: "Persiapan lengkap",
            status: "in_progress",
            actual_start_time: "08:15",
            actual_end_time: null,
            actual_start_at: "2026-11-15T10:15:00Z",
            actual_end_at: null,
            delay_minutes: 15,
            notes_day_of: "Mundur 15 menit menunggu keluarga",
            created_at: "2026-11-15T00:00:00Z",
            updated_at: "2026-11-15T10:15:00Z",
          },
          error: null,
        }),
      } as unknown as MockSupabaseFrom);

      const res = await updateRundownEventStatusAction("wedding-123", "ev-1", {
        status: "in_progress",
        actualStartTime: "08:15",
        notesDayOf: "Mundur 15 menit menunggu keluarga",
        expectedUpdatedAt: currentTimestamp,
      });

      expect(res.success).toBe(true);
      expect(res.updatedEvent).toBeDefined();
      expect(res.updatedEvent?.status).toBe("in_progress");
      expect(res.updatedEvent?.delayMinutes).toBe(15);
      expect(res.updatedEvent?.notesDayOf).toBe(
        "Mundur 15 menit menunggu keluarga"
      );
    });

    it("should handle demo workspace event creation cleanly", async () => {
      const res = await createRundownEventAction("demo", {
        segmentTitle: "Prosesi Demo",
        startTime: "10:00",
        endTime: "11:00",
      });

      expect(res.success).toBe(true);
      expect(res.event?.segmentTitle).toBe("Prosesi Demo");
      expect(res.event?.status).toBe("pending");
    });
  });

  // =========================================================================
  // 5. Aggregated Statistics & Empty State Handling
  // =========================================================================
  describe("Aggregated Statistics & Empty State Handling", () => {
    it("should safely compute statistics for empty rundown without errors", () => {
      const stats = calculateRundownStats([]);
      expect(stats.totalEvents).toBe(0);
      expect(stats.totalDurationMinutes).toBe(0);
      expect(stats.completedCount).toBe(0);
      expect(stats.inProgressCount).toBe(0);
      expect(stats.pendingCount).toBe(0);
      expect(stats.delayedCount).toBe(0);
      expect(stats.totalDelayMinutes).toBe(0);
    });

    it("should tally multi-status segments and total delays correctly", () => {
      const mockEvents: RundownEvent[] = [
        {
          id: "e1",
          weddingId: "w1",
          ceremonyId: null,
          segmentTitle: "Rias Mempelai",
          scheduledDate: "2026-12-01",
          startTime: "05:00",
          endTime: "07:00",
          location: "Bale Dauh",
          personInCharge: "MUA",
          orderIndex: 1,
          notes: null,
          status: "completed",
          actualStartTime: "05:00",
          actualEndTime: "07:00",
          delayMinutes: 0,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "e2",
          weddingId: "w1",
          ceremonyId: null,
          segmentTitle: "Upacara Pabyakala",
          scheduledDate: "2026-12-01",
          startTime: "07:30",
          endTime: "09:00",
          location: "Natah Rumah",
          personInCharge: "Jero Mangku",
          orderIndex: 2,
          notes: null,
          status: "in_progress",
          actualStartTime: "07:45",
          delayMinutes: 15,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "e3",
          weddingId: "w1",
          ceremonyId: null,
          segmentTitle: "Mapejati ring Merajan",
          scheduledDate: "2026-12-01",
          startTime: "09:30",
          endTime: "11:00",
          location: "Merajan Gede",
          personInCharge: "Keluarga Purusa",
          orderIndex: 3,
          notes: null,
          status: "delayed",
          delayMinutes: 20,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "e4",
          weddingId: "w1",
          ceremonyId: null,
          segmentTitle: "Santap Siang & Resepsi",
          scheduledDate: "2026-12-01",
          startTime: "11:30",
          endTime: "14:00",
          location: "Wantilan",
          personInCharge: "Seksi Konsumsi",
          orderIndex: 4,
          notes: null,
          status: "pending",
          createdAt: "",
          updatedAt: "",
        },
      ];

      const stats = calculateRundownStats(mockEvents);
      expect(stats.totalEvents).toBe(4);
      expect(stats.completedCount).toBe(1);
      expect(stats.inProgressCount).toBe(1);
      expect(stats.delayedCount).toBe(1);
      expect(stats.pendingCount).toBe(1);
      expect(stats.totalDelayMinutes).toBe(35); // 15 + 20
      expect(stats.distinctLocations).toBe(4);
      expect(stats.distinctPICs).toBe(4);
    });
  });
});
