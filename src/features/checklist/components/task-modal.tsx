"use client";

import { WorkspaceActionButton } from "@/features/workspaces/components/workspace-action-button";

import { useWorkspace } from "@/features/workspaces/context/workspace-context";

import { runAction, ActionAlert } from "@/components/ui/action-feedback";

import {
  FieldTitle,
  FieldLabel,
  FieldGroup,
  Field,
  FieldDescription,
} from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const workspaceCtx = useWorkspace();

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
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

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
          const res = await runAction(
            () =>
              updateTaskAction(weddingId, taskToEdit.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                category,
                priority,
                status,
                dueDate: dueDate || null,
                assignedToUserId: finalAssignedToUserId,
                assigneeName: finalAssigneeName,
                ceremonyId: ceremonyId ? ceremonyId : null,
                expectedUpdatedAt: taskToEdit.updatedAt,
              }),
            "Perubahan tugas berhasil disimpan.",
            setError
          );

          if (!res.success || !res.task) {
            setError(res.error || "Gagal memperbarui tugas.");
            return;
          }

          onSuccess(res.task, true);
          onClose();
        } else {
          const res = await runAction(
            () =>
              createTaskAction(weddingId, {
                title: title.trim(),
                description: description.trim() || undefined,
                category,
                priority,
                status,
                dueDate: dueDate || undefined,
                assignedToUserId: finalAssignedToUserId,
                assigneeName: finalAssigneeName || undefined,
                ceremonyId: ceremonyId ? ceremonyId : undefined,
              }),
            "Tugas baru berhasil ditambahkan.",
            setError
          );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        {/* Metronic Header */}
        <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div>
            <h3
              id="task-modal-title"
              className="dark:text-foreground text-lg font-bold text-[#18181b]"
            >
              {taskToEdit ? "Ubah Tugas Pawiwahan" : "Tambah Tugas Baru"}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Catat tanggung jawab persiapan pawiwahan, tanggal batas, dan
              penanggung jawab keluarga
            </p>
          </div>
          <Button
            variant="ghost"
            size={null}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Body: 2-Panel Metronic Layout */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <FieldGroup className="min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {error && <ActionAlert variant="destructive" message={error} />}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Panel (~2/3): Title, Description, PIC & Ceremony */}
                <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                  <Field>
                    <FieldLabel htmlFor="task-title" className="font-semibold">
                      Judul Tugas <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="task-title"
                      placeholder="Contoh: Rembug penentuan Dewasa Ayu dengan Sulinggih"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}

                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="task-desc" className="font-semibold">
                      Keterangan / Detail Persiapan
                    </FieldLabel>
                    <Textarea
                      id="task-desc"
                      placeholder="Catatan rincian, hal-hal yang perlu disiapkan, nomor kontak, dll..."
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="leading-relaxed"
                    />
                  </Field>

                  {/* PIC Assignment Card */}
                  <div className="dark:border-border/60 dark:bg-muted/20 space-y-3 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-4">
                    <Field className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <FieldTitle className="font-semibold">
                        Penanggung Jawab (PIC Assignment)
                      </FieldTitle>
                      <div className="border-border bg-background inline-flex rounded-lg border p-0.5 text-xs">
                        <Button
                          variant={
                            assignmentMode === "member" ? "default" : "ghost"
                          }
                          size={null}
                          type="button"
                          onClick={() => {
                            setAssignmentMode("member");
                            if (activeMembers.length > 0 && !assignedToUserId) {
                              handleMemberSelect(activeMembers[0].userId || "");
                            }
                          }}
                          aria-pressed={assignmentMode === "member"}
                          className="gap-1 rounded-md px-2.5 py-1 text-xs"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>Anggota Tim</span>
                        </Button>
                        <Button
                          variant={
                            assignmentMode === "external" ? "default" : "ghost"
                          }
                          size={null}
                          type="button"
                          onClick={() => {
                            setAssignmentMode("external");
                            setAssignedToUserId("");
                          }}
                          aria-pressed={assignmentMode === "external"}
                          className="gap-1 rounded-md px-2.5 py-1 text-xs"
                        >
                          <User className="h-3 w-3" />
                          <span>PIC Eksternal</span>
                        </Button>
                        <Button
                          variant={
                            assignmentMode === "unassigned"
                              ? "default"
                              : "ghost"
                          }
                          size={null}
                          type="button"
                          onClick={() => {
                            setAssignmentMode("unassigned");
                            setAssignedToUserId("");
                            setAssigneeName("");
                          }}
                          aria-pressed={assignmentMode === "unassigned"}
                          className="gap-1 rounded-md px-2.5 py-1 text-xs"
                        >
                          <HelpCircle className="h-3 w-3" />
                          <span>Belum Ada</span>
                        </Button>
                      </div>
                    </Field>

                    {assignmentMode === "member" && (
                      <Field className="pt-1">
                        <FieldLabel
                          htmlFor="task-member-select"
                          className="text-muted-foreground"
                        >
                          Pilih Anggota Aktif Workspace
                        </FieldLabel>
                        {activeMembers.length === 0 ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Belum ada anggota keluarga aktif yang bergabung.
                            Anda dapat menggunakan pilihan PIC Eksternal atau
                            mengundang anggota terlebih dahulu di Pengaturan.
                          </p>
                        ) : (
                          <NativeSelect
                            id="task-member-select"
                            value={assignedToUserId}
                            onChange={(e) => handleMemberSelect(e.target.value)}
                            className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                          >
                            <option value="">
                              -- Pilih Anggota Keluarga / Tim --
                            </option>
                            {activeMembers.map((m) => (
                              <option key={m.id} value={m.userId || ""}>
                                {m.profile?.fullName || m.invitedEmail} (
                                {m.role.toUpperCase()})
                              </option>
                            ))}
                          </NativeSelect>
                        )}
                        {taskToEdit?.assignedToUserId &&
                          !activeMembers.some(
                            (m) => m.userId === taskToEdit.assignedToUserId
                          ) && (
                            <p className="text-xs text-rose-600 dark:text-rose-400">
                              Penanggung jawab sebelumnya (
                              {taskToEdit.assigneeName || "Anggota"}) sudah
                              tidak aktif atau dicabut dari workspace ini.
                            </p>
                          )}
                      </Field>
                    )}

                    {assignmentMode === "external" && (
                      <Field className="pt-1">
                        <FieldLabel
                          htmlFor="task-pic"
                          className="text-muted-foreground"
                        >
                          Nama PIC / Tim Eksternal (tanpa akun Patemon)
                        </FieldLabel>
                        <Input
                          id="task-pic"
                          placeholder="Contoh: Paman Ketut / Bli Putu / Serati Banten"
                          value={assigneeName}
                          onChange={(e) => setAssigneeName(e.target.value)}
                        />
                        <FieldDescription className="text-muted-foreground">
                          Nama akan tersimpan secara historis untuk koordinasi
                          lapangan.
                        </FieldDescription>
                      </Field>
                    )}

                    {assignmentMode === "unassigned" && (
                      <p className="text-muted-foreground pt-1 text-xs italic">
                        Tugas ini akan berstatus &quot;Belum Ditugaskan&quot;.
                        Anggota tim dapat mengambil alih nanti.
                      </p>
                    )}
                  </div>

                  <Field>
                    <FieldLabel
                      htmlFor="task-ceremony"
                      className="font-semibold"
                    >
                      Kaitkan ke Prosesi Adat
                    </FieldLabel>
                    <NativeSelect
                      id="task-ceremony"
                      value={ceremonyId}
                      onChange={(e) => setCeremonyId(e.target.value)}
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      <option value="">
                        -- Tidak Terkait Prosesi Khusus --
                      </option>
                      {ceremonyOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>

                {/* Right Panel (~1/3): Category, Priority, Status, Due Date */}
                <div className="dark:lg:border-border/60 space-y-4 lg:col-span-5 lg:border-l lg:border-[#f0f0f4] lg:pl-6 xl:col-span-4">
                  <Field>
                    <FieldLabel
                      htmlFor="task-category"
                      className="font-semibold"
                    >
                      Kategori Tugas
                    </FieldLabel>
                    <NativeSelect
                      id="task-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <Field>
                    <FieldLabel
                      htmlFor="task-priority"
                      className="font-semibold"
                    >
                      Prioritas
                    </FieldLabel>
                    <NativeSelect
                      id="task-priority"
                      value={priority}
                      onChange={(e) =>
                        setPriority(e.target.value as TaskPriority)
                      }
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      <option value="urgent">Mendesak (Urgent)</option>
                      <option value="high">Tinggi (High)</option>
                      <option value="medium">Sedang (Medium)</option>
                      <option value="low">Rendah (Low)</option>
                    </NativeSelect>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="task-status" className="font-semibold">
                      Status Pengerjaan
                    </FieldLabel>
                    <NativeSelect
                      id="task-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      <option value="todo">Belum Mulai</option>
                      <option value="in_progress">Dalam Proses</option>
                      <option value="done">Selesai</option>
                      <option value="canceled">Dibatalkan</option>
                    </NativeSelect>
                  </Field>

                  <Field>
                    <FieldLabel
                      htmlFor="task-due-date"
                      className="font-semibold"
                    >
                      Tenggat Waktu (Batas Tanggal)
                    </FieldLabel>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </Field>

                  {/* Cultural Coordination Helper Card */}
                  <div className="dark:border-border/60 dark:bg-muted/20 space-y-2 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-3.5">
                    <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                      Pelacakan & Notifikasi
                    </span>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Tugas yang diberi tenggat waktu akan otomatis muncul pada
                      linimasa prioritas dashboard panitia untuk mencegah
                      keterlambatan ritual adat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Metronic Footer */}
            <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-t border-[#f0f0f4] bg-[#fbfbfd] px-6 py-3.5">
              <span className="text-muted-foreground text-xs">
                {taskToEdit
                  ? `ID: ${taskToEdit.id}`
                  : "Tugas baru akan ditambahkan ke checklist"}
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
                <WorkspaceActionButton
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs"
                >
                  {isPending && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  {taskToEdit ? "Simpan Perubahan" : "Tambah Tugas"}
                </WorkspaceActionButton>
              </div>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
