"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { checkFeatureAccess } from "@/features/payments/entitlements";
import { recordActivityLogAction } from "@/features/activity-logs/actions";
import { getRitualCatalog } from "./queries";
import type {
  BantenAcquisitionStatus,
  BantenItem,
  BantenReviewStatus,
  ReviewerType,
  SourcingMethod,
  SubmitBantenReviewInput,
} from "./types";

export interface CreateBantenItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  sourcingMethod: SourcingMethod;
  status?: BantenAcquisitionStatus;
  ceremonyId?: string | null;
  assigneeName?: string | null;
  estimatedPrice?: number;
  actualPrice?: number;
  notes?: string | null;
}

export interface UpdateBantenItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  sourcingMethod: SourcingMethod;
  status: BantenAcquisitionStatus;
  ceremonyId?: string | null;
  assigneeName?: string | null;
  estimatedPrice: number;
  actualPrice: number;
  notes?: string | null;
}

const DEMO_BANTEN_ITEMS: BantenItem[] = [
  {
    id: "demo-banten-1",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-2",
    ceremonyTitle: "Mebyakala / Pabyakalaan",
    catalogId: "BN-PKT-001",
    name: "Paket Banten Mebyakala Lengkap",
    category: "utama",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "purchased_package",
    status: "ready",
    reviewStatus: "approved",
    reviewerName: "Jero Mangku Griya Sanur",
    reviewerType: "external_practitioner",
    recordedByName: "Dicatat oleh I Putu Dharma Yoga",
    reviewedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    reviewNotes:
      "Sesuai dresta Griya Sanur, ayam brumbun dan sanggah cucuk lengkap.",
    sourceReference: "Pedoman Pawiwahan PHDI & Griya Sanur",
    assigneeName: "Serati Griya Sanur",
    estimatedPrice: 450000,
    actualPrice: 450000,
    notes:
      "Lengkap dengan sanggah cucuk, ayam brumbun, dan tetabuhan arak-berem.",
  },
  {
    id: "demo-banten-2",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-2",
    ceremonyTitle: "Mebyakala / Pabyakalaan",
    catalogId: "BN-SAT-002",
    name: "Banten Prayascita Luwih",
    category: "madya",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "purchased_package",
    status: "ordered",
    reviewStatus: "approved",
    reviewerName: "Serati Banten Ibu Nyoman",
    reviewerType: "external_practitioner",
    recordedByName: "Dicatat oleh Ni Made Shanti Dewi",
    reviewedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    reviewNotes:
      "Perlengkapan prayascita disetujui untuk pembersihan penganten.",
    sourceReference: "Dresta Bali Selatan",
    assigneeName: "Serati Griya Sanur",
    estimatedPrice: 350000,
    actualPrice: 350000,
    notes: "Penyucian sarwa prani dan perlengkapan sembahyang penganten.",
  },
  {
    id: "demo-banten-3",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-2",
    ceremonyTitle: "Mebyakala / Pabyakalaan",
    catalogId: "BN-SAT-003",
    name: "Banten Durmanggala",
    category: "sarana_pelengkap",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "self_made",
    status: "making",
    reviewStatus: "needs_review",
    reviewNotes: "Perlu konfirmasi apakah perlu panyapsap tambahan.",
    assigneeName: "Ibu & Tante Mempelai",
    estimatedPrice: 150000,
    actualPrice: 120000,
    notes: "Dibuat bersama keluarga besar saat mareresik.",
  },
  {
    id: "demo-banten-4",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-4",
    ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
    catalogId: "BN-PKT-003",
    name: "Paket Banten Pawiwahan Sanggah Kamulan",
    category: "utama",
    quantity: 1,
    unit: "Paket",
    sourcingMethod: "purchased_package",
    status: "ordered",
    reviewStatus: "needs_revision",
    reviewerName: "Ida Bagus Made (Ketua Panitia)",
    reviewerType: "internal_member",
    recordedByName: "Dicatat oleh Ida Bagus Made",
    reviewedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    reviewNotes:
      "Perlu disesuaikan tumpeng 7 tanding sesuai dresta keluarga griya.",
    assigneeName: "Griya Pedanda Gede",
    estimatedPrice: 1250000,
    actualPrice: 1250000,
    notes: "Penyatuan di hadapan Hyang Guru dan Bhatara Hyang Kamulan.",
  },
  {
    id: "demo-banten-5",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-3",
    ceremonyTitle: "Madengen-dengen / Metegen-tegenan",
    catalogId: "BN-SRN-001",
    name: "Perlengkapan Tegen-tegenan & Suun-suunan",
    category: "sarana_pelengkap",
    quantity: 1,
    unit: "Set",
    sourcingMethod: "family_assigned",
    status: "needed",
    reviewStatus: "needs_review",
    assigneeName: "Keluarga Purusa (Bli Wayan)",
    estimatedPrice: 250000,
    actualPrice: 0,
    notes: "Kukusan, tebu, pala gantung, pala bungkah, dan bakul belanja.",
  },
  {
    id: "demo-banten-6",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-4",
    ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
    catalogId: "BN-SRN-002",
    name: "Kelapa Gading Kembar",
    category: "sarana_pelengkap",
    quantity: 2,
    unit: "Bungkul",
    sourcingMethod: "family_assigned",
    status: "ready",
    reviewStatus: "approved",
    reviewerName: "Paman Klungkung (Keluarga)",
    reviewerType: "internal_member",
    recordedByName: "Dicatat oleh I Putu Dharma Yoga",
    reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    reviewNotes: "Sudah diukir motif Semara Ratih sesuai tradisi.",
    assigneeName: "Paman Klungkung",
    estimatedPrice: 75000,
    actualPrice: 60000,
    notes: "Diukir gambar Sang Hyang Semara Ratih.",
  },
  {
    id: "demo-banten-7",
    weddingId: "demo",
    ceremonyId: "demo-ceremony-4",
    ceremonyTitle: "Mesakapan / Pawiwahan Ring Sanggah Kamulan",
    catalogId: "BN-SAT-004",
    name: "Banten Pejati Lengkap",
    category: "madya",
    quantity: 4,
    unit: "Tanding",
    sourcingMethod: "self_made",
    status: "making",
    reviewStatus: "approved",
    reviewerName: "Jero Mangku Griya Sanur",
    reviewerType: "external_practitioner",
    recordedByName: "Dicatat oleh I Putu Dharma Yoga",
    reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    reviewNotes:
      "4 tanding untuk Kamulan, Lebuh, Surya, dan Penganten disetujui.",
    assigneeName: "Sekaa Ibu-ibu Banjar",
    estimatedPrice: 400000,
    actualPrice: 280000,
    notes: "Untuk Merajan Kamulan, Lebuh, Sanggah Surya, dan Penganten.",
  },
  {
    id: "demo-banten-8",
    weddingId: "demo",
    ceremonyId: null,
    ceremonyTitle: "Kebutuhan Umum Seluruh Acara",
    catalogId: "BN-SRN-005",
    name: "Canang Sari & Segehan Panca Warna",
    category: "sarana_pelengkap",
    quantity: 50,
    unit: "Tanding",
    sourcingMethod: "self_made",
    status: "ready",
    reviewStatus: "approved",
    reviewerName: "Ketua Sekaa Teruna",
    reviewerType: "internal_member",
    recordedByName: "Dicatat oleh I Putu Dharma Yoga",
    reviewedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    assigneeName: "Sekaa Teruna-Teruni",
    estimatedPrice: 200000,
    actualPrice: 150000,
    notes: "Untuk penjagaan lebuh dan pembersihan pekarangan harian.",
  },
];

