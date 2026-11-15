"use client";

import { useState, useTransition } from "react";
import {
  Download,
  Printer,
  ShieldAlert,
  X,
  Loader2,
  Check,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadHTML, openHTMLInNewTab } from "@/lib/csv-export";
import { generateOfflineDayOfPackAction } from "../actions";

interface OfflinePackModalProps {
  weddingId: string;
  coupleNames: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OfflinePackModal({
  weddingId,
  coupleNames,
  isOpen,
  onClose,
}: OfflinePackModalProps) {
  const [includeRundown, setIncludeRundown] = useState(true);
  const [includeBanten, setIncludeBanten] = useState(true);
  const [includePicContacts, setIncludePicContacts] = useState(true);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = (actionType: "download" | "print") => {
    if (!includeRundown && !includeBanten && !includePicContacts) {
      setError(
        "Pilih minimal satu modul data untuk dimasukkan ke dalam paket."
      );
      return;
    }

    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await generateOfflineDayOfPackAction(weddingId, {
        includeRundown,
        includeBanten,
        includePicContacts,
      });

      if (!res.success || !res.html || !res.filename) {
        setError(res.error || "Gagal menyusun paket hari-H offline.");
        return;
      }

      if (actionType === "download") {
        downloadHTML(res.filename, res.html);
        setSuccessMsg(
          `File HTML berhasil diunduh (${res.filename}). Anda dapat membukanya langsung di browser tanpa koneksi internet.`
        );
      } else {
        openHTMLInNewTab(res.html);
        setSuccessMsg("Dokumen dibuka di tab baru untuk pencetakan PDF / A4.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="bg-background border-border relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-pack-modal-title"
      >
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <div>
              <h3
                id="offline-pack-modal-title"
                className="text-foreground text-base font-bold"
              >
                Paket Hari-H Offline & Lembar Cetak A4
              </h3>
              <p className="text-muted-foreground text-[11px] font-medium">
                {coupleNames}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition"
            aria-label="Tutup dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Siapkan dokumen kontingensi lapangan untuk dibuka di browser HP/laptop
          saat jaringan di lokasi pura atau kediaman terputus, atau dicetak
          langsung di atas kertas A4 untuk pegangan panitia keluarga.
        </p>

        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive mt-3 flex items-center gap-2 rounded-lg border p-3 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Data Selection Checkboxes */}
        <div className="border-border/70 bg-card/60 mt-4 space-y-2.5 rounded-xl border p-3.5">
          <span className="text-foreground block text-xs font-bold tracking-wider uppercase">
            Pilih Modul Data yang Disertakan:
          </span>

          <label className="text-foreground flex cursor-pointer items-start gap-2.5 text-xs">
            <input
              type="checkbox"
              checked={includeRundown}
              onChange={(e) => setIncludeRundown(e.target.checked)}
              className="border-border text-primary focus:ring-primary mt-0.5 rounded"
            />
            <div>
              <span className="font-semibold">
                Susunan Rundown Acara Hari-H
              </span>
              <p className="text-muted-foreground text-[11px]">
                Jadwal jam-demi-jam, alokasi durasi, titik lokasi, PIC & nomor
                telepon
              </p>
            </div>
          </label>

          <label className="text-foreground flex cursor-pointer items-start gap-2.5 text-xs">
            <input
              type="checkbox"
              checked={includeBanten}
              onChange={(e) => setIncludeBanten(e.target.checked)}
              className="border-border text-primary focus:ring-primary mt-0.5 rounded"
            />
            <div>
              <span className="font-semibold">
                Checklist Kesiapan Sarana Banten & Upakara
              </span>
              <p className="text-muted-foreground text-[11px]">
                Daftar sarana banten per upacara, status pengadaan, jumlah &
                seksi penanggung jawab
              </p>
            </div>
          </label>

          <label className="text-foreground flex cursor-pointer items-start gap-2.5 text-xs">
            <input
              type="checkbox"
              checked={includePicContacts}
              onChange={(e) => setIncludePicContacts(e.target.checked)}
              className="border-border text-primary focus:ring-primary mt-0.5 rounded"
            />
            <div>
              <span className="font-semibold">
                Direktori Kontak Panitia & PIC Lapangan
              </span>
              <p className="text-muted-foreground text-[11px]">
                Daftar gabungan seluruh PIC unik, nomor WhatsApp, dan tugas yang
                dipegang
              </p>
            </div>
          </label>
        </div>

        {/* Privacy & Snapshot Disclaimer */}
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-50/60 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Privasi & Integritas Dokumen Snapshot</p>
              <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                Berkas disimpan mandiri di perangkat lokal Anda tanpa aset
                remote. Nomor kontak tamu dan berkas sensitif{" "}
                <strong>tidak disertakan</strong> demi keamanan. Perubahan data
                di lapangan saat offline tidak otomatis tersinkronisasi ke
                server.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("print")}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              <span>Buka & Cetak PDF (A4)</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleGenerate("download")}
              disabled={isPending}
              className="gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-700"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>Unduh File HTML (Offline)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
