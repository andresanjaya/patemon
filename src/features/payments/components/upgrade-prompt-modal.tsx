"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Check,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MVP_WEDDING_PRICE_IDR,
  MVP_WEDDING_ORIGINAL_PRICE_IDR,
} from "../pricing";
import { formatRupiah } from "@/features/workspaces/validation";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  coupleNames?: string;
}

export function UpgradePromptModal({
  isOpen,
  onClose,
  weddingId,
  coupleNames,
}: UpgradePromptModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProceedCheckout = () => {
    setIsProcessing(true);
    // In Issue #36, this triggers Midtrans Snap checkout popup or server checkout session
    // For now, redirect or trigger checkout flow
    setTimeout(() => {
      setIsProcessing(false);
      router.push(`/workspace/${weddingId}/settings?upgrade=initiated`);
    }, 600);
  };

  const unlockedFeatures = [
    "Workspace privat khusus pasangan dan keluarga",
    "Undang hingga 15 anggota keluarga (Owner, Editor, Viewer)",
    "Katalog lengkap 30+ banten dan manajemen pengadaan",
    "Buku anggaran adat & pembagian beban Purusa/Pradana",
    "Pencatatan pembayaran, DP vendor & kontrak",
    "Rundown panitia hari-H dengan estimasi waktu WITA",
    "Daftar tamu, kelompok banjar/dadia & headcount",
    "Ekspor CSV kontingensi lapangan & backup JSON offline",
    "Akses arsip baca dan ekspor data seumur hidup",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-background border-border relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-md p-1 transition-colors"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <Badge
            variant="secondary"
            className="border-primary/30 bg-primary/10 text-primary gap-1 px-3 py-1 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Aktivasi Akses Penuh Pawiwahan</span>
          </Badge>

          <h3 className="text-foreground text-2xl font-bold tracking-tight">
            Rencanakan Pawiwahan Tanpa Batas
          </h3>

          {coupleNames && (
            <p className="text-primary text-xs font-semibold">
              Workspace: {coupleNames}
            </p>
          )}

          <p className="text-muted-foreground text-xs leading-relaxed">
            Satu kali pembayaran untuk seluruh rangkaian prosesi upacara adat
            Bali hingga hari-H selesai.
          </p>
        </div>

        {/* Pricing Box */}
        <div className="bg-primary/5 border-primary/20 my-5 rounded-2xl border p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground text-xs line-through">
              {formatRupiah(MVP_WEDDING_ORIGINAL_PRICE_IDR)}
            </span>
            <span className="text-primary text-2xl font-extrabold sm:text-3xl">
              {formatRupiah(MVP_WEDDING_PRICE_IDR)}
            </span>
            <Badge className="bg-emerald-600 text-[10px] text-white">
              Hemat 20%
            </Badge>
          </div>
          <span className="text-muted-foreground block text-[11px]">
            Bayar 1x per pawiwahan · Tanpa biaya langganan bulanan
          </span>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2 py-1">
          <span className="text-foreground text-xs font-semibold">
            Fitur yang akan terbuka:
          </span>
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {unlockedFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="text-muted-foreground text-[11px] leading-tight">
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Guarantee */}
        <div className="border-border/80 bg-muted/30 my-4 flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-[11px]">
          <div className="flex items-center gap-2">
            <QrCode className="text-primary h-4 w-4" />
            <CreditCard className="text-primary h-4 w-4" />
            <span className="text-muted-foreground">
              QRIS, GoPay, VA BCA, Mandiri, BRI & Kartu Kredit
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Aman Midtrans</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
            disabled={isProcessing}
          >
            Nanti Saja
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleProceedCheckout}
            disabled={isProcessing}
            className="gap-2 text-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyiapkan Checkout...</span>
              </>
            ) : (
              <>
                <span>Aktivasi Sekarang</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
