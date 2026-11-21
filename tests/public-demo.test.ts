import { beforeEach, expect, test, vi } from "vitest";
import type { ReactElement } from "react";

const { createClient, createServerClient } = vi.hoisted(() => ({
  createClient: vi.fn(() => {
    throw new Error("Supabase unavailable");
  }),
  createServerClient: vi.fn(() => {
    throw new Error("Auth unavailable");
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { getWorkspaceUser } from "../src/features/workspaces/session";
import WorkspaceLayout from "../src/app/(dashboard)/workspace/[weddingId]/layout";
import WorkspacePage from "../src/app/(dashboard)/workspace/[weddingId]/page";

beforeEach(() => vi.clearAllMocks());

test("public demo middleware never initializes Auth, including nested routes", async () => {
  for (const path of ["/workspace/demo", "/workspace/demo/tasks"]) {
    const response = await middleware(
      new NextRequest(`http://localhost${path}`)
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  }
  expect(createServerClient).not.toHaveBeenCalled();
});

test("demo layout and overview render without Supabase or login", async () => {
  const params = Promise.resolve({ weddingId: "demo" });
  const layout = await WorkspaceLayout({ params, children: null });
  expect(layout.props.workspace.id).toBe("demo");
  expect(layout.props.user).toBeNull();
  const page = WorkspacePage({ params });
  const content = page.props.children as ReactElement<{
    params: typeof params;
  }>;
  const render = content.type as (
    props: typeof content.props
  ) => Promise<ReactElement>;
  expect(await render(content.props)).toBeTruthy();
  expect(createClient).not.toHaveBeenCalled();
});

test("non-demo workspace still requires real Auth", async () => {
  await expect(
    getWorkspaceUser("00000000-0000-4000-8000-000000000001")
  ).rejects.toThrow("Supabase unavailable");
  expect(createClient).toHaveBeenCalledOnce();
});
