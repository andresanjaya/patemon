"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import { validateWorkspaceInput } from "./validation";
import type {
  MarriageForm,
  WeddingWorkspace,
  WorkspaceRole,
  WorkspaceSummary,
} from "./types";

export interface WorkspaceActionResult {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  weddingId?: string;
}

/**
 * Fetch all weddings where the current user is an active member or creator.
 */
export async function getUserWorkspaces(): Promise<WorkspaceSummary[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    // Query weddings accessible through RLS (via membership or ownership)
    const { data: weddings, error } = await supabase
      .from("weddings")
      .select(
        `
        id,
        couple_names,
        prospective_date,
        location_region,
        marriage_form,
        target_budget,
        created_by
      `
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error || !weddings) {
      return [];
    }

    // Query memberships for this user to determine exact role
    const { data: memberships } = await supabase
      .from("wedding_members")
      .select("wedding_id, role")
      .eq("user_id", user.id)
      .eq("status", "active");

    const roleMap = new Map<string, WorkspaceRole>();
    memberships?.forEach((m) => {
      roleMap.set(m.wedding_id, m.role as WorkspaceRole);
    });

    return weddings.map((w) => {
      const userRole: WorkspaceRole =
        roleMap.get(w.id) || (w.created_by === user.id ? "owner" : "viewer");

      return {
        id: w.id,
        coupleNames: w.couple_names,
        prospectiveDate: w.prospective_date,
        locationRegion: w.location_region,
        marriageForm: w.marriage_form as MarriageForm,
        targetBudget: Number(w.target_budget || 0),
        userRole,
      };
    });
  } catch (err) {
    captureError(err, { action: "getUserWorkspaces" });
    return [];
  }
}

/**
 * Fetch a single wedding workspace by ID and verify member access.
 */
export async function getWeddingWorkspace(
  weddingId: string
): Promise<{ workspace: WeddingWorkspace | null; role: WorkspaceRole | null }> {
  // Free preview mock workspace for unauthenticated exploration
  if (weddingId === "demo") {
    return {
      workspace: {
        id: "demo",
        slug: "demo-pawiwahan",
        coupleNames: "Pawiwahan Dharma & Shanti",
        groomName: "I Putu Dharma Yoga",
        brideName: "Ni Made Shanti Dewi",
        prospectiveDate: "2027-08-20",
        locationRegion: "Denpasar",
        marriageForm: "memadik",
        targetBudget: 75000000,
        notes:
          "Pawiwahan adat Bali di Griya Denpasar dengan upacara Mesakapan dan Madengen-dengen.",
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      role: "viewer",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { workspace: null, role: null };
    }

    const { data: wedding, error } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", weddingId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !wedding) {
      return { workspace: null, role: null };
    }

    // Determine user role
    const { data: member } = await supabase
      .from("wedding_members")
      .select("role")
      .eq("wedding_id", weddingId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const role: WorkspaceRole =
      (member?.role as WorkspaceRole) ||
      (wedding.created_by === user.id ? "owner" : "viewer");

    const workspace: WeddingWorkspace = {
      id: wedding.id,
      slug: wedding.slug,
      coupleNames: wedding.couple_names,
      groomName: wedding.groom_name,
      brideName: wedding.bride_name,
      prospectiveDate: wedding.prospective_date,
      locationRegion: wedding.location_region,
      marriageForm: wedding.marriage_form as MarriageForm,
      targetBudget: Number(wedding.target_budget || 0),
      notes: wedding.notes,
      createdBy: wedding.created_by,
      createdAt: wedding.created_at,
      updatedAt: wedding.updated_at,
    };

    return { workspace, role };
  } catch (err) {
    captureError(err, { action: "getWeddingWorkspace", weddingId });
    return { workspace: null, role: null };
  }
}

/**
 * Server action to create a new wedding workspace with owner membership.
 */
export async function createWeddingWorkspaceAction(
  prevState: WorkspaceActionResult | null,
  formData: FormData
): Promise<WorkspaceActionResult> {
  const coupleNames = (formData.get("coupleNames") as string)?.trim();
  const groomName = (formData.get("groomName") as string)?.trim() || null;
  const brideName = (formData.get("brideName") as string)?.trim() || null;
  const prospectiveDate =
    (formData.get("prospectiveDate") as string)?.trim() || null;
  const locationRegion =
    (formData.get("locationRegion") as string)?.trim() || null;
  const marriageForm =
    (formData.get("marriageForm") as string as MarriageForm) || "memadik";
  const rawBudget = formData.get("targetBudget") as string;
  const targetBudget = rawBudget ? Math.max(0, parseInt(rawBudget, 10)) : 0;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const validation = validateWorkspaceInput({
    coupleNames,
    prospectiveDate,
    marriageForm,
    targetBudget,
  });

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      message: "Mohon periksa kembali formulir yang diisi.",
    };
  }

  let newWeddingId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Sesi login berakhir. Silakan login kembali.",
      };
    }

    // 1. Create wedding workspace record
    const { data: wedding, error: createError } = await supabase
      .from("weddings")
      .insert({
        couple_names: coupleNames,
        groom_name: groomName,
        bride_name: brideName,
        prospective_date: prospectiveDate,
        location_region: locationRegion,
        marriage_form: marriageForm,
        target_budget: targetBudget,
        notes: notes,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (createError || !wedding) {
      return {
        success: false,
        message: createError?.message || "Gagal membuat workspace pernikahan.",
      };
    }

    newWeddingId = wedding.id;

    // 2. Register creator as initial owner member
    await supabase.from("wedding_members").insert({
      wedding_id: newWeddingId,
      user_id: user.id,
      role: "owner",
      invited_email: user.email || "",
      status: "active",
      joined_at: new Date().toISOString(),
    });

    // 3. Log workspace creation to audit logs
    await supabase.from("activity_logs").insert({
      wedding_id: newWeddingId,
      user_id: user.id,
      action: "workspace.created",
      entity_type: "wedding",
      entity_id: newWeddingId,
      details: {
        couple_names: coupleNames,
        marriage_form: marriageForm,
      },
    });

    revalidatePath("/workspaces");
  } catch (err) {
    captureError(err, { action: "createWeddingWorkspaceAction" });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat membuat workspace.",
    };
  }

  // Redirect to newly created workspace
  redirect(`/workspace/${newWeddingId}`);
}

