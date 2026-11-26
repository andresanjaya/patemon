import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/features/admin/auth", () => ({ assertAdminSession: vi.fn() }));
vi.mock("../src/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { assertAdminSession } from "../src/features/admin/auth";
import { createAdminClient } from "../src/lib/supabase/admin";
import { adminDeleteWorkspaceAction } from "../src/features/admin/actions";
import { revalidatePath } from "next/cache";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminWeddingsSearch } from "../src/features/admin/components/admin-weddings-search";
import { AdminAccountsTable } from "../src/features/admin/components/admin-accounts-table";

describe("Master admin workspace deletion", () => {
  const rpc = vi.fn();
  const input = {
    weddingId: "12345678-1234-1234-1234-123456789012",
    confirmation: "A & B",
    reason: "  Workspace duplikat  ",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(assertAdminSession).mockResolvedValue({
      adminEmail: "admin@example.com",
      adminUserId: "admin-id",
      role: "superadmin",
    });
    vi.mocked(createAdminClient).mockReturnValue({
      rpc,
    } as unknown as ReturnType<typeof createAdminClient>);
    rpc.mockResolvedValue({ error: null });
  });

  it("authorizes before calling atomic delete/audit RPC and revalidates affected paths", async () => {
    expect(await adminDeleteWorkspaceAction(input)).toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("admin_soft_delete_workspace", {
      p_wedding_id: input.weddingId,
      p_confirmation: input.confirmation,
      p_reason: "Workspace duplikat",
      p_admin_user_id: "admin-id",
      p_admin_email: "admin@example.com",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/workspace/${input.weddingId}`,
      "layout"
    );
  });

  it("rejects missing admin session before creating privileged client", async () => {
    vi.mocked(assertAdminSession).mockRejectedValue(new Error("Unauthorized"));
    expect((await adminDeleteWorkspaceAction(input)).success).toBe(false);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects support operators", async () => {
    vi.mocked(assertAdminSession).mockResolvedValue({
      adminEmail: "support@example.com",
      adminUserId: "support",
      role: "support_operator",
    });
    expect((await adminDeleteWorkspaceAction(input)).success).toBe(false);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it.each([
    { weddingId: "demo" },
    { weddingId: "bad-id" },
    { confirmation: "" },
    { confirmation: "x".repeat(501) },
    { reason: "short" },
    { reason: " ".repeat(10) },
    { reason: "x".repeat(1001) },
  ])("rejects invalid input %j before database access", async (invalid) => {
    expect(
      (await adminDeleteWorkspaceAction({ ...input, ...invalid })).success
    ).toBe(false);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "reports RPC failures without optimistic removal or private details (throw %s)",
    async (throws) => {
      if (throws) rpc.mockRejectedValue(new Error("private database details"));
      else
        rpc.mockResolvedValue({ error: new Error("private database details") });
      const result = await adminDeleteWorkspaceAction(input);
      expect(result.success).toBe(false);
      expect(result.error).not.toContain("private database details");
      expect(revalidatePath).not.toHaveBeenCalled();
    }
  );

  it("ships locked, atomic soft-delete SQL and shared table controls with explicit confirmation", () => {
    const sql = readFileSync(
      "supabase/migrations/20261120000001_admin_soft_delete_workspace.sql",
      "utf8"
    );
    expect(sql).toContain("FOR UPDATE");
    expect(sql).toContain(
      "p_confirmation IS DISTINCT FROM workspace.couple_names"
    );
    expect(sql).toContain("UPDATE public.weddings SET deleted_at");
    expect(sql).toContain("INSERT INTO public.admin_audit_logs");
    expect(sql).toContain("FROM PUBLIC, anon, authenticated");
    expect(sql).toContain("TO service_role");
    expect(sql).not.toMatch(/DELETE FROM/i);
    const ui = readFileSync(
      "src/features/admin/components/admin-weddings-search.tsx",
      "utf8"
    );
    for (const symbol of [
      "TableDropdownFilter",
      "TableActionDropdown",
      "<TableHeader>",
      "<TableCell",
      "<dialog",
      "showModal()",
      '<ActionAlert variant="destructive" message={deleteError}',
      "confirmation !== deleteTarget.coupleNames",
    ])
      expect(ui).toContain(symbol);
  });

  it("renders accessible shared tables and empty states without opening deletion dialog", () => {
    const workspaces = renderToStaticMarkup(
      createElement(AdminWeddingsSearch, { initialWeddings: [] })
    );
    expect(workspaces).toContain('aria-label="Daftar workspace wedding"');
    expect(workspaces).toContain("table-metronic");
    expect(workspaces).toContain("Tidak ada workspace wedding");
    expect(workspaces).not.toContain("<dialog open");
    expect(workspaces).toContain(
      "Data terkait, akun pemilik, dan riwayat pembayaran tidak dihapus permanen."
    );
    const accounts = renderToStaticMarkup(
      createElement(AdminAccountsTable, {
        initialResult: {
          success: true,
          users: [],
          total: 0,
          page: 1,
          hasMore: false,
        },
      })
    );
    expect(accounts).toContain("table-metronic");
    expect(accounts).toContain("Belum ada akun pada halaman ini.");
  });
});
