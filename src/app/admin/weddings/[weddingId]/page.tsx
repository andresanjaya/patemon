import Link from "next/link";
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Hash,
  ExternalLink,
} from "lucide-react";
import { getAdminWeddingDetailAction } from "@/features/admin/actions";
import { AdminFreezeControls } from "@/features/admin/components/admin-freeze-controls";
import { AdminGrantOverrideForm } from "@/features/admin/components/admin-grant-override-form";
import { AdminOrderReconcileCard } from "@/features/admin/components/admin-order-reconcile-card";
import { AdminAuditLogCard } from "@/features/admin/components/admin-audit-log-card";

interface WeddingDetailPageProps {
  params: Promise<{ weddingId: string }>;
}

export default async function AdminWeddingDetailPage({
  params,
}: WeddingDetailPageProps) {
  const { weddingId } = await params;
  const res = await getAdminWeddingDetailAction(weddingId);

  if (!res.success || !res.wedding) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
        <h2 className="text-lg font-bold">Workspace Tidak Ditemukan</h2>
        <p className="mt-1 text-sm text-red-600">
          {res.error ||
            `Workspace wedding dengan ID ${weddingId} tidak ditemukan dalam database.`}
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Admin</span>
        </Link>
      </div>
    );
  }

  const { wedding, orders = [], grants = [], auditLogs = [] } = res;
  const activeGrant =
    grants.find((g) => g.status === "active") || grants[0] || null;

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Ringkasan Workspace</span>
        </Link>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Operasi Dukungan: {wedding.coupleNames}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1 font-mono">
                <Hash className="h-3.5 w-3.5 text-stone-400" />
                ID: {wedding.weddingId}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-stone-400" />
                {wedding.locationRegion || "Belum dipilih"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                Rencana: {wedding.prospectiveDate || "Belum pasti"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${wedding.weddingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
            >
              <span>Buka Workspace Pengguna</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Account Info Card (Data Minimized: only operational profile) */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-stone-500 uppercase">
          <User className="h-3.5 w-3.5" />
          <span>Informasi Pemilik Akun (Minimal Data)</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
          <div>
            <span className="text-stone-500">Nama Akun:</span>
            <p className="mt-0.5 font-semibold text-stone-900">
              {wedding.ownerName || "Tidak ada profil"}
            </p>
          </div>
          <div>
            <span className="text-stone-500">Email Terdaftar:</span>
            <p className="mt-0.5 font-mono text-stone-900">
              {wedding.ownerEmail || "-"}
            </p>
          </div>
          <div>
            <span className="text-stone-500">Dibuat Pada:</span>
            <p className="mt-0.5 font-mono text-stone-700">
              {new Date(wedding.createdAt).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Administrative Freeze Controls */}
      <AdminFreezeControls
        weddingId={wedding.weddingId}
        coupleNames={wedding.coupleNames}
        isFrozen={wedding.isFrozen}
        frozenReason={wedding.frozenReason}
        frozenAt={wedding.frozenAt}
        frozenBy={wedding.frozenBy}
      />

      {/* 2. License & Manual Access Override Form */}
      <AdminGrantOverrideForm
        weddingId={wedding.weddingId}
        coupleNames={wedding.coupleNames}
        activeGrant={activeGrant}
      />

      {/* 3. Checkout Orders & Gateway Reconciliation */}
      <AdminOrderReconcileCard weddingId={wedding.weddingId} orders={orders} />

      {/* 4. Wedding Workspace Specific Audit Trail */}
      <AdminAuditLogCard
        logs={auditLogs}
        title="Jejak Audit Khusus Workspace Ini"
        description="Riwayat lengkap perubahan hak akses, rekonsiliasi pembayaran, dan pembekuan untuk pernikahan ini."
      />
    </div>
  );
}
