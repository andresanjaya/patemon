"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import type { UrgentAction } from "../types";

interface ActionCenterCardProps {
  actions: UrgentAction[];
  weddingId?: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Segera";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

export function ActionCenterCard({
  actions,
  weddingId,
}: ActionCenterCardProps) {
  const tasksHref = weddingId ? `/workspace/${weddingId}/tasks` : "#tasks";

  return (
    <section
      className="workspace-card"
      id="tasks"
      aria-labelledby="tasks-title"
    >
      <header className="workspace-card-header">
        <h2 id="tasks-title" className="text-sm font-semibold text-[#18181b]">
          Perlu perhatian minggu ini
        </h2>
        {actions.length > 0 && (
          <span className="workspace-pill workspace-pill-warn">
            {actions.length} tugas
          </span>
        )}
      </header>

      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#edf9f2] text-[#18794e]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-[#18181b]">
            Semua Terkendali dengan Baik
          </p>
          <p className="mt-1 max-w-sm text-[11px] text-[#65656f]">
            Tidak ada tugas tertunda atau kendala mendesak saat ini. Terus jaga
            koordinasi bersama keluarga dan sekaa banjar.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[11px]">
              <caption className="sr-only">
                Tugas persiapan dan penanggung jawab
              </caption>
              <thead>
                <tr className="border-b border-[#e9e9ed] bg-[#fafafa] text-[10px] font-medium text-[#65656f]">
                  <th scope="col" className="py-2.5 pr-4 pl-5">
                    Tugas keluarga
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    PIC
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Tenggat
                  </th>
                  <th scope="col" className="py-2.5 pr-5 pl-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9e9ed]">
                {actions.map((act) => (
                  <tr
                    key={act.id}
                    className="transition-colors hover:bg-[#fafafa]"
                  >
                    <td className="py-3 pr-4 pl-5 align-middle">
                      <Link
                        href={act.actionUrl}
                        className="font-semibold text-[#18181b] hover:text-[hsl(32_90%_36%)]"
                      >
                        {act.title}
                      </Link>
                      <span className="mt-0.5 block text-[10px] text-[#65656f]">
                        {act.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-[23px] w-[23px] items-center justify-center rounded-full bg-[#e8dbcb] text-[8px] font-semibold text-[#64513d]">
                          KL
                        </span>
                        <span className="text-[#18181b]">Keluarga</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap text-[#65656f]">
                      {formatDate(act.dueDate || null)}
                    </td>
                    <td className="py-3 pr-5 pl-4 align-middle whitespace-nowrap">
                      {act.isOverdue ? (
                        <span className="workspace-pill workspace-pill-danger">
                          Terlambat
                        </span>
                      ) : act.priority === "urgent" ? (
                        <span className="workspace-pill workspace-pill-danger">
                          Prioritas
                        </span>
                      ) : (
                        <span className="workspace-pill workspace-pill-warn">
                          Berjalan
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex items-center justify-between border-t border-[#e9e9ed] px-5 py-3.5 text-[10px] text-[#65656f]">
            <span>{actions.length} tugas perlu perhatian</span>
            <Link
              href={tasksHref}
              className="inline-flex items-center gap-1 font-medium text-[hsl(32_90%_36%)] hover:underline"
            >
              <span>Kelola seluruh checklist</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </footer>
        </>
      )}
    </section>
  );
}
