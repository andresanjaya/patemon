"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, Receipt } from "lucide-react";
import { recordPaymentAction } from "../actions";
import { PAYMENT_METHODS } from "../seeds";
import { formatRupiah } from "@/features/workspaces/validation";
import type { BudgetItem, BudgetPayment } from "../types";

interface PaymentModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  item: BudgetItem;
  onSuccess: (payment: BudgetPayment) => void;
}

export function PaymentModal({
  weddingId,
  isOpen,
  onClose,
  item,
  onSuccess,
}: PaymentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const effectiveTotal =
    item.actualAmount > 0 ? item.actualAmount : item.plannedAmount;
  const remaining = Math.max(0, effectiveTotal - item.paidAmount);

  const [amount, setAmount] = useState<number>(remaining > 0 ? remaining : 0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("Transfer Bank");
  const [recipient, setRecipient] = useState<string>(item.paidBy || "");
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Math.round(Number(amount));
    if (numAmount <= 0) {
      setError("Nominal pembayaran harus lebih besar dari Rp 0.");
      return;
    }

    if (!paymentDate) {
      setError("Tanggal pembayaran wajib diisi.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await recordPaymentAction(weddingId, {
          budgetItemId: item.id,
          amount: numAmount,
          paymentDate,
          paymentMethod,
          recipient: recipient.trim() || undefined,
          notes: notes.trim() || undefined,
        });

        if (!res.success || !res.payment) {
          setError(res.error || "Gagal mencatat transaksi pembayaran.");
          return;
        }

        onSuccess(res.payment);
        onClose();
      } catch {
        setError("Terjadi kesalahan sistem saat menyimpan transaksi.");
      }
    });
  };

  const projectedRemaining = Math.max(0, remaining - (Number(amount) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
      <div
        className="bg-card border-border/80 flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* Metronic Header */}
        <div className="px-6 py-4 border-b border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-white dark:bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="payment-modal-title"
                className="text-[#18181b] dark:text-foreground text-lg font-bold"
              >
                Catat Pembayaran / DP
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Pencatatan realisasi transaksi kas untuk &lsquo;{item.title}&rsquo;
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

        {/* Scrollable Body: 2-Panel Metronic Layout */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive border-destructive/20 rounded-lg border p-3 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel (~2/3): Payment Details Form */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pay-amount" className="text-xs font-semibold">
                      Nominal Pembayaran (IDR) <span className="text-destructive">*</span>
                    </Label>
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmount(remaining)}
                        className="text-primary text-[11px] font-medium hover:underline"
                      >
                        Lunasi Sisa ({formatRupiah(remaining)})
                      </button>
                    )}
                  </div>
                  <Input
                    id="pay-amount"
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="Contoh: 1500000"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="h-9 text-xs tabular-nums"
                    required
                  />
                  {amount > 0 && (
                    <p className="text-muted-foreground text-xs">
                      Terbaca: <strong>{formatRupiah(amount)}</strong>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-date" className="text-xs font-semibold">
                      Tanggal Pembayaran <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pay-date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pay-method" className="text-xs font-semibold">
                      Metode Pembayaran
                    </Label>
                    <select
                      id="pay-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pay-recipient" className="text-xs font-semibold">
                    Penerima Dana / Vendor
                  </Label>
                  <Input
                    id="pay-recipient"
                    placeholder="Contoh: Serati Banten Griya / Sanggar Rias Kusuma"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pay-notes" className="text-xs font-semibold">
                    Keterangan / Catatan Bukti Bayar
                  </Label>
                  <Textarea
                    id="pay-notes"
                    placeholder="Contoh: DP 50% via transfer BCA an I Wayan..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Panel (~1/3): Budget Item Financial Summary Snapshot */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:border-l lg:border-[#f0f0f4] dark:lg:border-border/60 lg:pl-6">
                <div className="rounded-xl border border-[#f0f0f4] dark:border-border/60 bg-[#f9f9fb] dark:bg-muted/20 p-4 space-y-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Ringkasan Pos Anggaran
                  </span>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Pos Pengeluaran:</span>
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Kategori: {item.category}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#f0f0f4] dark:border-border/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Biaya:</span>
                      <span className="font-semibold text-foreground">{formatRupiah(effectiveTotal)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Telah Dibayar:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(item.paidAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sisa Tagihan:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {formatRupiah(remaining)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#f0f0f4] dark:border-border/40 flex items-center justify-between font-semibold">
                      <span className="text-muted-foreground text-[11px]">Proyeksi Sisa:</span>
                      <span className="tabular-nums text-foreground">
                        {formatRupiah(projectedRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Metronic Footer */}
          <div className="px-6 py-3.5 border-t border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-[#fbfbfd] dark:bg-card">
            <span className="text-xs text-muted-foreground">
              Transaksi tercatat di buku kas pawiwahan
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
              <Button type="submit" size="sm" disabled={isPending} className="text-xs">
                {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Simpan Transaksi
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
