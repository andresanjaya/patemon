"use client";

import Link from "next/link";
import { CheckSquare, Store, Users, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface QuickModulesCardProps {
  weddingId: string;
  tasksCount: number;
  completedTasksCount: number;
  vendorsCount: number;
  bookedVendorsCount: number;
  guestsCount: number;
  confirmedHeadcount: number;
  totalHeadcount: number;
}

export function QuickModulesCard({
  weddingId,
  tasksCount,
  completedTasksCount,
  vendorsCount,
  bookedVendorsCount,
  guestsCount,
  confirmedHeadcount,
  totalHeadcount,
}: QuickModulesCardProps) {
  const taskPercent =
    tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-base font-semibold">
          Status Modul Kolaborasi
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {/* Checklist */}
        <Link
          href={`/workspace/${weddingId}/tasks`}
          className="border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-foreground text-xs font-semibold">
                Tugas & Checklist
              </p>
              <p className="text-muted-foreground text-[11px]">
                {tasksCount > 0
                  ? `${completedTasksCount} dari ${tasksCount} selesai (${taskPercent}%)`
                  : "Belum ada tugas"}
              </p>
            </div>
          </div>
          <ArrowRight className="text-muted-foreground h-4 w-4" />
        </Link>

        {/* Vendors */}
        <Link
          href={`/workspace/${weddingId}/vendors`}
          className="border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Store className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-foreground text-xs font-semibold">
                Rekanan & Vendor
              </p>
              <p className="text-muted-foreground text-[11px]">
                {vendorsCount > 0
                  ? `${bookedVendorsCount} dari ${vendorsCount} dipesan (deal)`
                  : "Belum ada vendor"}
              </p>
            </div>
          </div>
          <ArrowRight className="text-muted-foreground h-4 w-4" />
        </Link>

        {/* Guests */}
        <Link
          href={`/workspace/${weddingId}/guests`}
          className="border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-foreground text-xs font-semibold">
                Daftar Tamu Undangan
              </p>
              <p className="text-muted-foreground text-[11px]">
                {guestsCount > 0
                  ? `${confirmedHeadcount} hadir / estimasi ${totalHeadcount} pax`
                  : "Belum ada data tamu"}
              </p>
            </div>
          </div>
          <ArrowRight className="text-muted-foreground h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
