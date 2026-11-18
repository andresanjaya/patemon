"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import {
  normalizeWorkspaceId,
  isValidWorkspaceId,
} from "@/features/workspaces/validation";
import { getPreviewCeremonies } from "@/features/preview/preview-data";
import { DEFAULT_CEREMONY_TEMPLATES } from "./seeds";
import type {
  CeremonyDetail,
  CeremonyRitualItem,
  RundownEvent,
  WeddingCeremony,
} from "./types";

export interface CeremonyPlanItemInput {
  id?: string;
  templateId?: string | null;
  title: string;
  phase: string;
  orderIndex: number;
  personInCharge?: string | null;
  scheduledDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  customNotes?: string | null;
  status?: "draft" | "confirmed" | "completed" | "skipped";
}

export interface SavePlanResult {
  success: boolean;
  message?: string;
  count?: number;
}

const DEMO_CEREMONIES: WeddingCeremony[] = [
  {
    id: "demo-ceremony-1",
    weddingId: "demo",
    templateId: "PR-001",
    title: "Memadik / Ngidih (Peminangan Resmi)",
    phase: "Persiapan",
    scheduledDate: "2027-07-10",
    startTime: "09:00",
    endTime: "12:00",
    location: "Rumah Pradana (Sanur)",
    personInCharge: "Keluarga Purusa & Kelihan Banjar",
    orderIndex: 1,
    status: "confirmed",
    customNotes: "Peminangan adat resmi dihadiri prajuru banjar kedua pihak.",
  },
  {
    id: "demo-ceremony-2",
    weddingId: "demo",
    templateId: "PR-002",
    title: "Mebyakala / Pabyakalaan",
    phase: "Puncak Acara",
    scheduledDate: "2027-08-20",
    startTime: "08:00",
    endTime: "10:00",
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
    startTime: "10:00",
    endTime: "11:30",
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
    startTime: "11:30",
    endTime: "13:00",
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
    startTime: "13:00",
    endTime: "14:00",
    location: "Merajan Gede Keluarga",
    personInCharge: "Ida Pedanda Gede",
    orderIndex: 5,
    status: "draft",
    customNotes: "Pemberkatan rohani pamungkas pawiwahan.",
  },
];

/**
 * Fetch all ceremonies planned for a specific wedding workspace.
 */
