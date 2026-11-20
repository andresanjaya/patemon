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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-[30px]">
      {/* Kolom Kiri (2:1): Kartu Utama & Operasional */}
      <div className="flex flex-col gap-5 lg:col-span-2 lg:gap-[30px]">
        {/* 1. Hero Pasangan & Hitung Mundur */}
        <CountdownCard
          weddingId={workspace.id}
          countdown={countdown}
          coupleNames={workspace.coupleNames}
          locationRegion={workspace.locationRegion}
          marriageForm={workspace.marriageForm}
        />

        {/* 2. Perlu Perhatian Minggu Ini / Tugas Kritis */}
        <ActionCenterCard actions={urgentActions} weddingId={workspace.id} />

        {/* 3. Ringkasan Anggaran */}
        <BudgetOverviewCard
          weddingId={workspace.id}
          targetBudget={workspace.targetBudget}
          budgetStats={budgetStats}
        />

        {/* 4. Tugas Saya (PIC Assignment) */}
        <MyTasksCard
          weddingId={workspace.id}
          tasks={tasks}
          currentUserId={currentUserId}
        />

        {/* 5. Rangkaian Prosesi Adat & Timeline Lengkap */}
        <div id="upacara" className="space-y-4">
          <CeremonyList
            weddingId={workspace.id}
            ceremonies={ceremonies}
            templates={templates}
            userRole={userRole}
          />
        </div>
      </div>

      {/* Kolom Kanan (2:1): Kartu Kesiapan & Pendukung */}
      <div className="flex flex-col gap-5 lg:col-span-1 lg:gap-[30px]">
        {/* 1. Kesiapan Pernikahan */}
        <ReadinessCard
          score={readiness}
          daysRemaining={countdown.daysRemaining}
        />

        {/* 2. Agenda Terdekat */}
        <UpcomingCeremonyCard
          ceremony={nextCeremony}
          workspaceId={workspace.id}
        />

        {/* 3. Kebutuhan Banten & Sarana */}
        <BantenOverviewCard
          weddingId={workspace.id}
          bantenItems={bantenItems}
        />

        {/* 4. Agenda Hari-H / Rundown */}
        <RundownOverviewCard
          weddingId={workspace.id}
          rundownEvents={rundownEvents}
          rundownStats={rundownStats}
        />

        {/* 5. Status Cepat Modul Kolaborasi */}
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
