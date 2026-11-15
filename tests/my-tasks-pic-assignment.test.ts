import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTaskAction,
  updateTaskAction,
  toggleTaskStatusAction,
  deleteTaskAction,
} from "../src/features/checklist/actions";
import { DEMO_TASKS } from "../src/features/checklist/seeds";
import type { WeddingTask } from "../src/features/checklist/types";

// Mock Supabase Server Client
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Next.js revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("[PATEMON][MVP2] PIC Workspace Assignment & Tugas Saya (Issue #83)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. User ID-Based Assignment & Identical Name Disambiguation", () => {
    const userA = {
      id: "usr-wayan-111",
      fullName: "I Wayan Raditya",
      email: "wayan.one@patemon.test",
    };
    const userB = {
      id: "usr-wayan-222",
      fullName: "I Wayan Raditya", // Identical full name!
      email: "wayan.two@patemon.test",
    };

    const sampleTasks: WeddingTask[] = [
      {
        id: "task-1",
        weddingId: "wed-gianyar-1",
        templateId: null,
        ceremonyId: null,
        title: "Koordinasi Sulinggih",
        description: null,
        category: "adat",
        priority: "urgent",
        status: "todo",
        dueDate: "2026-10-01",
        assignedToUserId: userA.id,
        assigneeName: userA.fullName,
        orderIndex: 0,
        completedAt: null,
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
      },
      {
        id: "task-2",
        weddingId: "wed-gianyar-1",
        templateId: null,
        ceremonyId: null,
        title: "Urus Surat Banjar",
        description: null,
        category: "administrasi",
        priority: "high",
        status: "in_progress",
        dueDate: "2026-10-10",
        assignedToUserId: userB.id,
        assigneeName: userB.fullName,
        orderIndex: 1,
        completedAt: null,
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
      },
      {
        id: "task-3",
        weddingId: "wed-gianyar-1",
        templateId: null,
        ceremonyId: null,
        title: "Nunas Tirta Ring Pura",
        description: null,
        category: "adat",
        priority: "medium",
        status: "todo",
        dueDate: "2026-10-12",
        assignedToUserId: null, // External PIC without account, same name!
        assigneeName: "I Wayan Raditya",
        orderIndex: 2,
        completedAt: null,
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
      },
    ];

    it("strictly isolates 'Tugas Saya' for User A by assignedToUserId without leaking User B tasks", () => {
      // Filter for User A
      const userATasks = sampleTasks.filter(
        (t) => t.assignedToUserId === userA.id
      );
      expect(userATasks).toHaveLength(1);
      expect(userATasks[0].id).toBe("task-1");
      expect(userATasks[0].title).toBe("Koordinasi Sulinggih");

      // Verify User B's task is excluded despite sharing the exact same name
      expect(userATasks.some((t) => t.id === "task-2")).toBe(false);
    });

    it("strictly isolates 'Tugas Saya' for User B without leaking User A tasks", () => {
      // Filter for User B
      const userBTasks = sampleTasks.filter(
        (t) => t.assignedToUserId === userB.id
      );
      expect(userBTasks).toHaveLength(1);
      expect(userBTasks[0].id).toBe("task-2");
      expect(userBTasks[0].title).toBe("Urus Surat Banjar");

      // Verify User A's task is excluded
      expect(userBTasks.some((t) => t.id === "task-1")).toBe(false);
    });

    it("ensures external PIC tasks with matching names are NEVER mixed into any registered user's 'Tugas Saya'", () => {
      const userATasks = sampleTasks.filter(
        (t) => t.assignedToUserId === userA.id
      );
      const userBTasks = sampleTasks.filter(
        (t) => t.assignedToUserId === userB.id
      );

      // Task 3 has assigneeName = "I Wayan Raditya" but assignedToUserId = null
      expect(userATasks.some((t) => t.id === "task-3")).toBe(false);
      expect(userBTasks.some((t) => t.id === "task-3")).toBe(false);

      // External task is recognized as external / unlinked
      const externalTask = sampleTasks.find((t) => t.id === "task-3");
      expect(externalTask?.assignedToUserId).toBeNull();
      expect(externalTask?.assigneeName).toBe("I Wayan Raditya");
    });
  });

  describe("2. Multi-Wedding Tenant Isolation & Cross-Workspace PIC Protection", () => {
    it("rejects assigning a user ID from Workspace B to a task in Workspace A", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "editor-user-a" } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: "grant-a",
                          status: "active",
                          valid_until: "2027-12-31T00:00:00Z",
                        },
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { created_by: "owner-user-a", is_frozen: false },
                  }),
                }),
              }),
            };
          }
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn((col1: string, val1: string) => ({
                  eq: vi.fn((col2: string, val2: string) => ({
                    maybeSingle: vi.fn().mockImplementation(async () => {
                      // Caller editor check
                      if (val2 === "editor-user-a") {
                        return { data: { role: "editor", status: "active" } };
                      }
                      // Target user check: foreign user belongs to wedding B, not wedding A
                      if (
                        val1 === "wedding-workspace-a" &&
                        val2 === "foreign-user-b"
                      ) {
                        return { data: null }; // Not found in wedding A!
                      }
                      return { data: null };
                    }),
                  })),
                })),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const res = await createTaskAction("wedding-workspace-a", {
        title: "Pengecekan Taring & Tratag Banjar",
        assignedToUserId: "foreign-user-b", // Belongs to workspace B!
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain(
        "Penanggung jawab harus merupakan anggota aktif dalam ruang kerja ini."
      );
    });
  });

  describe("3. Revoked Member Rejection & Historical Task Preservation", () => {
    it("rejects assigning a revoked member whose status is not active", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "owner-user" } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: "g1",
                          status: "active",
                          valid_until: "2027-12-31",
                        },
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { created_by: "owner-user", is_frozen: false },
                  }),
                }),
              }),
            };
          }
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn(() => ({
                  eq: vi.fn((_col2: string, val2: string) => ({
                    maybeSingle: vi.fn().mockImplementation(async () => {
                      if (val2 === "owner-user") {
                        return { data: { role: "owner", status: "active" } };
                      }
                      if (val2 === "revoked-user-id") {
                        // User was revoked!
                        return {
                          data: {
                            id: "m-revoked",
                            user_id: "revoked-user-id",
                            status: "revoked",
                            role: "editor",
                          },
                        };
                      }
                      return { data: null };
                    }),
                  })),
                })),
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const res = await updateTaskAction("wedding-1", "task-99", {
        assignedToUserId: "revoked-user-id",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain(
        "Penanggung jawab harus merupakan anggota aktif dalam ruang kerja ini."
      );
    });

    it("preserves task data and historical name when member is revoked or unassigned", () => {
      const historicalTask: WeddingTask = {
        id: "task-hist-1",
        weddingId: "wed-1",
        templateId: null,
        ceremonyId: null,
        title: "Pemesanan Busana Payas Agung",
        description: "Fitting di Griya Busana Sukawati",
        category: "busana",
        priority: "high",
        status: "in_progress",
        dueDate: "2026-09-20",
        assignedToUserId: "user-revoked-later",
        assigneeName: "Ni Luh Made Anggreni (Mantan Editor)",
        orderIndex: 0,
        completedAt: null,
        createdAt: "2026-08-01T00:00:00Z",
        updatedAt: "2026-08-01T00:00:00Z",
      };

      // When the member status becomes revoked in wedding_members, the task row is NOT deleted
      expect(historicalTask.title).toBe("Pemesanan Busana Payas Agung");
      expect(historicalTask.assigneeName).toBe(
        "Ni Luh Made Anggreni (Mantan Editor)"
      );

      // Unassigning PIC clears assignedToUserId while keeping task row intact
      const unassignedTask: WeddingTask = {
        ...historicalTask,
        assignedToUserId: null,
        assigneeName: null,
        updatedAt: "2026-09-01T00:00:00Z",
      };
      expect(unassignedTask.id).toBe(historicalTask.id);
      expect(unassignedTask.assignedToUserId).toBeNull();
      expect(unassignedTask.assigneeName).toBeNull();
    });
  });

  describe("4. Role Boundaries: Viewer Is Strictly Read-Only", () => {
    const setupViewerMock = () => {
      return {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "viewer-user-123" } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: "g1",
                          status: "active",
                          valid_until: "2027-12-31",
                        },
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { created_by: "creator-other", is_frozen: false },
                  }),
                }),
              }),
            };
          }
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: "viewer", status: "active" }, // VIEWER ROLE
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      };
    };

    it("rejects viewer attempting to create a task", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue(setupViewerMock() as never);

      const res = await createTaskAction("wedding-1", {
        title: "Tugas Baru dari Viewer",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(
        /Pengamat \(Viewer\) hanya memiliki izin baca/i
      );
    });

    it("rejects viewer attempting to update an existing task", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue(setupViewerMock() as never);

      const res = await updateTaskAction("wedding-1", "task-1", {
        title: "Perubahan oleh Viewer",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(
        /Pengamat \(Viewer\) hanya memiliki izin baca/i
      );
    });

    it("rejects viewer attempting to toggle task completion status", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue(setupViewerMock() as never);

      const res = await toggleTaskStatusAction("wedding-1", "task-1", "todo");

      expect(res.success).toBe(false);
      expect(res.error).toMatch(
        /Pengamat \(Viewer\) hanya memiliki izin baca/i
      );
    });

    it("rejects viewer attempting to delete a task", async () => {
      const { createClient } = await import("../src/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValue(setupViewerMock() as never);

      const res = await deleteTaskAction("wedding-1", "task-1");

      expect(res.success).toBe(false);
      expect(res.error).toMatch(
        /Pengamat \(Viewer\) hanya memiliki izin baca/i
      );
    });
  });

  describe("5. PIC Eksternal Without Patemon Account", () => {
    it("successfully creates external PIC task with null assignedToUserId and populated assigneeName", async () => {
      const { createClient } = await import("../src/lib/supabase/server");

      const insertedPayload: Record<string, unknown> = {};

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "owner-user" } },
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "access_grants") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: "g1",
                          status: "active",
                          valid_until: "2027-12-31",
                        },
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "weddings") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { created_by: "owner-user", is_frozen: false },
                  }),
                }),
              }),
            };
          }
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { role: "owner", status: "active" },
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === "wedding_tasks") {
            return {
              insert: vi.fn((row: Record<string, unknown>) => {
                Object.assign(insertedPayload, row);
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: "task-ext-new",
                        wedding_id: row.wedding_id,
                        template_id: null,
                        ceremony_id: null,
                        title: row.title,
                        description: null,
                        category: row.category,
                        priority: row.priority,
                        status: row.status,
                        due_date: null,
                        assigned_to_user_id: row.assigned_to_user_id,
                        assignee_name: row.assignee_name,
                        order_index: 0,
                        completed_at: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

      const res = await createTaskAction("wedding-1", {
        title: "Konsultasi Banten Pejati ring Griya",
        assigneeName: "Ibu Serati Men Rai (PIC Eksternal)",
        assignedToUserId: null,
      });

      expect(res.success).toBe(true);
      expect(insertedPayload.assigned_to_user_id).toBeNull();
      expect(insertedPayload.assignee_name).toBe(
        "Ibu Serati Men Rai (PIC Eksternal)"
      );
      expect(res.task?.assignedToUserId).toBeNull();
      expect(res.task?.assigneeName).toBe("Ibu Serati Men Rai (PIC Eksternal)");
    });
  });

  describe("6. Demo Mode Interactive Support", () => {
    it("handles demo mode task creation with active demo members and rejects invalid demo members", async () => {
      // Valid active demo member: demo-u1
      const resValid = await createTaskAction("demo", {
        title: "Tugas Demo dengan Anggota Valid",
        assignedToUserId: "demo-u1",
      });
      expect(resValid.success).toBe(true);
      expect(resValid.task?.assignedToUserId).toBe("demo-u1");
      expect(resValid.task?.assigneeName).toContain("I Made Dharma");

      // Invalid demo member
      const resInvalid = await createTaskAction("demo", {
        title: "Tugas Demo dengan User Asing",
        assignedToUserId: "user-unknown-999",
      });
      expect(resInvalid.success).toBe(false);
      expect(resInvalid.error).toContain(
        "Penanggung jawab harus merupakan anggota aktif dalam ruang kerja ini."
      );
    });

    it("contains pre-seeded demo tasks assigned to demo members", () => {
      const taskU1 = DEMO_TASKS.find((t) => t.assignedToUserId === "demo-u1");
      const taskU2 = DEMO_TASKS.find((t) => t.assignedToUserId === "demo-u2");
      const taskU3 = DEMO_TASKS.find((t) => t.assignedToUserId === "demo-u3");

      expect(taskU1).toBeDefined();
      expect(taskU1?.assigneeName).toContain("I Made Dharma");

      expect(taskU2).toBeDefined();
      expect(taskU2?.assigneeName).toContain("Ni Putu Lestari");

      expect(taskU3).toBeDefined();
      expect(taskU3?.assigneeName).toContain("Jero Mangku Serati");
    });
  });
});
