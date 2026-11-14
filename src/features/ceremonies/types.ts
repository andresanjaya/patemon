/**
 * Ceremony & Adat Flow Domain Types
 * Corresponds to future implementation in Issue #16 (Ritual Seed Data) and Issue #20 (Ceremony Onboarding)
 */

export type CeremonyRequirementClass =
  "common" | "conditional" | "requires_validation";

export interface CeremonyTemplate {
  id: string;
  name: string;
  aliases?: string[];
  description: string;
  regionApplicability: string[];
  requirementClass: CeremonyRequirementClass;
  sourceCitation: string;
  validatedBy: string | null;
  validationDate: string | null;
  version: number;
}

export interface WeddingCeremony {
  id: string;
  weddingId: string;
  templateId?: string;
  title: string;
  customNotes?: string;
  scheduledDate: string | null;
  location: string | null;
  personInCharge: string | null;
  orderIndex: number;
  status: "draft" | "confirmed" | "completed";
}
