import { beforeEach, expect, it, vi } from "vitest";
import { STARTER_BUDGET_TEMPLATES } from "../src/features/budget/seeds";

const { query, insert, select, revalidatePath } = vi.hoisted(() => ({
  query: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
    from: () => ({ select: () => ({ eq: () => ({ is: query }) }), insert }),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/observability/logger", () => ({ captureError: vi.fn() }));

import { importStarterBudgetAction } from "../src/features/budget/actions";

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockReturnValue({ select });
  select.mockResolvedValue({ data: [{ id: "new" }], error: null });
});

it("imports complete workbook budget without duplicating existing titles", async () => {
  query.mockResolvedValue({
    data: [{ title: STARTER_BUDGET_TEMPLATES[0].title }],
    error: null,
  });
  expect((await importStarterBudgetAction("workspace-1")).success).toBe(true);
  const rows = insert.mock.calls[0][0];
  expect(rows).toHaveLength(STARTER_BUDGET_TEMPLATES.length - 1);
  expect(
    rows.some(
      (row: { title: string }) => row.title === "Biaya pengembalian barang sewa"
    )
  ).toBe(true);
  expect(rows[0].unit_price).toBe(0);
});

it("does not insert when every recommendation exists or existing-data lookup fails", async () => {
  query.mockResolvedValue({
    data: STARTER_BUDGET_TEMPLATES.map((item) => ({ title: item.title })),
    error: null,
  });
  expect(await importStarterBudgetAction("workspace-1")).toEqual({
    success: true,
    count: 0,
  });
  expect(insert).not.toHaveBeenCalled();
  query.mockResolvedValue({
    data: null,
    error: { message: "Database unavailable" },
  });
  expect(await importStarterBudgetAction("workspace-1")).toEqual({
    success: false,
    error: "Database unavailable",
  });
  expect(insert).not.toHaveBeenCalled();
});
