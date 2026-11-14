"use client";

import { CheckCircle2, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReadinessScore } from "../types";

interface ReadinessCardProps {
  score: ReadinessScore;
}

export function ReadinessCard({ score }: ReadinessCardProps) {
  const { overallScore, levelLabel, levelColor, summaryText, categories } =
    score;

  const categoryList = [
    { key: "banten", ...categories.banten },
    { key: "ceremonies", ...categories.ceremonies },
    { key: "tasks", ...categories.tasks },
    { key: "vendors", ...categories.vendors },
    { key: "budget", ...categories.budget },
    { key: "rundown", ...categories.rundown },
  ];

  return (
    <Card className="border-border/80 relative overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Award className="text-primary h-4 w-4" />
          <CardTitle className="text-foreground text-base font-semibold">
            Kesiapan Pawiwahan (Readiness)
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className={`border text-xs font-semibold ${levelColor}`}
        >
          {levelLabel}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score Highlight */}
        <div className="border-border/60 bg-muted/30 flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary border-primary/20 relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border">
              <span className="font-mono text-2xl font-extrabold">
                {overallScore}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-foreground text-sm font-semibold">
                Tingkat Kesiapan Keseluruhan
              </div>
              <p className="text-muted-foreground max-w-md text-xs leading-normal">
                {summaryText}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right sm:self-center">
            <div className="text-muted-foreground text-xs">Kriteria Bobot:</div>
            <div className="text-foreground/80 text-[11px] font-medium">
              Adat & Banten 45% · Teknis 55%
            </div>
          </div>
        </div>

        {/* Category Progress Breakdown */}
        <div className="space-y-3.5">
          <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Rincian 6 Dimensi Perencanaan
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 md:grid-cols-2">
            {categoryList.map((cat) => (
              <div key={cat.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">
                    {cat.label}
                    <span className="text-muted-foreground ml-1 text-[10px] font-normal">
                      ({Math.round(cat.weight * 100)}%)
                    </span>
                  </span>
                  <span className="text-foreground font-mono font-semibold">
                    {cat.score}%
                  </span>
                </div>

                {/* Progress track */}
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.score >= 80
                        ? "bg-emerald-500"
                        : cat.score >= 50
                          ? "bg-primary"
                          : cat.score >= 20
                            ? "bg-amber-500"
                            : "bg-zinc-400"
                    }`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>

                <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                  <span>{cat.description}</span>
                  {cat.score === 100 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Lengkap
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
