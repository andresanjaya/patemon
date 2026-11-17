"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, Clock, CheckCircle2 } from "lucide-react";
import { createRundownEventAction, updateRundownEventAction } from "../actions";
import {
  CANONICAL_LOCATIONS,
  formatTimeDisplay,
  RUNDOWN_STATUS_CONFIG,
} from "../seeds";
import type { RundownEvent, RundownEventStatus } from "../types";

interface RundownModalProps {
  weddingId: string;
  defaultDate?: string | null;
  ceremonies?: { id: string; customTitle: string }[];
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: RundownEvent | null;
  onSuccess: (event: RundownEvent, isEdit: boolean) => void;
}

export function RundownModal({
  weddingId,
  defaultDate,
  ceremonies = [],
  isOpen,
  onClose,
  eventToEdit,
  onSuccess,
}: RundownModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [segmentTitle, setSegmentTitle] = useState(
    eventToEdit?.segmentTitle || ""
  );
  const [scheduledDate, setScheduledDate] = useState(
    eventToEdit?.scheduledDate || defaultDate || ""
  );
  const [startTime, setStartTime] = useState(
    eventToEdit ? formatTimeDisplay(eventToEdit.startTime) : "08:00"
  );
  const [endTime, setEndTime] = useState(
    eventToEdit ? formatTimeDisplay(eventToEdit.endTime) : "09:30"
  );
  const [location, setLocation] = useState(
    eventToEdit?.location || CANONICAL_LOCATIONS[0]
  );
  const [personInCharge, setPersonInCharge] = useState(
    eventToEdit?.personInCharge || ""
  );
  const [picPhone, setPicPhone] = useState(eventToEdit?.picPhone || "");
  const [ceremonyId, setCeremonyId] = useState(eventToEdit?.ceremonyId || "");
  const [notes, setNotes] = useState(eventToEdit?.notes || "");

  // Day-of fields
  const [status, setStatus] = useState<RundownEventStatus>(
    eventToEdit?.status || "pending"
  );
  const [actualStartTime, setActualStartTime] = useState(
    eventToEdit?.actualStartTime || ""
  );
  const [actualEndTime, setActualEndTime] = useState(
    eventToEdit?.actualEndTime || ""
  );
  const [notesDayOf, setNotesDayOf] = useState(eventToEdit?.notesDayOf || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentTitle.trim()) {
      setError("Nama kegiatan / segmen rundown wajib diisi.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Waktu mulai dan selesai wajib diisi.");
      return;
    }

    setError(null);

    startTransition(async () => {
      if (eventToEdit) {
        const res = await updateRundownEventAction(weddingId, eventToEdit.id, {
          segmentTitle: segmentTitle.trim(),
          scheduledDate: scheduledDate || null,
          startTime,
          endTime,
          location: location.trim() || null,
          personInCharge: personInCharge.trim() || null,
          picPhone: picPhone.trim() || null,
          ceremonyId: ceremonyId || null,
          notes: notes.trim() || null,
          status,
          actualStartTime: actualStartTime || null,
          actualEndTime: actualEndTime || null,
          notesDayOf: notesDayOf.trim() || null,
          expectedUpdatedAt: eventToEdit.updatedAt,
        });

        if (!res.success) {
          setError(
            res.error ||
              "Gagal memperbarui susunan acara. Terjadi kendala saat menyimpan."
          );
          return;
        }

        const ceremonyMatch = ceremonies.find((c) => c.id === ceremonyId);
        const updated: RundownEvent = {
          ...eventToEdit,
          segmentTitle: segmentTitle.trim(),
          scheduledDate: scheduledDate || null,
          startTime: formatTimeDisplay(startTime),
          endTime: formatTimeDisplay(endTime),
          location: location.trim() || null,
          personInCharge: personInCharge.trim() || null,
          picPhone: picPhone.trim() || null,
          ceremonyId: ceremonyId || null,
          ceremonyTitle: ceremonyMatch?.customTitle || null,
          notes: notes.trim() || null,
          status,
          actualStartTime: actualStartTime
            ? formatTimeDisplay(actualStartTime)
            : null,
          actualEndTime: actualEndTime
            ? formatTimeDisplay(actualEndTime)
            : null,
          notesDayOf: notesDayOf.trim() || null,
          updatedAt: new Date().toISOString(),
        };

        onSuccess(updated, true);
        onClose();
      } else {
        const res = await createRundownEventAction(weddingId, {
          segmentTitle: segmentTitle.trim(),
          scheduledDate: scheduledDate || null,
          startTime,
          endTime,
          location: location.trim() || null,
          personInCharge: personInCharge.trim() || null,
          picPhone: picPhone.trim() || null,
          ceremonyId: ceremonyId || null,
          notes: notes.trim() || null,
          status,
        });

        if (!res.success || !res.event) {
          setError(res.error || "Gagal menyimpan kegiatan baru.");
          return;
        }

        const ceremonyMatch = ceremonies.find((c) => c.id === ceremonyId);
        onSuccess(
          {
            ...res.event,
            ceremonyTitle: ceremonyMatch?.customTitle || null,
          },
          false
        );
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="bg-card border-border/80 flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rundown-modal-title"
      >
        {/* Metronic Header */}
        <div className="px-6 py-4 border-b border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-white dark:bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="rundown-modal-title"
                className="text-[#18181b] dark:text-foreground text-lg font-bold"
              >
                {eventToEdit ? "Edit Segmen Rundown" : "Tambah Segmen Acara Baru"}
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Susunan jadwal prosesi upacara, koordinasi seksi acara, dan pencatatan hari-H (WITA)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body: 2-Panel Metronic Layout */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel (~2/3): Title, Ceremony Link, Location, PIC, Notes */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="segment-title" className="text-xs font-semibold">
                    Nama Kegiatan / Prosesi <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="segment-title"
                    value={segmentTitle}
                    onChange={(e) => setSegmentTitle(e.target.value)}
                    placeholder="Contoh: Upacara Pabyakala & Temu Manten"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ceremony-link" className="text-xs font-semibold">
                      Tautkan ke Upacara Adat
                    </Label>
                    <select
                      id="ceremony-link"
                      value={ceremonyId}
                      onChange={(e) => setCeremonyId(e.target.value)}
                      className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                    >
                      <option value="">(Umum / Tidak terikat prosesi)</option>
                      {ceremonies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-semibold">
                      Lokasi Prosesi
                    </Label>
                    <input
                      list="location-options"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Pilih atau ketik lokasi..."
                      className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                    />
                    <datalist id="location-options">
                      {CANONICAL_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pic" className="text-xs font-semibold">
                      Penanggung Jawab (PIC)
                    </Label>
                    <Input
                      id="pic"
                      value={personInCharge}
                      onChange={(e) => setPersonInCharge(e.target.value)}
                      placeholder="Contoh: Jero Mangku / Bli Nyoman"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pic-phone" className="text-xs font-semibold">
                      No. Telepon / WhatsApp PIC
                    </Label>
                    <Input
                      id="pic-phone"
                      value={picPhone}
                      onChange={(e) => setPicPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold">
                    Catatan & Kesiapan Sarana
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Peralatan khusus, koordinasi sekaa gong, arahan pakaian panitia, dll..."
                    className="text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Panel (~1/3): Timing, Status, Day-of Execution */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:border-l lg:border-[#f0f0f4] dark:lg:border-border/60 lg:pl-6">
                <div className="space-y-1.5">
                  <Label htmlFor="scheduled-date" className="text-xs font-semibold">
                    Hari / Tanggal Acara
                  </Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-time" className="text-xs font-semibold">
                      Mulai (WITA)
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="end-time" className="text-xs font-semibold">
                      Selesai (WITA)
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-semibold">
                    Status Pelaksanaan
                  </Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as RundownEventStatus)
                    }
                    className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                  >
                    {(
                      Object.keys(RUNDOWN_STATUS_CONFIG) as RundownEventStatus[]
                    ).map((st) => (
                      <option key={st} value={st}>
                        {RUNDOWN_STATUS_CONFIG[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day-of Tracking Card if editing */}
                {eventToEdit && (
                  <div className="rounded-xl border border-[#f0f0f4] dark:border-border/60 bg-[#f9f9fb] dark:bg-muted/20 p-3.5 space-y-3">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Pencatatan Aktual Hari-H
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="actual-start-time" className="text-[11px]">
                          Mulai Aktual
                        </Label>
                        <Input
                          id="actual-start-time"
                          type="time"
                          value={actualStartTime}
                          onChange={(e) => setActualStartTime(e.target.value)}
                          className="h-8 text-xs bg-white dark:bg-card"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="actual-end-time" className="text-[11px]">
                          Selesai Aktual
                        </Label>
                        <Input
                          id="actual-end-time"
                          type="time"
                          value={actualEndTime}
                          onChange={(e) => setActualEndTime(e.target.value)}
                          className="h-8 text-xs bg-white dark:bg-card"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="notes-day-of" className="text-[11px]">
                        Catatan Khusus Lapangan
                      </Label>
                      <Input
                        id="notes-day-of"
                        value={notesDayOf}
                        onChange={(e) => setNotesDayOf(e.target.value)}
                        placeholder="Misal: Pergeseran waktu karena kedatangan sulinggih"
                        className="h-8 text-xs bg-white dark:bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Metronic Footer */}
          <div className="px-6 py-3.5 border-t border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-[#fbfbfd] dark:bg-card">
            <span className="text-xs text-muted-foreground">
              {eventToEdit ? `ID: ${eventToEdit.id}` : "Segmen baru akan ditambahkan ke susunan acara"}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="text-xs">
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {eventToEdit ? "Simpan Perubahan" : "Tambah Segmen"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
