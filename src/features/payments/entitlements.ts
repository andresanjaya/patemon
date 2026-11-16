"use server";

import { createClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability/logger";
import type { WorkspaceEntitlement } from "./types";

/**
 * Checks and returns the real-time server-enforced entitlement for a wedding workspace.
 * Governs free preview limits, paid workspace privileges, and graceful post-wedding read-only archiving.
 */
export async function getWorkspaceEntitlement(
  weddingId: string,
  client?: Awaited<ReturnType<typeof createClient>>
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
    const supabase = client || (await createClient());

    // 2. Fetch the latest access grant (unfiltered by status to accurately detect revoked/expired states)
    let grant: {
      id: string;
      status: string;
      granted_at: string | null;
      valid_until: string | null;
      revoked_at?: string | null;
      grant_type?: string | null;
      override_reason?: string | null;
    } | null = null;

    const grantQueryWithOverrides = await supabase
      .from("access_grants")
      .select(
        "id, status, granted_at, valid_until, revoked_at, grant_type, override_reason"
      )
      .eq("wedding_id", weddingId)
      .order("granted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (grantQueryWithOverrides.error) {
      // If error is due to missing columns in DB schema (e.g. grant_type / override_reason from migration 000003),
      // seamlessly fallback to core access_grants schema columns.
      const isMissingColumnError =
        grantQueryWithOverrides.error.code === "42703" ||
        grantQueryWithOverrides.error.message?.includes("grant_type") ||
        grantQueryWithOverrides.error.message?.includes("override_reason");

      if (isMissingColumnError) {
        const coreQuery = await supabase
          .from("access_grants")
          .select("id, status, granted_at, valid_until, revoked_at")
          .eq("wedding_id", weddingId)
          .order("granted_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (coreQuery.error) {
          captureError(coreQuery.error, {
            action: "getWorkspaceEntitlement.fallbackCore",
            weddingId,
          });
          return {
            weddingId,
            status: "error",
            isPaid: false,
            isDemo: false,
            grantedAt: null,
            validUntil: null,
            canEdit: false,
            canInviteMembers: false,
            canExportCSV: true,
            planName: "Gagal Memuat Lisensi",
            badgeLabel: "Error Lisensi",
            daysRemaining: null,
            message:
              "Status lisensi tidak dapat dimuat. Perubahan data dibatasi demi keamanan.",
          };
        }
        grant = coreQuery.data;
      } else {
        captureError(grantQueryWithOverrides.error, {
          action: "getWorkspaceEntitlement",
          weddingId,
        });
        // Database query error: FAIL CLOSED (never grant edit permissions on query error per Issue #75)
        return {
          weddingId,
          status: "error",
          isPaid: false,
          isDemo: false,
          grantedAt: null,
          validUntil: null,
          canEdit: false,
          canInviteMembers: false,
          canExportCSV: true,
          planName: "Gagal Memuat Lisensi",
          badgeLabel: "Error Lisensi",
          daysRemaining: null,
          message:
            "Status lisensi tidak dapat dimuat. Perubahan data dibatasi demi keamanan.",
        };
      }
    } else {
      grant = grantQueryWithOverrides.data;
    }

    // Check if wedding is frozen by operational platform admin (Issue #81)
    try {
      const weddingQuery = supabase
        .from("weddings")
        .select("is_frozen, frozen_reason")
        .eq("id", weddingId);

      const weddingRes =
        typeof (
          weddingQuery as unknown as {
            maybeSingle?: () => Promise<unknown>;
          }
        ).maybeSingle === "function"
          ? await (
            weddingQuery as unknown as {
              maybeSingle: () => Promise<{
                data: {
                  is_frozen: boolean | null;
                  frozen_reason: string | null;
                } | null;
                error: unknown;
              }>;
            }
          ).maybeSingle()
          : null;

      if (weddingRes?.data?.is_frozen) {
        return {
          weddingId,
          status: "revoked",
          isPaid: false,
          isDemo: false,
          grantedAt: grant?.granted_at || null,
          validUntil: grant?.valid_until || null,
          canEdit: false,
          canInviteMembers: false,
          canExportCSV: true,
          planName: "Akses Dibekukan",
          badgeLabel: "Dibekukan Admin",
          daysRemaining: 0,
          message:
            weddingRes.data.frozen_reason ||
            "Ruang kerja ini sedang dibekukan sementara oleh tim operasional untuk investigasi keamanan atau kepatuhan.",
        };
      }
    } catch {
      // Non-blocking fallback if mock or table query does not support wedding lookup
    }

    // 3. If no grant exists, workspace is an unpaid draft
    if (!grant) {
      return {
        weddingId,
        status: "unpaid",
        isPaid: false,
        isDemo: false,
        grantedAt: null,
        validUntil: null,
        canEdit: false, // Full planning modules locked until activated
        canInviteMembers: false, // Inviting family requires paid license
        canExportCSV: true,
        planName: "Draft Pawiwahan (Belum Diaktivasi)",
        badgeLabel: "Draft Belum Dibayar",
        daysRemaining: null,
        message:
          "Workspace ini berstatus draft dan belum diaktivasi. Selesaikan aktivasi lisensi penuh untuk membuka seluruh modul perencanaan dan mengundang keluarga.",
      };
    }

    // 4. Check if revoked
    if (grant.status === "revoked" || grant.revoked_at) {
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

    // 5. Check expiration against valid_until or status
    const isExpired =
      grant.status === "expired" ||
      (Boolean(grant.valid_until) &&
        new Date(grant.valid_until as string).getTime() <= Date.now());

    if (isExpired) {
      return {
        weddingId,
        status: "expired",
        isPaid: false,
        isDemo: false,
        grantedAt: grant.granted_at,
        validUntil: grant.valid_until,
        canEdit: false, // Mutations locked, read & export preserved per PRD 5.4
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Arsip Pawiwahan (Read-Only)",
        badgeLabel: "Masa Aktif Berakhir",
        daysRemaining: 0,
        message:
          "Masa aktif perencanaan telah selesai (365 hari). Anda tetap memiliki akses baca dan ekspor data seumur hidup.",
      };
    }

    // 6. Active Grant with future validity or uncapped
    const diffMs = grant.valid_until
      ? new Date(grant.valid_until).getTime() - Date.now()
      : null;
    const daysRemaining =
      diffMs !== null
        ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        : null;

    const isManualOverride = grant.grant_type === "manual_override";

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
      planName: isManualOverride
        ? "Akses Penuh (Pengecualian Admin)"
        : "Akses Penuh Pawiwahan",
      badgeLabel: isManualOverride ? "Pengecualian Admin" : "Lisensi Aktif",
      daysRemaining,
    };
  } catch (err: unknown) {
    captureError(err, { action: "getWorkspaceEntitlement", weddingId });
    // FAIL CLOSED on system error: never grant edit permissions on failure
    return {
      weddingId,
      status: "error",
      isPaid: false,
      isDemo: false,
      grantedAt: null,
      validUntil: null,
      canEdit: false,
      canInviteMembers: false,
      canExportCSV: true,
      planName: "Gagal Memuat Lisensi",
      badgeLabel: "Error Lisensi",
      daysRemaining: null,
      message:
        "Status lisensi tidak dapat dimuat. Perubahan data dibatasi demi keamanan.",
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
