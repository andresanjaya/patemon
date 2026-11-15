/**
 * Automated Test Suite for Guest CSV Import (Issue #85) and
 * Personalized WhatsApp Invites (Issue #86).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only module for Vitest test environment
vi.mock("server-only", () => ({}));
import {
  generateGuestsCsvTemplate,
  normalizeGuestSide,
  normalizePhoneNumber,
  parseAndValidateGuestsCsv,
  parseRawCsvLines,
  sanitizeCsvFormula,
} from "@/features/guests/csv-parser";
import {
  cleanPhoneForWhatsApp,
  generateWhatsAppInviteMessage,
  generateWhatsAppUrl,
} from "@/features/guests/whatsapp";
import {
  batchImportGuestsAction,
  updateInvitationStatusAction,
} from "@/features/guests/actions";
import type { Guest } from "@/features/guests/types";

// Mock Next.js Cache Revalidation
vi.mock("next/cache", () => {
  return {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
  };
});

// Mock Supabase Server Client
vi.mock("@/lib/supabase/server", () => {
  return {
    createClient: vi.fn(),
  };
});

// Mock Entitlement Check
vi.mock("@/features/payments/entitlements", () => {
  return {
    checkFeatureAccess: vi.fn().mockResolvedValue({
      allowed: true,
      role: "owner",
      reason: null,
    }),
  };
});

import { createClient } from "@/lib/supabase/server";

describe("Guest CSV Import & Personalized WhatsApp Invites (Issues #85 & #86)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // ISSUE #85: CSV Parser, Encoding, Duplicates & Formula Guard
  // =========================================================================
  describe("1. CSV Parsing, RFC 4180 Quotes & Formula Defenses (Issue #85)", () => {
    it("handles UTF-8 BOM, quoted fields, and commas inside quotes properly", () => {
      const csvWithBom =
        "\uFEFFNama,Pihak,Kelompok,Jumlah,Telepon,Catatan\r\n" +
        '"I Wayan Sudarma, S.H.","Mempelai Pria","Banjar Tengah, Ubud",2,"081234567890","Tamu VIP, keluarga inti"';

      const parsed = parseRawCsvLines(csvWithBom);
      expect(parsed.length).toBe(2);
      expect(parsed[1][0]).toBe("I Wayan Sudarma, S.H.");
      expect(parsed[1][2]).toBe("Banjar Tengah, Ubud");
      expect(parsed[1][5]).toBe("Tamu VIP, keluarga inti");
    });

    it("parses multiline quoted newlines and escaped double quotes ('\"\"')", () => {
      const multilineCsv =
        "Nama,Pihak,Kelompok,Jumlah,Telepon,Catatan\n" +
        '"Ni Made ""Rai"" Suartini",Wanita,"Dadia Kawan",1,081987654321,"Catatan baris 1\nCatatan baris 2"';

      const parsed = parseRawCsvLines(multilineCsv);
      expect(parsed.length).toBe(2);
      expect(parsed[1][0]).toBe('Ni Made "Rai" Suartini');
      expect(parsed[1][5]).toBe("Catatan baris 1\nCatatan baris 2");
    });

    it("handles Balinese script and Unicode characters flawlessly", () => {
      const balineseCsv =
        "Nama,Pihak,Kelompok,Jumlah,Telepon,Catatan\n" +
        '"ᬑᬁ ᬲ᭄ᬯᬲ᭄ᬢ᭄ᬬᬲ᭄ᬢᬸ Ida Bagus Gede",Pria,Griya,4,+62811223344,"Pemangku Upacara"';

      const preview = parseAndValidateGuestsCsv(balineseCsv, []);
      expect(preview.validCount).toBe(1);
      expect(preview.rows[0].row.name).toBe("ᬑᬁ ᬲ᭄ᬯᬲ᭄ᬢ᭄ᬬᬲ᭄ᬢᬸ Ida Bagus Gede");
      expect(preview.rows[0].row.headcount).toBe(4);
    });

    it("sanitizes CSV formula injection characters (=, +, -, @)", () => {
      expect(sanitizeCsvFormula("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeCsvFormula("+CMD|' /C calc'!A0")).toBe(
        "'+CMD|' /C calc'!A0"
      );
      expect(sanitizeCsvFormula("-2+5")).toBe("'-2+5");
      expect(sanitizeCsvFormula("@SUM")).toBe("'@SUM");
      expect(sanitizeCsvFormula("I Putu Normal")).toBe("I Putu Normal");
    });

    it("normalizes phone numbers without corrupting international formats", () => {
      expect(normalizePhoneNumber("081234567890")).toBe("+6281234567890");
      expect(normalizePhoneNumber("6281987654321")).toBe("+6281987654321");
      expect(normalizePhoneNumber("+1-202-555-0123")).toBe("+12025550123");
      expect(normalizePhoneNumber("+61 412 345 678")).toBe("+61412345678");
      expect(normalizePhoneNumber("")).toBeNull();
    });

    it("normalizes guest side representation", () => {
      expect(normalizeGuestSide("purusa")).toBe("groom");
      expect(normalizeGuestSide("Mempelai Pria")).toBe("groom");
      expect(normalizeGuestSide("pradana")).toBe("bride");
      expect(normalizeGuestSide("Wanita")).toBe("bride");
      expect(normalizeGuestSide("bersama")).toBe("both");
      expect(normalizeGuestSide("unknown")).toBe("both");
    });

    it("generates valid starter CSV template", () => {
      const template = generateGuestsCsvTemplate();
      expect(template.startsWith("\uFEFF")).toBe(true);
      expect(template).toContain("Nama Lengkap");
      expect(template).toContain("Mempelai Pria");
      expect(template).toContain("I Wayan Sudarma & Keluarga");
    });
  });

  describe("2. Duplicate Detection & Validation Rules (Issue #85)", () => {
    const existingGuests: Guest[] = [
      {
        id: "g-1",
        weddingId: "w-1",
        name: "I Wayan Raditya",
        side: "groom",
        groupHousehold: "Banjar Tengah",
        headcount: 2,
        invitationStatus: "draft",
        phone: "+6281234567890",
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it("flags duplicate against existing database guests by name or phone", () => {
      const csvData =
        "Nama,Pihak,Kelompok,Jumlah,Telepon,Catatan\n" +
        "I Wayan Raditya,Pria,Keluarga,2,089999999999,Nama sama\n" +
        "Gede Beda,Wanita,Dadia,1,081234567890,Telepon sama\n" +
        "Kadek Unik,Pria,Teman,1,081999888777,Unik";

      const preview = parseAndValidateGuestsCsv(csvData, existingGuests);

      expect(preview.totalRows).toBe(3);
      expect(preview.validCount).toBe(1);
      expect(preview.duplicateCount).toBe(2);

      // Row 1: duplicate name
      expect(preview.rows[0].status).toBe("duplicate");
      expect(preview.rows[0].isDuplicateWithExisting).toBe(true);

      // Row 2: duplicate phone
      expect(preview.rows[1].status).toBe("duplicate");
      expect(preview.rows[1].isDuplicateWithExisting).toBe(true);

      // Row 3: unique valid
      expect(preview.rows[2].status).toBe("valid");
    });

    it("flags duplicate within the same batch file", () => {
      const csvData =
        "Nama,Pihak,Kelompok,Jumlah,Telepon,Catatan\n" +
        "Wayan Pertama,Pria,Banjar,2,081111111111,Entri 1\n" +
        "Wayan Pertama,Pria,Banjar,2,081111111111,Entri 2 duplikat batch";

      const preview = parseAndValidateGuestsCsv(csvData, []);
      expect(preview.totalRows).toBe(2);
      expect(preview.rows[0].status).toBe("valid");
      expect(preview.rows[1].status).toBe("duplicate");
      expect(preview.rows[1].isDuplicateWithBatch).toBe(true);
    });

    it("flags invalid row when name is empty", () => {
      const csvData =
        "Nama,Pihak,Kelompok,Jumlah,Telepon,Catatan\n" +
        ',Pria,Banjar,2,081111111111,"Nama kosong"';

      const preview = parseAndValidateGuestsCsv(csvData, []);
      expect(preview.invalidCount).toBe(1);
      expect(preview.rows[0].status).toBe("invalid");
      expect(preview.rows[0].errors).toContain("Nama tamu wajib diisi.");
    });
  });

  describe("3. Batch Import Server Action Guardrails (Issue #85)", () => {
    function setupSupabaseMock(callerRole = "owner") {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: callerRole, status: "active" },
                error: null,
              }),
            };
          }
          if (table === "guests") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              is: vi.fn().mockResolvedValue({
                data: [{ name: "I Ketut Lama", phone: "+628111111111" }],
                error: null,
              }),
              insert: vi.fn((payload: Array<Record<string, unknown>>) => ({
                select: vi.fn().mockResolvedValue({
                  data: payload.map((p, idx) => ({
                    id: `g-inserted-${idx}`,
                    wedding_id: p.wedding_id,
                    name: p.name,
                    side: p.side,
                    group_household: p.group_household,
                    headcount: p.headcount,
                    invitation_status: p.invitation_status,
                    phone: p.phone,
                    notes: p.notes,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })),
                  error: null,
                }),
              })),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          };
        }),
      };

      vi.mocked(createClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>
      );
      return mockSupabase;
    }

    it("rejects batch import when caller is only a Viewer", async () => {
      setupSupabaseMock("viewer");

      const res = await batchImportGuestsAction(
        "wedding-1",
        [{ name: "Tamu Test", headcount: 1 }],
        { skipDuplicates: true }
      );

      expect(res.success).toBe(false);
      expect(res.message).toContain("Peran Anda hanya memiliki hak baca");
      expect(res.importedCount).toBe(0);
    });

    it("imports valid rows and skips duplicates when skipDuplicates is true", async () => {
      setupSupabaseMock("editor");

      const inputRows = [
        { name: "I Ketut Lama", phone: "08111111111", headcount: 1 }, // Duplicate with DB
        { name: "Komang Baru", phone: "08222222222", headcount: 3 }, // Valid
      ];

      const res = await batchImportGuestsAction("wedding-1", inputRows, {
        skipDuplicates: true,
      });

      expect(res.success).toBe(true);
      expect(res.importedCount).toBe(1);
      expect(res.skippedCount).toBe(1);
      expect(res.guests[0].name).toBe("Komang Baru");
      expect(res.guests[0].headcount).toBe(3);
    });
  });

  // =========================================================================
  // ISSUE #86: Personalized WhatsApp Invite Messages & Status Updates
  // =========================================================================
  describe("4. Personalized WhatsApp Messages & Link Generation (Issue #86)", () => {
    const inviteContext = {
      coupleNames: "Wayan & Rai",
      prospectiveDate: "2026-11-22",
      ceremonyTimeWita: "10:00 WITA",
      ceremonyLocation: "Banjar Tengah, Ubud, Gianyar",
      invitationUrl: "https://patemon.vercel.app/invitation/w123",
    };

    it("generates culturally polite Balinese invite message with all ceremony details", () => {
      const guest = {
        name: "Ida Bagus Made Alit & Keluarga",
        headcount: 3,
      };

      const message = generateWhatsAppInviteMessage(guest, inviteContext);

      expect(message).toContain("Om Swastyastu");
      expect(message).toContain("Ida Bagus Made Alit & Keluarga");
      expect(message).toContain("(3 Orang)");
      expect(message).toContain("Wayan & Rai");
      expect(message).toContain("22 November 2026");
      expect(message).toContain("Banjar Tengah, Ubud, Gianyar");
      expect(message).toContain("https://patemon.vercel.app/invitation/w123");
      expect(message).toContain("Om Shanti, Shanti, Shanti, Om");
    });

    it("cleans phone numbers specifically for wa.me format (digits only, 628...)", () => {
      expect(cleanPhoneForWhatsApp("081234567890")).toBe("6281234567890");
      expect(cleanPhoneForWhatsApp("+62 812-3456-7890")).toBe("6281234567890");
      expect(cleanPhoneForWhatsApp("81987654321")).toBe("6281987654321");
      expect(cleanPhoneForWhatsApp(null)).toBeNull();
      expect(cleanPhoneForWhatsApp("123")).toBeNull(); // Too short
    });

    it("generates valid wa.me URL with properly URI-encoded text", () => {
      const guest = { name: "I Wayan Sudarma", headcount: 1 };
      const message = generateWhatsAppInviteMessage(guest, inviteContext);
      const url = generateWhatsAppUrl("081234567890", message);

      expect(url).toBeDefined();
      expect(url?.startsWith("https://wa.me/6281234567890?text=")).toBe(true);
      expect(url).toContain(encodeURIComponent("I Wayan Sudarma"));
      expect(url).toContain(encodeURIComponent("Wayan & Rai"));
    });

    it("returns null wa.me URL when phone is missing, allowing copy text fallback", () => {
      const guest = { name: "Tamu Tanpa HP", headcount: 1 };
      const message = generateWhatsAppInviteMessage(guest, inviteContext);
      const url = generateWhatsAppUrl(null, message);

      expect(url).toBeNull();
      // Message text is still generated and intact for manual copy
      expect(message).toContain("Tamu Tanpa HP");
    });
  });

  describe("5. WhatsApp Invitation Status Action (Issue #86)", () => {
    function setupSupabaseMock(callerRole = "owner") {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "wedding_members") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: callerRole, status: "active" },
                error: null,
              }),
            };
          }
          if (table === "guests") {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          };
        }),
      };

      vi.mocked(createClient).mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>
      );
      return mockSupabase;
    }

    it("allows owner/editor to update status to 'sent' or 'confirmed'", async () => {
      setupSupabaseMock("owner");

      const res = await updateInvitationStatusAction(
        "wedding-1",
        "guest-123",
        "sent"
      );
      expect(res.success).toBe(true);
    });

    it("rejects invitation status update from viewer", async () => {
      setupSupabaseMock("viewer");

      const res = await updateInvitationStatusAction(
        "wedding-1",
        "guest-123",
        "sent"
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain("Peran Anda hanya memiliki hak baca");
    });
  });
});
