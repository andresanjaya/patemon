"use client";

import { FieldLabel, Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  SkipForward,
  User,
  Sparkles,
  Plus,
  AlertCircle,
  CalendarHeart,
  ChevronRight,
  Edit2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calculateDelayMinutes,
  calculateDurationMinutes,
  formatDelayBadge,
  formatDurationString,
  formatTimeDisplay,
  getCurrentTimeWita,
  RUNDOWN_STATUS_CONFIG,
} from "../seeds";
import type { RundownEvent, RundownEventStatus, RundownStats } from "../types";

interface RundownDayOfViewProps {
  weddingId: string;
  events: RundownEvent[];
  stats: RundownStats;
  isReadOnly?: boolean;
  onUpdateStatus: (
    eventId: string,
    status: RundownEventStatus,
    actualStartTime?: string | null,
    actualEndTime?: string | null,
    delayMinutes?: number,
    notesDayOf?: string | null,
    expectedUpdatedAt?: string
  ) => Promise<void>;
  onEditEvent: (event: RundownEvent) => void;
  onOpenAddModal: () => void;
  onImportStarter: () => void;
  isPending: boolean;
  conflictMessage?: string | null;
  onDismissConflict?: () => void;
}

export function RundownDayOfView({
  events,
  stats,
  isReadOnly = false,
  onUpdateStatus,
  onEditEvent,
  onOpenAddModal,
  onImportStarter,
  isPending,
  conflictMessage,
  onDismissConflict,
}: RundownDayOfViewProps) {
  // Quick status dialog state
  const [quickEditEvent, setQuickEditEvent] = useState<RundownEvent | null>(
    null
  );
  const [quickStatus, setQuickStatus] = useState<RundownEventStatus>("pending");
  const [quickActualStart, setQuickActualStart] = useState("");
  const [quickActualEnd, setQuickActualEnd] = useState("");
  const [quickNotesDayOf, setQuickNotesDayOf] = useState("");

  const currentTimeWita = getCurrentTimeWita();

  // Find active segment: first in_progress, or else first delayed/pending
  const activeEvent =
    events.find((e) => e.status === "in_progress") ||
    events.find((e) => e.status === "delayed") ||
    events.find((e) => e.status === "pending") ||
    null;

  // Find next up segment: event after activeEvent in array that is pending
  const activeIndex = activeEvent
    ? events.findIndex((e) => e.id === activeEvent.id)
    : -1;
  const nextUpEvent =
    activeIndex >= 0
      ? events.slice(activeIndex + 1).find((e) => e.status === "pending") ||
        null
      : null;

  const openQuickDialog = (event: RundownEvent) => {
    setQuickEditEvent(event);
    setQuickStatus(event.status || "pending");
    setQuickActualStart(event.actualStartTime || "");
    setQuickActualEnd(event.actualEndTime || "");
    setQuickNotesDayOf(event.notesDayOf || "");
  };

  const handleSaveQuickDialog = async () => {
    if (!quickEditEvent) return;

    let computedDelay: number | undefined;
    if (quickActualStart) {
      computedDelay = calculateDelayMinutes(
        quickEditEvent.startTime,
        quickActualStart
      );
    }

    await onUpdateStatus(
      quickEditEvent.id,
      quickStatus,
      quickActualStart || null,
      quickActualEnd || null,
      computedDelay,
      quickNotesDayOf || null,
      quickEditEvent.updatedAt
    );
    setQuickEditEvent(null);
  };

  const handleStartNow = async (event: RundownEvent) => {
    const witaNow = getCurrentTimeWita();
    const delay = calculateDelayMinutes(event.startTime, witaNow);
    await onUpdateStatus(
      event.id,
      "in_progress",
      witaNow,
      event.actualEndTime || null,
      delay,
      event.notesDayOf || null,
      event.updatedAt
    );
  };

  const handleCompleteNow = async (event: RundownEvent) => {
    const witaNow = getCurrentTimeWita();
    await onUpdateStatus(
      event.id,
      "completed",
      event.actualStartTime || event.startTime,
      witaNow,
      event.delayMinutes ?? 0,
      event.notesDayOf || null,
      event.updatedAt
    );
  };

  if (events.length === 0) {
    return (
      <div className="border-border/60 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <Clock className="text-muted-foreground/50 mb-3 h-12 w-12" />
        <h3 className="text-foreground text-base font-semibold">
          Belum ada susunan rundown hari H
        </h3>
        <p className="text-muted-foreground mt-1 max-w-md text-xs">
          Mulai tambahkan kegiatan atau impor template susunan upacara pawiwahan
          Bali agar panitia dapat memantau eksekusi lapangan secara langsung.
        </p>
        <div className="mt-5 flex items-center gap-2">
          {!isReadOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onImportStarter}
                disabled={isPending}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Gunakan Rundown Standar Bali</span>
              </Button>
              <Button
                size="sm"
                onClick={onOpenAddModal}
                disabled={isPending}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Kegiatan Baru</span>
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Concurrency Conflict Banner */}
      {conflictMessage && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">Pembaruan Bersamaan Terdeteksi</p>
              <p className="text-xs opacity-90">{conflictMessage}</p>
            </div>
          </div>
          {onDismissConflict && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDismissConflict}
              className="h-7 text-xs"
            >
              Tutup
            </Button>
          )}
        </div>
      )}

      {/* Live Status Bar */}
      <div className="border-border/70 bg-card/70 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-sm font-bold tracking-tight">
                Mode Hari-H Berjalan
              </span>
              <span className="rounded bg-stone-200/80 px-2 py-0.5 text-[11px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                WITA (UTC+8): {currentTimeWita}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Pelacakan waktu aktual prosesi dan status penugasan panitia
              lapangan.
            </p>
          </div>
        </div>

        {isReadOnly && (
          <Badge
            variant="outline"
            className="border-blue-400 bg-blue-50 text-xs text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
          >
            Mode Viewer (Hanya Baca)
          </Badge>
        )}
      </div>

      {/* Active Segment Hero Card */}
      {activeEvent ? (
        <Card
          className={`border-2 transition-all ${
            activeEvent.status === "in_progress"
              ? "border-amber-500/80 bg-amber-500/5 shadow-md dark:border-amber-500/40"
              : "border-border/80 bg-card"
          }`}
        >
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {activeEvent.status === "in_progress"
                    ? "⚡ Sedang Berlangsung Saat Ini"
                    : "⏳ Segmen Berikutnya untuk Dimulai"}
                </span>
                <Badge
                  variant="outline"
                  className={
                    RUNDOWN_STATUS_CONFIG[activeEvent.status || "pending"]
                      ?.badgeClass
                  }
                >
                  {RUNDOWN_STATUS_CONFIG[activeEvent.status || "pending"]
                    ?.label ||
                    activeEvent.status ||
                    "pending"}
                </Badge>
              </div>

              {/* Delay badge with explicit non-color indicators */}
              {activeEvent.actualStartTime && (
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const delay =
                      activeEvent.delayMinutes ??
                      calculateDelayMinutes(
                        activeEvent.startTime,
                        activeEvent.actualStartTime
                      );
                    const badge = formatDelayBadge(delay);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${badge.badgeClass}`}
                      >
                        {badge.type === "late" ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : badge.type === "early" ? (
                          <Clock className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-foreground text-xl font-bold sm:text-2xl">
                  {activeEvent.segmentTitle}
                </h2>
                {activeEvent.ceremonyTitle && (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  >
                    <CalendarHeart className="mr-1 h-3.5 w-3.5" />
                    {activeEvent.ceremonyTitle}
                  </Badge>
                )}
              </div>

              {/* Time grid: scheduled vs actual */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border-border/60 bg-background/80 rounded-xl border p-3">
                  <span className="text-muted-foreground block text-[11px] font-medium">
                    Jadwal Rencana
                  </span>
                  <div className="text-foreground mt-0.5 text-base font-bold">
                    {formatTimeDisplay(activeEvent.startTime)} -{" "}
                    {formatTimeDisplay(activeEvent.endTime)} WITA
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Durasi rencana:{" "}
                    {formatDurationString(
                      calculateDurationMinutes(
                        activeEvent.startTime,
                        activeEvent.endTime
                      )
                    )}
                  </span>
                </div>

                <div className="border-border/60 bg-background/80 rounded-xl border p-3">
                  <span className="text-muted-foreground block text-[11px] font-medium">
                    Waktu Pelaksanaan Aktual
                  </span>
                  <div className="text-foreground mt-0.5 text-base font-bold">
                    {activeEvent.actualStartTime ? (
                      <>
                        Mulai: {formatTimeDisplay(activeEvent.actualStartTime)}{" "}
                        WITA
                        {activeEvent.actualEndTime && (
                          <>
                            {" "}
                            · Selesai:{" "}
                            {formatTimeDisplay(activeEvent.actualEndTime)} WITA
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground font-normal">
                        Belum dimulai (menunggu aba-aba)
                      </span>
                    )}
                  </div>
                  {activeEvent.actualStartTime &&
                    !activeEvent.actualEndTime && (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Sedang berlangsung di lokasi
                      </span>
                    )}
                  {activeEvent.actualStartTime && activeEvent.actualEndTime && (
                    <span className="text-muted-foreground text-xs">
                      Durasi aktual:{" "}
                      {formatDurationString(
                        calculateDurationMinutes(
                          activeEvent.actualStartTime,
                          activeEvent.actualEndTime
                        )
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta: Location & PIC Contact */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  {activeEvent.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="text-primary h-4 w-4" />
                      <span className="text-foreground font-semibold">
                        {activeEvent.location}
                      </span>
                    </div>
                  )}

                  {activeEvent.personInCharge && (
                    <div className="flex items-center gap-1.5">
                      <User className="text-primary h-4 w-4" />
                      <span>PIC:</span>
                      <span className="text-foreground font-semibold">
                        {activeEvent.personInCharge}
                      </span>
                    </div>
                  )}
                </div>

                {/* PIC Phone / WhatsApp Button */}
                {activeEvent.picPhone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${activeEvent.picPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp PIC</span>
                    </a>
                    <a
                      href={`tel:${activeEvent.picPhone}`}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{activeEvent.picPhone}</span>
                    </a>
                  </div>
                )}
              </div>

              {activeEvent.notes && (
                <div className="bg-muted/40 mt-3 rounded-lg p-3 text-xs">
                  <span className="text-foreground font-semibold">
                    Catatan Sarana & Prosesi:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {activeEvent.notes}
                  </span>
                </div>
              )}

              {activeEvent.notesDayOf && (
                <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-50/50 p-2.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <span className="font-semibold">
                    Catatan Lapangan Hari-H:
                  </span>{" "}
                  {activeEvent.notesDayOf}
                </div>
              )}
            </div>

            {/* Quick Execution Action Buttons */}
            {!isReadOnly && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  {activeEvent.status !== "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleStartNow(activeEvent)}
                      disabled={isPending}
                    >
                      <Play className="mr-1.5 h-4 w-4" />
                      <span>Mulai Sekarang ({currentTimeWita})</span>
                    </Button>
                  )}

                  {activeEvent.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteNow(activeEvent)}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      <span>Selesai Sekarang ({currentTimeWita})</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openQuickDialog(activeEvent)}
                    disabled={isPending}
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    <span>Ubah Waktu / Catatan Lapangan</span>
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onUpdateStatus(
                        activeEvent.id,
                        "delayed",
                        activeEvent.actualStartTime,
                        activeEvent.actualEndTime,
                        activeEvent.delayMinutes || 15,
                        activeEvent.notesDayOf,
                        activeEvent.updatedAt
                      )
                    }
                    disabled={isPending}
                    className="text-xs"
                  >
                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                    <span>Tandai Terlambat</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onUpdateStatus(
                        activeEvent.id,
                        "skipped",
                        null,
                        null,
                        0,
                        "Dilewati atas kesepakatan panitia",
                        activeEvent.updatedAt
                      )
                    }
                    disabled={isPending}
                    className="text-muted-foreground text-xs"
                  >
                    <SkipForward className="mr-1 h-3.5 w-3.5" />
                    <span>Lewati</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 bg-emerald-500/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <h3 className="text-foreground font-bold">
                  Seluruh Susunan Acara Telah Rampung
                </h3>
                <p className="text-muted-foreground text-xs">
                  Semua {events.length} prosesi upacara telah selesai
                  dilaksanakan. Manggalamastu.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAddModal}
              disabled={isReadOnly}
            >
              Tambah Segmen Tambahan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Next Up Segment Mini Card */}
      {nextUpEvent && (
        <div className="border-border/60 bg-card/60 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg font-bold">
              <ChevronRight className="h-4 w-4" />
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                Segmen Berikutnya (Next Up)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-bold">
                  {nextUpEvent.segmentTitle}
                </span>
                <span className="text-muted-foreground text-xs">
                  · {formatTimeDisplay(nextUpEvent.startTime)} WITA
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-3 text-xs">
                {nextUpEvent.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span>{nextUpEvent.location}</span>
                  </span>
                )}
                {nextUpEvent.personInCharge && (
                  <span className="flex items-center gap-1">
                    <User className="text-primary h-3.5 w-3.5 shrink-0" />
                    <span>PIC: {nextUpEvent.personInCharge}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStartNow(nextUpEvent)}
              disabled={isPending}
              className="gap-1 text-xs"
            >
              <Play className="h-3 w-3" />
              <span>Mulai Segmen Ini</span>
            </Button>
          )}
        </div>
      )}

      {/* Complete Step-by-Step Agenda List with Status Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-sm font-bold tracking-wider uppercase">
            Alur Seluruh Prosesi Hari-H ({events.length} Segmen)
          </h3>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span>Selesai: {stats.completedCount}</span>
            <span>Berlangsung: {stats.inProgressCount}</span>
            <span>Tertunda: {stats.delayedCount}</span>
          </div>
        </div>

        <div className="divide-border/60 bg-card border-border/60 divide-y rounded-xl border shadow-xs">
          {events.map((event, idx) => {
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
              <div
                key={event.id}
                className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                  event.status === "in_progress"
                    ? "bg-amber-500/5 dark:bg-amber-500/10"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground mt-0.5 w-6 text-center text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground text-sm font-bold">
                        {event.segmentTitle}
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
                    </div>

                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
                      <span>
                        Jadwal: {formatTimeDisplay(event.startTime)} -{" "}
                        {formatTimeDisplay(event.endTime)} WITA
                      </span>
                      {event.actualStartTime && (
                        <span className="text-foreground font-medium">
                          Aktual: {formatTimeDisplay(event.actualStartTime)}
                          {event.actualEndTime &&
                            ` - ${formatTimeDisplay(event.actualEndTime)}`}
                        </span>
                      )}
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="text-primary h-3.5 w-3.5 shrink-0" />
                          <span>{event.location}</span>
                        </span>
                      )}
                      {event.personInCharge && (
                        <span className="inline-flex items-center gap-1">
                          <User className="text-primary h-3.5 w-3.5 shrink-0" />
                          <span>PIC: {event.personInCharge}</span>
                        </span>
                      )}
                      {event.picPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="text-primary h-3.5 w-3.5 shrink-0" />
                          <span>{event.picPhone}</span>
                        </span>
                      )}
                    </div>

                    {event.notesDayOf && (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        Catatan: {event.notesDayOf}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions per item */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {!isReadOnly ? (
                    <>
                      {event.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartNow(event)}
                          disabled={isPending}
                          className="h-7 text-xs"
                        >
                          <Play className="mr-1 h-3 w-3 text-amber-500" />
                          Mulai
                        </Button>
                      )}
                      {event.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteNow(event)}
                          disabled={isPending}
                          className="h-7 text-xs font-semibold"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                          Selesai
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openQuickDialog(event)}
                        disabled={isPending}
                        className="h-7 text-xs"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">
                      Hanya baca
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Edit Status Dialog */}
      {quickEditEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-background border-border relative w-full max-w-md space-y-4 rounded-xl border p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-primary h-5 w-5" />
                <h3 className="text-foreground text-base font-bold">
                  Status Eksekusi Hari-H
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Tutup"
                onClick={() => setQuickEditEvent(null)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-foreground text-xs font-semibold">
              {quickEditEvent.segmentTitle}
            </p>

            <div className="space-y-3 text-xs">
              <Field>
                <FieldLabel
                  htmlFor="quick-status"
                  className="text-muted-foreground mb-1 block font-medium"
                >
                  Status Prosesi
                </FieldLabel>
                <NativeSelect
                  id="quick-status"
                  value={quickStatus}
                  onChange={(e) =>
                    setQuickStatus(e.target.value as RundownEventStatus)
                  }
                  className="border-input bg-background text-foreground w-full rounded-md border px-3 shadow-xs"
                >
                  {(
                    Object.keys(RUNDOWN_STATUS_CONFIG) as RundownEventStatus[]
                  ).map((st) => (
                    <option key={st} value={st}>
                      {RUNDOWN_STATUS_CONFIG[st].label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel
                    htmlFor="quick-start"
                    className="text-muted-foreground mb-1 block font-medium"
                  >
                    Mulai Aktual (WITA)
                  </FieldLabel>
                  <div className="flex gap-1">
                    <Input
                      id="quick-start"
                      type="time"
                      value={quickActualStart}
                      onChange={(e) => setQuickActualStart(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickActualStart(getCurrentTimeWita())}
                      className="h-8 px-2 text-[10px]"
                      title="Isi jam sekarang"
                    >
                      Sekarang
                    </Button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="quick-end"
                    className="text-muted-foreground mb-1 block font-medium"
                  >
                    Selesai Aktual (WITA)
                  </FieldLabel>
                  <div className="flex gap-1">
                    <Input
                      id="quick-end"
                      type="time"
                      value={quickActualEnd}
                      onChange={(e) => setQuickActualEnd(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickActualEnd(getCurrentTimeWita())}
                      className="h-8 px-2 text-[10px]"
                      title="Isi jam sekarang"
                    >
                      Sekarang
                    </Button>
                  </div>
                </Field>
              </div>

              <Field>
                <FieldLabel
                  htmlFor="quick-notes"
                  className="text-muted-foreground mb-1 block font-medium"
                >
                  Catatan Lapangan Hari-H
                </FieldLabel>
                <Input
                  id="quick-notes"
                  value={quickNotesDayOf}
                  onChange={(e) => setQuickNotesDayOf(e.target.value)}
                  placeholder="Misal: Mundur 10 menit menunggu sekaa gong lengkap"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const ev = quickEditEvent;
                  setQuickEditEvent(null);
                  onEditEvent(ev);
                }}
                className="text-muted-foreground h-8 text-xs"
              >
                Edit Detail Lengkap
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickEditEvent(null)}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveQuickDialog}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  Simpan Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
