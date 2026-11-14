"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import type { Database } from "@/types/database";
import {
  calculateRundownStats,
  DEMO_RUNDOWN_EVENTS,
  formatTimeDisplay,
  STARTER_RUNDOWN_TEMPLATES,
} from "./seeds";
import type {
  CreateRundownEventInput,
  RundownEvent,
  RundownStats,
  UpdateRundownEventInput,
} from "./types";

type RundownInsert = Database["public"]["Tables"]["rundown_events"]["Insert"];
type RundownUpdate = Database["public"]["Tables"]["rundown_events"]["Update"];

/**
 * Fetch all rundown agenda segments for a wedding workspace.
 */
export async function getWeddingRundown(
  weddingId: string
): Promise<{ events: RundownEvent[]; stats: RundownStats }> {
  if (weddingId === "demo") {
    return {
      events: DEMO_RUNDOWN_EVENTS,
      stats: calculateRundownStats(DEMO_RUNDOWN_EVENTS),
    };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch rundown events
    const { data: eventsData, error: eventsError } = await supabase
      .from("rundown_events")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (eventsError || !eventsData) {
      if (eventsError) {
        captureError(eventsError, { action: "getWeddingRundown", weddingId });
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
      .eq("wedding_id", weddingId)
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
      orderIndex: e.order_index,
      notes: e.notes,
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
  if (!input.segmentTitle?.trim()) {
    return {
      success: false,
      error: "Nama kegiatan / susunan acara wajib diisi.",
    };
  }

  const startTime = formatTimeDisplay(input.startTime || "08:00");
  const endTime = formatTimeDisplay(input.endTime || "09:00");

  if (weddingId === "demo") {
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
      orderIndex: input.orderIndex || 0,
      notes: input.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, event: newEvent };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Anda harus login untuk menyusun rundown.",
      };
    }

    const insertPayload: RundownInsert = {
      wedding_id: weddingId,
      ceremony_id: input.ceremonyId || null,
      segment_title: input.segmentTitle.trim(),
      scheduled_date: input.scheduledDate || null,
      start_time: startTime,
      end_time: endTime,
      location: input.location?.trim() || null,
      person_in_charge: input.personInCharge?.trim() || null,
      order_index: input.orderIndex || 0,
      notes: input.notes?.trim() || null,
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
      orderIndex: data.order_index,
      notes: data.notes,
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
 * Update an existing rundown event segment.
 */
export async function updateRundownEventAction(
  weddingId: string,
  eventId: string,
  input: UpdateRundownEventInput
): Promise<{ success: boolean; error?: string }> {
  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const updatePayload: RundownUpdate = {};

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
    if (input.orderIndex !== undefined)
      updatePayload.order_index = input.orderIndex;
    if (input.notes !== undefined)
      updatePayload.notes = input.notes?.trim() || null;

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
 * Delete a rundown event segment.
 */
export async function deleteRundownEventAction(
  weddingId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
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
