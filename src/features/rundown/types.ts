/**
 * Wedding Day Rundown Planner Domain Types for Patemon MVP v1 (Issue #31)
 * Covers ordered agenda segments, time windows, locations, linked ceremonies, and family PIC assignments.
 */

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
  orderIndex: number;
  notes: string | null;
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
  orderIndex?: number;
  notes?: string | null;
}

export interface UpdateRundownEventInput {
  segmentTitle?: string;
  ceremonyId?: string | null;
  scheduledDate?: string | null;
  startTime?: string;
  endTime?: string;
  location?: string | null;
  personInCharge?: string | null;
  orderIndex?: number;
  notes?: string | null;
}

export interface RundownStats {
  totalEvents: number;
  totalDurationMinutes: number;
  distinctLocations: number;
  distinctPICs: number;
  datesCount: number;
}

