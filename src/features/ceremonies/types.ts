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
  customNotes?: string | null;
  scheduledDate: string | null;
  location: string | null;
  personInCharge: string | null;
  orderIndex: number;
  status: "draft" | "confirmed" | "completed";
}
