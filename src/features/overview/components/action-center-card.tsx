"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flower2,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UrgentAction } from "../types";

interface ActionCenterCardProps {
  actions: UrgentAction[];
}

export function ActionCenterCard({ actions }: ActionCenterCardProps) {
  const getActionIcon = (type: UrgentAction["type"]) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-3.5 w-3.5" />;
      case "banten":
        return <Flower2 className="h-3.5 w-3.5" />;
      case "ceremony":
        return <Calendar className="h-3.5 w-3.5" />;
      default:
        return <Clock className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-foreground text-base font-semibold">
            Aksi Mendesak & Perlu Perhatian
          </CardTitle>
          {actions.length > 0 && (
            <Badge variant="secondary" className="text-xs font-semibold">
              {actions.length} Perlu Tindakan
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="text-foreground text-sm font-semibold">
              Semua Terkendali dengan Baik
            </div>
            <p className="text-muted-foreground max-w-sm text-xs">
              Tidak ada tugas tertunda atau kendala mendesak saat ini. Terus
              jaga koordinasi bersama keluarga dan sekaa banjar.
            </p>
          </div>
        ) : (
          <div className="divide-border/60 divide-y">
            {actions.map((act) => (
              <div
                key={act.id}
                className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 border text-[10px] font-semibold ${
                        act.isOverdue
                          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : act.priority === "urgent"
                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {getActionIcon(act.type)}
                      <span>
                        {act.isOverdue
                          ? "Terlambat"
                          : act.priority.toUpperCase()}
                      </span>
                    </Badge>
                    <span className="text-foreground text-sm font-medium">
                      {act.title}
                    </span>
                  </div>
                  <p className="text-muted-foreground pl-1 text-xs leading-relaxed sm:pl-0">
                    {act.description}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="border-border/80 hover:bg-muted shrink-0 gap-1.5 self-start text-xs sm:self-center"
                >
                  <Link href={act.actionUrl}>
                    <span>{act.actionLabel}</span>
                    <ArrowRight className="text-muted-foreground h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
