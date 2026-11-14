import { describe, it, expect, vi, beforeEach } from "vitest";
import { escapeCSVCell, generateCSV } from "../src/lib/csv-export";
import {
  formatBantenToCSV,
  formatTasksToCSV,
  formatBudgetItemsToCSV,
  formatPaymentsToCSV,
  formatVendorsToCSV,
  formatRundownToCSV,
  formatGuestsToCSV,
} from "../src/features/exports/formatters";
import {
  getUserDataTakeoutAction,
  checkAccountDeletionEligibilityAction,
  deleteUserAccountAction,
} from "../src/features/profile/privacy-actions";
import { getWorkspaceFullExportAction } from "../src/features/exports/actions";
import type { BantenItem } from "../src/features/banten/types";
import type { WeddingTask } from "../src/features/checklist/types";
import type { BudgetItem } from "../src/features/budget/types";
import type { Vendor } from "../src/features/vendors/types";
import type { RundownEvent } from "../src/features/rundown/types";
import type { Guest } from "../src/features/guests/types";

// Mock Supabase
vi.mock("../src/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("../src/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("../src/features/workspaces/actions", () => ({
  getWeddingWorkspace: vi.fn(),
}));

vi.mock("../src/features/ceremonies/actions", () => ({
  getWeddingCeremonies: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/features/banten/actions", () => ({
  getWeddingBantenItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/features/checklist/actions", () => ({
  getWeddingTasks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/features/budget/actions", () => ({
  getWeddingBudgetItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/features/vendors/actions", () => ({
  getWeddingVendors: vi.fn().mockResolvedValue({ vendors: [], stats: {} }),
}));

vi.mock("../src/features/guests/actions", () => ({
  getWeddingGuests: vi.fn().mockResolvedValue({ guests: [], stats: {} }),
}));

vi.mock("../src/features/rundown/actions", () => ({
  getWeddingRundown: vi.fn().mockResolvedValue({ events: [], stats: {} }),
}));

describe("CSV Export & Sanitization Engine (RFC-4180)", () => {
  it("escapes cells with commas, quotes, and newlines properly", () => {
    expect(escapeCSVCell("Canang Sari")).toBe('"Canang Sari"');
    expect(escapeCSVCell('Banten "Pebangkit"')).toBe('"Banten ""Pebangkit"""');
    expect(escapeCSVCell("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
    expect(escapeCSVCell(null)).toBe('""');
    expect(escapeCSVCell(undefined)).toBe('""');
  });

  it("neutralizes potential spreadsheet formula injection (=, +, -, @)", () => {
    // Formula attempts should be prefixed with single quote
    expect(escapeCSVCell("=SUM(A1:A10)")).toBe('"\'=SUM(A1:A10)"');
    expect(escapeCSVCell("+CMD|' /C calc'!A0")).toBe("\"'+CMD|' /C calc'!A0\"");
    expect(escapeCSVCell("@SUM(1,2)")).toBe('"\'@SUM(1,2)"');

    // Normal negative numbers should remain unquoted numbers
    expect(escapeCSVCell("-50000")).toBe('"-50000"');
    expect(escapeCSVCell(-1500)).toBe('"-1500"');
  });

  it("prepends UTF-8 Byte Order Mark (BOM) for Excel compatibility", () => {
    const headers = ["Nama", "Wilayah"];
    const rows = [["I Made Sudarma", "Gianyar"]];
    const csv = generateCSV(headers, rows);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Nama","Wilayah"');
    expect(csv).toContain('"I Made Sudarma","Gianyar"');
  });
});

describe("Domain CSV Formatters", () => {
  it("formats Banten items correctly with Indonesian status and sourcing labels", () => {
    const items: BantenItem[] = [
      {
        id: "b1",
        weddingId: "w1",
        name: "Pejati Dresta Badung",
        category: "Utama",
        quantity: 2,
        unit: "tanding",
        sourcingMethod: "self_made",
        status: "ready",
        assigneeName: "Ibu Kadek",
        estimatedPrice: 350000,
        actualPrice: 320000,
        notes: "Sediakan kelapa gading muda",
        ceremonyTitle: "Akad / Pawiwahan Utama",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const csv = formatBantenToCSV(items);
    expect(csv).toContain('"Pejati Dresta Badung"');
    expect(csv).toContain('"Ngayah Keluarga"');
    expect(csv).toContain('"Siap di Lokasi"');
    expect(csv).toContain('"Ibu Kadek"');
    expect(csv).toContain('"350000"');
  });

  it("formats Wedding Tasks checklist with priority and status", () => {
    const tasks: WeddingTask[] = [
      {
        id: "t1",
        weddingId: "w1",
        templateId: null,
        ceremonyId: null,
        title: "Konfirmasi Pemangku / Sulinggih",
        category: "ritual",
        priority: "urgent",
        status: "in_progress",
        assigneeName: "Pak Ketut",
        assignedToUserId: null,
        dueDate: "2026-06-15",
        orderIndex: 1,
        description: "Menghubungi Gria Sanur",
        ceremonyTitle: "Pawiwahan",
        completedAt: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const csv = formatTasksToCSV(tasks);
    expect(csv).toContain('"Konfirmasi Pemangku / Sulinggih"');
    expect(csv).toContain('"Mendesak (P0)"');
    expect(csv).toContain('"Dalam Pengerjaan"');
    expect(csv).toContain('"Pak Ketut"');
  });

  it("formats Budget items and Payment transactions correctly", () => {
    const budgetItems: BudgetItem[] = [
      {
        id: "bi1",
        weddingId: "w1",
        category: "busana_rias",
        title: "Payas Agung & Tata Rias",
        plannedAmount: 15000000,
        actualAmount: 14000000,
        paidAmount: 5000000,
        paidBy: "Pihak Purusa",
        status: "booked",
        quantity: 1,
        unit: "paket",
        unitPrice: 15000000,
        linkedRitualItemId: null,
        linkedVendorId: null,
        notes: "DP dibayar saat fitting",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        payments: [
          {
            id: "p1",
            weddingId: "w1",
            budgetItemId: "bi1",
            amount: 5000000,
            paymentDate: "2026-05-01",
            paymentMethod: "Transfer BCA",
            recipient: "Salon Agung Bali",
            notes: "DP 35%",
            receiptUrl: null,
            createdBy: null,
            createdAt: "2026-05-01",
          },
        ],
      },
    ];

    const budgetCsv = formatBudgetItemsToCSV(budgetItems);
    expect(budgetCsv).toContain('"Payas Agung & Tata Rias"');
    expect(budgetCsv).toContain('"14000000"');
    expect(budgetCsv).toContain('"5000000"');
    expect(budgetCsv).toContain('"9000000"'); // Outstanding = 14M - 5M

    const paymentsCsv = formatPaymentsToCSV(budgetItems);
    expect(paymentsCsv).toContain('"Salon Agung Bali"');
    expect(paymentsCsv).toContain('"Transfer BCA"');
    expect(paymentsCsv).toContain('"DP 35%"');
  });

  it("formats Vendors and Day-of Rundown correctly", () => {
    const vendors: Vendor[] = [
      {
        id: "v1",
        weddingId: "w1",
        name: "Gong Suling Semar Pegulingan",
        category: "musik_sound_gong",
        contactPerson: "Bli Wayan",
        phone: "081234567890",
        socialLink: "https://instagram.com/gongbali",
        status: "booked",
        quoteAmount: 6000000,
        agreedAmount: 5500000,
        paidAmount: 2000000,
        dueAmount: 3500000,
        picName: null,
        notes: "Termasuk tabuh penyambutan",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        linkedBudgetItems: [],
      },
    ];

    const vendorCsv = formatVendorsToCSV(vendors);
    expect(vendorCsv).toContain('"Gong Suling Semar Pegulingan"');
    expect(vendorCsv).toContain('"Dipesan & Terkonfirmasi"');
    expect(vendorCsv).toContain('"5500000"');
    expect(vendorCsv).toContain('"3500000"');

    const rundown: RundownEvent[] = [
      {
        id: "r1",
        weddingId: "w1",
        ceremonyId: null,
        segmentTitle: "Upacara Mabyakala",
        startTime: "09:00",
        endTime: "10:30",
        location: "Natah Umah",
        personInCharge: "Jero Mangku",
        orderIndex: 1,
        scheduledDate: "2026-06-20",
        notes: "Siapkan tetabuhan arak berem",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const rundownCsv = formatRundownToCSV(rundown);
    expect(rundownCsv).toContain('"Upacara Mabyakala"');
    expect(rundownCsv).toContain('"09:00"');
    expect(rundownCsv).toContain('"10:30"');
    expect(rundownCsv).toContain('"90"'); // 90 minutes
    expect(rundownCsv).toContain('"Jero Mangku"');
  });

  it("formats Guest list with headcount and Indonesian status labels", () => {
    const guests: Guest[] = [
      {
        id: "g1",
        weddingId: "w1",
        name: "Keluarga Jero Mangku Made",
        side: "groom",
        groupHousehold: "Banjar Tengah",
        headcount: 4,
        invitationStatus: "confirmed",
        phone: "081999888777",
        notes: "Hadir lengkap",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const guestCsv = formatGuestsToCSV(guests);
    expect(guestCsv).toContain('"Keluarga Jero Mangku Made"');
    expect(guestCsv).toContain('"Purusa (Pria)"');
    expect(guestCsv).toContain('"Hadir (Konfirmasi)"');
    expect(guestCsv).toContain('"4"');
  });
});

describe("Workspace Full Export Action", () => {
  it("bundles all modules into structured contingency payload for valid workspace", async () => {
    const { createClient } = await import("../src/lib/supabase/server");
    const { getWeddingWorkspace } =
      await import("../src/features/workspaces/actions");

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    vi.mocked(getWeddingWorkspace).mockResolvedValue({
      workspace: {
        id: "demo",
        slug: "demo-wedding",
        coupleNames: "Wayan & Kadek",
        groomName: "Wayan",
        brideName: "Kadek",
        prospectiveDate: "2026-08-20",
        locationRegion: "Gianyar",
        marriageForm: "memadik",
        targetBudget: 150000000,
        notes: null,
        createdBy: "user-123",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      role: "owner",
    });

    const res = await getWorkspaceFullExportAction("demo");
    expect(res.success).toBe(true);
    expect(res.data?.wedding.coupleNames).toBe("Wayan & Kadek");
    expect(res.data?.system).toContain("Patemon");
    expect(res.data?.exportedAt).toBeDefined();
  });
});

describe("Account Privacy & Data Takeout (UU PDP No. 27/2022)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports comprehensive user data takeout when authenticated", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "u-1",
              email: "wayan@example.com",
              user_metadata: { full_name: "I Wayan Pratama" },
              created_at: "2026-01-01T00:00:00Z",
            },
          },
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "u-1",
                    email: "wayan@example.com",
                    full_name: "I Wayan Pratama",
                    phone: "08123456789",
                  },
                }),
              }),
            }),
          };
        }
        if (table === "wedding_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation(() => ({
                eq: vi.fn().mockResolvedValue({ data: [] }),
                then: (resolve: (value: unknown) => void) =>
                  resolve({
                    data: [
                      {
                        wedding_id: "w-1",
                        role: "owner",
                        status: "active",
                        joined_at: "2026-01-02T00:00:00Z",
                        weddings: { couple_names: "Wayan & Kadek" },
                      },
                    ],
                  }),
              })),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await getUserDataTakeoutAction();
    expect(res.success).toBe(true);
    expect(res.data?.profile.fullName).toBe("I Wayan Pratama");
    expect(res.data?.dataProtectionNotice).toContain("UU No. 27 Tahun 2022");
    expect(res.data?.memberships[0].coupleNames).toBe("Wayan & Kadek");
  });

  it("blocks account deletion when user is sole owner of active workspace", async () => {
    const { createClient } = await import("../src/lib/supabase/server");

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u-owner" } },
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "wedding_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((col: string) => {
                if (col === "user_id") {
                  return {
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockResolvedValue({
                        data: [
                          {
                            wedding_id: "w-sole",
                            weddings: {
                              id: "w-sole",
                              couple_names: "Ketut & Putu",
                            },
                          },
                        ],
                      }),
                    }),
                  };
                }
                // When checking other active owners for w-sole:
                // .eq("wedding_id", ...).eq("role", "owner").eq("status", "active").neq("user_id", ...)
                return {
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      neq: vi.fn().mockResolvedValue({
                        data: [], // No other active owners!
                      }),
                    }),
                  }),
                };
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const eligibility = await checkAccountDeletionEligibilityAction();
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.soleOwnedWeddings).toHaveLength(1);
    expect(eligibility.soleOwnedWeddings[0].coupleNames).toBe("Ketut & Putu");

    // Attempting deleteUserAccountAction must fail
    const deleteRes = await deleteUserAccountAction("HAPUS AKUN");
    expect(deleteRes.success).toBe(false);
    expect(deleteRes.error).toContain("satu-satunya Pemilik aktif");
  });

  it("rejects deletion when confirmation phrase does not match 'HAPUS AKUN'", async () => {
    const res = await deleteUserAccountAction("hapus");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Frasa konfirmasi salah");
  });

  it("successfully processes account deletion when eligible and confirmed", async () => {
    const { createClient } = await import("../src/lib/supabase/server");
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u-editor" } },
        }),
        signOut: mockSignOut,
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "wedding_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [], // User is not an owner of any wedding
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            delete: mockDelete,
          };
        }
        return {};
      }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const res = await deleteUserAccountAction("HAPUS AKUN");
    expect(res.success).toBe(true);
    expect(mockSignOut).toHaveBeenCalled();
  });
});
