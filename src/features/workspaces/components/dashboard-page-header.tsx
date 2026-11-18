import React from "react";
import Link from "next/link";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  current?: boolean;
}

export interface DashboardPageHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbSegment[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standardized Metronic Demo 10 Dashboard Page Header (Issue #115)
 * - Single H1: 22px / 600 / 28px, tracking -0.5px
 * - Breadcrumbs underneath: 14px / 400 / 20px, gap 8px
 * - Hierarchy: Ruang Kerja / {nama workspace} / {menu aktif} [/ {nama item}]
 * - Right actions toolbar aligned with top, responsive wrap below on mobile
 */
export function DashboardPageHeader({
  title,
  breadcrumbs,
  badge,
  actions,
  className = "",
}: DashboardPageHeaderProps) {
  return (
    <header
      className={`mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${className}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[22px] font-semibold leading-[28px] tracking-[-0.5px] text-[#18181b]">
            {title}
          </h1>
          {badge}
        </div>
        <nav
          className="mt-2 flex flex-wrap items-center gap-2 text-[14px] font-normal leading-[20px] text-[#65656f]"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((segment, index) => {
            const isLast = index === breadcrumbs.length - 1 || segment.current;
            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-[#a4a4ad]">
                    /
                  </span>
                )}
                {isLast || !segment.href ? (
                  <span
                    className="truncate max-w-[240px] font-medium text-[#18181b] sm:max-w-[360px]"
                    aria-current="page"
                    title={segment.label}
                  >
                    {segment.label}
                  </span>
                ) : (
                  <Link
                    href={segment.href}
                    className="truncate max-w-[200px] transition-colors hover:text-[#18181b] sm:max-w-[300px]"
                    title={segment.label}
                  >
                    {segment.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

/**
 * Generates standardized breadcrumb segments for workspace subpages
 */
export function createWorkspaceBreadcrumbs(
  workspaceName: string,
  weddingId: string,
  menuTitle: string,
  itemTitle?: string
): BreadcrumbSegment[] {
  const base: BreadcrumbSegment[] = [
    { label: "Ruang Kerja", href: "/workspaces" },
    { label: workspaceName, href: `/workspace/${weddingId}` },
  ];

  if (menuTitle === "Ringkasan" && !itemTitle) {
    base.push({ label: "Ringkasan", current: true });
    return base;
  }

  const menuMap: Record<string, string> = {
    "Rencana Upacara": "ceremonies",
    "Banten & Sarana": "banten",
    "Tugas & Checklist": "tasks",
    "Anggaran": "budget",
    "Vendor": "vendors",
    "Tamu": "guests",
    "Rundown": "rundown",
    "Riwayat": "history",
    "Pengaturan": "settings",
    "Panduan Onboarding": "onboarding",
  };

  const menuPath = menuMap[menuTitle];

  if (itemTitle) {
    base.push({
      label: menuTitle,
      href: menuPath ? `/workspace/${weddingId}/${menuPath}` : undefined,
    });
    base.push({ label: itemTitle, current: true });
  } else {
    base.push({ label: menuTitle, current: true });
  }

  return base;
}
