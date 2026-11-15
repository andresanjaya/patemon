/**
 * Types for Activity Logs and Change History Auditing (Issue #90)
 */

export type ActorType = "user" | "admin" | "system";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "grant_license"
  | "reminder"
  | string;

export type ActivityEntityType =
  "task" | "rundown" | "budget" | "wedding" | "invitation" | "vendor" | string;

export interface ActivityLog {
  id: string;
  weddingId: string;
  userId: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string | null;
  actorType: ActorType;
  actorName: string | null;
  entityTitle: string | null;
  summary: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface RecordActivityLogInput {
  weddingId: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  entityTitle?: string | null;
  action: ActivityAction;
  actorType?: ActorType;
  actorName?: string | null;
  summary?: string | null;
  details?: Record<string, unknown> | null;
}

export interface ActivityLogFilter {
  entityType?: string;
  actorType?: ActorType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedActivityLogs {
  logs: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
