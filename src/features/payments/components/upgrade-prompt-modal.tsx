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
    if (weddingId === "demo") return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-background border-border relative my-8 w-full max-w-lg rounded-3xl border p-6 shadow-2xl sm:p-8"
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
            {modalTitle}
          </h3>

          {coupleNames && (
            <p className="text-primary text-xs font-semibold">
              Workspace: {coupleNames}
            </p>
          )}

          <p className="text-muted-foreground text-xs leading-relaxed">
            {modalDescription}
          </p>
        </div>

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
          <span className="text-muted-foreground block text-[11px] pt-1">
            Bayar 1x untuk 365 hari penuh · Tanpa biaya langganan berulang
          </span>
        </div>

        {/* Demo Mode Notice */}
        {weddingId === "demo" ? (
          <div className="border-amber-300 bg-amber-50/90 text-amber-950 my-3 flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">
                Workspace Demo (Pratinjau Publik)
              </p>
              <p className="text-amber-800 leading-relaxed">
                Workspace demo ditujukan untuk melihat contoh perencanaan. Untuk
                mengaktifkan akses penuh dan menyimpan persiapan upacara
                pawiwahan Anda sendiri, silakan buat workspace pernikahan baru.
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="border-destructive/30 bg-destructive/10 my-3 flex items-start gap-2.5 rounded-xl border p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {/* Pending Notice (After Request / Pre-existing) */}
        {(pendingNotice || isPendingPayment) && (
          <div className="border-amber-400/60 bg-amber-50/95 dark:bg-amber-950/40 my-3 rounded-2xl border p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Menunggu Verifikasi Master Admin</span>
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
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
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 underline hover:opacity-80 text-xs pt-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Buka WhatsApp Konfirmasi</span>
              </a>
            )}
          </div>
        )}

        {weddingId !== "demo" && (
          <>
            {/* Payment Method Switcher */}
            <div className="my-3 space-y-2">
              <span className="text-foreground text-xs font-semibold block">
                Pilih Metode Pembayaran:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("manual_bca")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                    selectedMethod === "manual_bca"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Transfer Bank BCA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod("manual_qris")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                    selectedMethod === "manual_qris"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>QRIS (Semua E-Wallet)</span>
                </button>
              </div>
            </div>

            {/* Payment Details Card */}
            {selectedMethod === "manual_bca" ? (
              <div className="border-border/80 bg-muted/30 rounded-2xl border p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-muted-foreground font-medium">
                    Bank Tujuan
                  </span>
                  <span className="font-bold text-foreground">
                    {PAYMENT_CONFIG.bca.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Nomor Rekening
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground tracking-wider">
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
                    className="h-7 text-[11px] gap-1 px-2.5"
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
                  <span className="font-semibold text-foreground">
                    {PAYMENT_CONFIG.bca.accountHolder}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Jumlah Transfer Tepat
                    </span>
                    <span className="font-bold text-primary text-sm">
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
                    className="h-7 text-[11px] gap-1 px-2.5"
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
              <div className="border-border/80 bg-muted/30 rounded-2xl border p-4 space-y-3 text-xs text-center">
                <div className="flex items-center justify-center gap-1.5 font-semibold text-foreground">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>QRIS Standar Pembayaran Nasional</span>
                </div>
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-xl border border-primary/30 bg-white p-2 shadow-inner">
                  <div className="flex flex-col items-center justify-center text-zinc-900 space-y-1">
                    <QrCode className="h-16 w-16 text-zinc-900" />
                    <span className="text-[10px] font-bold tracking-tight">
                      QRIS PATEMON
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mendukung BCA Mobile, Mandiri Livin&apos;, BRImo, BNI Mobile,
                  GoPay, OVO, Dana, ShopeePay, LinkAja &amp; semua aplikasi QRIS.
                </p>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-muted-foreground">Nominal Tepat:</span>
                  <span className="font-bold text-primary text-sm">
                    {formatRupiah(MVP_WEDDING_PRICE_IDR)}
                  </span>
                </div>
              </div>
            )}

            {/* Sender Name Input (Optional) */}
            <div className="my-3 space-y-1.5">
              <label
                htmlFor="sender-name-input"
                className="text-foreground text-xs font-semibold block"
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
                className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full rounded-xl border px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground">
                Membantu Master Admin mencocokkan mutasi transfer Anda lebih
                cepat.
              </p>
            </div>
          </>
        )}

        {/* Features Checklist */}
        <div className="space-y-2 py-1 my-2">
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
        <div className="border-border/80 bg-muted/30 my-3 flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-[11px]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-muted-foreground">
              Aktivasi langsung 365 hari oleh Master Admin
            </span>
          </div>
          <span className="text-emerald-600 font-semibold text-[10px]">
            Terverifikasi 1-on-1
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
            disabled={isSubmitting}
          >
            Lanjutkan Pratinjau
          </Button>

          {weddingId === "demo" ? (
            <Button
              type="button"
              size="sm"
              asChild
              className="gap-2 bg-[#b45309] text-xs font-semibold text-white shadow-xs hover:bg-[#92400e]"
            >
              <Link href="/workspace/new">
                <span>Buat Workspace Baru</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmViaWhatsApp}
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyiapkan Konfirmasi...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Konfirmasi via WhatsApp</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
