"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "./auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureError, logger } from "@/lib/observability/logger";
import type {
  AdminAccountSummary,
  AdminWeddingSummary,
  AdminOrderDetail,
  AdminAccessGrant,
  AdminAuditLog,
  GrantOverrideInput,
  RevokeGrantInput,
  FreezeWeddingInput,
  ReconcileOrderInput,
  AdminActivateManualPaymentInput,
} from "./types";

export async function listAdminAccountsAction(page = 1): Promise<{
  success: boolean;
  users: AdminAccountSummary[];
  total: number;
  page: number;
  hasMore: boolean;
  error?: string;
}> {
  try {
    await assertAdminSession();
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new Error("Halaman akun tidak valid.");
    }

    const { data, error } = await createAdminClient().auth.admin.listUsers({
      page,
      perPage: 50,
    });
    if (error) throw error;

    return {
      success: true,
      users: data.users.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : null,
        providers: (user.identities ?? []).map((identity) => identity.provider),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
      })),
      total: data.total,
      page,
      hasMore: page * 50 < data.total,
    };
  } catch (err) {
    captureError(err, { action: "listAdminAccountsAction" });
    return {
      success: false,
      users: [],
      total: 0,
      page,
      hasMore: false,
      error: "Daftar akun gagal dimuat. Coba lagi atau periksa akses admin.",
    };
  }
}

