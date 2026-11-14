import { describe, it, expect } from "vitest";
import {
  formatReceiptNumber,
  sanitizeWhatsAppPhone,
  formatSupportWhatsAppLink,
  calculateAccessStateDetails,
  SUPPORT_TOPICS,
  DEFAULT_SUPPORT_WHATSAPP_PHONE,
} from "../src/features/payments/support";
import type { WorkspaceEntitlement } from "../src/features/payments/types";

describe("Payment History, Access States & Customer Support Flows (Issue #38)", () => {
  describe("Receipt Number Formatting", () => {
    it("generates standard receipt number with KW prefix", () => {
      const receipt = formatReceiptNumber("ORD-20261114-X89J");
      expect(receipt).toBe("KW-ORD-20261114-X89J");
    });

    it("does not duplicate KW prefix if already present", () => {
      const receipt = formatReceiptNumber("KW-ORD-20261114-X89J");
      expect(receipt).toBe("KW-ORD-20261114-X89J");
    });

    it("returns safe fallback when order number is empty", () => {
      expect(formatReceiptNumber("")).toBe("KW-UNKNOWN");
    });
  });

  describe("WhatsApp Phone Sanitization", () => {
    it("converts Indonesian standard 08xx to international 628xx", () => {
      expect(sanitizeWhatsAppPhone("081234567890")).toBe("6281234567890");
      expect(sanitizeWhatsAppPhone("0812-3456-7890")).toBe("6281234567890");
      expect(sanitizeWhatsAppPhone("+62 812-3456-7890")).toBe("6281234567890");
    });

    it("preserves already normalized 628xx numbers", () => {
      expect(sanitizeWhatsAppPhone("6281234567890")).toBe("6281234567890");
    });

    it("falls back to default support number when phone is null or empty", () => {
      expect(sanitizeWhatsAppPhone(null)).toBe(DEFAULT_SUPPORT_WHATSAPP_PHONE);
      expect(sanitizeWhatsAppPhone("")).toBe(DEFAULT_SUPPORT_WHATSAPP_PHONE);
    });
  });

  describe("WhatsApp Support Link Generation", () => {
    it("builds a fully encoded URL with complete workspace metadata", () => {
      const link = formatSupportWhatsAppLink({
        category: "payment_issue",
        weddingId: "wed-denpasar-01",
        coupleNames: "Wayan & Kadek",
        orderNumber: "ORD-20261114-1234",
        userMessage: "Saya sudah transfer QRIS tapi status masih pending.",
      });

      expect(link).toContain(
        `https://wa.me/${DEFAULT_SUPPORT_WHATSAPP_PHONE}?text=`
      );

      const url = new URL(link);
      const text = decodeURIComponent(url.searchParams.get("text") || "");

      expect(text).toContain("Om Swastyastu Tim Bantuan Patemon Bali");
      expect(text).toContain("Kendala Pembayaran");
      expect(text).toContain("ID Pawiwahan: wed-denpasar-01");
      expect(text).toContain("Nama Mempelai: Wayan & Kadek");
      expect(text).toContain("No. Pesanan / Order ID: ORD-20261114-1234");
      expect(text).toContain(
        "Saya sudah transfer QRIS tapi status masih pending."
      );
      expect(text).toContain("Sukseme / Terima kasih");
    });

    it("supports custom categories and omitted optional parameters", () => {
      const link = formatSupportWhatsAppLink({
        category: "adat_consultation",
        userMessage: "Tanya variasi banten pejati untuk memadik.",
      });

      const url = new URL(link);
      const text = decodeURIComponent(url.searchParams.get("text") || "");

      expect(text).toContain("Konsultasi Adat Pawiwahan");
      expect(text).not.toContain("ID Pawiwahan:");
      expect(text).not.toContain("No. Pesanan / Order ID:");
      expect(text).toContain("Tanya variasi banten pejati untuk memadik.");
    });
  });

  describe("Access State Details & Data Sovereignty", () => {
    it("calculates active lifetime entitlement with full edit & collaboration rights", () => {
      const entitlement: WorkspaceEntitlement = {
        weddingId: "wed-01",
        status: "active",
        isPaid: true,
        isDemo: false,
        grantedAt: "2026-11-01T00:00:00Z",
        validUntil: null,
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        planName: "Akses Penuh Pawiwahan",
        badgeLabel: "Lisensi Aktif",
        daysRemaining: null,
      };

      const details = calculateAccessStateDetails(entitlement);
      expect(details.state).toBe("active_lifetime");
      expect(details.canEdit).toBe(true);
      expect(details.canInviteMembers).toBe(true);
      expect(details.canExportCSV).toBe(true);
      expect(details.daysRemaining).toBeNull();
      expect(details.dataSovereigntyNote).toContain("seumur hidup");
    });

    it("calculates expiring_soon warning when days remaining is between 15 and 30", () => {
      const entitlement: WorkspaceEntitlement = {
        weddingId: "wed-02",
        status: "active",
        isPaid: true,
        isDemo: false,
        grantedAt: "2026-06-01T00:00:00Z",
        validUntil: "2026-12-05T00:00:00Z",
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        planName: "Akses Penuh Pawiwahan",
        badgeLabel: "Lisensi Aktif",
        daysRemaining: 21,
      };

      const details = calculateAccessStateDetails(entitlement);
      expect(details.state).toBe("expiring_soon");
      expect(details.daysRemaining).toBe(21);
      expect(details.badgeLabel).toContain("21 Hari");
      expect(details.canEdit).toBe(true);
    });

    it("calculates critical_expiring alert when days remaining is 14 or less", () => {
      const entitlement: WorkspaceEntitlement = {
        weddingId: "wed-03",
        status: "active",
        isPaid: true,
        isDemo: false,
        grantedAt: "2026-06-01T00:00:00Z",
        validUntil: "2026-11-20T00:00:00Z",
        canEdit: true,
        canInviteMembers: true,
        canExportCSV: true,
        planName: "Akses Penuh Pawiwahan",
        badgeLabel: "Lisensi Aktif",
        daysRemaining: 6,
      };

      const details = calculateAccessStateDetails(entitlement);
      expect(details.state).toBe("critical_expiring");
      expect(details.daysRemaining).toBe(6);
      expect(details.badgeLabel).toContain("6 Hari");
      expect(details.description).toContain("Arsip Baca-Saja");
      expect(details.canEdit).toBe(true);
    });

    it("enforces graceful read-only archive mode when entitlement is expired", () => {
      const entitlement: WorkspaceEntitlement = {
        weddingId: "wed-04",
        status: "expired",
        isPaid: false,
        isDemo: false,
        grantedAt: "2026-01-01T00:00:00Z",
        validUntil: "2026-11-01T00:00:00Z",
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Arsip Pawiwahan (Read-Only)",
        badgeLabel: "Masa Aktif Berakhir",
        daysRemaining: 0,
      };

      const details = calculateAccessStateDetails(entitlement);
      expect(details.state).toBe("expired_archive");
      expect(details.canEdit).toBe(false);
      expect(details.canInviteMembers).toBe(false);
      expect(details.canExportCSV).toBe(true);
      expect(details.dataSovereigntyNote).toContain("tidak pernah dihapus");
    });

    it("handles revoked license correctly while preserving offline backup export", () => {
      const entitlement: WorkspaceEntitlement = {
        weddingId: "wed-05",
        status: "revoked",
        isPaid: false,
        isDemo: false,
        grantedAt: "2026-11-01T00:00:00Z",
        validUntil: null,
        canEdit: false,
        canInviteMembers: false,
        canExportCSV: true,
        planName: "Akses Dicabut",
        badgeLabel: "Akses Ditangguhkan",
        daysRemaining: 0,
      };

      const details = calculateAccessStateDetails(entitlement);
      expect(details.state).toBe("revoked");
      expect(details.canEdit).toBe(false);
      expect(details.canInviteMembers).toBe(false);
      expect(details.canExportCSV).toBe(true);
      expect(details.badgeLabel).toBe("Akses Ditangguhkan");
    });

    it("guarantees data sovereignty: canExportCSV is ALWAYS true across all states", () => {
      const testCases: WorkspaceEntitlement[] = [
        {
          weddingId: "1",
          status: "active",
          isPaid: true,
          isDemo: false,
          grantedAt: "now",
          validUntil: null,
          canEdit: true,
          canInviteMembers: true,
          canExportCSV: true,
          planName: "",
          badgeLabel: "",
          daysRemaining: null,
        },
        {
          weddingId: "2",
          status: "expired",
          isPaid: false,
          isDemo: false,
          grantedAt: "past",
          validUntil: "past",
          canEdit: false,
          canInviteMembers: false,
          canExportCSV: true,
          planName: "",
          badgeLabel: "",
          daysRemaining: 0,
        },
        {
          weddingId: "3",
          status: "revoked",
          isPaid: false,
          isDemo: false,
          grantedAt: "past",
          validUntil: null,
          canEdit: false,
          canInviteMembers: false,
          canExportCSV: true,
          planName: "",
          badgeLabel: "",
          daysRemaining: 0,
        },
        {
          weddingId: "demo",
          status: "free_preview",
          isPaid: false,
          isDemo: true,
          grantedAt: null,
          validUntil: null,
          canEdit: false,
          canInviteMembers: false,
          canExportCSV: true,
          planName: "",
          badgeLabel: "",
          daysRemaining: null,
        },
      ];

      for (const tc of testCases) {
        const details = calculateAccessStateDetails(tc);
        expect(details.canExportCSV).toBe(true);
      }
    });
  });

  describe("Customer Support Topics Configuration", () => {
    it("provides the 6 comprehensive Balinese wedding support categories", () => {
      expect(SUPPORT_TOPICS).toHaveLength(6);
      const ids = SUPPORT_TOPICS.map((t) => t.id);
      expect(ids).toContain("payment_issue");
      expect(ids).toContain("license_activation");
      expect(ids).toContain("adat_consultation");
      expect(ids).toContain("technical_support");
      expect(ids).toContain("refund_request");
      expect(ids).toContain("other");
    });
  });
});
