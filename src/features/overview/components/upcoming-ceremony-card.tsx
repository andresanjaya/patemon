"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import type { NextUpcomingCeremony } from "../types";

interface UpcomingCeremonyCardProps {
  ceremony: NextUpcomingCeremony | null;
  workspaceId: string;
}

function parseDateComponents(dateStr: string | null) {
  if (!dateStr) return { month: "ADAT", day: "—" };
  try {
    const d = new Date(dateStr);
    const month = d.toLocaleDateString("id-ID", { month: "short" });
    const day = d.getDate().toString();
    return { month, day };
  } catch {
    return { month: "ADAT", day: "—" };
  }
}

export function UpcomingCeremonyCard({
  ceremony,
  workspaceId,
}: UpcomingCeremonyCardProps) {
  if (!ceremony) {
    return (
      <section
        className="workspace-card"
        id="agenda"
        aria-labelledby="agenda-title"
      >
        <header className="workspace-card-header">
          <h2
            id="agenda-title"
            className="text-sm font-semibold text-[#18181b]"
          >
            Agenda Terdekat
          </h2>
          <Clock className="h-4 w-4 text-[#65656f]" />
        </header>
        <div className="p-6 text-center">
          <p className="text-xs text-[#65656f]">
            Belum ada prosesi adat yang disusun dalam rencana pawiwahan Anda.
          </p>
          <div className="mt-3">
            <Link
              href={`/workspace/${workspaceId}/onboarding`}
              className={buttonVariants({ className: "text-xs" })}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Susun Rencana Adat</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { month, day } = parseDateComponents(ceremony.scheduledDate);
  const isToday = ceremony.daysUntil === 0;

  return (
    <section
      className="workspace-card"
      id="agenda"
      aria-labelledby="agenda-title"
    >
      <header className="workspace-card-header">
        <h2 id="agenda-title" className="text-sm font-semibold text-[#18181b]">
          Agenda Terdekat
        </h2>
        <Clock className="h-4 w-4 text-[#65656f]" />
      </header>

      <div className="p-5">
        <article className="flex items-start gap-3.5">
          {/* Metronic Demo 10 Date Block */}
          <div className="w-10 shrink-0 overflow-hidden rounded-[6px] border border-[#e9e9ed] text-center">
            <span className="block bg-[#fafafa] py-1 text-[8px] font-semibold text-[#65656f] uppercase">
              {month}
            </span>
            <strong className="block py-0.5 text-base font-semibold text-[#18181b]">
              {day}
            </strong>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs font-semibold text-[#18181b]">
              {ceremony.title}
            </h3>
            <p className="mt-0.5 truncate text-[10px] text-[#65656f]">
              {ceremony.location ? `${ceremony.location} · ` : ""}
              {ceremony.personInCharge
                ? `PIC: ${ceremony.personInCharge}`
                : "Sesuai kesepakatan keluarga"}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`workspace-pill ${
                  isToday
                    ? "workspace-pill-warn"
                    : ceremony.daysUntil && ceremony.daysUntil <= 3
                      ? "workspace-pill-warn"
                      : ""
                }`}
              >
                {isToday
                  ? "Hari Ini"
                  : ceremony.daysUntil !== null
                    ? `${ceremony.daysUntil} Hari Lagi`
                    : "Terkonfirmasi"}
              </span>

              {ceremony.bantenCount > 0 && (
                <span className="text-[10px] text-[#65656f]">
                  {ceremony.bantenCount} sarana banten
                </span>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
