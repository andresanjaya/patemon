"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { checkFeatureAccess } from "@/features/payments/entitlements";
import type { Database } from "@/types/database";
import { calculateGuestStats, DEMO_GUESTS } from "./seeds";
import type {
  CreateGuestInput,
  Guest,
  GuestSide,
  GuestStats,
  InvitationStatus,
  UpdateGuestInput,
} from "./types";
import type { BatchImportInputRow, BatchImportResult } from "./csv-types";

type GuestInsert = Database["public"]["Tables"]["guests"]["Insert"];
type GuestUpdate = Database["public"]["Tables"]["guests"]["Update"];

/**
 * Verify user authorization to mutate wedding guest records (owner or editor).
 */
async function verifyGuestWritePermission(weddingId: string): Promise<{
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
        "Workspace memerlukan paket aktif untuk mengelola tamu.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      error: "Autentikasi diperlukan untuk mengubah data tamu.",
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
 * Fetch all guests and aggregated headcount statistics for a wedding workspace.
 */
export async function getWeddingGuests(
  weddingId: string
): Promise<{ guests: Guest[]; stats: GuestStats }> {
  if (weddingId === "demo") {
    return {
      guests: DEMO_GUESTS,
      stats: calculateGuestStats(DEMO_GUESTS),
    };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error || !data) {
      if (error) {
        captureError(error, { action: "getWeddingGuests", weddingId });
      }
      return {
        guests: [],
        stats: calculateGuestStats([]),
      };
    }

    const guests: Guest[] = data.map((g) => ({
      id: g.id,
      weddingId: g.wedding_id,
      name: g.name,
      side: g.side as GuestSide,
      groupHousehold: g.group_household,
      headcount: Math.max(1, Math.round(Number(g.headcount) || 1)),
      invitationStatus: g.invitation_status as InvitationStatus,
      phone: g.phone,
      notes: g.notes,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }));

    return {
      guests,
      stats: calculateGuestStats(guests),
    };
  } catch (err) {
    captureError(err, { action: "getWeddingGuests", weddingId });
    return {
      guests: [],
      stats: calculateGuestStats([]),
    };
  }
}

/**
 * Add a new guest or household group.
 */
export async function createGuestAction(
  weddingId: string,
  input: CreateGuestInput
): Promise<{ success: boolean; guest?: Guest; error?: string }> {
  if (!input.name?.trim()) {
    return {
      success: false,
      error: "Nama tamu / kepala keluarga wajib diisi.",
    };
  }

  const headcount = Math.max(1, Math.round(Number(input.headcount) || 1));
  const side: GuestSide = input.side || "both";
  const invitationStatus: InvitationStatus = input.invitationStatus || "draft";

  if (weddingId === "demo") {
    const newGuest: Guest = {
      id: `demo-g-${Date.now()}`,
      weddingId: "demo",
      name: input.name.trim(),
      side,
      groupHousehold: input.groupHousehold?.trim() || null,
      headcount,
      invitationStatus,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, guest: newGuest };
  }

  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return { success: false, error: auth.error };
  }

  try {
    const supabase = await createClient();

    const insertPayload: GuestInsert = {
      wedding_id: weddingId,
      name: input.name.trim(),
      side,
      group_household: input.groupHousehold?.trim() || null,
      headcount,
      invitation_status: invitationStatus,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from("guests")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      captureError(error, { action: "createGuestAction", weddingId, input });
      return {
        success: false,
        error: error?.message || "Gagal menyimpan tamu.",
      };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    revalidatePath(`/workspace/${weddingId}`);

    const resultGuest: Guest = {
      id: data.id,
      weddingId: data.wedding_id,
      name: data.name,
      side: data.side as GuestSide,
      groupHousehold: data.group_household,
      headcount: Math.max(1, Math.round(Number(data.headcount) || 1)),
      invitationStatus: data.invitation_status as InvitationStatus,
      phone: data.phone,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, guest: resultGuest };
  } catch (err) {
    captureError(err, { action: "createGuestAction", weddingId });
    return {
      success: false,
      error: "Terjadi kesalahan sistem saat membuat data tamu.",
    };
  }
}

/**
 * Update an existing guest record.
 */
