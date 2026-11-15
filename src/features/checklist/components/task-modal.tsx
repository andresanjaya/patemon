"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, User, UserCheck, HelpCircle } from "lucide-react";
import { createTaskAction, updateTaskAction } from "../actions";
import { CATEGORY_OPTIONS } from "../seeds";
import type { WorkspaceMember } from "@/features/members/types";
import type {
  WeddingTask,
  TaskPriority,
  TaskStatus,
  CeremonyOption,
} from "../types";

interface TaskModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: WeddingTask | null;
  ceremonyOptions: CeremonyOption[];
  members?: WorkspaceMember[];
  onSuccess: (task: WeddingTask, isEdit: boolean) => void;
}

export function TaskModal({
  weddingId,
  isOpen,
  onClose,
  taskToEdit,
  ceremonyOptions,
  members = [],
  onSuccess,
}: TaskModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(taskToEdit?.title || "");
  const [description, setDescription] = useState(taskToEdit?.description || "");
  const [category, setCategory] = useState(taskToEdit?.category || "adat");
  const [priority, setPriority] = useState<TaskPriority>(
    taskToEdit?.priority || "medium"
  );
  const [status, setStatus] = useState<TaskStatus>(
    taskToEdit?.status || "todo"
  );
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || "");

  // PIC Assignment State
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.status === "active" && Boolean(m.userId));
  }, [members]);

  const initialAssignmentMode = (): "member" | "external" | "unassigned" => {
    if (taskToEdit?.assignedToUserId) return "member";
    if (taskToEdit?.assigneeName) return "external";
    return activeMembers.length > 0 ? "member" : "unassigned";
  };

  const [assignmentMode, setAssignmentMode] = useState<
    "member" | "external" | "unassigned"
  >(initialAssignmentMode);
  const [assignedToUserId, setAssignedToUserId] = useState<string>(
    taskToEdit?.assignedToUserId || ""
  );
  const [assigneeName, setAssigneeName] = useState<string>(
    taskToEdit?.assigneeName || ""
  );

  const [ceremonyId, setCeremonyId] = useState<string>(
    taskToEdit?.ceremonyId || ""
  );

  if (!isOpen) return null;

  const handleMemberSelect = (selectedUserId: string) => {
    setAssignedToUserId(selectedUserId);
    if (!selectedUserId) {
      setAssigneeName("");
      return;
    }
    const found = activeMembers.find((m) => m.userId === selectedUserId);
    if (found) {
      const name =
        found.profile?.fullName || found.profile?.email || found.invitedEmail;
      setAssigneeName(name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
      return;
    }

    const finalAssignedToUserId =
      assignmentMode === "member" && assignedToUserId ? assignedToUserId : null;
    const finalAssigneeName =
      assignmentMode === "unassigned"
        ? null
        : assigneeName.trim()
          ? assigneeName.trim()
          : null;

    if (assignmentMode === "member" && !finalAssignedToUserId) {
      setError(
        "Pilih anggota ruang kerja yang ditugaskan atau pilih mode PIC Eksternal."
      );
      return;
    }

    startTransition(async () => {
      try {
        if (taskToEdit) {
          const res = await updateTaskAction(weddingId, taskToEdit.id, {
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            priority,
            status,
            dueDate: dueDate || null,
            assignedToUserId: finalAssignedToUserId,
            assigneeName: finalAssigneeName,
            ceremonyId: ceremonyId ? ceremonyId : null,
          });

          if (!res.success || !res.task) {
            setError(res.error || "Gagal memperbarui tugas.");
            return;
          }

          onSuccess(res.task, true);
          onClose();
        } else {
          const res = await createTaskAction(weddingId, {
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            priority,
            status,
            dueDate: dueDate || undefined,
            assignedToUserId: finalAssignedToUserId,
            assigneeName: finalAssigneeName || undefined,
            ceremonyId: ceremonyId ? ceremonyId : undefined,
          });

          if (!res.success || !res.task) {
            setError(res.error || "Gagal membuat tugas baru.");
            return;
          }

          onSuccess(res.task, false);
          onClose();
        }
      } catch {
        setError("Terjadi kesalahan sistem saat menyimpan tugas.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="border-border bg-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3
              id="task-modal-title"
              className="text-foreground text-lg font-bold"
            >
              {taskToEdit ? "Ubah Tugas Pawiwahan" : "Tambah Tugas Baru"}
            </h3>
            <p className="text-muted-foreground text-xs">
              Catat tanggung jawab persiapan pawiwahan, tanggal batas, dan
              penanggung jawab keluarga.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive border-destructive/20 my-3 rounded-md border p-3 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">
              Judul Tugas <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="Contoh: Rembug penentuan Dewasa Ayu dengan Sulinggih"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Keterangan / Detail Persiapan</Label>
            <Textarea
              id="task-desc"
              placeholder="Catatan rincian, hal-hal yang perlu disiapkan, nomor kontak, dll..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-category">Kategori Tugas</Label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Prioritas</Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="urgent">Mendesak (Urgent)</option>
                <option value="high">Tinggi (High)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="low">Rendah (Low)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-status">Status Pengerjaan</Label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="todo">Belum Mulai</option>
                <option value="in_progress">Dalam Proses</option>
                <option value="done">Selesai</option>
                <option value="canceled">Dibatalkan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due-date">
                Tenggat Waktu (Batas Tanggal)
              </Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="border-border/70 bg-muted/20 space-y-3 rounded-xl border p-3 sm:p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-sm font-semibold">
                Penanggung Jawab (PIC Assignment)
              </Label>
              <div className="border-border bg-background inline-flex rounded-lg border p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode("member");
                    if (activeMembers.length > 0 && !assignedToUserId) {
                      handleMemberSelect(activeMembers[0].userId || "");
                    }
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                    assignmentMode === "member"
                      ? "bg-primary text-primary-foreground font-medium shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Anggota Tim</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode("external");
                    setAssignedToUserId("");
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                    assignmentMode === "external"
                      ? "bg-primary text-primary-foreground font-medium shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>PIC Eksternal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode("unassigned");
                    setAssignedToUserId("");
                    setAssigneeName("");
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                    assignmentMode === "unassigned"
                      ? "bg-primary text-primary-foreground font-medium shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Belum Ada</span>
                </button>
              </div>
            </div>

            {assignmentMode === "member" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="task-member-select"
                  className="text-muted-foreground text-xs"
                >
                  Pilih Anggota Aktif Workspace
                </Label>
                {activeMembers.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Belum ada anggota keluarga aktif yang bergabung. Anda dapat
                    menggunakan pilihan PIC Eksternal atau mengundang anggota
                    terlebih dahulu di Pengaturan.
                  </p>
                ) : (
                  <select
                    id="task-member-select"
                    value={assignedToUserId}
                    onChange={(e) => handleMemberSelect(e.target.value)}
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="">-- Pilih Anggota Keluarga / Tim --</option>
                    {activeMembers.map((m) => (
                      <option key={m.id} value={m.userId || ""}>
                        {m.profile?.fullName || m.invitedEmail} (
                        {m.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}
                {taskToEdit?.assignedToUserId &&
                  !activeMembers.some(
                    (m) => m.userId === taskToEdit.assignedToUserId
                  ) && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      Penanggung jawab sebelumnya (
                      {taskToEdit.assigneeName || "Anggota"}) sudah tidak aktif
                      atau dicabut dari workspace ini.
                    </p>
                  )}
              </div>
            )}

            {assignmentMode === "external" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="task-pic"
                  className="text-muted-foreground text-xs"
                >
                  Nama PIC / Tim Eksternal (tanpa akun Patemon)
                </Label>
                <Input
                  id="task-pic"
                  placeholder="Contoh: Paman Ketut / Bli Putu / Serati Banten"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                />
                <p className="text-muted-foreground text-[11px]">
                  Nama akan tersimpan secara historis untuk koordinasi lapangan,
                  namun tidak terhubung ke menu Tugas Saya akun manapun.
                </p>
              </div>
            )}

            {assignmentMode === "unassigned" && (
              <p className="text-muted-foreground text-xs italic">
                Tugas ini akan berstatus &quot;Belum Ditugaskan&quot;. Anggota
                tim dapat mengambil alih atau Anda dapat menugaskannya nanti.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-ceremony">Kaitkan ke Prosesi Adat</Label>
            <select
              id="task-ceremony"
              value={ceremonyId}
              onChange={(e) => setCeremonyId(e.target.value)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">-- Tidak Terkait Prosesi Khusus --</option>
              {ceremonyOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {taskToEdit ? "Simpan Perubahan" : "Tambah Tugas"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
