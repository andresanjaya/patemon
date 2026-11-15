/**
 * Wedding Day Rundown Planner Domain Types for Patemon MVP v1 (Issue #31)
 * Covers ordered agenda segments, time windows, locations, linked ceremonies, and family PIC assignments.
 */

export type RundownEventStatus =
  "pending" | "in_progress" | "completed" | "delayed" | "skipped";

export interface RundownEvent {
  id: string;
  weddingId: string;
  ceremonyId: string | null;
  ceremonyTitle?: string | null;
  segmentTitle: string;
  scheduledDate: string | null; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string | null;
  personInCharge: string | null;
  picPhone?: string | null;
  orderIndex: number;
  notes: string | null;
  status?: RundownEventStatus;
  actualStartTime?: string | null; // HH:MM
  actualEndTime?: string | null; // HH:MM
  actualStartAt?: string | null; // ISO timestamp
  actualEndAt?: string | null; // ISO timestamp
  delayMinutes?: number; // Delay against scheduled start time in minutes (+15 = late, -5 = early)
  notesDayOf?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRundownEventInput {
  segmentTitle: string;
  ceremonyId?: string | null;
  scheduledDate?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  personInCharge?: string | null;
  picPhone?: string | null;
  orderIndex?: number;
  notes?: string | null;
  status?: RundownEventStatus;
}

export interface UpdateRundownEventInput {
  segmentTitle?: string;
  ceremonyId?: string | null;
  scheduledDate?: string | null;
  startTime?: string;
  endTime?: string;
  location?: string | null;
  personInCharge?: string | null;
  picPhone?: string | null;
  orderIndex?: number;
  notes?: string | null;
  status?: RundownEventStatus;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  delayMinutes?: number;
  notesDayOf?: string | null;
  expectedUpdatedAt?: string;
}

export interface UpdateRundownStatusInput {
  status?: RundownEventStatus;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  delayMinutes?: number;
  notesDayOf?: string | null;
  expectedUpdatedAt?: string;
}

export interface RundownStats {
  totalEvents: number;
  totalDurationMinutes: number;
  distinctLocations: number;
  distinctPICs: number;
  datesCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  delayedCount: number;
  totalDelayMinutes: number;
}
