"use client";

import { useState, useMemo, useTransition } from "react";
import {
  CheckSquare,
  Plus,
  Sparkles,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Edit2,
  Trash2,
  CalendarHeart,
  ListTodo,
  Layers,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CATEGORY_OPTIONS,
  getCategoryLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
  getStatusBadgeClass,
  getStatusLabel,
} from "../seeds";
import { TaskModal } from "./task-modal";
import { TaskTemplatePickerModal } from "./task-template-picker-modal";
import {
  toggleTaskStatusAction,
  deleteTaskAction,
  updateTaskAction,
} from "../actions";
import type { WeddingTask, TaskStatus, CeremonyOption } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskDashboardProps {
  weddingId: string;
  initialTasks: WeddingTask[];
  ceremonyOptions: CeremonyOption[];
  userRole: WorkspaceRole;
}

type GroupByMode = "category" | "status" | "timeline" | "none";

export function TaskDashboard({
  weddingId,
  initialTasks,
  ceremonyOptions,
  userRole,
}: TaskDashboardProps) {
  const isReadOnly = userRole === "viewer";
  const [tasks, setTasks] = useState<WeddingTask[]>(initialTasks);
  const [, startTransition] = useTransition();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [ceremonyFilter, setCeremonyFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<GroupByMode>("category");

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<WeddingTask | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Today in YYYY-MM-DD format for overdue comparison
  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Compute unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.assigneeName?.trim()) {
        set.add(t.assigneeName.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Compute KPI metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "todo").length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < todayStr &&
        t.status !== "done" &&
        t.status !== "canceled"
    ).length;
    const urgent = tasks.filter(
      (t) => t.priority === "urgent" && t.status !== "done"
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      urgent,
      completionRate,
    };
  }, [tasks, todayStr]);

  // Handle fast checkbox toggle
  const handleToggle = (task: WeddingTask) => {
    if (isReadOnly) return;
    const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    const nextCompletedAt =
      nextStatus === "done" ? new Date().toISOString() : null;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextCompletedAt,
            }
          : t
      )
    );

    startTransition(async () => {
      await toggleTaskStatusAction(weddingId, task.id, task.status);
    });
  };

  // Handle status update
  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    if (isReadOnly) return;
    const nextCompletedAt =
      newStatus === "done" ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: nextCompletedAt }
          : t
      )
    );

    startTransition(async () => {
      await updateTaskAction(weddingId, taskId, { status: newStatus });
    });
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    if (isReadOnly) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    startTransition(async () => {
      await deleteTaskAction(weddingId, taskId);
    });
  };

  // Modal success handler
  const handleTaskSaved = (savedTask: WeddingTask, isEdit: boolean) => {
    if (isEdit) {
      setTasks((prev) =>
        prev.map((t) => (t.id === savedTask.id ? savedTask : t))
      );
    } else {
      setTasks((prev) => [savedTask, ...prev]);
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc =
          task.description?.toLowerCase().includes(q) || false;
        const matchesPIC =
          task.assigneeName?.toLowerCase().includes(q) || false;
        const matchesCat = getCategoryLabel(task.category)
          .toLowerCase()
          .includes(q);
        if (!matchesTitle && !matchesDesc && !matchesPIC && !matchesCat) {
          return false;
        }
      }

      // Category
      if (categoryFilter !== "all" && task.category !== categoryFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Status
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      // Assignee
      if (assigneeFilter !== "all" && task.assigneeName !== assigneeFilter) {
        return false;
      }

      // Ceremony
      if (ceremonyFilter !== "all") {
        if (ceremonyFilter === "none" && task.ceremonyId) return false;
        if (ceremonyFilter !== "none" && task.ceremonyId !== ceremonyFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    categoryFilter,
    priorityFilter,
    statusFilter,
    assigneeFilter,
    ceremonyFilter,
  ]);

  // Group filtered tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === "none") {
      return [{ groupTitle: "Semua Tugas", tasks: filteredTasks }];
    }

    if (groupBy === "category") {
      const map = new Map<string, WeddingTask[]>();
      CATEGORY_OPTIONS.forEach((cat) => map.set(cat.id, []));

      filteredTasks.forEach((t) => {
        const catKey = t.category || "umum";
        if (!map.has(catKey)) {
          map.set(catKey, []);
        }
        map.get(catKey)!.push(t);
      });

      const groups: {
        groupTitle: string;
        categoryId: string;
        tasks: WeddingTask[];
      }[] = [];
      map.forEach((items, catId) => {
        if (items.length > 0) {
          groups.push({
            groupTitle: getCategoryLabel(catId),
            categoryId: catId,
            tasks: items,
          });
        }
      });
      return groups;
    }

    if (groupBy === "status") {
      const statuses: TaskStatus[] = [
        "todo",
        "in_progress",
        "done",
        "canceled",
      ];
      return statuses
        .map((st) => ({
          groupTitle: getStatusLabel(st),
          statusId: st,
          tasks: filteredTasks.filter((t) => t.status === st),
        }))
        .filter((g) => g.tasks.length > 0);
    }

    if (groupBy === "timeline") {
      const overdue: WeddingTask[] = [];
      const thisWeek: WeddingTask[] = [];
      const upcoming: WeddingTask[] = [];
      const noDate: WeddingTask[] = [];

      const nextWeekDate = new Date();
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekStr = nextWeekDate.toISOString().split("T")[0];

      filteredTasks.forEach((t) => {
        if (!t.dueDate) {
          noDate.push(t);
        } else if (
          t.dueDate < todayStr &&
          t.status !== "done" &&
          t.status !== "canceled"
        ) {
          overdue.push(t);
        } else if (t.dueDate <= nextWeekStr) {
          thisWeek.push(t);
        } else {
          upcoming.push(t);
        }
      });

      return [
        {
          groupTitle: "Lewat Tenggat Waktu (Perhatian Segera)",
          tasks: overdue,
        },
        { groupTitle: "Mendatang Pekan Ini", tasks: thisWeek },
        { groupTitle: "Jadwal Mendatang Lainnya", tasks: upcoming },
        { groupTitle: "Belum Ditentukan Tenggat", tasks: noDate },
      ].filter((g) => g.tasks.length > 0);
    }

    return [{ groupTitle: "Daftar Tugas", tasks: filteredTasks }];
  }, [filteredTasks, groupBy, todayStr]);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setAssigneeFilter("all");
    setCeremonyFilter("all");
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    statusFilter !== "all" ||
    assigneeFilter !== "all" ||
    ceremonyFilter !== "all";

  return (
    <div className="space-y-8">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Kemajuan Checklist
            </CardTitle>
            <CheckSquare className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {stats.completed} / {stats.total}
              </div>
              <span className="text-primary text-xs font-semibold">
                {stats.completionRate}%
              </span>
            </div>
            {/* Native Progress Bar */}
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <p className="text-muted-foreground text-[11px]">
              {stats.completed} tugas telah terselesaikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Dalam Pengerjaan
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {stats.pending} tugas belum dimulai
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            stats.overdue > 0
              ? "border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10"
              : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Lewat Tenggat
            </CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${
                stats.overdue > 0 ? "text-rose-500" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.overdue > 0 ? "text-rose-600 dark:text-rose-400" : ""
              }`}
            >
              {stats.overdue}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {stats.overdue > 0
                ? "Perlu tindak lanjut segera"
                : "Semua sesuai jadwal"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Prioritas Mendesak
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgent}</div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Tugas berstatus &quot;Urgent&quot; aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Header & Filter Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground flex items-center gap-2 text-xl font-bold tracking-tight">
              <ListTodo className="text-primary h-5 w-5" />
              Daftar Tugas & Checklist Pawiwahan
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Rincian tugas adat, administrasi negara, banten, konsumsi, dan
              pembagian tugas keluarga.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Sparkles className="text-primary h-3.5 w-3.5" />
                  <span>Rekomendasi Adat Bali</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setTaskToEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Tugas</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border-border/60 space-y-3 rounded-xl border p-4 shadow-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Cari tugas, PIC, kategori..."
                className="h-9 pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="all">Semua Kategori</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="all">Semua Prioritas</option>
              <option value="urgent">Mendesak (Urgent)</option>
              <option value="high">Tinggi (High)</option>
              <option value="medium">Sedang (Medium)</option>
              <option value="low">Rendah (Low)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="all">Semua Status</option>
              <option value="todo">Belum Mulai</option>
              <option value="in_progress">Dalam Proses</option>
              <option value="done">Selesai</option>
              <option value="canceled">Dibatalkan</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Assignee Filter */}
              {uniqueAssignees.length > 0 && (
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs"
                >
                  <option value="all">Semua PIC</option>
                  {uniqueAssignees.map((pic) => (
                    <option key={pic} value={pic}>
                      {pic}
                    </option>
                  ))}
                </select>
              )}

              {/* Ceremony Filter */}
              {ceremonyOptions.length > 0 && (
                <select
                  value={ceremonyFilter}
                  onChange={(e) => setCeremonyFilter(e.target.value)}
                  className="border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs"
                >
                  <option value="all">Semua Prosesi</option>
                  <option value="none">Tanpa Prosesi Khusus</option>
                  {ceremonyOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  Reset Filter
                </Button>
              )}
            </div>

            {/* Group By selector */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Layers className="h-3.5 w-3.5" /> Kelompokkan:
              </span>
              <div className="border-border/60 bg-muted/30 inline-flex rounded-md border p-0.5">
                <button
                  type="button"
                  onClick={() => setGroupBy("category")}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    groupBy === "category"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Kategori
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy("timeline")}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    groupBy === "timeline"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tenggat
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy("status")}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    groupBy === "status"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy("none")}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    groupBy === "none"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task List / Groups */}
      {filteredTasks.length === 0 ? (
        <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center">
          <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="text-foreground text-base font-semibold">
            {hasActiveFilters
              ? "Tidak ada tugas yang sesuai filter"
              : "Belum Ada Tugas Pawiwahan"}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs">
            {hasActiveFilters
              ? "Coba ubah kata kunci pencarian atau reset filter untuk menampilkan semua tugas."
              : "Mulai kelola checklist persiapan pernikahan Bali Anda dengan menambahkan tugas pertama atau memuat rekomendasi tugas adat."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Reset Semua Filter
              </Button>
            ) : (
              !isReadOnly && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="gap-1.5"
                  >
                    <Sparkles className="text-primary h-3.5 w-3.5" />
                    <span>Muat Rekomendasi Adat Bali</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setTaskToEdit(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Tugas Sendiri</span>
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTasks.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              {groupBy !== "none" && (
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <Tag className="text-primary h-3.5 w-3.5" />
                    <span>{group.groupTitle}</span>
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-[11px]"
                    >
                      {group.tasks.length}
                    </Badge>
                  </h3>
                </div>
              )}

              <div className="space-y-2.5">
                {group.tasks.map((task) => {
                  const isDone = task.status === "done";
                  const isOverdue =
                    task.dueDate &&
                    task.dueDate < todayStr &&
                    !isDone &&
                    task.status !== "canceled";

                  return (
                    <div
                      key={task.id}
                      className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-all sm:p-4 ${
                        isDone
                          ? "border-border/40 bg-muted/20 opacity-80"
                          : isOverdue
                            ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60"
                            : "border-border/60 bg-card hover:border-primary/40 hover:shadow-xs"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggle(task)}
                          disabled={isReadOnly}
                          className="border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded disabled:cursor-not-allowed"
                          aria-label={`Tandai selesai: ${task.title}`}
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm leading-tight font-semibold transition-colors ${
                              isDone
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </span>

                          <Badge
                            variant="outline"
                            className="h-5 text-[10px] font-normal"
                          >
                            {getCategoryLabel(task.category)}
                          </Badge>

                          <Badge
                            variant="secondary"
                            className={`h-5 border text-[10px] font-medium ${getPriorityBadgeClass(
                              task.priority
                            )}`}
                          >
                            {getPriorityLabel(task.priority)}
                          </Badge>

                          {/* Quick Status Pill / Selector */}
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleUpdateStatus(
                                task.id,
                                e.target.value as TaskStatus
                              )
                            }
                            disabled={isReadOnly}
                            className={`h-5 cursor-pointer rounded border bg-transparent px-1 text-[10px] font-medium ${getStatusBadgeClass(
                              task.status
                            )}`}
                          >
                            <option value="todo">Belum Mulai</option>
                            <option value="in_progress">Dalam Proses</option>
                            <option value="done">Selesai</option>
                            <option value="canceled">Dibatalkan</option>
                          </select>
                        </div>

                        {task.description && (
                          <p
                            className={`text-xs leading-relaxed ${
                              isDone
                                ? "text-muted-foreground/70 line-through"
                                : "text-muted-foreground"
                            }`}
                          >
                            {task.description}
                          </p>
                        )}

                        {/* Metadata Tags Row */}
                        <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-1 text-xs">
                          {/* Due Date */}
                          {task.dueDate && (
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                isOverdue
                                  ? "font-semibold text-rose-600 dark:text-rose-400"
                                  : "text-foreground/80"
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                              {isOverdue && (
                                <span className="py-0.2 rounded bg-rose-500/20 px-1 text-[10px] text-rose-700 dark:text-rose-300">
                                  Lewat Tenggat
                                </span>
                              )}
                            </span>
                          )}

                          {/* Assignee / PIC */}
                          {task.assigneeName && (
                            <span className="text-foreground/80 inline-flex items-center gap-1">
                              <User className="text-primary h-3 w-3" />
                              <span>PIC: {task.assigneeName}</span>
                            </span>
                          )}

                          {/* Linked Ceremony */}
                          {task.ceremonyTitle && (
                            <span className="text-foreground/80 inline-flex items-center gap-1">
                              <CalendarHeart className="text-primary h-3 w-3" />
                              <span>{task.ceremonyTitle}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Menu Buttons */}
                      {!isReadOnly && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTaskToEdit(task);
                              setIsTaskModalOpen(true);
                            }}
                            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                            title="Ubah Rincian"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal (Create & Edit) */}
      {isTaskModalOpen && (
        <TaskModal
          weddingId={weddingId}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskToEdit(null);
          }}
          taskToEdit={taskToEdit}
          ceremonyOptions={ceremonyOptions}
          onSuccess={handleTaskSaved}
        />
      )}

      {/* Template Picker Modal */}
      {isTemplateModalOpen && (
        <TaskTemplatePickerModal
          weddingId={weddingId}
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
