/**
 * Email Deadline Reminder Domain Types for Patemon MVP 2 (Issue #84)
 * Handles automated deadline reminders for wedding tasks & budget payments
 * with Asia/Makassar (WITA) timezone accuracy and idempotent delivery.
 */

export type ReminderItemType = "task" | "budget_payment";

export type ReminderTier = "H-7" | "H-3" | "H-1" | "H-0";

export type ReminderDispatchStatus = "sent" | "failed" | "skipped";

export interface ReminderPreferences {
  weddingId: string;
  userId?: string | null;
  emailNotificationsEnabled: boolean;
  taskRemindersEnabled: boolean;
  paymentRemindersEnabled: boolean;
  reminderTiers: ReminderTier[]; // e.g. ["H-7", "H-1"]
  updatedAt: string;
}

export interface ReminderDispatchLog {
  id: string;
  weddingId: string;
  itemType: ReminderItemType;
  itemId: string;
  itemTitle: string;
  recipientEmail: string;
  recipientUserId?: string | null;
  recipientName?: string | null;
  reminderTier: ReminderTier;
  targetDueDate: string; // YYYY-MM-DD
  idempotencyKey: string;
  status: ReminderDispatchStatus;
  retryCount: number;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface ReminderDispatchResult {
  dispatched: number;
  skipped: number;
  failed: number;
  logs: ReminderDispatchLog[];
}

export interface EmailPayload {
  to: string;
  recipientName: string;
  subject: string;
  weddingTitle: string;
  itemType: ReminderItemType;
  itemTitle: string;
  dueDate: string; // Formatted readable date
  daysRemaining: number;
  actionUrl: string;
}
