import React, { type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { buttons, menuItems } = vi.hoisted(() => ({
  buttons: [] as ComponentProps<"button">[],
  menuItems: [] as ComponentProps<"button">[],
}));
vi.mock("@/components/ui/button", () => ({
  Button: (props: ComponentProps<"button">) => {
    buttons.push(props);
    return null;
  },
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("@/components/ui/dropdown-menu", () => {
  const Group = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    DropdownMenu: Group,
    DropdownMenuContent: Group,
    DropdownMenuGroup: Group,
    DropdownMenuLabel: Group,
    DropdownMenuTrigger: Group,
    DropdownMenuItem: (props: ComponentProps<"button">) => {
      menuItems.push(props);
      return <>{props.children}</>;
    },
  };
});

import {
  WorkspaceProvider,
  useWorkspace,
  type WorkspaceContextValue,
} from "../src/features/workspaces/context/workspace-context";
import { WorkspaceActionButton } from "../src/features/workspaces/components/workspace-action-button";
import { TableActionDropdown } from "../src/components/ui/table-action-dropdown";
import { TableStatusDropdown } from "../src/components/ui/table-status-dropdown";
import { confirmAction } from "../src/components/ui/action-confirmation";
import type {
  WeddingWorkspace,
  WorkspaceRole,
} from "../src/features/workspaces/types";
import type { WorkspaceEntitlement } from "../src/features/payments/types";

const workspace: WeddingWorkspace = {
  id: "workspace-1",
  slug: null,
  coupleNames: "Couple",
  groomName: null,
  brideName: null,
  prospectiveDate: null,
  locationRegion: null,
  marriageForm: "memadik",
  targetBudget: 0,
  notes: null,
  createdBy: "owner",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};
function renderWorkspace(
  role: WorkspaceRole,
  paid: boolean,
  children: React.ReactNode,
  id = workspace.id
) {
  let context!: WorkspaceContextValue;
  function Probe() {
    context = useWorkspace()!;
    return null;
  }
  const entitlement: WorkspaceEntitlement = {
    weddingId: id,
    status: paid ? "active" : "unpaid",
    isPaid: paid,
    isDemo: id === "demo",
    grantedAt: null,
    validUntil: null,
    canEdit: paid && role !== "viewer",
    canInviteMembers: false,
    canExportCSV: false,
    planName: "Test",
    badgeLabel: "Test",
    daysRemaining: null,
  };
  const html = renderToStaticMarkup(
    <WorkspaceProvider
      workspace={{ ...workspace, id }}
      userRole={role}
      entitlement={entitlement}
    >
      <Probe />
      {children}
    </WorkspaceProvider>
  );
  return { context, html };
}

beforeEach(() => {
  buttons.length = 0;
  menuItems.length = 0;
});
afterEach(() => vi.unstubAllGlobals());

describe("viewer UX boundaries", () => {
  it.each([false, true])("blocks the edit flow for viewer, paid=%s", (paid) => {
    const edit = vi.fn();
    const { context } = renderWorkspace(
      "viewer",
      paid,
      <WorkspaceActionButton disabled onClick={edit}>
        Tambah
      </WorkspaceActionButton>
    );
    expect(context.isViewerOnly).toBe(true);
    expect(context.requestEdit()).toBe(false);
    const button = buttons.find((button) => button.children === "Tambah")!;
    expect(button.disabled).toBe(false);
    const preventDefault = vi.fn();
    button.onClick!({
      preventDefault,
    } as unknown as React.MouseEvent<HTMLButtonElement>);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(edit).not.toHaveBeenCalled();
  });
  it.each(["owner", "editor"] as const)(
    "allows %s through the role gate",
    (role) => {
      const edit = vi.fn();
      const { context } = renderWorkspace(
        role,
        true,
        <WorkspaceActionButton onClick={edit}>Ubah</WorkspaceActionButton>
      );
      expect(context.requestEdit()).toBe(true);
      buttons.find((button) => button.children === "Ubah")!.onClick!(
        {} as React.MouseEvent<HTMLButtonElement>
      );
      expect(edit).toHaveBeenCalledOnce();
    }
  );
  it("keeps public demo eligible for its existing upgrade prompt", () => {
    const { context } = renderWorkspace("viewer", false, null, "demo");
    expect(context.isPreview).toBe(true);
    expect(context.isViewerOnly).toBe(false);
    expect(context.requestEdit()).toBe(true);
  });
  it("blocks a viewer menu write but retains detail navigation", () => {
    const remove = vi.fn();
    const { html } = renderWorkspace(
      "viewer",
      true,
      <TableActionDropdown
        items={[
          { label: "Detail", href: "/workspace/workspace-1/ceremonies/item-1" },
          {
            label: "Hapus",
            onClick: remove,
            disabled: true,
            variant: "destructive",
          },
        ]}
      />
    );
    expect(html).toContain('href="/workspace/workspace-1/ceremonies/item-1"');
    const action = menuItems.find((item) => item.onClick)!;
    expect(action.disabled).toBe(false);
    action.onClick!({} as React.MouseEvent<HTMLButtonElement>);
    expect(remove).not.toHaveBeenCalled();
  });
  it("keeps status visible without opening a status editor for viewers", () => {
    const change = vi.fn();
    renderWorkspace(
      "viewer",
      true,
      <TableStatusDropdown
        value="draft"
        options={[{ value: "draft", label: "Draf" }]}
        onChange={change}
      />
    );
    expect(menuItems).toHaveLength(0);
    buttons.find((button) => button.children === "Draf")!.onClick!(
      {} as React.MouseEvent<HTMLButtonElement>
    );
    expect(change).not.toHaveBeenCalled();
  });
});

describe("confirmation boundary", () => {
  it("fails closed without a browser or mounted dialog listener", async () => {
    vi.stubGlobal("window", undefined);
    expect(
      await confirmAction({ title: "Hapus?", description: "Permanen." })
    ).toBe(false);
    vi.stubGlobal("window", new EventTarget());
    expect(
      await confirmAction({ title: "Hapus?", description: "Permanen." })
    ).toBe(false);
  });
  it.each([false, true])(
    "waits for dialog response %s before allowing a mutation",
    async (confirmed) => {
      const target = new EventTarget();
      vi.stubGlobal("window", target);
      let settle!: (confirmed: boolean) => void;
      target.addEventListener("patemon:confirm-action", (event) => {
        event.preventDefault();
        settle = (event as CustomEvent).detail.resolve;
      });
      const write = vi.fn();
      const pending = confirmAction({
        title: "Hapus?",
        description: "Permanen.",
      }).then((allow) => {
        if (allow) write();
      });
      await Promise.resolve();
      expect(write).not.toHaveBeenCalled();
      settle(confirmed);
      await pending;
      expect(write).toHaveBeenCalledTimes(confirmed ? 1 : 0);
    }
  );
});