export async function updateGuestAction(
  weddingId: string,
  guestId: string,
  input: UpdateGuestInput
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return { success: false, error: auth.error };
  }

  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const updatePayload: GuestUpdate = {};

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.side !== undefined) updatePayload.side = input.side;
    if (input.groupHousehold !== undefined)
      updatePayload.group_household = input.groupHousehold?.trim() || null;
    if (input.headcount !== undefined)
      updatePayload.headcount = Math.max(
        1,
        Math.round(Number(input.headcount) || 1)
      );
    if (input.invitationStatus !== undefined)
      updatePayload.invitation_status = input.invitationStatus;
    if (input.phone !== undefined)
      updatePayload.phone = input.phone?.trim() || null;
    if (input.notes !== undefined)
      updatePayload.notes = input.notes?.trim() || null;

    const { error } = await supabase
      .from("guests")
      .update(updatePayload)
      .eq("id", guestId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, { action: "updateGuestAction", weddingId, guestId });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "updateGuestAction", weddingId, guestId });
    return { success: false, error: "Gagal memperbarui data tamu." };
  }
}

/**
 * Quick status switcher for invitation delivery and confirmation.
 */
export async function updateGuestInvitationStatusAction(
  weddingId: string,
  guestId: string,
  invitationStatus: InvitationStatus
): Promise<{ success: boolean; error?: string }> {
  return updateGuestAction(weddingId, guestId, { invitationStatus });
}

/**
 * Soft delete a guest record.
 */
export async function deleteGuestAction(
  weddingId: string,
  guestId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return { success: false, error: auth.error };
  }

  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("guests")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", guestId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, { action: "deleteGuestAction", weddingId, guestId });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, { action: "deleteGuestAction", weddingId, guestId });
    return { success: false, error: "Gagal menghapus data tamu." };
  }
}

/**
 * Import starter Balinese wedding guest list for quick estimation.
 */
export async function importSampleGuestsAction(
  weddingId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return { success: false, error: auth.error };
  }

  if (weddingId === "demo") {
    return { success: true, count: DEMO_GUESTS.length };
  }

  try {
    const supabase = await createClient();
    const rows: GuestInsert[] = DEMO_GUESTS.map((g) => ({
      wedding_id: weddingId,
      name: g.name,
      side: g.side,
      group_household: g.groupHousehold,
      headcount: g.headcount,
      invitation_status: "draft",
      phone: g.phone,
      notes: g.notes,
    }));

    const { error } = await supabase.from("guests").insert(rows);

    if (error) {
      captureError(error, { action: "importSampleGuestsAction", weddingId });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true, count: rows.length };
  } catch (err) {
    captureError(err, { action: "importSampleGuestsAction", weddingId });
    return { success: false, error: "Gagal mengimpor contoh daftar tamu." };
  }
}

/**
 * Update invitation status for a specific guest (e.g. marked as sent via WhatsApp).
 * (Issue #86)
 */
