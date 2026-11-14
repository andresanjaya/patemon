"use server";

import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import type { WorkspaceEntitlement } from "./types";

/**
 * Checks and returns the real-time server-enforced entitlement for a wedding workspace.
 * Governs free preview limits, paid workspace privileges, and graceful post-wedding read-only archiving.
 */
export async function getWorkspaceEntitlement(
  weddingId: string
): Promise<WorkspaceEntitlement> {
  // 1. Sandbox / Demo workspace handling
  if (weddingId === "demo") {
    return {
      weddingId: "demo",
      status: "free_preview",
      isPaid: false,
      isDemo: true,
      grantedAt: null,
      validUntil: null,
      canEdit: false,
      canInviteMembers: false,
      canExportCSV: true,
      planName: "Mode Free Preview",
      badgeLabel: "Demo Interaktif",
      daysRemaining: null,
      message:
        "Anda sedang melihat workspace demo interaktif. Jelajahi fitur perencanaan atau aktifkan workspace Anda sendiri.",
    };
  }

  try {
    const supabase = await createClient();

    // 2. Fetch the latest active access grant
    const { data: grant, error } = await supabase
      .from("access_grants")
      .select("id, status, granted_at, valid_until, revoked_at")
      .eq("wedding_id", weddingId)
      .eq("status", "active")
      .order("granted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      captureError(error, { action: "getWorkspaceEntitlement", weddingId });
    }

    // 3. If no active grant exists, workspace is in free preview mode
    if (!grant) {
      return {
        weddingId,
        status: "free_preview",
        isPaid: false,
        isDemo: false,
        grantedAt: null,
        validUntil: null,
        canEdit: true, // Allow draft editing in MVP preview
        canInviteMembers: false, // Inviting family requires paid license
        canExportCSV: true,
        planName: "Mode Free Preview",
        badgeLabel: "Preview Belum Diaktivasi",
        daysRemaining: null,
        message:
          "Workspace ini belum diaktivasi. Aktifkan lisensi penuh untuk mengundang keluarga dan panitia ke workspace Anda.",
      };
    }

    // 4. Check if revoked
    if (grant.revoked_at) {
      return {
        weddingId,
        status: "revoked",
        isPaid: false,
        isDemo: false,
        grantedAt: grant.granted_at,
        validUntil: grant.valid_until,
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Akses Dicabut",
        badgeLabel: "Akses Ditangguhkan",
        daysRemaining: 0,
        message: "Akses ke workspace ini telah ditangguhkan.",
      };
    }

    // 5. Check expiration against valid_until
    if (grant.valid_until) {
      const validUntilDate = new Date(grant.valid_until);
      const now = new Date();
      const diffMs = validUntilDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        // Expired -> Graceful Read-only Access per PRD 5.4
        return {
          weddingId,
          status: "expired",
          isPaid: false,
          isDemo: false,
          grantedAt: grant.granted_at,
          validUntil: grant.valid_until,
          canEdit: false, // Mutations locked
          canInviteMembers: false,
          canExportCSV: true, // Data export always permitted
          planName: "Arsip Pawiwahan (Read-Only)",
          badgeLabel: "Masa Aktif Berakhir",
          daysRemaining: 0,
          message:
            "Masa aktif perencanaan telah selesai. Anda tetap memiliki akses baca dan ekspor data seumur hidup.",
        };
      }

      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        weddingId,
        status: "active",
        isPaid: true,
        isDemo: false,
        grantedAt: grant.granted_at,
        validUntil: grant.valid_until,
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        planName: "Akses Penuh Pawiwahan",
        badgeLabel: "Lisensi Aktif",
        daysRemaining,
      };
    }

    // 6. Lifetime / Uncapped Active Grant
    return {
      weddingId,
      status: "active",
      isPaid: true,
      isDemo: false,
      grantedAt: grant.granted_at,
      validUntil: null,
      canEdit: true,
      canInviteMembers: true,
      canExportCSV: true,
      planName: "Akses Penuh Pawiwahan",
      badgeLabel: "Lisensi Aktif",
      daysRemaining: null,
    };
  } catch (err: unknown) {
    captureError(err, { action: "getWorkspaceEntitlement", weddingId });
    // Safe fallback to free preview
    return {
      weddingId,
      status: "free_preview",
      isPaid: false,
      isDemo: false,
      grantedAt: null,
      validUntil: null,
      canEdit: true,
      canInviteMembers: false,
      canExportCSV: true,
      planName: "Mode Free Preview",
      badgeLabel: "Preview",
      daysRemaining: null,
    };
  }
}

/**
 * Validates whether a specific feature can be accessed in this workspace.
 */
export async function checkFeatureAccess(
  weddingId: string,
  feature: "edit" | "invite" | "export"
): Promise<{ allowed: boolean; reason?: string }> {
  const entitlement = await getWorkspaceEntitlement(weddingId);

  switch (feature) {
    case "edit":
      if (!entitlement.canEdit) {
        return {
          allowed: false,
          reason:
            entitlement.status === "expired"
              ? "Workspace telah memasuki masa arsip baca-saja (read-only)."
              : "Mode Demo tidak mengizinkan penyimpanan permanen.",
        };
      }
      return { allowed: true };

    case "invite":
      if (!entitlement.canInviteMembers) {
        return {
          allowed: false,
          reason:
            "Fitur kolaborasi keluarga dan penugasan peran memerlukan aktivasi lisensi Akses Penuh Pawiwahan.",
        };
      }
      return { allowed: true };

    case "export":
      // Always allowed for user data sovereignty
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Grants an active license to a workspace.
 * Used upon successful payment verification or administrative activation.
 */
export async function grantWorkspaceAccessAction(
  weddingId: string,
  options?: { orderId?: string; durationMonths?: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const durationMonths = options?.durationMonths ?? 12; // 12 months standard period

    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + durationMonths);

    const { error } = await supabase.from("access_grants").insert({
      wedding_id: weddingId,
      order_id: options?.orderId || null,
      status: "active",
      valid_until: validUntil.toISOString(),
    });

    if (error) {
      captureError(error, { action: "grantWorkspaceAccessAction", weddingId });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Gagal memberikan akses workspace.";
    return { success: false, error: msg };
  }
}
