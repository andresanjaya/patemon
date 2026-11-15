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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="bg-background border-border relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rundown-modal-title"
      >
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Clock className="text-primary h-5 w-5" />
            <h2
              id="rundown-modal-title"
              className="text-foreground text-lg font-bold"
            >
              {eventToEdit ? "Edit Segmen Rundown" : "Tambah Segmen Acara Baru"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive mb-4 rounded-md border p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="segment-title">
                Nama Kegiatan / Prosesi{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="segment-title"
                value={segmentTitle}
                onChange={(e) => setSegmentTitle(e.target.value)}
                placeholder="Contoh: Upacara Pabyakala & Temu Manten"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Hari / Tanggal Acara</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ceremony-link">Tautkan ke Upacara Adat</Label>
              <select
                id="ceremony-link"
                value={ceremonyId}
                onChange={(e) => setCeremonyId(e.target.value)}
                className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
              >
                <option value="">(Umum / Tidak terikat prosesi)</option>
                {ceremonies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Jam Mulai</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Jam Selesai</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi Prosesi</Label>
              <div className="relative">
                <input
                  list="location-options"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Pilih atau ketik lokasi..."
                  className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
                />
                <datalist id="location-options">
                  {CANONICAL_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pic">Penanggung Jawab (PIC)</Label>
              <Input
                id="pic"
                value={personInCharge}
                onChange={(e) => setPersonInCharge(e.target.value)}
                placeholder="Contoh: Jero Mangku / Bli Nyoman / Seksi Acara"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pic-phone">No. Telepon / WhatsApp PIC</Label>
              <Input
                id="pic-phone"
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Hari-H</Label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as RundownEventStatus)
                }
                className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
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

            {eventToEdit && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="actual-start-time">
                    Jam Mulai Aktual (WITA)
                  </Label>
                  <Input
                    id="actual-start-time"
                    type="time"
                    value={actualStartTime}
                    onChange={(e) => setActualStartTime(e.target.value)}
                    placeholder="HH:MM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual-end-time">
                    Jam Selesai Aktual (WITA)
                  </Label>
                  <Input
                    id="actual-end-time"
                    type="time"
                    value={actualEndTime}
                    onChange={(e) => setActualEndTime(e.target.value)}
                    placeholder="HH:MM"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes-day-of">Catatan Khusus Hari-H</Label>
                  <Input
                    id="notes-day-of"
                    value={notesDayOf}
                    onChange={(e) => setNotesDayOf(e.target.value)}
                    placeholder="Misal: Pergeseran waktu karena kedatangan sulinggih terlambat 15 mnt"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Catatan & Kesiapan Sarana</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Peralatan khusus, koordinasi sekaa gong, arahan pakaian panitia, dll..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {eventToEdit ? "Simpan Perubahan" : "Tambah Segmen"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
