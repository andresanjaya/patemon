"use client";
import { Button } from "@/components/ui/button";

import { useState, useTransition } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { reconcileOrderAdminAction } from "../actions";
import type { AdminOrderDetail } from "../types";

interface AdminOrderReconcileCardProps {
  weddingId: string;
  orders: AdminOrderDetail[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminOrderReconcileCard({
  weddingId,
  orders,
}: AdminOrderReconcileCardProps) {
  const [reconcilingOrderId, setReconcilingOrderId] = useState<string | null>(
    null
  );
  const [resultMsg, setResultMsg] = useState<{
    orderId: string;
    success: boolean;
    message: string;
    correlationId?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReconcile = (orderId: string, orderNumber: string) => {
    setReconcilingOrderId(orderId);
    setResultMsg(null);

    startTransition(async () => {
      const res = await reconcileOrderAdminAction({
        orderId,
        weddingId,
        reason: `Manual admin reconciliation trigger for order ${orderNumber}`,
      });

      setReconcilingOrderId(null);
      if (res.success) {
        setResultMsg({
          orderId,
          success: true,
          message: `Pembayaran berhasil diverifikasi. Lisensi akses 365 hari aktif untuk workspace ini.`,
          correlationId: res.correlationId,
        });
      } else {
        setResultMsg({
          orderId,
          success: false,
          message: res.error || "Gagal memverifikasi pembayaran manual.",
          correlationId: res.correlationId,
        });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "settlement":
      case "capture":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Lunas (Settlement)
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3 w-3" />
            Menunggu (Pending)
          </span>
        );
      case "cancel":
      case "expire":
      case "deny":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
            <XCircle className="h-3 w-3" />
            Gagal/Expired ({status})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
            <AlertCircle className="h-3 w-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="workspace-card p-5">
      <div className="border-border -mx-5 -mt-5 mb-5 flex items-center justify-between border-b p-5">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <span>Riwayat Pesanan Pembayaran ({orders.length})</span>
          </h3>
          <p className="mt-1 text-xs text-stone-600">
            Daftar pesanan pembayaran manual (Transfer BCA &amp; QRIS) untuk
            workspace ini. Klik tombol untuk verifikasi dan aktivasi akses
            penuh.
          </p>
        </div>
      </div>

      {resultMsg && (
        <div
          className={`mt-4 rounded-lg border p-3 text-xs ${
            resultMsg.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="font-semibold">{resultMsg.message}</p>
          {resultMsg.correlationId && (
            <p className="mt-1 font-mono text-[11px] opacity-80">
              Correlation ID: {resultMsg.correlationId}
            </p>
          )}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500">
          Belum ada pesanan pembayaran yang dibuat untuk workspace ini.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 font-semibold tracking-wider text-stone-600 uppercase">
              <tr>
                <th className="px-3 py-2.5">Nomor Order</th>
                <th className="px-3 py-2.5">Nominal</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Metode</th>
                <th className="px-3 py-2.5">Waktu Order</th>
                <th className="px-3 py-2.5 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="transition-colors hover:bg-stone-50/70"
                >
                  <td className="px-3 py-3 font-mono font-medium text-stone-900">
                    {o.orderNumber}
                  </td>
                  <td className="px-3 py-3 font-semibold text-stone-900">
                    {formatRupiah(o.amount)}
                  </td>
                  <td className="px-3 py-3">{getStatusBadge(o.status)}</td>
                  <td className="px-3 py-3 text-stone-600 capitalize">
                    {o.paymentType || "-"}
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px] text-stone-500">
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      variant={o.status === "pending" ? "default" : "outline"}
                      size={null}
                      type="button"
                      disabled={isPending && reconcilingOrderId === o.id}
                      onClick={() => handleReconcile(o.id, o.orderNumber)}
                      className="gap-1.5 px-2.5 py-1 text-xs shadow-sm"
                      title="Verifikasi pembayaran transfer dan aktifkan lisensi akses 365 hari"
                    >
                      {o.status === "pending" ? (
                        <CheckCircle2
                          className={`h-3 w-3 ${
                            isPending && reconcilingOrderId === o.id
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      ) : (
                        <RefreshCw
                          className={`h-3 w-3 text-stone-500 ${
                            isPending && reconcilingOrderId === o.id
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      )}
                      <span>
                        {isPending && reconcilingOrderId === o.id
                          ? "Memproses..."
                          : o.status === "pending"
                            ? "Verifikasi & Aktifkan Akses"
                            : "Verifikasi Ulang"}
                      </span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
