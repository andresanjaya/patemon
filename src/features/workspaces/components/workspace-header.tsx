"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarHeart,
  Settings,
  Flower2,
  Wallet,
  LayoutDashboard,
} from "lucide-react";
import { WorkspaceSwitcher } from "./workspace-switcher";
import type {
  WeddingWorkspace,
  WorkspaceRole,
  WorkspaceSummary,
} from "../types";
import { formatMarriageForm, formatRupiah } from "../validation";

interface WorkspaceHeaderProps {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
  userWorkspaces: WorkspaceSummary[];
}

export function WorkspaceHeader({
  workspace,
  userRole,
  userWorkspaces,
}: WorkspaceHeaderProps) {
  const pathname = usePathname();

  const basePath = `/workspace/${workspace.id}`;

  const navItems = [
    {
      label: "Ringkasan",
      href: basePath,
      icon: LayoutDashboard,
      active: pathname === basePath,
    },
    {
      label: "Pengaturan",
      href: `${basePath}/settings`,
      icon: Settings,
      active: pathname === `${basePath}/settings`,
    },
    {
      label: "Rencana Upacara",
      href: `${basePath}/ceremonies`,
      icon: CalendarHeart,
      active: pathname.startsWith(`${basePath}/ceremonies`),
    },
    {
      label: "Banten & Sarana",
      href: `${basePath}/banten`,
      icon: Flower2,
      active: pathname.startsWith(`${basePath}/banten`),
    },
    {
      label: "Anggaran",
      href: `${basePath}/#anggaran`,
      icon: Wallet,
      active: false,
    },
  ];

  return (
    <div className="border-border/60 bg-card/50 border-b">
      <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceSwitcher
              currentWorkspaceId={workspace.id}
              currentTitle={workspace.coupleNames}
              userRole={userRole}
              workspaces={userWorkspaces}
            />

            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>{formatMarriageForm(workspace.marriageForm)}</span>
              {workspace.locationRegion && (
                <>
                  <span>·</span>
                  <span>{workspace.locationRegion}</span>
                </>
              )}
              {workspace.targetBudget > 0 && (
                <>
                  <span>·</span>
                  <span className="text-foreground font-medium">
                    {formatRupiah(workspace.targetBudget)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Subnavigation */}
        <nav className="border-border/40 mt-4 flex space-x-1 overflow-x-auto border-t pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  item.active
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:border-border hover:text-foreground border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
