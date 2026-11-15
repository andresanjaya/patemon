"use client";

import Link from "next/link";
import {
  Flower2,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const readyCount = bantenItems.filter((b) => b.status === "ready").length;
  const pendingCount = bantenItems.length - readyCount;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Flower2 className="text-primary h-4 w-4" />
          <CardTitle className="text-foreground text-base font-semibold">
            Kebutuhan Banten & Sarana
          </CardTitle>
        </div>
        {hasItems && (
          <Badge variant="outline" className="text-xs">
            {bantenItems.length} Sarana
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasItems ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-muted-foreground mx-auto max-w-sm text-xs">
              Belum ada sarana banten yang ditambahkan. Rundingkan bersama
              Serati Banten dan keluarga untuk menyusun kebutuhan upakara.
            </p>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="gap-1.5 text-xs"
            >
              <Link href={`/workspace/${weddingId}/banten`}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Susun Kebutuhan Banten</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick Summary Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="border-border/60 bg-muted/20 flex items-center gap-2 rounded-lg border p-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-muted-foreground text-[10px]">
                    Siap / Dibuat
                  </p>
                  <p className="text-foreground font-semibold">
                    {readyCount} Sarana
                  </p>
                </div>
              </div>
              <div className="border-border/60 bg-muted/20 flex items-center gap-2 rounded-lg border p-2.5">
                <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-muted-foreground text-[10px]">
                    Perlu Disiapkan
                  </p>
                  <p className="text-foreground font-semibold">
                    {pendingCount} Sarana
                  </p>
                </div>
              </div>
            </div>

            {/* List preview of top items */}
            <div className="divide-border/60 divide-y">
              {bantenItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <p className="text-foreground truncate font-medium">
                      {item.name}
                    </p>
                    <p className="text-muted-foreground truncate text-[10px]">
                      {item.sourcingMethod === "vendor_order" ||
                      item.sourcingMethod === "purchased_package"
                        ? "Pesan ke Serati / Vendor"
                        : item.sourcingMethod === "family_assigned"
                          ? "Gotong Royong Banjar / Keluarga"
                          : "Buat Sendiri (Keluarga)"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${
                      item.status === "ready"
                        ? "border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-amber-400/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    {item.status === "ready" ? "Siap" : "Dipersiapkan"}
                  </Badge>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground w-full justify-between pt-1 text-xs"
            >
              <Link href={`/workspace/${weddingId}/banten`}>
                <span>Lihat Seluruh {bantenItems.length} Sarana Banten</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
