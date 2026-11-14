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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-background border-border relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Store className="text-primary h-5 w-5" />
            <h2 className="text-foreground text-lg font-bold">
              {vendorToEdit
                ? "Edit Rekanan / Vendor"
                : "Tambah Rekanan / Vendor Baru"}
            </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vendor-name">
                Nama Vendor / Penyedia Jasa{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Sanggar Rias Sekar Jagat / Griya Banten Asri"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-category">Kategori Layanan</Label>
              <select
                id="vendor-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-status">Status Kerjasama</Label>
              <select
                id="vendor-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
                className="border-input bg-background text-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
              >
                {Object.entries(VENDOR_STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-contact">Nama Kontak (PIC Vendor)</Label>
              <Input
                id="vendor-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contoh: Ibu Ketut Ariani / Bli Made"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-phone">Nomor Telepon / WhatsApp</Label>
              <Input
                id="vendor-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081238912345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-social">Media Sosial / Website</Label>
              <Input
                id="vendor-social"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                placeholder="Contoh: https://instagram.com/sekarjagat_mua"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-pic">
                PIC Keluarga (Penanggung Jawab)
              </Label>
              <Input
                id="vendor-pic"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Contoh: I Made Wardana (Paman) / Mempelai Pria"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vendor-quote">
                  Nilai Penawaran / Estimasi Biaya (Rp)
                </Label>
                <span className="text-primary text-xs font-semibold">
                  {formatRupiah(Number(quoteAmount) || 0)}
                </span>
              </div>
              <Input
                id="vendor-quote"
                type="number"
                min="0"
                step="10000"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-muted-foreground text-xs">
                Besaran penawaran atau pagu kesepakatan awal untuk rekanan ini.
              </p>
            </div>

            {!vendorToEdit && (
              <div className="border-border/60 bg-muted/30 rounded-lg border p-3 sm:col-span-2">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={createLinkedBudgetItem}
                    onChange={(e) =>
                      setCreateLinkedBudgetItem(e.target.checked)
                    }
                    className="text-primary focus:ring-primary mt-0.5 h-4 w-4 rounded"
                  />
                  <div className="text-xs">
                    <p className="text-foreground font-medium">
                      Otomatis sinkronkan ke Perencana Anggaran (Budget)
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Membuat pos pengeluaran di menu Anggaran dengan nominal
                      penawaran di atas sehingga transaksi dan riwayat
                      DP/pelunasan dapat terlacak otomatis.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vendor-notes">
                Catatan & Lingkup Kesepakatan
              </Label>
              <Textarea
                id="vendor-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rincian paket yang disepakati, tanggal fitting, jadwal kedatangan di hari H, dll..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {vendorToEdit ? "Simpan Perubahan" : "Tambah Vendor"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