/**
 * Verify user authorization to mutate wedding ritual items / banten (owner or editor).
 */
export async function verifyBantenWritePermission(weddingId: string): Promise<{
  allowed: boolean;
  userId?: string;
  userName?: string;
  userRole?: string;
  error?: string;
}> {
  if (weddingId === "demo") {
    return {
      allowed: true,
      userId: "demo-u1",
      userName: "I Putu Dharma Yoga",
      userRole: "owner",
    };
  }

  const entitlement = await checkFeatureAccess(weddingId, "edit");
  if (!entitlement.allowed) {
    return {
      allowed: false,
      error:
        entitlement.reason ||
        "Workspace memerlukan paket aktif untuk mengelola rencana banten.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      error: "Autentikasi diperlukan untuk mengubah rencana banten.",
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

  let userName = user.user_metadata?.full_name || "Anggota Panitia";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.full_name) {
      userName = profile.full_name;
    } else if (profile?.email) {
      userName = profile.email.split("@")[0];
    }
  } catch {
    // Keep fallback
  }

  return {
    allowed: true,
    userId: user.id,
    userName,
    userRole: member.role,
  };
}

/**
 * Fetch all banten and ritual items planned for a wedding workspace.
 */
export async function getWeddingBantenItems(
  weddingId: string
): Promise<BantenItem[]> {
  if (weddingId === "demo") {
    return DEMO_BANTEN_ITEMS;
  }

  try {
    const supabase = await createClient();

    // 1. Fetch ceremonies to build title map
    const { data: ceremonies } = await supabase
      .from("wedding_ceremonies")
      .select("id, title")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null);

    const ceremonyMap = new Map<string, string>();
    (ceremonies || []).forEach((c) => ceremonyMap.set(c.id, c.title));

    // 2. Fetch ritual items
    const { data, error } = await supabase
      .from("wedding_ritual_items")
      .select("*")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      weddingId: item.wedding_id,
      ceremonyId: item.ceremony_id,
      ceremonyTitle: item.ceremony_id
        ? ceremonyMap.get(item.ceremony_id) || "Prosesi Terkait"
        : "Kebutuhan Umum",
      catalogId: item.catalog_id,
      name: item.name,
      category: item.category || "sarana_pelengkap",
      quantity: Number(item.quantity) || 1,
      unit: item.unit || "Paket",
      sourcingMethod:
        (item.sourcing_method as SourcingMethod) || "purchased_package",
      status: (item.status as BantenAcquisitionStatus) || "needed",
      assigneeName: item.assignee_name,
      estimatedPrice: Number(item.estimated_price) || 0,
      actualPrice: Number(item.actual_price) || 0,
      notes: item.notes,
      reviewStatus: (item.review_status as BantenReviewStatus) || "draft",
      reviewerName: item.reviewer_name || null,
      reviewerType: (item.reviewer_type as ReviewerType) || null,
      recordedByUserId: item.recorded_by_user_id || null,
      recordedByName: item.recorded_by_name || null,
      reviewedAt: item.reviewed_at || null,
      reviewNotes: item.review_notes || null,
      sourceReference: item.source_reference || null,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (err) {
    captureError(err, { action: "getWeddingBantenItems", weddingId });
    return [];
  }
}

