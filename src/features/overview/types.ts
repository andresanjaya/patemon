/**
 * Overview & Readiness Domain Types for Patemon MVP v1 (Issue #32)
 */

export type ReadinessLevel =
  | "persiapan_awal"
  | "dalam_proses"
  | "sebagian_besar_siap"
  | "hampir_matang"
  | "siap_hari_h";

export interface CategoryReadiness {
  category:
    "ceremonies" | "banten" | "tasks" | "budget" | "vendors" | "rundown";
  label: string;
  score: number; // 0 - 100
  weight: number; // Percentage contribution (e.g. 0.25)
  totalItems: number;
  completedItems: number;
  description: string;
}

export interface ReadinessScore {
  overallScore: number; // 0 - 100 integer
  level: ReadinessLevel;
  levelLabel: string;
  levelColor: string;
  summaryText: string;
  categories: {
    ceremonies: CategoryReadiness;
    banten: CategoryReadiness;
    tasks: CategoryReadiness;
    budget: CategoryReadiness;
    vendors: CategoryReadiness;
    rundown: CategoryReadiness;
  };
}

export type CountdownStatus = "upcoming" | "today" | "past" | "not_set";

export interface CountdownInfo {
  status: CountdownStatus;
  daysRemaining: number | null;
  milestoneLabel: string;
  formattedDate: string | null;
  description: string;
}

export type UrgentActionType =
  "task" | "banten" | "vendor" | "ceremony" | "rundown";

export interface UrgentAction {
  id: string;
  type: UrgentActionType;
  title: string;
  description: string;
  priority: "urgent" | "high" | "normal";
  actionUrl: string;
  actionLabel: string;
  dueDate?: string | null;
  isOverdue?: boolean;
}

export interface NextUpcomingCeremony {
  id: string;
  title: string;
  scheduledDate: string | null;
  formattedDate: string | null;
  location: string | null;
  daysUntil: number | null;
  bantenCount: number;
  taskCount: number;
  personInCharge: string | null;
}
