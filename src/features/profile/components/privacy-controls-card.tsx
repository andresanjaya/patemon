"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Download,
  FileJson,
  Lock,
  UserCheck,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadJSON } from "@/lib/csv-export";
import { getUserDataTakeoutAction } from "../privacy-actions";

export function PrivacyControlsCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTakeout = async () => {
    setIsExporting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await getUserDataTakeoutAction();
      if (!res.success || !res.data) {
        setErrorMessage(res.error || "Gagal mengunduh salinan data pribadi.");
        return;
      }

      const filename = `patemon-data-takeout-${new Date().toISOString().slice(0, 10)}.json`;
      downloadJSON(filename, res.data);
      setSuccessMessage(
        "Berkas salinan data pribadi berhasil diunduh (format JSON)."
      );
    } catch {
      setErrorMessage("Terjadi kesalahan teknis saat memproses takeout.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Pelindungan Data Pribadi (UU PDP)
              </CardTitle>
              <CardDescription className="text-xs">
                Kepatuhan privasi dan hak akses salinan data sesuai UU No. 27
                Tahun 2022
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-800 dark:text-emerald-300"
          >
            UU No. 27/2022 Patuh
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {errorMessage && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3.5 text-xs sm:text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 sm:text-sm dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Privacy Guarantees Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-border/70 bg-card space-y-1.5 rounded-xl border p-3.5">
            <div className="text-primary flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="text-foreground text-xs font-semibold">
                Isolasi Row-Level
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Setiap catatan pawiwahan dilindungi PostgreSQL RLS multi-tenant;
              hanya anggota terverifikasi yang dapat mengakses.
            </p>
          </div>

          <div className="border-border/70 bg-card space-y-1.5 rounded-xl border p-3.5">
            <div className="text-primary flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              <span className="text-foreground text-xs font-semibold">
                Privasi Kontak Tamu
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Nomor WhatsApp dan alamat tamu hanya dipakai untuk koordinasi
              internal keluarga; tanpa pelacakan atau penjualan pihak ketiga.
            </p>
          </div>

          <div className="border-border/70 bg-card space-y-1.5 rounded-xl border p-3.5">
            <div className="text-primary flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="text-foreground text-xs font-semibold">
                Hak Portabilitas
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Anda berhak mengunduh seluruh salinan data akun dan riwayat
              keterlibatan pawiwahan Anda kapan saja (Pasal 25-26 UU PDP).
            </p>
          </div>
        </div>

        {/* Takeout Action Box */}
        <div className="border-border/80 bg-muted/20 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileJson className="text-primary h-4 w-4" />
              <h4 className="text-foreground text-sm font-semibold">
                Unduh Salinan Data Pribadi (Takeout)
              </h4>
            </div>
            <p className="text-muted-foreground text-xs">
              Dapatkan berkas arsip JSON berisi metadata profil, keanggotaan
              pawiwahan, dan undangan yang tercatat di sistem.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 text-xs"
            onClick={handleTakeout}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyiapkan Salinan...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Data (JSON)</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
