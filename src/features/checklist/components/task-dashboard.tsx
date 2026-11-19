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
  UserCheck,
  HelpCircle,
  Edit2,
  Trash2,
  CalendarHeart,
  ListTodo,
  Layers,
  Tag,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { downloadCSV } from "@/lib/csv-export";
import { formatTasksToCSV } from "@/features/exports/formatters";
import type { WorkspaceMember } from "@/features/members/types";
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
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import type { WeddingTask, TaskStatus, CeremonyOption } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface TaskDashboardProps {
  weddingId: string;
  initialTasks: WeddingTask[];
  ceremonyOptions: CeremonyOption[];
  userRole: WorkspaceRole;
  currentUserId?: string | null;
  members?: WorkspaceMember[];
  initialViewMode?: "all" | "my_tasks";
  isPreview?: boolean;
  workspaceName?: string;
}

type GroupByMode = "category" | "status" | "timeline" | "none";

export function TaskDashboard({
  weddingId,
  initialTasks,
  ceremonyOptions,
  userRole,
  currentUserId = null,
  members = [],
  initialViewMode = "all",
  isPreview: propIsPreview,
  workspaceName,
}: TaskDashboardProps) {
  const workspaceCtx = useWorkspace();
  const isPreview = propIsPreview ?? workspaceCtx?.isPreview ?? (weddingId === "demo");
  const [isLocalUpgradeOpen, setIsLocalUpgradeOpen] = useState(false);

  const triggerUpgrade = () => {
    if (workspaceCtx?.openUpgradeModal) {
      workspaceCtx.openUpgradeModal();
    } else {
      setIsLocalUpgradeOpen(true);
    }
  };

  const isReadOnly = !isPreview && userRole === "viewer";
  const [tasks, setTasks] = useState<WeddingTask[]>(initialTasks);
  const [, startTransition] = useTransition();

  // Top View Mode: Semua Tugas vs Tugas Saya
  const [viewMode, setViewMode] = useState<"all" | "my_tasks">(initialViewMode);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [ceremonyFilter, setCeremonyFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByMode>("category");

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<WeddingTask | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Today in YYYY-MM-DD format for overdue comparison
  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Compute tasks strictly assigned to current logged-in user
  const myTasks = useMemo(() => {
    if (!currentUserId) return [];
    return tasks.filter((t) => t.assignedToUserId === currentUserId);
  }, [tasks, currentUserId]);

  // Compute My Tasks metrics
  const myStats = useMemo(() => {
    const total = myTasks.length;
    const completed = myTasks.filter((t) => t.status === "done").length;
    const pending = myTasks.filter(
      (t) => t.status !== "done" && t.status !== "canceled"
    ).length;
    const overdue = myTasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < todayStr &&
        t.status !== "done" &&
        t.status !== "canceled"
    ).length;
    return { total, completed, pending, overdue };
  }, [myTasks, todayStr]);

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
    if (isPreview) {
      triggerUpgrade();
      return;
    }
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
    if (isPreview) {
      triggerUpgrade();
      return;
    }
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
    if (isPreview) {
      triggerUpgrade();
      return;
    }
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

  const handleExportCSV = () => {
    const csv = formatTasksToCSV(tasks);
    downloadCSV(`tugas-${weddingId}.csv`, csv);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 0. View Mode: Tugas Saya strictly matches task.assignedToUserId === currentUserId (Issue #83)
      if (viewMode === "my_tasks") {
        if (!currentUserId || task.assignedToUserId !== currentUserId) {
          return false;
        }
      }

      // 0.5. Quick filter: only overdue
      if (onlyOverdue) {
        const isTaskOverdue =
          task.dueDate &&
          task.dueDate < todayStr &&
          task.status !== "done" &&
          task.status !== "canceled";
        if (!isTaskOverdue) {
          return false;
        }
      }

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
    viewMode,
    currentUserId,
    onlyOverdue,
    todayStr,
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
    setOnlyOverdue(false);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    statusFilter !== "all" ||
    assigneeFilter !== "all" ||
    ceremonyFilter !== "all" ||
    onlyOverdue;

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTaskTable = (groupTasks: WeddingTask[]) => (
    <div className="table-metronic-wrapper overflow-x-auto rounded-xl border border-[#e9e9ed] bg-white shadow-2xs dark:border-border/80 dark:bg-card">
      <table className="table-metronic w-full border-collapse text-left text-sm">
        <caption className="sr-only">Daftar Tugas dan Checklist</caption>
        <thead>
          <tr className="bg-[#f9f9fb] dark:bg-muted/40 text-xs font-semibold text-[#65656f] dark:text-muted-foreground">
            <th scope="col" className="w-16 px-2 py-3 text-center font-medium border-b border-r border-[#e9e9ed] dark:border-border/80">
              Selesai
            </th>
            <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
              Tugas & Kategori
            </th>
            <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
              Prioritas
            </th>
            <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
              PIC / Penugasan
            </th>
            <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
              Tenggat Waktu
            </th>
            <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
              Status
            </th>
            <th scope="col" className="w-16 px-4 py-3 text-right border-b border-[#e9e9ed] dark:border-border/80">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e9e9ed] dark:divide-border/80">
          {groupTasks.map((task) => {
            const isDone = task.status === "done";
            const isOverdue =
              task.dueDate &&
              task.dueDate < todayStr &&
              !isDone &&
              task.status !== "canceled";

            return (
              <tr
                key={task.id}
                className={`transition-colors hover:bg-[#fbfbfd] dark:hover:bg-muted/20 ${
                  isDone ? "opacity-75" : ""
                }`}
              >
                {/* Task Completion Checkbox */}
                <td className="px-2 py-3.5 text-center align-middle border-b border-r border-[#e9e9ed] dark:border-border/80">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => handleToggle(task)}
                    disabled={isReadOnly}
                    className="h-4 w-4 rounded-md border-emerald-500 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                    aria-label={`Tandai selesai: ${task.title}`}
                  />
                </td>

                {/* Task Title & Details */}
                <td className="px-4 py-3.5 align-middle border-b border-r border-[#e9e9ed] dark:border-border/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-semibold text-sm transition-colors ${
                        isDone
                          ? "line-through text-muted-foreground/70"
                          : "text-[#18181b] dark:text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 font-normal"
                    >
                      {getCategoryLabel(task.category)}
                    </Badge>
                    {task.ceremonyTitle && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        <CalendarHeart className="mr-1 h-3 w-3 text-primary" />
                        {task.ceremonyTitle}
                      </Badge>
                    )}
                  </div>
                  {task.description && (
                    <p
                      className={`mt-0.5 text-xs line-clamp-1 ${
                        isDone
                          ? "text-muted-foreground/60 line-through"
                          : "text-[#65656f] dark:text-muted-foreground"
                      }`}
                    >
                      {task.description}
                    </p>
                  )}
                </td>

                {/* Priority */}
                <td className="px-4 py-3.5 align-middle whitespace-nowrap border-b border-r border-[#e9e9ed] dark:border-border/80">
                  <Badge
                    variant="secondary"
                    className={`h-5 border text-[10px] font-medium ${getPriorityBadgeClass(
                      task.priority
                    )}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </td>

                {/* PIC / Penugasan */}
                <td className="px-4 py-3.5 align-middle text-xs whitespace-nowrap border-b border-r border-[#e9e9ed] dark:border-border/80">
                  {task.assignedToUserId &&
                  currentUserId &&
                  task.assignedToUserId === currentUserId ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
                      <UserCheck className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                      <span>{task.assigneeName || "Anda"} (Tugas Saya)</span>
                    </span>
                  ) : task.assigneeName ? (
                    <span className="inline-flex items-center gap-1 text-[#18181b] dark:text-foreground font-medium">
                      <User className="h-3 w-3 text-primary" />
                      <span>{task.assigneeName}</span>
                    </span>
                  ) : (
                    <span className="text-[#65656f] dark:text-muted-foreground italic">
                      Belum ada PIC
                    </span>
                  )}
                </td>

                {/* Due Date */}
                <td className="px-4 py-3.5 align-middle whitespace-nowrap text-xs border-b border-r border-[#e9e9ed] dark:border-border/80">
                  {task.dueDate ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span
                        className={`font-medium ${
                          isOverdue
                            ? "font-semibold text-rose-600 dark:text-rose-400"
                            : "text-[#18181b] dark:text-foreground"
                        }`}
                      >
                        {new Date(task.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {isOverdue && (
                        <span className="rounded border border-rose-300 bg-rose-100 dark:bg-rose-950/50 px-1.5 py-0.2 text-[10px] font-bold text-rose-950 dark:text-rose-200">
                          Lewat Tenggat
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#65656f] dark:text-muted-foreground italic">
                      Belum diatur
                    </span>
                  )}
                </td>

                {/* Status Dropdown */}
                <td className="px-4 py-3.5 align-middle whitespace-nowrap border-b border-r border-[#e9e9ed] dark:border-border/80">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleUpdateStatus(task.id, e.target.value as TaskStatus)
                    }
                    disabled={isReadOnly}
                    className={`h-6 cursor-pointer rounded-md border bg-transparent px-2 text-[11px] font-medium shadow-2xs ${getStatusBadgeClass(
                      task.status
                    )}`}
                  >
                    <option value="todo">Belum Mulai</option>
                    <option value="in_progress">Dalam Proses</option>
                    <option value="done">Selesai</option>
                    <option value="canceled">Dibatalkan</option>
                  </select>
                </td>

                {/* Actions */}
                <td className="w-16 px-4 py-3.5 align-middle text-right whitespace-nowrap border-b border-[#e9e9ed] dark:border-border/80">
                  <TableActionDropdown
                    items={[
                      {
                        label: "Edit Tugas",
                        icon: <Edit2 className="h-3.5 w-3.5" />,
                        disabled: isReadOnly,
                        onClick: () => {
                          if (isReadOnly) return;
                          if (isPreview) {
                            triggerUpgrade();
                            return;
                          }
                          setTaskToEdit(task);
                          setIsTaskModalOpen(true);
                        },
                      },
                      {
                        label: "Hapus Tugas",
                        icon: <Trash2 className="h-3.5 w-3.5" />,
                        variant: "destructive",
                        disabled: isReadOnly,
                        onClick: () => {
                          if (isReadOnly) return;
                          if (isPreview) {
                            triggerUpgrade();
                            return;
                          }
                          handleDeleteTask(task.id);
                        },
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const activeStats = useMemo(() => {
    if (viewMode === "my_tasks") {
      const completionRate =
        myStats.total > 0
          ? Math.round((myStats.completed / myStats.total) * 100)
          : 0;
      const inProgress = myTasks.filter(
        (t) => t.status === "in_progress"
      ).length;
      const urgent = myTasks.filter(
        (t) => t.priority === "urgent" && t.status !== "done"
      ).length;
      return {
        total: myStats.total,
        completed: myStats.completed,
        inProgress,
        pending: myTasks.filter((t) => t.status === "todo").length,
        overdue: myStats.overdue,
        urgent,
        completionRate,
        isMyTasks: true,
      };
    }
    return { ...stats, isMyTasks: false };
  }, [viewMode, myStats, myTasks, stats]);

  return (
    <div className="space-y-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Tugas & Checklist"
        badge={isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined}
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspaceName || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Tugas & Checklist"
        )}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isReadOnly}
              onClick={() => {
                if (isReadOnly) return;
                setIsTemplateModalOpen(true);
              }}
              className={`gap-1.5 text-xs ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
              title={isReadOnly ? "Mode Hanya Lihat (View Only)" : "Rekomendasi Adat Bali"}
            >
              <Sparkles className="text-primary h-3.5 w-3.5" />
              <span>Rekomendasi Adat Bali</span>
            </Button>

            <Button
              size="sm"
              disabled={isReadOnly}
              onClick={() => {
                if (isReadOnly) return;
                if (isPreview) {
                  triggerUpgrade();
                  return;
                }
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className={`gap-1.5 text-xs ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
              title={isReadOnly ? "Mode Hanya Lihat (View Only)" : "Tambah Tugas"}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Tugas</span>
            </Button>
          </>
        }
      />

      {/* Top View Mode Switcher: Semua Tugas vs Tugas Saya (Issue #83) */}
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="border-border bg-muted/40 inline-flex rounded-xl border p-1 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setViewMode("all");
              setOnlyOverdue(false);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
              viewMode === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Semua Tugas</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[11px]">
              {tasks.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode("my_tasks");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
              viewMode === "my_tasks"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="text-primary h-4 w-4" />
            <span>Tugas Saya</span>
            <Badge
              variant={myStats.overdue > 0 ? "destructive" : "secondary"}
              className="ml-1 h-5 px-1.5 text-[11px]"
            >
              {myStats.pending}
            </Badge>
            {myStats.overdue > 0 && (
              <span className="hidden rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 sm:inline-flex dark:text-rose-300">
                {myStats.overdue} terlambat
              </span>
            )}
          </button>
        </div>

        {viewMode === "my_tasks" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Filter Khusus:</span>
            <Button
              variant={onlyOverdue ? "destructive" : "outline"}
              size="sm"
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className="h-8 text-xs"
            >
              <AlertCircle className="mr-1 h-3.5 w-3.5" />
              <span>Hanya Tugas Terlambat ({myStats.overdue})</span>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              {activeStats.isMyTasks
                ? "Kemajuan Tugas Saya"
                : "Kemajuan Checklist"}
            </CardTitle>
            <CheckSquare className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {activeStats.completed} / {activeStats.total}
              </div>
              <span className="text-primary text-xs font-semibold">
                {activeStats.completionRate}%
              </span>
            </div>
            {/* Native Progress Bar */}
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${activeStats.completionRate}%` }}
              />
            </div>
            <p className="text-muted-foreground text-[11px]">
              {activeStats.completed} tugas{" "}
              {activeStats.isMyTasks ? "Anda" : ""} telah terselesaikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              {activeStats.isMyTasks
                ? "Tugas Saya Sedang Proses"
                : "Dalam Pengerjaan"}
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStats.inProgress}</div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {activeStats.pending} tugas {activeStats.isMyTasks ? "Anda" : ""}{" "}
              belum dimulai
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            activeStats.overdue > 0
              ? "border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10"
              : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              {activeStats.isMyTasks
                ? "Tugas Saya Lewat Tenggat"
                : "Lewat Tenggat"}
            </CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${
                activeStats.overdue > 0
                  ? "text-rose-500"
                  : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                activeStats.overdue > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : ""
              }`}
            >
              {activeStats.overdue}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {activeStats.overdue > 0
                ? "Perlu tindak lanjut segera"
                : "Semua sesuai jadwal"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              {activeStats.isMyTasks
                ? "Tugas Mendesak Saya"
                : "Prioritas Mendesak"}
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStats.urgent}</div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Tugas berstatus &quot;Urgent&quot; aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Main List Container (Metronic Inventory Layout) */}
      <div className="rounded-xl border border-[#e5e5e9] bg-white shadow-xs overflow-hidden dark:bg-card dark:border-border/80">
        {/* Top Toolbar inside Card (Metronic Filter Bar) */}
        <div className="p-4 border-b border-[#f0f0f4] dark:border-border/60 bg-white dark:bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Cari tugas, PIC, kategori..."
                  className="h-9 pl-8 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <TableDropdownFilter
                label="Kategori"
                options={[
                  { id: "all", label: "Semua Kategori", count: tasks.length },
                  ...CATEGORY_OPTIONS.map((c) => ({
                    id: c.id,
                    label: c.label,
                    count: tasks.filter((t) => t.category === c.id).length,
                  })),
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                defaultAllId="all"
              />

              {/* Priority Filter */}
              <TableDropdownFilter
                label="Prioritas"
                options={[
                  { id: "all", label: "Semua Prioritas", count: tasks.length },
                  { id: "urgent", label: "Mendesak (Urgent)", count: tasks.filter((t) => t.priority === "urgent").length },
                  { id: "high", label: "Tinggi (High)", count: tasks.filter((t) => t.priority === "high").length },
                  { id: "medium", label: "Sedang (Medium)", count: tasks.filter((t) => t.priority === "medium").length },
                  { id: "low", label: "Rendah (Low)", count: tasks.filter((t) => t.priority === "low").length },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                defaultAllId="all"
              />

              {/* Status Filter */}
              <TableDropdownFilter
                label="Status"
                options={[
                  { id: "all", label: "Semua Status", count: tasks.length },
                  { id: "todo", label: "Belum Mulai", count: tasks.filter((t) => t.status === "todo").length },
                  { id: "in_progress", label: "Dalam Proses", count: tasks.filter((t) => t.status === "in_progress").length },
                  { id: "done", label: "Selesai", count: tasks.filter((t) => t.status === "done").length },
                  { id: "canceled", label: "Dibatalkan", count: tasks.filter((t) => t.status === "canceled").length },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                defaultAllId="all"
              />

              {/* Assignee Filter */}
              {uniqueAssignees.length > 0 && (
                <TableDropdownFilter
                  label="PIC"
                  options={[
                    { id: "all", label: "Semua PIC", count: tasks.length },
                    ...uniqueAssignees.map((pic) => ({
                      id: pic,
                      label: pic,
                      count: tasks.filter((t) => t.assigneeName === pic).length,
                    })),
                  ]}
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  defaultAllId="all"
                />
              )}

              {/* Ceremony Filter */}
              {ceremonyOptions.length > 0 && (
                <TableDropdownFilter
                  label="Prosesi"
                  options={[
                    { id: "all", label: "Semua Prosesi", count: tasks.length },
                    { id: "none", label: "Tanpa Prosesi", count: tasks.filter((t) => !t.ceremonyId).length },
                    ...ceremonyOptions.map((c) => ({
                      id: c.id,
                      label: c.title,
                      count: tasks.filter((t) => t.ceremonyId === c.id).length,
                    })),
                  ]}
                  value={ceremonyFilter}
                  onChange={setCeremonyFilter}
                  defaultAllId="all"
                />
              )}

              {/* Group By selector as Dropdown */}
              <TableDropdownFilter
                label="Kelompokkan"
                options={[
                  { id: "category", label: "Berdasarkan Kategori" },
                  { id: "timeline", label: "Berdasarkan Tenggat" },
                  { id: "status", label: "Berdasarkan Status" },
                  { id: "none", label: "Tanpa Pengelompokan" },
                ]}
                value={groupBy}
                onChange={(val) => setGroupBy(val as any)}
                defaultAllId="category"
              />

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground hover:text-foreground h-9 text-xs"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Row Selection Banner */}
        {selectedIds.size > 0 && (
          <div
            role="status"
            className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 border-b border-amber-200/60 dark:border-amber-800/40"
          >
            <span className="font-medium">
              {selectedIds.size} tugas dipilih
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs text-amber-900 hover:bg-amber-100/60 dark:text-amber-200 dark:hover:bg-amber-900/40"
            >
              Batal Pilihan
            </Button>
          </div>
        )}

        {/* Task List / Groups */}
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center p-6">
            <div className="bg-primary/10 text-primary mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
              {viewMode === "my_tasks" ? (
                <UserCheck className="h-6 w-6" />
              ) : (
                <CheckSquare className="h-6 w-6" />
              )}
            </div>
            <h3 className="text-foreground text-base font-semibold sm:text-lg">
              {viewMode === "my_tasks"
                ? myTasks.length === 0
                  ? "Belum Ada Tugas Ditugaskan ke Akun Anda"
                  : "Tidak ada tugas Anda yang sesuai filter"
                : hasActiveFilters
                  ? "Tidak ada tugas yang sesuai filter"
                  : "Belum Ada Tugas Pawiwahan"}
            </h3>
            <p className="text-muted-foreground mt-1 mx-auto max-w-md text-xs sm:text-sm">
              {viewMode === "my_tasks"
                ? myTasks.length === 0
                  ? "Tugas yang ditugaskan secara spesifik ke akun Anda akan muncul di sini. Anda dapat memilih tugas dari daftar semua tugas atau meminta koordinator ruang kerja menugaskannya."
                  : "Coba ubah kata kunci atau matikan filter keterlambatan untuk melihat seluruh tugas Anda."
                : hasActiveFilters
                  ? "Coba ubah kata kunci pencarian atau reset filter untuk menampilkan semua tugas."
                  : "Mulai kelola checklist persiapan pernikahan Bali Anda dengan menambahkan tugas pertama atau memuat rekomendasi tugas adat."}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {viewMode === "my_tasks" ? (
                <>
                  {myTasks.length === 0 ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setViewMode("all");
                        resetFilters();
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <ListTodo className="h-3.5 w-3.5" />
                      <span>Lihat Semua Tugas Ruang Kerja</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOnlyOverdue(false);
                        resetFilters();
                      }}
                      className="text-xs"
                    >
                      Reset Filter Tugas Saya
                    </Button>
                  )}
                </>
              ) : hasActiveFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetFilters}
                  className="text-xs"
                >
                  Reset Semua Filter
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnly}
                    onClick={() => {
                      if (isReadOnly) return;
                      setIsTemplateModalOpen(true);
                    }}
                    className={`gap-1.5 text-xs ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                    title={isReadOnly ? "Mode Hanya Lihat" : "Muat Rekomendasi"}
                  >
                    <Sparkles className="text-primary h-3.5 w-3.5" />
                    <span>Muat Rekomendasi Adat Bali</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={isReadOnly}
                    onClick={() => {
                      if (isReadOnly) return;
                      setTaskToEdit(null);
                      setIsTaskModalOpen(true);
                    }}
                    className={`gap-1.5 text-xs ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                    title={isReadOnly ? "Mode Hanya Lihat" : "Tambah Tugas"}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Tugas Sendiri</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : groupBy !== "none" ? (
          <div className="divide-y divide-[#f0f0f4] dark:divide-border/60">
            {groupedTasks.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-0">
                <div className="bg-[#fcfcfd] dark:bg-muted/20 px-4 py-2.5 flex items-center justify-between border-b border-[#f0f0f4] dark:border-border/60">
                  <h3 className="text-foreground flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                    <Tag className="text-primary h-3.5 w-3.5" />
                    <span>{group.groupTitle}</span>
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      {group.tasks.length}
                    </Badge>
                  </h3>
                </div>

                {renderTaskTable(group.tasks)}
              </div>
            ))}
          </div>
        ) : (
          renderTaskTable(filteredTasks)
        )}

        {/* Table Footer */}
        <div className="border-t border-[#f0f0f4] dark:border-border/60 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-[#71717a] dark:text-muted-foreground">
          <span>
            Menampilkan {filteredTasks.length} dari {tasks.length} tugas
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-medium text-[hsl(32_90%_36%)] hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

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
          members={members}
          onSuccess={handleTaskSaved}
        />
      )}

      {/* Template Picker Modal */}
      {isTemplateModalOpen && (
        <TaskTemplatePickerModal
          weddingId={weddingId}
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          isPreview={isPreview}
          onPreviewUpgrade={triggerUpgrade}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Fallback Upgrade Modal */}
      <UpgradePromptModal
        isOpen={isLocalUpgradeOpen}
        onClose={() => setIsLocalUpgradeOpen(false)}
        weddingId={weddingId}
      />
    </div>
  );
}
