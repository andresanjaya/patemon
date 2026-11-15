"use client";

import Link from "next/link";
import { Clock, ArrowRight, PlusCircle, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RundownEvent, RundownStats } from "@/features/rundown/types";

interface RundownOverviewCardProps {
  weddingId: string;
  rundownEvents: RundownEvent[];
  rundownStats: RundownStats;
}

export function RundownOverviewCard({
  weddingId,
  rundownEvents,
  rundownStats,
}: RundownOverviewCardProps) {
  const hasEvents = rundownEvents.length > 0;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Clock className="text-primary h-4 w-4" />
          <CardTitle className="text-foreground text-base font-semibold">
            Agenda Hari-H (Rundown)
          </CardTitle>
        </div>
        {hasEvents && (
          <Badge variant="outline" className="text-xs">
            {rundownStats.totalEvents} Segmen
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasEvents ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-muted-foreground mx-auto max-w-sm text-xs">
              Susunan jam-demi-jam hari perkawinan belum diatur. Buat jadwal
              prosesi, saksi, penjemputan, dan resepsi.
            </p>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="gap-1.5 text-xs"
            >
              <Link href={`/workspace/${weddingId}/rundown`}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Susun Jadwal Acara</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="divide-border/60 divide-y">
              {rundownEvents.slice(0, 4).map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col justify-between gap-1 py-2.5 text-xs first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="bg-primary/10 text-primary shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                      {e.startTime} - {e.endTime}
                    </span>
                    <span className="text-foreground truncate font-medium">
                      {e.segmentTitle}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex shrink-0 items-center gap-2 pl-14 text-[11px] sm:pl-0">
                    {e.location && (
                      <span className="flex max-w-[120px] items-center gap-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{e.location}</span>
                      </span>
                    )}
                    {e.personInCharge && <span>PIC: {e.personInCharge}</span>}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground w-full justify-between pt-1 text-xs"
            >
              <Link href={`/workspace/${weddingId}/rundown`}>
                <span>
                  Lihat Susunan Lengkap ({rundownStats.totalEvents} Segmen)
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
