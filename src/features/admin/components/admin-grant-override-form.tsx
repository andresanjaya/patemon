"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Ban,
  Info,
  AlertTriangle,
} from "lucide-react";
import { grantAccessOverrideAction, revokeAccessGrantAction } from "../actions";
import type { AdminAccessGrant } from "../types";

interface AdminGrantOverrideFormProps {
  weddingId: string;
  coupleNames: string;
  activeGrant: AdminAccessGrant | null;
}

export function AdminGrantOverrideForm({
  weddingId,
  coupleNames,
  activeGrant,
}: AdminGrantOverrideFormProps) {
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [showRevokeForm, setShowRevokeForm] = useState(false);

  // Grant form states
  const [reason, setReason] = useState("");
  const [referenceProof, setReferenceProof] = useState("");
  const [durationDays, setDurationDays] = useState(365);

  // Revoke form states
  const [revokeReason, setRevokeReason] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGrantOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (reason.trim().length < 10) {
      setError(
        "Alasan pemberian wajib diisi minimal 10 karakter untuk keperluan audit."
      );
      return;
    }
    if (referenceProof.trim().length < 3) {
      setError(
        "Nomor referensi / bukti pendukung wajib diisi minimal 3 karakter (misal: TF-BCA-8891)."
      );
      return;
    }

    startTransition(async () => {
      const res = await grantAccessOverrideAction({
        weddingId,
        reason: reason.trim(),
        referenceProof: referenceProof.trim(),
        durationDays: Number(durationDays),
      });

      if (!res.success) {
        setError(res.error || "Gagal memberikan akses manual override.");
      } else {
        setSuccessMsg(
          `Akses manual override berhasil diberikan selama ${durationDays} hari. ID Lisensi: ${res.grantId}`
        );
        setReason("");
        setReferenceProof("");
        setShowGrantForm(false);
      }
    });
  };

  const handleRevokeGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrant) return;

    setError(null);
    setSuccessMsg(null);

    if (revokeReason.trim().length < 10) {
      setError(
        "Alasan pencabutan wajib diisi minimal 10 karakter untuk keperluan audit."
      );
      return;
    }

    startTransition(async () => {
      const res = await revokeAccessGrantAction({
        grantId: activeGrant.id,
        weddingId,
        reason: revokeReason.trim(),
      });

      if (!res.success) {
        setError(res.error || "Gagal mencabut hak akses.");
      } else {
        setSuccessMsg(
          "Hak akses berhasil dicabut. Status lisensi kini revoked."
        );
        setRevokeReason("");
        setShowRevokeForm(false);
      }
    });
  };

  const [now] = useState(() => Date.now());

  const isAccessActive =
    activeGrant &&
    activeGrant.status === "active" &&
    (!activeGrant.validUntil ||
      new Date(activeGrant.validUntil).getTime() > now);

  return (
    <div className="workspace-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isAccessActive ? (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Akses Penuh Aktif
                {activeGrant?.grantType === "manual_override" &&
                  " (Pengecualian Admin)"}
                {activeGrant?.grantType === "promotional" && " (Promosional)"}
                {activeGrant?.grantType === "payment" && " (Order Berbayar)"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Mode Preview Gratis (Belum Ada Lisensi Aktif)
              </span>
            )}
          </div>

          <h3 className="mt-2 text-base font-semibold text-stone-900">
            Pengelolaan Lisensi & Pengecualian Akses (Access Grants)
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Digunakan untuk memberikan akses darurat/kompensasi atas kendala
            teknis gateway atau mencabut lisensi yang bermasalah.
          </p>

          {activeGrant && (
            <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3.5 text-xs text-stone-800">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-stone-500">
                    Tipe Lisensi:
                  </span>{" "}
                  <span className="font-semibold uppercase">
                    {activeGrant.grantType}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-stone-500">Status:</span>{" "}
                  <span className="font-semibold uppercase">
                    {activeGrant.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-stone-500">
                    Diberikan Oleh:
                  </span>{" "}
                  <span className="font-mono">
                    {activeGrant.grantedBy || "Sistem"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-stone-500">
                    Berlaku Sampai:
                  </span>{" "}
                  <span>
                    {activeGrant.validUntil
                      ? new Date(activeGrant.validUntil).toLocaleDateString(
                          "id-ID"
                        )
                      : "Permanen"}
                  </span>
                </div>
                {activeGrant.overrideReason && (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-stone-500">
                      Alasan Pengecualian:
                    </span>{" "}
                    <span className="italic">{activeGrant.overrideReason}</span>
                  </div>
                )}
                {activeGrant.referenceProof && (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-stone-500">
                      Bukti Referensi:
                    </span>{" "}
                    <span className="font-mono font-semibold text-amber-700">
                      {activeGrant.referenceProof}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAccessActive && (
            <button
              type="button"
              onClick={() => {
                setShowRevokeForm(!showRevokeForm);
                setShowGrantForm(false);
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50"
            >
              <Ban className="h-3.5 w-3.5 text-red-600" />
              <span>Cabut Lisensi</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowGrantForm(!showGrantForm);
              setShowRevokeForm(false);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            <Key className="h-3.5 w-3.5" />
            <span>Berikan Akses Manual (Override)</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Grant Override Form Modal / Drawer */}
      {showGrantForm && (
        <form
          onSubmit={handleGrantOverride}
          className="mt-6 rounded-lg border border-amber-300 bg-amber-50/70 p-4 transition-all"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Key className="h-4 w-4 text-amber-600" />
            <span>
              Form Pemberian Hak Akses Manual (Override) untuk {coupleNames}
            </span>
          </div>

          <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-white p-3 text-xs text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              <strong>Aturan Keuangan & Integritas:</strong> Tindakan ini
              menerbitkan hak akses{" "}
              <code className="font-mono text-amber-800">manual_override</code>{" "}
              langsung ke workspace tanpa memanipulasi status order pembayaran
              menjadi settled. Rekonsiliasi keuangan gerbang pembayaran tetap
              bersih dan transparan.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="duration-days"
                className="block text-xs font-semibold text-stone-700"
              >
                Durasi Akses (Hari):
              </label>
              <select
                id="duration-days"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="mt-1.5 w-full rounded-md border border-stone-300 bg-white p-2 text-xs text-stone-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value={30}>30 Hari (Dukungan Cepat)</option>
                <option value={90}>90 Hari (3 Bulan Persiapan)</option>
                <option value={180}>180 Hari (6 Bulan Persiapan)</option>
                <option value={365}>365 Hari (Standar 1 Tahun Penuh)</option>
                <option value={540}>540 Hari (Maksimal 18 Bulan)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ref-proof"
                className="block text-xs font-semibold text-stone-700"
              >
                Nomor Bukti / Tiket Referensi (Min 3 Karakter):
              </label>
              <input
                id="ref-proof"
                type="text"
                value={referenceProof}
                onChange={(e) => setReferenceProof(e.target.value)}
                placeholder="Misal: WA-PAY-20261115-01 atau TIKET-SUP-401"
                className="mt-1.5 w-full rounded-md border border-stone-300 bg-white p-2 text-xs text-stone-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="grant-reason"
                className="block text-xs font-semibold text-stone-700"
              >
                Alasan Pengecualian Operasional (Audit Trail, Min 10 Karakter):
              </label>
              <textarea
                id="grant-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan alasan mengapa akses manual diberikan (misal: kendala teknis gateway pembayaran saat acara H-1, bukti transfer bank manual telah diverifikasi oleh tim support)."
                className="mt-1.5 w-full rounded-md border border-stone-300 bg-white p-2.5 text-xs text-stone-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setShowGrantForm(false);
                setError(null);
              }}
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
            >
              {isPending
                ? "Menerbitkan Lisensi..."
                : "Terbitkan Akses Override"}
            </button>
          </div>
        </form>
      )}

      {/* Revoke Form */}
      {showRevokeForm && activeGrant && (
        <form
          onSubmit={handleRevokeGrant}
          className="mt-6 rounded-lg border border-red-300 bg-red-50/70 p-4 transition-all"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>Konfirmasi Pencabutan Hak Akses untuk {coupleNames}</span>
          </div>

          <p className="mt-1 text-xs text-stone-600">
            Tindakan ini akan mengembalikan status lisensi menjadi revoked
            sehingga pengguna kembali ke mode Preview Gratis.
          </p>

          <div className="mt-3">
            <label
              htmlFor="revoke-reason"
              className="block text-xs font-semibold text-stone-700"
            >
              Alasan Pencabutan (Wajib diisi di Audit Log, min 10 karakter):
            </label>
            <textarea
              id="revoke-reason"
              rows={2}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Contoh: Refund atas permintaan pelanggan yang telah disetujui tim keuangan."
              className="mt-1.5 w-full rounded-md border border-stone-300 bg-white p-2.5 text-xs text-stone-900 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setShowRevokeForm(false);
                setError(null);
              }}
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Mencabut..." : "Ya, Cabut Hak Akses"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
