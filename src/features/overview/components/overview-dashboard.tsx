"use client";

import Link from "next/link";
import {
  CalendarHeart,
  Flower2,
  Wallet,
  CheckSquare,
  Store,
  Users,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatRupiah } from "@/features/workspaces/validation";
import { calculateBudgetStats } from "@/features/budget/seeds";
import { CeremonyList } from "@/features/ceremonies/components/ceremony-list";
import {
  calculateCountdown,
  calculateReadinessScore,
  getUrgentActions,
  getNextUpcomingCeremony,
} from "../calculations";
import { CountdownCard } from "./countdown-card";
import { ReadinessCard } from "./readiness-card";
import { ActionCenterCard } from "./action-center-card";
import { UpcomingCeremonyCard } from "./upcoming-ceremony-card";

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

  return (
    <div className="space-y-8">
      {/* Row 1: Countdown & Next Ceremony Highlight */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CountdownCard weddingId={workspace.id} countdown={countdown} />
        <UpcomingCeremonyCard
          ceremony={nextCeremony}
          workspaceId={workspace.id}
        />
      </div>

      {/* Row 2: Comprehensive Readiness Calculation */}
      <ReadinessCard score={readiness} />

      {/* Row 3: Action Center / Urgent & Overdue Actions */}
      <ActionCenterCard actions={urgentActions} />

      {/* Row 4: Core Quick Stats Grid (6 Hubs) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Modul Perencanaan & Statistik
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. Ceremonies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rangkaian Prosesi
              </CardTitle>
              <CalendarHeart className="text-primary h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ceremonies.length > 0
                  ? `${ceremonies.length} Prosesi`
                  : "Belum Disusun"}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {ceremonies.length > 0
                  ? "Sesuai dresta & rembug keluarga"
                  : "Mulai dengan panduan onboarding"}
              </p>
            </CardContent>
          </Card>

          {/* 2. Banten & Upakara */}
          <Link
            href={`/workspace/${workspace.id}/banten`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Banten & Sarana
                </CardTitle>
                <Flower2 className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bantenItems.length > 0
                    ? `${bantenItems.length} Sarana`
                    : "Belum Disusun"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {bantenItems.length > 0
                    ? `${readiness.categories.banten.completedItems} siap / dimiliki`
                    : "Klik untuk buka perencana banten"}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 3. Tasks & Checklist */}
          <Link
            href={`/workspace/${workspace.id}/tasks`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tugas & Checklist
                </CardTitle>
                <CheckSquare className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.length > 0
                    ? `${completedTasksCount} / ${tasks.length}`
                    : "Belum Ada"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {tasks.length > 0
                    ? `${Math.round((completedTasksCount / tasks.length) * 100)}% terselesaikan`
                    : "Klik untuk kelola checklist"}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 4. Budget & Financial */}
          <Link
            href={`/workspace/${workspace.id}/budget`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Estimasi Anggaran
                </CardTitle>
                <Wallet className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRupiah(workspace.targetBudget)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {budgetStats.itemCount > 0
                    ? `Terpakai ${formatRupiah(budgetStats.totalActual)}`
                    : "Target alokasi upakara & resepsi"}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 5. Vendors & Partners */}
          <Link
            href={`/workspace/${workspace.id}/vendors`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rekanan & Vendor
                </CardTitle>
                <Store className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vendors.length > 0
                    ? `${vendorStats.bookedVendors} / ${vendors.length}`
                    : "Belum Ada"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {vendors.length > 0
                    ? `${vendorStats.bookedVendors} vendor telah dipesan (deal)`
                    : "Klik untuk kelola vendor"}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* 6. Guests & Invitations */}
          <Link
            href={`/workspace/${workspace.id}/guests`}
            className="block transition-transform hover:scale-[1.01]"
          >
            <Card className="hover:border-primary/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tamu & Undangan
                </CardTitle>
                <Users className="text-primary h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {guests.length > 0
                    ? `${guestStats.totalHeadcount} Pax`
                    : "Belum Ada"}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {guests.length > 0
                    ? `${guestStats.confirmedHeadcount} hadir (${guestStats.totalInvitations} undangan)`
                    : "Klik untuk kelola daftar tamu"}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Row 5: Day-of Rundown Preview (Single Clean Section) */}
      {rundownEvents.length > 0 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Clock className="text-primary h-4 w-4" />
              <CardTitle className="text-foreground text-base font-semibold">
                Susunan Acara Hari H (Rundown)
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {rundownStats.totalEvents} Segmen
              </Badge>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
              <Link href={`/workspace/${workspace.id}/rundown`}>
                <span>Buka Rundown Lengkap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-border/60 divide-y">
              {rundownEvents.slice(0, 4).map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col justify-between gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-mono text-xs font-bold">
                      {e.startTime} - {e.endTime}
                    </span>
                    <span className="text-foreground text-sm font-medium">
                      {e.segmentTitle}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 pl-16 text-xs sm:pl-0">
                    {e.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {e.location}
                      </span>
                    )}
                    {e.personInCharge && <span>PIC: {e.personInCharge}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 6: Ceremony Timeline & Detailed Plan */}
      <div id="upacara">
        <CeremonyList
          weddingId={workspace.id}
          ceremonies={ceremonies}
          templates={templates}
          userRole={userRole}
        />
      </div>
    </div>
  );
}