/**
 * Server action to create a new banten item for a wedding workspace.
 */
export async function createBantenItemAction(
  weddingId: string,
  input: CreateBantenItemInput
): Promise<{ success: boolean; message?: string; itemId?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Banten berhasil ditambahkan dalam mode demo.",
      itemId: "demo-banten-" + Date.now(),
    };
  }

  const perm = await verifyBantenWritePermission(weddingId);
  if (!perm.allowed) {
    return { success: false, message: perm.error };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("wedding_ritual_items")
      .insert({
        wedding_id: weddingId,
        ceremony_id: input.ceremonyId || null,
        name: input.name.trim(),
        category: input.category || "sarana_pelengkap",
        quantity: Number(input.quantity) || 1,
        unit: input.unit || "Paket",
        sourcing_method: input.sourcingMethod || "purchased_package",
        status: input.status || "needed",
        assignee_name: input.assigneeName?.trim() || null,
        estimated_price: Number(input.estimatedPrice) || 0,
        actual_price: Number(input.actualPrice) || 0,
        notes: input.notes?.trim() || null,
        review_status: "needs_review",
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false,
        message: error?.message || "Gagal menambahkan item banten.",
      };
    }

    await recordActivityLogAction({
      weddingId,
      action: "banten.created",
      entityType: "wedding_ritual_items",
      entityId: data.id,
      actorType: "user",
      actorName: perm.userName,
      details: {
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        reviewStatus: "needs_review",
      },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    if (input.ceremonyId) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${input.ceremonyId}`);
    }

    return {
      success: true,
      message: "Item banten berhasil ditambahkan.",
      itemId: data.id,
    };
  } catch (err) {
    captureError(err, { action: "createBantenItemAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menyimpan item banten.",
    };
  }
}

/**
 * Server action to update an existing banten item.
 * Automatically marks reviewStatus = 'needs_review' if an approved item is modified.
 */
export async function updateBantenItemAction(
  weddingId: string,
  itemId: string,
  input: UpdateBantenItemInput
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Perubahan banten tersimpan dalam mode demo.",
    };
  }

  const perm = await verifyBantenWritePermission(weddingId);
  if (!perm.allowed) {
    return { success: false, message: perm.error };
  }

  try {
    const supabase = await createClient();

    // Fetch existing item to check previous review status and verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("wedding_ritual_items")
      .select("*")
      .eq("id", itemId)
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !existing) {
      return {
        success: false,
        message: "Item banten tidak ditemukan pada ruang kerja ini.",
      };
    }

    // Check if core ritual specifications have changed
    const specChanged =
      existing.name !== input.name.trim() ||
      existing.category !== input.category ||
      Number(existing.quantity) !== Number(input.quantity) ||
      existing.unit !== input.unit ||
      existing.sourcing_method !== input.sourcingMethod ||
      existing.ceremony_id !== (input.ceremonyId || null) ||
      (existing.notes || "") !== (input.notes?.trim() || "");

    let reviewStatus =
      (existing.review_status as BantenReviewStatus) || "draft";
    let reviewNotes = existing.review_notes;

    // Automatic Re-review Requirement:
    // If an item was previously approved and requirements change,
    // reset reviewStatus to needs_review with an informative note.
    if (specChanged && existing.review_status === "approved") {
      reviewStatus = "needs_review";
      const resetNote = `[Perlu Tinjauan Ulang]: Spesifikasi sarana diubah oleh ${perm.userName || "Editor"}.`;
      reviewNotes = existing.review_notes
        ? `${resetNote} Catatan adat sebelumnya: ${existing.review_notes}`
        : resetNote;
    }

    const { error } = await supabase
      .from("wedding_ritual_items")
      .update({
        ceremony_id: input.ceremonyId || null,
        name: input.name.trim(),
        category: input.category,
        quantity: Number(input.quantity) || 1,
        unit: input.unit,
        sourcing_method: input.sourcingMethod,
        status: input.status,
        assignee_name: input.assigneeName?.trim() || null,
        estimated_price: Number(input.estimatedPrice) || 0,
        actual_price: Number(input.actualPrice) || 0,
        notes: input.notes?.trim() || null,
        review_status: reviewStatus,
        review_notes: reviewNotes,
      })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    await recordActivityLogAction({
      weddingId,
      action: "banten.updated",
      entityType: "wedding_ritual_items",
      entityId: itemId,
      actorType: "user",
      actorName: perm.userName,
      details: {
        name: input.name,
        status: input.status,
        specChanged,
        reviewStatus,
      },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    if (input.ceremonyId) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${input.ceremonyId}`);
    }

    return {
      success: true,
      message:
        specChanged && existing.review_status === "approved"
          ? "Perubahan disimpan. Status tinjauan adat disetel kembali ke 'Perlu Ditinjau'."
          : "Perubahan item banten berhasil disimpan.",
    };
  } catch (err) {
    captureError(err, { action: "updateBantenItemAction", itemId });
    return {
      success: false,
      message: "Gagal memperbarui item banten.",
    };
  }
}

