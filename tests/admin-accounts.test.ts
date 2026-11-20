import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/features/admin/auth", () => ({ assertAdminSession: vi.fn() }));
vi.mock("../src/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { assertAdminSession } from "../src/features/admin/auth";
import { createAdminClient } from "../src/lib/supabase/admin";
import { listAdminAccountsAction } from "../src/features/admin/actions";

describe("Admin accounts directory", () => {
  const listUsers = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(assertAdminSession).mockResolvedValue({
      adminEmail: "admin@example.com", adminUserId: "admin", role: "superadmin",
    });
    vi.mocked(createAdminClient).mockReturnValue({
      auth: { admin: { listUsers } },
    } as unknown as ReturnType<typeof createAdminClient>);
  });

  it("lists Auth accounts without requiring profiles or workspaces and excludes private auth data", async () => {
    listUsers.mockResolvedValue({
      data: {
        total: 6,
        users: Array.from({ length: 6 }, (_, i) => ({
          id: `user-${i}`, email: `user-${i}@example.com`,
          user_metadata: { full_name: `User ${i}`, private_note: "secret" },
          app_metadata: { private_role: "secret" },
          identities: [{ provider: "google", identity_data: { secret: "secret" } }],
          created_at: "2026-11-20T00:00:00Z", last_sign_in_at: null,
        })),
      }, error: null,
    });
    const result = await listAdminAccountsAction();
    expect(result.success).toBe(true);
    expect(result.users).toHaveLength(6);
    expect(result.total).toBe(6);
    expect(result.hasMore).toBe(false);
    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 50 });
    expect(result.users[0]).toEqual({
      id: "user-0", email: "user-0@example.com", name: "User 0", providers: ["google"],
      createdAt: "2026-11-20T00:00:00Z", lastSignInAt: null,
    });
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("paginates beyond first 50 accounts", async () => {
    listUsers.mockResolvedValue({ data: { users: [], total: 101 }, error: null });
    expect((await listAdminAccountsAction(2)).hasMore).toBe(true);
    expect(listUsers).toHaveBeenCalledWith({ page: 2, perPage: 50 });
    expect((await listAdminAccountsAction(3)).hasMore).toBe(false);
  });

  it("rejects unauthorized requests before accessing Auth Admin", async () => {
    vi.mocked(assertAdminSession).mockRejectedValue(new Error("Access denied"));
    expect((await listAdminAccountsAction()).success).toBe(false);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(listUsers).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, NaN, Infinity])("rejects invalid page %s", async page => {
    expect((await listAdminAccountsAction(page)).success).toBe(false);
    expect(listUsers).not.toHaveBeenCalled();
  });

  it.each([false, true])("reports Auth errors without pretending directory is empty (throw: %s)", async throws => {
    const error = new Error("Private upstream error");
    if (throws) listUsers.mockRejectedValue(error);
    else listUsers.mockResolvedValue({ data: { users: [] }, error });
    const result = await listAdminAccountsAction();
    expect(result.success).toBe(false);
    expect(result.error).toContain("gagal dimuat");
    expect(result.error).not.toContain("Private upstream");
  });
});
