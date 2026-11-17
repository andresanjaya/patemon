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
          <p className="text-sm font-semibold text-[#18181b]">
            Semua Terkendali dengan Baik
          </p>
          <p className="mt-1 max-w-sm text-xs text-[#65656f]">
            Tidak ada tugas tertunda atau kendala mendesak saat ini. Terus jaga
            koordinasi bersama keluarga dan sekaa banjar.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Tugas persiapan dan penanggung jawab
              </caption>
              <thead>
                <tr className="border-b border-[#f0f0f4] bg-[#f9f9fb] text-xs font-semibold text-[#71717a]">
                  <th scope="col" className="px-5 py-3">
                    Tugas keluarga
                  </th>
                  <th scope="col" className="px-4 py-3">
                    PIC
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tenggat
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f4]">
                {actions.map((act) => (
                  <tr
                    key={act.id}
                    className="transition-colors hover:bg-[#f9f9fb]/80"
                  >
                    <td className="px-5 py-3.5 align-middle">
                      <Link
                        href={act.actionUrl}
                        className="font-semibold text-[#18181b] hover:text-[hsl(32_90%_36%)] transition-colors"
                      >
                        {act.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-[#71717a]">
                        {act.description}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8dbcb] text-[10px] font-semibold text-[#64513d]">
                          KL
                        </span>
                        <span className="text-sm text-[#18181b]">Keluarga</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap text-xs text-[#71717a]">
                      {formatDate(act.dueDate || null)}
                    </td>
                    <td className="px-5 py-3.5 align-middle whitespace-nowrap text-right">
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

          <footer className="flex items-center justify-between border-t border-[#f0f0f4] px-5 py-3 text-xs text-[#71717a]">
            <span>Menampilkan {actions.length} tugas perlu perhatian</span>
            <Link
              href={tasksHref}
              className="inline-flex items-center gap-1 font-medium text-[hsl(32_90%_36%)] hover:underline"
            >
              <span>Kelola seluruh checklist</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </footer>
        </>
      )}
    </section>
  );
}
