"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, X, Store, CheckCircle2 } from "lucide-react";
import { createVendorAction, updateVendorAction } from "../actions";
import { VENDOR_CATEGORIES, VENDOR_STATUS_CONFIG } from "../seeds";
import { formatRupiah } from "@/features/workspaces/validation";
import type { Vendor, VendorStatus } from "../types";

interface VendorModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
  onSuccess: (vendor: Vendor, isEdit: boolean) => void;
}

export function VendorModal({
  weddingId,
  isOpen,
  onClose,
  vendorToEdit,
  onSuccess,
}: VendorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(vendorToEdit?.name || "");
  const [category, setCategory] = useState(
    vendorToEdit?.category || "banten_serati"
  );
  const [contactPerson, setContactPerson] = useState(
    vendorToEdit?.contactPerson || ""
  );
  const [phone, setPhone] = useState(vendorToEdit?.phone || "");
  const [socialLink, setSocialLink] = useState(vendorToEdit?.socialLink || "");
  const [quoteAmount, setQuoteAmount] = useState<number>(
    vendorToEdit?.quoteAmount || 0
  );
  const [status, setStatus] = useState<VendorStatus>(
    vendorToEdit?.status || "prospect"
  );
  const [picName, setPicName] = useState(vendorToEdit?.picName || "");
  const [notes, setNotes] = useState(vendorToEdit?.notes || "");
  const [createLinkedBudgetItem, setCreateLinkedBudgetItem] =
    useState(!vendorToEdit);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama vendor / penyedia jasa wajib diisi.");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (vendorToEdit) {
        const res = await updateVendorAction(weddingId, vendorToEdit.id, {
          name: name.trim(),
          category,
          contactPerson: contactPerson.trim() || null,
          phone: phone.trim() || null,
          socialLink: socialLink.trim() || null,
          quoteAmount: Math.round(Number(quoteAmount) || 0),
          status,
          picName: picName.trim() || null,
          notes: notes.trim() || null,
        });

        if (!res.success) {
          setError(res.error || "Gagal memperbarui vendor.");
          return;
        }

        const updated: Vendor = {
          ...vendorToEdit,
          name: name.trim(),
          category,
          contactPerson: contactPerson.trim() || null,
          phone: phone.trim() || null,
          socialLink: socialLink.trim() || null,
          quoteAmount: Math.round(Number(quoteAmount) || 0),
          status,
          picName: picName.trim() || null,
          notes: notes.trim() || null,
          updatedAt: new Date().toISOString(),
          agreedAmount:
            vendorToEdit.linkedBudgetItems.length > 0
              ? vendorToEdit.agreedAmount
              : Math.round(Number(quoteAmount) || 0),
          dueAmount: Math.max(
            0,
            (vendorToEdit.linkedBudgetItems.length > 0
              ? vendorToEdit.agreedAmount
              : Math.round(Number(quoteAmount) || 0)) - vendorToEdit.paidAmount
          ),
        };

        onSuccess(updated, true);
        onClose();
      } else {
        const res = await createVendorAction(weddingId, {
          name: name.trim(),
          category,
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          socialLink: socialLink.trim() || undefined,
          quoteAmount: Math.round(Number(quoteAmount) || 0),
          status,
          picName: picName.trim() || undefined,
          notes: notes.trim() || undefined,
          createLinkedBudgetItem,
        });

        if (!res.success || !res.vendor) {
          setError(res.error || "Gagal menyimpan vendor baru.");
          return;
        }

        onSuccess(res.vendor, false);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-modal-title"
      >
        {/* Metronic Header */}
        <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary rounded-xl p-2">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="vendor-modal-title"
                className="dark:text-foreground text-lg font-bold text-[#18181b]"
              >
                {vendorToEdit
                  ? "Edit Rekanan / Vendor"
                  : "Tambah Rekanan / Vendor Baru"}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Kelola data rekanan, kontak lapangan, dan integrasi pos anggaran
                pawiwahan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body: 2-Panel Metronic Layout */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {error && (
              <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border p-3 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Panel (~2/3): Details, Contacts, Social, Notes */}
              <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="vendor-name"
                    className="text-xs font-semibold"
                  >
                    Nama Vendor / Penyedia Jasa{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendor-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sanggar Rias Sekar Jagat / Griya Banten Asri"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="vendor-contact"
                      className="text-xs font-semibold"
                    >
                      Nama Kontak (PIC Vendor)
                    </Label>
                    <Input
                      id="vendor-contact"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Contoh: Ibu Ketut Ariani / Bli Made"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="vendor-phone"
                      className="text-xs font-semibold"
                    >
                      Nomor Telepon / WhatsApp
                    </Label>
                    <Input
                      id="vendor-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 081238912345"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="vendor-social"
                      className="text-xs font-semibold"
                    >
                      Media Sosial / Website
                    </Label>
                    <Input
                      id="vendor-social"
                      value={socialLink}
                      onChange={(e) => setSocialLink(e.target.value)}
                      placeholder="Contoh: https://instagram.com/sekarjagat_mua"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="vendor-pic"
                      className="text-xs font-semibold"
                    >
                      PIC Keluarga (Penanggung Jawab)
                    </Label>
                    <Input
                      id="vendor-pic"
                      value={picName}
                      onChange={(e) => setPicName(e.target.value)}
                      placeholder="Contoh: I Made Wardana (Paman) / Mempelai Pria"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="vendor-notes"
                    className="text-xs font-semibold"
                  >
                    Catatan & Lingkup Kesepakatan
                  </Label>
                  <Textarea
                    id="vendor-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Rincian paket yang disepakati, tanggal fitting, jadwal kedatangan di hari H, dll..."
                    className="text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Panel (~1/3): Category, Status, Financials */}
              <div className="dark:lg:border-border/60 space-y-4 lg:col-span-5 lg:border-l lg:border-[#f0f0f4] lg:pl-6 xl:col-span-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="vendor-category"
                    className="text-xs font-semibold"
                  >
                    Kategori Layanan
                  </Label>
                  <select
                    id="vendor-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                  >
                    {VENDOR_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="vendor-status"
                    className="text-xs font-semibold"
                  >
                    Status Kerjasama
                  </Label>
                  <select
                    id="vendor-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VendorStatus)}
                    className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                  >
                    {Object.entries(VENDOR_STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Financial Quote & Linked Budget Card */}
                <div className="dark:border-border/60 dark:bg-muted/20 space-y-3 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-4">
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                    Penawaran & Anggaran
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="vendor-quote"
                        className="text-xs font-semibold"
                      >
                        Nilai Penawaran (IDR)
                      </Label>
                      <span className="text-foreground text-xs font-bold">
                        {formatRupiah(Number(quoteAmount) || 0)}
                      </span>
                    </div>
                    <Input
                      id="vendor-quote"
                      type="number"
                      min="0"
                      step="10000"
                      value={quoteAmount}
                      onChange={(e) =>
                        setQuoteAmount(Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="dark:bg-card h-8 bg-white text-xs tabular-nums"
                    />
                  </div>

                  {!vendorToEdit && (
                    <div className="dark:border-border/40 border-t border-[#f0f0f4] pt-2">
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="checkbox"
                          checked={createLinkedBudgetItem}
                          onChange={(e) =>
                            setCreateLinkedBudgetItem(e.target.checked)
                          }
                          className="text-primary focus:ring-primary mt-0.5 h-3.5 w-3.5 rounded"
                        />
                        <div className="text-[11px]">
                          <p className="text-foreground font-semibold">
                            Sinkronkan ke Anggaran
                          </p>
                          <p className="text-muted-foreground mt-0.5 leading-snug">
                            Buat otomatis pos pengeluaran di menu Anggaran
                            dengan nominal penawaran di atas.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {vendorToEdit &&
                    vendorToEdit.linkedBudgetItems.length > 0 && (
                      <div className="dark:border-border/40 space-y-1 border-t border-[#f0f0f4] pt-2 text-xs">
                        <div className="text-muted-foreground flex justify-between">
                          <span>Disepakati:</span>
                          <span className="text-foreground font-semibold">
                            {formatRupiah(vendorToEdit.agreedAmount)}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex justify-between">
                          <span>Dibayar:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(vendorToEdit.paidAmount)}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex justify-between">
                          <span>Sisa:</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {formatRupiah(vendorToEdit.dueAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Metronic Footer */}
          <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-t border-[#f0f0f4] bg-[#fbfbfd] px-6 py-3.5">
            <span className="text-muted-foreground text-xs">
              {vendorToEdit
                ? `ID: ${vendorToEdit.id}`
                : "Rekanan baru akan ditambahkan ke direktori"}
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
                type="submit"
                size="sm"
                disabled={isPending}
                className="text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {vendorToEdit ? "Simpan Perubahan" : "Tambah Vendor"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
