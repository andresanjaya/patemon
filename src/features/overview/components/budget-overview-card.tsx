"use client";

import Link from "next/link";
import { PlusCircle, ArrowRight } from "lucide-react";
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
  const percentPaid =
    targetBudget > 0
      ? Math.round((budgetStats.totalPaid / targetBudget) * 100)
      : 0;

  const percentCommitted =
    targetBudget > 0
      ? Math.round((budgetStats.totalOutstanding / targetBudget) * 100)
      : 0;

  const remainingBudget = budgetStats.remainingBudget;

  const paidWidth = Math.min(100, Math.max(0, percentPaid));
  const commitWidth = Math.min(100 - paidWidth, Math.max(0, percentCommitted));
  const remainingWidth = Math.max(0, 100 - paidWidth - commitWidth);

  return (
    <section
      className="workspace-card"
      id="budget"
      aria-labelledby="budget-title"
    >
      <header className="workspace-card-header">
        <h2 id="budget-title" className="text-sm font-semibold text-[#18181b]">
          Ringkasan Anggaran
        </h2>
        <span className="text-[10px] text-[#65656f]">Rupiah</span>
      </header>

      <div className="p-6">
        {!hasItems ? (
          <div className="space-y-3 py-3 text-center">
            <p className="text-xs text-[#65656f]">
              Belum ada rincian pos pengeluaran yang dicatat. Mulai catat
              kebutuhan upakara, tempat, dan vendor.
            </p>
            <Link
              href={`/workspace/${weddingId}/budget`}
              className="workspace-button workspace-button-primary w-full text-xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Buat Pos Anggaran Pertama</span>
            </Link>
          </div>
        ) : (
          <div>
            {/* Top: Total sudah dibayar (Terbayar Lunas) */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#65656f]">
                Total sudah dibayar (Terbayar Lunas)
              </span>
              <span className="workspace-pill">{percentPaid}% dari target</span>
            </div>

            <div className="my-2 text-[27px] font-semibold tracking-[-0.8px] text-[#18181b]">
              {formatRupiah(budgetStats.totalPaid)}
            </div>

            {/* Multi-segment Progress Bar */}
            <div
              className="mb-4 flex h-1.5 gap-1 overflow-hidden rounded-[2px]"
              role="img"
              aria-label={`Terbayar ${percentPaid} persen dari target anggaran`}
            >
              <span
                className="rounded-[2px] bg-[hsl(32_90%_36%)] transition-all duration-500"
                style={{ width: `${paidWidth}%` }}
              />
              <span
                className="rounded-[2px] bg-[#759b87] transition-all duration-500"
                style={{ width: `${commitWidth}%` }}
              />
              <span
                className="rounded-[2px] bg-[#e6e6eb] transition-all duration-500"
                style={{ width: `${remainingWidth}%` }}
              />
            </div>

            {/* 4-Column Grid: Target, Komitmen, Belum Dibayar, Sisa Pagu */}
            <div className="grid grid-cols-2 gap-3 border-t border-[#e9e9ed] pt-4 sm:grid-cols-4">
              <div>
                <span className="text-[10px] text-[#65656f]">
                  Target anggaran
                </span>
                <strong className="mt-1 block text-xs font-semibold text-[#18181b]">
                  {formatRupiah(targetBudget)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#65656f]">
                  Total Komitmen
                </span>
                <strong className="mt-1 block text-xs font-semibold text-[#18181b]">
                  {formatRupiah(budgetStats.totalActual)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#65656f]">
                  Belum Dibayar
                </span>
                <strong className="mt-1 block text-xs font-semibold text-[hsl(32_90%_36%)]">
                  {formatRupiah(budgetStats.totalOutstanding)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#65656f]">
                  Sisa Pagu Dana
                </span>
                <strong
                  className={`mt-1 block text-xs font-semibold ${
                    remainingBudget < 0 ? "text-[#b42335]" : "text-[#18181b]"
                  }`}
                >
                  {formatRupiah(remainingBudget)}
                </strong>
              </div>
            </div>

            <div className="mt-4 pt-2 text-right">
              <Link
                href={`/workspace/${weddingId}/budget`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(32_90%_36%)] hover:underline"
              >
                <span>Kelola {budgetStats.itemCount} pos pengeluaran</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
