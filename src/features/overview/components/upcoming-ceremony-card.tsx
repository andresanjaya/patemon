"use client";

import Link from "next/link";
import {
  CalendarHeart,
  Calendar,
  MapPin,
  Flower2,
  CheckSquare,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NextUpcomingCeremony } from "../types";

interface UpcomingCeremonyCardProps {
  ceremony: NextUpcomingCeremony | null;
  workspaceId: string;
}

export function UpcomingCeremonyCard({
  ceremony,
  workspaceId,
}: UpcomingCeremonyCardProps) {
  if (!ceremony) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <CalendarHeart className="text-primary h-4 w-4" />
            <CardTitle className="text-foreground text-base font-semibold">
              Prosesi Adat Berikutnya
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 py-6 text-center">
          <p className="text-muted-foreground text-xs">
            Belum ada prosesi adat yang disusun dalam rencana pawiwahan Anda.
          </p>
          <Button size="sm" asChild className="gap-1.5 text-xs">
            <Link href={`/workspace/${workspaceId}/onboarding`}>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Susun Rencana Adat</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isToday = ceremony.daysUntil === 0;
  const isScheduled = ceremony.scheduledDate !== null;

  return (
    <Card className="border-border/80 relative overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CalendarHeart className="text-primary h-4 w-4" />
          <CardTitle className="text-foreground text-base font-semibold">
            Prosesi Adat Berikutnya
          </CardTitle>
        </div>
        {isScheduled && (
          <Badge
            variant="outline"
            className={
              isToday
                ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : ceremony.daysUntil &&
                    ceremony.daysUntil > 0 &&
                    ceremony.daysUntil <= 3
                  ? "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "border-primary/30 bg-primary/10 text-primary"
            }
          >
            {isToday
              ? "Hari Ini"
              : ceremony.daysUntil && ceremony.daysUntil > 0
                ? `${ceremony.daysUntil} Hari Lagi`
                : "Jadwal Terlewati"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div>
          <h3 className="text-foreground text-lg font-bold">
            {ceremony.title}
          </h3>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {ceremony.formattedDate ? (
              <span className="text-foreground/80 flex items-center gap-1 font-medium">
                <Calendar className="text-primary h-3.5 w-3.5" />
                {ceremony.formattedDate}
              </span>
            ) : (
              <span className="text-amber-600 italic dark:text-amber-400">
                Tanggal belum dijadwalkan
              </span>
            )}

            {ceremony.location && (
              <span className="flex items-center gap-1">
                <MapPin className="text-muted-foreground h-3.5 w-3.5" />
                {ceremony.location}
              </span>
            )}
          </div>
        </div>

        {/* Linked Resources */}
        <div className="bg-muted/40 border-border/40 grid grid-cols-2 gap-2 rounded-lg border p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Flower2 className="text-primary h-3.5 w-3.5 shrink-0" />
            <span className="text-muted-foreground">
              Sarana Banten:{" "}
              <strong className="text-foreground">
                {ceremony.bantenCount > 0
                  ? `${ceremony.bantenCount} item`
                  : "Belum ditautkan"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckSquare className="text-primary h-3.5 w-3.5 shrink-0" />
            <span className="text-muted-foreground">
              Checklist:{" "}
              <strong className="text-foreground">
                {ceremony.taskCount > 0
                  ? `${ceremony.taskCount} tugas`
                  : "Belum ada"}
              </strong>
            </span>
          </div>

          {ceremony.personInCharge && (
            <div className="border-border/40 text-muted-foreground col-span-2 flex items-center gap-2 border-t pt-1">
              <User className="text-primary h-3.5 w-3.5 shrink-0" />
              <span>
                Penanggung Jawab (PIC):{" "}
                <strong className="text-foreground">
                  {ceremony.personInCharge}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            size="sm"
            variant="outline"
            asChild
            className="border-border/80 hover:bg-muted w-full gap-1.5 text-xs"
          >
            <Link href={`/workspace/${workspaceId}/ceremonies/${ceremony.id}`}>
              <span>Buka Rincian & Sarana Prosesi</span>
              <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
