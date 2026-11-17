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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="bg-card border-border/80 flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-template-picker-title"
      >
        {/* Metronic Header */}
        <div className="px-6 py-4 border-b border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-white dark:bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="task-template-picker-title"
                className="text-[#18181b] dark:text-foreground text-lg font-bold"
              >
                Rekomendasi Tugas & Checklist Pawiwahan Bali
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Pilihan daftar tugas adat, administrasi negara, logistik tratag, dan konsumsi mebat
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

        {/* Subheader / Selection Controls */}
        <div className="px-6 py-2.5 border-b border-[#f0f0f4] dark:border-border/60 bg-[#f9f9fb] dark:bg-muted/20 flex items-center justify-between shrink-0 text-xs">
          <span className="text-muted-foreground">
            Terpilih: <strong className="text-foreground">{selectedIds.length}</strong> dari {STARTER_TASK_TEMPLATES.length} tugas rekomendasi
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {error && (
            <div className="bg-destructive/15 text-destructive border-destructive/20 rounded-lg border p-3 text-xs mb-3">
              {error}
            </div>
          )}

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

        {/* Metronic Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-[#fbfbfd] dark:bg-card">
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} tugas akan ditambahkan ke checklist
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
              type="button"
              size="sm"
              onClick={handleImport}
              disabled={isPending || selectedIds.length === 0}
              className="text-xs"
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Impor {selectedIds.length} Tugas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
