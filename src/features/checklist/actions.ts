"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import type { Database } from "@/types/database";
import { DEMO_TASKS, STARTER_TASK_TEMPLATES } from "./seeds";
import type {
  WeddingTask,
  TaskPriority,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  CeremonyOption,
} from "./types";

/**
 * Fetch all active tasks for a wedding workspace.
 */
export async function getWeddingTasks(
  weddingId: string
): Promise<WeddingTask[]> {
  if (weddingId === "demo") {
    return DEMO_TASKS;
  }

  try {
    const supabase = await createClient();

    // 1. Fetch ceremonies map for ceremony title display
    const { data: ceremonies } = await supabase
      .from("wedding_ceremonies")
      .select("id, title")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null);

    const ceremonyMap = new Map<string, string>();
    (ceremonies || []).forEach((c) => ceremonyMap.set(c.id, c.title));

    // 2. Fetch tasks
    const { data, error } = await supabase
      .from("wedding_tasks")
      .select("*")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("order_index", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error || !data) {
      if (error) {
        captureError(error, { action: "getWeddingTasks", weddingId });
      }
      return [];
    }

    return data.map((t) => ({
      id: t.id,
      weddingId: t.wedding_id,
      templateId: t.template_id,
      ceremonyId: t.ceremony_id,
      ceremonyTitle: t.ceremony_id
        ? ceremonyMap.get(t.ceremony_id) || "Prosesi Terkait"
        : null,
      title: t.title,
      description: t.description,
      category: t.category || "umum",
      priority: (t.priority as TaskPriority) || "medium",
      status: (t.status as TaskStatus) || "todo",
      dueDate: t.due_date,
      assignedToUserId: t.assigned_to_user_id,
      assigneeName: t.assignee_name,
      orderIndex: t.order_index,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  } catch (err) {
    captureError(err, { action: "getWeddingTasks", weddingId });
    return [];
  }
}

/**
 * Fetch wedding ceremonies as options to associate tasks with.
 */
export async function getCeremonyOptions(
  weddingId: string
): Promise<CeremonyOption[]> {
  if (weddingId === "demo") {
    return [
      {
        id: "demo-ceremony-1",
        title: "Memadik / Ngidih (Peminangan)",
        phase: "Persiapan",
        scheduledDate: "2026-09-01",
      },
      {
        id: "demo-ceremony-2",
        title: "Mebyakala / Pabyakalaan",
        phase: "Puncak Acara",
        scheduledDate: "2026-10-24",
      },
      {
        id: "demo-ceremony-3",
        title: "Madengen-dengen / Metegen-tegenan",
        phase: "Puncak Acara",
        scheduledDate: "2026-10-24",
      },
      {
        id: "demo-ceremony-4",
        title: "Mesakapan Ring Sanggah Kamulan",
        phase: "Puncak Acara",
        scheduledDate: "2026-10-24",
      },
    ];
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("wedding_ceremonies")
      .select("id, title, phase, scheduled_date")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });

    return (data || []).map((c) => ({
      id: c.id,
      title: c.title,
      phase: c.phase,
      scheduledDate: c.scheduled_date,
    }));
  } catch (err) {
    captureError(err, { action: "getCeremonyOptions", weddingId });
    return [];
  }
}

/**
 * Create a new task in a wedding workspace.
 */
