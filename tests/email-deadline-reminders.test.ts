/**
 * Automated Test Suite for Deadline Email Reminders (Issue #84)
 * Verifies:
 * 1. Timezone computations (Asia/Makassar / WITA / UTC+8)
 * 2. Idempotent deduplication (duplicate jobs never send double emails)
 * 3. Status changes (completed tasks & paid items are ignored)
 * 4. Deadline updates (changing due dates correctly resets reminder cycle)
 * 5. Revoked members & external PICs (safe exclusions)
 * 6. Opt-out preferences (disabled notifications respected)
 * 7. Send failure & bounded retries
 * 8. Privacy guarantees (no sensitive bank/guest details in messages)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  diffCalendarDays,
  formatWitaDateReadable,
  getTierForDiffDays,
  getWitaDateString,
  renderReminderEmail,
} from "@/features/reminders/utils";
import {
  clearInMemoryDispatchLogs,
  sendReminderEmail,
} from "@/features/reminders/dispatcher";
import { evaluateAndDispatchReminders } from "@/features/reminders/engine";

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
    getWorkspaceEntitlement: vi.fn().mockResolvedValue({
      canAccessWorkspace: true,
      isFrozen: false,
      role: "owner",
    }),
  };
});

import { createClient } from "@/lib/supabase/server";

describe("Deadline Email Reminders (Issue #84)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearInMemoryDispatchLogs();
  });

  describe("1. Timezone & Calendar Math (Asia/Makassar / WITA)", () => {
    it("computes current date string in WITA accurately", () => {
      // 2026-11-15 01:00 UTC = 2026-11-15 09:00 WITA
      const utcDate = new Date(Date.UTC(2026, 10, 15, 1, 0, 0));
      expect(getWitaDateString(utcDate)).toBe("2026-11-15");

      // 2026-11-15 20:00 UTC = 2026-11-16 04:00 WITA (next day in Bali)
      const nextDayWita = new Date(Date.UTC(2026, 10, 15, 20, 0, 0));
      expect(getWitaDateString(nextDayWita)).toBe("2026-11-16");
    });

    it("correctly computes whole calendar day differences without timezone drifting", () => {
      expect(diffCalendarDays("2026-11-15", "2026-11-22")).toBe(7); // H-7
      expect(diffCalendarDays("2026-11-15", "2026-11-18")).toBe(3); // H-3
      expect(diffCalendarDays("2026-11-15", "2026-11-16")).toBe(1); // H-1
      expect(diffCalendarDays("2026-11-15", "2026-11-15")).toBe(0); // H-0
      expect(diffCalendarDays("2026-11-15", "2026-11-10")).toBe(-5); // Overdue
    });

    it("maps calendar day differences to reminder tiers", () => {
      expect(getTierForDiffDays(7)).toBe("H-7");
      expect(getTierForDiffDays(3)).toBe("H-3");
      expect(getTierForDiffDays(1)).toBe("H-1");
      expect(getTierForDiffDays(0)).toBe("H-0");
      expect(getTierForDiffDays(5)).toBeNull();
      expect(getTierForDiffDays(-1)).toBeNull();
    });

    it("formats dates into readable Indonesian format with WITA designation", () => {
      const formatted = formatWitaDateReadable("2026-11-22");
      expect(formatted).toContain("22 November 2026");
      expect(formatted).toContain("Minggu");
    });
  });

  describe("2. Email Content & Privacy Guarantees", () => {
    it("renders safe email text and HTML without bank accounts or sensitive guest data", () => {
      const payload = {
        to: "wayan@example.com",
        recipientName: "I Wayan Raditya",
        subject: 'Pengingat Tugas: "Penyusunan Banten"',
        weddingTitle: "Wayan & Rai",
        itemType: "task" as const,
        itemTitle: "Penyusunan Banten Pawiwahan",
        dueDate: "Minggu, 22 November 2026 (WITA)",
        daysRemaining: 7,
        actionUrl:
          "https://patemon.vercel.app/workspace/w123/tasks?view=my_tasks",
      };

      const { text, html } = renderReminderEmail(payload);

      // Verify recipient & core details
      expect(text).toContain("I Wayan Raditya");
      expect(text).toContain("Penyusunan Banten Pawiwahan");
      expect(text).toContain("7 Hari Lagi");
      expect(text).toContain(
        "https://patemon.vercel.app/workspace/w123/tasks?view=my_tasks"
      );

      // Verify privacy notice
      expect(text).toContain("Patemon tidak pernah menyertakan nomor rekening");
      expect(html).toContain("Privasi &amp; Keamanan");

      // Must NOT contain sensitive bank info
      expect(text).not.toContain("BCA");
      expect(text).not.toContain("Mandiri");
      expect(text).not.toContain("Rekening:");
    });
  });

  describe("3. Dispatcher Bounded Retry & Failure Recording", () => {
    it("dispatches successfully in mock test mode on first attempt", async () => {
      const res = await sendReminderEmail(
        {
          to: "success@example.com",
          recipientName: "Test User",
          subject: "Test Subject",
          weddingTitle: "Test Wedding",
          itemType: "task",
          itemTitle: "Test Task",
          dueDate: "2026-11-22",
          daysRemaining: 7,
          actionUrl: "https://patemon.vercel.app",
        },
        { isMockMode: true }
      );

      expect(res.success).toBe(true);
      expect(res.attempts).toBe(1);
      expect(res.messageId).toBeDefined();
    });

    it("retries transient failure and succeeds within maxRetries limit", async () => {
      const res = await sendReminderEmail(
        {
          to: "fail-once@example.com", // Trigger mocked transient failure on attempt 1
          recipientName: "Test User",
          subject: "Test Transient",
          weddingTitle: "Test Wedding",
          itemType: "task",
          itemTitle: "Test Task",
          dueDate: "2026-11-22",
          daysRemaining: 7,
          actionUrl: "https://patemon.vercel.app",
        },
        { isMockMode: true, maxRetries: 3 }
      );

      expect(res.success).toBe(true);
      expect(res.attempts).toBe(2);
    });

    it("records failure when retries are exhausted without crashing", async () => {
      const res = await sendReminderEmail(
        {
          to: "fail-always@example.com", // Trigger persistent failure
          recipientName: "Test User",
          subject: "Test Failure",
          weddingTitle: "Test Wedding",
          itemType: "task",
          itemTitle: "Test Task",
          dueDate: "2026-11-22",
          daysRemaining: 7,
          actionUrl: "https://patemon.vercel.app",
        },
        { isMockMode: true, maxRetries: 3 }
      );

      expect(res.success).toBe(false);
      expect(res.attempts).toBe(3);
      expect(res.error).toContain("Simulated upstream SMTP failure");
    });
  });

  describe("4. End-to-End Reminder Evaluation Engine Guardrails", () => {
    interface MockOverrides {
      preferences?: Record<string, unknown>;
      tasks?: Array<Record<string, unknown>>;
      members?: Array<Record<string, unknown>>;
      profiles?: Array<Record<string, unknown>>;
      budgetTasks?: Array<Record<string, unknown>>;
    }

    function setupSupabaseMock(overrides: MockOverrides) {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-owner-1" } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_reminder_preferences") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data:
                  overrides.preferences !== undefined
                    ? overrides.preferences
                    : {
                        wedding_id: "wedding-1",
                        email_notifications_enabled: true,
                        task_reminders_enabled: true,
                        payment_reminders_enabled: true,
                        reminder_tiers: ["H-7", "H-1"],
                      },
                error: null,
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  couple_names: "Wayan & Rai",
                  groom_name: "Wayan",
                  bride_name: "Rai",
                },
                error: null,
              }),
            };
          }
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              then: vi
                .fn()
                .mockImplementation((fn: (arg: unknown) => unknown) =>
                  Promise.resolve(
                    fn({
                      data: overrides.members || [
                        { user_id: "user-1", role: "editor", status: "active" },
                        {
                          user_id: "user-owner-1",
                          role: "owner",
                          status: "active",
                        },
                      ],
                      error: null,
                    })
                  )
                ),
            };
          }
          if (table === "profiles") {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: overrides.profiles || [
                  {
                    id: "user-1",
                    full_name: "I Wayan Raditya",
                    email: "wayan@example.com",
                  },
                  {
                    id: "user-owner-1",
                    full_name: "Ni Made Rai",
                    email: "made@example.com",
                  },
                ],
                error: null,
              }),
            };
          }
          if (table === "wedding_tasks") {
            let isCategoryBudget = false;
            const queryBuilder: Record<string, unknown> = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn((col: string, val: string) => {
                if (col === "category" && val === "budget") {
                  isCategoryBudget = true;
                }
                return queryBuilder;
              }),
              not: vi.fn().mockImplementation(() =>
                Promise.resolve({
                  data: isCategoryBudget
                    ? overrides.budgetTasks || []
                    : overrides.tasks || [],
                  error: null,
                })
              ),
            };
            return queryBuilder;
          }
          if (table === "budget_items") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              not: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }
          if (table === "wedding_reminder_logs") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
              upsert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          };
        }),
      };

      vi.mocked(createClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>
      );
      return mockSupabase;
    }

    it("dispatches H-7 task reminder when task is due exactly 7 days from reference date", async () => {
      const refDate = new Date(Date.UTC(2026, 10, 15, 2, 0, 0)); // 2026-11-15 WITA
      setupSupabaseMock({
        tasks: [
          {
            id: "task-1",
            title: "Siapkan Banten Pejati",
            due_date: "2026-11-22", // 7 days later
            status: "todo",
            assigned_to_user_id: "user-1",
          },
        ],
      });

      const res = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });

      expect(res.dispatched).toBe(1);
      expect(res.skipped).toBe(0);
      expect(res.failed).toBe(0);
      expect(res.logs[0].reminderTier).toBe("H-7");
      expect(res.logs[0].recipientEmail).toBe("wayan@example.com");
    });

    it("idempotently skips sending when duplicate job runs with same date and item", async () => {
      const refDate = new Date(Date.UTC(2026, 10, 15, 2, 0, 0));
      setupSupabaseMock({
        tasks: [
          {
            id: "task-dup-1",
            title: "Koordinasi Gamelan Banjar",
            due_date: "2026-11-22",
            status: "in_progress",
            assigned_to_user_id: "user-1",
          },
        ],
      });

      // Run 1: Sends email
      const res1 = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });
      expect(res1.dispatched).toBe(1);

      // Run 2 (duplicate job run on same day): Skips duplicate dispatch
      const res2 = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });
      expect(res2.dispatched).toBe(0);
      expect(res2.skipped).toBe(1);
    });

    it("ignores completed ('done') or canceled tasks even if due date matches", async () => {
      const refDate = new Date(Date.UTC(2026, 10, 15, 2, 0, 0));
      setupSupabaseMock({
        tasks: [
          {
            id: "task-done",
            title: "Tugas Selesai",
            due_date: "2026-11-22",
            status: "done",
            assigned_to_user_id: "user-1",
          },
          {
            id: "task-canceled",
            title: "Tugas Dibatalkan",
            due_date: "2026-11-22",
            status: "canceled",
            assigned_to_user_id: "user-1",
          },
        ],
      });

      const res = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });

      expect(res.dispatched).toBe(0);
      expect(res.logs.length).toBe(0);
    });

    it("skips tasks assigned to revoked members or external PICs without account", async () => {
      const refDate = new Date(Date.UTC(2026, 10, 15, 2, 0, 0));
      setupSupabaseMock({
        members: [
          { user_id: "user-revoked", role: "editor", status: "revoked" }, // Revoked!
        ],
        tasks: [
          {
            id: "task-revoked-user",
            title: "Tugas Anggota Dicabut",
            due_date: "2026-11-22",
            status: "todo",
            assigned_to_user_id: "user-revoked",
          },
          {
            id: "task-external-pic",
            title: "Tugas PIC Eksternal",
            due_date: "2026-11-22",
            status: "todo",
            assigned_to_user_id: null, // External PIC without account
            assignee_name: "Pak Ketut Catering",
          },
        ],
      });

      const res = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });

      expect(res.dispatched).toBe(0);
      expect(res.logs.length).toBe(0);
    });

    it("respects user opt-out when email notifications are disabled", async () => {
      const refDate = new Date(Date.UTC(2026, 10, 15, 2, 0, 0));
      setupSupabaseMock({
        preferences: {
          wedding_id: "wedding-1",
          email_notifications_enabled: false, // Opt-out!
          task_reminders_enabled: true,
          payment_reminders_enabled: true,
          reminder_tiers: ["H-7", "H-1"],
        },
        tasks: [
          {
            id: "task-1",
            title: "Tugas Normal",
            due_date: "2026-11-22",
            status: "todo",
            assigned_to_user_id: "user-1",
          },
        ],
      });

      const res = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });

      expect(res.dispatched).toBe(0);
      expect(res.logs.length).toBe(0);
    });

    it("adapts seamlessly when deadline changes to a new date", async () => {
      const refDate = new Date(Date.UTC(2026, 10, 15, 2, 0, 0));

      // Initial state: due on 2026-11-22 (H-7)
      setupSupabaseMock({
        tasks: [
          {
            id: "task-rescheduled",
            title: "Busana Mempelai",
            due_date: "2026-11-22",
            status: "todo",
            assigned_to_user_id: "user-1",
          },
        ],
      });

      const res1 = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });
      expect(res1.dispatched).toBe(1);

      // User changes due date to 2026-11-16 (H-1)
      setupSupabaseMock({
        tasks: [
          {
            id: "task-rescheduled",
            title: "Busana Mempelai",
            due_date: "2026-11-16", // Now H-1!
            status: "todo",
            assigned_to_user_id: "user-1",
          },
        ],
      });

      const res2 = await evaluateAndDispatchReminders({
        weddingId: "wedding-1",
        referenceDate: refDate,
        isMockMode: true,
      });

      // New tier H-1 with new due date triggers new dispatch legitimately
      expect(res2.dispatched).toBe(1);
      expect(res2.logs[0].reminderTier).toBe("H-1");
      expect(res2.logs[0].targetDueDate).toBe("2026-11-16");
    });
  });
});