function generateCorrelationId(): string {
  return `CORR-ADM-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;
}

/**
 * Searches and lists weddings with their operational license and order statuses.
 * Enforces data minimization: does not load guests, vows, or sensitive family documents.
 */
export async function searchAdminWeddingsAction(query = ""): Promise<{
  success: boolean;
  weddings: AdminWeddingSummary[];
  error?: string;
}> {
  try {
    await assertAdminSession();
    const adminClient = createAdminClient();

    let weddingsQuery = adminClient
      .from("weddings")
      .select(
        "id, slug, couple_names, location_region, prospective_date, is_frozen, frozen_reason, frozen_at, frozen_by, created_at, created_by"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    const trimmed = query.trim();
    if (trimmed) {
      weddingsQuery = weddingsQuery.or(
        `couple_names.ilike.%${trimmed}%,slug.ilike.%${trimmed}%,id.eq.${trimmed}`
      );
    }

    const { data: weddings, error: weddingsError } = await weddingsQuery;

    if (weddingsError) {
      captureError(weddingsError, { action: "searchAdminWeddingsAction" });
      return { success: false, weddings: [], error: weddingsError.message };
    }

    if (!weddings || weddings.length === 0) {
      return { success: true, weddings: [] };
    }

    const weddingIds = weddings.map((w) => w.id);

    // Fetch latest access grants for each wedding
    const { data: grants } = await adminClient
      .from("access_grants")
      .select(
        "id, wedding_id, status, grant_type, granted_by, override_reason, granted_at, valid_until"
      )
      .in("wedding_id", weddingIds)
      .order("granted_at", { ascending: false });

    // Fetch checkout orders for each wedding
    const { data: orders } = await adminClient
      .from("checkout_orders")
      .select("id, wedding_id, order_number, amount, status, created_at")
      .in("wedding_id", weddingIds)
      .order("created_at", { ascending: false });

    // Fetch owner profiles for each wedding
    const ownerUserIds = weddings
      .map((w) => w.created_by)
      .filter((id): id is string => Boolean(id));

    let profilesMap = new Map<
      string,
      { email: string | null; full_name: string | null }
    >();
    if (ownerUserIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ownerUserIds);

      if (profiles) {
        profilesMap = new Map(profiles.map((p) => [p.id, p]));
      }
    }

    // Map each wedding into an operational summary
    const summaries: AdminWeddingSummary[] = weddings.map((w) => {
      const latestGrant = grants?.find((g) => g.wedding_id === w.id);
      const weddingOrders = orders?.filter((o) => o.wedding_id === w.id) || [];
      const latestOrder = weddingOrders[0] || null;
      const owner = w.created_by ? profilesMap.get(w.created_by) : null;

      let licenseStatus: AdminWeddingSummary["licenseStatus"] = "unpaid";
      if (latestGrant) {
        if (latestGrant.status === "revoked") {
          licenseStatus = "revoked";
        } else if (latestGrant.status === "expired") {
          licenseStatus = "expired";
        } else if (
          latestGrant.status === "active" &&
          (!latestGrant.valid_until ||
            new Date(latestGrant.valid_until).getTime() > Date.now())
        ) {
          licenseStatus = "active";
        } else {
          licenseStatus = "expired";
        }
      }

      return {
        weddingId: w.id,
        slug: w.slug,
        coupleNames: w.couple_names,
        ownerEmail: owner?.email || null,
        ownerName: owner?.full_name || null,
        locationRegion: w.location_region,
        prospectiveDate: w.prospective_date,
        isFrozen: w.is_frozen || false,
        frozenReason: w.frozen_reason || null,
        frozenAt: w.frozen_at || null,
        frozenBy: w.frozen_by || null,
        createdAt: w.created_at,
        licenseStatus,
        grantType:
          (latestGrant?.grant_type as AdminWeddingSummary["grantType"]) || null,
        grantedBy: latestGrant?.granted_by || null,
        overrideReason: latestGrant?.override_reason || null,
        totalOrders: weddingOrders.length,
        lastOrder: latestOrder
          ? {
              orderNumber: latestOrder.order_number,
              amount: latestOrder.amount,
              status: latestOrder.status,
              createdAt: latestOrder.created_at,
            }
          : null,
      };
    });

    return { success: true, weddings: summaries };
  } catch (err) {
    captureError(err, { action: "searchAdminWeddingsAction" });
    return {
      success: false,
      weddings: [],
      error:
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar wedding admin.",
    };
  }
}

/**
 * Retrieves full operational detail for a single wedding (orders, grants, audit logs).
 */
export async function getAdminWeddingDetailAction(weddingId: string): Promise<{
  success: boolean;
  wedding?: AdminWeddingSummary;
  orders?: AdminOrderDetail[];
  grants?: AdminAccessGrant[];
  auditLogs?: AdminAuditLog[];
  error?: string;
}> {
  try {
    await assertAdminSession();
    const adminClient = createAdminClient();

    const { data: wedding, error: weddingError } = await adminClient
      .from("weddings")
      .select(
        "id, slug, couple_names, location_region, prospective_date, is_frozen, frozen_reason, frozen_at, frozen_by, created_at, created_by"
      )
      .eq("id", weddingId)
      .maybeSingle();

    if (weddingError || !wedding) {
      return { success: false, error: "Wedding workspace tidak ditemukan." };
    }

    // Owner profile
    let ownerEmail: string | null = null;
    let ownerName: string | null = null;
    if (wedding.created_by) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("email, full_name")
        .eq("id", wedding.created_by)
        .maybeSingle();
      if (profile) {
        ownerEmail = profile.email;
        ownerName = profile.full_name;
      }
    }

    // Orders
    const { data: orders } = await adminClient
      .from("checkout_orders")
      .select(
        "id, order_number, wedding_id, amount, status, payment_type, transaction_time, settlement_time, created_at, updated_at"
      )
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false });

    // Grants
    const { data: grants } = await adminClient
      .from("access_grants")
      .select(
        "id, wedding_id, order_id, status, grant_type, granted_by, override_reason, reference_proof, granted_at, valid_until, revoked_at"
      )
      .eq("wedding_id", weddingId)
      .order("granted_at", { ascending: false });

    // Audit logs
    const { data: auditLogs } = await adminClient
      .from("admin_audit_logs")
      .select(
        "id, admin_user_id, admin_email, action, target_type, target_id, reason, reference_note, before_state, after_state, correlation_id, created_at"
      )
      .eq("target_type", "wedding")
      .eq("target_id", weddingId)
      .order("created_at", { ascending: false })
      .limit(20);

    const latestGrant = grants?.[0] || null;
    let licenseStatus: AdminWeddingSummary["licenseStatus"] = "unpaid";
    if (latestGrant) {
      if (latestGrant.status === "revoked") {
        licenseStatus = "revoked";
      } else if (latestGrant.status === "expired") {
        licenseStatus = "expired";
      } else if (
        latestGrant.status === "active" &&
        (!latestGrant.valid_until ||
          new Date(latestGrant.valid_until).getTime() > Date.now())
      ) {
        licenseStatus = "active";
      } else {
        licenseStatus = "expired";
      }
    }

    const summary: AdminWeddingSummary = {
      weddingId: wedding.id,
      slug: wedding.slug,
      coupleNames: wedding.couple_names,
      ownerEmail,
      ownerName,
      locationRegion: wedding.location_region,
      prospectiveDate: wedding.prospective_date,
      isFrozen: wedding.is_frozen || false,
      frozenReason: wedding.frozen_reason || null,
      frozenAt: wedding.frozen_at || null,
      frozenBy: wedding.frozen_by || null,
      createdAt: wedding.created_at,
      licenseStatus,
      grantType:
        (latestGrant?.grant_type as AdminWeddingSummary["grantType"]) || null,
      grantedBy: latestGrant?.granted_by || null,
      overrideReason: latestGrant?.override_reason || null,
      totalOrders: orders?.length || 0,
      lastOrder: orders?.[0]
        ? {
            orderNumber: orders[0].order_number,
            amount: orders[0].amount,
            status: orders[0].status,
            createdAt: orders[0].created_at,
          }
        : null,
    };

    const mappedOrders: AdminOrderDetail[] = (orders || []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      weddingId: o.wedding_id,
      amount: o.amount,
      status: o.status,
      paymentType: o.payment_type,
      transactionTime: o.transaction_time,
      settlementTime: o.settlement_time,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    const mappedGrants: AdminAccessGrant[] = (grants || []).map((g) => ({
      id: g.id,
      weddingId: g.wedding_id,
      orderId: g.order_id,
      status: g.status as "active" | "expired" | "revoked",
      grantType: (g.grant_type as AdminAccessGrant["grantType"]) || "payment",
      grantedBy: g.granted_by,
      overrideReason: g.override_reason,
      referenceProof: g.reference_proof,
      grantedAt: g.granted_at,
      validUntil: g.valid_until,
      revokedAt: g.revoked_at,
    }));

    const mappedAuditLogs: AdminAuditLog[] = (auditLogs || []).map((l) => ({
      id: l.id,
      adminUserId: l.admin_user_id,
      adminEmail: l.admin_email,
      action: l.action as AdminAuditLog["action"],
      targetType: l.target_type as AdminAuditLog["targetType"],
      targetId: l.target_id,
      reason: l.reason,
      referenceNote: l.reference_note,
      beforeState: l.before_state,
      afterState: l.after_state,
      correlationId: l.correlation_id,
      createdAt: l.created_at,
    }));

    return {
      success: true,
      wedding: summary,
      orders: mappedOrders,
      grants: mappedGrants,
      auditLogs: mappedAuditLogs,
    };
  } catch (err) {
    captureError(err, { action: "getAdminWeddingDetailAction", weddingId });
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal memuat detail wedding admin.",
    };
  }
}

/**
 * Grants a manual operational access exception to a wedding workspace.
 * Strict Guardrails (Issue #81):
 * - Does NOT mark any order as 'settlement' (preserves genuine financial status).
 * - Records operator identity, explicit reason (>= 10 chars), reference proof id, duration, and correlation ID.
 * - If any order was refunded or chargebacked, explicitly validates that reason documents this exception.
 */
export async function grantAccessOverrideAction(
  input: GrantOverrideInput
): Promise<{
  success: boolean;
  grantId?: string;
  correlationId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const { adminEmail, adminUserId } = await assertAdminSession();

    const trimmedReason = input.reason?.trim() || "";
    const trimmedProof = input.referenceProof?.trim() || "";

    if (trimmedReason.length < 10) {
      return {
        success: false,
        error:
          "Alasan pengecualian akses manual wajib diisi minimal 10 karakter.",
      };
    }

    if (trimmedProof.length < 3) {
      return {
        success: false,
        error:
          "Nomor referensi bukti/tiket dukungan wajib diisi minimal 3 karakter.",
      };
    }

    if (
      typeof input.durationDays === "number" &&
      (input.durationDays < 1 || input.durationDays > 540)
    ) {
      return {
        success: false,
        error:
          "Durasi akses manual harus berada dalam rentang 1 hingga 540 hari.",
      };
    }

    const durationDays = input.durationDays || 365;
    const validUntilDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );

    const adminClient = createAdminClient();

    // Check wedding existence and frozen state
    const { data: wedding, error: weddingErr } = await adminClient
      .from("weddings")
      .select("id, couple_names, is_frozen")
      .eq("id", input.weddingId)
      .maybeSingle();

    if (weddingErr || !wedding) {
      return { success: false, error: "Wedding workspace tidak ditemukan." };
    }

    if (wedding.is_frozen) {
      return {
        success: false,
        error:
          "Workspace sedang dibekukan. Batalkan pembekuan terlebih dahulu sebelum memberikan akses.",
      };
    }

    // Check if any order was refunded
    const { data: refundedOrder } = await adminClient
      .from("checkout_orders")
      .select("order_number, status")
      .eq("wedding_id", input.weddingId)
      .eq("status", "cancel")
      .maybeSingle();

    if (refundedOrder && !trimmedReason.toLowerCase().includes("refund")) {
      return {
        success: false,
        error:
          "Workspace ini memiliki pesanan yang dibatalkan/direfund. Alasan override wajib mencantumkan verifikasi refund terkait.",
      };
    }

    // Fetch before state of active grants
    const { data: existingActiveGrant } = await adminClient
      .from("access_grants")
      .select("*")
      .eq("wedding_id", input.weddingId)
      .eq("status", "active")
      .maybeSingle();

    // Deactivate previous active grant if present
    if (existingActiveGrant) {
      await adminClient
        .from("access_grants")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        })
        .eq("id", existingActiveGrant.id);
    }

    // Insert new manual override access grant
    const { data: newGrant, error: grantError } = await adminClient
      .from("access_grants")
      .insert({
        wedding_id: input.weddingId,
        order_id: null, // Strictly null: do not forge a payment order
        status: "active",
        grant_type: "manual_override",
        granted_by: adminEmail,
        override_reason: trimmedReason,
        reference_proof: trimmedProof,
        granted_at: new Date().toISOString(),
        valid_until: validUntilDate.toISOString(),
      })
      .select()
      .single();

    if (grantError || !newGrant) {
      captureError(grantError, { action: "grantAccessOverrideAction", input });
      return {
        success: false,
        error: "Gagal membuat akses pengecualian manual.",
      };
    }

    const correlationId = generateCorrelationId();

    // Record immutable audit log
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminEmail,
      action: "grant_override",
      target_type: "wedding",
      target_id: input.weddingId,
      reason: trimmedReason,
      reference_note: trimmedProof,
      before_state: existingActiveGrant || null,
      after_state: newGrant,
      correlation_id: correlationId,
    });

    logger.info("Platform admin granted manual access override", {
      adminEmail,
      weddingId: input.weddingId,
      correlationId,
      durationDays,
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/weddings/${input.weddingId}`);
    revalidatePath(`/workspace/${input.weddingId}`);

    return {
      success: true,
      grantId: newGrant.id,
      correlationId,
      message: `Akses pengecualian manual berhasil diaktifkan selama ${durationDays} hari (Ref: ${correlationId}).`,
    };
  } catch (err) {
    captureError(err, { action: "grantAccessOverrideAction", input });
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Gagal memberikan akses override.",
    };
  }
}

