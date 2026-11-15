import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only before importing server actions
vi.mock("server-only", () => ({}));

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  sanitizeActivityDetails,
  maskPhoneNumber,
  maskEmail,
  ACTIVITY_LOG_RETENTION_DAYS,
  ACTIVITY_LOG_DEFAULT_PAGE_SIZE,
  ACTIVITY_LOG_MAX_PAGE_SIZE,
} from "../src/features/activity-logs/sanitizer";
import {
  recordActivityLogAction,
  getWorkspaceActivityLogsAction,
} from "../src/features/activity-logs/actions";
import { updateTaskAction } from "../src/features/checklist/actions";
import { updateBudgetItemAction } from "../src/features/budget/actions";
import {
  updateRundownEventAction,
  updateRundownEventStatusAction,
} from "../src/features/rundown/actions";
import { DEMO_TASKS } from "../src/features/checklist/seeds";
import { DEMO_BUDGET_ITEMS } from "../src/features/budget/seeds";

// Mock Supabase Server Client
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Observability Logger
vi.mock("../src/lib/observability/log", () => ({
  captureError: vi.fn(),
}));
vi.mock("../src/lib/observability/logger", () => ({
  captureError: vi.fn(),
}));

// Mock Entitlements
vi.mock("../src/features/payments/entitlements", () => ({
  checkFeatureAccess: vi.fn().mockResolvedValue({ allowed: true }),
}));

// Mock Workspace Actions
vi.mock("../src/features/workspaces/actions", () => ({
  getWeddingWorkspace: vi.fn((weddingId: string) => {
    if (weddingId === "demo") {
      return Promise.resolve({
        workspace: {
          id: "demo",
          slug: "demo-pawiwahan",
          coupleNames: "Pawiwahan Dharma & Shanti",
          targetBudget: 75000000,
        },
        role: "owner",
      });
    }
    if (weddingId === "wedding-allowed-1") {
      return Promise.resolve({
        workspace: {
          id: "wedding-allowed-1",
          coupleNames: "Gede & Kadek",
        },
        role: "editor",
      });
    }
    // Unauthorized / cross-tenant wedding
    return Promise.resolve({ workspace: null, role: null });
  }),
}));

