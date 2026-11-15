/**
 * Server Actions for Deadline Email Reminders (Issue #84)
 * Allows owners/editors to customize reminder schedules, opt-in/opt-out,
 * and review dispatch audit logs.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";
import { checkFeatureAccess } from "@/features/payments/entitlements";
import type { ReminderDispatchLog, ReminderTier } from "./types";
import { evaluateAndDispatchReminders, DEFAULT_REMINDER_TIERS } from "./engine";

export interface ReminderActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Verify caller has write permissions (owner or editor) for the workspace.
 */
async function verifyReminderPermission(weddingId: string): Promise<{
  allowed: boolean;
  userId?: string;
  error?: string;
}> {
  const entitlement = await checkFeatureAccess(weddingId, "edit");
  if (!entitlement.allowed) {
    return {
      allowed: false,
      error: entitlement.reason || "Workspace tidak memiliki hak akses aktif.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    return { allowed: false, error: "Autentikasi diperlukan." };
  }

  if (weddingId === "demo") {
    return { allowed: true, userId: "demo-u1" };
  }

  const { data: member } = await supabase
    .from("wedding_members")
    .select("role, status")
    .eq("wedding_id", weddingId)
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!member || member.status !== "active") {
    return {
      allowed: false,
      error: "Akses ditolak: Anda bukan anggota aktif workspace ini.",
    };
  }

  if (member.role !== "owner" && member.role !== "editor") {
    return {
      allowed: false,
      error:
        "Akses ditolak: Hanya pemilik atau editor yang dapat mengelola pengingat.",
    };
  }

  return { allowed: true, userId: user!.id };
}

/**
 * Update workspace email reminder preferences (opt-in, opt-out, tiers).
 */
export async function updateReminderPreferencesAction(
  weddingId: string,
  _prevState: ReminderActionResult | null,
  formData: FormData
): Promise<ReminderActionResult> {
  try {
    const authCheck = await verifyReminderPermission(weddingId);
    if (!authCheck.allowed) {
      return { success: false, message: authCheck.error! };
    }

    const emailNotificationsEnabled =
      formData.get("emailNotificationsEnabled") === "on";
    const taskRemindersEnabled = formData.get("taskRemindersEnabled") === "on";
    const paymentRemindersEnabled =
      formData.get("paymentRemindersEnabled") === "on";

    const tiers: ReminderTier[] = [];
    if (formData.get("tier_H7") === "on") tiers.push("H-7");
    if (formData.get("tier_H3") === "on") tiers.push("H-3");
    if (formData.get("tier_H1") === "on") tiers.push("H-1");
    if (formData.get("tier_H0") === "on") tiers.push("H-0");

    const reminderTiers = tiers.length > 0 ? tiers : DEFAULT_REMINDER_TIERS;

    if (weddingId !== "demo") {
      const supabase = await createClient();
      await supabase.from("wedding_reminder_preferences").upsert(
        {
          wedding_id: weddingId,
          email_notifications_enabled: emailNotificationsEnabled,
          task_reminders_enabled: taskRemindersEnabled,
          payment_reminders_enabled: paymentRemindersEnabled,
          reminder_tiers: reminderTiers,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "wedding_id" }
      );
    }

    revalidatePath(`/workspace/${weddingId}/settings`);
    return {
      success: true,
      message: "Preferensi pengingat email berhasil diperbarui.",
    };
  } catch (err: unknown) {
    const errMsg =
      err instanceof Error ? err.message : "Gagal memperbarui preferensi.";
    logger.error("Failed to update reminder preferences", {
      weddingId,
      error: errMsg,
    });
    return { success: false, message: errMsg };
  }
}

/**
 * Manually trigger reminder scan and dispatch for this workspace.
 */
export async function triggerManualReminderDispatchAction(
  weddingId: string
): Promise<ReminderActionResult> {
  try {
    const authCheck = await verifyReminderPermission(weddingId);
    if (!authCheck.allowed) {
      return { success: false, message: authCheck.error! };
    }

    const result = await evaluateAndDispatchReminders({
      weddingId,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://patemon.vercel.app",
    });

    revalidatePath(`/workspace/${weddingId}/settings`);
    return {
      success: true,
      message: `Pengecekan selesai: ${result.dispatched} terkirim, ${result.skipped} dilewati (sudah dikirim sebelumnya), ${result.failed} gagal.`,
      data: result,
    };
  } catch (err: unknown) {
    const errMsg =
      err instanceof Error ? err.message : "Gagal memproses pengingat.";
    logger.error("Failed to trigger reminder dispatch", {
      weddingId,
      error: errMsg,
    });
    return { success: false, message: errMsg };
  }
}

/**
 * Fetch recent reminder dispatch logs for auditing.
 */
export async function getReminderAuditLogsAction(
  weddingId: string
): Promise<ReminderDispatchLog[]> {
  try {
    if (weddingId === "demo") {
      return [
        {
          id: "log-demo-1",
          weddingId: "demo",
          itemType: "task",
          itemId: "task-demo-1",
          itemTitle: "Koordinasi Pemangku & Penetapan Dewasa Ayu",
          recipientEmail: "putu.wira@example.com",
          recipientName: "I Putu Wira",
          reminderTier: "H-7",
          targetDueDate: "2026-11-22",
          idempotencyKey: "task:demo-1:putu.wira@example.com:H-7:2026-11-22",
          status: "sent",
          retryCount: 1,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const supabase = await createClient();
    const { data } = await supabase
      .from("wedding_reminder_logs")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("created_at", { ascending: false })
      .limit(10);

    return (data || []).map((row) => ({
      id: row.id,
      weddingId: row.wedding_id,
      itemType: row.item_type,
      itemId: row.item_id,
      itemTitle: row.item_title,
      recipientEmail: row.recipient_email,
      recipientUserId: row.recipient_user_id,
      recipientName: row.recipient_name,
      reminderTier: row.reminder_tier,
      targetDueDate: row.target_due_date,
      idempotencyKey: row.idempotency_key,
      status: row.status,
      retryCount: row.retry_count || 1,
      errorMessage: row.error_message,
      sentAt: row.sent_at,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}
