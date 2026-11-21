"use client";
import { Button } from "@/components/ui/button";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { Lock, Unlock, AlertTriangle, ShieldAlert } from "lucide-react";
import { freezeWeddingAction, unfreezeWeddingAction } from "../actions";

interface AdminFreezeControlsProps {
  weddingId: string;
  coupleNames: string;
  isFrozen: boolean;
  frozenReason: string | null;
  frozenAt: string | null;
  frozenBy: string | null;
}

export function AdminFreezeControls({
  weddingId,
  coupleNames,
  isFrozen,
  frozenReason,
  frozenAt,
  frozenBy,
}: AdminFreezeControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleFreeze = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (reason.trim().length < 10) {
      setError(
        "Alasan wajib diisi minimal 10 karakter untuk keperluan audit hukum/operasional."
      );
      return;
    }

    startTransition(async () => {
      if (isFrozen) {
        const res = await unfreezeWeddingAction({
          weddingId,
          reason: reason.trim(),
        });
        if (!res.success) {
          setError(res.error || "Gagal membuka pembekuan workspace.");
        } else {
          setSuccessMsg(
            "Pembekuan workspace berhasil dicabut. Hak akses kembali normal."
          );
          setReason("");
          setIsOpen(false);
        }
      } else {
        const res = await freezeWeddingAction({
          weddingId,
          reason: reason.trim(),
        });
        if (!res.success) {
          setError(res.error || "Gagal membekukan workspace.");
        } else {
          setSuccessMsg(
            "Workspace berhasil dibekukan. Semua mutasi data oleh pengguna telah dikunci."
          );
          setReason("");
          setIsOpen(false);
        }
      }
    });
  };

  return (
    <div className="workspace-card p-5">
      <div className="border-border -mx-5 -mt-5 mb-5 flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isFrozen ? (
              <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                <Lock className="h-3.5 w-3.5 text-red-600" />
                Status: Workspace Dibekukan (Locked)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                Status: Normal (Aktif Mutasi)
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold text-stone-900">
            Kontrol Pembekuan Workspace (Administrative Freeze)
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Digunakan saat terjadi sengketa kepemilikan acara, permintaan
            penegak hukum, atau pelanggaran ketentuan layanan.
          </p>

          {isFrozen && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">Catatan Pembekuan:</p>
                  <p className="mt-0.5">
                    {frozenReason || "Tidak ada alasan spesifik tercatat."}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-red-700">
                    Dibekukan oleh: {frozenBy || "Admin"} •{" "}
                    {frozenAt
                      ? new Date(frozenAt).toLocaleString("id-ID")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Button
            variant={isFrozen ? "outline" : "destructive"}
            size={null}
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setError(null);
            }}
            className="gap-2 px-4 py-2 font-semibold shadow-sm"
          >
            {isFrozen ? (
              <>
                <Unlock className="h-4 w-4" />
                <span>Buka Pembekuan Workspace</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Bekukan Workspace</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      {isOpen && (
        <form
          onSubmit={handleToggleFreeze}
          className="mt-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4 transition-all"
        >
          <FieldGroup className="gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>
                {isFrozen
                  ? `Konfirmasi Buka Pembekuan untuk ${coupleNames}`
                  : `Konfirmasi Pembekuan Workspace ${coupleNames}`}
              </span>
            </div>

            <p className="mt-1 text-xs text-stone-600">
              {isFrozen
                ? "Tindakan ini akan mengembalikan kemampuan edit pengguna dan keluarga pada workspace."
                : "Tindakan ini akan mematikan seluruh izin edit pada workspace untuk semua kolaborator seketika."}
            </p>

            <Field className="mt-3">
              <FieldLabel
                htmlFor="freeze-reason"
                className="block font-semibold text-stone-700"
              >
                Alasan Operasional (Wajib dicatat di Audit Log, min 10
                karakter):
              </FieldLabel>
              <Textarea
                id="freeze-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isFrozen
                    ? "Contoh: Sengketa akun telah diselesaikan via bukti transfer resmi dan verifikasi KTP."
                    : "Contoh: Laporan sengketa kepemilikan vendor/keluarga tiket #SUP-991, menunggu mediasi."
                }
                className="mt-1.5 w-full rounded-md border border-stone-300 bg-white p-2.5 text-stone-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                required
              />
            </Field>

            {error && (
              <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size={null}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="px-3 py-1.5 text-xs"
              >
                Batal
              </Button>
              <Button
                variant={isFrozen ? "default" : "destructive"}
                size={null}
                type="submit"
                disabled={isPending}
                className="px-3.5 py-1.5 text-xs font-semibold shadow-sm"
              >
                {isPending
                  ? "Memproses..."
                  : isFrozen
                    ? "Ya, Buka Pembekuan"
                    : "Ya, Bekukan Sekarang"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