export async function updateInvitationStatusAction(
  weddingId: string,
  guestId: string,
  status: InvitationStatus
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return { success: false, error: auth.error };
  }

  if (weddingId === "demo") {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("guests")
      .update({
        invitation_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guestId)
      .eq("wedding_id", weddingId);

    if (error) {
      captureError(error, {
        action: "updateInvitationStatusAction",
        weddingId,
        guestId,
        status,
      });
      return { success: false, error: error.message };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    revalidatePath(`/workspace/${weddingId}`);
    return { success: true };
  } catch (err) {
    captureError(err, {
      action: "updateInvitationStatusAction",
      weddingId,
      guestId,
    });
    return { success: false, error: "Gagal memperbarui status undangan." };
  }
}

/**
 * Batch import guests from parsed and confirmed CSV rows (Issue #85).
 * Validates all rows server-side and applies duplicate filtering.
 */
export async function batchImportGuestsAction(
  weddingId: string,
  inputRows: BatchImportInputRow[],
  options: { skipDuplicates?: boolean } = {}
): Promise<BatchImportResult> {
  const auth = await verifyGuestWritePermission(weddingId);
  if (!auth.allowed) {
    return {
      success: false,
      message: auth.error || "Akses ditolak.",
      totalProcessed: inputRows.length,
      importedCount: 0,
      skippedCount: inputRows.length,
      failedCount: 0,
      guests: [],
    };
  }

  if (inputRows.length === 0) {
    return {
      success: true,
      message: "Tidak ada data tamu yang dipilih untuk diimpor.",
      totalProcessed: 0,
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      guests: [],
    };
  }

  try {
    const supabase = await createClient();

    // Check existing guests for server-side duplicate guard
    const { data: existingRows } = await supabase
      .from("guests")
      .select("name, phone")
      .eq("wedding_id", weddingId)
      .is("deleted_at", null);

    const existingNames = new Set(
      (existingRows || []).map((g) => g.name.toLowerCase().trim())
    );
    const existingPhones = new Set(
      (existingRows || [])
        .map((g) =>
          g.phone ? g.phone.replace(/[\s\-\(\)\.]/g, "").trim() : ""
        )
        .filter(Boolean)
    );

    const validInserts: GuestInsert[] = [];
    const batchSeenNames = new Set<string>();
    const batchSeenPhones = new Set<string>();
    let skippedCount = 0;

    for (const row of inputRows) {
      const cleanName = (row.name || "").trim();
      if (!cleanName) {
        skippedCount++;
        continue;
      }

      const cleanNameLower = cleanName.toLowerCase();
      const cleanPhone = row.phone
        ? row.phone.replace(/[\s\-\(\)\.]/g, "").trim()
        : "";

      const isDuplicate =
        existingNames.has(cleanNameLower) ||
        (cleanPhone && existingPhones.has(cleanPhone)) ||
        batchSeenNames.has(cleanNameLower) ||
        (cleanPhone && batchSeenPhones.has(cleanPhone));

      if (options.skipDuplicates && isDuplicate) {
        skippedCount++;
        continue;
      }

      batchSeenNames.add(cleanNameLower);
      if (cleanPhone) batchSeenPhones.add(cleanPhone);

      validInserts.push({
        wedding_id: weddingId,
        name: cleanName,
        side: row.side || "both",
        group_household: row.groupHousehold?.trim() || null,
        headcount: Math.max(1, Math.round(Number(row.headcount) || 1)),
        invitation_status: row.invitationStatus || "draft",
        phone: row.phone?.trim() || null,
        notes: row.notes?.trim() || null,
      });
    }

    if (validInserts.length === 0) {
      return {
        success: true,
        message: "Semua baris dilewati karena duplikat atau tidak valid.",
        totalProcessed: inputRows.length,
        importedCount: 0,
        skippedCount,
        failedCount: 0,
        guests: [],
      };
    }

    if (weddingId === "demo") {
      const demoResultGuests: Guest[] = validInserts.map((ins, idx) => ({
        id: `demo-import-${Date.now()}-${idx}`,
        weddingId: "demo",
        name: ins.name,
        side: ins.side as GuestSide,
        groupHousehold: ins.group_household || null,
        headcount: ins.headcount || 1,
        invitationStatus:
          (ins.invitation_status as InvitationStatus) || "draft",
        phone: ins.phone || null,
        notes: ins.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return {
        success: true,
        message: `Berhasil mengimpor ${demoResultGuests.length} tamu (Demo mode).`,
        totalProcessed: inputRows.length,
        importedCount: demoResultGuests.length,
        skippedCount,
        failedCount: 0,
        guests: demoResultGuests,
      };
    }

    const { data: insertedData, error } = await supabase
      .from("guests")
      .insert(validInserts)
      .select();

    if (error) {
      captureError(error, { action: "batchImportGuestsAction", weddingId });
      return {
        success: false,
        message: `Gagal menyimpan tamu ke database: ${error.message}`,
        totalProcessed: inputRows.length,
        importedCount: 0,
        skippedCount,
        failedCount: validInserts.length,
        guests: [],
      };
    }

    revalidatePath(`/workspace/${weddingId}/guests`);
    revalidatePath(`/workspace/${weddingId}`);

    const mappedGuests: Guest[] = (insertedData || []).map((g) => ({
      id: g.id,
      weddingId: g.wedding_id,
      name: g.name,
      side: g.side as GuestSide,
      groupHousehold: g.group_household,
      headcount: Math.max(1, Math.round(Number(g.headcount) || 1)),
      invitationStatus: g.invitation_status as InvitationStatus,
      phone: g.phone,
      notes: g.notes,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }));

    return {
      success: true,
      message: `Berhasil mengimpor ${mappedGuests.length} tamu. (${skippedCount} baris dilewati)`,
      totalProcessed: inputRows.length,
      importedCount: mappedGuests.length,
      skippedCount,
      failedCount: 0,
      guests: mappedGuests,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Terjadi kesalahan sistem saat impor.";
    captureError(err, { action: "batchImportGuestsAction", weddingId });
    return {
      success: false,
      message: errorMsg,
      totalProcessed: inputRows.length,
      importedCount: 0,
      skippedCount: 0,
      failedCount: inputRows.length,
      guests: [],
    };
  }
}
