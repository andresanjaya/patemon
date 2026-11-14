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
}

export function VendorStarterModal({
  weddingId,
  isOpen,
  onClose,
  onSuccess,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-background border-border relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            <div>
              <h2 className="text-foreground text-lg font-bold">
                Rekomendasi Rekanan Pernikahan Adat Bali
              </h2>
              <p className="text-muted-foreground text-xs">
                Pilih pos rekanan pokok pawiwahan Bali untuk ditambahkan ke
                daftar workspace Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        <div className="mb-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className="text-xs"
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
            {selectedIds.length} rekanan terpilih
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STARTER_VENDOR_TEMPLATES.map((tpl) => {
            const isSelected = selectedIds.includes(tpl.id);
            const catInfo = getCategoryInfo(tpl.category);

            return (
              <div
                key={tpl.id}
                onClick={() => toggleTemplate(tpl.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  isSelected
                    ? "border-primary/60 bg-primary/5 shadow-xs"
                    : "border-border/60 hover:border-border bg-card/60 opacity-70"
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
                    <h3 className="text-foreground text-sm font-semibold">
                      {tpl.name}
                    </h3>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="text-primary mt-1 h-4 w-4 shrink-0" />
                  ) : (
                    <Square className="text-muted-foreground mt-1 h-4 w-4 shrink-0" />
                  )}
                </div>

                <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                  {tpl.recommendedScope}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t pt-2 text-[11px]">
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

        <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
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
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengimpor...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Tambahkan {selectedIds.length} Rekanan Terpilih
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
