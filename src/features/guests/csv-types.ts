/**
 * CSV Import Domain Types for Guest Management (Issue #85)
 */

import type { Guest, GuestSide, InvitationStatus } from "./types";

export interface ParsedCsvGuestRow {
  originalIndex: number;
  name: string;
  side: GuestSide;
  groupHousehold: string | null;
  headcount: number;
  phone: string | null;
  notes: string | null;
}

export type CsvRowStatus = "valid" | "duplicate" | "invalid";

export interface CsvRowValidation {
  row: ParsedCsvGuestRow;
  status: CsvRowStatus;
  errors: string[];
  isDuplicateWithExisting: boolean;
  isDuplicateWithBatch: boolean;
  duplicateNameMatches?: string[];
}

export interface CsvImportPreview {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  rows: CsvRowValidation[];
}

export interface BatchImportInputRow {
  name: string;
  side?: GuestSide;
  groupHousehold?: string | null;
  headcount?: number;
  phone?: string | null;
  notes?: string | null;
  invitationStatus?: InvitationStatus;
}

export interface BatchImportResult {
  success: boolean;
  message: string;
  totalProcessed: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  guests: Guest[];
}
