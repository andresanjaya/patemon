import { describe, it, expect } from "vitest";
import {
  validateWorkspaceInput,
  formatRupiah,
  formatMarriageForm,
  MARRIAGE_FORMS,
  BALI_REGIONS,
} from "../src/features/workspaces/validation";

describe("Wedding Workspace Validation and Flows", () => {
  describe("validateWorkspaceInput", () => {
    it("validates a minimal valid workspace with only couple names", () => {
      const result = validateWorkspaceInput({
        coupleNames: "Pawiwahan Arya & Ratna",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("validates a complete valid workspace with all attributes set", () => {
      const result = validateWorkspaceInput({
        coupleNames: "Pawiwahan I Gede Dharma & Ni Kadek Shanti",
        groomName: "I Gede Dharma Yoga",
        brideName: "Ni Kadek Shanti Dewi",
        prospectiveDate: "2027-09-15",
        locationRegion: "Gianyar",
        marriageForm: "memadik",
        targetBudget: 75000000,
        notes: "Upacara di Griya Gianyar dengan pamuput Ida Pedanda.",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("allows optional attributes to remain unset (null/undefined)", () => {
      const result = validateWorkspaceInput({
        coupleNames: "Pawiwahan Dharma & Shanti",
        groomName: null,
        brideName: null,
        prospectiveDate: null,
        locationRegion: null,
        targetBudget: 0,
        notes: null,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("rejects empty or whitespace-only couple names", () => {
      const result = validateWorkspaceInput({
        coupleNames: "   ",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.coupleNames).toContain("wajib diisi");
    });

    it("rejects couple names shorter than 2 characters", () => {
      const result = validateWorkspaceInput({
        coupleNames: "A",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.coupleNames).toContain("minimal 2 karakter");
    });

    it("rejects couple names exceeding 150 characters", () => {
      const result = validateWorkspaceInput({
        coupleNames: "A".repeat(151),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.coupleNames).toContain("maksimal 150 karakter");
    });

    it("rejects negative target budget", () => {
      const result = validateWorkspaceInput({
        coupleNames: "Pawiwahan Wayan & Ketut",
        targetBudget: -1000000,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.targetBudget).toContain(
        "tidak boleh bernilai negatif"
      );
    });

    it("rejects invalid marriage form option", () => {
      const result = validateWorkspaceInput({
        coupleNames: "Pawiwahan Wayan & Ketut",
        // @ts-expect-error Testing runtime invalid marriageForm
        marriageForm: "invalid_form",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.marriageForm).toContain("tidak valid");
    });

    it("rejects malformed prospective date formats", () => {
      const result = validateWorkspaceInput({
        coupleNames: "Pawiwahan Wayan & Ketut",
        prospectiveDate: "15-09-2027", // DD-MM-YYYY instead of YYYY-MM-DD
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.prospectiveDate).toContain("YYYY-MM-DD");
    });
  });

  describe("formatRupiah", () => {
    it("formats 0 or NaN as Rp 0", () => {
      expect(formatRupiah(0)).toBe("Rp 0");
      expect(formatRupiah(NaN)).toBe("Rp 0");
    });

    it("formats amounts into Indonesian currency representation", () => {
      const formatted = formatRupiah(50000000);
      expect(formatted).toContain("50.000.000");
    });
  });

  describe("formatMarriageForm", () => {
    it("formats marriage forms with customary Indonesian labels", () => {
      expect(formatMarriageForm("memadik")).toBe("Memadik / Ngidih");
      expect(formatMarriageForm("ngerorod")).toBe("Ngerorod / Rangkat");
      expect(formatMarriageForm("nyentana")).toBe("Nyentana");
      expect(formatMarriageForm("custom")).toBe("Kustom / Campuran");
    });
  });

  describe("Marriage Form & Bali Region Constants", () => {
    it("provides the four recognized Balinese marriage forms with descriptions", () => {
      expect(MARRIAGE_FORMS).toHaveLength(4);
      const values = MARRIAGE_FORMS.map((f) => f.value);
      expect(values).toEqual(["memadik", "ngerorod", "nyentana", "custom"]);
    });

    it("covers the 9 regencies/cities of Bali and diaspora", () => {
      expect(BALI_REGIONS).toContain("Denpasar");
      expect(BALI_REGIONS).toContain("Badung");
      expect(BALI_REGIONS).toContain("Gianyar");
      expect(BALI_REGIONS).toContain("Tabanan");
      expect(BALI_REGIONS).toContain("Klungkung");
      expect(BALI_REGIONS).toContain("Bangli");
      expect(BALI_REGIONS).toContain("Karangasem");
      expect(BALI_REGIONS).toContain("Buleleng");
      expect(BALI_REGIONS).toContain("Jembrana");
      expect(BALI_REGIONS).toContain("Luar Bali / Rantau");
    });
  });
});
