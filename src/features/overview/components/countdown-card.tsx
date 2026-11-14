"use client";

import Link from "next/link";
import { Calendar, Clock, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CountdownInfo } from "../types";

interface CountdownCardProps {
  weddingId: string;
  countdown: CountdownInfo;
}

export function CountdownCard({ weddingId, countdown }: CountdownCardProps) {
  const isNotSet = countdown.status === "not_set";
  const isToday = countdown.status === "today";
  const isPast = countdown.status === "past";

  return (
    <Card className="border-primary/20 from-primary/5 via-card to-card relative overflow-hidden bg-gradient-to-br shadow-sm">
      {/* Decorative Balinese motif bar */}
      <div className="via-primary absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

      <CardHeader className="flex flex-row items-center justify-between pt-5 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="text-primary h-4 w-4" />
          <CardTitle className="text-foreground text-sm font-semibold tracking-wide">
            Hitung Mundur Pawiwahan
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className={
            isToday
              ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : isNotSet
                ? "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                : "border-primary/30 bg-primary/10 text-primary"
          }
        >
          {isToday ? (
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Rahina Hari H
            </span>
          ) : isNotSet ? (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Tanggal Belum Ada
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Dewasa Ayu
            </span>
          )}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {isNotSet ? (
          <div className="space-y-3 py-1">
            <div className="text-foreground text-xl font-bold">
              Jadwal Belum Ditentukan
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {countdown.description}
            </p>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="border-primary/40 text-primary hover:bg-primary/5 gap-1.5 text-xs"
            >
              <Link href={`/workspace/${weddingId}/settings`}>
                <Calendar className="h-3.5 w-3.5" />
                <span>Tentukan Tanggal Hari Baik</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {isToday ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Hari Ini!
                    </span>
                  ) : isPast ? (
                    <span className="text-muted-foreground">
                      H+{countdown.daysRemaining}
                    </span>
                  ) : (
                    <span className="text-primary font-mono">
                      H-{countdown.daysRemaining}
                    </span>
                  )}
                </div>
                <div className="text-foreground/80 mt-1 text-xs font-medium">
                  {countdown.milestoneLabel}
                </div>
              </div>

              {countdown.daysRemaining !== null && !isToday && !isPast && (
                <div className="text-right">
                  <div className="text-muted-foreground font-mono text-2xl font-bold">
                    {countdown.daysRemaining * 24}
                  </div>
                  <div className="text-muted-foreground text-[10px] tracking-wider uppercase">
                    Jam Tersisa
                  </div>
                </div>
              )}
            </div>

            {countdown.formattedDate && (
              <div className="bg-background/80 border-border/60 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
                <Calendar className="text-primary h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground font-medium">
                  {countdown.formattedDate}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  (WITA)
                </span>
              </div>
            )}

            <p className="text-muted-foreground text-xs leading-relaxed">
              {countdown.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
