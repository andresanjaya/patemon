"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CountdownInfo } from "../types";
import type { MarriageForm } from "@/features/workspaces/types";
import { formatMarriageForm } from "@/features/workspaces/validation";

interface CountdownCardProps {
  weddingId: string;
  countdown: CountdownInfo;
  coupleNames?: string;
  locationRegion?: string | null;
  marriageForm?: MarriageForm | null;
}

export function CountdownCard({
  weddingId,
  countdown,
  coupleNames = "Calon Pengantin",
  locationRegion = "Bali",
  marriageForm = "memadik",
}: CountdownCardProps) {
  const isNotSet = countdown.status === "not_set";
  const isToday = countdown.status === "today";
  const isPast = countdown.status === "past";

  const formLabel = formatMarriageForm(marriageForm || "memadik").toUpperCase();
  const regionLabel = (locationRegion || "Bali").toUpperCase();

  return (
    <section
      className="workspace-card overflow-hidden p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      aria-labelledby="couple-title"
    >
      {/* Left Column: Lotus Badge + Details */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
        {/* Balinese Lotus Vector Art Badge */}
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/30 text-[hsl(32_90%_36%)] dark:text-amber-400 p-2 shadow-2xs">
          <svg
            className="h-full w-full"
            viewBox="0 0 150 130"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <circle className="fill-amber-100/50 dark:fill-amber-900/30 stroke-none" cx="75" cy="65" r="48" />
            <path d="M75 24c-24 17-25 39 0 56 25-17 24-39 0-56Z M38 50c-6 30 9 43 37 43-3-25-12-39-37-43Z M112 50c6 30-9 43-37 43 3-25 12-39 37-43Z M33 95c18 22 66 22 84 0M75 93v24M28 31l3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm91-7v10m-5-5h10M16 72h9m102 11h8M64 11l-2-8m22 8 2-8" />
            <circle cx="119" cy="58" r="2" fill="currentColor" />
            <circle cx="32" cy="111" r="2" fill="currentColor" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          {/* Top Adat Meta */}
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#65656f] dark:text-muted-foreground uppercase">
            <span>{formLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{regionLabel}</span>
          </div>

          {/* Main Couple Heading */}
          <h2
            id="couple-title"
            className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b] dark:text-foreground leading-snug truncate"
          >
            Satu langkah lebih dekat, {coupleNames}.
          </h2>

          {/* Countdown Subtitle / Paragraph */}
          <p className="mt-1 text-xs leading-relaxed text-[#65656f] dark:text-muted-foreground max-w-xl">
            {isNotSet
              ? "Tanggal dewasa ayu belum ditentukan. Susun persiapan bersama keluarga, satu tugas kecil setiap harinya."
              : isToday
                ? "Rahina pawiwahan telah tiba hari ini! Selamat menempuh hidup baru dalam ikatan suci pawiwahan."
                : isPast
                  ? `Pawiwahan telah terlaksana ${countdown.daysRemaining} hari yang lalu dengan khidmat dan lancar.`
                  : `${countdown.daysRemaining} hari menuju pawiwahan. Susun persiapan bersama keluarga, satu tugas kecil setiap harinya.`}
          </p>
        </div>
      </div>

      {/* Right Column: Action Buttons & Family Avatars */}
      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-[#f0f0f4] dark:border-border/60 lg:border-t-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/workspace/${weddingId}/tasks`}
            className="workspace-button workspace-button-primary text-xs"
          >
            <span>Lihat tugas prioritas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/workspace/${weddingId}/ceremonies`}
            className="workspace-button text-xs"
          >
            <span>Rencana upacara</span>
          </Link>
        </div>

        {/* Footer Family Avatar Stack */}
        <div
          className="flex items-center gap-2 text-[10px] text-[#65656f] dark:text-muted-foreground"
          id="family"
        >
          <div className="flex -space-x-1.5 overflow-hidden">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[8px] font-semibold text-amber-800 ring-2 ring-white dark:ring-card">
              PA
            </span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-semibold text-emerald-800 ring-2 ring-white dark:ring-card">
              KL
            </span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-semibold text-blue-800 ring-2 ring-white dark:ring-card">
              DJ
            </span>
          </div>
          <span>Direncanakan bersama keluarga & praktisi adat</span>
        </div>
      </div>
    </section>
  );
}
