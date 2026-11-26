"use client";

import { WorkspaceActionButton } from "@/features/workspaces/components/workspace-action-button";

import { useWorkspace } from "@/features/workspaces/context/workspace-context";

import { runAction, ActionAlert } from "@/components/ui/action-feedback";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const workspaceCtx = useWorkspace();

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
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

    setError(null);

    if (!title.trim()) {
      setError("Nama rincian pengeluaran wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        if (itemToEdit) {
          const res = await runAction(
            () =>
              updateBudgetItemAction(weddingId, itemToEdit.id, {
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
                expectedUpdatedAt: itemToEdit.updatedAt,
              }),
            "Perubahan anggaran berhasil disimpan.",
            setError
          );

          if (!res.success || !res.item) {
            setError(res.error || "Gagal memperbarui rincian anggaran.");
            return;
          }

          onSuccess(res.item, true);
          onClose();
        } else {
          const res = await runAction(
            () =>
              createBudgetItemAction(weddingId, {
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
              }),
            "Rincian anggaran berhasil ditambahkan.",
            setError
          );

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

  const variance = actualAmount - plannedAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-item-modal-title"
      >
        {/* Metronic Header */}
        <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div>
            <h3
              id="budget-item-modal-title"
              className="dark:text-foreground text-lg font-bold text-[#18181b]"
            >
              {itemToEdit
                ? "Ubah Rincian Pengeluaran"
                : "Tambah Rincian Anggaran"}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Catat pos pengeluaran pawiwahan dalam integer IDR tanpa pembulatan
              desimal
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
                {/* Left Panel (~2/3): Title, Category, Qty, Unit, UnitPrice, PaidBy, Notes */}
                <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                  <Field>
                    <FieldLabel htmlFor="bg-title" className="font-semibold">
                      Uraian Pengeluaran{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="bg-title"
                      placeholder="Contoh: Paket Pokok Banten Pawiwahan (Mebyakala & Mesakapan)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}

                      required
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel
                        htmlFor="bg-category"
                        className="font-semibold"
                      >
                        Kategori Pengeluaran
                      </FieldLabel>
                      <NativeSelect
                        id="bg-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                      >
                        {BUDGET_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="bg-paidby" className="font-semibold">
                        Penanggung Jawab / Sumber Alokasi
                      </FieldLabel>
                      <Input
                        id="bg-paidby"
                        placeholder="Contoh: Bersama / Purusa / Pradana"
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                      />
                    </Field>
                  </div>

                  {/* Calculation Fields */}
                  <div className="grid grid-cols-3 gap-3">
                    <Field>
                      <FieldLabel htmlFor="bg-qty" className="font-semibold">
                        Jumlah (Qty)
                      </FieldLabel>
                      <Input
                        id="bg-qty"
                        type="number"
                        min="0.1"
                        step="any"
                        value={quantity}
                        onChange={(e) =>
                          handleQuantityChange(Number(e.target.value))
                        }

                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="bg-unit" className="font-semibold">
                        Satuan
                      </FieldLabel>
                      <Input
                        id="bg-unit"
                        placeholder="Paket / Porsi / Ekor"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="bg-price" className="font-semibold">
                        Harga Satuan (IDR)
                      </FieldLabel>
                      <Input
                        id="bg-price"
                        type="number"
                        min="0"
                        step="1000"
                        value={unitPrice}
                        onChange={(e) =>
                          handlePriceChange(Number(e.target.value))
                        }
                        className="tabular-nums"
                        required
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="bg-notes" className="font-semibold">
                      Catatan & Rincian Tambahan
                    </FieldLabel>
                    <Textarea
                      id="bg-notes"
                      placeholder="Catatan rekening, kontak serati/vendor, nomor pesanan, dll..."
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="leading-relaxed"
                    />
                  </Field>
                </div>

                {/* Right Panel (~1/3): Status, Planned, Actual, Variance */}
                <div className="dark:lg:border-border/60 space-y-4 lg:col-span-5 lg:border-l lg:border-[#f0f0f4] lg:pl-6 xl:col-span-4">
                  <Field>
                    <FieldLabel htmlFor="bg-status" className="font-semibold">
                      Status Kesepakatan
                    </FieldLabel>
                    <NativeSelect
                      id="bg-status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as BudgetItemStatus)
                      }
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      <option value="estimated">Estimasi Awal</option>
                      <option value="booked">Dipesan / Deal</option>
                      <option value="paid_partial">DP / Cicilan</option>
                      <option value="paid_full">Lunas</option>
                      <option value="canceled">Dibatalkan</option>
                    </NativeSelect>
                  </Field>

                  {/* Financial Summary Card */}
                  <div className="dark:border-border/60 dark:bg-muted/20 space-y-3 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-4">
                    <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                      Ringkasan Finansial Pos
                    </span>

                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel
                          htmlFor="bg-planned"
                          className="font-semibold"
                        >
                          Rencana Biaya
                        </FieldLabel>
                        <span className="text-foreground text-xs font-bold">
                          {formatRupiah(plannedAmount)}
                        </span>
                      </div>
                      <Input
                        id="bg-planned"
                        type="number"
                        min="0"
                        step="1000"
                        value={plannedAmount}
                        onChange={(e) =>
                          setPlannedAmount(Number(e.target.value))
                        }
                        className="dark:bg-card bg-white tabular-nums"
                        required
                      />
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel
                          htmlFor="bg-actual"
                          className="font-semibold"
                        >
                          Realisasi / Kontrak
                        </FieldLabel>
                        <span className="text-foreground text-xs font-bold">
                          {formatRupiah(actualAmount)}
                        </span>
                      </div>
                      <Input
                        id="bg-actual"
                        type="number"
                        min="0"
                        step="1000"
                        value={actualAmount}
                        onChange={(e) =>
                          setActualAmount(Number(e.target.value))
                        }
                        className="dark:bg-card bg-white tabular-nums"
                        required
                      />
                    </Field>

                    <div className="dark:border-border/40 flex items-center justify-between border-t border-[#f0f0f4] pt-2 text-xs">
                      <span className="text-muted-foreground">Varians:</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          variance > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : variance < 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {variance > 0
                          ? `+${formatRupiah(variance)} (Over)`
                          : variance < 0
                            ? `-${formatRupiah(Math.abs(variance))} (Hemat)`
                            : "Sesuai Target"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Metronic Footer */}
            <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-t border-[#f0f0f4] bg-[#fbfbfd] px-6 py-3.5">
              <span className="text-muted-foreground text-xs">
                {itemToEdit
                  ? `ID: ${itemToEdit.id}`
                  : "Pos baru akan ditambahkan ke buku anggaran"}
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
                  {itemToEdit ? "Simpan Perubahan" : "Tambah Anggaran"}
                </WorkspaceActionButton>
              </div>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