/**
 * Revokes active access license for a wedding workspace.
 */
export async function revokeAccessGrantAction(
  input: RevokeGrantInput
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { adminEmail, adminUserId } = await assertAdminSession();

    const trimmedReason = input.reason?.trim() || "";
    if (trimmedReason.length < 10) {
      return {
        success: false,
        error: "Alasan pencabutan lisensi wajib diisi minimal 10 karakter.",
      };
    }

    const adminClient = createAdminClient();

    const { data: activeGrant } = await adminClient
      .from("access_grants")
      .select("*")
      .eq("wedding_id", input.weddingId)
      .eq("status", "active")
      .maybeSingle();

    if (!activeGrant) {
      return {
        success: false,
        error: "Tidak ditemukan lisensi aktif untuk dicabut pada wedding ini.",
      };
    }

    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("access_grants")
      .update({
        status: "revoked",
        revoked_at: now,
      })
      .eq("id", activeGrant.id);

    if (updateError) {
      captureError(updateError, { action: "revokeAccessGrantAction", input });
      return {
        success: false,
        error: "Gagal memperbarui status lisensi di database.",
      };
    }

    const correlationId = generateCorrelationId();

    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminEmail,
      action: "revoke_grant",
      target_type: "wedding",
      target_id: input.weddingId,
      reason: trimmedReason,
      reference_note: null,
      before_state: activeGrant,
      after_state: { ...activeGrant, status: "revoked", revoked_at: now },
      correlation_id: correlationId,
    });

    logger.info("Platform admin revoked workspace license grant", {
      adminEmail,
      weddingId: input.weddingId,
      correlationId,
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/weddings/${input.weddingId}`);
    revalidatePath(`/workspace/${input.weddingId}`);

    return {
      success: true,
      message: `Lisensi workspace berhasil dicabut (Ref: ${correlationId}).`,
    };
  } catch (err) {
    captureError(err, { action: "revokeAccessGrantAction", input });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal mencabut lisensi.",
    };
  }
}

/**
 * Freezes / suspends a wedding workspace (locks all mutations and access).
 */
export async function freezeWeddingAction(
  input: FreezeWeddingInput
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { adminEmail, adminUserId } = await assertAdminSession();

    const trimmedReason = input.reason?.trim() || "";
    if (trimmedReason.length < 10) {
      return {
        success: false,
        error: "Alasan pembekuan workspace wajib diisi minimal 10 karakter.",
      };
    }

    const adminClient = createAdminClient();

    const { data: wedding, error: fetchErr } = await adminClient
      .from("weddings")
      .select("id, couple_names, is_frozen")
      .eq("id", input.weddingId)
      .maybeSingle();

    if (fetchErr || !wedding) {
      return { success: false, error: "Wedding workspace tidak ditemukan." };
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await adminClient
      .from("weddings")
      .update({
        is_frozen: true,
        frozen_reason: trimmedReason,
        frozen_at: now,
        frozen_by: adminEmail,
      })
      .eq("id", input.weddingId);

    if (updateErr) {
      captureError(updateErr, { action: "freezeWeddingAction", input });
      return {
        success: false,
        error: "Gagal memperbarui status pembekuan di database.",
      };
    }

    const correlationId = generateCorrelationId();

    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminEmail,
      action: "freeze_wedding",
      target_type: "wedding",
      target_id: input.weddingId,
      reason: trimmedReason,
      reference_note: null,
      before_state: wedding,
      after_state: {
        ...wedding,
        is_frozen: true,
        frozen_reason: trimmedReason,
        frozen_at: now,
        frozen_by: adminEmail,
      },
      correlation_id: correlationId,
    });

    logger.info("Platform admin froze wedding workspace", {
      adminEmail,
      weddingId: input.weddingId,
      correlationId,
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/weddings/${input.weddingId}`);
    revalidatePath(`/workspace/${input.weddingId}`);

    return {
      success: true,
      message: `Workspace berhasil dibekukan (Ref: ${correlationId}).`,
    };
  } catch (err) {
    captureError(err, { action: "freezeWeddingAction", input });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membekukan workspace.",
    };
  }
}

