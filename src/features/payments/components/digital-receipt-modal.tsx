"use client";

import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/features/workspaces/validation";
import { formatReceiptNumber } from "../support";
import type { CheckoutOrder } from "../types";

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CheckoutOrder | null;
  weddingId: string;
  coupleNames?: string;
  onOpenSupport?: (orderNumber?: string) => void;
}

export function DigitalReceiptModal({
  isOpen,
  onClose,
  order,
  weddingId,
  coupleNames,
  onOpenSupport,
}: DigitalReceiptModalProps) {
  if (!isOpen || !order) return null;

  const receiptNumber = formatReceiptNumber(order.orderNumber);

  // Format transaction timestamp in Indonesian WITA time
  const transactionDate = order.settlementTime || order.createdAt;
  const formattedDate = new Date(transactionDate).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs print:relative print:bg-transparent print:p-0">
      {/* Printable Receipt Container */}
      <div className="bg-background border-border relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border p-6 shadow-2xl sm:p-8 print:max-h-none print:max-w-none print:border-none print:p-0 print:shadow-none">
        {/* Modal Close Button (hidden during print) */}
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-md p-1 transition-colors print:hidden"
          aria-label="Tutup Kuitansi"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Header of Receipt */}
        <div className="border-border/70 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-primary font-serif text-xl font-bold tracking-wider">
                PATEMON
              </span>
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/5 text-primary text-[10px]"
              >
                Bali Hindu Wedding
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Sistem Manajemen & Perencanaan Pawiwahan Hindu Bali
            </p>
            <p className="text-muted-foreground text-[10px]">
              Platform: patemon.app · Dilisensikan untuk Penggunaan Privat
            </p>
          </div>

          <div className="space-y-1 text-left sm:text-right">
            <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Bukti Pembayaran Resmi
            </span>
            <p className="text-foreground font-mono text-sm font-bold">
              {receiptNumber}
            </p>
            <Badge className="bg-emerald-600 text-[10px] text-white">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              LUNAS / VERIFIED
            </Badge>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="border-border/60 bg-muted/20 mt-6 grid grid-cols-1 gap-4 rounded-2xl border p-4 text-xs sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-muted-foreground text-[11px]">
              No. Pesanan Midtrans:
            </span>
            <p className="text-foreground font-mono font-semibold">
              {order.orderNumber}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-[11px]">
              Waktu Transaksi (WITA):
            </span>
            <p className="text-foreground flex items-center gap-1.5 font-medium">
              <Calendar className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span>{formattedDate}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-[11px]">
              Mempelai / Pawiwahan:
            </span>
            <p className="text-foreground font-medium">
              {coupleNames || "Workspace Pawiwahan"}
            </p>
            <p className="text-muted-foreground font-mono text-[10px]">
              ID: {weddingId}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-[11px]">
              Metode Pembayaran:
            </span>
            <p className="text-foreground flex items-center gap-1.5 font-medium capitalize">
              <CreditCard className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span>{order.paymentType || "Midtrans Snap (QRIS/VA)"}</span>
            </p>
          </div>
        </div>

        {/* Item Breakdown Table */}
        <div className="mt-6 space-y-3">
          <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
            Rincian Pembelian Lisensi
          </h4>
          <div className="border-border/70 overflow-hidden rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-border/70 text-muted-foreground border-b text-[11px]">
                <tr>
                  <th className="p-3 font-semibold">Item & Layanan</th>
                  <th className="p-3 text-center font-semibold">Qty</th>
                  <th className="p-3 text-right font-semibold">Harga</th>
                  <th className="p-3 text-right font-semibold">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                <tr>
                  <td className="space-y-1 p-3">
                    <p className="text-foreground font-bold">
                      Lisensi Akses Penuh Pawiwahan Patemon
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Aktivasi kolaborasi keluarga (hingga 15 anggota),
                      kustomisasi rangkaian 30+ banten pawiwahan, buku anggaran
                      adat, rundown panitia hari-H, dan arsip seumur hidup.
                    </p>
                  </td>
                  <td className="p-3 text-center font-medium">1</td>
                  <td className="text-muted-foreground p-3 text-right font-mono">
                    {formatRupiah(order.amount)}
                  </td>
                  <td className="text-foreground p-3 text-right font-mono font-bold">
                    {formatRupiah(order.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-muted/30 border-border/70 border-t">
                <tr>
                  <td
                    colSpan={3}
                    className="text-foreground p-3 text-right font-semibold"
                  >
                    Total Pembayaran:
                  </td>
                  <td className="text-primary p-3 text-right font-mono text-base font-extrabold">
                    {formatRupiah(order.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Authentic Digital Stamp Seal */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <p className="text-foreground font-bold">
                Transaksi Sah & Terverifikasi Midtrans
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tanda tangan kriptografis SHA-512 terverifikasi. Sesuai prinsip
                kedaulatan data Patemon, seluruh data upacara tersimpan aman
                selamanya.
              </p>
            </div>
          </div>

          <div className="shrink-0 rotate-[-3deg] rounded-xl border-2 border-dashed border-emerald-600/70 px-4 py-2 text-center">
            <span className="block font-mono text-[9px] tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
              PATEMON VERIFIED
            </span>
            <span className="block text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
              LUNAS
            </span>
            <span className="block font-mono text-[8px] text-emerald-600">
              ID: {order.orderNumber.slice(-8)}
            </span>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak / Simpan PDF</span>
          </Button>

          <div className="flex items-center gap-2">
            {onOpenSupport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenSupport(order.orderNumber)}
                className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Ada Pertanyaan?</span>
              </Button>
            )}

            <Button size="sm" onClick={onClose} className="text-xs">
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
