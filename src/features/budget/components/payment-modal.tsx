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
  const workspaceCtx = useWorkspace();

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
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

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
        const res = await runAction(
          () =>
            recordPaymentAction(weddingId, {
              budgetItemId: item.id,
              amount: numAmount,
              paymentDate,
              paymentMethod,
              recipient: recipient.trim() || undefined,
              notes: notes.trim() || undefined,
            }),
          "Catatan pembayaran berhasil ditambahkan.",
          setError
        );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* Metronic Header */}
        <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary rounded-xl p-2">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="payment-modal-title"
                className="dark:text-foreground text-lg font-bold text-[#18181b]"
              >
                Catat Pembayaran / DP
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Pencatatan realisasi transaksi kas untuk &lsquo;{item.title}
                &rsquo;
              </p>
            </div>
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
                {/* Left Panel (~2/3): Payment Details Form */}
                <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                  <div className="space-y-1.5">
                    <Field
                      orientation="horizontal"
                      className="flex items-center justify-between"
                    >
                      <FieldLabel
                        htmlFor="pay-amount"
                        className="font-semibold"
                      >
                        Nominal Pembayaran (IDR){" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      {remaining > 0 && (
                        <Button
                          variant="link"
                          size={null}
                          type="button"
                          onClick={() => setAmount(remaining)}
                          className="text-[11px] font-medium"
                        >
                          Lunasi Sisa ({formatRupiah(remaining)})
                        </Button>
                      )}
                    </Field>
                    <Input
                      id="pay-amount"
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="Contoh: 1500000"
                      value={amount || ""}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="tabular-nums"
                      required
                    />
                    {amount > 0 && (
                      <p className="text-muted-foreground text-xs">
                        Terbaca: <strong>{formatRupiah(amount)}</strong>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="pay-date" className="font-semibold">
                        Tanggal Pembayaran{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="pay-date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}

                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel
                        htmlFor="pay-method"
                        className="font-semibold"
                      >
                        Metode Pembayaran
                      </FieldLabel>
                      <NativeSelect
                        id="pay-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel
                      htmlFor="pay-recipient"
                      className="font-semibold"
                    >
                      Penerima Dana / Vendor
                    </FieldLabel>
                    <Input
                      id="pay-recipient"
                      placeholder="Contoh: Serati Banten Griya / Sanggar Rias Kusuma"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="pay-notes" className="font-semibold">
                      Keterangan / Catatan Bukti Bayar
                    </FieldLabel>
                    <Textarea
                      id="pay-notes"
                      placeholder="Contoh: DP 50% via transfer BCA an I Wayan..."
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="leading-relaxed"
                    />
                  </Field>
                </div>

                {/* Right Panel (~1/3): Budget Item Financial Summary Snapshot */}
                <div className="dark:lg:border-border/60 space-y-4 lg:col-span-5 lg:border-l lg:border-[#f0f0f4] lg:pl-6 xl:col-span-4">
                  <div className="dark:border-border/60 dark:bg-muted/20 space-y-3 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-4">
                    <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                      Ringkasan Pos Anggaran
                    </span>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Pos Pengeluaran:
                      </span>
                      <p className="text-foreground text-xs font-bold">
                        {item.title}
                      </p>
                      <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                        Kategori: {item.category}
                      </span>
                    </div>

                    <div className="dark:border-border/40 space-y-2 border-t border-[#f0f0f4] pt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Total Biaya:
                        </span>
                        <span className="text-foreground font-semibold">
                          {formatRupiah(effectiveTotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Telah Dibayar:
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(item.paidAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Sisa Tagihan:
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {formatRupiah(remaining)}
                        </span>
                      </div>

                      <div className="dark:border-border/40 flex items-center justify-between border-t border-[#f0f0f4] pt-2 font-semibold">
                        <span className="text-muted-foreground text-[11px]">
                          Proyeksi Sisa:
                        </span>
                        <span className="text-foreground tabular-nums">
                          {formatRupiah(projectedRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Metronic Footer */}
            <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-t border-[#f0f0f4] bg-[#fbfbfd] px-6 py-3.5">
              <span className="text-muted-foreground text-xs">
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
                <WorkspaceActionButton
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs"
                >
                  {isPending && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  Simpan Transaksi
                </WorkspaceActionButton>
              </div>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