/**
 * Server action to soft-delete a banten item.
 */
export async function deleteBantenItemAction(
  weddingId: string,
  itemId: string
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return { success: true, message: "Item banten dihapus dalam mode demo." };
  }

  const perm = await verifyBantenWritePermission(weddingId);
  if (!perm.allowed) {
    return { success: false, message: perm.error };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("wedding_ritual_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (error) {
      return { success: false, message: error.message };
    }

    await recordActivityLogAction({
      weddingId,
      action: "banten.deleted",
      entityType: "wedding_ritual_items",
      entityId: itemId,
      actorType: "user",
      actorName: perm.userName,
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);

    return { success: true, message: "Item banten berhasil dihapus." };
  } catch (err) {
    captureError(err, { action: "deleteBantenItemAction", itemId });
    return { success: false, message: "Gagal menghapus item banten." };
  }
}

/**
 * Server action to update banten acquisition status.
 * Note: Acquisition status is decoupled from local adat approval.
 */
export async function updateBantenStatusAction(
  weddingId: string,
  itemId: string,
  status: BantenAcquisitionStatus
): Promise<{ success: boolean; message?: string }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: "Status banten diperbarui dalam mode demo.",
    };
  }

  const perm = await verifyBantenWritePermission(weddingId);
  if (!perm.allowed) {
    return { success: false, message: perm.error };
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

    await recordActivityLogAction({
      weddingId,
      action: "banten.status_changed",
      entityType: "wedding_ritual_items",
      entityId: itemId,
      actorType: "user",
      actorName: perm.userName,
      details: { status },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    return { success: true, message: "Status pengadaan berhasil diperbarui." };
  } catch (err) {
    captureError(err, { action: "updateBantenStatusAction", itemId });
    return { success: false, message: "Gagal memperbarui status banten." };
  }
}

/**
 * Server action to submit or update custom family/practitioner review on a banten item.
 * Strictly scopes approvals to the wedding workspace; never alters the universal catalog.
 */
export async function submitBantenReviewAction(
  weddingId: string,
  itemId: string,
  input: SubmitBantenReviewInput
): Promise<{ success: boolean; message?: string }> {
  if (!input.reviewerName?.trim()) {
    return {
      success: false,
      message: "Nama peninjau atau praktisi adat wajib diisi.",
    };
  }

  if (weddingId === "demo") {
    return {
      success: true,
      message: "Tinjauan adat berhasil disimpan dalam mode demo.",
    };
  }

  const perm = await verifyBantenWritePermission(weddingId);
  if (!perm.allowed) {
    return {
      success: false,
      message: perm.error || "Akses ditolak untuk meninjau banten.",
    };
  }

  try {
    const supabase = await createClient();

    // Verify item belongs to this wedding workspace (multi-tenant boundary)
    const { data: existingItem, error: fetchError } = await supabase
      .from("wedding_ritual_items")
      .select("id, name, review_status, ceremony_id")
      .eq("id", itemId)
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError || !existingItem) {
      return {
        success: false,
        message: "Item banten tidak ditemukan pada ruang kerja ini.",
      };
    }

    const recordedByName = `Dicatat oleh ${perm.userName || "Editor"}`;
    const reviewedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("wedding_ritual_items")
      .update({
        review_status: input.reviewStatus,
        reviewer_name: input.reviewerName.trim(),
        reviewer_type: input.reviewerType,
        recorded_by_user_id: perm.userId,
        recorded_by_name: recordedByName,
        reviewed_at: reviewedAt,
        review_notes: input.reviewNotes?.trim() || null,
        source_reference: input.sourceReference?.trim() || null,
      })
      .eq("id", itemId)
      .eq("wedding_id", weddingId);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || "Gagal menyimpan tinjauan adat.",
      };
    }

    // Audit log entry
    await recordActivityLogAction({
      weddingId,
      action: "banten.reviewed",
      entityType: "wedding_ritual_items",
      entityId: itemId,
      actorType: "user",
      actorName: perm.userName,
      details: {
        itemName: existingItem.name,
        previousStatus: existingItem.review_status,
        newStatus: input.reviewStatus,
        reviewerName: input.reviewerName.trim(),
        reviewerType: input.reviewerType,
        recordedByName,
        sourceReference: input.sourceReference?.trim() || null,
      },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    if (existingItem.ceremony_id) {
      revalidatePath(
        `/workspace/${weddingId}/ceremonies/${existingItem.ceremony_id}`
      );
    }

    return {
      success: true,
      message: "Tinjauan adat berhasil disimpan.",
    };
  } catch (err) {
    captureError(err, {
      action: "submitBantenReviewAction",
      weddingId,
      itemId,
    });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat menyimpan tinjauan adat.",
    };
  }
}

