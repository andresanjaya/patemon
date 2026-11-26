"use client";

import { ActionAlert } from "@/components/ui/action-feedback";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
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
      pageSize: 10,
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
    entity: string,
    actor: string,
    searchQuery: string
  ) => {
    startTransition(async () => {
      setError(null);
      const res = await getWorkspaceActivityLogsAction(weddingId, {
        page,
        pageSize: 10,
        entityType: entity === "all" ? undefined : entity,
        actorType: actor === "all" ? undefined : (actor as ActorType),
        search: searchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        setLogsData(res.data);
      } else {
        setError(res.error || "Gagal memuat log aktivitas");
      }
    });
  };

  const handleEntityChange = (val: string) => {
    setEntityType(val);
    fetchLogs(1, val, actorType, search);
  };

  const handleActorChange = (val: string) => {
    setActorType(val);
    fetchLogs(1, entityType, val, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, entityType, actorType, search);
  };

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage, entityType, actorType, search);
  };

  const getActorBadge = (type: ActorType) => {
    switch (type) {
      case "admin":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 whitespace-nowrap shrink-0 text-[10px]"
          >
            <Shield className="h-3 w-3 shrink-0" />
            <span>Admin</span>
          </Badge>
        );
      case "system":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 whitespace-nowrap shrink-0 text-[10px]"
          >
            <Bot className="h-3 w-3 shrink-0" />
            <span>Sistem</span>
          </Badge>
        );
      case "user":
      default:
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 whitespace-nowrap shrink-0 text-[10px]"
          >
            <User className="h-3 w-3 shrink-0" />
            <span>Panitia</span>
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
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap shrink-0">
            Dibuat
          </span>
        );
      case "update":
        return (
          <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 whitespace-nowrap shrink-0">
            Diperbarui
          </span>
        );
      case "status_change":
        return (
          <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 whitespace-nowrap shrink-0">
            Status
          </span>
        );
      case "delete":
        return (
          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 whitespace-nowrap shrink-0">
            Dihapus
          </span>
        );
      case "grant_license":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 whitespace-nowrap shrink-0">
            Lisensi
          </span>
        );
      case "reminder":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 whitespace-nowrap shrink-0">
            Pengingat
          </span>
        );
      default:
        return (
          <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0">
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
    <div
      className="dark:bg-card dark:border-border/80 overflow-hidden rounded-xl border border-[#e5e5e9] bg-white shadow-xs"
      id="activity-log"
    >
      {/* Card Header & Toolbar */}
      <div className="dark:border-border/60 flex flex-col gap-3 border-b border-[#f0f0f4] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <History className="text-primary h-5 w-5" />
              <h3 className="dark:text-foreground text-base font-bold text-[#18181b]">
                Riwayat Perubahan & Audit Trail
              </h3>
            </div>
            {isPreview && <PreviewBadge onClick={triggerUpgrade} />}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Catatan kekal aktivitas panitia, pembaruan jadwal, tugas, rincian
            biaya, dan aksi sistem
          </p>
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
      </div>

      {/* Filter Row */}
      <div className="dark:border-border/60 dark:bg-muted/20 flex flex-col gap-3 border-b border-[#f0f0f4] bg-[#f9f9fb] p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="relative max-w-md flex-1"
        >
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Cari aktivitas, entitas, atau panitia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dark:bg-background h-9 bg-white pl-9 text-xs"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <TableDropdownFilter
            label="Modul"
            options={[
              { id: "all", label: "Semua Modul" },
              { id: "task", label: "Tugas (Checklist)" },
              { id: "rundown", label: "Susunan Acara (Rundown)" },
              { id: "budget", label: "Anggaran (Budget)" },
              { id: "wedding", label: "Pawiwahan" },
            ]}
            value={entityType}
            onChange={(val) => handleEntityChange(val)}
            defaultAllId="all"
          />

          <TableDropdownFilter
            label="Aktor"
            options={[
              { id: "all", label: "Semua Aktor" },
              { id: "user", label: "Panitia Pawiwahan" },
              { id: "admin", label: "Admin Platform" },
              { id: "system", label: "Sistem Otomatis" },
            ]}
            value={actorType}
            onChange={(val) => handleActorChange(val)}
            defaultAllId="all"
            align="end"
          />
        </div>
      </div>

      {error && <ActionAlert variant="destructive" message={error} />}

      {/* Audit Log Entries Table (Metronic Inventory Style - Issue #116) */}
      <div className="table-responsive-wrapper table-metronic-wrapper dark:border-border/80 dark:bg-card rounded-none border-y border-[#e9e9ed] bg-white shadow-2xs">
        <table
          role="table"
          className="table-responsive table-metronic w-full border-collapse text-left text-sm"
          aria-label="Tabel Riwayat Aktivitas & Audit Trail"
        >
          <colgroup>
            {["5%", "15%", "18%", "18%", "10%", "34%"].map((width, index) => (
              <col key={index} style={{ width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="dark:bg-muted/40 dark:text-muted-foreground border-b border-[#e9e9ed] bg-[#f9f9fb] text-xs font-semibold text-[#65656f]">
              <th
                scope="col"
                className="dark:border-border/80 w-12 border-r border-b border-[#e9e9ed] px-3 py-3 text-center font-mono"
              >
                No
              </th>
              <th
                scope="col"
                className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
              >
                Waktu (WITA)
              </th>
              <th
                scope="col"
                className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
              >
                Aktor & Peran
              </th>
              <th
                scope="col"
                className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
              >
                Modul & Entitas
              </th>
              <th
                scope="col"
                className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3 text-center"
              >
                Aksi
              </th>
              <th
                scope="col"
                className="dark:border-border/80 border-b border-[#e9e9ed] px-4 py-3"
              >
                Deskripsi & Perubahan
              </th>
            </tr>
          </thead>
          <tbody className="dark:divide-border/80 divide-y divide-[#e9e9ed]">
            {logsData.logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted-foreground py-12 text-center text-xs"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Info className="text-muted-foreground/60 mb-2 h-8 w-8" />
                    <p className="text-foreground text-sm font-semibold">
                      Belum ada catatan aktivitas yang cocok
                    </p>
                    <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                      Setiap perubahan pada susunan acara adat, tugas panitia,
                      atau pencatatan biaya akan tercatat otomatis di sini.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              logsData.logs.map((log: ActivityLog, idx: number) => (
                <tr
                  key={log.id}
                  className="dark:hover:bg-muted/20 transition-colors hover:bg-[#fbfbfd]"
                >
                  <td
                    data-label="No"
                    className="dark:text-muted-foreground dark:border-border/80 border-r border-b border-[#e9e9ed] px-3 py-3.5 text-center align-top font-mono text-xs font-semibold text-[#71717a]"
                  >
                    {(logsData.page - 1) * logsData.pageSize + idx + 1}
                  </td>
                  <td
                    data-label="Waktu (WITA)"
                    className="dark:text-muted-foreground dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-top text-xs text-[#71717a] tabular-nums"
                  >
                    <time>{formatTimestamp(log.createdAt)}</time>
                  </td>
                  <td
                    data-label="Aktor &amp; Peran"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-top"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                        {log.actorName || "Anonim"}
                      </span>
                      {getActorBadge(log.actorType)}
                    </div>
                  </td>
                  <td
                    data-label="Modul &amp; Entitas"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-top"
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
                  <td
                    data-label="Aksi"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-center align-top"
                  >
                    {getActionBadge(log.action)}
                  </td>
                  <td
                    data-label="Deskripsi &amp; Perubahan"
                    className="dark:border-border/80 border-b border-[#e9e9ed] px-4 py-3.5 align-top"
                  >
                    <p className="dark:text-foreground/90 text-xs font-medium leading-relaxed text-[#18181b]">
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
  );
}
