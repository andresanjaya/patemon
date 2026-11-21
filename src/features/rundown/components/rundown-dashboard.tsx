"use client";

import { useState, useTransition } from "react";
import {
  Clock,
  Plus,
  MapPin,
  User,
  Search,
  Printer,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Edit2,
  Trash2,
  LayoutList,
  CalendarHeart,
  Download,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { KeenthemesMetricSummary } from "@/components/ui/keenthemes-metric-summary";
import { downloadCSV } from "@/lib/csv-export";
import { formatRundownToCSV } from "@/features/exports/formatters";
import {
  calculateDelayMinutes,
  calculateDurationMinutes,
  calculateRundownStats,
  formatDelayBadge,
  formatDurationString,
  formatRundownPlainText,
  formatTimeDisplay,
  RUNDOWN_STATUS_CONFIG,
} from "../seeds";
import {
  deleteRundownEventAction,
  importStarterRundownAction,
  updateRundownEventStatusAction,
} from "../actions";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import { RundownModal } from "./rundown-modal";
import { RundownDayOfView } from "./rundown-day-of-view";
import { OfflinePackModal } from "@/features/exports/components/offline-pack-modal";
import type { RundownEvent, RundownEventStatus, RundownStats } from "../types";

interface RundownDashboardProps {
  weddingId: string;
  coupleNames: string;
  prospectiveDate?: string | null;
  ceremonies?: { id: string; customTitle: string }[];
  initialEvents: RundownEvent[];
  initialStats: RundownStats;
  userRole?: string | null;
  isReadOnly?: boolean;
  isPreview?: boolean;
}

export function RundownDashboard({
  weddingId,
  coupleNames,
  prospectiveDate,
  ceremonies = [],
  initialEvents,
  initialStats,
  userRole,
  isReadOnly: propIsReadOnly = false,
  isPreview: propIsPreview,
}: RundownDashboardProps) {
  const workspaceCtx = useWorkspace();
  const isPreview =
    propIsPreview ?? workspaceCtx?.isPreview ?? weddingId === "demo";
  const [isLocalUpgradeOpen, setIsLocalUpgradeOpen] = useState(false);

  const triggerUpgrade = () => {
    if (workspaceCtx?.openUpgradeModal) {
      workspaceCtx.openUpgradeModal();
    } else {
      setIsLocalUpgradeOpen(true);
    }
  };

  const isReadOnly = !isPreview && propIsReadOnly;
  const [events, setEvents] = useState<RundownEvent[]>(initialEvents);
  const [stats, setStats] = useState<RundownStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedPIC, setSelectedPIC] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"live" | "timeline" | "table">(
    "live"
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<RundownEvent | null>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleEventSuccess = (savedEvent: RundownEvent, isEdit: boolean) => {
    let nextEvents: RundownEvent[];
    if (isEdit) {
      nextEvents = events.map((e) => (e.id === savedEvent.id ? savedEvent : e));
    } else {
      nextEvents = [...events, savedEvent];
    }
    // Re-sort by scheduled date and start time
    nextEvents.sort((a, b) => {
      const dateA = a.scheduledDate || "";
      const dateB = b.scheduledDate || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.startTime.localeCompare(b.startTime);
    });

    setEvents(nextEvents);
    setStats(calculateRundownStats(nextEvents));
  };

  const handleUpdateStatus = async (
    eventId: string,
    status: RundownEventStatus,
    actualStartTime?: string | null,
    actualEndTime?: string | null,
    delayMinutes?: number,
    notesDayOf?: string | null,
    expectedUpdatedAt?: string
  ) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (isReadOnly) return;

    setConflictMessage(null);

    // Optimistic local state update
    const previousEvents = [...events];
    const nextEvents = events.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          status,
          actualStartTime:
            actualStartTime !== undefined ? actualStartTime : e.actualStartTime,
          actualEndTime:
            actualEndTime !== undefined ? actualEndTime : e.actualEndTime,
          delayMinutes:
            delayMinutes !== undefined ? delayMinutes : e.delayMinutes,
          notesDayOf: notesDayOf !== undefined ? notesDayOf : e.notesDayOf,
        };
      }
      return e;
    });
    setEvents(nextEvents);
    setStats(calculateRundownStats(nextEvents));

    startTransition(async () => {
      const res = await updateRundownEventStatusAction(weddingId, eventId, {
        status,
        actualStartTime,
        actualEndTime,
        delayMinutes,
        notesDayOf,
        expectedUpdatedAt,
      });

      if (!res.success) {
        // Rollback optimistic update
        setEvents(previousEvents);
        setStats(calculateRundownStats(previousEvents));

        if (res.conflict) {
          setConflictMessage(
            res.error ||
              "Terjadi konflik: Panitia lain telah memperbarui status kegiatan ini. Silakan periksa kembali."
          );
        } else {
          alert(res.error || "Gagal memperbarui status rundown.");
        }
      } else if (res.updatedEvent) {
        // Update with authoritative server state
        const updated = res.updatedEvent;
        setEvents((prev) =>
          prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
        );
      }
    });
  };

  const handleDelete = (eventId: string) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (isReadOnly) return;
    if (!confirm("Apakah Anda yakin ingin menghapus segmen acara ini?")) return;
    const nextEvents = events.filter((e) => e.id !== eventId);
    setEvents(nextEvents);
    setStats(calculateRundownStats(nextEvents));

    startTransition(async () => {
      await deleteRundownEventAction(weddingId, eventId);
    });
  };

  const handleImportStarter = () => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (isReadOnly) return;
    startTransition(async () => {
      await importStarterRundownAction(weddingId, prospectiveDate);
      window.location.reload();
    });
  };

  const handleExportCSV = () => {
    const csv = formatRundownToCSV(events);
    downloadCSV(`rundown-hari-h-${weddingId}.csv`, csv);
  };

  // Distinct filters
  const distinctDates = Array.from(
    new Set(events.map((e) => e.scheduledDate).filter(Boolean) as string[])
  ).sort();

  const distinctLocations = Array.from(
    new Set(events.map((e) => e.location).filter(Boolean) as string[])
  ).sort();

  const distinctPICs = Array.from(
    new Set(events.map((e) => e.personInCharge).filter(Boolean) as string[])
  ).sort();

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.segmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location &&
        e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.personInCharge &&
        e.personInCharge.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDate =
      selectedDate === "all" || e.scheduledDate === selectedDate;
    const matchesLocation =
      selectedLocation === "all" || e.location === selectedLocation;
    const matchesPIC =
      selectedPIC === "all" || e.personInCharge === selectedPIC;
    const matchesStatus =
      selectedStatus === "all" || (e.status || "pending") === selectedStatus;

    return (
      matchesSearch &&
      matchesDate &&
      matchesLocation &&
      matchesPIC &&
      matchesStatus
    );
  });

  // Selection helpers (Issue #116)
  const allSelected =
    filteredEvents.length > 0 &&
    filteredEvents.every((event) => selectedIds.has(event.id));
  const isIndeterminate =
    !allSelected && filteredEvents.some((event) => selectedIds.has(event.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map((event) => event.id)));
    }
  };

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

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDate("all");
    setSelectedLocation("all");
    setSelectedPIC("all");
    setSelectedStatus("all");
  };

  const formattedDate = prospectiveDate
    ? new Date(prospectiveDate).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  const handleCopyText = () => {
    const text = formatRundownPlainText(
      filteredEvents,
      coupleNames,
      formattedDate
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Susunan Acara Hari-H (Rundown)"
        badge={
          isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined
        }
        breadcrumbs={createWorkspaceBreadcrumbs(
          coupleNames || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Rundown"
        )}
        actions={
          <>
            {events.length === 0 && !isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportStarter}
                disabled={isPending}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Impor Rundown Standar Bali</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOfflineModalOpen(true)}
              className="gap-1.5"
              title="Unduh paket HTML mandiri untuk dibuka offline di lokasi acara atau cetak PDF A4"
            >
              <FileText className="h-4 w-4 text-amber-500" />
              <span>Paket Offline Hari-H</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={events.length === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTextModalOpen(true)}
              disabled={events.length === 0}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Format Cetak & Teks</span>
            </Button>

            {(!isReadOnly || isPreview) && (
              <Button
                size="sm"
                onClick={() => {
                  if (isPreview) {
                    triggerUpgrade();
                    return;
                  }
                  setEventToEdit(null);
                  setIsModalOpen(true);
                }}
                disabled={isPending}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Kegiatan</span>
              </Button>
            )}
          </>
        }
      />

      {/* Summary Stats Bar: Keenthemes Compact Metric Standard */}
      <KeenthemesMetricSummary
        headlineLabel="Total Durasi Acara"
        headlineValue={formatDurationString(stats.totalDurationMinutes)}
        subHeadline={`${stats.totalEvents} Segmen Rundown • ${stats.distinctLocations} Titik Lokasi`}
        breakdownTitle={`${stats.totalEvents} Segmen Susunan Acara Hari-H`}
        items={[
          {
            label: "Selesai",
            value: stats.completedCount,
            color: "bg-emerald-500",
            barWeight: stats.completedCount,
          },
          {
            label: "Tertunda / Terlambat",
            value: stats.delayedCount,
            color: "bg-rose-500",
            barWeight: stats.delayedCount,
          },
          {
            label: "Sesuai Jadwal",
            value: Math.max(
              stats.totalEvents - stats.completedCount - stats.delayedCount,
              0
            ),
            color: "bg-blue-500",
            barWeight: Math.max(
              stats.totalEvents - stats.completedCount - stats.delayedCount,
              0
            ),
          },
        ]}
      />

      {/* Filter and View Controls Toolbar */}
      <div className="border-border/60 bg-card/60 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Cari prosesi, lokasi, PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {distinctDates.length > 1 && (
            <TableDropdownFilter
              label="Tanggal"
              options={[
                { id: "all", label: "Semua Tanggal", count: events.length },
                ...distinctDates.map((d) => ({
                  id: d,
                  label: d,
                  count: events.filter((e) => e.scheduledDate === d).length,
                })),
              ]}
              value={selectedDate}
              onChange={setSelectedDate}
              defaultAllId="all"
            />
          )}

          <TableDropdownFilter
            label="Status"
            options={[
              { id: "all", label: "Semua Status", count: events.length },
              ...Object.entries(RUNDOWN_STATUS_CONFIG).map(([k, cfg]) => ({
                id: k,
                label: cfg.label,
                count: events.filter((e) => (e.status || "pending") === k)
                  .length,
              })),
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
            defaultAllId="all"
          />

          <TableDropdownFilter
            label="Lokasi"
            options={[
              { id: "all", label: "Semua Lokasi", count: events.length },
              ...distinctLocations.map((loc) => ({
                id: loc,
                label: loc,
                count: events.filter((e) => e.location === loc).length,
              })),
            ]}
            value={selectedLocation}
            onChange={setSelectedLocation}
            defaultAllId="all"
          />

          <TableDropdownFilter
            label="PIC"
            options={[
              { id: "all", label: "Semua PIC", count: events.length },
              ...distinctPICs.map((pic) => ({
                id: pic,
                label: pic,
                count: events.filter((e) => e.personInCharge === pic).length,
              })),
            ]}
            value={selectedPIC}
            onChange={setSelectedPIC}
            defaultAllId="all"
          />
        </div>

        <div className="flex items-center gap-1 border-t pt-2 sm:border-t-0 sm:pt-0">
          <Button
            variant={viewMode === "live" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("live")}
            className="h-8 px-2.5 text-xs font-semibold"
            title="Mode Eksekusi Hari-H (Live)"
          >
            <Activity className="mr-1.5 h-3.5 w-3.5 animate-pulse text-amber-500" />
            Mode Hari-H
          </Button>

          <Button
            variant={viewMode === "timeline" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
            className="h-8 px-2.5 text-xs"
            title="Tampilan Garis Waktu"
          >
            <Clock className="mr-1 h-3.5 w-3.5" />
            Garis Waktu
          </Button>

          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-2.5 text-xs"
            title="Tampilan Tabel"
          >
            <LayoutList className="mr-1 h-3.5 w-3.5" />
            Tabel
          </Button>
        </div>
      </div>

      {/* Main Content Areas */}
      {viewMode === "live" ? (
        <RundownDayOfView
          weddingId={weddingId}
          events={filteredEvents}
          stats={stats}
          isReadOnly={isReadOnly}
          onUpdateStatus={handleUpdateStatus}
          onEditEvent={(event) => {
            setEventToEdit(event);
            setIsModalOpen(true);
          }}
          onOpenAddModal={() => {
            setEventToEdit(null);
            setIsModalOpen(true);
          }}
          onImportStarter={handleImportStarter}
          isPending={isPending}
          conflictMessage={conflictMessage}
          onDismissConflict={() => setConflictMessage(null)}
        />
      ) : filteredEvents.length === 0 ? (
        <div className="border-border/60 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Clock className="text-muted-foreground/50 mb-3 h-12 w-12" />
          <h3 className="text-foreground text-base font-semibold">
            {events.length === 0
              ? "Belum ada susunan rundown hari H"
              : "Tidak ada kegiatan yang cocok dengan filter"}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs">
            {events.length === 0
              ? "Susun jadwal jam-demi-jam prosesi adat dan resepsi atau gunakan template standar pawiwahan Bali agar seluruh panitia keluarga memiliki panduan waktu yang rapi."
              : "Coba ubah kata kunci pencarian, filter lokasi, atau filter PIC di atas."}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {events.length === 0 && !isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportStarter}
                disabled={isPending}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Gunakan Rundown Standar Bali</span>
              </Button>
            )}
            {!isReadOnly && (
              <Button
                size="sm"
                onClick={() => {
                  setEventToEdit(null);
                  setIsModalOpen(true);
                }}
                disabled={isPending}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Kegiatan Baru</span>
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === "timeline" ? (
        /* Visual Timeline View */
        <div className="before:bg-border/80 relative space-y-6 pl-4 before:absolute before:top-3 before:bottom-0 before:left-4 before:w-0.5 sm:pl-8 sm:before:left-8">
          {filteredEvents.map((event) => {
            const duration = calculateDurationMinutes(
              event.startTime,
              event.endTime
            );
            const timeRange = `${formatTimeDisplay(event.startTime)} - ${formatTimeDisplay(event.endTime)}`;
            const statusConfig =
              RUNDOWN_STATUS_CONFIG[event.status || "pending"];
            const delay =
              event.delayMinutes ??
              (event.actualStartTime
                ? calculateDelayMinutes(event.startTime, event.actualStartTime)
                : 0);
            const delayBadge =
              event.actualStartTime || event.status === "delayed"
                ? formatDelayBadge(delay)
                : null;

            return (
              <div key={event.id} className="group relative pl-6 sm:pl-8">
                {/* Timeline Node Dot */}
                <div
                  className={`border-primary bg-background group-hover:bg-primary absolute top-1.5 -left-1.5 h-3.5 w-3.5 rounded-full border-2 shadow-xs transition-transform group-hover:scale-125 ${
                    event.status === "in_progress"
                      ? "scale-125 bg-amber-500 ring-2 ring-amber-400"
                      : ""
                  }`}
                />

                <div className="border-border/60 hover:border-border bg-card space-y-3 rounded-xl border p-4 shadow-xs transition">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-bold">
                        {timeRange} WITA
                      </span>
                      <span className="text-muted-foreground text-xs font-medium">
                        ({formatDurationString(duration)})
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusConfig?.badgeClass}`}
                      >
                        {statusConfig?.label || event.status}
                      </Badge>
                      {delayBadge && (
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${delayBadge.badgeClass}`}
                        >
                          {delayBadge.type === "late" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : delayBadge.type === "early" ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          <span>{delayBadge.label}</span>
                        </span>
                      )}
                      {event.scheduledDate && (
                        <span className="text-muted-foreground/80 text-[11px]">
                          · {event.scheduledDate}
                        </span>
                      )}
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEventToEdit(event);
                            setIsModalOpen(true);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <Edit2 className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-foreground text-base font-bold">
                        {event.segmentTitle}
                      </h3>
                      {event.ceremonyTitle && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-[10px] text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        >
                          <CalendarHeart className="mr-1 h-3 w-3" />
                          {event.ceremonyTitle}
                        </Badge>
                      )}
                    </div>

                    {event.actualStartTime && (
                      <div className="text-foreground mt-1 text-xs">
                        <span className="text-muted-foreground">
                          Waktu Aktual:
                        </span>{" "}
                        <span className="font-semibold">
                          {formatTimeDisplay(event.actualStartTime)}
                          {event.actualEndTime &&
                            ` - ${formatTimeDisplay(event.actualEndTime)}`}{" "}
                          WITA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata: Location & PIC */}
                  <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="text-primary h-3.5 w-3.5" />
                        <span className="text-foreground font-medium">
                          {event.location}
                        </span>
                      </div>
                    )}
                    {event.personInCharge && (
                      <div className="flex items-center gap-1.5">
                        <User className="text-primary h-3.5 w-3.5" />
                        <span>PIC:</span>
                        <span className="text-foreground font-medium">
                          {event.personInCharge}
                        </span>
                        {event.picPhone && (
                          <span className="text-muted-foreground">
                            ({event.picPhone})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {event.notes && (
                    <p className="bg-muted/40 text-muted-foreground rounded-lg p-2.5 text-xs">
                      {event.notes}
                    </p>
                  )}

                  {event.notesDayOf && (
                    <p className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                      <span className="font-semibold">Catatan Lapangan:</span>{" "}
                      {event.notesDayOf}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Unified Metronic Inventory Table Card (Issue #116) */
        <div className="dark:bg-card dark:border-border/80 overflow-hidden rounded-xl border border-[#e5e5e9] bg-white shadow-xs">
          {/* Row Selection Banner */}
          {selectedIds.size > 0 && (
            <div
              role="status"
              className="flex items-center justify-between border-b border-amber-200/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <span className="font-medium">
                {selectedIds.size} kegiatan dipilih dari total{" "}
                {filteredEvents.length} hasil
              </span>
              <Button
                variant="link"
                size={null}
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="font-medium underline"
              >
                Batalkan Pilihan
              </Button>
            </div>
          )}

          <div className="table-metronic-wrapper dark:border-border/80 dark:bg-card overflow-x-auto rounded-none border-y border-[#e9e9ed] bg-white">
            <table
              className="table-metronic w-full text-left text-xs"
              aria-label="Daftar Susunan Acara Rundown"
            >
              <thead className="dark:bg-muted/30 dark:border-border/60 dark:text-muted-foreground border-b border-[#e9e9ed] bg-[#f9f9fb] text-xs font-semibold text-[#65656f]">
                <tr>
                  <th
                    scope="col"
                    className="dark:border-border/80 w-12 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-center font-semibold"
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Status & Jadwal WITA
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Nama Prosesi / Kegiatan
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Waktu Aktual
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Lokasi
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    PIC
                  </th>
                  <th
                    scope="col"
                    className={`border-b px-4 py-3.5 font-semibold ${!isReadOnly || isPreview ? "border-r" : ""} dark:border-border/80 border-[#e9e9ed]`}
                  >
                    Catatan Lapangan
                  </th>
                  {(!isReadOnly || isPreview) && (
                    <th
                      scope="col"
                      className="dark:border-border/80 border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                    >
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="dark:divide-border/60 divide-y divide-[#e9e9ed]">
                {filteredEvents.map((event, idx) => {
                  const duration = calculateDurationMinutes(
                    event.startTime,
                    event.endTime
                  );
                  const statusConfig =
                    RUNDOWN_STATUS_CONFIG[event.status || "pending"];
                  const delay =
                    event.delayMinutes ??
                    (event.actualStartTime
                      ? calculateDelayMinutes(
                          event.startTime,
                          event.actualStartTime
                        )
                      : 0);
                  const delayBadge =
                    event.actualStartTime || event.status === "delayed"
                      ? formatDelayBadge(delay)
                      : null;
                  const isSelected = selectedIds.has(event.id);

                  return (
                    <tr
                      key={event.id}
                      className={`dark:hover:bg-muted/20 transition-colors hover:bg-[#f9f9fb]/60 ${
                        isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="dark:text-muted-foreground dark:border-border/80 w-12 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-center align-middle text-xs font-semibold text-[#71717a]">
                        {idx + 1}
                      </td>

                      <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle">
                        <div className="flex flex-col gap-1">
                          <div className="dark:text-foreground text-xs font-bold text-[#18181b]">
                            {formatTimeDisplay(event.startTime)} -{" "}
                            {formatTimeDisplay(event.endTime)} WITA
                          </div>
                          <div className="dark:text-muted-foreground text-[11px] text-[#71717a]">
                            {formatDurationString(duration)}
                          </div>
                          <div className="mt-0.5 flex flex-col items-start gap-1">
                            <Badge
                              variant="outline"
                              className={`h-4 px-1.5 text-[9px] ${statusConfig?.badgeClass}`}
                            >
                              {statusConfig?.label || event.status}
                            </Badge>
                            {delayBadge && (
                              <span
                                className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[9px] font-semibold ${delayBadge.badgeClass}`}
                              >
                                {delayBadge.type === "late" ? (
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                ) : delayBadge.type === "early" ? (
                                  <Clock className="h-2.5 w-2.5" />
                                ) : (
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                )}
                                <span>{delayBadge.label}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="dark:border-border/80 border-r border-b border-[#e5e5e9] px-4 py-3.5 align-middle">
                        <div className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                          {event.segmentTitle}
                        </div>
                        {event.ceremonyTitle && (
                          <div className="text-primary mt-0.5 text-xs font-medium">
                            Upacara: {event.ceremonyTitle}
                          </div>
                        )}
                      </td>

                      <td className="dark:border-border/80 border-r border-b border-[#e5e5e9] px-4 py-3.5 align-middle whitespace-nowrap">
                        {event.actualStartTime ? (
                          <div className="dark:text-foreground text-xs font-semibold text-[#18181b]">
                            {formatTimeDisplay(event.actualStartTime)}
                            {event.actualEndTime &&
                              ` - ${formatTimeDisplay(event.actualEndTime)} WITA`}
                          </div>
                        ) : (
                          <span className="dark:text-muted-foreground text-xs text-[#71717a] italic">
                            Belum dicatat
                          </span>
                        )}
                      </td>

                      <td className="dark:text-muted-foreground dark:border-border/80 border-r border-b border-[#e5e5e9] px-4 py-3.5 align-middle text-xs whitespace-nowrap text-[#71717a]">
                        {event.location || "-"}
                      </td>

                      <td className="dark:border-border/80 border-r border-b border-[#e5e5e9] px-4 py-3.5 align-middle text-xs whitespace-nowrap">
                        <div className="dark:text-foreground font-semibold text-[#18181b]">
                          {event.personInCharge || "-"}
                        </div>
                        {event.picPhone && (
                          <div className="dark:text-muted-foreground text-[11px] text-[#71717a]">
                            {event.picPhone}
                          </div>
                        )}
                      </td>

                      <td
                        className={`dark:text-muted-foreground max-w-xs truncate border-b px-4 py-3.5 align-middle text-xs text-[#71717a] ${!isReadOnly || isPreview ? "border-r" : ""} dark:border-border/80 border-[#e5e5e9]`}
                      >
                        {event.notesDayOf ? (
                          <span className="font-medium text-amber-800 dark:text-amber-300">
                            {event.notesDayOf}
                          </span>
                        ) : (
                          event.notes || "-"
                        )}
                      </td>

                      {(!isReadOnly || isPreview) && (
                        <td className="dark:border-border/80 border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end">
                            <TableActionDropdown
                              triggerAriaLabel={`Aksi untuk acara ${event.segmentTitle}`}
                              items={[
                                {
                                  label: "Edit Acara",
                                  icon: <Edit2 className="h-3.5 w-3.5" />,
                                  onClick: () => {
                                    if (isPreview) {
                                      triggerUpgrade();
                                      return;
                                    }
                                    setEventToEdit(event);
                                    setIsModalOpen(true);
                                  },
                                },
                                {
                                  label: "Hapus Acara",
                                  icon: <Trash2 className="h-3.5 w-3.5" />,
                                  variant: "destructive",
                                  onClick: () => handleDelete(event.id),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="dark:border-border/60 dark:text-muted-foreground flex flex-col items-center justify-between gap-3 border-t border-[#f0f0f4] px-4 py-3.5 text-xs text-[#71717a] sm:flex-row sm:px-6">
            <span>
              Menampilkan{" "}
              <strong className="dark:text-foreground font-semibold text-[#18181b]">
                {filteredEvents.length}
              </strong>{" "}
              dari {events.length} kegiatan rundown (Total Durasi{" "}
              <strong className="dark:text-foreground font-semibold text-[#18181b]">
                {formatDurationString(stats.totalDurationMinutes)}
              </strong>
              )
            </span>
            {(Boolean(searchQuery.trim()) ||
              selectedDate !== "all" ||
              selectedLocation !== "all" ||
              selectedPIC !== "all" ||
              selectedStatus !== "all") && (
              <Button
                variant="link"
                size={null}
                type="button"
                onClick={resetFilters}
                className="font-medium"
              >
                Reset Semua Filter
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Rundown Modal */}
      {isModalOpen && (
        <RundownModal
          weddingId={weddingId}
          defaultDate={prospectiveDate}
          ceremonies={ceremonies}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEventToEdit(null);
          }}
          eventToEdit={eventToEdit}
          onSuccess={handleEventSuccess}
        />
      )}

      {/* Format Cetak / Teks Modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-background border-border relative max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl border p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Printer className="text-primary h-5 w-5" />
                <h3 className="text-foreground text-base font-bold">
                  Format Cetak & Teks Rundown Panitia
                </h3>
              </div>
              <Button
                variant="ghost"
                size={null}
                type="button"
                onClick={() => setIsTextModalOpen(false)}
                className="rounded p-1"
              >
                ✕
              </Button>
            </div>

            <p className="text-muted-foreground text-xs">
              Salin format teks ringkas ini untuk disebarkan ke grup WhatsApp
              keluarga atau panitia pelaksana pawiwahan.
            </p>

            <pre className="bg-muted/50 border-border/80 text-foreground max-h-96 overflow-y-auto rounded-lg border p-4 font-mono text-xs whitespace-pre-wrap">
              {formatRundownPlainText(
                filteredEvents,
                coupleNames,
                formattedDate
              )}
            </pre>

            <div className="flex items-center justify-end gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Semua Teks</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak Lembar Panitia</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Day-Of Contingency Pack Modal */}
      {isOfflineModalOpen && (
        <OfflinePackModal
          weddingId={weddingId}
          coupleNames={coupleNames}
          isOpen={isOfflineModalOpen}
          onClose={() => setIsOfflineModalOpen(false)}
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