/**
 * Unfreezes a previously frozen wedding workspace.
 */
export async function unfreezeWeddingAction(
  inputOrWeddingId: FreezeWeddingInput | string,
  maybeReason?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const weddingId =
    typeof inputOrWeddingId === "string"
      ? inputOrWeddingId
      : inputOrWeddingId.weddingId;
  const reason =
    typeof inputOrWeddingId === "string"
      ? maybeReason || ""
      : inputOrWeddingId.reason;

  try {
    const { adminEmail, adminUserId } = await assertAdminSession();

    const trimmedReason = reason?.trim() || "";
    if (trimmedReason.length < 5) {
      return {
        success: false,
        error: "Alasan pemulihan workspace wajib diisi minimal 5 karakter.",
      };
    }

    const adminClient = createAdminClient();

    const { data: wedding, error: fetchErr } = await adminClient
      .from("weddings")
      .select("id, couple_names, is_frozen, frozen_reason")
      .eq("id", weddingId)
      .maybeSingle();

    if (fetchErr || !wedding) {
      return { success: false, error: "Wedding workspace tidak ditemukan." };
    }

    const { error: updateErr } = await adminClient
      .from("weddings")
      .update({
        is_frozen: false,
        frozen_reason: null,
        frozen_at: null,
        frozen_by: null,
      })
      .eq("id", weddingId);

    if (updateErr) {
      captureError(updateErr, { action: "unfreezeWeddingAction", weddingId });
      return { success: false, error: "Gagal memulihkan status workspace." };
    }

    const correlationId = generateCorrelationId();

    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminEmail,
      action: "unfreeze_wedding",
      target_type: "wedding",
      target_id: weddingId,
      reason: trimmedReason,
      reference_note: null,
      before_state: wedding,
      after_state: {
        ...wedding,
        is_frozen: false,
        frozen_reason: null,
      },
      correlation_id: correlationId,
    });

    logger.info("Platform admin unfroze wedding workspace", {
      adminEmail,
      weddingId,
      correlationId,
    });

    revalidatePath("/admin");
    revalidatePath(`/admin/weddings/${weddingId}`);
    revalidatePath(`/workspace/${weddingId}`);

    return {
      success: true,
      message: `Workspace berhasil dipulihkan (Ref: ${correlationId}).`,
    };
  } catch (err) {
    captureError(err, { action: "unfreezeWeddingAction", weddingId });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memulihkan workspace.",
    };
  }
}

