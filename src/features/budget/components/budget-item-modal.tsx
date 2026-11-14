"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { createBudgetItemAction, updateBudgetItemAction } from "../actions";
import { BUDGET_CATEGORIES } from "../seeds";
import { formatRupiah } from "@/features/workspaces/validation";
import type { BudgetItem, BudgetItemStatus } from "../types";

interface BudgetItemModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: BudgetItem | null;
  onSuccess: (item: BudgetItem, isEdit: boolean) => void;
}

export function BudgetItemModal({
  weddingId,
  isOpen,
  onClose,
  itemToEdit,
  onSuccess,
}: BudgetItemModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(itemToEdit?.title || "");
  const [category, setCategory] = useState(itemToEdit?.category || "upakara");
  const [unit, setUnit] = useState(itemToEdit?.unit || "Paket");
  const [quantity, setQuantity] = useState(itemToEdit?.quantity || 1);
  const [unitPrice, setUnitPrice] = useState(itemToEdit?.unitPrice || 0);
  const [plannedAmount, setPlannedAmount] = useState(
    itemToEdit?.plannedAmount || 0
  );
  const [actualAmount, setActualAmount] = useState(
    itemToEdit?.actualAmount || 0
  );
  const [paidBy, setPaidBy] = useState(
    itemToEdit?.paidBy || "Bersama (Kedua Mempelai)"
  );
  const [status, setStatus] = useState<BudgetItemStatus>(
    itemToEdit?.status || "estimated"
  );
  const [notes, setNotes] = useState(itemToEdit?.notes || "");

  if (!isOpen) return null;

  const handlePriceChange = (newUnitPrice: number) => {
    setUnitPrice(newUnitPrice);
    const calculated = Math.round(quantity * newUnitPrice);
    setPlannedAmount(calculated);
    if (!itemToEdit || actualAmount === 0) {
      setActualAmount(calculated);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    const calculated = Math.round(newQty * unitPrice);
    setPlannedAmount(calculated);
    if (!itemToEdit || actualAmount === 0) {
      setActualAmount(calculated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Nama rincian pengeluaran wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        if (itemToEdit) {
          const res = await updateBudgetItemAction(weddingId, itemToEdit.id, {
            title: title.trim(),
            category,
            unit: unit.trim() || null,
            quantity: Number(quantity) || 1,
            unitPrice: Number(unitPrice) || 0,
            plannedAmount: Number(plannedAmount) || 0,
            actualAmount: Number(actualAmount) || 0,
            paidBy: paidBy.trim() || null,
            status,
            notes: notes.trim() || null,
          });

          if (!res.success || !res.item) {
            setError(res.error || "Gagal memperbarui rincian anggaran.");
            return;
          }

          onSuccess(res.item, true);
          onClose();
        } else {
          const res = await createBudgetItemAction(weddingId, {
            title: title.trim(),
            category,
            unit: unit.trim() || "Paket",
            quantity: Number(quantity) || 1,
            unitPrice: Number(unitPrice) || 0,
            plannedAmount: Number(plannedAmount) || 0,
            actualAmount: Number(actualAmount) || 0,
            paidBy: paidBy.trim() || "Bersama (Kedua Mempelai)",
            status,
            notes: notes.trim() || undefined,
          });

          if (!res.success || !res.item) {
            setError(res.error || "Gagal membuat rincian anggaran baru.");
            return;
          }

          onSuccess(res.item, false);
          onClose();
        }
      } catch {
        setError("Terjadi kesalahan sistem saat menyimpan data anggaran.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="border-border bg-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3">
          <div>
            <h3 className="text-foreground text-lg font-bold">
              {itemToEdit
                ? "Ubah Rincian Pengeluaran"
                : "Tambah Rincian Anggaran"}
            </h3>
            <p className="text-muted-foreground text-xs">
              Catat pos pengeluaran pawiwahan dalam integer IDR tanpa pembulatan
              desimal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <Label htmlFor="bg-title">
              Uraian Pengeluaran <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bg-title"
              placeholder="Contoh: Paket Pokok Banten Pawiwahan (Mebyakala & Mesakapan)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bg-category">Kategori Pengeluaran</Label>
              <select
                id="bg-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                {BUDGET_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bg-status">Status Kesepakatan</Label>
              <select
                id="bg-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BudgetItemStatus)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="estimated">Estimasi Awal</option>
                <option value="booked">Dipesan / Deal</option>
                <option value="paid_partial">DP / Cicilan</option>
                <option value="paid_full">Lunas</option>
                <option value="canceled">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bg-qty">Jumlah (Qty)</Label>
              <Input
                id="bg-qty"
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bg-unit">Satuan</Label>
              <Input
                id="bg-unit"
                placeholder="Paket / Porsi / Ekor"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bg-price">Harga Satuan (IDR)</Label>
              <Input
                id="bg-price"
                type="number"
                min="0"
                step="1000"
                value={unitPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bg-planned">
                Rencana Biaya ({formatRupiah(plannedAmount)})
              </Label>
              <Input
                id="bg-planned"
                type="number"
                min="0"
                step="1000"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bg-actual">
                Realisasi / Kontrak Vendor ({formatRupiah(actualAmount)})
              </Label>
              <Input
                id="bg-actual"
                type="number"
                min="0"
                step="1000"
                value={actualAmount}
                onChange={(e) => setActualAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bg-paidby">
              Penanggung Jawab / Sumber Alokasi Dana
            </Label>
            <Input
              id="bg-paidby"
              placeholder="Contoh: Bersama (Kedua Mempelai) / Keluarga Purusa / Keluarga Pradana"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bg-notes">Catatan & Rincian Tambahan</Label>
            <Textarea
              id="bg-notes"
              placeholder="Catatan rekening, kontak serati/vendor, nomor pesanan, dll..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              {itemToEdit ? "Simpan Perubahan" : "Tambah Anggaran"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
