"use client";

import type {
  WeddingWorkspace,
  WorkspaceRole,
} from "@/features/workspaces/types";
import type {
  WeddingCeremony,
  CeremonyTemplate,
} from "@/features/ceremonies/types";
import type { BantenItem } from "@/features/banten/types";
import type { WeddingTask } from "@/features/checklist/types";
import type { BudgetItem } from "@/features/budget/types";
import type { Vendor, VendorStats } from "@/features/vendors/types";
import type { Guest, GuestStats } from "@/features/guests/types";
import type { RundownEvent, RundownStats } from "@/features/rundown/types";
import { calculateBudgetStats } from "@/features/budget/seeds";
import { CeremonyList } from "@/features/ceremonies/components/ceremony-list";
import {
  calculateCountdown,
  calculateReadinessScore,
  getUrgentActions,
  getNextUpcomingCeremony,
} from "../calculations";
import { CountdownCard } from "./countdown-card";
import { UpcomingCeremonyCard } from "./upcoming-ceremony-card";
import { ActionCenterCard } from "./action-center-card";
import { MyTasksCard } from "./my-tasks-card";
import { BantenOverviewCard } from "./banten-overview-card";
import { ReadinessCard } from "./readiness-card";
import { BudgetOverviewCard } from "./budget-overview-card";
import { RundownOverviewCard } from "./rundown-overview-card";
import { QuickModulesCard } from "./quick-modules-card";

interface OverviewDashboardProps {
  workspace: WeddingWorkspace;
  userRole: WorkspaceRole;
  ceremonies: WeddingCeremony[];
  templates: CeremonyTemplate[];
  bantenItems: BantenItem[];
  tasks: WeddingTask[];
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  vendorStats: VendorStats;
  guests: Guest[];
  guestStats: GuestStats;
  rundownEvents: RundownEvent[];
  rundownStats: RundownStats;
  currentUserId?: string | null;
}

export function OverviewDashboard({
  workspace,
  userRole,
  ceremonies,
  templates,
  bantenItems,
  tasks,
  budgetItems,
  vendors,
  vendorStats,
  guests,
  guestStats,
  rundownEvents,
  rundownStats,
  currentUserId = null,
}: OverviewDashboardProps) {
  // 1. Calculate Countdown
  const countdown = calculateCountdown(workspace.prospectiveDate);

  // 2. Calculate Readiness Score
  const readiness = calculateReadinessScore({
    ceremonies,
    bantenItems,
    tasks,
    budgetItems,
    targetBudget: workspace.targetBudget,
    vendors,
    rundownEvents,
  });

  // 3. Extract Urgent Actions
  const urgentActions = getUrgentActions({
    weddingId: workspace.id,
    tasks,
    bantenItems,
    ceremonies,
  });

  // 4. Extract Next Upcoming Ceremony
  const nextCeremony = getNextUpcomingCeremony({
    ceremonies,
    bantenItems,
    tasks,
  });

  // 5. Reconcile Budget Stats
  const budgetStats = calculateBudgetStats(budgetItems, workspace.targetBudget);

  const completedTasksCount = tasks.filter((t) => t.status === "done").length;
  const bookedVendorsCount = vendorStats.bookedVendors;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Kolom Utama / Main Track (span 2) */}
      <div className="space-y-8 lg:col-span-2">
        {/* Countdown & Next Ceremony Highlight */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <CountdownCard weddingId={workspace.id} countdown={countdown} />
          <UpcomingCeremonyCard
            ceremony={nextCeremony}
            workspaceId={workspace.id}
          />
        </div>

        {/* Action Center / Urgent Checklist Items */}
        <ActionCenterCard actions={urgentActions} />

        {/* Tugas Saya (Issue #83) */}
        <MyTasksCard
          weddingId={workspace.id}
          tasks={tasks}
          currentUserId={currentUserId}
        />

        {/* Kebutuhan Banten Terdekat */}
        <BantenOverviewCard
          weddingId={workspace.id}
          bantenItems={bantenItems}
        />

        {/* Rangkaian Prosesi Adat & Timeline Lengkap */}
        <div id="upacara" className="space-y-4">
          <CeremonyList
            weddingId={workspace.id}
            ceremonies={ceremonies}
            templates={templates}
            userRole={userRole}
          />
        </div>
      </div>

      {/* Kolom Sekunder / Highlights (span 1) */}
      <div className="space-y-8 lg:col-span-1">
        {/* Panel Kesiapan (Readiness Score & 6 Dimensi) */}
        <ReadinessCard score={readiness} />

        {/* Ringkasan Anggaran (Target, Aktual, Terbayar, Sisa) */}
        <BudgetOverviewCard
          weddingId={workspace.id}
          targetBudget={workspace.targetBudget}
          budgetStats={budgetStats}
        />

        {/* Agenda Hari-H / Susunan Acara Terdekat */}
        <RundownOverviewCard
          weddingId={workspace.id}
          rundownEvents={rundownEvents}
          rundownStats={rundownStats}
        />

        {/* Status Cepat Modul Kolaborasi */}
        <QuickModulesCard
          weddingId={workspace.id}
          tasksCount={tasks.length}
          completedTasksCount={completedTasksCount}
          vendorsCount={vendors.length}
          bookedVendorsCount={bookedVendorsCount}
          guestsCount={guests.length}
          confirmedHeadcount={guestStats.confirmedHeadcount}
          totalHeadcount={guestStats.totalHeadcount}
        />
      </div>
    </div>
  );
}
