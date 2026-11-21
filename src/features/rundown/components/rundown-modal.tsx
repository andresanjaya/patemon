"use client";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rundown-modal-title"
      >
        {/* Metronic Header */}
        <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary rounded-xl p-2">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="rundown-modal-title"
                className="dark:text-foreground text-lg font-bold text-[#18181b]"
              >
                {eventToEdit
                  ? "Edit Segmen Rundown"
                  : "Tambah Segmen Acara Baru"}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Susunan jadwal prosesi upacara, koordinasi seksi acara, dan
                pencatatan hari-H (WITA)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body: 2-Panel Metronic Layout */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <FieldGroup className="min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {error && (
                <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Panel (~2/3): Title, Ceremony Link, Location, PIC, Notes */}
                <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                  <Field>
                    <FieldLabel
                      htmlFor="segment-title"
                      className="font-semibold"
                    >
                      Nama Kegiatan / Prosesi{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="segment-title"
                      value={segmentTitle}
                      onChange={(e) => setSegmentTitle(e.target.value)}
                      placeholder="Contoh: Upacara Pabyakala & Temu Manten"

                      required
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel
                        htmlFor="ceremony-link"
                        className="font-semibold"
                      >
                        Tautkan ke Upacara Adat
                      </FieldLabel>
                      <NativeSelect
                        id="ceremony-link"
                        value={ceremonyId}
                        onChange={(e) => setCeremonyId(e.target.value)}
                        className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                      >
                        <option value="">(Umum / Tidak terikat prosesi)</option>
                        {ceremonies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.customTitle}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="location" className="font-semibold">
                        Lokasi Prosesi
                      </FieldLabel>
                      <Input
                        list="location-options"
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Pilih atau ketik lokasi..."
                        className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                      />
                      <datalist id="location-options">
                        {CANONICAL_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="pic" className="font-semibold">
                        Penanggung Jawab (PIC)
                      </FieldLabel>
                      <Input
                        id="pic"
                        value={personInCharge}
                        onChange={(e) => setPersonInCharge(e.target.value)}
                        placeholder="Contoh: Jero Mangku / Bli Nyoman"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="pic-phone" className="font-semibold">
                        No. Telepon / WhatsApp PIC
                      </FieldLabel>
                      <Input
                        id="pic-phone"
                        value={picPhone}
                        onChange={(e) => setPicPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="notes" className="font-semibold">
                      Catatan & Kesiapan Sarana
                    </FieldLabel>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Peralatan khusus, koordinasi sekaa gong, arahan pakaian panitia, dll..."
                      className="leading-relaxed"
                    />
                  </Field>
                </div>

                {/* Right Panel (~1/3): Timing, Status, Day-of Execution */}
                <div className="dark:lg:border-border/60 space-y-4 lg:col-span-5 lg:border-l lg:border-[#f0f0f4] lg:pl-6 xl:col-span-4">
                  <Field>
                    <FieldLabel
                      htmlFor="scheduled-date"
                      className="font-semibold"
                    >
                      Hari / Tanggal Acara
                    </FieldLabel>
                    <Input
                      id="scheduled-date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-2">
                    <Field>
                      <FieldLabel
                        htmlFor="start-time"
                        className="font-semibold"
                      >
                        Mulai (WITA)
                      </FieldLabel>
                      <Input
                        id="start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}

                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="end-time" className="font-semibold">
                        Selesai (WITA)
                      </FieldLabel>
                      <Input
                        id="end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}

                        required
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="status" className="font-semibold">
                      Status Pelaksanaan
                    </FieldLabel>
                    <NativeSelect
                      id="status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as RundownEventStatus)
                      }
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      {(
                        Object.keys(
                          RUNDOWN_STATUS_CONFIG
                        ) as RundownEventStatus[]
                      ).map((st) => (
                        <option key={st} value={st}>
                          {RUNDOWN_STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  {/* Day-of Tracking Card if editing */}
                  {eventToEdit && (
                    <div className="dark:border-border/60 dark:bg-muted/20 space-y-3 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-3.5">
                      <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                        Pencatatan Aktual Hari-H
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        <Field>
                          <FieldLabel htmlFor="actual-start-time">
                            Mulai Aktual
                          </FieldLabel>
                          <Input
                            id="actual-start-time"
                            type="time"
                            value={actualStartTime}
                            onChange={(e) => setActualStartTime(e.target.value)}
                            className="dark:bg-card bg-white"
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="actual-end-time">
                            Selesai Aktual
                          </FieldLabel>
                          <Input
                            id="actual-end-time"
                            type="time"
                            value={actualEndTime}
                            onChange={(e) => setActualEndTime(e.target.value)}
                            className="dark:bg-card bg-white"
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="notes-day-of">
                          Catatan Khusus Lapangan
                        </FieldLabel>
                        <Input
                          id="notes-day-of"
                          value={notesDayOf}
                          onChange={(e) => setNotesDayOf(e.target.value)}
                          placeholder="Misal: Pergeseran waktu karena kedatangan sulinggih"
                          className="dark:bg-card bg-white"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Metronic Footer */}
            <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-t border-[#f0f0f4] bg-[#fbfbfd] px-6 py-3.5">
              <span className="text-muted-foreground text-xs">
                {eventToEdit
                  ? `ID: ${eventToEdit.id}`
                  : "Segmen baru akan ditambahkan ke susunan acara"}
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
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs"
                >
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
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
