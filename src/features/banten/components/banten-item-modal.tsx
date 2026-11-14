"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBantenItemAction, updateBantenItemAction } from "../actions";
import type {
  BantenAcquisitionStatus,
  BantenItem,
  SourcingMethod,
} from "../types";
import type { WeddingCeremony } from "@/features/ceremonies/types";

interface BantenItemModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  item?: BantenItem | null;
  ceremonies: WeddingCeremony[];
}

export function BantenItemModal({
  weddingId,
  isOpen,
  onClose,
  item,
  ceremonies,
}: BantenItemModalProps) {
  const router = useRouter();
  const isEditing = Boolean(item);

  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(
    item?.category || "sarana_pelengkap"
  );
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [unit, setUnit] = useState(item?.unit || "Paket");
  const [sourcingMethod, setSourcingMethod] = useState<SourcingMethod>(
    item?.sourcingMethod || "purchased_package"
  );
  const [status, setStatus] = useState<BantenAcquisitionStatus>(
    item?.status || "needed"
  );
  const [ceremonyId, setCeremonyId] = useState(item?.ceremonyId || "");
  const [assigneeName, setAssigneeName] = useState(item?.assigneeName || "");
  const [estimatedPrice, setEstimatedPrice] = useState(
    item?.estimatedPrice || 0
  );
  const [actualPrice, setActualPrice] = useState(item?.actualPrice || 0);
  const [notes, setNotes] = useState(item?.notes || "");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg("Nama banten atau sarana wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    let res;
    if (isEditing && item) {
      res = await updateBantenItemAction(weddingId, item.id, {
        name,
        category,
        quantity: Number(quantity) || 1,
        unit,
        sourcingMethod,
        status,
        ceremonyId: ceremonyId || null,
        assigneeName: assigneeName || null,
        estimatedPrice: Number(estimatedPrice) || 0,
        actualPrice: Number(actualPrice) || 0,
        notes: notes || null,
      });
    } else {
      res = await createBantenItemAction(weddingId, {
        name,
        category,
        quantity: Number(quantity) || 1,
        unit,
        sourcingMethod,
        status,
        ceremonyId: ceremonyId || null,
        assigneeName: assigneeName || null,
        estimatedPrice: Number(estimatedPrice) || 0,
        actualPrice: Number(actualPrice) || 0,
        notes: notes || null,
      });
    }

    setLoading(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setErrorMsg(res.message || "Gagal menyimpan item banten.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="border-border bg-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="banten-modal-title"
      >
        <div className="flex items-center justify-between pb-3">
          <h3
            id="banten-modal-title"
            className="text-foreground text-lg font-bold"
          >
            {isEditing ? "Edit Kebutuhan Banten" : "Tambah Kebutuhan Banten"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bantenName">Nama Banten / Sarana *</Label>
            <Input
              id="bantenName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Banten Byakala Utama"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category">Tingkatan / Kategori</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="utama">Utama (Pokok Upacara)</option>
                <option value="madya">Madya (Standar Penunjang)</option>
                <option value="nista">Nista (Sederhana / Inti)</option>
                <option value="sarana_pelengkap">
                  Sarana Pelengkap / Ayaban
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ceremony">Terkait Upacara</Label>
              <select
                id="ceremony"
                value={ceremonyId}
                onChange={(e) => setCeremonyId(e.target.value)}
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Umum (Seluruh Acara)</option>
                {ceremonies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sourcing">Metode Pengadaan</Label>
              <select
                id="sourcing"
                value={sourcingMethod}
                onChange={(e) =>
                  setSourcingMethod(e.target.value as SourcingMethod)
                }
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="purchased_package">
                  Beli Paket Serati Banten
                </option>
                <option value="self_made">
                  Buat Sendiri / Ngayah Keluarga
                </option>
                <option value="family_assigned">Tugas Keluarga Tertentu</option>
                <option value="vendor_order">Pesan Vendor Khusus</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status Pengadaan</Label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as BantenAcquisitionStatus)
                }
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              >
                <option value="needed">Dibutuhkan (Belum Dipesan)</option>
                <option value="ordered">Dipesan (Menunggu Pengiriman)</option>
                <option value="making">Sedang Dibuat (Ngayah)</option>
                <option value="ready">Siap (Sudah di Lokasi)</option>
                <option value="not_needed">Tidak Diperlukan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty">Jumlah</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Satuan</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Paket, Tanding, Set, Bungkul"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignee">
              Penanggung Jawab / Serati / Penyedia
            </Label>
            <Input
              id="assignee"
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              placeholder="Contoh: Serati Griya Sanur / Ibu Purusa"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="estimated">Estimasi Biaya (Rp)</Label>
              <Input
                id="estimated"
                type="number"
                min="0"
                step="10000"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="actual">Biaya Aktual (Rp)</Label>
              <Input
                id="actual"
                type="number"
                min="0"
                step="10000"
                value={actualPrice}
                onChange={(e) => setActualPrice(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Catatan & Komponen Khusus</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Kelengkapan ayam brumbun, danyah kelapa gading, tetabuhan arak berem..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Menyimpan..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "Tambah Banten"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
