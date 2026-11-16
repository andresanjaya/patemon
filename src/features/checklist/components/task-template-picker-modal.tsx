"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Clock,
  User,
  ExternalLink,
  CheckCheck,
  X,
} from "lucide-react";
import {
  STARTER_TASK_TEMPLATES,
  getCategoryLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
} from "../seeds";
import { importStarterTasksAction } from "../actions";

interface TaskTemplatePickerModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isPreview?: boolean;
  onPreviewUpgrade?: () => void;
}

export function TaskTemplatePickerModal({
  weddingId,
  isOpen,
  onClose,
  onSuccess,
  isPreview,
  onPreviewUpgrade,
}: TaskTemplatePickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    STARTER_TASK_TEMPLATES.map((t) => t.id)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === STARTER_TASK_TEMPLATES.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(STARTER_TASK_TEMPLATES.map((t) => t.id));
    }
  };

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleImport = () => {
    if (selectedIds.length === 0) {
      setError("Pilih minimal satu rekomendasi tugas untuk diimpor.");
      return;
    }

    if (isPreview && onPreviewUpgrade) {
      onPreviewUpgrade();
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await importStarterTasksAction(weddingId, selectedIds);
        if (!res.success) {
          setError(res.error || "Gagal mengimpor daftar tugas.");
          return;
        }

        onSuccess();
        onClose();
      } catch {
        setError("Terjadi kesalahan sistem saat mengimpor tugas.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="border-border bg-card flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-template-picker-title"
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              <h3
                id="task-template-picker-title"
                className="text-foreground text-lg font-bold"
              >
                Rekomendasi Tugas & Checklist Pawiwahan Bali
              </h3>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Pilihan daftar tugas adat, administrasi negara, logistik tratag,
              dan konsumsi mebat sesuai panduan dresta dan kepustakaan Hindu
              Bali.
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

        <div className="flex items-center justify-between border-b py-2 text-xs">
          <span className="text-muted-foreground">
            Terpilih: <strong>{selectedIds.length}</strong> dari{" "}
            {STARTER_TASK_TEMPLATES.length} tugas rekomendasi
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
            className="h-7 text-xs"
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            {selectedIds.length === STARTER_TASK_TEMPLATES.length
              ? "Batalkan Semua"
              : "Pilih Semua"}
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto py-3 pr-1">
          {STARTER_TASK_TEMPLATES.map((tpl) => {
            const isSelected = selectedIds.includes(tpl.id);
            return (
              <div
                key={tpl.id}
                onClick={() => toggleId(tpl.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  isSelected
                    ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleId(tpl.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="border-border text-primary focus:ring-primary mt-1 h-4 w-4 rounded"
                />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground text-sm leading-tight font-semibold">
                      {tpl.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 text-[10px] font-normal"
                    >
                      {getCategoryLabel(tpl.category)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`h-5 border text-[10px] font-medium ${getPriorityBadgeClass(
                        tpl.priority
                      )}`}
                    >
                      {getPriorityLabel(tpl.priority)}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {tpl.notes}
                  </p>

                  <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tpl.targetTimeline} ({tpl.phase})
                    </span>
                    <span className="text-foreground/80 inline-flex items-center gap-1 font-medium">
                      <User className="text-primary h-3 w-3" />
                      PIC: {tpl.defaultPic}
                    </span>
                    {tpl.sourceUrl && (
                      <a
                        href={tpl.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary inline-flex items-center gap-0.5 hover:underline"
                      >
                        Sumber Adat <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
          <Button
            type="button"
            onClick={handleImport}
            disabled={isPending || selectedIds.length === 0}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Impor {selectedIds.length} Tugas ke Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}
