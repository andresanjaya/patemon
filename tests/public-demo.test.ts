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
import { getPreviewCeremonies } from "../src/features/preview/preview-data";
import TasksPage from "../src/app/(dashboard)/workspace/[weddingId]/tasks/page";
import BantenPage from "../src/app/(dashboard)/workspace/[weddingId]/banten/page";
import CeremoniesPage from "../src/app/(dashboard)/workspace/[weddingId]/ceremonies/page";
import OnboardingPage from "../src/app/(dashboard)/workspace/[weddingId]/onboarding/page";
import BudgetPage from "../src/app/(dashboard)/workspace/[weddingId]/budget/page";
import GuestsPage from "../src/app/(dashboard)/workspace/[weddingId]/guests/page";
import VendorsPage from "../src/app/(dashboard)/workspace/[weddingId]/vendors/page";
import RundownPage from "../src/app/(dashboard)/workspace/[weddingId]/rundown/page";
import SettingsPage from "../src/app/(dashboard)/workspace/[weddingId]/settings/page";
import HistoryPage from "../src/app/(dashboard)/workspace/[weddingId]/history/page";
import CeremonyDetailPage from "../src/app/(dashboard)/workspace/[weddingId]/ceremonies/[ceremonyId]/page";

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

test.each([
  ["tasks", TasksPage],
  ["banten", BantenPage],
  ["ceremonies", CeremoniesPage],
  ["onboarding", OnboardingPage],
  ["budget", BudgetPage],
  ["guests", GuestsPage],
  ["vendors", VendorsPage],
  ["rundown", RundownPage],
  ["settings", SettingsPage],
  ["history", HistoryPage],
  ["ceremony detail", CeremonyDetailPage],
])("demo %s renders without querying Supabase", async (_name, Page) => {
  const params = Promise.resolve({
    weddingId: "demo",
    ceremonyId: getPreviewCeremonies("demo")[0].id,
  });
  const page = Page({ params });
  const content = page.props.children as ReactElement<{
    params: typeof params;
  }>;
  const render = content.type as (
    props: typeof content.props
  ) => Promise<ReactElement>;
  expect(await render(content.props)).toBeTruthy();
  expect(createClient).not.toHaveBeenCalled();
});
