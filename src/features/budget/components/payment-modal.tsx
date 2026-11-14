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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="border-border bg-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="text-primary h-5 w-5" />
            <h3
              id="payment-modal-title"
              className="text-foreground text-lg font-bold"
            >
              Catat Pembayaran / DP
            </h3>
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

        {/* Item Financial Summary Snapshot */}
        <div className="bg-muted/30 border-border/60 my-2 space-y-1.5 rounded-xl border p-3.5 text-xs">
          <p className="text-foreground text-sm font-semibold">{item.title}</p>
          <div className="border-border/40 text-muted-foreground grid grid-cols-3 gap-2 border-t pt-1">
            <div>
              <span>Total Biaya:</span>
              <p className="text-foreground font-semibold">
                {formatRupiah(effectiveTotal)}
              </p>
            </div>
            <div>
              <span>Telah Dibayar:</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(item.paidAmount)}
              </p>
            </div>
            <div>
              <span>Sisa Tagihan:</span>
              <p className="font-semibold text-rose-600 dark:text-rose-400">
                {formatRupiah(remaining)}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive border-destructive/20 my-3 rounded-md border p-3 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pay-amount">
                Nominal Pembayaran (IDR){" "}
                <span className="text-destructive">*</span>
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
              required
            />
            {amount > 0 && (
              <p className="text-muted-foreground text-xs">
                Terbaca: <strong>{formatRupiah(amount)}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pay-date">
                Tanggal Pembayaran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pay-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-method">Metode Pembayaran</Label>
              <select
                id="pay-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
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
            <Label htmlFor="pay-recipient">Penerima Dana / Vendor</Label>
            <Input
              id="pay-recipient"
              placeholder="Contoh: Serati Banten Griya / Sanggar Rias Kusuma"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Keterangan / Catatan Bukti Bayar</Label>
            <Textarea
              id="pay-notes"
              placeholder="Contoh: DP 50% via transfer BCA an I Wayan..."
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
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
