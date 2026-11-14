import { describe, it, expect } from "vitest";
import {
  GUEST_SIDES,
  INVITATION_STATUS_CONFIG,
  CANONICAL_GUEST_GROUPS,
  DEMO_GUESTS,
  formatGuestSideLabel,
  getGuestSideBadgeClass,
  getInvitationStatusConfig,
  calculateGuestStats,
  formatWhatsAppInviteLink,
  exportGuestsToCSV,
} from "../src/features/guests/seeds";
import type { Guest, InvitationStatus } from "../src/features/guests/types";

describe("Balinese Wedding Guest List Domain (Issue #30)", () => {
  describe("Guest Sides & Customary Metadata", () => {
    it("should define Purusa, Pradana, and Mutual family sides", () => {
      const sideIds = GUEST_SIDES.map((s) => s.id);
      expect(sideIds).toContain("groom");
      expect(sideIds).toContain("bride");
      expect(sideIds).toContain("both");
    });

    it("should format guest side labels accurately", () => {
      expect(formatGuestSideLabel("groom")).toContain("Purusa");
      expect(formatGuestSideLabel("bride")).toContain("Pradana");
      expect(formatGuestSideLabel("both")).toContain("Kedua Pihak");
      expect(formatGuestSideLabel("mutual")).toContain("Kedua Pihak");
    });

    it("should provide distinct badge classes for family sides", () => {
      expect(getGuestSideBadgeClass("groom")).toContain("blue");
      expect(getGuestSideBadgeClass("bride")).toContain("pink");
      expect(getGuestSideBadgeClass("both")).toContain("purple");
    });

    it("should include canonical Balinese guest groupings", () => {
      expect(CANONICAL_GUEST_GROUPS).toContain("Keluarga Besar Dadia / Paibon");
      expect(CANONICAL_GUEST_GROUPS).toContain("Krama Banjar Adat & Tempekan");
      expect(CANONICAL_GUEST_GROUPS).toContain(
        "Prajuru Adat & Tokoh Masyarakat"
      );
    });
  });

  describe("Invitation Status Configuration", () => {
    it("should support all 4 invitation lifecycle statuses", () => {
      const statuses: InvitationStatus[] = [
        "draft",
        "sent",
        "confirmed",
        "declined",
      ];
      statuses.forEach((s) => {
        const config = getInvitationStatusConfig(s);
        expect(config).toBeDefined();
        expect(config.label.length).toBeGreaterThan(0);
        expect(config.badgeClass).toBeDefined();
      });
    });

    it("should fallback to draft status config for unknown status", () => {
      const fallback = getInvitationStatusConfig("unknown" as InvitationStatus);
      expect(fallback.label).toBe(INVITATION_STATUS_CONFIG.draft.label);
    });
  });

  describe("Headcount & Guest Statistics Aggregation", () => {
    const mockGuests: Guest[] = [
      {
        id: "g1",
        weddingId: "w1",
        name: "Jero Mangku Wayan",
        side: "groom",
        groupHousehold: "Keluarga Besar Dadia",
        headcount: 4,
        invitationStatus: "confirmed",
        phone: "081234567890",
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "g2",
        weddingId: "w1",
        name: "Paman Nyoman",
        side: "bride",
        groupHousehold: "Kerabat Luar Daerah",
        headcount: 3,
        invitationStatus: "sent",
        phone: "081999887766",
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "g3",
        weddingId: "w1",
        name: "Teman Kantor",
        side: "both",
        groupHousehold: "Rekan Kerja",
        headcount: 5,
        invitationStatus: "draft",
        phone: null,
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "g4",
        weddingId: "w1",
        name: "Kerabat Berhalangan",
        side: "bride",
        groupHousehold: "Kerabat Luar Daerah",
        headcount: 2,
        invitationStatus: "declined",
        phone: "081122334455",
        notes: "Dinas keluar pulau",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    it("should calculate total invitations accurately", () => {
      const stats = calculateGuestStats(mockGuests);
      expect(stats.totalInvitations).toBe(4);
    });

    it("should calculate active headcount excluding declined guests", () => {
      const stats = calculateGuestStats(mockGuests);
      // Active: g1 (4) + g2 (3) + g3 (5) = 12 Pax
      expect(stats.totalHeadcount).toBe(12);
      expect(stats.declinedHeadcount).toBe(2);
      expect(stats.declinedInvitations).toBe(1);
    });

    it("should calculate confirmed, sent, and draft breakdown", () => {
      const stats = calculateGuestStats(mockGuests);
      expect(stats.confirmedHeadcount).toBe(4);
      expect(stats.confirmedInvitations).toBe(1);
      expect(stats.sentInvitations).toBe(1);
      expect(stats.draftInvitations).toBe(1);
    });

    it("should calculate headcount split by Purusa, Pradana, and Mutual sides", () => {
      const stats = calculateGuestStats(mockGuests);
      expect(stats.groomHeadcount).toBe(4); // g1
      expect(stats.brideHeadcount).toBe(3); // g2 (g4 declined excluded)
      expect(stats.mutualHeadcount).toBe(5); // g3
    });

    it("should handle empty guests list safely", () => {
      const stats = calculateGuestStats([]);
      expect(stats.totalInvitations).toBe(0);
      expect(stats.totalHeadcount).toBe(0);
      expect(stats.confirmedHeadcount).toBe(0);
      expect(stats.declinedHeadcount).toBe(0);
    });
  });

  describe("WhatsApp Invitation Link Formatter", () => {
    it("should format valid Indonesian mobile numbers into WhatsApp links with customary greeting", () => {
      const link = formatWhatsAppInviteLink(
        "081234567890",
        "Bapak Wayan",
        "Wayan & Ketut",
        "Sabtu, 20 Desember 2026"
      );
      expect(link).toBeDefined();
      expect(link).toContain("https://wa.me/6281234567890");
      expect(link).toContain(encodeURIComponent("Om Swastyastu Bapak Wayan"));
      expect(link).toContain(encodeURIComponent("Wayan & Ketut"));
      expect(link).toContain(encodeURIComponent("Matur suksma"));
    });

    it("should return null for null, empty or invalid phone numbers", () => {
      expect(formatWhatsAppInviteLink(null, "Wayan")).toBeNull();
      expect(formatWhatsAppInviteLink("", "Wayan")).toBeNull();
      expect(formatWhatsAppInviteLink("invalid-phone", "Wayan")).toBeNull();
    });
  });

  describe("CSV Export Generation", () => {
    it("should generate CSV with UTF-8 BOM and correct column headers", () => {
      const csv = exportGuestsToCSV(DEMO_GUESTS);
      // UTF-8 BOM is \uFEFF
      expect(csv.charCodeAt(0)).toBe(0xfeff);

      expect(csv).toContain("Nama Undangan");
      expect(csv).toContain("Pihak");
      expect(csv).toContain("Kelompok / Dadia / Banjar");
      expect(csv).toContain("Jumlah Pax (Headcount)");
      expect(csv).toContain("Status Undangan");
      expect(csv).toContain("Nomor Telepon");
      expect(csv).toContain("Catatan Khusus");
    });

    it("should correctly escape quotes and export all rows", () => {
      const sampleGuest: Guest = {
        id: "sample-1",
        weddingId: "w1",
        name: 'Wayan "Gede" Pratama',
        side: "groom",
        groupHousehold: "Keluarga Dadia, Banjar Tengah",
        headcount: 2,
        invitationStatus: "confirmed",
        phone: "08123456789",
        notes: "Membawa bingkisan, tiba jam 10:00",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      };

      const csv = exportGuestsToCSV([sampleGuest]);
      expect(csv).toContain('""Gede""');
      expect(csv).toContain('"Keluarga Dadia, Banjar Tengah"');
      expect(csv).toContain('"2"');
    });
  });

  describe("Demo Baseline Guests", () => {
    it("should provide well-formed demo guests for preview workspace", () => {
      expect(DEMO_GUESTS.length).toBeGreaterThan(0);
      DEMO_GUESTS.forEach((g) => {
        expect(g.name.length).toBeGreaterThan(0);
        expect(g.headcount).toBeGreaterThan(0);
        expect(Number.isInteger(g.headcount)).toBe(true);
        expect(["groom", "bride", "both", "mutual"]).toContain(g.side);
        expect(["draft", "sent", "confirmed", "declined"]).toContain(
          g.invitationStatus
        );
      });
    });
  });
});
