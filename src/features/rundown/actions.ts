"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { checkFeatureAccess, getWorkspaceEntitlement } from "@/features/payments/entitlements";
import {
  normalizeWorkspaceId,
  isValidWorkspaceId,
} from "@/features/workspaces/validation";
import { getPreviewRundown } from "@/features/preview/preview-data";
import type { Database } from "@/types/database";
import {
  calculateDelayMinutes,
  calculateRundownStats,
  DEMO_RUNDOWN_EVENTS,
  formatTimeDisplay,
  getCurrentTimeWita,
  STARTER_RUNDOWN_TEMPLATES,
} from "./seeds";
import { recordActivityLogAction } from "@/features/activity-logs/actions";
import type {
  CreateRundownEventInput,
  RundownEvent,
  RundownStats,
  UpdateRundownEventInput,
  UpdateRundownStatusInput,
} from "./types";

type RundownInsert = Database["public"]["Tables"]["rundown_events"]["Insert"];
type RundownUpdate = Database["public"]["Tables"]["rundown_events"]["Update"];

/**
 * Verify user authorization to mutate wedding rundown agenda records (owner or editor).
 */
export async function verifyRundownWritePermission(weddingId: string): Promise<{
  allowed: boolean;
  userId?: string;
  error?: string;
}> {
  if (weddingId === "demo") {
    return { allowed: true, userId: "demo-u1" };
  }

  const entitlement = await checkFeatureAccess(weddingId, "edit");
  if (!entitlement.allowed) {
    return {
      allowed: false,
      error:
        entitlement.reason ||
        "Workspace memerlukan paket aktif untuk mengelola susunan rundown.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      error: "Autentikasi diperlukan untuk mengubah susunan rundown.",
    };
  }

  const { data: member } = await supabase
    .from("wedding_members")
    .select("role, status")
    .eq("wedding_id", weddingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || member.status !== "active") {
    return {
      allowed: false,
      error:
        "Akses ditolak: Anda bukan anggota aktif pada ruang kerja pawiwahan ini.",
    };
  }

  if (member.role !== "owner" && member.role !== "editor") {
    return {
      allowed: false,
      error: "Akses ditolak: Peran Anda hanya memiliki hak baca (Viewer).",
    };
  }

  return { allowed: true, userId: user.id };
}

/**
 * Fetch all rundown agenda segments for a wedding workspace.
 */
export async function getWeddingRundown(
  weddingId: string
): Promise<{ events: RundownEvent[]; stats: RundownStats }> {
  const cleanId = normalizeWorkspaceId(weddingId);
  if (!isValidWorkspaceId(cleanId)) {
    return {
      events: [],
      stats: calculateRundownStats([]),
    };
  }

  if (cleanId === "demo") {
    return getPreviewRundown("demo");
  }

  try {
    const supabase = await createClient();

    // 1. Fetch rundown events
    const { data: eventsData, error: eventsError } = await supabase
      .from("rundown_events")
      .select("*")
      .eq("wedding_id", cleanId)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (eventsError || !eventsData || eventsData.length === 0) {
      if (eventsError) {
        captureError(eventsError, { action: "getWeddingRundown", weddingId: cleanId });
      }
      const entitlement = await getWorkspaceEntitlement(cleanId, supabase);
      if (!entitlement.isPaid) {
        return getPreviewRundown(cleanId);
      }
      return {
        events: [],
        stats: calculateRundownStats([]),
      };
    }

    // 2. Fetch ceremonies to map ceremony titles
    const { data: ceremoniesData } = await supabase
      .from("wedding_ceremonies")
      .select("id, title")
      .eq("wedding_id", cleanId)
      .is("deleted_at", null);

    const ceremonyMap = new Map<string, string>();
    (ceremoniesData || []).forEach((c) => {
      ceremonyMap.set(c.id, c.title);
    });

    const events: RundownEvent[] = eventsData.map((e) => ({
      id: e.id,
      weddingId: e.wedding_id,
      ceremonyId: e.ceremony_id,
      ceremonyTitle: e.ceremony_id
        ? ceremonyMap.get(e.ceremony_id) || null
        : null,
      segmentTitle: e.segment_title,
      scheduledDate: e.scheduled_date,
      startTime: formatTimeDisplay(e.start_time),
      endTime: formatTimeDisplay(e.end_time),
      location: e.location,
      personInCharge: e.person_in_charge,
      picPhone: e.pic_phone,
      orderIndex: e.order_index,
      notes: e.notes,
      status: e.status || "pending",
      actualStartTime: e.actual_start_time
        ? formatTimeDisplay(e.actual_start_time)
        : null,
      actualEndTime: e.actual_end_time
        ? formatTimeDisplay(e.actual_end_time)
        : null,
      actualStartAt: e.actual_start_at,
      actualEndAt: e.actual_end_at,
      delayMinutes: e.delay_minutes ?? 0,
      notesDayOf: e.notes_day_of,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    }));

    return {
      events,
      stats: calculateRundownStats(events),
    };
  } catch (err) {
    captureError(err, { action: "getWeddingRundown", weddingId });
    return {
      events: [],
      stats: calculateRundownStats([]),
    };
  }
}

