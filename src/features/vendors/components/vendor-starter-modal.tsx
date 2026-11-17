"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Sparkles, CheckSquare, Square } from "lucide-react";
import { STARTER_VENDOR_TEMPLATES, getCategoryInfo } from "../seeds";
import { importStarterVendorsAction } from "../actions";

interface VendorStarterModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isPreview?: boolean;
  onPreviewUpgrade?: () => void;
}

export function VendorStarterModal({
  weddingId,
  isOpen,
  onClose,
  onSuccess,
  isPreview,
  onPreviewUpgrade,
}: VendorStarterModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    STARTER_VENDOR_TEMPLATES.map((t) => t.id)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === STARTER_VENDOR_TEMPLATES.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(STARTER_VENDOR_TEMPLATES.map((t) => t.id));
    }
  };

  const handleImport = () => {
    if (selectedIds.length === 0) return;
    if (isPreview && onPreviewUpgrade) {
      onPreviewUpgrade();
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await importStarterVendorsAction(weddingId, selectedIds);
      if (!res.success) {
        setError(res.error || "Gagal mengimpor rekomendasi rekanan.");
        return;
      }
      onSuccess();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="bg-card border-border/80 flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-starter-title"
      >
        {/* Metronic Header */}
        <div className="px-6 py-4 border-b border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-white dark:bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="vendor-starter-title"
                className="text-[#18181b] dark:text-foreground text-lg font-bold"
              >
                Rekomendasi Rekanan Pernikahan Adat Bali
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Pilih pos rekanan pokok pawiwahan Bali untuk ditambahkan ke daftar workspace Anda
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="h-7 text-xs"
          >
            {selectedIds.length === STARTER_VENDOR_TEMPLATES.length ? (
              <>
                <CheckSquare className="text-primary mr-1.5 h-3.5 w-3.5" />
                Batal Pilih Semua
              </>
            ) : (
              <>
                <Square className="text-muted-foreground mr-1.5 h-3.5 w-3.5" />
                Pilih Semua ({STARTER_VENDOR_TEMPLATES.length})
              </>
            )}
          </Button>

          <span className="text-muted-foreground text-xs">
            <strong className="text-foreground">{selectedIds.length}</strong> rekanan terpilih
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs mb-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STARTER_VENDOR_TEMPLATES.map((tpl) => {
              const isSelected = selectedIds.includes(tpl.id);
              const catInfo = getCategoryInfo(tpl.category);

              return (
                <div
                  key={tpl.id}
                  onClick={() => toggleTemplate(tpl.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-primary/60 bg-primary/5 shadow-xs"
                      : "border-border/60 hover:border-border bg-card opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${catInfo.badgeClass}`}
                      >
                        {catInfo.name}
                      </Badge>
                      <h4 className="text-foreground text-sm font-semibold">
                        {tpl.name}
                      </h4>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="text-primary mt-1 h-4 w-4 shrink-0" />
                    ) : (
                      <Square className="text-muted-foreground mt-1 h-4 w-4 shrink-0" />
                    )}
                  </div>

                  <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed">
                    {tpl.recommendedScope}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t border-[#f0f0f4] dark:border-border/40 pt-2 text-[11px]">
                    <span className="text-muted-foreground">
                      Perkiraan Range:
                    </span>
                    <span className="text-foreground font-medium">
                      {tpl.estimatedQuoteRange}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metronic Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-[#fbfbfd] dark:bg-card">
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} rekanan akan ditambahkan ke direktori
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
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Tambahkan {selectedIds.length} Rekanan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