export async function createTaskAction(
  weddingId: string,
  input: CreateTaskInput
): Promise<{ success: boolean; task?: WeddingTask; error?: string }> {
  if (!input.title?.trim()) {
    return { success: false, error: "Judul tugas wajib diisi." };
  }

  if (weddingId === "demo") {
    const newTask: WeddingTask = {
      id: `demo-task-${Date.now()}`,
      weddingId: "demo",
      templateId: input.templateId || null,
      ceremonyId: input.ceremonyId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category || "umum",
      priority: input.priority || "medium",
      status: input.status || "todo",
      dueDate: input.dueDate || null,
      assignedToUserId: null,
      assigneeName: input.assigneeName?.trim() || null,
      orderIndex: DEMO_TASKS.length,
      completedAt: input.status === "done" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, task: newTask };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk menambah tugas.",
      };
    }

    const completedAt =
      input.status === "done" ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("wedding_tasks")
      .insert({
        wedding_id: weddingId,
        template_id: input.templateId || null,
        ceremony_id: input.ceremonyId || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category || "umum",
        priority: input.priority || "medium",
        status: input.status || "todo",
        due_date: input.dueDate || null,
        assignee_name: input.assigneeName?.trim() || null,
        completed_at: completedAt,
      })
      .select()
      .single();

    if (error || !data) {
      captureError(error, { action: "createTaskAction", weddingId, input });
      return {
        success: false,
        error: error?.message || "Gagal menyimpan tugas baru.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/tasks`);
    revalidatePath(`/workspace/${weddingId}`);
    if (input.ceremonyId) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${input.ceremonyId}`);
    }

    return {
      success: true,
      task: {
        id: data.id,
        weddingId: data.wedding_id,
        templateId: data.template_id,
        ceremonyId: data.ceremony_id,
        title: data.title,
        description: data.description,
        category: data.category || "umum",
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        dueDate: data.due_date,
        assignedToUserId: data.assigned_to_user_id,
        assigneeName: data.assignee_name,
        orderIndex: data.order_index,
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err) {
    captureError(err, { action: "createTaskAction", weddingId, input });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat menyimpan.",
    };
  }
}

/**
 * Update an existing task.
 */
export async function updateTaskAction(
  weddingId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<{ success: boolean; task?: WeddingTask; error?: string }> {
  if (input.title !== undefined && !input.title.trim()) {
    return { success: false, error: "Judul tugas tidak boleh kosong." };
  }

  if (weddingId === "demo") {
    const existing = DEMO_TASKS.find((t) => t.id === taskId);
    if (!existing) {
      return { success: false, error: "Tugas tidak ditemukan." };
    }
    const updated: WeddingTask = {
      ...existing,
      title: input.title !== undefined ? input.title.trim() : existing.title,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : existing.description,
      category:
        input.category !== undefined ? input.category : existing.category,
      priority:
        input.priority !== undefined ? input.priority : existing.priority,
      status: input.status !== undefined ? input.status : existing.status,
      dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
      assigneeName:
        input.assigneeName !== undefined
          ? input.assigneeName?.trim() || null
          : existing.assigneeName,
      ceremonyId:
        input.ceremonyId !== undefined ? input.ceremonyId : existing.ceremonyId,
      completedAt:
        input.status === "done"
          ? existing.completedAt || new Date().toISOString()
          : input.status !== undefined
            ? null
            : existing.completedAt,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, task: updated };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk mengubah tugas.",
      };
    }

    const updates: Database["public"]["Tables"]["wedding_tasks"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updates.title = input.title.trim();
    if (input.description !== undefined)
      updates.description = input.description?.trim() || null;
    if (input.category !== undefined) updates.category = input.category;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.status !== undefined) {
      updates.status = input.status;
      if (input.status === "done") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }
    }
    if (input.dueDate !== undefined) updates.due_date = input.dueDate;
    if (input.assigneeName !== undefined)
      updates.assignee_name = input.assigneeName?.trim() || null;
    if (input.ceremonyId !== undefined) updates.ceremony_id = input.ceremonyId;
    if (input.orderIndex !== undefined) updates.order_index = input.orderIndex;

    const { data, error } = await supabase
      .from("wedding_tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("wedding_id", weddingId)
      .select()
      .single();

    if (error || !data) {
      captureError(error, { action: "updateTaskAction", weddingId, taskId });
      return {
        success: false,
        error: error?.message || "Gagal memperbarui tugas.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/tasks`);
    revalidatePath(`/workspace/${weddingId}`);
    if (data.ceremony_id) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${data.ceremony_id}`);
    }

    return {
      success: true,
      task: {
        id: data.id,
        weddingId: data.wedding_id,
        templateId: data.template_id,
        ceremonyId: data.ceremony_id,
        title: data.title,
        description: data.description,
        category: data.category || "umum",
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        dueDate: data.due_date,
        assignedToUserId: data.assigned_to_user_id,
        assigneeName: data.assignee_name,
        orderIndex: data.order_index,
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err) {
    captureError(err, { action: "updateTaskAction", weddingId, taskId });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat memperbarui.",
    };
  }
}

/**
 * Toggle a task's status between todo/in_progress and done.
 */
export async function toggleTaskStatusAction(
  weddingId: string,
  taskId: string,
  currentStatus: TaskStatus
): Promise<{ success: boolean; newStatus?: TaskStatus; error?: string }> {
  const nextStatus: TaskStatus = currentStatus === "done" ? "todo" : "done";
  const result = await updateTaskAction(weddingId, taskId, {
    status: nextStatus,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, newStatus: nextStatus };
}

/**
 * Delete a task (soft delete with deleted_at).
 */
export async function deleteTaskAction(
  weddingId: string,
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk menghapus tugas.",
      };
    }

    const { error } = await supabase
      .from("wedding_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, { action: "deleteTaskAction", weddingId, taskId });
      return { success: false, error: "Gagal menghapus tugas." };
    }

    revalidatePath(`/workspace/${weddingId}/tasks`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "deleteTaskAction", weddingId, taskId });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat menghapus.",
    };
  }
}

/**
 * Import starter Balinese Hindu wedding task templates into this workspace.
 */
export async function importStarterTasksAction(
  weddingId: string,
  templateIds?: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  const templatesToImport =
    templateIds && templateIds.length > 0
      ? STARTER_TASK_TEMPLATES.filter((t) => templateIds.includes(t.id))
      : STARTER_TASK_TEMPLATES;

  if (templatesToImport.length === 0) {
    return { success: false, error: "Tidak ada template tugas yang dipilih." };
  }

  if (weddingId === "demo") {
    return { success: true, count: templatesToImport.length };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk mengimpor rekomendasi tugas.",
      };
    }

    const rowsToInsert = templatesToImport.map((template, idx) => ({
      wedding_id: weddingId,
      template_id: template.id,
      title: template.title,
      description: template.notes,
      category: template.category,
      priority: template.priority,
      status: "todo" as const,
      assignee_name: template.defaultPic,
      order_index: idx,
    }));

    const { error, data } = await supabase
      .from("wedding_tasks")
      .insert(rowsToInsert)
      .select("id");

    if (error) {
      captureError(error, { action: "importStarterTasksAction", weddingId });
      return {
        success: false,
        error: error.message || "Gagal mengimpor daftar tugas rekomendasi.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/tasks`);
    revalidatePath(`/workspace/${weddingId}`);

    return { success: true, count: data?.length || rowsToInsert.length };
  } catch (err) {
    captureError(err, { action: "importStarterTasksAction", weddingId });
    return { success: false, error: "Terjadi kesalahan saat mengimpor tugas." };
  }
}
