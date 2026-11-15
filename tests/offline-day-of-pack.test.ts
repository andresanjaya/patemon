/**
 * Automated Test Suite for Day-Of Offline Packet & Print Contingency (Issue #89).
 * Verifies:
 * 1. Self-contained standalone HTML without remote scripts/styles/fonts.
 * 2. Prominent snapshot metadata & non-synchronized read-only indicators.
 * 3. A4 monochrome/grayscale print formatting compliance.
 * 4. User-selectable data modules (rundown, banten, PIC contacts).
 * 5. Deduplicated PIC directory extraction.
 * 6. Privacy & security: Zero session tokens, API keys, or guest private numbers.
 * 7. Fail-closed authorization for offline pack generation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only module for Vitest test environment
vi.mock("server-only", () => ({}));

// Mock Next.js Cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock Supabase Server Client & Auth
const { mockGetUser, mockSupabase } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockSupabase = {
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    })),
  };
  return { mockGetUser, mockSupabase };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// Mock Workspace, Rundown, Banten, Tasks
const {
  mockGetWeddingWorkspace,
  mockGetWeddingRundown,
  mockGetWeddingBantenItems,
  mockGetWeddingTasks,
} = vi.hoisted(() => ({
  mockGetWeddingWorkspace: vi.fn(),
  mockGetWeddingRundown: vi.fn(),
  mockGetWeddingBantenItems: vi.fn(),
  mockGetWeddingTasks: vi.fn(),
}));

vi.mock("@/features/workspaces/actions", () => ({
  getWeddingWorkspace: (...args: unknown[]) => mockGetWeddingWorkspace(...args),
}));

vi.mock("@/features/rundown/actions", () => ({
  getWeddingRundown: (...args: unknown[]) => mockGetWeddingRundown(...args),
}));

vi.mock("@/features/banten/actions", () => ({
  getWeddingBantenItems: (...args: unknown[]) =>
    mockGetWeddingBantenItems(...args),
}));

vi.mock("@/features/checklist/actions", () => ({
  getWeddingTasks: (...args: unknown[]) => mockGetWeddingTasks(...args),
}));

import {
  generateOfflineHtmlPack,
  extractPicDirectory,
  escapeHtml,
  type OfflinePackData,
} from "@/features/exports/offline-pack";
import { generateOfflineDayOfPackAction } from "@/features/exports/actions";
import type { RundownEvent } from "@/features/rundown/types";
import type { BantenItem } from "@/features/banten/types";
import type { WeddingTask } from "@/features/checklist/types";

describe("Day-Of Offline Contingency Packet & Print (Issue #89)", () => {
  const sampleRundown: RundownEvent[] = [
    {
      id: "rd-1",
      weddingId: "w1",
      ceremonyId: "c1",
      ceremonyTitle: "Upacara Pabyakala",
      segmentTitle: "Rias Mempelai Payas Agung",
      scheduledDate: "2026-12-01",
      startTime: "05:00",
      endTime: "07:30",
      location: "Bale Dauh",
      personInCharge: "Ni Ketut Suartini",
      picPhone: "081234567890",
      orderIndex: 1,
      notes: "MUA siap di lokasi pkl 04:30",
      status: "completed",
      actualStartTime: "05:05",
      actualEndTime: "07:25",
      delayMinutes: 5,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "rd-2",
      weddingId: "w1",
      ceremonyId: "c1",
      ceremonyTitle: "Upacara Pabyakala",
      segmentTitle: "Prosesi Pabyakala & Natab",
      scheduledDate: "2026-12-01",
      startTime: "08:00",
      endTime: "09:30",
      location: "Natah Rumah",
      personInCharge: "Jero Mangku Wayan",
      picPhone: "081987654321",
      orderIndex: 2,
      notes: "Caru ayam brumbun siap pkl 07:45",
      status: "in_progress",
      actualStartTime: "08:15",
      delayMinutes: 15,
      notesDayOf: "Mundur 15 menit menunggu keluarga besar",
      createdAt: "",
      updatedAt: "",
    },
  ];

  const sampleBanten: BantenItem[] = [
    {
      id: "b-1",
      weddingId: "w1",
      ceremonyId: "c1",
      ceremonyTitle: "Upacara Pabyakala",
      catalogId: "cat-1",
      name: "Banten Pabyakala & Byakaon",
      category: "Penyucian",
      quantity: 1,
      unit: "soroh",
      sourcingMethod: "purchased_package",
      status: "ready",
      assigneeName: "Jero Mangku Wayan",
      estimatedPrice: 250000,
      actualPrice: 250000,
      notes: "Lengkap dengan daksina dan ayam brumbun",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "b-2",
      weddingId: "w1",
      ceremonyId: "c1",
      ceremonyTitle: "Upacara Pabyakala",
      catalogId: "cat-2",
      name: "Banten Pejati ring Sanggah",
      category: "Utama",
      quantity: 4,
      unit: "tanding",
      sourcingMethod: "self_made",
      status: "making",
      assigneeName: "Men Wayan (Keluarga Purusa)",
      estimatedPrice: 300000,
      actualPrice: 0,
      notes: "Dibuat bersama sekaa ngayah",
      createdAt: "",
      updatedAt: "",
    },
  ];

  const sampleTasks: WeddingTask[] = [
    {
      id: "t-1",
      weddingId: "w1",
      templateId: null,
      ceremonyId: "c1",
      title: "Koordinasi Sekaa Gong Baleganjur",
      category: "ceremony",
      priority: "high",
      status: "done",
      assignedToUserId: null,
      assigneeName: "Bli Gede Oka",
      dueDate: "2026-11-30",
      orderIndex: 1,
      completedAt: "2026-11-30T10:00:00Z",
      description: "Pastikan gamelan datang 1 jam sebelum prosesi",
      createdAt: "",
      updatedAt: "",
    },
  ];

  const samplePackData: OfflinePackData = {
    weddingTitle: "Pawiwahan Wayan & Kadek",
    coupleNames: "Wayan Sukadana & Kadek Pradnya",
    prospectiveDate: "Selasa, 1 Desember 2026",
    location: "Banjar Tengah, Ubud, Gianyar",
    generatedAtWita: "15 November 2026, 14:30 WITA",
    rundownEvents: sampleRundown,
    bantenItems: sampleBanten,
    tasks: sampleTasks,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u-panitia", email: "panitia@patemon.id" } },
    });
    mockGetWeddingWorkspace.mockResolvedValue({
      workspace: {
        id: "w1",
        slug: "wayan-kadek",
        coupleNames: "Wayan Sukadana & Kadek Pradnya",
        groomName: "Wayan Sukadana",
        brideName: "Kadek Pradnya",
        prospectiveDate: "2026-12-01",
        locationRegion: "Banjar Tengah, Ubud",
        marriageForm: "memadik",
        targetBudget: 50000000,
        notes: "Banjar Tengah, Ubud",
        createdBy: "u-panitia",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      role: "editor",
    });
    mockGetWeddingRundown.mockResolvedValue({ events: sampleRundown });
    mockGetWeddingBantenItems.mockResolvedValue(sampleBanten);
    mockGetWeddingTasks.mockResolvedValue(sampleTasks);
  });

  // =========================================================================
  // 1. Standalone Single-File HTML (Zero Remote Network Dependencies)
  // =========================================================================
  describe("Standalone Single-File HTML & Zero Remote Assets", () => {
    it("should generate valid HTML starting with DOCTYPE", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<html lang="id">');
      expect(html).toContain("</html>");
    });

    it("should NOT contain any remote external asset URLs, CDN scripts, or web fonts", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).not.toMatch(/<script\s+[^>]*src=/i);
      expect(html).not.toMatch(/<link\s+[^>]*rel=["']stylesheet["']/i);
      expect(html).not.toContain("https://");
      expect(html).not.toContain("http://");
      expect(html).not.toContain("fonts.googleapis.com");
      expect(html).not.toContain("cdnjs.cloudflare.com");
      expect(html).not.toContain("unpkg.com");
    });

    it("should use pure system fonts for offline rendering compatibility", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("font-family: system-ui");
    });
  });

  // =========================================================================
  // 2. Snapshot Metadata & Non-Synchronized Warning
  // =========================================================================
  describe("Snapshot Metadata & Read-Only Warnings", () => {
    it("should display prominent snapshot alert with WITA timestamp", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("SALINAN STATIS OFFLINE (READ-ONLY)");
      expect(html).toContain("15 November 2026, 14:30 WITA");
      expect(html).toContain("PATEMON SNAPSHOT");
    });

    it("should explicitly state that offline edits will not sync to server", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("tidak akan tersinkronisasi");
      expect(html).toContain("secara otomatis ke aplikasi Patemon");
    });

    it("should warn that the file contains private family/PIC data", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("kontak privat panitia");
      expect(html).toContain("kerahasiaan berkas ini");
    });
  });

  // =========================================================================
  // 3. Print Formatting & Monochrome/Grayscale Readiness
  // =========================================================================
  describe("Print Formatting & Monochrome Readiness", () => {
    it("should contain @media print stylesheet with A4 page dimensions", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("@media print");
      expect(html).toContain("size: A4 portrait");
      expect(html).toContain(".no-print");
    });

    it("should prevent table rows from splitting across print pages", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("page-break-inside: avoid");
    });

    it("should provide high-contrast solid borders for black-and-white photocopy", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("border: 1px solid #444444");
    });
  });

  // =========================================================================
  // 4. User-Selectable Data Modules
  // =========================================================================
  describe("User-Selectable Data Modules", () => {
    it("should include rundown when includeRundown is true", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: false,
        includePicContacts: false,
      });

      expect(html).toContain("I. Susunan Acara Jam-demi-Jam (Rundown)");
      expect(html).toContain("Rias Mempelai Payas Agung");
      expect(html).not.toContain("II. Kesiapan Sarana Upakara & Banten");
      expect(html).not.toContain(
        "III. Direktori Kontak Panitia & PIC Lapangan"
      );
    });

    it("should include banten checklist when includeBanten is true", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: false,
        includeBanten: true,
        includePicContacts: false,
      });

      expect(html).not.toContain("I. Susunan Acara Jam-demi-Jam (Rundown)");
      expect(html).toContain("II. Kesiapan Sarana Upakara & Banten");
      expect(html).toContain("Banten Pabyakala &amp; Byakaon");
      expect(html).not.toContain(
        "III. Direktori Kontak Panitia & PIC Lapangan"
      );
    });

    it("should include all modules when all options are true", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).toContain("I. Susunan Acara Jam-demi-Jam (Rundown)");
      expect(html).toContain("II. Kesiapan Sarana Upakara & Banten");
      expect(html).toContain("III. Direktori Kontak Panitia & PIC Lapangan");
    });
  });

  // =========================================================================
  // 5. Deduplicated PIC Directory Extraction
  // =========================================================================
  describe("Deduplicated PIC Directory Extraction", () => {
    it("should extract and deduplicate PICs across rundown, banten, and tasks", () => {
      const directory = extractPicDirectory(
        sampleRundown,
        sampleBanten,
        sampleTasks
      );

      // Jero Mangku Wayan is in rundown and banten -> should be deduplicated
      const mangku = directory.find((p) => p.name === "Jero Mangku Wayan");
      expect(mangku).toBeDefined();
      expect(mangku?.phone).toBe("081987654321");
      expect(mangku?.roles.length).toBe(2);
      expect(mangku?.roles.some((r) => r.includes("Rundown"))).toBe(true);
      expect(mangku?.roles.some((r) => r.includes("Banten"))).toBe(true);

      // Ni Ketut Suartini (MUA)
      const mua = directory.find((p) => p.name === "Ni Ketut Suartini");
      expect(mua).toBeDefined();
      expect(mua?.phone).toBe("081234567890");

      // Bli Gede Oka (Gong) from tasks
      const gong = directory.find((p) => p.name === "Bli Gede Oka");
      expect(gong).toBeDefined();
      expect(gong?.roles.some((r) => r.includes("Tugas"))).toBe(true);
    });

    it("should handle empty inputs safely without crashing", () => {
      const emptyDir = extractPicDirectory([], [], []);
      expect(emptyDir).toEqual([]);
    });
  });

  // =========================================================================
  // 6. Privacy & Security: Zero Sensitive Keys or Guest Numbers
  // =========================================================================
  describe("Privacy & Security Protection", () => {
    it("should escape special HTML characters to prevent XSS injection", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
      );
      expect(escapeHtml('"quoted" & test')).toBe(
        "&quot;quoted&quot; &amp; test"
      );
      expect(escapeHtml(null)).toBe("");
    });

    it("should not contain any session tokens, client keys, or database secrets", () => {
      const html = generateOfflineHtmlPack(samplePackData, {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(html).not.toContain("supabaseKey");
      expect(html).not.toContain("sbp_");
      expect(html).not.toContain("service_role");
      expect(html).not.toContain("Bearer");
      expect(html).not.toContain("MIDTRANS");
    });
  });

  // =========================================================================
  // 7. Fail-Closed Authorization (Server Action)
  // =========================================================================
  describe("Fail-Closed Authorization (generateOfflineDayOfPackAction)", () => {
    it("should allow demo workspace export bypass", async () => {
      const res = await generateOfflineDayOfPackAction("demo", {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(res.success).toBe(true);
      expect(res.html).toBeDefined();
      expect(res.filename).toContain("patemon-paket-hari-h");
    });

    it("should reject unauthenticated user when requesting non-demo workspace", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const res = await generateOfflineDayOfPackAction("wedding-123", {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Autentikasi diperlukan");
    });

    it("should reject non-member of the workspace", async () => {
      mockGetWeddingWorkspace.mockResolvedValueOnce({
        workspace: null,
        role: null,
      });

      const res = await generateOfflineDayOfPackAction("wedding-123", {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Akses ditolak");
    });

    it("should allow authorized workspace member to generate offline pack", async () => {
      const res = await generateOfflineDayOfPackAction("wedding-123", {
        includeRundown: true,
        includeBanten: true,
        includePicContacts: true,
      });

      expect(res.success).toBe(true);
      expect(res.html).toContain("PANDUAN HARI-H PAWIWAHAN");
      expect(res.filename).toContain("wayan-sukadana");
      expect(res.exportedAt).toBeDefined();
    });
  });
});