export async function getWeddingCeremonies(
  weddingId: string
): Promise<WeddingCeremony[]> {
  const cleanId = normalizeWorkspaceId(weddingId);
  if (!isValidWorkspaceId(cleanId)) return [];

  if (cleanId === "demo") {
    return getPreviewCeremonies(cleanId);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("wedding_ceremonies")
      .select("*")
      .eq("wedding_id", cleanId)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });

    if (error || !data || data.length === 0) {
      // In preview / unpaid mode, show consistent sample ceremony data (Issue #113)
      const entitlement = await getWorkspaceEntitlement(cleanId, supabase);
      if (!entitlement.isPaid) {
        return getPreviewCeremonies(cleanId);
      }
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      weddingId: item.wedding_id,
      templateId: item.template_id,
      title: item.title,
      phase: item.phase,
      description: item.description,
      customNotes: item.custom_notes,
      scheduledDate: item.scheduled_date,
      startTime: item.start_time,
      endTime: item.end_time,
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
 * Fetch detailed ceremony data including template metadata, rundown events, and linked ritual items.
 */
export async function getCeremonyById(
  weddingId: string,
  ceremonyId: string
): Promise<CeremonyDetail | null> {
  const isPreview = weddingId === "demo" || ceremonyId.includes("preview");

  if (isPreview) {
    const previewList = getPreviewCeremonies(weddingId);
    const ceremony =
      previewList.find((c) => c.id === ceremonyId) ||
      DEMO_CEREMONIES.find((c) => c.id === ceremonyId) || {
        id: ceremonyId,
        weddingId,
        templateId: "PR-002",
        title: "Mebyakala / Pabyakalaan",
        phase: "Puncak Acara",
        scheduledDate: "2027-08-20",
        startTime: "08:00",
        endTime: "10:00",
        location: "Pekarangan Rumah Purusa (Denpasar)",
        personInCharge: "Jero Mangku Griya",
        orderIndex: 2,
        status: "confirmed" as const,
        customNotes: "Penyucian rohani kedua mempelai dari noda bhuta kala.",
      };

    const template =
      DEFAULT_CEREMONY_TEMPLATES.find((t) => t.id === ceremony.templateId) ||
      DEFAULT_CEREMONY_TEMPLATES[1];

    const rundownEvents: RundownEvent[] = [
      {
        id: "demo-rundown-1",
        weddingId: "demo",
        ceremonyId: ceremony.id,
        segmentTitle: "Persiapan Tempat & Banten Byakala",
        scheduledDate: ceremony.scheduledDate,
        startTime: "08:00",
        endTime: "08:30",
        location: "Kaja-Kangin Pekarangan Rumah",
        personInCharge: "Serati Banten & Sekaa Daa-Teruna",
        orderIndex: 1,
        notes:
          "Memastikan kelengkapan segehan, danyah, dan tetabuhan arak-berem.",
      },
      {
        id: "demo-rundown-2",
        weddingId: "demo",
        ceremonyId: ceremony.id,
        segmentTitle: "Prosesi Penyucian & Pabyakalaan Mempelai",
        scheduledDate: ceremony.scheduledDate,
        startTime: "08:30",
        endTime: "09:15",
        location: "Natah Rumah",
        personInCharge: "Jero Mangku Griya",
        orderIndex: 2,
        notes:
          "Mempelai mengenakan busana madya sembahyang keputihan/kuningan.",
      },
      {
        id: "demo-rundown-3",
        weddingId: "demo",
        ceremonyId: ceremony.id,
        segmentTitle: "Natab Prayascita & Ayaban",
        scheduledDate: ceremony.scheduledDate,
        startTime: "09:15",
        endTime: "09:45",
        location: "Depan Bale Dangin",
        personInCharge: "Tetua Purusa & Serati",
        orderIndex: 3,
        notes: "Penyerahan tirtha pembersihan dan doa restu keluarga inti.",
      },
    ];

    const ritualItems: CeremonyRitualItem[] = [
      {
        id: "demo-banten-1",
        weddingId: "demo",
        ceremonyId: ceremony.id,
        name: "Banten Byakala Utama",
        category: "utama",
        quantity: 1,
        unit: "Paket",
        sourcingMethod: "purchased_package",
        status: "ready",
        assigneeName: "Serati Griya Sanur",
        estimatedPrice: 450000,
        actualPrice: 450000,
        notes: "Lengkap dengan sanggah cucuk, ayam brumbun, dan tetabuhan.",
      },
      {
        id: "demo-banten-2",
        weddingId: "demo",
        ceremonyId: ceremony.id,
        name: "Banten Prayascita",
        category: "madya",
        quantity: 1,
        unit: "Paket",
        sourcingMethod: "purchased_package",
        status: "ordered",
        assigneeName: "Serati Griya Sanur",
        estimatedPrice: 350000,
        actualPrice: 350000,
        notes: "Penyucian sarwa prani dan perlengkapan penganten.",
      },
      {
        id: "demo-banten-3",
        weddingId: "demo",
        ceremonyId: ceremony.id,
        name: "Banten Durmanggala",
        category: "sarana_pelengkap",
        quantity: 1,
        unit: "Paket",
        sourcingMethod: "self_made",
        status: "making",
        assigneeName: "Ibu & Tante Mempelai",
        estimatedPrice: 150000,
        actualPrice: 120000,
        notes: "Dibuat bersama keluarga saat mareresik.",
      },
      {
        id: "demo-banten-4",
        weddingId: "demo",
        ceremonyId: ceremony.id,
        name: "Canang Sari & Segehan Cacahan",
        category: "sarana_pelengkap",
        quantity: 25,
        unit: "Tanding",
        sourcingMethod: "family_assigned",
        status: "needed",
        assigneeName: "Keluarga Purusa",
        estimatedPrice: 100000,
        actualPrice: 0,
        notes: "Untuk penjagaan pelinggih dan lebuh pekarangan.",
      },
    ];

    return {
      ...ceremony,
      template,
      rundownEvents,
      ritualItems,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch ceremony
    const { data: ceremony, error: ceremonyError } = await supabase
      .from("wedding_ceremonies")
      .select("*")
      .eq("id", ceremonyId)
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .maybeSingle();

    if (ceremonyError || !ceremony) {
      return null;
    }

    // 2. Fetch template metadata
    let template = null;
    if (ceremony.template_id) {
      const { data: templateData } = await supabase
        .from("ceremony_templates")
        .select("*")
        .eq("id", ceremony.template_id)
        .maybeSingle();

      if (templateData) {
        template = {
          id: templateData.id,
          phase: templateData.phase,
          name: templateData.name,
          aliases: templateData.aliases || [],
          description: templateData.description || "",
          applicability: templateData.applicability,
          defaultPic: templateData.default_pic,
          validationStatus: templateData.validation_status,
          sourceId: templateData.source_id,
          sourceUrl: templateData.source_url,
          orderIndex: templateData.order_index,
          isActive: templateData.is_active,
        };
      } else {
        template =
          DEFAULT_CEREMONY_TEMPLATES.find(
            (t) => t.id === ceremony.template_id
          ) || null;
      }
    }

    // 3. Fetch rundown events
    const { data: rundownData } = await supabase
      .from("rundown_events")
      .select("*")
      .eq("ceremony_id", ceremonyId)
      .eq("wedding_id", weddingId)
      .order("order_index", { ascending: true });

    const rundownEvents: RundownEvent[] = (rundownData || []).map((r) => ({
      id: r.id,
      weddingId: r.wedding_id,
      ceremonyId: r.ceremony_id,
      segmentTitle: r.segment_title,
      scheduledDate: r.scheduled_date,
      startTime: r.start_time,
      endTime: r.end_time,
      location: r.location,
      personInCharge: r.person_in_charge,
      orderIndex: r.order_index,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // 4. Fetch ritual items linked to this ceremony
    const { data: ritualData } = await supabase
      .from("wedding_ritual_items")
      .select("*")
      .eq("ceremony_id", ceremonyId)
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    const ritualItems: CeremonyRitualItem[] = (ritualData || []).map((b) => ({
      id: b.id,
      weddingId: b.wedding_id,
      ceremonyId: b.ceremony_id,
      catalogId: b.catalog_id,
      name: b.name,
      category: b.category,
      quantity: b.quantity,
      unit: b.unit,
      sourcingMethod: b.sourcing_method,
      status: b.status,
      assigneeName: b.assignee_name,
      estimatedPrice: b.estimated_price,
      actualPrice: b.actual_price,
      notes: b.notes,
    }));

    return {
      id: ceremony.id,
      weddingId: ceremony.wedding_id,
      templateId: ceremony.template_id,
      title: ceremony.title,
      phase: ceremony.phase,
      description: ceremony.description,
      customNotes: ceremony.custom_notes,
      scheduledDate: ceremony.scheduled_date,
      startTime: ceremony.start_time,
      endTime: ceremony.end_time,
      location: ceremony.location,
      personInCharge: ceremony.person_in_charge,
      orderIndex: ceremony.order_index,
      status: (ceremony.status as WeddingCeremony["status"]) || "draft",
      template,
      rundownEvents,
      ritualItems,
    };
  } catch (err) {
    captureError(err, { action: "getCeremonyById", weddingId, ceremonyId });
    return null;
  }
}

/**
 * Server action to update ceremony details (schedule, location, PIC, notes, status).
 */
export async function updateCeremonyDetailsAction(
  weddingId: string,
  ceremonyId: string,
  input: {
    title: string;
    phase?: string | null;
    scheduledDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    personInCharge?: string | null;
    customNotes?: string | null;
    status: WeddingCeremony["status"];
  }
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Perubahan detail tersimpan dalam mode demo.",
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

    const { error } = await supabase
      .from("wedding_ceremonies")
      .update({
        title: input.title.trim(),
        phase: input.phase || "Puncak Acara",
        scheduled_date: input.scheduledDate || null,
        start_time: input.startTime || null,
        end_time: input.endTime || null,
        location: input.location?.trim() || null,
        person_in_charge: input.personInCharge?.trim() || null,
        custom_notes: input.customNotes?.trim() || null,
        status: input.status,
      })
      .eq("id", ceremonyId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "ceremonies.updated",
      entity_type: "wedding_ceremonies",
      entity_id: ceremonyId,
      details: { title: input.title, status: input.status },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/ceremonies`);
    revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);

    return { success: true, message: "Detail upacara berhasil disimpan." };
  } catch (err) {
    captureError(err, {
      action: "updateCeremonyDetailsAction",
      weddingId,
      ceremonyId,
    });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat memperbarui detail upacara.",
    };
  }
}

/**
 * Server action to create an individual custom ceremony.
 */
export async function createCustomCeremonyAction(
  weddingId: string,
  input: {
    title: string;
    phase: string;
    scheduledDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    personInCharge?: string | null;
    customNotes?: string | null;
  }
): Promise<{ success: boolean; message?: string; ceremonyId?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Prosesi baru ditambahkan dalam mode demo.",
      ceremonyId: "demo-new-" + Date.now(),
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

    // Determine next order_index
    const { data: lastCeremony } = await supabase
      .from("wedding_ceremonies")
      .select("order_index")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastCeremony?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from("wedding_ceremonies")
      .insert({
        wedding_id: weddingId,
        title: input.title.trim(),
        phase: input.phase,
        scheduled_date: input.scheduledDate || null,
        start_time: input.startTime || null,
        end_time: input.endTime || null,
        location: input.location?.trim() || null,
        person_in_charge: input.personInCharge?.trim() || null,
        custom_notes: input.customNotes?.trim() || null,
        order_index: nextOrder,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || "Gagal membuat upacara baru.",
      };
    }

    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "ceremonies.created",
      entity_type: "wedding_ceremonies",
      entity_id: data.id,
      details: { title: input.title, phase: input.phase },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/ceremonies`);

    return {
      success: true,
      message: "Upacara baru berhasil ditambahkan.",
      ceremonyId: data.id,
    };
  } catch (err) {
    captureError(err, { action: "createCustomCeremonyAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat membuat upacara.",
    };
  }
}

/**
 * Server action to soft-delete a ceremony from the wedding plan.
 */
export async function deleteCeremonyAction(
  weddingId: string,
  ceremonyId: string
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Prosesi dihapus dalam mode demo.",
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

    const { error } = await supabase
      .from("wedding_ceremonies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", ceremonyId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "ceremonies.deleted",
      entity_type: "wedding_ceremonies",
      entity_id: ceremonyId,
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/ceremonies`);

    return { success: true, message: "Prosesi upacara berhasil dihapus." };
  } catch (err) {
    captureError(err, {
      action: "deleteCeremonyAction",
      weddingId,
      ceremonyId,
    });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menghapus upacara.",
    };
  }
}

/**
 * Server action to add a rundown event segment to a specific ceremony.
 */
export async function addRundownEventAction(
  weddingId: string,
  ceremonyId: string,
  input: {
    segmentTitle: string;
    startTime: string;
    endTime: string;
    location?: string | null;
    personInCharge?: string | null;
    notes?: string | null;
    scheduledDate?: string | null;
  }
): Promise<{ success: boolean; message?: string; eventId?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Rundown berhasil ditambahkan dalam mode demo.",
      eventId: "demo-event-" + Date.now(),
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

    // Determine next order_index
    const { data: lastSegment } = await supabase
      .from("rundown_events")
      .select("order_index")
      .eq("wedding_id", weddingId)
      .eq("ceremony_id", ceremonyId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (lastSegment?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from("rundown_events")
      .insert({
        wedding_id: weddingId,
        ceremony_id: ceremonyId,
        segment_title: input.segmentTitle.trim(),
        start_time: input.startTime,
        end_time: input.endTime,
        scheduled_date: input.scheduledDate || null,
        location: input.location?.trim() || null,
        person_in_charge: input.personInCharge?.trim() || null,
        notes: input.notes?.trim() || null,
        order_index: nextOrder,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || "Gagal menambah susunan rundown.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);

    return {
      success: true,
      message: "Segmen rundown berhasil ditambahkan.",
      eventId: data.id,
    };
  } catch (err) {
    captureError(err, {
      action: "addRundownEventAction",
      weddingId,
      ceremonyId,
    });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menyimpan segmen rundown.",
    };
  }
}

/**
 * Server action to delete a rundown event segment.
 */
export async function deleteRundownEventAction(
  weddingId: string,
  ceremonyId: string,
  eventId: string
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Segmen rundown dihapus dalam mode demo.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("rundown_events")
      .delete()
      .eq("id", eventId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);
    return { success: true, message: "Segmen rundown berhasil dihapus." };
  } catch (err) {
    captureError(err, { action: "deleteRundownEventAction", eventId });
    return { success: false, message: "Gagal menghapus segmen rundown." };
  }
}

/**
 * Server action to link / add a ritual item to a ceremony.
 */
export async function addRitualItemToCeremonyAction(
  weddingId: string,
  ceremonyId: string,
  input: {
    name: string;
    category?: string | null;
    quantity: number;
    unit: string;
    sourcingMethod:
      "self_made" | "purchased_package" | "family_assigned" | "vendor_order";
    status?: "needed" | "ordered" | "making" | "ready" | "not_needed";
    assigneeName?: string | null;
    estimatedPrice?: number;
    notes?: string | null;
  }
): Promise<{ success: boolean; message?: string; itemId?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Kebutuhan banten berhasil ditambahkan dalam mode demo.",
      itemId: "demo-banten-" + Date.now(),
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

    const { data, error } = await supabase
      .from("wedding_ritual_items")
      .insert({
        wedding_id: weddingId,
        ceremony_id: ceremonyId,
        name: input.name.trim(),
        category: input.category || "sarana_pelengkap",
        quantity: input.quantity || 1,
        unit: input.unit || "Tanding",
        sourcing_method: input.sourcingMethod || "purchased_package",
        status: input.status || "needed",
        assignee_name: input.assigneeName?.trim() || null,
        estimated_price: input.estimatedPrice || 0,
        actual_price: 0,
        notes: input.notes?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || "Gagal menambahkan banten.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);

    return {
      success: true,
      message: "Banten / sarana berhasil ditambahkan ke prosesi ini.",
      itemId: data.id,
    };
  } catch (err) {
    captureError(err, {
      action: "addRitualItemToCeremonyAction",
      weddingId,
      ceremonyId,
    });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menambahkan banten.",
    };
  }
}

/**
 * Server action to update ritual item status.
 */
export async function updateRitualItemStatusAction(
  weddingId: string,
  ceremonyId: string,
  itemId: string,
  status: "needed" | "ordered" | "making" | "ready" | "not_needed"
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Status banten diperbarui dalam mode demo.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("wedding_ritual_items")
      .update({ status })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);
    return { success: true, message: "Status banten berhasil diperbarui." };
  } catch (err) {
    captureError(err, { action: "updateRitualItemStatusAction", itemId });
    return { success: false, message: "Gagal memperbarui status banten." };
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
      start_time: item.startTime || null,
      end_time: item.endTime || null,
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
    revalidatePath(`/workspace/${weddingId}/ceremonies`);
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
 * Server action to update individual ceremony status (draft -> confirmed -> completed -> skipped).
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
    revalidatePath(`/workspace/${weddingId}/ceremonies`);
    revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "updateCeremonyStatusAction", ceremonyId });
    return { success: false, message: "Gagal memperbarui status prosesi." };
  }
}