/**
 * Create a new rundown agenda segment.
 */
export async function createRundownEventAction(
  weddingId: string,
  input: CreateRundownEventInput
): Promise<{ success: boolean; event?: RundownEvent; error?: string }> {
  const permCheck = await verifyRundownWritePermission(weddingId);
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error };
  }

  if (!input.segmentTitle?.trim()) {
    return {
      success: false,
      error: "Nama kegiatan / susunan acara wajib diisi.",
    };
  }

  const startTime = formatTimeDisplay(input.startTime || "08:00");
  const endTime = formatTimeDisplay(input.endTime || "09:00");

  if (weddingId === "demo") {
    const nowIso = new Date().toISOString();
    const newEvent: RundownEvent = {
      id: `demo-rd-${Date.now()}`,
      weddingId: "demo",
      ceremonyId: input.ceremonyId || null,
      segmentTitle: input.segmentTitle.trim(),
      scheduledDate: input.scheduledDate || null,
      startTime,
      endTime,
      location: input.location?.trim() || null,
      personInCharge: input.personInCharge?.trim() || null,
      picPhone: input.picPhone?.trim() || null,
      orderIndex: input.orderIndex || 0,
      notes: input.notes?.trim() || null,
      status: input.status || "pending",
      delayMinutes: 0,
      notesDayOf: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return { success: true, event: newEvent };
  }

  try {
    const supabase = await createClient();

    const insertPayload: RundownInsert = {
      wedding_id: weddingId,
      ceremony_id: input.ceremonyId || null,
      segment_title: input.segmentTitle.trim(),
      scheduled_date: input.scheduledDate || null,
      start_time: startTime,
      end_time: endTime,
      location: input.location?.trim() || null,
      person_in_charge: input.personInCharge?.trim() || null,
      pic_phone: input.picPhone?.trim() || null,
      order_index: input.orderIndex || 0,
      notes: input.notes?.trim() || null,
      status: input.status || "pending",
      delay_minutes: 0,
    };

    const { data, error } = await supabase
      .from("rundown_events")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      captureError(error, {
        action: "createRundownEventAction",
        weddingId,
        input,
      });
      return {
        success: false,
        error: error?.message || "Gagal menyimpan rundown acara.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/rundown`);
    revalidatePath(`/workspace/${weddingId}`);

    await recordActivityLogAction({
      weddingId,
      entityType: "rundown",
      entityId: data.id,
      entityTitle: data.segment_title,
      action: "create",
      summary: `Menambahkan segmen rundown '${data.segment_title}' (${formatTimeDisplay(data.start_time)} - ${formatTimeDisplay(data.end_time)})`,
      details: {
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        personInCharge: data.person_in_charge,
      },
    });

    const resultEvent: RundownEvent = {
      id: data.id,
      weddingId: data.wedding_id,
      ceremonyId: data.ceremony_id,
      segmentTitle: data.segment_title,
      scheduledDate: data.scheduled_date,
      startTime: formatTimeDisplay(data.start_time),
      endTime: formatTimeDisplay(data.end_time),
      location: data.location,
      personInCharge: data.person_in_charge,
      picPhone: data.pic_phone,
      orderIndex: data.order_index,
      notes: data.notes,
      status: data.status || "pending",
      actualStartTime: data.actual_start_time
        ? formatTimeDisplay(data.actual_start_time)
        : null,
      actualEndTime: data.actual_end_time
        ? formatTimeDisplay(data.actual_end_time)
        : null,
      actualStartAt: data.actual_start_at,
      actualEndAt: data.actual_end_at,
      delayMinutes: data.delay_minutes ?? 0,
      notesDayOf: data.notes_day_of,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, event: resultEvent };
  } catch (err) {
    captureError(err, { action: "createRundownEventAction", weddingId });
    return {
      success: false,
      error: "Terjadi kesalahan saat membuat segmen rundown.",
    };
  }
}

/**
 * Update an existing rundown event segment with optimistic concurrency check.
 */
export async function updateRundownEventAction(
  weddingId: string,
  eventId: string,
  input: UpdateRundownEventInput
): Promise<{ success: boolean; conflict?: boolean; error?: string }> {
  const permCheck = await verifyRundownWritePermission(weddingId);
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error };
  }

  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();

    // Check concurrency if expectedUpdatedAt is provided
    if (input.expectedUpdatedAt) {
      const { data: existing } = await supabase
        .from("rundown_events")
        .select("updated_at")
        .eq("id", eventId)
        .eq("wedding_id", weddingId)
        .maybeSingle();

      if (existing && existing.updated_at !== input.expectedUpdatedAt) {
        return {
          success: false,
          conflict: true,
          error:
            "Data susunan acara telah diperbarui oleh panitia lain. Silakan periksa perubahan terbaru.",
        };
      }
    }

    const updatePayload: RundownUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (input.segmentTitle !== undefined)
      updatePayload.segment_title = input.segmentTitle.trim();
    if (input.ceremonyId !== undefined)
      updatePayload.ceremony_id = input.ceremonyId || null;
    if (input.scheduledDate !== undefined)
      updatePayload.scheduled_date = input.scheduledDate || null;
    if (input.startTime !== undefined)
      updatePayload.start_time = formatTimeDisplay(input.startTime);
    if (input.endTime !== undefined)
      updatePayload.end_time = formatTimeDisplay(input.endTime);
    if (input.location !== undefined)
      updatePayload.location = input.location?.trim() || null;
    if (input.personInCharge !== undefined)
      updatePayload.person_in_charge = input.personInCharge?.trim() || null;
    if (input.picPhone !== undefined)
      updatePayload.pic_phone = input.picPhone?.trim() || null;
    if (input.orderIndex !== undefined)
      updatePayload.order_index = input.orderIndex;
    if (input.notes !== undefined)
      updatePayload.notes = input.notes?.trim() || null;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.actualStartTime !== undefined)
      updatePayload.actual_start_time = input.actualStartTime
        ? formatTimeDisplay(input.actualStartTime)
        : null;
    if (input.actualEndTime !== undefined)
      updatePayload.actual_end_time = input.actualEndTime
        ? formatTimeDisplay(input.actualEndTime)
        : null;
    if (input.delayMinutes !== undefined)
      updatePayload.delay_minutes = input.delayMinutes;
    if (input.notesDayOf !== undefined)
      updatePayload.notes_day_of = input.notesDayOf?.trim() || null;

    const { error } = await supabase
      .from("rundown_events")
      .update(updatePayload)
      .eq("id", eventId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, {
        action: "updateRundownEventAction",
        weddingId,
        eventId,
      });
      return { success: false, error: error.message };
    }

    await recordActivityLogAction({
      weddingId,
      entityType: "rundown",
      entityId: eventId,
      entityTitle: input.segmentTitle,
      action: "update",
      summary: input.segmentTitle
        ? `Memperbarui segmen rundown '${input.segmentTitle}'`
        : `Memperbarui segmen rundown`,
      details: {
        startTime: input.startTime,
        endTime: input.endTime,
        location: input.location,
        personInCharge: input.personInCharge,
      },
    });

    revalidatePath(`/workspace/${weddingId}/rundown`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, {
      action: "updateRundownEventAction",
      weddingId,
      eventId,
    });
    return { success: false, error: "Gagal memperbarui segmen rundown." };
  }
}

