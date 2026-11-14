/**
 * Ceremony & Adat Flow Domain Types
 * Corresponds to Issue #14 (Database Schema), Issue #16 (Ritual Seed Data), and Issue #20 (Ceremony Onboarding)
 */

export type CeremonyRequirementClass =
  "common" | "conditional" | "requires_validation";

export type ValidationStatus =
  | "Tervalidasi Literatur Adat"
  | "Perlu validasi keluarga/pemangku"
  | "Belum diverifikasi serati/pemangku";

export interface CeremonyTemplate {
  id: string;
  phase: string;
  name: string;
  aliases: string[];
  description: string;
  applicability: string;
  defaultPic: string | null;
  validationStatus: string;
  sourceId: string | null;
  sourceUrl: string | null;
  orderIndex: number;
  isActive: boolean;
}

export interface WeddingCeremony {
  id: string;
  weddingId: string;
  templateId?: string | null;
  title: string;
  phase?: string | null;
  description?: string | null;
  customNotes?: string | null;
  scheduledDate: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location: string | null;
  personInCharge: string | null;
  orderIndex: number;
  status: "draft" | "confirmed" | "completed" | "skipped";
}

export interface RundownEvent {
  id: string;
  weddingId: string;
  ceremonyId: string | null;
  segmentTitle: string;
  scheduledDate?: string | null;
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  location?: string | null;
  personInCharge?: string | null;
  orderIndex: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CeremonyRitualItem {
  id: string;
  weddingId: string;
  ceremonyId: string | null;
  catalogId?: string | null;
  name: string;
  category?: string | null;
  quantity: number;
  unit: string;
  sourcingMethod:
    "self_made" | "purchased_package" | "family_assigned" | "vendor_order";
  status: "needed" | "ordered" | "making" | "ready" | "not_needed";
  assigneeName?: string | null;
  estimatedPrice: number;
  actualPrice: number;
  notes?: string | null;
}

export interface CeremonyDetail extends WeddingCeremony {
  template?: CeremonyTemplate | null;
  rundownEvents: RundownEvent[];
  ritualItems: CeremonyRitualItem[];
}

export interface RundownEvent {
  id: string;
  weddingId: string;
  ceremonyId: string | null;
  segmentTitle: string;
  scheduledDate?: string | null;
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  location?: string | null;
  personInCharge?: string | null;
  orderIndex: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CeremonyRitualItem {
  id: string;
  weddingId: string;
  ceremonyId: string | null;
  catalogId?: string | null;
  name: string;
  category?: string | null;
  quantity: number;
  unit: string;
  sourcingMethod:
    "self_made" | "purchased_package" | "family_assigned" | "vendor_order";
  status: "needed" | "ordered" | "making" | "ready" | "not_needed";
  assigneeName?: string | null;
  estimatedPrice: number;
  actualPrice: number;
  notes?: string | null;
}

export interface CeremonyDetail extends WeddingCeremony {
  template?: CeremonyTemplate | null;
  rundownEvents: RundownEvent[];
  ritualItems: CeremonyRitualItem[];
}
