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
  AlertCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MVP_WEDDING_PRICE_IDR,
  MVP_WEDDING_ORIGINAL_PRICE_IDR,
} from "../pricing";
import { formatRupiah } from "@/features/workspaces/validation";
import { createCheckoutOrderAction } from "../orders";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

/**
 * Dynamically loads the Midtrans Snap JS library if not yet attached to the DOM.
 */
function loadMidtransSnapScript(
  snapUrl: string,
  clientKey: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return resolve();
    }
    if (window.snap) {
      return resolve();
    }

    const existingScript = document.getElementById("midtrans-snap-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = snapUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{
    type: "pending" | "info";
    message: string;
    orderNumber?: string;
    redirectUrl?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleProceedCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusNotice(null);

    try {
      const result = await createCheckoutOrderAction(weddingId);

      if (!result.success || !result.snapToken) {
        setErrorMessage(
          result.error ||
            "Gagal menyiapkan sesi checkout. Silakan coba beberapa saat lagi."
        );
        setIsProcessing(false);
        return;
      }

      // 1. Ensure Snap JS is loaded
      if (result.snapUrl && result.clientKey) {
        try {
          await loadMidtransSnapScript(result.snapUrl, result.clientKey);
        } catch {
          // Fallback will catch below if window.snap isn't available
        }
      }

      // 2. Trigger Midtrans Snap Popup
      if (typeof window !== "undefined" && window.snap) {
        window.snap.pay(result.snapToken, {
          onSuccess: () => {
            setIsProcessing(false);
            onClose();
            router.push(
              `/workspace/${weddingId}/settings?payment=success&orderId=${result.orderNumber}`
            );
            router.refresh();
          },
          onPending: () => {
            setIsProcessing(false);
            setStatusNotice({
              type: "pending",
              message:
                "Pembayaran tercatat. Silakan selesaikan pembayaran sesuai metode yang Anda pilih.",
              orderNumber: result.orderNumber,
              redirectUrl: result.redirectUrl,
            });
            router.refresh();
          },
          onError: () => {
            setIsProcessing(false);
            setErrorMessage(
              "Pembayaran tidak berhasil diselesaikan. Anda dapat mencoba metode pembayaran lain."
            );
          },
          onClose: () => {
            setIsProcessing(false);
            setStatusNotice({
              type: "info",
              message:
                "Jendela pembayaran ditutup. Anda dapat melanjutkannya kapan saja.",
              orderNumber: result.orderNumber,
              redirectUrl: result.redirectUrl,
            });
          },
        });
      } else if (result.redirectUrl) {
        // Fallback for popup-blockers or unsupported environments
        window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
        setIsProcessing(false);
        setStatusNotice({
          type: "pending",
          message: "Halaman pembayaran Midtrans telah dibuka di jendela baru.",
          orderNumber: result.orderNumber,
          redirectUrl: result.redirectUrl,
        });
      } else {
        setErrorMessage("Layanan pembayaran sedang tidak tersedia.");
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memulai pembayaran."
      );
      setIsProcessing(false);
    }
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
      <div
        className="bg-background border-border relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-prompt-title"
      >
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

          <h3
            id="upgrade-prompt-title"
            className="text-foreground text-2xl font-bold tracking-tight"
          >
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

        {/* Status Notice or Error Banner */}
        {errorMessage && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive my-3 flex items-start gap-2.5 rounded-xl border p-3 text-xs">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {statusNotice && (
          <div className="my-3 space-y-2 rounded-xl border border-amber-400/40 bg-amber-50/70 p-3.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{statusNotice.message}</span>
            </div>
            {statusNotice.orderNumber && (
              <p className="text-muted-foreground font-mono text-[11px]">
                No. Pesanan: {statusNotice.orderNumber}
              </p>
            )}
            {statusNotice.redirectUrl && (
              <a
                href={statusNotice.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-xs font-semibold underline hover:opacity-80"
              >
                <span>Buka Pembayaran Manual</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Pricing Box */}
        <div className="bg-primary/5 border-primary/20 my-4 rounded-2xl border p-4 text-center">
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
                <span>Menyiapkan Midtrans...</span>
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