/**
 * Update rundown event status and actual execution times for wedding day-of.
 * Includes concurrency check against expectedUpdatedAt to prevent silent overwrites.
 */
export async function updateRundownEventStatusAction(
  weddingId: string,
  eventId: string,
  input: UpdateRundownStatusInput
): Promise<{
  success: boolean;
  conflict?: boolean;
  updatedEvent?: RundownEvent;
  error?: string;
}> {
  const permCheck = await verifyRundownWritePermission(weddingId);
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error };
  }

  if (weddingId === "demo") {
    const matched = DEMO_RUNDOWN_EVENTS.find((e) => e.id === eventId);
    if (!matched) {
      return { success: false, error: "Segmen acara tidak ditemukan." };
    }
    const updated: RundownEvent = {
      ...matched,
      status: input.status,
      actualStartTime:
        input.actualStartTime !== undefined
          ? input.actualStartTime
            ? formatTimeDisplay(input.actualStartTime)
            : null
          : matched.actualStartTime,
      actualEndTime:
        input.actualEndTime !== undefined
          ? input.actualEndTime
            ? formatTimeDisplay(input.actualEndTime)
            : null
          : matched.actualEndTime,
      delayMinutes:
        input.delayMinutes !== undefined
          ? input.delayMinutes
          : input.actualStartTime
            ? calculateDelayMinutes(matched.startTime, input.actualStartTime)
            : matched.delayMinutes,
      notesDayOf:
        input.notesDayOf !== undefined
          ? input.notesDayOf?.trim() || null
          : matched.notesDayOf,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, updatedEvent: updated };
  }

  try {
    const supabase = await createClient();

    // Fetch current state for concurrency check and scheduled start time
    const { data: current, error: fetchErr } = await supabase
      .from("rundown_events")
      .select("*")
      .eq("id", eventId)
      .eq("wedding_id", weddingId)
      .single();

    if (fetchErr || !current) {
      return {
        success: false,
        error: "Segmen acara tidak ditemukan atau telah dihapus.",
      };
    }

    if (
      input.expectedUpdatedAt &&
      current.updated_at !== input.expectedUpdatedAt
    ) {
      return {
        success: false,
        conflict: true,
        error:
          "Data susunan acara telah diperbarui oleh panitia lain. Silakan periksa status terbaru.",
      };
    }

    const nowIso = new Date().toISOString();
    const updatePayload: RundownUpdate = {
      status: input.status,
      updated_at: nowIso,
    };

    // Handle actual start time & delay calculation
    if (input.actualStartTime !== undefined) {
      const formattedActualStart = input.actualStartTime
        ? formatTimeDisplay(input.actualStartTime)
        : null;
      updatePayload.actual_start_time = formattedActualStart;
      if (formattedActualStart) {
        updatePayload.actual_start_at = nowIso;
        if (input.delayMinutes !== undefined) {
          updatePayload.delay_minutes = input.delayMinutes;
        } else {
          updatePayload.delay_minutes = calculateDelayMinutes(
            current.start_time,
            formattedActualStart
          );
        }
      }
    } else if (input.status === "in_progress" && !current.actual_start_time) {
      // Auto-stamp start time with WITA current time if transitioning to in_progress
      const currentWita = getCurrentTimeWita();
      updatePayload.actual_start_time = currentWita;
      updatePayload.actual_start_at = nowIso;
      updatePayload.delay_minutes = calculateDelayMinutes(
        current.start_time,
        currentWita
      );
    }

    // Handle actual end time
    if (input.actualEndTime !== undefined) {
      updatePayload.actual_end_time = input.actualEndTime
        ? formatTimeDisplay(input.actualEndTime)
        : null;
      if (input.actualEndTime) {
        updatePayload.actual_end_at = nowIso;
      }
    } else if (input.status === "completed" && !current.actual_end_time) {
      // Auto-stamp end time with WITA current time if transitioning to completed
      const currentWita = getCurrentTimeWita();
      updatePayload.actual_end_time = currentWita;
      updatePayload.actual_end_at = nowIso;
    }

    if (input.delayMinutes !== undefined) {
      updatePayload.delay_minutes = input.delayMinutes;
    }

    if (input.notesDayOf !== undefined) {
      updatePayload.notes_day_of = input.notesDayOf?.trim() || null;
    }

    const { data: updated, error: updateErr } = await supabase
      .from("rundown_events")
      .update(updatePayload)
      .eq("id", eventId)
      .eq("wedding_id", weddingId)
      .select()
      .single();

    if (updateErr || !updated) {
      captureError(updateErr, {
        action: "updateRundownEventStatusAction",
        weddingId,
        eventId,
      });
      return {
        success: false,
        error: updateErr?.message || "Gagal memperbarui status susunan acara.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/rundown`);
    revalidatePath(`/workspace/${weddingId}`);

    await recordActivityLogAction({
      weddingId,
      entityType: "rundown",
      entityId: updated.id,
      entityTitle: updated.segment_title,
      action: "status_change",
      summary: `Mengubah status susunan acara '${updated.segment_title}' menjadi '${updated.status}'`,
      details: {
        status: updated.status,
        delayMinutes: updated.delay_minutes,
        actualStartTime: updated.actual_start_time,
        actualEndTime: updated.actual_end_time,
      },
    });

    const resultEvent: RundownEvent = {
      id: updated.id,
      weddingId: updated.wedding_id,
      ceremonyId: updated.ceremony_id,
      segmentTitle: updated.segment_title,
      scheduledDate: updated.scheduled_date,
      startTime: formatTimeDisplay(updated.start_time),
      endTime: formatTimeDisplay(updated.end_time),
      location: updated.location,
      personInCharge: updated.person_in_charge,
      picPhone: updated.pic_phone,
      orderIndex: updated.order_index,
      notes: updated.notes,
      status: updated.status,
      actualStartTime: updated.actual_start_time
        ? formatTimeDisplay(updated.actual_start_time)
        : null,
      actualEndTime: updated.actual_end_time
        ? formatTimeDisplay(updated.actual_end_time)
        : null,
      actualStartAt: updated.actual_start_at,
      actualEndAt: updated.actual_end_at,
      delayMinutes: updated.delay_minutes ?? 0,
      notesDayOf: updated.notes_day_of,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };

    return { success: true, updatedEvent: resultEvent };
  } catch (err) {
    captureError(err, {
      action: "updateRundownEventStatusAction",
      weddingId,
      eventId,
    });
    return {
      success: false,
      error: "Terjadi kesalahan saat memperbarui status rundown.",
    };
  }
}

/**
 * Delete a rundown event segment.
 */
export async function deleteRundownEventAction(
  weddingId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const permCheck = await verifyRundownWritePermission(weddingId);
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error };
  }

  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("rundown_events")
      .delete()
      .eq("id", eventId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, {
        action: "deleteRundownEventAction",
        weddingId,
        eventId,
      });
      return { success: false, error: error.message };
    }

    await recordActivityLogAction({
      weddingId,
      entityType: "rundown",
      entityId: eventId,
      action: "delete",
      summary: `Menghapus kegiatan dari susunan acara`,
    });

    revalidatePath(`/workspace/${weddingId}/rundown`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, {
      action: "deleteRundownEventAction",
      weddingId,
      eventId,
    });
    return { success: false, error: "Gagal menghapus kegiatan rundown." };
  }
}

