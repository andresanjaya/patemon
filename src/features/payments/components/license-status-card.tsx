"use client";

import { useState } from "react";
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
import {
  cancelPendingOrderAction,
  reconcileOrderStatusAction,
} from "../orders";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const getStatusBadge = () => {
    switch (entitlement.status) {
      case "active":
        return (
          <Badge className="bg-emerald-600 text-xs text-white">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Lisensi Aktif
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="border-blue-400 text-xs text-blue-700 dark:text-blue-300"
          >
            <Clock className="mr-1 h-3.5 w-3.5" />
            Arsip Baca-Saja
          </Badge>
        );
      case "free_preview":
      default:
        return (
          <Badge
            variant="secondary"
            className="text-xs text-amber-800 dark:text-amber-300"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Free Preview
          </Badge>
        );
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Lisensi & Hak Akses Pawiwahan
                </CardTitle>
                <CardDescription className="text-xs">
                  Status aktivasi fitur, hak kolaborasi keluarga, dan masa
                  berlaku workspace
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {actionError && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-xl border p-3 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
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

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isReconciling}
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleReconcileStatus(latestOrder.orderNumber)}
                >
                  {isReconciling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  <span>Cek Status Pembayaran</span>
                </Button>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setIsModalOpen(true)}
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
                {entitlement.canEdit ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span>
                  {entitlement.canEdit
                    ? "Edit & Simpan Data Aktif"
                    : "Mode Baca Saja (Terkunci)"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {entitlement.canInviteMembers ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span>
                  {entitlement.canInviteMembers
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

          {/* Upgrade / Activation Callout if not active */}
          {!entitlement.isPaid &&
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
                  onClick={() => setIsModalOpen(true)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Aktivasi Sekarang</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

          {/* Order History Table */}
          {orderHistory.length > 0 && (
            <div className="border-border/70 space-y-3 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Receipt className="text-primary h-4 w-4" />
                <h4 className="text-foreground text-xs font-semibold">
                  Riwayat Transaksi & Pembayaran Midtrans
                </h4>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradePromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weddingId={weddingId}
        coupleNames={coupleNames}
      />
    </>
  );
}
