"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarHeart,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProvenanceBadge } from "./provenance-badge";
import {
  updateCeremonyDetailsAction,
  updateCeremonyStatusAction,
  deleteCeremonyAction,
} from "../actions";
import type { CeremonyDetail, WeddingCeremony } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CeremonyDetailHeaderProps {
  weddingId: string;
  ceremony: CeremonyDetail;
  userRole: WorkspaceRole;
}

export function CeremonyDetailHeader({
  weddingId,
  ceremony,
  userRole,
}: CeremonyDetailHeaderProps) {
  const router = useRouter();
  const canEdit = userRole === "owner" || userRole === "editor";

  const [status, setStatus] = useState<WeddingCeremony["status"]>(
    ceremony.status
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState(ceremony.title);
  const [editPhase, setEditPhase] = useState(ceremony.phase || "Puncak Acara");
  const [editDate, setEditDate] = useState(ceremony.scheduledDate || "");
  const [editStartTime, setEditStartTime] = useState(ceremony.startTime || "");
  const [editEndTime, setEditEndTime] = useState(ceremony.endTime || "");
  const [editLocation, setEditLocation] = useState(ceremony.location || "");
  const [editPic, setEditPic] = useState(ceremony.personInCharge || "");
  const [editNotes, setEditNotes] = useState(ceremony.customNotes || "");

  const handleStatusChange = async (newStatus: WeddingCeremony["status"]) => {
    if (!canEdit) return;
    setStatus(newStatus);
    await updateCeremonyStatusAction(ceremony.id, weddingId, newStatus);
    router.refresh();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!editTitle.trim()) {
      setErrorMsg("Nama upacara wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const res = await updateCeremonyDetailsAction(weddingId, ceremony.id, {
      title: editTitle,
      phase: editPhase,
      scheduledDate: editDate || null,
      startTime: editStartTime || null,
      endTime: editEndTime || null,
      location: editLocation || null,
      personInCharge: editPic || null,
      customNotes: editNotes || null,
      status,
    });

    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || "Gagal menyimpan perubahan.");
    } else {
      setIsEditing(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    setLoading(true);
    const res = await deleteCeremonyAction(weddingId, ceremony.id);
    setLoading(false);
    if (res.success) {
      router.push(`/workspace/${weddingId}/ceremonies`);
    } else {
      setErrorMsg(res.message || "Gagal menghapus upacara.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 px-2">
          <Link href={`/workspace/${weddingId}/ceremonies`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Upacara</span>
          </Link>
        </Button>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Detail</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleting(true)}
              className="hover:text-destructive text-muted-foreground gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Ceremony Card */}
      <div className="border-border bg-card rounded-2xl border p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-primary border-primary/30"
              >
                Fase {ceremony.phase || "Puncak Acara"}
              </Badge>
              {ceremony.template && (
                <ProvenanceBadge
                  status={ceremony.template.validationStatus}
                  sourceUrl={ceremony.template.sourceUrl}
                />
              )}
            </div>

            <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
              {ceremony.title}
            </h1>

            {ceremony.template?.description && (
              <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                {ceremony.template.description}
              </p>
            )}
          </div>

          {/* Status Switcher */}
          <div className="bg-muted/40 border-border/80 flex flex-col gap-1.5 rounded-xl border p-3 md:min-w-[200px]">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Status Persiapan
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "draft", label: "Draft" },
                  { key: "confirmed", label: "Terkonfirmasi" },
                  { key: "completed", label: "Selesai" },
                  { key: "skipped", label: "Dilewati" },
                ] as const
              ).map((st) => (
                <button
                  key={st.key}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleStatusChange(st.key)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    status === st.key
                      ? st.key === "completed"
                        ? "bg-emerald-600 text-white"
                        : st.key === "confirmed"
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/15 text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  } ${!canEdit ? "cursor-default opacity-80" : "cursor-pointer"}`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule & Metadata Grid */}
        <div className="border-border/60 mt-6 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground text-xs">
                Jadwal Acara
              </span>
              <p className="text-foreground text-sm font-semibold">
                {ceremony.scheduledDate
                  ? new Date(ceremony.scheduledDate).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : "Tanggal belum diset"}
              </p>
              {(ceremony.startTime || ceremony.endTime) && (
                <p className="text-muted-foreground text-xs">
                  {ceremony.startTime || "--:--"} s/d{" "}
                  {ceremony.endTime || "Selesai"} Wita
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground text-xs">
                Lokasi Upacara
              </span>
              <p className="text-foreground text-sm font-semibold">
                {ceremony.location || "Lokasi belum ditentukan"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <User className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground text-xs">
                Penanggung Jawab (PIC)
              </span>
              <p className="text-foreground text-sm font-semibold">
                {ceremony.personInCharge || "Belum ditugaskan"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <CalendarHeart className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground text-xs">
                Urutan Acara
              </span>
              <p className="text-foreground text-sm font-semibold">
                Prosesi ke-{ceremony.orderIndex}
              </p>
            </div>
          </div>
        </div>

        {/* Custom Notes / Reminders */}
        {ceremony.customNotes && (
          <div className="bg-muted/30 border-border/60 mt-4 rounded-xl border p-3.5 text-xs">
            <span className="text-foreground font-semibold">
              Catatan Adat & Keluarga:{" "}
            </span>
            <span className="text-muted-foreground">
              {ceremony.customNotes}
            </span>
          </div>
        )}

        {/* Conditional ceremony notice */}
        {ceremony.template?.validationStatus.includes("Perlu validasi") && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">Catatan Dresta / Adat Fleksibel</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                Prosesi ini bergantung pada rembug dua keluarga, dresta banjar
                setempat, dan arahan pemangku/serati. Diskusikan kepastiannya
                dalam rapat keluarga.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-foreground text-lg font-bold">
                Edit Detail Upacara
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
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

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Nama Upacara *</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Contoh: Mebyakala / Pabyakalaan"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phase">Fase Acara</Label>
                  <select
                    id="phase"
                    value={editPhase}
                    onChange={(e) => setEditPhase(e.target.value)}
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="Persiapan">Persiapan</option>
                    <option value="Puncak Acara">Puncak Acara</option>
                    <option value="Pasca Pawiwahan">Pasca Pawiwahan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date">Tanggal Upacara</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Waktu Mulai</Label>
                  <Input
                    id="start"
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">Waktu Selesai</Label>
                  <Input
                    id="end"
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="loc">Lokasi</Label>
                  <Input
                    id="loc"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Contoh: Merajan Gede Purusa"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pic">Penanggung Jawab (PIC)</Label>
                  <Input
                    id="pic"
                    value={editPic}
                    onChange={(e) => setEditPic(e.target.value)}
                    placeholder="Contoh: Jero Mangku / Tetua Keluarga"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Catatan & Ketentuan Khusus</Label>
                <Textarea
                  id="notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Instruksi busana, perlengkapan sembahyang, atau catatan keluarga..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-xl">
            <h3 className="text-foreground text-lg font-bold">
              Hapus Prosesi Upacara?
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{ceremony.title}</strong> dari susunan rencana upacara?
              Tindakan ini dapat dibatalkan melalui pengaturan.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleting(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Menghapus..." : "Ya, Hapus Prosesi"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