/**
 * Import canonical Balinese wedding day-of rundown starter template.
 */
export async function importStarterRundownAction(
  weddingId: string,
  scheduledDate?: string | null
): Promise<{ success: boolean; count?: number; error?: string }> {
  const permCheck = await verifyRundownWritePermission(weddingId);
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error };
  }

  if (weddingId === "demo") {
    return { success: true, count: STARTER_RUNDOWN_TEMPLATES.length };
  }

  try {
    const supabase = await createClient();
    const rows: RundownInsert[] = STARTER_RUNDOWN_TEMPLATES.map((tpl, idx) => ({
      wedding_id: weddingId,
      ceremony_id: null,
      segment_title: tpl.segmentTitle,
      scheduled_date: scheduledDate || null,
      start_time: tpl.startTime,
      end_time: tpl.endTime,
      location: tpl.location,
      person_in_charge: tpl.personInCharge,
      order_index: idx + 1,
      notes: tpl.notes,
      status: "pending",
      delay_minutes: 0,
    }));

    const { error } = await supabase.from("rundown_events").insert(rows);

    if (error) {
      captureError(error, { action: "importStarterRundownAction", weddingId });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/rundown`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true, count: rows.length };
  } catch (err) {
    captureError(err, { action: "importStarterRundownAction", weddingId });
    return {
      success: false,
      error: "Gagal mengimpor susunan rundown standar.",
    };
  }
}
