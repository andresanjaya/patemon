/**
 * Reminder Engine for Patemon MVP 2 (Issue #84)
 * Evaluates pending tasks and upcoming budget payments against due dates
 * using Asia/Makassar (WITA) calendar day calculations.
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";
import { checkFeatureAccess } from "@/features/payments/entitlements";
import type {
  ReminderDispatchLog,
  ReminderDispatchResult,
  ReminderPreferences,
  ReminderTier,
} from "./types";
import {
  diffCalendarDays,
  formatWitaDateReadable,
  generateReminderIdempotencyKey,
  getTierForDiffDays,
  getWitaDateString,
} from "./utils";
import {
  getInMemoryDispatchLog,
  recordInMemoryDispatchLog,
  sendReminderEmail,
} from "./dispatcher";

export const DEFAULT_REMINDER_TIERS: ReminderTier[] = ["H-7", "H-1"];

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  weddingId: "",
  userId: null,
  emailNotificationsEnabled: true,
  taskRemindersEnabled: true,
  paymentRemindersEnabled: true,
  reminderTiers: DEFAULT_REMINDER_TIERS,
  updatedAt: new Date().toISOString(),
};

/**
 * Fetch reminder preferences for a specific wedding workspace.
 * Falls back to default enabled preferences if not explicitly customized yet.
 */
export async function getReminderPreferences(
  weddingId: string,
  userId?: string | null
): Promise<ReminderPreferences> {
  if (weddingId === "demo") {
    return {
      ...DEFAULT_REMINDER_PREFERENCES,
      weddingId: "demo",
    };
  }

  const supabase = await createClient();
  let query = supabase
    .from("wedding_reminder_preferences")
    .select("*")
    .eq("wedding_id", weddingId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return {
      ...DEFAULT_REMINDER_PREFERENCES,
      weddingId,
      userId: userId || null,
    };
  }

  return {
    weddingId: data.wedding_id,
    userId: data.user_id,
    emailNotificationsEnabled: data.email_notifications_enabled ?? true,
    taskRemindersEnabled: data.task_reminders_enabled ?? true,
    paymentRemindersEnabled: data.payment_reminders_enabled ?? true,
    reminderTiers:
      (data.reminder_tiers as unknown as ReminderTier[]) ||
      DEFAULT_REMINDER_TIERS,
    updatedAt: data.updated_at || new Date().toISOString(),
  };
}

/**
 * Main Engine Evaluator: Scans due items for a wedding workspace and dispatches
 * idempotent notifications for applicable reminder tiers.
 */
