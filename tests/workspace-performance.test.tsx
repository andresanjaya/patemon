import React, { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  paginateTableRows,
  TablePagination,
  useTablePagination,
} from "../src/components/ui/table-pagination";

const { createClient, getUser, from, state } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  state: { grantStatus: "active" },
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("server-only", () => ({}));

import { getCeremonyTemplates } from "../src/features/ceremonies/queries";
import { getRitualCatalog } from "../src/features/banten/queries";
import { DEFAULT_CEREMONY_TEMPLATES } from "../src/features/ceremonies/seeds";
import { DEFAULT_RITUAL_CATALOG } from "../src/features/banten/seeds";
import { getWorkspaceUser } from "../src/features/workspaces/session";
import { getWeddingWorkspace } from "../src/features/workspaces/actions";
import { getWorkspaceEntitlement } from "../src/features/payments/entitlements";

const weddingId = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  state.grantStatus = "active";
  getUser.mockResolvedValue({ data: { user: { id: "owner" } } });
  createClient.mockResolvedValue({ auth: { getUser }, from });
  from.mockImplementation((table: string) => {
    const data =
      table === "weddings"
        ? {
            id: weddingId,
            created_by: "owner",
            couple_names: "Private wedding",
            target_budget: 1000,
          }
        : table === "wedding_members"
          ? { role: "viewer" }
          : {
              id: "grant-1",
              status: state.grantStatus,
              granted_at: "2026-01-01T00:00:00Z",
              valid_until: "2099-01-01T00:00:00Z",
            };
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn(),
    };
    for (const method of [
      query.select,
      query.eq,
      query.is,
      query.order,
      query.limit,
    ])
      method.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({ data, error: null });
    return query;
  });
});

describe("bounded table rendering", () => {
  it("visits every row once across pages and preserves source order and totals", () => {
    const rows = Array.from({ length: 157 }, (_, id) => ({
      id,
      amount: id + 1,
    }));
    const pages = [1, 2, 3, 4].map((page) => paginateTableRows(rows, page));
    expect(pages.map((page) => page.items.length)).toEqual([50, 50, 50, 7]);
    expect(pages.flatMap((page) => page.items)).toEqual(rows);
    expect(pages.map((page) => [page.start, page.end])).toEqual([
      [1, 50],
      [51, 100],
      [101, 150],
      [151, 157],
    ]);
    expect(rows.reduce((total, row) => total + row.amount, 0)).toBe(12403);
    expect(pages.every((page) => page.total === 157)).toBe(true);
  });

  it("handles empty results and clamps pages after filtering or deletion", () => {
    expect(paginateTableRows([], 4)).toMatchObject({
      items: [],
      page: 1,
      totalPages: 1,
      start: 0,
      end: 0,
    });
    expect(paginateTableRows(["match"], 4)).toMatchObject({
      items: ["match"],
      page: 1,
    });
    expect(paginateTableRows([1, 2], -1).items).toEqual([1, 2]);
  });

  it("names the navigation, exposes the result range and disables the first/last boundary", () => {
    const rows = Array.from({ length: 51 }, (_, id) => id);
    for (const page of [1, 2]) {
      const html = renderToStaticMarkup(
        <TablePagination
          label="tugas"
          pagination={{
            ...paginateTableRows(rows, page),
            onPageChange: vi.fn(),
          }}
        />
      );
      expect(html).toContain('aria-label="Halaman tugas"');
      expect(html).toContain('aria-live="polite"');
      expect(html.match(/ disabled=""/g)).toHaveLength(1);
      expect(html).toContain(
        page === 1 ? "1–50 dari 51 tugas" : "51–51 dari 51 tugas"
      );
    }
  });
});

it("resets the page when filters change and when returning to an earlier filter", () => {
  const observed: { step: number; page: number }[] = [];
  const rows = Array.from({ length: 100 }, (_, id) => id);
  function FilterHarness() {
    const [step, setStep] = useState(0);
    const pagination = useTablePagination(
      rows,
      step === 2 ? "filtered" : "all"
    );
    observed.push({ step, page: pagination.page });
    if (step === 0) {
      pagination.onPageChange(2);
      setStep(1);
    } else if (step < 3) {
      setStep(step + 1);
    }
    return null;
  }
  renderToStaticMarkup(<FilterHarness />);
  expect(observed.find((entry) => entry.step === 1)?.page).toBe(2);
  expect(
    observed
      .filter((entry) => entry.step >= 2)
      .every((entry) => entry.page === 1)
  ).toBe(true);
});

describe("demo catalog isolation", () => {
  it("uses complete curated seeds without Supabase and keeps filtering intact", async () => {
    expect(await getRitualCatalog(undefined, true)).toEqual(
      DEFAULT_RITUAL_CATALOG
    );
    expect(await getCeremonyTemplates(undefined, true)).toEqual(
      DEFAULT_CEREMONY_TEMPLATES
    );
    const phase = DEFAULT_CEREMONY_TEMPLATES[0].phase;
    expect(await getCeremonyTemplates({ phase }, true)).toEqual(
      DEFAULT_CEREMONY_TEMPLATES.filter((item) => item.phase === phase)
    );
    const itemType = DEFAULT_RITUAL_CATALOG[0].itemType;
    expect(await getRitualCatalog({ itemType }, true)).toEqual(
      DEFAULT_RITUAL_CATALOG.filter((item) => item.itemType === itemType)
    );
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("private reads stay fresh outside a React render", () => {
  it("does not keep a previous user or role between server-action calls", async () => {
    expect((await getWeddingWorkspace(weddingId)).role).toBe("owner");
    getUser.mockResolvedValue({ data: { user: { id: "viewer" } } });
    expect((await getWeddingWorkspace(weddingId)).role).toBe("viewer");
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await getWorkspaceUser(weddingId)).toBeNull();
    expect(await getWeddingWorkspace(weddingId)).toEqual({
      workspace: null,
      role: null,
    });
  });

  it("rechecks a revoked entitlement on the next server-action call", async () => {
    expect((await getWorkspaceEntitlement(weddingId)).canEdit).toBe(true);
    state.grantStatus = "revoked";
    expect(await getWorkspaceEntitlement(weddingId)).toMatchObject({
      status: "revoked",
      isPaid: false,
      canEdit: false,
    });
  });
});