/**
 * Master Admin 1-Click Payment Verification & Workspace Activation.
 * Verifies BCA / QRIS payment received, settles checkout order,
 * issues a 365-day active license grant, and writes audit trails.
 */
export async function adminActivateManualPaymentAction(
  input: AdminActivateManualPaymentInput
): Promise<{
  success: boolean;
  grantId?: string;
  orderId?: string;
  correlationId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const { adminEmail, adminUserId } = await assertAdminSession();
    const adminClient = createAdminClient();

    const durationDays = input.durationDays || 365;
    const validUntilDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );
    const now = new Date().toISOString();
    const correlationId = generateCorrelationId();

    // 1. Verify wedding
    const { data: wedding, error: weddingErr } = await adminClient
      .from("weddings")
      .select("id, couple_names, is_frozen, created_by")
      .eq("id", input.weddingId)
      .maybeSingle();

    if (weddingErr || !wedding) {
      return { success: false, error: "Wedding workspace tidak ditemukan." };
    }

    if (wedding.is_frozen) {
      return {
        success: false,
        error:
          "Workspace sedang dibekukan. Batalkan pembekuan terlebih dahulu sebelum mengaktifkan akses.",
      };
    }

    // 2. Resolve target order
    let targetOrderId = input.orderId;
    let targetOrderNumber = input.referenceProof || "";

    if (targetOrderId) {
      const { data: ord } = await adminClient
        .from("checkout_orders")
        .select("id, order_number, status, payment_type")
        .eq("id", targetOrderId)
        .maybeSingle();
      if (ord) {
        targetOrderNumber = ord.order_number;
        await adminClient
          .from("checkout_orders")
          .update({
            status: "settlement",
            settlement_time: now,
            updated_at: now,
            raw_response: {
              verifiedBy: adminEmail,
              verifiedAt: now,
              notes:
                input.notes ||
                "Diverifikasi manual oleh Master Admin (BCA/QRIS)",
            },
          })
          .eq("id", ord.id);
      }
    } else {
      // Find the latest pending order for this wedding
      const { data: pendingOrder } = await adminClient
        .from("checkout_orders")
        .select("id, order_number, status, payment_type")
        .eq("wedding_id", input.weddingId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingOrder) {
        targetOrderId = pendingOrder.id;
        targetOrderNumber = pendingOrder.order_number;
        await adminClient
          .from("checkout_orders")
          .update({
            status: "settlement",
            settlement_time: now,
            updated_at: now,
            raw_response: {
              verifiedBy: adminEmail,
              verifiedAt: now,
              notes:
                input.notes ||
                "Diverifikasi manual oleh Master Admin (BCA/QRIS)",
            },
          })
          .eq("id", pendingOrder.id);
      } else {
        // Create an explicit settled checkout_orders record for audit and bookkeeping
        targetOrderNumber =
          input.referenceProof ||
          `PATEMON-MANUAL-${Date.now().toString(36).toUpperCase()}`;
        const { data: newOrder } = await adminClient
          .from("checkout_orders")
          .insert({
            wedding_id: input.weddingId,
            user_id: wedding.created_by || adminUserId,
            order_number: targetOrderNumber,
            amount: 199000,
            status: "settlement",
            payment_type: "manual_bca",
            settlement_time: now,
            transaction_time: now,
            raw_response: {
              verifiedBy: adminEmail,
              verifiedAt: now,
              notes: input.notes || "Aktivasi langsung Master Admin (BCA/QRIS)",
            },
            created_at: now,
            updated_at: now,
          })
          .select("id")
          .single();

        if (newOrder) {
          targetOrderId = newOrder.id;
        }
      }
    }

    // 3. Revoke any existing active grant
    const { data: existingActiveGrant } = await adminClient
      .from("access_grants")
      .select("*")
      .eq("wedding_id", input.weddingId)
      .eq("status", "active")
      .maybeSingle();

    if (existingActiveGrant) {
      await adminClient
        .from("access_grants")
        .update({
          status: "revoked",
          revoked_at: now,
        })
        .eq("id", existingActiveGrant.id);
    }

    // 4. Create new 365-day active grant
    const notes =
      input.notes || "Aktivasi Pembayaran Manual Master Admin (BCA / QRIS)";
    const referenceProof =
      targetOrderNumber || input.referenceProof || "MANUAL-BCA-QRIS";

    const { data: newGrant, error: grantError } = await adminClient
      .from("access_grants")
      .insert({
        wedding_id: input.weddingId,
        order_id: targetOrderId || null,
        status: "active",
        grant_type: "payment",
        granted_by: adminEmail,
        override_reason: notes,
        reference_proof: referenceProof,
        granted_at: now,
        valid_until: validUntilDate.toISOString(),
      })
      .select()
      .single();

    if (grantError || !newGrant) {
      captureError(grantError, {
        action: "adminActivateManualPaymentAction",
        input,
      });
      return {
        success: false,
        error: "Gagal menerbitkan lisensi akses di database.",
      };
    }

    // 5. Insert admin audit log
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminEmail,
      action: "activate_manual_payment",
      target_type: "wedding",
      target_id: input.weddingId,
      reason: notes,
      reference_note: referenceProof,
      before_state: existingActiveGrant || null,
      after_state: newGrant,
      correlation_id: correlationId,
    });

    // 6. Insert activity log for workspace
    await adminClient.from("activity_logs").insert({
      wedding_id: input.weddingId,
      action: "access_grant.activated_manual",
      entity_type: "access_grant",
      entity_id: newGrant.id,
      details: {
        grantedBy: adminEmail,
        orderId: targetOrderId,
        orderNumber: targetOrderNumber,
        durationDays,
        validUntil: validUntilDate.toISOString(),
        correlationId,
      },
    });

    logger.info(
      "Master Admin activated manual payment and granted workspace access",
      {
        adminEmail,
        weddingId: input.weddingId,
        orderId: targetOrderId,
        grantId: newGrant.id,
        correlationId,
        durationDays,
      }
    );

    revalidatePath("/admin");
    revalidatePath(`/admin/weddings/${input.weddingId}`);
    revalidatePath(`/workspace/${input.weddingId}`);
    revalidatePath(`/workspace/${input.weddingId}/settings`);

    return {
      success: true,
      grantId: newGrant.id,
      orderId: targetOrderId,
      correlationId,
      message: `Akses penuh pawiwahan berhasil diaktifkan selama ${durationDays} hari (Ref: ${correlationId}).`,
    };
  } catch (err) {
    captureError(err, { action: "adminActivateManualPaymentAction", input });
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal mengaktifkan pembayaran manual.",
    };
  }
}

