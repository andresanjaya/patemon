"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Check,
  X,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  Building2,
  MessageCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MVP_WEDDING_PRICE_IDR,
  MVP_WEDDING_ORIGINAL_PRICE_IDR,
  PAYMENT_CONFIG,
} from "../pricing";
import { formatRupiah } from "@/features/workspaces/validation";
import { submitManualPaymentRequestAction } from "../orders";
import type { ManualPaymentMethod } from "../types";

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  coupleNames?: string;
  title?: string;
  description?: string;
  isPendingPayment?: boolean;
  isViewerOnly?: boolean;
}

export function UpgradePromptModal({
  isOpen,
  onClose,
  weddingId,
  coupleNames,
  title,
  description,
  isPendingPayment,
  isViewerOnly,
}: UpgradePromptModalProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<ManualPaymentMethod>("manual_bca");
  const [senderName, setSenderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"account" | "amount" | null>(
    null
  );
  const [pendingNotice, setPendingNotice] = useState<{
    orderNumber: string;
    whatsappUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  const modalTitle =
    title ||
    (isViewerOnly
      ? "Akses Lihat Saja"
      : isPendingPayment
        ? "Konfirmasi Pembayaran Pawiwahan"
        : "Aktivasi Akses Penuh Pawiwahan");

  const modalDescription =
    description ||
    (isViewerOnly
      ? "Akun Anda memiliki akses lihat saja. Hubungi pemilik ruang kerja untuk meminta izin mengubah data."
      : isPendingPayment
        ? "Pembayaran Anda sedang menunggu verifikasi Master Admin. Hubungi kami via WhatsApp untuk aktivasi cepat."
        : "Satu kali pembayaran untuk seluruh rangkaian prosesi adat Bali hingga hari-H selesai. Akses diaktifkan langsung oleh Master Admin.");

  const handleCopy = (text: string, field: "account" | "amount") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleConfirmViaWhatsApp = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (weddingId === "demo") {
        const methodLabel =
          selectedMethod === "manual_bca" ? "Transfer Bank BCA" : "QRIS";
        const senderText = senderName.trim()
          ? `\nNama Pengirim: ${senderName.trim()}`
          : "";
        const message = encodeURIComponent(
          `Halo Master Admin Patemon (Bli Andre), saya ingin aktivasi Akses Penuh Pawiwahan (Rp 199.000) melalui ${methodLabel}.${senderText}\n\nMohon petunjuk konfirmasi pembayaran dan aktivasi ruang kerja pawiwahan saya.`
        );
        const waUrl = `https://wa.me/${PAYMENT_CONFIG.adminWhatsApp}?text=${message}`;
        setPendingNotice({
          orderNumber: "DEMO-ACTIVATION",
          whatsappUrl: waUrl,
        });
        window.open(waUrl, "_blank", "noopener,noreferrer");
        setIsSubmitting(false);
        return;
      }

      const result = await submitManualPaymentRequestAction({
        weddingId,
        paymentMethod: selectedMethod,
        senderName: senderName.trim() || undefined,
      });

      if (!result.success || !result.whatsappUrl) {
        setErrorMessage(
          result.error ||
            "Gagal membuat pesanan pembayaran. Silakan coba kembali."
        );
        setIsSubmitting(false);
        return;
      }

      setPendingNotice({
        orderNumber: result.orderNumber || "PATEMON-ORDER",
        whatsappUrl: result.whatsappUrl,
      });

      // Open WhatsApp chat in a new window/tab
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      setIsSubmitting(false);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses konfirmasi pembayaran."
      );
      setIsSubmitting(false);
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
        className="bg-background border-border relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-prompt-title"
      >
        {/* Modal Top Fixed Header */}
        <div className="border-border/80 bg-background shrink-0 border-b px-6 py-4 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary gap-1 px-2.5 py-0.5 text-[11px]"
              >
                <Sparkles className="h-3 w-3" />
                <span>Aktivasi Akses Penuh Pawiwahan</span>
              </Badge>

              <h3
                id="upgrade-prompt-title"
                className="text-foreground text-xl font-bold tracking-tight sm:text-2xl"
              >
                {modalTitle}
              </h3>

              {coupleNames && (
                <p className="text-primary text-xs font-semibold">
                  Workspace: {coupleNames}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:border-border shrink-0 cursor-pointer rounded-md border border-transparent p-1.5 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4 sm:px-8">
          <p className="text-muted-foreground text-xs leading-relaxed">
            {modalDescription}
          </p>

          {/* Pricing Box */}
          <div className="bg-primary/5 border-primary/20 rounded-2xl border p-4 text-center">
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
            <span className="text-muted-foreground block pt-1 text-[11px]">
              Bayar 1x untuk 365 hari penuh · Tanpa biaya langganan berulang
            </span>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-xl border p-3 text-xs">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Pending Notice (After Request / Pre-existing) */}
          {(pendingNotice || isPendingPayment) && (
            <div className="space-y-2 rounded-2xl border border-amber-400/60 bg-amber-50/95 p-3.5 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Menunggu Verifikasi Master Admin</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/80">
                Pesanan telah dicatat{" "}
                {pendingNotice?.orderNumber && (
                  <strong className="font-mono">
                    ({pendingNotice.orderNumber})
                  </strong>
                )}
                . Silakan kirimkan bukti transfer melalui WhatsApp agar Master
                Admin dapat segera mengaktifkan akses penuh ruang kerja Anda.
              </p>
              {pendingNotice?.whatsappUrl && (
                <a
                  href={pendingNotice.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-emerald-700 underline hover:opacity-80 dark:text-emerald-400"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Buka WhatsApp Konfirmasi</span>
                </a>
              )}
            </div>
          )}

          {/* Direct Payment Menu (Always Available: BCA & QRIS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground block text-xs font-semibold">
                Pilih Metode Pembayaran:
              </span>
              <span className="text-muted-foreground text-[11px]">
                Verifikasi 1-on-1 via WhatsApp
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod("manual_bca")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  selectedMethod === "manual_bca"
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Transfer Bank BCA</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod("manual_qris")}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  selectedMethod === "manual_qris"
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>QRIS (Semua E-Wallet)</span>
              </button>
            </div>

            {/* Payment Details Card */}
            {selectedMethod === "manual_bca" ? (
              <div className="border-border/80 bg-muted/30 space-y-3 rounded-2xl border p-4 text-xs">
                <div className="border-border/60 flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Bank Tujuan
                  </span>
                  <span className="text-foreground font-bold">
                    {PAYMENT_CONFIG.bca.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Nomor Rekening
                    </span>
                    <span className="text-foreground font-mono text-sm font-bold tracking-wider">
                      {PAYMENT_CONFIG.bca.accountNumber}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(PAYMENT_CONFIG.bca.accountNumber, "account")
                    }
                    className="h-7 cursor-pointer gap-1 px-2.5 text-[11px]"
                  >
                    {copiedField === "account" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Salin No. Rek</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">
                    Atas Nama
                  </span>
                  <span className="text-foreground font-semibold">
                    {PAYMENT_CONFIG.bca.accountHolder}
                  </span>
                </div>
                <div className="border-border/60 flex items-center justify-between border-t pt-2">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Jumlah Transfer Tepat
                    </span>
                    <span className="text-primary text-sm font-bold">
                      {formatRupiah(MVP_WEDDING_PRICE_IDR)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(MVP_WEDDING_PRICE_IDR.toString(), "amount")
                    }
                    className="h-7 cursor-pointer gap-1 px-2.5 text-[11px]"
                  >
                    {copiedField === "amount" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Salin Nominal</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-border/80 bg-muted/30 space-y-3 rounded-2xl border p-4 text-center text-xs">
                <div className="text-foreground flex items-center justify-center gap-1.5 font-semibold">
                  <QrCode className="text-primary h-4 w-4" />
                  <span>QRIS Standar Pembayaran Nasional</span>
                </div>
                <div className="border-primary/30 mx-auto flex h-32 w-32 items-center justify-center rounded-xl border bg-white p-2 shadow-inner">
                  <div className="flex flex-col items-center justify-center space-y-1 text-zinc-900">
                    <QrCode className="h-16 w-16 text-zinc-900" />
                    <span className="text-[10px] font-bold tracking-tight">
                      QRIS PATEMON
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Mendukung BCA Mobile, Mandiri Livin&apos;, BRImo, BNI Mobile,
                  GoPay, OVO, Dana, ShopeePay, LinkAja &amp; semua aplikasi
                  QRIS.
                </p>
                <div className="border-border/60 flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">Nominal Tepat:</span>
                  <span className="text-primary text-sm font-bold">
                    {formatRupiah(MVP_WEDDING_PRICE_IDR)}
                  </span>
                </div>
              </div>
            )}

            {/* Sender Name Input (Optional) */}
            <div className="space-y-1.5">
              <label
                htmlFor="sender-name-input"
                className="text-foreground block text-xs font-semibold"
              >
                Nama Pengirim / Pemilik Rekening{" "}
                <span className="text-muted-foreground font-normal">
                  (Opsional)
                </span>
              </label>
              <input
                id="sender-name-input"
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Contoh: I Putu Eka Sanjaya"
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary/30 w-full rounded-xl border px-3 py-2 text-xs focus:ring-2 focus:outline-hidden"
              />
              <p className="text-muted-foreground text-[10px]">
                Membantu Master Admin mencocokkan mutasi transfer Anda lebih
                cepat.
              </p>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="space-y-2 py-1">
            <span className="text-foreground text-xs font-semibold">
              Fitur yang akan langsung terbuka:
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
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

          {/* Verification Guarantee */}
          <div className="border-border/80 bg-muted/30 flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-[11px]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">
                Aktivasi langsung 365 hari oleh Master Admin
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600">
              Terverifikasi 1-on-1
            </span>
          </div>
        </div>

        {/* Modal Bottom Fixed Actions Footer */}
        <div className="border-border/80 bg-muted/10 flex shrink-0 flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row sm:px-8">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full text-xs sm:w-auto"
            disabled={isSubmitting}
          >
            Lanjutkan Pratinjau
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmViaWhatsApp}
            disabled={isSubmitting}
            className="w-full cursor-pointer gap-2 bg-emerald-600 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyiapkan Konfirmasi...</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Konfirmasi Pembayaran via WhatsApp</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
