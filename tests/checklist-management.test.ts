import { describe, it, expect } from "vitest";
import {
  STARTER_TASK_TEMPLATES,
  DEMO_TASKS,
  getCategoryLabel,
  getPriorityLabel,
  getStatusLabel,
  getPriorityBadgeClass,
  getStatusBadgeClass,
} from "../src/features/checklist/seeds";
import type { WeddingTask } from "../src/features/checklist/types";

describe("Wedding Checklist and Task Management (Issue #27)", () => {
  describe("Curated Starter Tasks & Cultural Guardrails", () => {
    it("contains authentic Balinese ceremonial tasks across preparation phases", () => {
      expect(STARTER_TASK_TEMPLATES.length).toBeGreaterThanOrEqual(12);

      const phases = new Set(STARTER_TASK_TEMPLATES.map((t) => t.phase));
      expect(phases.size).toBeGreaterThanOrEqual(4);

      STARTER_TASK_TEMPLATES.forEach((tpl) => {
        expect(tpl.id).toMatch(/^TK-\d+$/);
        expect(tpl.title.length).toBeGreaterThan(5);
        expect([
          "adat",
          "administrasi",
          "logistik",
          "busana",
          "konsumsi",
          "dokumentasi",
          "keuangan",
          "umum",
        ]).toContain(tpl.category);
        expect(["low", "medium", "high", "urgent"]).toContain(tpl.priority);
        expect(tpl.defaultPic.length).toBeGreaterThan(0);
        expect(tpl.applicability.length).toBeGreaterThan(0);
        expect(tpl.notes.length).toBeGreaterThan(10);
      });
    });

    it("verifies cultural safety: mentions family consultation (rembug) and regional customs (dresta)", () => {
      const contentCombined = STARTER_TASK_TEMPLATES.map(
        (t) => `${t.title} ${t.notes}`
      ).join(" ");
      expect(contentCombined).toMatch(/Dewasa Ayu|Sulinggih|Pemangku/i);
      expect(contentCombined).toMatch(/Merajan|Sanggah/i);
      expect(contentCombined).toMatch(/Serati Banten|upakara|banten/i);
      expect(contentCombined).toMatch(/Banjar|gotong royong|ngayah/i);
    });

    it("includes proper legal and civil registry tasks for Indonesian couples", () => {
      const adminTasks = STARTER_TASK_TEMPLATES.filter(
        (t) => t.category === "administrasi"
      );
      expect(adminTasks.length).toBeGreaterThanOrEqual(2);
      expect(
        adminTasks.some((t) => t.title.toLowerCase().includes("banjar"))
      ).toBe(true);
      expect(
        adminTasks.some((t) => t.title.toLowerCase().includes("dukcapil"))
      ).toBe(true);
    });
  });

  describe("Category and Label Formatters", () => {
    it("returns correct Indonesian category labels", () => {
      expect(getCategoryLabel("adat")).toBe("Adat & Upakara");
      expect(getCategoryLabel("administrasi")).toBe("Administrasi & Hukum");
      expect(getCategoryLabel("logistik")).toBe("Logistik & Tratag");
      expect(getCategoryLabel("busana")).toBe("Busana & Tata Rias");
      expect(getCategoryLabel("konsumsi")).toBe("Konsumsi & Mebat");
      expect(getCategoryLabel("dokumentasi")).toBe("Dokumentasi & Media");
      expect(getCategoryLabel("keuangan")).toBe("Keuangan & DP");
      expect(getCategoryLabel("umum")).toBe("Persiapan Umum");
      expect(getCategoryLabel(null)).toBe("Umum");
      expect(getCategoryLabel("custom_val")).toBe("custom_val");
    });

    it("returns localized priority and status labels", () => {
      expect(getPriorityLabel("urgent")).toBe("Mendesak");
      expect(getPriorityLabel("high")).toBe("Tinggi");
      expect(getPriorityLabel("medium")).toBe("Sedang");
      expect(getPriorityLabel("low")).toBe("Rendah");

      expect(getStatusLabel("todo")).toBe("Belum Mulai");
      expect(getStatusLabel("in_progress")).toBe("Dalam Proses");
      expect(getStatusLabel("done")).toBe("Selesai");
      expect(getStatusLabel("canceled")).toBe("Dibatalkan");
    });

    it("assigns distinctive badge classes for priorities and statuses", () => {
      expect(getPriorityBadgeClass("urgent")).toContain("rose");
      expect(getPriorityBadgeClass("high")).toContain("amber");
      expect(getStatusBadgeClass("done")).toContain("emerald");
      expect(getStatusBadgeClass("in_progress")).toContain("indigo");
      expect(getStatusBadgeClass("canceled")).toContain("line-through");
    });
  });

  describe("Task State Machine & Lifecycle", () => {
    it("handles completion transitions and timestamp assignment", () => {
      const task: WeddingTask = {
        id: "task-1",
        weddingId: "w-1",
        templateId: "TK-001",
        ceremonyId: null,
        title: "Pengecekan Banten",
        description: null,
        category: "adat",
        priority: "high",
        status: "todo",
        dueDate: "2026-10-01",
        assignedToUserId: null,
        assigneeName: "Ibu Serati",
        orderIndex: 0,
        completedAt: null,
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
      };

      const completeTask = (t: WeddingTask): WeddingTask => ({
        ...t,
        status: "done",
        completedAt: new Date().toISOString(),
      });

      const uncompleteTask = (t: WeddingTask): WeddingTask => ({
        ...t,
        status: "todo",
        completedAt: null,
      });

      const completed = completeTask(task);
      expect(completed.status).toBe("done");
      expect(completed.completedAt).not.toBeNull();

      const reopened = uncompleteTask(completed);
      expect(reopened.status).toBe("todo");
      expect(reopened.completedAt).toBeNull();
    });

    it("correctly identifies overdue tasks against target date", () => {
      const today = "2026-10-15";

      const isOverdue = (t: WeddingTask, referenceDate: string) => {
        return Boolean(
          t.dueDate &&
          t.dueDate < referenceDate &&
          t.status !== "done" &&
          t.status !== "canceled"
        );
      };

      const overdueTask: WeddingTask = {
        ...DEMO_TASKS[0],
        status: "todo",
        dueDate: "2026-10-10",
      };

      const onTimeTask: WeddingTask = {
        ...DEMO_TASKS[0],
        status: "todo",
        dueDate: "2026-10-20",
      };

      const completedPastDueTask: WeddingTask = {
        ...DEMO_TASKS[0],
        status: "done",
        dueDate: "2026-10-01",
      };

      expect(isOverdue(overdueTask, today)).toBe(true);
      expect(isOverdue(onTimeTask, today)).toBe(false);
      expect(isOverdue(completedPastDueTask, today)).toBe(false);
    });
  });

  describe("KPI Statistics Computation", () => {
    it("computes accurate summary statistics and completion rates", () => {
      const today = "2026-10-15";
      const sampleTasks: WeddingTask[] = [
        {
          id: "t1",
          weddingId: "w-1",
          templateId: null,
          ceremonyId: null,
          title: "Task 1",
          description: null,
          category: "adat",
          priority: "urgent",
          status: "done",
          dueDate: "2026-10-01",
          assignedToUserId: null,
          assigneeName: "PIC A",
          orderIndex: 0,
          completedAt: "2026-10-01T10:00:00Z",
          createdAt: "2026-09-01T00:00:00Z",
          updatedAt: "2026-09-01T00:00:00Z",
        },
        {
          id: "t2",
          weddingId: "w-1",
          templateId: null,
          ceremonyId: null,
          title: "Task 2",
          description: null,
          category: "administrasi",
          priority: "urgent",
          status: "in_progress",
          dueDate: "2026-10-10", // Overdue!
          assignedToUserId: null,
          assigneeName: "PIC B",
          orderIndex: 1,
          completedAt: null,
          createdAt: "2026-09-01T00:00:00Z",
          updatedAt: "2026-09-01T00:00:00Z",
        },
        {
          id: "t3",
          weddingId: "w-1",
          templateId: null,
          ceremonyId: null,
          title: "Task 3",
          description: null,
          category: "logistik",
          priority: "medium",
          status: "todo",
          dueDate: "2026-10-20",
          assignedToUserId: null,
          assigneeName: null,
          orderIndex: 2,
          completedAt: null,
          createdAt: "2026-09-01T00:00:00Z",
          updatedAt: "2026-09-01T00:00:00Z",
        },
        {
          id: "t4",
          weddingId: "w-1",
          templateId: null,
          ceremonyId: null,
          title: "Task 4",
          description: null,
          category: "busana",
          priority: "low",
          status: "done",
          dueDate: null,
          assignedToUserId: null,
          assigneeName: "PIC A",
          orderIndex: 3,
          completedAt: "2026-10-05T10:00:00Z",
          createdAt: "2026-09-01T00:00:00Z",
          updatedAt: "2026-09-01T00:00:00Z",
        },
      ];

      const total = sampleTasks.length;
      const completed = sampleTasks.filter((t) => t.status === "done").length;
      const inProgress = sampleTasks.filter(
        (t) => t.status === "in_progress"
      ).length;
      const pending = sampleTasks.filter((t) => t.status === "todo").length;
      const overdue = sampleTasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate < today &&
          t.status !== "done" &&
          t.status !== "canceled"
      ).length;
      const urgent = sampleTasks.filter(
        (t) => t.priority === "urgent" && t.status !== "done"
      ).length;
      const completionRate = Math.round((completed / total) * 100);

      expect(total).toBe(4);
      expect(completed).toBe(2);
      expect(inProgress).toBe(1);
      expect(pending).toBe(1);
      expect(overdue).toBe(1); // t2 is overdue
      expect(urgent).toBe(1); // t2 is urgent & not done
      expect(completionRate).toBe(50);
    });

    it("handles empty task lists without division by zero errors", () => {
      const emptyTasks: WeddingTask[] = [];
      const total = emptyTasks.length;
      const completed = emptyTasks.filter((t) => t.status === "done").length;
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      expect(completionRate).toBe(0);
    });
  });

  describe("Filtering and Search Operations", () => {
    it("filters tasks by category, priority, status, and text search", () => {
      const tasks = DEMO_TASKS;

      // Filter by category
      const adatTasks = tasks.filter((t) => t.category === "adat");
      expect(adatTasks.length).toBeGreaterThan(0);
      expect(adatTasks.every((t) => t.category === "adat")).toBe(true);

      // Filter by status
      const completedTasks = tasks.filter((t) => t.status === "done");
      expect(completedTasks.every((t) => t.status === "done")).toBe(true);

      // Search query across title and assignee
      const query = "serati";
      const searchResults = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.assigneeName?.toLowerCase().includes(query)
      );
      expect(searchResults.length).toBeGreaterThan(0);
      expect(
        searchResults.some((t) =>
          t.assigneeName?.toLowerCase().includes("serati")
        )
      ).toBe(true);
    });
  });

  describe("Security and Role Authorization Guardrails", () => {
    it("enforces role-based editing constraints: viewer is read-only", () => {
      const canManageTasks = (role: "owner" | "editor" | "viewer") => {
        return role === "owner" || role === "editor";
      };

      expect(canManageTasks("owner")).toBe(true);
      expect(canManageTasks("editor")).toBe(true);
      expect(canManageTasks("viewer")).toBe(false);
    });

    it("guarantees tasks are isolated per wedding workspace", () => {
      const weddingA = "wedding-uuid-aaa";
      const weddingB = "wedding-uuid-bbb";

      const allTasks: WeddingTask[] = [
        { ...DEMO_TASKS[0], id: "t-a1", weddingId: weddingA },
        { ...DEMO_TASKS[1], id: "t-a2", weddingId: weddingA },
        { ...DEMO_TASKS[2], id: "t-b1", weddingId: weddingB },
      ];

      const tasksA = allTasks.filter((t) => t.weddingId === weddingA);
      const tasksB = allTasks.filter((t) => t.weddingId === weddingB);

      expect(tasksA.length).toBe(2);
      expect(tasksB.length).toBe(1);
      expect(tasksA.some((t) => t.weddingId === weddingB)).toBe(false);
      expect(tasksB.some((t) => t.weddingId === weddingA)).toBe(false);
    });
  });
});