/**
 * Verifies and reconciles a manual payment order from the admin panel.
 */
export async function reconcileOrderAdminAction(
  input: ReconcileOrderInput
): Promise<{
  success: boolean;
  message?: string;
  currentStatus?: string;
  accessGranted?: boolean;
  correlationId?: string;
  error?: string;
}> {
  try {
    const adminClient = createAdminClient();

    const { data: order } = await adminClient
      .from("checkout_orders")
      .select("id, order_number, wedding_id, status")
      .eq("id", input.orderId)
      .maybeSingle();

    if (!order) {
      return { success: false, error: "Pesanan checkout tidak ditemukan." };
    }

    const activationResult = await adminActivateManualPaymentAction({
      weddingId: order.wedding_id,
      orderId: order.id,
      referenceProof: order.order_number,
      notes: input.reason || "Verifikasi manual Master Admin via Konsol Admin",
    });

    return {
      success: activationResult.success,
      message:
        activationResult.message ||
        "Pesanan berhasil diverifikasi dan lisensi diaktifkan.",
      currentStatus: "settlement",
      accessGranted: activationResult.success,
      correlationId: activationResult.correlationId,
      error: activationResult.error,
    };
  } catch (err) {
    captureError(err, { action: "reconcileOrderAdminAction", input });
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menjalankan rekonsiliasi order.",
    };
  }
}

