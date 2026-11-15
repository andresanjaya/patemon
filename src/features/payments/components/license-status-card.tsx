"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Receipt,
  XCircle,
  RefreshCw,
  Loader2,
  MessageCircle,
  AlertTriangle,
  Archive,
  Info,
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
import { UpgradePromptModal } from "./upgrade-prompt-modal";
import { DigitalReceiptModal } from "./digital-receipt-modal";
import { CustomerSupportModal } from "./customer-support-modal";
import {
  cancelPendingOrderAction,
  reconcileOrderStatusAction,
} from "../orders";
import { calculateAccessStateDetails, type SupportCategory } from "../support";
import { formatRupiah } from "@/features/workspaces/validation";
import type { WorkspaceEntitlement, CheckoutOrder } from "../types";

interface LicenseStatusCardProps {
  entitlement: WorkspaceEntitlement;
  weddingId: string;
  coupleNames?: string;
  latestOrder?: CheckoutOrder | null;
  orderHistory?: CheckoutOrder[];
}

export function LicenseStatusCard({
  entitlement,
  weddingId,
  coupleNames,
  latestOrder,
  orderHistory = [],
}: LicenseStatusCardProps) {
  const router = useRouter();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] =
    useState<CheckoutOrder | null>(null);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] =
    useState<SupportCategory>("payment_issue");
  const [supportOrderNumber, setSupportOrderNumber] = useState<
    string | undefined
  >(undefined);

  const [isCancelling, setIsCancelling] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const accessDetails = calculateAccessStateDetails(entitlement);

  const handleOpenSupport = (
    cat: SupportCategory = "payment_issue",
    orderNum?: string
  ) => {
    setSupportCategory(cat);
    setSupportOrderNumber(orderNum || latestOrder?.orderNumber);
    setIsSupportModalOpen(true);
  };

  const handleOpenReceipt = (order: CheckoutOrder) => {
    setSelectedReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  const handleReconcileStatus = async (orderNumber: string) => {
    setIsReconciling(true);
    setActionError(null);
    try {
      const res = await reconcileOrderStatusAction(weddingId, orderNumber);
      if (res.success) {
        router.refresh();
      } else {
        setActionError(res.error || "Gagal memperbarui status transaksi.");
      }
    } catch {
      setActionError(
        "Terjadi kesalahan sistem saat memeriksa status transaksi."
      );
    } finally {
      setIsReconciling(false);
    }
  };

  const handleCancelPendingOrder = async (orderNumber: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin membatalkan transaksi yang sedang menunggu ini?"
      )
    ) {
      return;
    }

    setIsCancelling(true);
    setActionError(null);
    try {
      const res = await cancelPendingOrderAction(weddingId, orderNumber);
      if (res.success) {
        router.refresh();
      } else {
        setActionError(res.error || "Gagal membatalkan transaksi.");
      }
    } catch {
      setActionError("Terjadi kesalahan sistem saat membatalkan transaksi.");
    } finally {
      setIsCancelling(false);
    }
  };

  const renderOrderStatusBadge = (status: CheckoutOrder["status"]) => {
    switch (status) {
      case "settlement":
        return (
          <Badge className="bg-emerald-600 text-[10px] text-white">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Berhasil
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="text-[10px] text-amber-700 dark:text-amber-300"
          >
            <Clock className="mr-1 h-3 w-3" />
            Menunggu
          </Badge>
        );
      case "cancel":
        return (
          <Badge
            variant="outline"
            className="border-border text-muted-foreground text-[10px]"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Dibatalkan
          </Badge>
        );
      case "expire":
        return (
          <Badge
            variant="outline"
            className="border-border text-muted-foreground text-[10px]"
          >
            <Clock className="mr-1 h-3 w-3" />
            Kedaluwarsa
          </Badge>
        );
      case "deny":
      default:
        return (
          <Badge variant="destructive" className="text-[10px]">
            Ditolak
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Lisensi & Hak Akses Pawiwahan
                </CardTitle>
                <CardDescription className="text-xs">
                  Status aktivasi fitur, hak kolaborasi keluarga, kuitansi
                  digital, dan kedaulatan data workspace
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Badge className={`text-xs ${accessDetails.badgeClass}`}>
                {accessDetails.badgeLabel}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenSupport("other")}
                className="text-muted-foreground hover:text-foreground h-7 gap-1 text-[11px]"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bantuan</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {actionError && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Access State Alert Banners */}
          {accessDetails.state === "critical_expiring" && (
            <div className="flex items-start gap-3 rounded-2xl border border-orange-500/40 bg-orange-50/70 p-4 text-xs text-orange-900 dark:bg-orange-950/30 dark:text-orange-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Masa Aktif Perencanaan Berakhir dalam{" "}
                  {accessDetails.daysRemaining} Hari
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {accessDetails.description} Seluruh data Anda dijamin tidak
                  pernah dihapus dan dapat diakses serta diekspor ke CSV/JSON
                  kapan saja.
                </p>
              </div>
            </div>
          )}

          {accessDetails.state === "expiring_soon" && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-50/60 p-4 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Pengingat Masa Aktif Workspace
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Tersisa {accessDetails.daysRemaining} hari masa aktif editing
                  bersama panitia. Setelah itu workspace otomatis bertransisi ke
                  Mode Arsip Permanen.
                </p>
              </div>
            </div>
          )}

          {accessDetails.state === "expired_archive" && (
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-blue-500/40 bg-blue-50/70 p-4 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              <div className="flex items-start gap-3">
                <Archive className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    Mode Arsip Pasca-Upacara Aktif (Data Sovereignty)
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Pawiwahan Anda telah selesai. Semua rincian upacara, banten,
                    catatan anggaran, dan buku tamu tersimpan utuh dan dapat
                    Anda lihat serta unduh cadangannya kapan saja.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="h-8 shrink-0 border-blue-400 text-xs text-blue-700 hover:bg-blue-100/50 dark:text-blue-300"
              >
                <span>Perpanjang Akses Edit</span>
              </Button>
            </div>
          )}

          {accessDetails.state === "revoked" && (
            <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-start justify-between gap-4 rounded-2xl border p-4 text-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    Lisensi Workspace Ditangguhkan
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Akses fitur kolaborasi dinonaktifkan. Anda tetap dapat
                    mengunduh data cadangan offline. Silakan hubungi tim bantuan
                    jika ini terjadi karena kekeliruan.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleOpenSupport("license_activation")}
                className="h-8 shrink-0 gap-1.5 text-xs"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Hubungi Bantuan</span>
              </Button>
            </div>
          )}

          {/* Pending Order Notice Banner */}
          {latestOrder &&
            latestOrder.status === "pending" &&
            !entitlement.isPaid && (
              <div className="space-y-3 rounded-xl border border-amber-400/40 bg-amber-50/70 p-4 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>Menunggu Pembayaran</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Pesanan #{latestOrder.orderNumber} (
                      {formatRupiah(latestOrder.amount)}) sedang diproses di
                      Midtrans.
                    </p>
                  </div>

                  <Badge
                    variant="secondary"
                    className="border-amber-400/50 text-[10px]"
                  >
                    Pending Midtrans
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isReconciling}
                    className="h-8 gap-1.5 text-xs"
                    onClick={() =>
                      handleReconcileStatus(latestOrder.orderNumber)
                    }
                  >
                    {isReconciling ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span>Cek Status Pembayaran</span>
                  </Button>

                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setIsUpgradeModalOpen(true)}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Lanjutkan Pembayaran</span>
                  </Button>

                  {latestOrder.snapRedirectUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      asChild
                    >
                      <a
                        href={latestOrder.snapRedirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Buka Midtrans Snap</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isCancelling}
                    className="text-muted-foreground hover:text-destructive h-8 gap-1.5 text-xs"
                    onClick={() =>
                      handleCancelPendingOrder(latestOrder.orderNumber)
                    }
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Batalkan Pesanan</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleOpenSupport(
                        "payment_issue",
                        latestOrder.orderNumber
                      )
                    }
                    className="text-muted-foreground hover:text-foreground h-8 gap-1 text-xs"
                  >
                    <MessageCircle className="h-3 w-3 text-emerald-600" />
                    <span>Bantuan Transaksi</span>
                  </Button>
                </div>
              </div>
            )}

          {/* Plan Info Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-border/70 bg-card space-y-1 rounded-xl border p-3.5">
              <span className="text-muted-foreground text-[11px]">
                Paket Akses
              </span>
              <p className="text-foreground text-sm font-bold">
                {entitlement.planName}
              </p>
            </div>

            <div className="border-border/70 bg-card space-y-1 rounded-xl border p-3.5">
              <span className="text-muted-foreground text-[11px]">
                Tanggal Aktivasi
              </span>
              <p className="text-foreground text-sm font-semibold">
                {entitlement.grantedAt
                  ? new Date(entitlement.grantedAt).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : "Belum Diaktivasi"}
              </p>
            </div>

            <div className="border-border/70 bg-card space-y-1 rounded-xl border p-3.5">
              <span className="text-muted-foreground text-[11px]">
                Masa Berlaku
              </span>
              <p className="text-foreground text-sm font-semibold">
                {entitlement.validUntil
                  ? new Date(entitlement.validUntil).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : entitlement.status === "active"
                    ? "Seumur Hidup (Lifetime)"
                    : entitlement.status === "expired"
                      ? "Arsip Permanen"
                      : "Mode Pratinjau"}
              </p>
            </div>
          </div>

          {/* Capabilities Matrix */}
          <div className="border-border/70 bg-muted/20 space-y-3 rounded-xl border p-4">
            <span className="text-foreground text-xs font-semibold">
              Rincian Kapabilitas Workspace:
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-xs">
                {accessDetails.canEdit ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span>
                  {accessDetails.canEdit
                    ? "Edit & Simpan Data Aktif"
                    : "Mode Baca Saja (Terkunci)"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {accessDetails.canInviteMembers ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span>
                  {accessDetails.canInviteMembers
                    ? "Undang Tim Keluarga (Aktif)"
                    : "Undang Keluarga (Terkunci)"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Ekspor CSV & JSON (Selamanya)</span>
              </div>
            </div>
          </div>

          {/* Paid / Active Workspace Callout (Issue #77) */}
          {entitlement.isPaid && (
            <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/60 p-4 text-xs sm:flex-row sm:items-center sm:justify-between dark:bg-emerald-950/20">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                    Akses Kolaborasi Penuh Aktif
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Semua modul perencanaan pawiwahan siap digunakan bersama
                    keluarga.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                asChild
                className="shrink-0 gap-1.5 font-medium"
              >
                <Link href={`/workspace/${weddingId}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Buka Dashboard</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Upgrade / Activation Callout if not active */}
          {!entitlement.isPaid &&
            accessDetails.state !== "expired_archive" &&
            (!latestOrder || latestOrder.status !== "pending") && (
              <div className="border-border/80 from-primary/10 to-primary/10 flex flex-col gap-4 rounded-xl border bg-gradient-to-r via-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h4 className="text-foreground text-sm font-semibold">
                    Buka Akses Penuh Pawiwahan Anda
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    Dapatkan hak mengundang keluarga, koordinasi vendor, dan
                    penyimpanan permanen hanya Rp 199.000 sekali bayar.
                  </p>
                </div>

                <Button
                  size="sm"
                  className="shrink-0 gap-2 text-xs"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Aktivasi Sekarang</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

          {/* Order History Table with Digital Receipt Integration */}
          {orderHistory.length > 0 && (
            <div className="border-border/70 space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="text-primary h-4 w-4" />
                  <h4 className="text-foreground text-xs font-semibold">
                    Riwayat Transaksi & Pembayaran Midtrans
                  </h4>
                </div>

                <span className="text-muted-foreground text-[11px]">
                  {orderHistory.length} Transaksi Tercatat
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-border/60 text-muted-foreground border-b text-[11px]">
                      <th className="pb-2 font-medium">No. Pesanan</th>
                      <th className="pb-2 font-medium">Tanggal</th>
                      <th className="pb-2 font-medium">Nominal</th>
                      <th className="pb-2 font-medium">Metode</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/40 divide-y">
                    {orderHistory.map((order) => (
                      <tr key={order.id} className="text-[11px]">
                        <td className="text-foreground py-2.5 font-mono font-medium">
                          {order.orderNumber}
                        </td>
                        <td className="text-muted-foreground py-2.5">
                          {new Date(order.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                        <td className="text-foreground py-2.5 font-semibold">
                          {formatRupiah(order.amount)}
                        </td>
                        <td className="text-muted-foreground py-2.5 capitalize">
                          {order.paymentType || "Snap Checkout"}
                        </td>
                        <td className="py-2.5">
                          {renderOrderStatusBadge(order.status)}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.status === "settlement" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReceipt(order)}
                                className="text-primary hover:bg-primary/10 border-primary/30 h-6 gap-1 px-2 text-[10px]"
                              >
                                <Receipt className="h-3 w-3" />
                                <span>Kuitansi</span>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleOpenSupport(
                                    "payment_issue",
                                    order.orderNumber
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground h-6 gap-1 px-2 text-[10px]"
                              >
                                <MessageCircle className="h-3 w-3 text-emerald-600" />
                                <span>Bantuan</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Checkout Modal */}
      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        weddingId={weddingId}
        coupleNames={coupleNames}
      />

      {/* Official Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceiptOrder(null);
        }}
        order={selectedReceiptOrder}
        weddingId={weddingId}
        coupleNames={coupleNames}
        onOpenSupport={(ordNum) => {
          setIsReceiptModalOpen(false);
          handleOpenSupport("license_activation", ordNum);
        }}
      />

      {/* Contextual WhatsApp Customer Support Modal */}
      <CustomerSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        weddingId={weddingId}
        coupleNames={coupleNames}
        orderNumber={supportOrderNumber}
        defaultCategory={supportCategory}
      />
    </>
  );
}
