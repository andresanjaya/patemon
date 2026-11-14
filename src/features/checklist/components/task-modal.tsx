"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { createTaskAction, updateTaskAction } from "../actions";
import { CATEGORY_OPTIONS } from "../seeds";
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
  onSuccess: (task: WeddingTask, isEdit: boolean) => void;
}

export function TaskModal({
  weddingId,
  isOpen,
  onClose,
  taskToEdit,
  ceremonyOptions,
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
  const [assigneeName, setAssigneeName] = useState(
    taskToEdit?.assigneeName || ""
  );
  const [ceremonyId, setCeremonyId] = useState<string>(
    taskToEdit?.ceremonyId || ""
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
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
            assigneeName: assigneeName.trim() || null,
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
            assigneeName: assigneeName.trim() || undefined,
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-pic">Penanggung Jawab (PIC / Tim)</Label>
              <Input
                id="task-pic"
                placeholder="Contoh: Paman Ketut / Bli Putu / Serati"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
              />
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
