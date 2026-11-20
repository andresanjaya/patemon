"use client";

import { CalendarHeart, Flower2, CheckSquare, Store } from "lucide-react";
import type { ReadinessScore } from "../types";

interface ReadinessCardProps {
  score: ReadinessScore;
  daysRemaining?: number | null;
}

export function ReadinessCard({
  score,
  daysRemaining = null,
}: ReadinessCardProps) {
  const { overallScore, levelLabel, categories } = score;

  const scorePct = Number.isFinite(overallScore)
    ? Math.min(100, Math.max(0, overallScore))
    : 0;

  return (
    <section className="workspace-card" aria-labelledby="readiness-title">
      <header className="workspace-card-header">
        <h2
          id="readiness-title"
          className="text-sm font-semibold text-[#18181b]"
        >
          Kesiapan Pernikahan
        </h2>
        <span className="workspace-pill">{levelLabel}</span>
      </header>

      <div className="p-6">
        <div className="text-[11px] text-[#65656f]">Skor kesiapan</div>

        <div className="my-1.5 mb-3.5 flex items-center gap-3">
          <strong className="text-[35px] leading-none font-semibold tracking-[-1.2px] text-[#18181b]">
            {scorePct}
            <span className="text-[20px] font-normal text-[#65656f]">%</span>
          </strong>
          {daysRemaining !== null ? (
            <span className="workspace-pill workspace-pill-warn">
              {daysRemaining === 0 ? "Hari Ini" : `${daysRemaining} hari lagi`}
            </span>
          ) : (
            <span className="workspace-pill workspace-pill-warn">
              Atur Tanggal
            </span>
          )}
        </div>

        <div
          className="mb-4 h-1.5 overflow-hidden rounded-[2px] bg-[#e6e6eb]"
          role="progressbar"
          aria-label="Skor kesiapan"
          aria-describedby="readiness-description"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={scorePct}
        >
          <span
            className="block h-full rounded-[2px] bg-[hsl(32_90%_36%)]"
            style={{ width: `${scorePct}%` }}
          />
        </div>

        <p
          id="readiness-description"
          className="mb-5 text-xs leading-relaxed text-[#65656f]"
        >
          Skor berbobot dari upacara, banten, tugas, vendor, anggaran, dan
          rundown; bukan persentase jumlah tugas selesai.
        </p>

        {/* 4 Core Readiness Metrics */}
        <div className="grid gap-3.5 border-t border-[#e9e9ed] pt-4 text-[11px]">
          <div className="flex items-center gap-2.5">
            <CalendarHeart className="h-[15px] w-[15px] text-[#90909a]" />
            <span className="text-[#18181b]">Rencana upacara</span>
            <span className="ml-auto font-semibold text-[#18181b]">
              {categories.ceremonies.completedItems}
            </span>
            <span className="w-10 text-right text-[10px] text-[#65656f]">
              / {categories.ceremonies.totalItems}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Flower2 className="h-[15px] w-[15px] text-[#90909a]" />
            <span className="text-[#18181b]">Banten siap</span>
            <span className="ml-auto font-semibold text-[#18181b]">
              {categories.banten.completedItems}
            </span>
            <span className="w-10 text-right text-[10px] text-[#65656f]">
              / {categories.banten.totalItems}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <CheckSquare className="h-[15px] w-[15px] text-[#90909a]" />
            <span className="text-[#18181b]">Tugas selesai</span>
            <span className="ml-auto font-semibold text-[#18181b]">
              {categories.tasks.completedItems}
            </span>
            <span className="w-10 text-right text-[10px] text-[#65656f]">
              / {categories.tasks.totalItems}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Store className="h-[15px] w-[15px] text-[#90909a]" />
            <span className="text-[#18181b]">Vendor dikonfirmasi</span>
            <span className="ml-auto font-semibold text-[#18181b]">
              {categories.vendors.completedItems}
            </span>
            <span className="w-10 text-right text-[10px] text-[#65656f]">
              / {categories.vendors.totalItems}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
