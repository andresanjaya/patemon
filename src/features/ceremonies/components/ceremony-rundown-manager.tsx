"use client";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus, Trash2, MapPin, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { addRundownEventAction, deleteRundownEventAction } from "../actions";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import type { RundownEvent } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CeremonyRundownManagerProps {
  weddingId: string;
  ceremonyId: string;
  initialEvents: RundownEvent[];
  userRole: WorkspaceRole;
  scheduledDate?: string | null;
}

export function CeremonyRundownManager({
  weddingId,
  ceremonyId,
  initialEvents,
  userRole,
  scheduledDate,
}: CeremonyRundownManagerProps) {
  const router = useRouter();
  const workspaceCtx = useWorkspace();
  const isPreview = workspaceCtx?.isPreview ?? weddingId === "demo";
  const triggerUpgrade = () => workspaceCtx?.openUpgradeModal?.();
  const canEdit = isPreview || userRole === "owner" || userRole === "editor";

  const [events, setEvents] = useState<RundownEvent[]>(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // New segment form state
  const [segmentTitle, setSegmentTitle] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [personInCharge, setPersonInCharge] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!segmentTitle.trim()) {
      setErrorMsg("Nama kegiatan / segmen rundown wajib diisi.");
      return;
    }

    if (!startTime || !endTime) {
      setErrorMsg("Waktu mulai dan selesai wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const res = await addRundownEventAction(weddingId, ceremonyId, {
      segmentTitle,
      startTime,
      endTime,
      location: location || null,
      personInCharge: personInCharge || null,
      notes: notes || null,
      scheduledDate: scheduledDate || null,
    });

    setLoading(false);

    if (res.success) {
      // Optimistic append
      const newEvent: RundownEvent = {
        id: res.eventId || "rundown-" + Date.now(),
        weddingId,
        ceremonyId,
        segmentTitle,
        startTime,
        endTime,
        location: location || null,
        personInCharge: personInCharge || null,
        orderIndex: events.length + 1,
        notes: notes || null,
      };

      setEvents((prev) =>
        [...prev, newEvent].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        )
      );

      // Reset form
      setSegmentTitle("");
      setLocation("");
      setPersonInCharge("");
      setNotes("");
      setIsModalOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.message || "Gagal menambahkan segmen rundown.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!canEdit) return;

    // Optimistic delete
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await deleteRundownEventAction(weddingId, ceremonyId, eventId);
    router.refresh();
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-foreground text-lg">
              Rundown Jam-demi-Jam
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {events.length} Segmen
            </Badge>
          </div>
          <CardDescription className="mt-1 text-xs">
            Alur waktu rinci pelaksanaan prosesi untuk koordinasi keluarga dan
            pemangku.
          </CardDescription>
        </div>

        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              if (isPreview) {
                triggerUpgrade();
                return;
              }
              setIsModalOpen(true);
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Segmen</span>
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {events.length === 0 ? (
          <div className="border-border/60 rounded-xl border border-dashed py-8 text-center">
            <Clock className="text-muted-foreground/60 mx-auto h-8 w-8" />
            <p className="text-foreground mt-2 text-sm font-semibold">
              Belum Ada Segmen Rundown
            </p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              Tambahkan urutan waktu prosesi (misal kedatangan pemangku,
              penyucian, persembahyangan) agar keluarga dapat bersiap tepat
              waktu.
            </p>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isPreview) {
                    triggerUpgrade();
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="mt-4 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Susun Segmen Pertama</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="before:bg-border relative pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5">
            <div className="space-y-4">
              {events.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className="border-border bg-card/60 hover:border-primary/40 relative rounded-xl border p-4 shadow-xs transition-colors"
                >
                  {/* Timeline bullet */}
                  <span className="border-background bg-primary absolute top-4.5 -left-[27px] flex h-4 w-4 items-center justify-center rounded-full border-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                          {evt.startTime} - {evt.endTime} Wita
                        </span>
                        <h4 className="text-foreground text-sm font-semibold">
                          {evt.segmentTitle}
                        </h4>
                      </div>

                      <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {evt.location}
                          </span>
                        )}
                        {evt.personInCharge && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            PIC: {evt.personInCharge}
                          </span>
                        )}
                      </div>

                      {evt.notes && (
                        <p className="text-muted-foreground/90 mt-1.5 text-xs italic">
                          &ldquo;{evt.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="hover:text-destructive text-muted-foreground h-8 w-8 self-end p-0 sm:self-start"
                        title="Hapus segmen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Segment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-card w-full max-w-lg rounded-2xl border p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-foreground text-lg font-bold">
                Tambah Segmen Rundown
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddEvent} className="space-y-4">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="segmentTitle">
                    Nama Kegiatan / Agenda *
                  </FieldLabel>
                  <Input
                    id="segmentTitle"
                    value={segmentTitle}
                    onChange={(e) => setSegmentTitle(e.target.value)}
                    placeholder="Contoh: Natab Prayascita & Ayaban"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="startTime">Waktu Mulai *</FieldLabel>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="endTime">Waktu Selesai *</FieldLabel>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="location">Lokasi Spesifik</FieldLabel>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Contoh: Bale Dangin / Natah"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="personInCharge">
                      Penanggung Jawab (PIC)
                    </FieldLabel>
                    <Input
                      id="personInCharge"
                      value={personInCharge}
                      onChange={(e) => setPersonInCharge(e.target.value)}
                      placeholder="Contoh: Jero Mangku / Serati"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="notes">
                    Catatan & Kebutuhan Khusus
                  </FieldLabel>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Peralatan yang perlu siap, busana saksi, atau panduan tata tertib..."
                    rows={2}
                  />
                </Field>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Tambah ke Rundown"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
