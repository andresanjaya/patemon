"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCategoryLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
  getStatusBadgeClass,
  getStatusLabel,
} from "@/features/checklist/seeds";
import type { WeddingTask } from "@/features/checklist/types";

interface MyTasksCardProps {
  weddingId: string;
  tasks: WeddingTask[];
  currentUserId?: string | null;
}

export function MyTasksCard({
  weddingId,
  tasks,
  currentUserId,
}: MyTasksCardProps) {
  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Filter tasks strictly assigned to current logged-in user by user ID (Issue #83)
  const myTasks = useMemo(() => {
    if (!currentUserId) return [];
    return tasks.filter((t) => t.assignedToUserId === currentUserId);
  }, [tasks, currentUserId]);

  const { pendingTasks, completedTasks, overdueCount } = useMemo(() => {
    const pending = myTasks.filter(
      (t) => t.status !== "done" && t.status !== "canceled"
    );
    const completed = myTasks.filter((t) => t.status === "done");
    const overdue = pending.filter(
      (t) => t.dueDate && t.dueDate < todayStr
    ).length;

    // Sort pending: overdue first, then priority, then due date
    const priorityWeights: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const sortedPending = [...pending].sort((a, b) => {
      const aOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0;
      const bOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;

      const aWeight = priorityWeights[a.priority] || 0;
      const bWeight = priorityWeights[b.priority] || 0;
      if (aWeight !== bWeight) return bWeight - aWeight;

      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    return {
      pendingTasks: sortedPending,
      completedTasks: completed,
      overdueCount: overdue,
    };
  }, [myTasks, todayStr]);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-lg">
            <UserCheck className="h-4 w-4" />
          </div>
          <CardTitle className="text-foreground text-base font-semibold">
            Tugas Saya
          </CardTitle>
          {pendingTasks.length > 0 && (
            <Badge
              variant={overdueCount > 0 ? "destructive" : "secondary"}
              className="text-[11px] font-semibold"
            >
              {pendingTasks.length} Belum Selesai
            </Badge>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          asChild
          className="text-muted-foreground hover:text-foreground h-8 gap-1 text-xs"
        >
          <Link href={`/workspace/${weddingId}/tasks?view=my_tasks`}>
            <span>Lihat Semua</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {myTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-6 text-center">
            <div className="bg-muted text-muted-foreground flex h-11 w-11 items-center justify-center rounded-full">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-foreground text-sm font-semibold">
              Belum Ada Tugas Ditugaskan ke Akun Anda
            </div>
            <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
              Tanggung jawab yang diberikan secara khusus kepada Anda akan
              ditampilkan di sini agar koordinasi hari-H lebih mudah dan
              transparan.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                asChild
                className="gap-1.5 text-xs"
              >
                <Link href={`/workspace/${weddingId}/tasks`}>
                  <span>Jelajahi Semua Tugas Ruang Kerja</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-foreground text-sm font-semibold">
              Semua Tugas Anda Telah Selesai!
            </div>
            <p className="text-muted-foreground max-w-sm text-xs">
              {completedTasks.length} tugas yang ditugaskan ke akun Anda telah
              berhasil diselesaikan. Terima kasih atas kerja samanya!
            </p>
            <Button size="sm" variant="ghost" asChild className="text-xs">
              <Link href={`/workspace/${weddingId}/tasks?view=my_tasks`}>
                Lihat Riwayat Tugas Selesai
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-border/60 divide-y">
            {pendingTasks.slice(0, 4).map((task) => {
              const isOverdue =
                task.dueDate &&
                task.dueDate < todayStr &&
                task.status !== "done";

              return (
                <div
                  key={task.id}
                  className="flex flex-col justify-between gap-2.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`h-4.5 border px-1.5 text-[9px] font-medium ${getPriorityBadgeClass(
                          task.priority
                        )}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </Badge>

                      <Badge
                        variant="outline"
                        className="h-4.5 px-1.5 text-[9px] font-normal"
                      >
                        {getCategoryLabel(task.category)}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={`h-4.5 px-1.5 text-[9px] font-medium ${getStatusBadgeClass(
                          task.status
                        )}`}
                      >
                        {getStatusLabel(task.status)}
                      </Badge>

                      <Link
                        href={`/workspace/${weddingId}/tasks?view=my_tasks`}
                        className="text-foreground hover:text-primary truncate text-xs font-semibold transition-colors sm:text-sm"
                      >
                        {task.title}
                      </Link>
                    </div>

                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-[11px]">
                      {task.dueDate ? (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isOverdue
                              ? "font-semibold text-rose-600 dark:text-rose-400"
                              : ""
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>
                            Tenggat:{" "}
                            {new Date(task.dueDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                          {isOverdue && (
                            <span className="rounded bg-rose-500/20 px-1 text-[9px] font-bold text-rose-700 dark:text-rose-300">
                              Lewat Tenggat
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Tenggat belum ditentukan</span>
                        </span>
                      )}

                      {task.ceremonyTitle && (
                        <span className="truncate">
                          Prosesi: {task.ceremonyTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="border-border/80 hover:bg-muted shrink-0 gap-1 self-start text-xs sm:self-center"
                  >
                    <Link href={`/workspace/${weddingId}/tasks?view=my_tasks`}>
                      <span>Buka Tugas</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