export async function evaluateAndDispatchReminders(params: {
  weddingId: string;
  referenceDate?: Date; // For deterministic simulation & tests
  baseUrl?: string;
  isMockMode?: boolean;
}): Promise<ReminderDispatchResult> {
  const {
    weddingId,
    referenceDate,
    baseUrl = "https://patemon.vercel.app",
  } = params;

  // 1. Entitlement & Freeze Guard
  const access = await checkFeatureAccess(weddingId, "edit");
  if (!access.allowed) {
    logger.warn(
      "Reminder evaluation skipped: workspace access not entitled or frozen",
      {
        weddingId,
        reason: access.reason,
      }
    );
    return { dispatched: 0, skipped: 0, failed: 0, logs: [] };
  }

  // 2. Load Preferences
  const preferences = await getReminderPreferences(weddingId);
  if (!preferences.emailNotificationsEnabled) {
    logger.info(
      "Reminder evaluation skipped: user opted out of email notifications",
      {
        weddingId,
      }
    );
    return { dispatched: 0, skipped: 0, failed: 0, logs: [] };
  }

  const todayWita = getWitaDateString(referenceDate);
  const result: ReminderDispatchResult = {
    dispatched: 0,
    skipped: 0,
    failed: 0,
    logs: [],
  };

  const supabase = await createClient();

  // 3. Fetch Workspace & Active Members
  const { data: weddingData } = await supabase
    .from("weddings")
    .select("couple_names, groom_name, bride_name")
    .eq("id", weddingId)
    .maybeSingle();

  const weddingTitle = weddingData?.couple_names || "Pawiwahan";

  // Fetch active workspace members
  const { data: membersData } = await supabase
    .from("wedding_members")
    .select("user_id, role, status")
    .eq("wedding_id", weddingId)
    .eq("status", "active");

  const activeMembersMap = new Map<string, { role: string }>();
  (membersData || []).forEach((m) => {
    if (m.user_id) {
      activeMembersMap.set(m.user_id, { role: m.role || "viewer" });
    }
  });

  // Fetch profiles for active members
  const activeUserIds = Array.from(activeMembersMap.keys());
  const profilesMap = new Map<string, { name: string; email: string }>();

  if (activeUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", activeUserIds);

    (profiles || []).forEach((p) => {
      profilesMap.set(p.id, {
        name: p.full_name || "Keluarga Pawiwahan",
        email: p.email || "",
      });
    });
  }

  // Demo Fallback Profiles
  if (weddingId === "demo" && profilesMap.size === 0) {
    profilesMap.set("demo-u1", {
      name: "I Putu Wira",
      email: "putu.wira@example.com",
    });
    profilesMap.set("demo-u2", {
      name: "Ni Made Rai",
      email: "made.rai@example.com",
    });
    activeMembersMap.set("demo-u1", { role: "owner" });
    activeMembersMap.set("demo-u2", { role: "editor" });
  }

  // ==========================================
  // 4. Evaluate Tasks (wedding_tasks)
  // ==========================================
  if (preferences.taskRemindersEnabled) {
    const { data: tasks } = await supabase
      .from("wedding_tasks")
      .select("id, title, due_date, status, assigned_to_user_id, assignee_name")
      .eq("wedding_id", weddingId)
      .not("due_date", "is", null);

    const validTasks = (tasks || []).filter(
      (t) => t.status !== "done" && t.status !== "canceled" && t.due_date
    );

    for (const task of validTasks) {
      // Must be assigned to an active workspace user
      if (!task.assigned_to_user_id) continue;
      if (!activeMembersMap.has(task.assigned_to_user_id)) {
        logger.info(
          "Skipping task reminder: assignee revoked or inactive in workspace",
          {
            taskId: task.id,
            assignedToUserId: task.assigned_to_user_id,
          }
        );
        continue;
      }

      const recipient = profilesMap.get(task.assigned_to_user_id);
      if (!recipient || !recipient.email) continue;

      const diffDays = diffCalendarDays(todayWita, task.due_date!);
      const tier = getTierForDiffDays(diffDays);

      if (!tier || !preferences.reminderTiers.includes(tier)) {
        continue; // Not within scheduled reminder tiers
      }

      const idempotencyKey = generateReminderIdempotencyKey(
        "task",
        task.id,
        recipient.email,
        tier,
        task.due_date!
      );

      // Check Deduplication / Idempotency
      const existingInMemory = getInMemoryDispatchLog(idempotencyKey);
      if (existingInMemory && existingInMemory.status === "sent") {
        result.skipped++;
        continue;
      }

      // Check DB log if table exists
      const { data: dbLog } = await supabase
        .from("wedding_reminder_logs")
        .select("id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (dbLog && dbLog.status === "sent") {
        result.skipped++;
        continue;
      }

      // Send Email
      const emailSendResult = await sendReminderEmail(
        {
          to: recipient.email,
          recipientName: recipient.name,
          subject: `[Patemon] Pengingat Tugas: "${task.title}" (${tier})`,
          weddingTitle,
          itemType: "task",
          itemTitle: task.title,
          dueDate: `${formatWitaDateReadable(task.due_date!)} (WITA)`,
          daysRemaining: diffDays,
          actionUrl: `${baseUrl}/workspace/${weddingId}/tasks?view=my_tasks`,
        },
        { isMockMode: params.isMockMode }
      );

      const logEntry: ReminderDispatchLog = {
        id: `rem-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        weddingId,
        itemType: "task",
        itemId: task.id,
        itemTitle: task.title,
        recipientEmail: recipient.email,
        recipientUserId: task.assigned_to_user_id,
        recipientName: recipient.name,
        reminderTier: tier,
        targetDueDate: task.due_date!,
        idempotencyKey,
        status: emailSendResult.success ? "sent" : "failed",
        retryCount: emailSendResult.attempts,
        errorMessage: emailSendResult.error || null,
        sentAt: emailSendResult.success ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      };

      recordInMemoryDispatchLog(logEntry);

      // Best effort DB log record
      try {
        await supabase.from("wedding_reminder_logs").upsert(
          {
            wedding_id: weddingId,
            item_type: "task",
            item_id: task.id,
            item_title: task.title,
            recipient_email: recipient.email,
            recipient_user_id: task.assigned_to_user_id,
            recipient_name: recipient.name,
            reminder_tier: tier,
            target_due_date: task.due_date!,
            idempotency_key: idempotencyKey,
            status: logEntry.status,
            retry_count: logEntry.retryCount,
            error_message: logEntry.errorMessage,
            sent_at: logEntry.sentAt,
          },
          { onConflict: "idempotency_key" }
        );
      } catch {
        // Fallback to in-memory log
      }

      result.logs.push(logEntry);
      if (emailSendResult.success) {
        result.dispatched++;
      } else {
        result.failed++;
      }
    }
  }

  // ==========================================
  // 5. Evaluate Budget Payments (budget_items)
  // ==========================================
  if (preferences.paymentRemindersEnabled) {
    // Find owners to notify for budget payment due dates
    const ownerEntry = Array.from(activeMembersMap.entries()).find(
      ([, data]) => data.role === "owner"
    );
    const ownerUserId = ownerEntry ? ownerEntry[0] : activeUserIds[0];
    const ownerProfile = ownerUserId ? profilesMap.get(ownerUserId) : null;

    if (ownerProfile && ownerProfile.email) {
      // Check tasks tagged as category 'budget' or budget payments with scheduled dates
      const { data: budgetTasks } = await supabase
        .from("wedding_tasks")
        .select("id, title, due_date, status, category")
        .eq("wedding_id", weddingId)
        .eq("category", "budget")
        .not("due_date", "is", null);

      const dueBudgetTasks = (budgetTasks || []).filter(
        (t) =>
          t.category === "budget" &&
          t.status !== "done" &&
          t.status !== "canceled" &&
          t.due_date
      );

      for (const bTask of dueBudgetTasks) {
        const diffDays = diffCalendarDays(todayWita, bTask.due_date!);
        const tier = getTierForDiffDays(diffDays);

        if (!tier || !preferences.reminderTiers.includes(tier)) continue;

        const idempotencyKey = generateReminderIdempotencyKey(
          "budget_payment",
          bTask.id,
          ownerProfile.email,
          tier,
          bTask.due_date!
        );

        const existingInMemory = getInMemoryDispatchLog(idempotencyKey);
        if (existingInMemory && existingInMemory.status === "sent") {
          result.skipped++;
          continue;
        }

        const emailSendResult = await sendReminderEmail(
          {
            to: ownerProfile.email,
            recipientName: ownerProfile.name,
            subject: `[Patemon] Pengingat Jatuh Tempo Pembayaran: "${bTask.title}" (${tier})`,
            weddingTitle,
            itemType: "budget_payment",
            itemTitle: bTask.title,
            dueDate: `${formatWitaDateReadable(bTask.due_date!)} (WITA)`,
            daysRemaining: diffDays,
            actionUrl: `${baseUrl}/workspace/${weddingId}/budget`,
          },
          { isMockMode: params.isMockMode }
        );

        const logEntry: ReminderDispatchLog = {
          id: `rem-log-bg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          weddingId,
          itemType: "budget_payment",
          itemId: bTask.id,
          itemTitle: bTask.title,
          recipientEmail: ownerProfile.email,
          recipientUserId: ownerUserId,
          recipientName: ownerProfile.name,
          reminderTier: tier,
          targetDueDate: bTask.due_date!,
          idempotencyKey,
          status: emailSendResult.success ? "sent" : "failed",
          retryCount: emailSendResult.attempts,
          errorMessage: emailSendResult.error || null,
          sentAt: emailSendResult.success ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
        };

        recordInMemoryDispatchLog(logEntry);
        result.logs.push(logEntry);
        if (emailSendResult.success) {
          result.dispatched++;
        } else {
          result.failed++;
        }
      }
    }
  }

  return result;
}
