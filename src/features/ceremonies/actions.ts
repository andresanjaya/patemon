"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import type { WeddingCeremony } from "./types";

export interface CeremonyPlanItemInput {
  id?: string;
  templateId?: string | null;
  title: string;
  phase: string;
  orderIndex: number;
  personInCharge?: string | null;
  scheduledDate?: string | null;
  location?: string | null;
  customNotes?: string | null;
  status?: "draft" | "confirmed" | "completed" | "skipped";
}

export interface SavePlanResult {
  success: boolean;
  message?: string;
  count?: number;
}

/**
 * Fetch all ceremonies planned for a specific wedding workspace.
 */
export async function getWeddingCeremonies(
  weddingId: string
): Promise<WeddingCeremony[]> {
  if (weddingId === "demo") {
    // Return sample ceremonies for demo preview mode
    return [
      {
        id: "demo-ceremony-1",
        weddingId: "demo",
        templateId: "PR-001",
        title: "Memadik / Ngidih (Peminangan Resmi)",
        phase: "Persiapan",
        scheduledDate: "2027-07-10",
        location: "Rumah Pradana (Sanur)",
        personInCharge: "Keluarga Purusa & Kelihan Banjar",
        orderIndex: 1,
        status: "confirmed",
        customNotes:
          "Peminangan adat resmi dihadiri prajuru banjar kedua pihak.",
      },
      {
        id: "demo-ceremony-2",
        weddingId: "demo",
        templateId: "PR-002",
        title: "Mebyakala / Pabyakalaan",
        phase: "Puncak Acara",
        scheduledDate: "2027-08-20",
        location: "Pekarangan Rumah Purusa (Denpasar)",
        personInCharge: "Jero Mangku Griya",
        orderIndex: 2,
        status: "draft",
        customNotes: "Penyucian rohani kedua mempelai dari noda bhuta kala.",
      },
      {
        id: "demo-ceremony-3",
        weddingId: "demo",
        templateId: "PR-003",
        title: "Madengen-dengen / Metegen-tegenan",
        phase: "Puncak Acara",
        scheduledDate: "2027-08-20",
        location: "Halaman Sanggah Kamulan",
        personInCharge: "Serati Banten & Saksi Adat",
        orderIndex: 3,
        status: "draft",
        customNotes: "Simbol tegen-tegenan purusa dan suun-suunan pradana.",
      },
      {
        id: "demo-ceremony-4",
        weddingId: "demo",
        templateId: "PR-004",
        title: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
        phase: "Puncak Acara",
        scheduledDate: "2027-08-20",
        location: "Merajan Gede Keluarga",
        personInCharge: "Ida Pedanda Gede",
        orderIndex: 4,
        status: "draft",
        customNotes: "Penyatuan di hadapan Hyang Widhi Wasa dan leluhur.",
      },
      {
        id: "demo-ceremony-5",
        weddingId: "demo",
        templateId: "PR-005",
        title: "Mejaya-jaya",
        phase: "Puncak Acara",
        scheduledDate: "2027-08-20",
        location: "Merajan Gede Keluarga",
        personInCharge: "Ida Pedanda Gede",
        orderIndex: 5,
        status: "draft",
        customNotes: "Pemberkatan rohani pamungkas pawiwahan.",
      },
    ];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wedding_ceremonies")
      .select("*")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      weddingId: item.wedding_id,
      templateId: item.template_id,
      title: item.title,
      customNotes: item.custom_notes,
      scheduledDate: item.scheduled_date,
      location: item.location,
      personInCharge: item.person_in_charge,
      orderIndex: item.order_index,
      status: (item.status as WeddingCeremony["status"]) || "draft",
    }));
  } catch (err) {
    captureError(err, { action: "getWeddingCeremonies", weddingId });
    return [];
  }
}

/**
 * Server action to save, update, or reorder the wedding ceremony plan.
 */
export async function saveCeremonyPlanAction(
  weddingId: string,
  items: CeremonyPlanItemInput[]
): Promise<SavePlanResult> {
  if (weddingId === "demo") {
    return {
      success: false,
      message: "Workspace demo bersifat pratinjau (read-only).",
    };
  }

  if (!items || items.length === 0) {
    return {
      success: false,
      message: "Rencana minimal harus memiliki 1 prosesi upacara.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Sesi login tidak ditemukan." };
    }

    // 1. Mark existing ceremonies as deleted or replace them
    await supabase
      .from("wedding_ceremonies")
      .delete()
      .eq("wedding_id", weddingId);

    // 2. Insert new sequential ceremony plan
    const insertPayload = items.map((item, index) => ({
      wedding_id: weddingId,
      template_id: item.templateId || null,
      title: item.title.trim(),
      phase: item.phase || "Puncak Acara",
      order_index: index + 1,
      person_in_charge: item.personInCharge?.trim() || null,
      scheduled_date: item.scheduledDate || null,
      location: item.location?.trim() || null,
      custom_notes: item.customNotes?.trim() || null,
      status: item.status || "draft",
    }));

    const { error: insertError } = await supabase
      .from("wedding_ceremonies")
      .insert(insertPayload);

    if (insertError) {
      return {
        success: false,
        message: insertError.message || "Gagal menyimpan susunan upacara.",
      };
    }

    // 3. Log activity
    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "ceremonies.plan_applied",
      entity_type: "wedding_ceremonies",
      entity_id: weddingId,
      details: {
        total_ceremonies: items.length,
        ceremony_titles: items.map((i) => i.title),
      },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/onboarding`);

    return {
      success: true,
      message: "Rencana upacara adat berhasil disimpan.",
      count: items.length,
    };
  } catch (err) {
    captureError(err, { action: "saveCeremonyPlanAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menyimpan rencana upacara.",
    };
  }
}

/**
 * Server action to update individual ceremony status (draft -> confirmed -> completed).
 */
export async function updateCeremonyStatusAction(
  ceremonyId: string,
  weddingId: string,
  newStatus: "draft" | "confirmed" | "completed" | "skipped"
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return { success: true, message: "Status diperbarui dalam mode demo." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("wedding_ceremonies")
      .update({ status: newStatus })
      .eq("id", ceremonyId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "updateCeremonyStatusAction", ceremonyId });
    return { success: false, message: "Gagal memperbarui status prosesi." };
  }
}