/**
 * Server action to import items from the canonical ritual catalog into the wedding workspace.
 * Newly imported items default to 'needs_review' to allow local family customization.
 */
export async function importFromCatalogAction(
  weddingId: string,
  catalogIds: string[],
  ceremonyId?: string | null
): Promise<{ success: boolean; message?: string; importedCount?: number }> {
  if (weddingId === "demo") {
    return {
      success: true,
      message: `${catalogIds.length} item banten berhasil diimpor dari pustaka (mode demo).`,
      importedCount: catalogIds.length,
    };
  }

  if (!catalogIds || catalogIds.length === 0) {
    return { success: false, message: "Pilih minimal 1 banten dari katalog." };
  }

  const perm = await verifyBantenWritePermission(weddingId);
  if (!perm.allowed) {
    return { success: false, message: perm.error };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch catalog metadata
    const catalog = await getRitualCatalog();
    const selectedCatalogItems = catalog.filter((c) =>
      catalogIds.includes(c.id)
    );

    const itemsToInsert = selectedCatalogItems.map((c) => {
      // Determine sourcing method default
      let sourcingMethod: SourcingMethod = "purchased_package";
      if (
        c.defaultProvider?.toLowerCase().includes("ngayah") ||
        c.defaultProvider?.toLowerCase().includes("sendiri")
      ) {
        sourcingMethod = "self_made";
      } else if (c.defaultProvider?.toLowerCase().includes("keluarga")) {
        sourcingMethod = "family_assigned";
      }

      // Determine category
      let category = "sarana_pelengkap";
      if (c.itemType === "Paket Banten") {
        category = "utama";
      } else if (c.itemType === "Banten Satuan") {
        category = "madya";
      }

      return {
        wedding_id: weddingId,
        ceremony_id: ceremonyId || null,
        catalog_id: c.id,
        name: c.name,
        category,
        quantity: c.defaultQuantity ? Number(c.defaultQuantity) : 1,
        unit: c.unit || "Paket",
        sourcing_method: sourcingMethod,
        status: "needed" as const,
        review_status: "needs_review" as const,
        assignee_name: c.defaultProvider || null,
        estimated_price: 0,
        actual_price: 0,
        notes: c.notes || null,
      };
    });

    const { error: insertError } = await supabase
      .from("wedding_ritual_items")
      .insert(itemsToInsert);

    if (insertError) {
      return { success: false, message: insertError.message };
    }

    await recordActivityLogAction({
      weddingId,
      action: "banten.catalog_imported",
      entityType: "wedding_ritual_items",
      entityId: weddingId,
      actorType: "user",
      actorName: perm.userName,
      details: {
        imported_count: itemsToInsert.length,
        catalog_ids: catalogIds,
      },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/banten`);
    if (ceremonyId) {
      revalidatePath(`/workspace/${weddingId}/ceremonies/${ceremonyId}`);
    }

    return {
      success: true,
      message: `${itemsToInsert.length} banten berhasil ditambahkan dari pustaka katalog.`,
      importedCount: itemsToInsert.length,
    };
  } catch (err) {
    captureError(err, { action: "importFromCatalogAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat mengimpor banten dari katalog.",
    };
  }
}
