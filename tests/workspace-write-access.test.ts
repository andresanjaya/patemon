import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, membership, from, getUser } = vi.hoisted(() => ({
  createClient: vi.fn(),
  membership: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/observability/logger", () => ({ captureError: vi.fn() }));

import { hasWorkspaceWriteAccess } from "../src/features/workspaces/write-access";
import {
  createBudgetItemAction,
  updateBudgetItemAction,
  deleteBudgetItemAction,
  recordPaymentAction,
  deletePaymentAction,
  importStarterBudgetAction,
} from "../src/features/budget/actions";
import {
  createVendorAction,
  updateVendorAction,
  updateVendorStatusAction,
  deleteVendorAction,
  importStarterVendorsAction,
} from "../src/features/vendors/actions";
import {
  createCustomCeremonyAction,
  updateCeremonyDetailsAction,
  deleteCeremonyAction,
  addRundownEventAction,
  deleteRundownEventAction,
  addRitualItemToCeremonyAction,
  updateRitualItemStatusAction,
  saveCeremonyPlanAction,
  updateCeremonyStatusAction,
} from "../src/features/ceremonies/actions";

const weddingId = "00000000-0000-4000-8000-000000000001";
const itemId = "00000000-0000-4000-8000-000000000002";
const client = { auth: { getUser }, from };
beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue(client);
  getUser.mockResolvedValue({ data: { user: { id: "member-1" } } });
  membership.mockResolvedValue({
    data: { role: "viewer", status: "active" },
    error: null,
  });
  from.mockImplementation((table: string) => {
    if (table !== "wedding_members")
      throw Error("A read-only write reached " + table);
    const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: membership };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    return query;
  });
});

describe("active editor/owner write access", () => {
  it.each(["owner", "editor"])("allows an active %s", async (role) => {
    membership.mockResolvedValue({
      data: { role, status: "active" },
      error: null,
    });
    expect(
      await hasWorkspaceWriteAccess(
        client as Awaited<ReturnType<typeof createClient>>,
        weddingId,
        "member-1"
      )
    ).toBe(true);
  });
  it.each([
    { data: { role: "viewer", status: "active" }, error: null },
    { data: { role: "editor", status: "revoked" }, error: null },
    { data: { role: "owner", status: "pending" }, error: null },
    { data: null, error: null },
    {
      data: { role: "editor", status: "active" },
      error: { message: "Database unavailable" },
    },
  ])(
    "rejects read-only/inactive/missing/failed membership checks",
    async (result) => {
      membership.mockResolvedValue(result);
      expect(
        await hasWorkspaceWriteAccess(
          client as Awaited<ReturnType<typeof createClient>>,
          weddingId,
          "member-1"
        )
      ).toBe(false);
    }
  );
});

const blockedActions = [
  [
    "create budget",
    () =>
      createBudgetItemAction(weddingId, {
        title: "Anggaran",
        category: "other",
        quantity: 1,
        unitPrice: 100,
      }),
  ],
  [
    "update budget",
    () => updateBudgetItemAction(weddingId, itemId, { title: "Anggaran" }),
  ],
  ["delete budget", () => deleteBudgetItemAction(weddingId, itemId)],
  [
    "record payment",
    () =>
      recordPaymentAction(weddingId, {
        budgetItemId: itemId,
        amount: 100,
        paymentDate: "2026-11-26",
      }),
  ],
  ["delete payment", () => deletePaymentAction(weddingId, itemId, itemId)],
  ["import budget", () => importStarterBudgetAction(weddingId)],
  [
    "create vendor",
    () => createVendorAction(weddingId, { name: "Vendor", category: "other" }),
  ],
  [
    "update vendor",
    () => updateVendorAction(weddingId, itemId, { name: "Vendor" }),
  ],
  [
    "vendor status",
    () => updateVendorStatusAction(weddingId, itemId, "prospect"),
  ],
  ["delete vendor", () => deleteVendorAction(weddingId, itemId)],
  ["import vendors", () => importStarterVendorsAction(weddingId)],
  [
    "create ceremony",
    () =>
      createCustomCeremonyAction(weddingId, {
        title: "Upacara",
        phase: "Persiapan",
      }),
  ],
  [
    "update ceremony",
    () =>
      updateCeremonyDetailsAction(weddingId, itemId, {
        title: "Upacara",
        status: "draft",
      }),
  ],
  ["delete ceremony", () => deleteCeremonyAction(weddingId, itemId)],
  [
    "add ceremony rundown",
    () =>
      addRundownEventAction(weddingId, itemId, {
        segmentTitle: "Acara",
        startTime: "08:00",
        endTime: "09:00",
      }),
  ],
  [
    "delete ceremony rundown",
    () => deleteRundownEventAction(weddingId, itemId, itemId),
  ],
  [
    "add ceremony ritual",
    () =>
      addRitualItemToCeremonyAction(weddingId, itemId, {
        name: "Sarana",
        quantity: 1,
        unit: "paket",
        sourcingMethod: "self_made",
      }),
  ],
  [
    "ritual status",
    () => updateRitualItemStatusAction(weddingId, itemId, itemId, "ready"),
  ],
  [
    "save ceremony plan",
    () =>
      saveCeremonyPlanAction(weddingId, [
        { title: "Upacara", phase: "Persiapan", orderIndex: 1 },
      ]),
  ],
  [
    "ceremony status",
    () => updateCeremonyStatusAction(itemId, weddingId, "confirmed"),
  ],
] as const;

it.each(blockedActions)(
  "blocks viewer %s before touching planning rows",
  async (_name, action) => {
    const result = await action();
    expect(result.success).toBe(false);
    expect(
      "error" in result
        ? result.error
        : "message" in result
          ? result.message
          : undefined
    ).toContain("hanya lihat");
    expect(from.mock.calls.map((call) => call[0])).toEqual(["wedding_members"]);
  }
);
