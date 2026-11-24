"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { ProvenanceBadge } from "@/features/ceremonies/components/provenance-badge";
import { importFromCatalogAction } from "../actions";
import type { RitualCatalogItem } from "../types";
import type { WeddingCeremony } from "@/features/ceremonies/types";

interface CatalogPickerModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  catalog: RitualCatalogItem[];
  ceremonies: WeddingCeremony[];
  isPreview?: boolean;
  onPreviewUpgrade?: () => void;
}

export function CatalogPickerModal({
  weddingId,
  isOpen,
  onClose,
  catalog,
  ceremonies,
}: CatalogPickerModalProps) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetCeremonyId, setTargetCeremonyId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredCatalog.map((c) => c.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const filteredCatalog = catalog.filter((item) => {
    const matchesType = typeFilter === "Semua" || item.itemType === typeFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.usedInPhase &&
        item.usedInPhase.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes &&
        item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg("Pilih minimal 1 banten dari pustaka katalog.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const res = await importFromCatalogAction(
      weddingId,
      selectedIds,
      targetCeremonyId || null
    );

    setLoading(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setErrorMsg(res.message || "Gagal mengimpor banten.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-picker-title"
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <BookOpen className="text-primary h-5 w-5" />
              <h3 id="catalog-picker-title" className="text-foreground text-lg font-bold">
                Pilih dari Katalog Pustaka Banten
              </h3>
            </div>
            <p className="text-muted-foreground text-xs">
              Pilih banten bersumber pustaka adat resmi untuk ditambahkan ke
              daftar rencana.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters and Search Subheader */}
        <div className="dark:border-border/60 dark:bg-muted/20 shrink-0 border-b border-[#f0f0f4] bg-[#f9f9fb] px-6 py-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Cari nama banten atau sarana..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>

            {/* Kategori Filter + Select All */}
            <div className="flex shrink-0 items-center gap-2">
              <NativeSelect
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border-input bg-background text-foreground h-9 w-[150px] rounded-md border px-2.5 text-xs"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Paket Banten">Paket Banten</option>
                <option value="Banten Satuan">Banten Satuan</option>
                <option value="Sarana Upakara">Sarana Upakara</option>
              </NativeSelect>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="h-9 px-2 text-xs font-medium text-amber-700 hover:text-amber-800"
              >
                Pilih Semua
              </Button>
              {selectedIds.length > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="h-9 px-2 text-xs text-muted-foreground"
                  >
                    Batal Pilih ({selectedIds.length})
                  </Button>
                </>
              )}
            </div>

            {/* Target Ceremony Assignment */}
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-semibold whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                Prosesi:
              </span>
              <NativeSelect
                id="targetCeremony"
                value={targetCeremonyId}
                onChange={(e) => setTargetCeremonyId(e.target.value)}
                className="border-input bg-background text-foreground h-9 w-[220px] truncate rounded-md border px-2.5 text-xs"
              >
                <option value="">Kebutuhan Umum</option>
                {ceremonies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 text-destructive mx-4 mt-3 rounded-lg p-3 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Catalog Item List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {filteredCatalog.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`border-border flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 shadow-xs transition-all ${isSelected
                  ? "border-primary bg-primary/5 ring-primary/40 ring-1"
                  : "bg-card hover:border-primary/30"
                  }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground/40 bg-background"
                    }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-foreground text-sm font-semibold">
                      {item.name}
                    </h4>
                    <Badge variant="outline" className="text-[10px]">
                      {item.itemType}
                    </Badge>
                    <ProvenanceBadge
                      status={item.validationStatus}
                      sourceUrl={item.sourceUrl}
                    />
                  </div>

                  {item.notes && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {item.notes}
                    </p>
                  )}

                  <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                    {item.usedInPhase && (
                      <span>Digunakan saat: {item.usedInPhase}</span>
                    )}
                    <span>·</span>
                    <span>
                      Rekomendasi: {item.defaultQuantity || 1} {item.unit}
                    </span>
                    <span>·</span>
                    <span className="text-foreground font-medium">
                      Penyedia: {item.defaultProvider || "Beli Serati"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-border flex items-center justify-between border-t px-6 py-3.5">
          <span className="text-muted-foreground text-xs">
            {selectedIds.length} item banten terpilih
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleImport}
              disabled={loading || selectedIds.length === 0}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>
                {loading
                  ? "Menambahkan..."
                  : `Tambahkan ${selectedIds.length} Banten`}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
