export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "todo" | "in_progress" | "done" | "canceled";

export type TaskCategory =
  | "adat"
  | "administrasi"
  | "logistik"
  | "busana"
  | "konsumsi"
  | "dokumentasi"
  | "keuangan"
  | "umum";

export interface WeddingTask {
  id: string;
  weddingId: string;
  templateId: string | null;
  ceremonyId: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null; // YYYY-MM-DD
  assignedToUserId: string | null;
  assigneeName: string | null;
  orderIndex: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // joined helper field
  ceremonyTitle?: string | null;
  assignedUser?: {
    id: string;
    fullName: string | null;
    email: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface TaskTemplate {
  id: string;
  phase: string;
  targetTimeline: string;
  category: TaskCategory;
  title: string;
  defaultPic: string;
  applicability: string;
  priority: TaskPriority;
  notes: string;
  sourceUrl?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assignedToUserId?: string | null;
  assigneeName?: string;
  ceremonyId?: string;
  templateId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  assignedToUserId?: string | null;
  assigneeName?: string | null;
  ceremonyId?: string | null;
  orderIndex?: number;
  expectedUpdatedAt?: string;
}

export interface TaskFilterState {
  search: string;
  category: string;
  priority: string;
  status: string;
  ceremonyId: string;
  assignee: string;
  viewMode?: "all" | "my_tasks";
  overdueOnly?: boolean;
  dueTimeline?: "all" | "today" | "this_week" | "overdue";
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  urgent: number;
  completionRate: number;
}

export interface CeremonyOption {
  id: string;
  title: string;
  phase: string | null;
  scheduledDate: string | null;
}
