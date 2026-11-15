"use client";

import Link from "next/link";
import { Flower2, PlusCircle, ArrowRight } from "lucide-react";
import type { BantenItem } from "@/features/banten/types";

interface BantenOverviewCardProps {
  weddingId: string;
  bantenItems: BantenItem[];
}

export function BantenOverviewCard({
  weddingId,
  bantenItems,
}: BantenOverviewCardProps) {
  const hasItems = bantenItems.length > 0;
  const readyCount = bantenItems.filter(
    (b) => b.status === "ready" || b.status === "purchased"
  ).length;
  const pendingCount = bantenItems.length - readyCount;

  return (
    <section className="workspace-card" id="banten" aria-labelledby="banten-title">
      <header className="workspace-card-header">
        <h2 id="banten-title" className="text-sm font-semibold text-[#18181b]">
          Kebutuhan Banten & Sarana
        </h2>
        {hasItems && (
          <span className="workspace-pill">{bantenItems.length} Sarana</span>
        )}
      </header>

      <div className="p-5">
        {!hasItems ? (
          <div className="space-y-3 py-4 text-center">
            <p className="mx-auto max-w-sm text-xs text-[#65656f]">
              Belum ada sarana banten yang ditambahkan. Rundingkan bersama Serati Banten dan keluarga untuk menyusun kebutuhan upakara.
            </p>
            <div className="mt-2">
              <Link
                href={`/workspace/${weddingId}/banten`}
                className="workspace-button workspace-button-primary text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Susun Kebutuhan Banten</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Quick Summary Chips */}
            <div className="mb-3.5 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[6px] border border-[#e9e9ed] bg-[#fafafa] p-2.5">
                <span className="text-[10px] text-[#65656f]">Siap / Dibuat</span>
                <p className="font-semibold text-[#18794e]">{readyCount} Sarana</p>
              </div>
              <div className="rounded-[6px] border border-[#e9e9ed] bg-[#fafafa] p-2.5">
                <span className="text-[10px] text-[#65656f]">Perlu Disiapkan</span>
                <p className="font-semibold text-[hsl(32_90%_36%)]">
                  {pendingCount} Sarana
                </p>
              </div>
            </div>

            {/* List Preview (Metronic Demo 10 Banten List) */}
            <div className="divide-y divide-[#e9e9ed]">
              {bantenItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 py-2.5 text-[11px] first:pt-0 last:pb-0"
                >
                  <Flower2 className="h-4 w-4 shrink-0 text-[#65656f]" />
                  <div className="min-w-0 flex-1 truncate">
                    <span className="truncate font-medium text-[#18181b]">
                      {item.name}
                    </span>
                    <small className="block truncate text-[9px] text-[#65656f]">
                      {item.quantity} {item.unit} · {item.assigneeName || "Keluarga"}
                    </small>
                  </div>
                  <span
                    className={`shrink-0 ${
                      item.status === "ready"
                        ? "workspace-pill"
                        : "workspace-pill workspace-pill-warn"
                    }`}
                  >
                    {item.status === "ready" ? "Siap" : "Dipesan"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3.5 border-t border-[#e9e9ed] pt-2 text-right">
              <Link
                href={`/workspace/${weddingId}/banten`}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(32_90%_36%)] hover:underline"
              >
                <span>Lihat seluruh kebutuhan banten</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
