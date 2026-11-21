"use client";

import { FieldGroup } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History,
  User,
  Shield,
  Bot,
  CheckSquare,
  Clock,
  Wallet,
  Sparkles,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { getWorkspaceActivityLogsAction } from "../actions";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import type { ActivityLog, ActorType, PaginatedActivityLogs } from "../types";

interface ActivityLogCardProps {
  weddingId: string;
  initialData?: PaginatedActivityLogs;
  isPreview?: boolean;
}

export function ActivityLogCard({
  weddingId,
  initialData,
  isPreview: propIsPreview,
}: ActivityLogCardProps) {
  const workspaceCtx = useWorkspace();
  const isPreview =
    propIsPreview ?? workspaceCtx?.isPreview ?? weddingId === "demo";
  const triggerUpgrade = () => workspaceCtx?.openUpgradeModal?.();
  const [logsData, setLogsData] = useState<PaginatedActivityLogs>(
    initialData || {
      logs: [],
      total: 0,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    }
  );
  const [entityType, setEntityType] = useState<string>("all");
  const [actorType, setActorType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = (
    page: number,
    currentEntity: string,
    currentActor: string,
    currentSearch: string
  ) => {
    startTransition(async () => {
      setError(null);
      const res = await getWorkspaceActivityLogsAction(weddingId, {
        page,
        entityType: currentEntity === "all" ? undefined : currentEntity,
        actorType:
          currentActor === "all" ? undefined : (currentActor as ActorType),
        search: currentSearch.trim() || undefined,
      });

      if (!res.success || !res.data) {
        setError(res.error || "Gagal memuat riwayat aktivitas.");
        return;
      }

      setLogsData(res.data);
    });
  };

  const handleEntityChange = (newEntity: string) => {
    setEntityType(newEntity);
    fetchLogs(1, newEntity, actorType, search);
  };

  const handleActorChange = (newActor: string) => {
    setActorType(newActor);
    fetchLogs(1, entityType, newActor, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, entityType, actorType, search);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > logsData.totalPages) return;
    fetchLogs(newPage, entityType, actorType, search);
  };

  const getActorBadge = (type: ActorType) => {
    switch (type) {
      case "admin":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "system":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
          >
            <Bot className="h-3 w-3" />
            Sistem
          </Badge>
        );
      case "user":
      default:
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <User className="h-3 w-3" />
            Panitia
          </Badge>
        );
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "task":
        return (
          <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        );
      case "rundown":
        return (
          <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        );
      case "budget":
        return (
          <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        );
      default:
        return (
          <Sparkles className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        );
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Dibuat
          </span>
        );
      case "update":
        return (
          <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            Diperbarui
          </span>
        );
      case "status_change":
        return (
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
            Status
          </span>
        );
      case "delete":
        return (
          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            Dihapus
          </span>
        );
      case "grant_license":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            Lisensi
          </span>
        );
      case "reminder":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            Pengingat
          </span>
        );
      default:
        return (
          <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return (
        new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Makassar", // WITA
        }).format(date) + " WITA"
      );
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="border-border/80 shadow-sm" id="activity-log">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <History className="text-primary h-5 w-5" />
              <CardTitle className="text-xl">
                Riwayat Perubahan & Audit Trail
              </CardTitle>
            </div>
            {isPreview && <PreviewBadge onClick={triggerUpgrade} />}
          </div>
          <CardDescription className="text-xs">
            Catatan kekal aktivitas panitia, pembaruan jadwal, tugas, rincian
            biaya, dan aksi sistem
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            fetchLogs(logsData.page, entityType, actorType, search)
          }
          disabled={isPending}
          className="h-8 gap-1.5 self-start text-xs sm:self-auto"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
          />
          Segarkan
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters and Search Bar */}
        <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <FieldGroup className="gap-4">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="search"
                placeholder="Cari aktivitas, entitas, atau panitia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </FieldGroup>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5" />
              <span>Modul:</span>
            </div>
            <NativeSelect
              value={entityType}
              onChange={(e) => handleEntityChange(e.target.value)}
              className="border-input bg-background focus:ring-ring rounded-md border px-2 py-1 shadow-xs focus:ring-1 focus:outline-hidden"
            >
              <option value="all">Semua Modul</option>
              <option value="task">Tugas (Checklist)</option>
              <option value="rundown">Susunan Acara (Rundown)</option>
              <option value="budget">Anggaran (Budget)</option>
              <option value="wedding">Pawiwahan</option>
            </NativeSelect>

            <NativeSelect
              value={actorType}
              onChange={(e) => handleActorChange(e.target.value)}
              className="border-input bg-background focus:ring-ring rounded-md border px-2 py-1 shadow-xs focus:ring-1 focus:outline-hidden"
            >
              <option value="all">Semua Aktor</option>
              <option value="user">Panitia Pawiwahan</option>
              <option value="admin">Admin Platform</option>
              <option value="system">Sistem Otomatis</option>
            </NativeSelect>
          </div>
        </div>

        {error && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border p-3 text-xs">
            {error}
          </div>
        )}

        {/* Audit Log Entries Table (Metronic Inventory Style - Issue #116) */}
        <div className="dark:bg-card dark:border-border/80 overflow-hidden rounded-xl border border-[#e5e5e9] bg-white shadow-xs">
          <div className="table-responsive-wrapper">
            <table
              role="table"
              className="table-responsive w-full text-left text-xs"
              aria-label="Tabel Riwayat Aktivitas & Audit Trail"
            >
              <thead className="dark:bg-muted/30 dark:border-border/60 dark:text-muted-foreground border-b border-[#f0f0f4] bg-[#f9f9fb] text-xs font-semibold text-[#71717a]">
                <tr>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Waktu (WITA)
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Aktor & Peran
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Modul & Entitas
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Aksi
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Deskripsi & Perubahan
                  </th>
                </tr>
              </thead>
              <tbody className="dark:divide-border/60 divide-y divide-[#f0f0f4]">
                {logsData.logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground py-12 text-center text-xs"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Info className="text-muted-foreground/60 mb-2 h-8 w-8" />
                        <p className="text-foreground text-sm font-semibold">
                          Belum ada catatan aktivitas yang cocok
                        </p>
                        <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                          Setiap perubahan pada susunan acara adat, tugas
                          panitia, atau pencatatan biaya akan tercatat otomatis
                          di sini.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logsData.logs.map((log: ActivityLog) => (
                    <tr
                      key={log.id}
                      className="dark:hover:bg-muted/20 transition-colors hover:bg-[#f9f9fb]/60"
                    >
                      <td
                        data-label="Waktu (WITA)"
                        className="dark:text-muted-foreground px-4 py-3.5 align-top text-xs text-[#71717a] tabular-nums"
                      >
                        <time>{formatTimestamp(log.createdAt)}</time>
                      </td>
                      <td
                        data-label="Aktor &amp; Peran"
                        className="px-4 py-3.5 align-top"
                      >
                        <div className="flex items-center gap-2">
                          <span className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                            {log.actorName || "Anonim"}
                          </span>
                          {getActorBadge(log.actorType)}
                        </div>
                      </td>
                      <td
                        data-label="Modul &amp; Entitas"
                        className="px-4 py-3.5 align-top"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                            {getEntityIcon(log.entityType)}
                          </div>
                          <span className="dark:text-foreground text-xs font-medium text-[#18181b]">
                            {log.entityTitle || log.entityType}
                          </span>
                        </div>
                      </td>
                      <td data-label="Aksi" className="px-4 py-3.5 align-top">
                        {getActionBadge(log.action)}
                      </td>
                      <td
                        data-label="Deskripsi &amp; Perubahan"
                        className="px-4 py-3.5 align-top"
                      >
                        <p className="dark:text-foreground/90 text-xs leading-relaxed font-medium text-[#18181b]">
                          {log.summary ||
                            `Aksi ${log.action} pada ${log.entityType}`}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-muted-foreground mt-1 flex flex-wrap gap-1.5 text-[11px]">
                            {Object.entries(log.details).map(([key, val]) => (
                              <span
                                key={key}
                                className="bg-muted/60 inline-flex items-center rounded px-1.5 py-0.5 text-[10px]"
                              >
                                <strong className="mr-1">{key}:</strong>
                                {typeof val === "object"
                                  ? JSON.stringify(val)
                                  : String(val)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="dark:border-border/60 dark:text-muted-foreground flex flex-col items-center justify-between gap-3 border-t border-[#f0f0f4] px-4 py-3.5 text-xs text-[#71717a] sm:flex-row sm:px-6">
            <div>
              Menampilkan halaman{" "}
              <strong className="dark:text-foreground font-semibold text-[#18181b]">
                {logsData.page}
              </strong>{" "}
              dari{" "}
              <strong className="dark:text-foreground font-semibold text-[#18181b]">
                {logsData.totalPages}
              </strong>{" "}
              (Total{" "}
              <strong className="dark:text-foreground font-semibold text-[#18181b]">
                {logsData.total}
              </strong>{" "}
              aktivitas audit)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(logsData.page - 1)}
                disabled={logsData.page <= 1 || isPending}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(logsData.page + 1)}
                disabled={logsData.page >= logsData.totalPages || isPending}
                className="h-8 gap-1 text-xs"
              >
                Berikutnya
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
