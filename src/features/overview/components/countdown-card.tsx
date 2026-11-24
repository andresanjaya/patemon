"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarHeart } from "lucide-react";
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
      className="workspace-card overflow-hidden"
      aria-labelledby="couple-title"
    >
      {/* Left Column: Lotus Badge + Details */}
      <header className="border-border flex min-w-0 flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-7">
        {/* Balinese Lotus Vector Art Badge */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-50/60 p-2 text-[hsl(32_90%_36%)] shadow-2xs sm:h-20 sm:w-20 dark:bg-amber-950/30 dark:text-amber-400">
          <svg
            className="h-full w-full"
            viewBox="0 0 150 130"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <circle
              className="fill-amber-100/50 stroke-none dark:fill-amber-900/30"
              cx="75"
              cy="65"
              r="48"
            />
            <path d="M75 24c-24 17-25 39 0 56 25-17 24-39 0-56Z M38 50c-6 30 9 43 37 43-3-25-12-39-37-43Z M112 50c6 30-9 43-37 43 3-25 12-39 37-43Z M33 95c18 22 66 22 84 0M75 93v24M28 31l3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm91-7v10m-5-5h10M16 72h9m102 11h8M64 11l-2-8m22 8 2-8" />
            <circle cx="119" cy="58" r="2" fill="currentColor" />
            <circle cx="32" cy="111" r="2" fill="currentColor" />
          </svg>
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          {/* Top Adat Meta */}
          <div className="dark:text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#65656f] uppercase">
            <span>{formLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{regionLabel}</span>
          </div>

          {/* Main Couple Heading */}
          <h2
            id="couple-title"
            className="dark:text-foreground truncate text-xl leading-snug font-bold tracking-tight text-[#18181b] sm:text-2xl"
          >
            Satu langkah lebih dekat, {coupleNames}.
          </h2>

          {/* Countdown Subtitle / Paragraph */}
          <p className="dark:text-muted-foreground mt-1 max-w-xl text-xs leading-relaxed text-[#65656f]">
            {isNotSet
              ? "Tanggal dewasa ayu belum ditentukan. Susun persiapan bersama keluarga, satu tugas kecil setiap harinya."
              : isToday
                ? "Rahina pawiwahan telah tiba hari ini! Selamat menempuh hidup baru dalam ikatan suci pawiwahan."
                : isPast
                  ? `Pawiwahan telah terlaksana ${countdown.daysRemaining} hari yang lalu dengan khidmat dan lancar.`
                  : `${countdown.daysRemaining} hari menuju pawiwahan. Susun persiapan bersama keluarga, satu tugas kecil setiap harinya.`}
          </p>
        </div>
      </header>

      {/* Body: Action Buttons & Family Avatars */}
      <div className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" asChild className="gap-1.5 text-xs">
            <Link href={`/workspace/${weddingId}/tasks`}>
              <span>Lihat tugas prioritas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/workspace/${weddingId}/ceremonies`}>
              <CalendarHeart className="h-3.5 w-3.5" />
              <span>Rencana upacara</span>
            </Link>
          </Button>
        </div>

        {/* Footer Family Avatar Stack */}
        <div
          className="dark:text-muted-foreground flex items-center gap-2 text-[10px] text-[#65656f]"
          id="family"
        >
          <div className="flex -space-x-1.5 overflow-hidden">
            <span className="dark:ring-card inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[8px] font-semibold text-amber-800 ring-2 ring-white">
              PA
            </span>
            <span className="dark:ring-card inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-semibold text-emerald-800 ring-2 ring-white">
              KL
            </span>
            <span className="dark:ring-card inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-semibold text-blue-800 ring-2 ring-white">
              DJ
            </span>
          </div>
          <span>Direncanakan bersama keluarga & praktisi adat</span>
        </div>
      </div>
    </section>
  );
}
