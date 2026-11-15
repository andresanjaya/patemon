"use client";

import Link from "next/link";
import { Wallet, ArrowRight, PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/features/workspaces/validation";
import type { BudgetStats } from "@/features/budget/types";

interface BudgetOverviewCardProps {
  weddingId: string;
  targetBudget: number;
  budgetStats: BudgetStats;
}

export function BudgetOverviewCard({
  weddingId,
  targetBudget,
  budgetStats,
}: BudgetOverviewCardProps) {
  const hasItems = budgetStats.itemCount > 0;
  const isOverBudget =
    targetBudget > 0 && budgetStats.totalActual > targetBudget;
  const percentUsed =
    targetBudget > 0
      ? Math.round((budgetStats.totalActual / targetBudget) * 100)
      : 0;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="text-primary h-4 w-4" />
          <CardTitle className="text-foreground text-base font-semibold">
            Ringkasan Anggaran
          </CardTitle>
        </div>
        {targetBudget > 0 && (
          <Badge
            variant="outline"
            className={`text-xs ${
              isOverBudget
                ? "border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                : percentUsed >= 85
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
          >
            {isOverBudget
              ? "Melebihi Target"
              : percentUsed >= 85
                ? "Mendekati Pagu"
                : "Terkendali"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Target Budget Header */}
        <div className="border-border/60 bg-muted/30 space-y-1 rounded-xl border p-3.5">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Target Alokasi Biaya
          </span>
          <div className="text-foreground text-xl font-extrabold">
            {formatRupiah(targetBudget)}
          </div>
          {targetBudget > 0 && hasItems && (
            <div className="space-y-1.5 pt-2">
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Terkomitmen: {percentUsed}%</span>
                <span>
                  Sisa: {formatRupiah(Math.max(0, budgetStats.remainingBudget))}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget
                      ? "bg-rose-500"
                      : percentUsed >= 85
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, percentUsed))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {!hasItems ? (
          <div className="space-y-3 py-3 text-center">
            <p className="text-muted-foreground text-xs">
              Belum ada rincian pos pengeluaran yang dicatat. Mulai catat
              kebutuhan upakara, tempat, dan vendor.
            </p>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="w-full gap-1.5 text-xs"
            >
              <Link href={`/workspace/${weddingId}/budget`}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Buat Pos Anggaran Pertama</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="border-border/60 bg-card space-y-0.5 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">
                  Total Komitmen
                </span>
                <p className="text-foreground truncate font-semibold">
                  {formatRupiah(budgetStats.totalActual)}
                </p>
              </div>
              <div className="border-border/60 bg-card space-y-0.5 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">
                  Terbayar Lunas
                </span>
                <p className="truncate font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(budgetStats.totalPaid)}
                </p>
              </div>
              <div className="border-border/60 bg-card space-y-0.5 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">
                  Belum Dibayar
                </span>
                <p className="truncate font-semibold text-amber-600 dark:text-amber-400">
                  {formatRupiah(budgetStats.totalOutstanding)}
                </p>
              </div>
              <div className="border-border/60 bg-card space-y-0.5 rounded-lg border p-2.5">
                <span className="text-muted-foreground text-[10px]">
                  Sisa Pagu Dana
                </span>
                <p
                  className={`truncate font-semibold ${
                    budgetStats.remainingBudget < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                  }`}
                >
                  {formatRupiah(budgetStats.remainingBudget)}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground w-full justify-between text-xs"
            >
              <Link href={`/workspace/${weddingId}/budget`}>
                <span>Kelola {budgetStats.itemCount} Pos Anggaran</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
