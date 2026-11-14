import { describe, it, expect } from "vitest";
import {
  CANONICAL_LOCATIONS,
  STARTER_RUNDOWN_TEMPLATES,
  DEMO_RUNDOWN_EVENTS,
  formatTimeDisplay,
  calculateDurationMinutes,
  formatDurationString,
  calculateRundownStats,
  formatRundownPlainText,
} from "../src/features/rundown/seeds";
import type { RundownEvent } from "../src/features/rundown/types";

describe("Balinese Wedding Day Rundown Planner Domain (Issue #31)", () => {
  describe("Canonical Locations & Adat Context", () => {
    it("should include essential Balinese spatial locations (Merajan, Bale, Natah)", () => {
      expect(CANONICAL_LOCATIONS).toContain("Merajan / Sanggah Gede");
      expect(CANONICAL_LOCATIONS).toContain("Bale Dangin / Bale Gede");
      expect(CANONICAL_LOCATIONS).toContain("Bale Dauh / Kamar Pengantin");
      expect(CANONICAL_LOCATIONS).toContain("Natah / Pekarangan Rumah");
      expect(CANONICAL_LOCATIONS).toContain("Pintu Gerbang / Angkul-angkul");
      expect(CANONICAL_LOCATIONS).toContain("Pawon / Area Mebat");
    });

    it("should provide a comprehensive starter rundown covering morning to evening", () => {
      expect(STARTER_RUNDOWN_TEMPLATES.length).toBeGreaterThanOrEqual(8);

      const titles = STARTER_RUNDOWN_TEMPLATES.map((t) => t.segmentTitle);
      expect(titles.some((t) => t.includes("Payas Agung"))).toBe(true);
      expect(titles.some((t) => t.includes("Pabyakala"))).toBe(true);
      expect(titles.some((t) => t.includes("Merajan"))).toBe(true);
      expect(titles.some((t) => t.includes("Resepsi"))).toBe(true);
    });
  });

  describe("Time Formatting & Duration Math", () => {
    it("should normalize times into HH:MM format", () => {
      expect(formatTimeDisplay("08:30:00")).toBe("08:30");
      expect(formatTimeDisplay("8:30")).toBe("08:30");
      expect(formatTimeDisplay("14:00")).toBe("14:00");
      expect(formatTimeDisplay(null)).toBe("00:00");
    });

    it("should calculate duration in minutes between start and end times", () => {
      expect(calculateDurationMinutes("08:00", "09:30")).toBe(90);
      expect(calculateDurationMinutes("09:30", "11:00")).toBe(90);
      expect(calculateDurationMinutes("11:00", "11:45")).toBe(45);
      expect(calculateDurationMinutes("18:00", "21:00")).toBe(180);
    });

    it("should format duration into clear Indonesian prose", () => {
      expect(formatDurationString(90)).toBe("1 jam 30 mnt");
      expect(formatDurationString(60)).toBe("1 jam");
      expect(formatDurationString(45)).toBe("45 menit");
      expect(formatDurationString(0)).toBe("0 menit");
    });
  });

  describe("Rundown Aggregations & Statistics", () => {
    const mockEvents: RundownEvent[] = [
      {
        id: "rd-1",
        weddingId: "w1",
        ceremonyId: "c1",
        segmentTitle: "Rias Payas Agung",
        scheduledDate: "2026-12-20",
        startTime: "05:00",
        endTime: "07:00", // 120 mins
        location: "Bale Dauh",
        personInCharge: "MUA Sekar Jagat",
        orderIndex: 1,
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "rd-2",
        weddingId: "w1",
        ceremonyId: "c1",
        segmentTitle: "Pabyakala & Temu Manten",
        scheduledDate: "2026-12-20",
        startTime: "09:00",
        endTime: "10:30", // 90 mins
        location: "Natah Pekarangan",
        personInCharge: "Jero Mangku",
        orderIndex: 2,
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "rd-3",
        weddingId: "w1",
        ceremonyId: null,
        segmentTitle: "Makan Siang Bersama",
        scheduledDate: "2026-12-20",
        startTime: "12:00",
        endTime: "13:30", // 90 mins
        location: "Bale Dangin",
        personInCharge: "Seksi Konsumsi",
        orderIndex: 3,
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    it("should calculate total events and duration correctly", () => {
      const stats = calculateRundownStats(mockEvents);
      expect(stats.totalEvents).toBe(3);
      // 120 + 90 + 90 = 300 minutes (5 hours)
      expect(stats.totalDurationMinutes).toBe(300);
      expect(stats.distinctLocations).toBe(3);
      expect(stats.distinctPICs).toBe(3);
      expect(stats.datesCount).toBe(1);
    });

    it("should handle empty event list gracefully", () => {
      const stats = calculateRundownStats([]);
      expect(stats.totalEvents).toBe(0);
      expect(stats.totalDurationMinutes).toBe(0);
      expect(stats.distinctLocations).toBe(0);
      expect(stats.distinctPICs).toBe(0);
      expect(stats.datesCount).toBe(0);
    });
  });

  describe("Plain Text Format for Sharing & Printing", () => {
    it("should format agenda into clean text suitable for WhatsApp broadcast", () => {
      const sampleEvents: RundownEvent[] = [
        {
          id: "rd-1",
          weddingId: "w1",
          ceremonyId: null,
          segmentTitle: "Pabyakala",
          scheduledDate: "2026-12-20",
          startTime: "09:00",
          endTime: "10:30",
          location: "Natah Rumah",
          personInCharge: "Jero Mangku",
          orderIndex: 1,
          notes: "Siapkan ayam brumbun",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ];

      const text = formatRundownPlainText(
        sampleEvents,
        "Wayan & Ketut",
        "Minggu, 20 Desember 2026"
      );
      expect(text).toContain("RUNDOWN ACARA PAWIWAHAN");
      expect(text).toContain("Wayan & Ketut");
      expect(text).toContain("Minggu, 20 Desember 2026");
      expect(text).toContain("[09:00 - 10:30]");
      expect(text).toContain("Pabyakala");
      expect(text).toContain("Lokasi : Natah Rumah");
      expect(text).toContain("PIC    : Jero Mangku");
      expect(text).toContain("Catatan: Siapkan ayam brumbun");
      expect(text).toContain("Patemon · Bali Hindu Wedding Planner");
    });
  });

  describe("Demo Baseline Rundown Events", () => {
    it("should provide well-structured demo events with valid times and locations", () => {
      expect(DEMO_RUNDOWN_EVENTS.length).toBeGreaterThanOrEqual(8);
      DEMO_RUNDOWN_EVENTS.forEach((e) => {
        expect(e.segmentTitle.length).toBeGreaterThan(0);
        expect(e.startTime.length).toBe(5);
        expect(e.endTime.length).toBe(5);
        expect(
          calculateDurationMinutes(e.startTime, e.endTime)
        ).toBeGreaterThan(0);
        expect(e.location).toBeDefined();
        expect(e.personInCharge).toBeDefined();
      });
    });
  });
});
