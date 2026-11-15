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
      className="workspace-card flex min-h-[360px] flex-col items-center justify-center overflow-hidden p-6 text-center sm:p-9"
      aria-labelledby="couple-title"
    >
      {/* Top Adat Meta */}
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-[#65656f]">
        <span>{formLabel}</span>
        <span aria-hidden="true">·</span>
        <span>{regionLabel}</span>
      </div>

      {/* Balinese Lotus Vector Art (Metronic Demo 10) */}
      <svg
        className="mb-2.5 h-[110px] w-[124px] text-[hsl(32_90%_36%)]"
        viewBox="0 0 150 130"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        aria-hidden="true"
      >
        <circle className="fill-[#fff5e6] stroke-none" cx="75" cy="65" r="48" />
        <path d="M75 24c-24 17-25 39 0 56 25-17 24-39 0-56Z M38 50c-6 30 9 43 37 43-3-25-12-39-37-43Z M112 50c6 30-9 43-37 43 3-25 12-39 37-43Z M33 95c18 22 66 22 84 0M75 93v24M28 31l3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm91-7v10m-5-5h10M16 72h9m102 11h8M64 11l-2-8m22 8 2-8" />
        <circle cx="119" cy="58" r="2" fill="currentColor" />
        <circle cx="32" cy="111" r="2" fill="currentColor" />
      </svg>

      {/* Main Couple Heading */}
      <h2
        id="couple-title"
        className="mb-2 text-2xl leading-tight font-semibold tracking-[-0.8px] text-[#18181b] sm:text-[25px]"
      >
        Satu langkah lebih dekat,
        <br />
        {coupleNames}.
      </h2>

      {/* Countdown Subtitle / Paragraph */}
      <p className="mb-5 max-w-[420px] text-xs leading-[1.8] text-[#65656f]">
        {isNotSet
          ? "Tanggal dewasa ayu belum ditentukan. Susun persiapan bersama keluarga, satu tugas kecil setiap harinya."
          : isToday
            ? "Rahina pawiwahan telah tiba hari ini! Selamat menempuh hidup baru dalam ikatan suci pawiwahan."
            : isPast
              ? `Pawiwahan telah terlaksana ${countdown.daysRemaining} hari yang lalu dengan khidmat dan lancar.`
              : `${countdown.daysRemaining} hari menuju pawiwahan. Susun persiapan bersama keluarga, satu tugas kecil setiap harinya.`}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <Link
          href={`/workspace/${weddingId}/tasks`}
          className="workspace-button workspace-button-primary"
        >
          <span>Lihat tugas prioritas</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={`/workspace/${weddingId}/ceremonies`}
          className="workspace-button"
        >
          <span>Rencana upacara</span>
        </Link>
      </div>

      {/* Footer Family Avatar Stack */}
      <div
        className="mt-5 flex items-center gap-2 text-[10px] text-[#65656f]"
        id="family"
      >
        <div className="flex -space-x-1.5" aria-hidden="true">
          <span className="flex h-[23px] w-[23px] items-center justify-center rounded-full border-2 border-white bg-[#ecdfcc] text-[8px] font-semibold text-[#66553e]">
            {coupleNames.slice(0, 2).toUpperCase()}
          </span>
          <span className="flex h-[23px] w-[23px] items-center justify-center rounded-full border-2 border-white bg-[#deece6] text-[8px] font-semibold text-[#406753]">
            KL
          </span>
          <span className="flex h-[23px] w-[23px] items-center justify-center rounded-full border-2 border-white bg-[#e4e2ef] text-[8px] font-semibold text-[#625a80]">
            BJ
          </span>
        </div>
        <span>Direncanakan bersama keluarga &amp; praktisi adat</span>
      </div>
    </section>
  );
}