/**
 * Server action to update wedding workspace details and settings.
 */
export async function updateWeddingWorkspaceAction(
  weddingId: string,
  prevState: WorkspaceActionResult | null,
  formData: FormData
): Promise<WorkspaceActionResult> {
  if (weddingId === "demo") {
    return {
      success: false,
      message: "Workspace demo bersifat read-only.",
    };
  }

  const coupleNames = (formData.get("coupleNames") as string)?.trim();
  const groomName = (formData.get("groomName") as string)?.trim() || null;
  const brideName = (formData.get("brideName") as string)?.trim() || null;
  const prospectiveDate =
    (formData.get("prospectiveDate") as string)?.trim() || null;
  const locationRegion =
    (formData.get("locationRegion") as string)?.trim() || null;
  const marriageForm =
    (formData.get("marriageForm") as string as MarriageForm) || "memadik";
  const rawBudget = formData.get("targetBudget") as string;
  const targetBudget = rawBudget ? Math.max(0, parseInt(rawBudget, 10)) : 0;
  const notes = (formData.get("notes") as string)?.trim() || null;

  const validation = validateWorkspaceInput({
    coupleNames,
    prospectiveDate,
    marriageForm,
    targetBudget,
  });

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      message: "Mohon periksa kembali isian formulir.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Sesi login tidak valid.",
      };
    }

    const { error: updateError } = await supabase
      .from("weddings")
      .update({
        couple_names: coupleNames,
        groom_name: groomName,
        bride_name: brideName,
        prospective_date: prospectiveDate,
        location_region: locationRegion,
        marriage_form: marriageForm,
        target_budget: targetBudget,
        notes: notes,
      })
      .eq("id", weddingId);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || "Gagal memperbarui data workspace.",
      };
    }

    // Log update activity
    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "workspace.updated",
      entity_type: "wedding",
      entity_id: weddingId,
      details: {
        couple_names: coupleNames,
        marriage_form: marriageForm,
      },
    });

    revalidatePath(`/workspace/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}/settings`);
    revalidatePath("/workspaces");

    return {
      success: true,
      message: "Pengaturan workspace berhasil disimpan.",
    };
  } catch (err) {
    captureError(err, { action: "updateWeddingWorkspaceAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan sistem saat memperbarui workspace.",
    };
  }
}

/**
 * Server action to soft-delete a wedding workspace.
 */
export async function deleteWeddingWorkspaceAction(
  weddingId: string
): Promise<WorkspaceActionResult> {
  if (weddingId === "demo") {
    return {
      success: false,
      message: "Workspace demo tidak dapat dihapus.",
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

    const { error: deleteError } = await supabase
      .from("weddings")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", weddingId);

    if (deleteError) {
      return {
        success: false,
        message: deleteError.message || "Gagal menghapus workspace.",
      };
    }

    await supabase.from("activity_logs").insert({
      wedding_id: weddingId,
      user_id: user.id,
      action: "workspace.deleted",
      entity_type: "wedding",
      entity_id: weddingId,
      details: { timestamp: new Date().toISOString() },
    });

    revalidatePath("/workspaces");
  } catch (err) {
    captureError(err, { action: "deleteWeddingWorkspaceAction", weddingId });
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus workspace.",
    };
  }

  redirect("/workspaces");
}