describe("Issue #90: Change History & Optimistic Concurrency Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Sanitizer & Privacy Protection (AC: Secret, PII & Document Stripping)", () => {
    it("masks phone numbers properly to avoid full PII leakage", () => {
      expect(maskPhoneNumber("081234567890")).toBe("0812****7890");
      expect(maskPhoneNumber("+6281999888777")).toBe("+628****8777");
      expect(maskPhoneNumber("123")).toBe("****");
    });

    it("masks email addresses properly", () => {
      expect(maskEmail("wayan.balinese@gmail.com")).toBe("w***e@gmail.com");
      expect(maskEmail("admin@patemon.com")).toBe("a***n@patemon.com");
      expect(maskEmail("ab@cd.com")).toBe("a***b@cd.com");
    });

    it("drops secrets and credentials (passwords, tokens, api keys, server keys) completely", () => {
      const sensitivePayload = {
        title: "Pemesanan Banten Pejati",
        password: "superSecretPassword123!",
        user_token: "jwt.header.payload.signature",
        server_key: "SB-Mid-server-xxxx",
        api_key: "aizaSyDxxxx",
        authorization: "Bearer secret-token",
        credit_card: "4111111111111111",
        cvv: "123",
        status: "in_progress",
      };

      const sanitized = sanitizeActivityDetails(sensitivePayload);

      expect(sanitized).toBeDefined();
      expect(sanitized?.title).toBe("Pemesanan Banten Pejati");
      expect(sanitized?.status).toBe("in_progress");
      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).not.toHaveProperty("user_token");
      expect(sanitized).not.toHaveProperty("server_key");
      expect(sanitized).not.toHaveProperty("api_key");
      expect(sanitized).not.toHaveProperty("authorization");
      expect(sanitized).not.toHaveProperty("credit_card");
      expect(sanitized).not.toHaveProperty("cvv");
    });

    it("masks phone numbers and emails found inside details payload", () => {
      const payload = {
        vendorName: "Sanggar Busana Bali Indah",
        phone: "081234567890",
        email: "kontak.vendor@bali.co.id",
        pic_phone: "087811223344",
      };

      const sanitized = sanitizeActivityDetails(payload);

      expect(sanitized?.phone).toBe("0812****7890");
      expect(sanitized?.email).toBe("k***r@bali.co.id");
      expect(sanitized?.pic_phone).toBe("0878****3344");
    });

    it("strips authentication query parameters from file and private document URLs", () => {
      const payload = {
        documentUrl:
          "https://storage.supabase.co/v1/object/signed/docs/spk.pdf?token=secretSignedToken123&signature=abc",
      };

      const sanitized = sanitizeActivityDetails(payload);
      expect(sanitized?.documentUrl).toBe(
        "https://storage.supabase.co/v1/object/signed/docs/spk.pdf"
      );
    });

    it("truncates excessively long strings and blocks large binary blobs", () => {
      const longText = "a".repeat(400);
      const binaryBlob = "base64blobxyz".repeat(50); // > 500 chars without spaces

      const payload = {
        notes: longText,
        avatarBlob: binaryBlob,
      };

      const sanitized = sanitizeActivityDetails(payload);
      expect(sanitized?.notes).toHaveLength(303); // 300 + '...'
      expect((sanitized?.notes as string).endsWith("...")).toBe(true);
      expect(sanitized?.avatarBlob).toBe("[BLOB_TRUNCATED]");
    });

    it("documents retention policy and pagination constraints", () => {
      expect(ACTIVITY_LOG_RETENTION_DAYS).toBe(90);
      expect(ACTIVITY_LOG_DEFAULT_PAGE_SIZE).toBe(15);
      expect(ACTIVITY_LOG_MAX_PAGE_SIZE).toBe(50);
    });
  });

  describe("2. Optimistic Concurrency Checks (AC: Prevent Silent Overwrites)", () => {
    it("detects and rejects conflicting edits on checklist tasks when expectedUpdatedAt is stale", async () => {
      const targetTask = DEMO_TASKS[0];
      const initialUpdatedAt = targetTask.updatedAt;
      const staleUpdatedAt = "2020-01-01T00:00:00.000Z";

      // Attempt update with stale version
      const result = await updateTaskAction("demo", targetTask.id, {
        title: "Judul Baru Yang Konflik",
        expectedUpdatedAt: staleUpdatedAt,
      });

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.error).toContain(
        "Tugas telah diperbarui oleh panitia lain"
      );

      // Attempt update with matching version
      const successResult = await updateTaskAction("demo", targetTask.id, {
        title: "Judul Baru Yang Sah",
        expectedUpdatedAt: initialUpdatedAt,
      });

      expect(successResult.success).toBe(true);
      expect(successResult.task?.title).toBe("Judul Baru Yang Sah");
    });

    it("detects and rejects conflicting edits on budget items when expectedUpdatedAt is stale", async () => {
      const targetItem = DEMO_BUDGET_ITEMS[0];
      const initialUpdatedAt = targetItem.updatedAt;
      const staleUpdatedAt = "2020-01-01T00:00:00.000Z";

      // Attempt update with stale version
      const result = await updateBudgetItemAction("demo", targetItem.id, {
        plannedAmount: 10000000,
        expectedUpdatedAt: staleUpdatedAt,
      });

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.error).toContain(
        "Rincian anggaran telah diperbarui oleh panitia lain"
      );

      // Attempt update with matching version
      const successResult = await updateBudgetItemAction(
        "demo",
        targetItem.id,
        {
          plannedAmount: 12000000,
          expectedUpdatedAt: initialUpdatedAt,
        }
      );

      expect(successResult.success).toBe(true);
      expect(successResult.item?.plannedAmount).toBe(12000000);
    });

    it("detects and rejects conflicting edits on rundown events when expectedUpdatedAt is stale in live DB", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      // Mock user authentication
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-panitia-1", email: "panitia@bali.com" } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: "editor", status: "active" },
              }),
            };
          }
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: { status: "active" } }),
            };
          }
          if (table === "rundown_events") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "event-123",
                  updated_at: "2026-11-15T12:00:00.000Z",
                  start_time: "10:00",
                },
              }),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "event-123",
                  updated_at: "2026-11-15T12:00:00.000Z",
                  start_time: "10:00",
                },
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>
      );

      // Call update with an outdated expectedUpdatedAt timestamp
      const result = await updateRundownEventAction(
        "wedding-allowed-1",
        "event-123",
        {
          segmentTitle: "Upacara Siraman",
          expectedUpdatedAt: "2026-11-15T10:00:00.000Z", // Outdated!
        }
      );

      expect(result.success).toBe(false);
      expect(result.conflict).toBe(true);
      expect(result.error).toContain(
        "Data susunan acara telah diperbarui oleh panitia lain"
      );

      // Also verify day-of status update concurrency rejection
      const statusResult = await updateRundownEventStatusAction(
        "wedding-allowed-1",
        "event-123",
        {
          status: "in_progress",
          expectedUpdatedAt: "2026-11-15T10:00:00.000Z",
        }
      );

      expect(statusResult.success).toBe(false);
      expect(statusResult.conflict).toBe(true);
    });
  });

  describe("3. Multi-Tenant Authorization & Actor Segregation (AC: wedding isolation, actor separation)", () => {
    it("fails closed when an unauthorized user attempts to view activity logs of another wedding", async () => {
      const result = await getWorkspaceActivityLogsAction(
        "cross-tenant-unauthorized-wedding"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Akses ditolak");
      expect(result.data).toBeUndefined();
    });

    it("returns correctly segregated logs with actor types: user, admin, and system in demo workspace", async () => {
      const result = await getWorkspaceActivityLogsAction("demo");

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const logs = result.data!.logs;
      expect(logs.length).toBeGreaterThan(0);

      // Verify presence of all three actor types
      const actorTypes = new Set(logs.map((l) => l.actorType));
      expect(actorTypes.has("user")).toBe(true);
      expect(actorTypes.has("admin")).toBe(true);
      expect(actorTypes.has("system")).toBe(true);

      // Verify entity types
      const entityTypes = new Set(logs.map((l) => l.entityType));
      expect(entityTypes.has("rundown")).toBe(true);
      expect(entityTypes.has("task")).toBe(true);
      expect(entityTypes.has("budget")).toBe(true);
      expect(entityTypes.has("wedding")).toBe(true);
    });

    it("filters logs by entityType and actorType properly", async () => {
      const taskResult = await getWorkspaceActivityLogsAction("demo", {
        entityType: "task",
      });

      expect(taskResult.success).toBe(true);
      expect(taskResult.data!.logs.every((l) => l.entityType === "task")).toBe(
        true
      );

      const adminResult = await getWorkspaceActivityLogsAction("demo", {
        actorType: "admin",
      });

      expect(adminResult.success).toBe(true);
      expect(adminResult.data!.logs.every((l) => l.actorType === "admin")).toBe(
        true
      );
    });

    it("supports search querying across summary, entity title, and actor name", async () => {
      const searchResult = await getWorkspaceActivityLogsAction("demo", {
        search: "Banten",
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.data!.logs.length).toBeGreaterThan(0);
      expect(
        searchResult.data!.logs.some(
          (l) =>
            l.entityTitle?.includes("Banten") || l.summary?.includes("Banten")
        )
      ).toBe(true);
    });
  });

  describe("4. Audit Resilience (AC: Kegagalan audit ditangani konsisten)", () => {
    it("rejects invalid input missing weddingId", async () => {
      const result = await recordActivityLogAction({
        weddingId: "",
        entityType: "task",
        action: "create",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Wedding ID wajib disertakan");
    });

    it("never gives a false claim of audit success if database insertion fails", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "user@domain.com" } },
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database connection timed out" },
              }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>
      );

      const result = await recordActivityLogAction({
        weddingId: "wedding-allowed-1",
        entityType: "task",
        action: "create",
        summary: "Membuat tugas kritis",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database connection timed out");
      expect(result.logId).toBeUndefined();
    });
  });
});