/**
 * Fetches recent audit logs for operational transparency.
 */
export async function getAdminAuditLogsAction(limit = 25): Promise<{
  success: boolean;
  logs: AdminAuditLog[];
  error?: string;
}> {
  try {
    await assertAdminSession();
    const adminClient = createAdminClient();

    const { data: logs, error } = await adminClient
      .from("admin_audit_logs")
      .select(
        "id, admin_user_id, admin_email, action, target_type, target_id, reason, reference_note, before_state, after_state, correlation_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      captureError(error, { action: "getAdminAuditLogsAction" });
      return { success: false, logs: [], error: error.message };
    }

    const mapped: AdminAuditLog[] = (logs || []).map((l) => ({
      id: l.id,
      adminUserId: l.admin_user_id,
      adminEmail: l.admin_email,
      action: l.action as AdminAuditLog["action"],
      targetType: l.target_type as AdminAuditLog["targetType"],
      targetId: l.target_id,
      reason: l.reason,
      referenceNote: l.reference_note,
      beforeState: l.before_state,
      afterState: l.after_state,
      correlationId: l.correlation_id,
      createdAt: l.created_at,
    }));

    return { success: true, logs: mapped };
  } catch (err) {
    captureError(err, { action: "getAdminAuditLogsAction" });
    return {
      success: false,
      logs: [],
      error:
        err instanceof Error ? err.message : "Gagal memuat log audit admin.",
    };
  }
}
