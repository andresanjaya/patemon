"use client";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="banten-modal-title"
      >
        {/* Metronic Header */}
        <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div>
            <h3
              id="banten-modal-title"
              className="dark:text-foreground text-lg font-bold text-[#18181b]"
            >
              {isEditing
                ? "Detail & Edit Kebutuhan Banten"
                : "Tambah Kebutuhan Banten"}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Rincian sarana upakara, alokasi serati, dan status persiapan adat
              pawiwahan
            </p>
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
          <FieldGroup className="min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {errorMsg && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">
                  {errorMsg}
                </div>
              )}

              {isEditing && item?.reviewStatus === "approved" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p>
                    Sarana ini telah berstatus <strong>Disetujui Adat</strong>.
                    Mengubah spesifikasi kebutuhan (nama, jumlah, satuan,
                    kategori) akan otomatis mengembalikan status ke{" "}
                    <strong>Perlu Ditinjau</strong> agar dapat disepakati ulang
                    bersama keluarga atau pemangku.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Panel (~2/3): Detail & Form Fields */}
                <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                  <Field>
                    <FieldLabel htmlFor="bantenName" className="font-semibold">
                      Nama Banten / Sarana Upakara{" "}
                      <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="bantenName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Banten Byakala Utama"

                      required
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="ceremony" className="font-semibold">
                        Terkait Upacara
                      </FieldLabel>
                      <NativeSelect
                        id="ceremony"
                        value={ceremonyId}
                        onChange={(e) => setCeremonyId(e.target.value)}
                        className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                      >
                        <option value="">Umum (Seluruh Acara)</option>
                        {ceremonies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>

                    <div className="grid grid-cols-2 gap-2">
                      <Field>
                        <FieldLabel htmlFor="qty" className="font-semibold">
                          Jumlah
                        </FieldLabel>
                        <Input
                          id="qty"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}

                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="unit" className="font-semibold">
                          Satuan
                        </FieldLabel>
                        <Input
                          id="unit"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          placeholder="Paket, Tanding"

                          required
                        />
                      </Field>
                    </div>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="assignee" className="font-semibold">
                      Penanggung Jawab / Serati / Penyedia
                    </FieldLabel>
                    <Input
                      id="assignee"
                      value={assigneeName}
                      onChange={(e) => setAssigneeName(e.target.value)}
                      placeholder="Contoh: Serati Griya Sanur / Ibu Purusa"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="notes" className="font-semibold">
                      Catatan & Komponen Khusus
                    </FieldLabel>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Kelengkapan ayam brumbun, danyah kelapa gading, tetabuhan arak berem..."
                      rows={3}
                      className="leading-relaxed"
                    />
                  </Field>
                </div>

                {/* Right Panel (~1/3): Context, Sourcing, & Financials */}
                <div className="dark:lg:border-border/60 space-y-4 lg:col-span-5 lg:border-l lg:border-[#f0f0f4] lg:pl-6 xl:col-span-4">
                  <Field>
                    <FieldLabel htmlFor="category" className="font-semibold">
                      Tingkatan / Kategori
                    </FieldLabel>
                    <NativeSelect
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      <option value="utama">Utama (Pokok Upacara)</option>
                      <option value="madya">Madya (Standar Penunjang)</option>
                      <option value="nista">Nista (Sederhana / Inti)</option>
                      <option value="sarana_pelengkap">
                        Sarana Pelengkap / Ayaban
                      </option>
                    </NativeSelect>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sourcing" className="font-semibold">
                      Metode Pengadaan
                    </FieldLabel>
                    <NativeSelect
                      id="sourcing"
                      value={sourcingMethod}
                      onChange={(e) =>
                        setSourcingMethod(e.target.value as SourcingMethod)
                      }
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      <option value="purchased_package">
                        Beli Paket Serati Banten
                      </option>
                      <option value="self_made">
                        Buat Sendiri / Ngayah Keluarga
                      </option>
                      <option value="family_assigned">
                        Tugas Keluarga Tertentu
                      </option>
                      <option value="vendor_order">Pesan Vendor Khusus</option>
                    </NativeSelect>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="status" className="font-semibold">
                      Status Kesiapan
                    </FieldLabel>
                    <NativeSelect
                      id="status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as BantenAcquisitionStatus)
                      }
                      className="border-input bg-background text-foreground w-full rounded-md border px-2.5"
                    >
                      <option value="needed">Dibutuhkan (Belum Dipesan)</option>
                      <option value="ordered">
                        Dipesan (Menunggu Pengiriman)
                      </option>
                      <option value="making">Sedang Dibuat (Ngayah)</option>
                      <option value="ready">Siap (Sudah di Lokasi)</option>
                      <option value="not_needed">Tidak Diperlukan</option>
                    </NativeSelect>
                  </Field>

                  <div className="dark:border-border/60 dark:bg-muted/20 space-y-3 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-3">
                    <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                      Estimasi & Anggaran
                    </span>
                    <Field>
                      <FieldLabel htmlFor="estimated">
                        Estimasi Biaya (Rp)
                      </FieldLabel>
                      <Input
                        id="estimated"
                        type="number"
                        min="0"
                        step="10000"
                        value={estimatedPrice}
                        onChange={(e) =>
                          setEstimatedPrice(Number(e.target.value))
                        }
                        placeholder="0"
                        className="dark:bg-card bg-white tabular-nums"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="actual">
                        Biaya Aktual (Rp)
                      </FieldLabel>
                      <Input
                        id="actual"
                        type="number"
                        min="0"
                        step="10000"
                        value={actualPrice}
                        onChange={(e) => setActualPrice(Number(e.target.value))}
                        placeholder="0"
                        className="dark:bg-card bg-white tabular-nums"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Metronic Footer */}
            <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-t border-[#f0f0f4] bg-[#fbfbfd] px-6 py-3.5">
              <span className="text-muted-foreground text-xs">
                {isEditing
                  ? `ID: ${item?.id}`
                  : "Item baru akan dicatat dalam katalog"}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="text-xs"
                >
                  {loading
                    ? "Menyimpan..."
                    : isEditing
                      ? "Simpan Perubahan"
                      : "Tambah Banten"}
                </Button>
              </div>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
