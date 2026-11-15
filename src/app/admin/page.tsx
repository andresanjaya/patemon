import {
  searchAdminWeddingsAction,
  getAdminAuditLogsAction,
} from "@/features/admin/actions";
import { AdminWeddingsSearch } from "@/features/admin/components/admin-weddings-search";
import { AdminAuditLogCard } from "@/features/admin/components/admin-audit-log-card";
import { ShieldCheck, Key, Lock, Layers } from "lucide-react";

export default async function AdminDashboardPage() {
  const [weddingsRes, auditRes] = await Promise.all([
    searchAdminWeddingsAction(),
    getAdminAuditLogsAction(15),
  ]);

  const weddings = weddingsRes.success ? weddingsRes.weddings : [];
  const auditLogs = auditRes.success && auditRes.logs ? auditRes.logs : [];

  const totalActive = weddings.filter(
    (w) => w.licenseStatus === "active"
  ).length;
  const totalOverrides = weddings.filter(
    (w) => w.grantType === "manual_override" && w.licenseStatus === "active"
  ).length;
  const totalFrozen = weddings.filter((w) => w.isFrozen).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
          Pusat Operasional Akun & Pengecualian Akses
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Kelola lisensi, mitigasi kegagalan gerbang pembayaran Midtrans,
          lakukan rekonsiliasi status, dan bekukan akun bermasalah dengan jejak
          audit ketat.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
              Total Workspace
            </span>
            <Layers className="h-4 w-4 text-stone-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            {weddings.length}
          </p>
          <span className="text-[11px] text-stone-500">
            Terdaftar dalam database
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
              Lisensi Aktif Penuh
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {totalActive}
          </p>
          <span className="text-[11px] text-stone-500">
            Order paid & manual grants
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-purple-600 uppercase">
              Pengecualian Admin
            </span>
            <Key className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-800">
            {totalOverrides}
          </p>
          <span className="text-[11px] text-stone-500">
            Manual override aktif
          </span>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-red-600 uppercase">
              Workspace Dibekukan
            </span>
            <Lock className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-800">{totalFrozen}</p>
          <span className="text-[11px] text-stone-500">
            Sengketa / penegakan hukum
          </span>
        </div>
      </div>

      {/* Main Workspace Search & Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Daftar Workspace Pasangan
        </h2>
        <AdminWeddingsSearch initialWeddings={weddings} />
      </div>

      {/* Platform Recent Audit Trail */}
      <div>
        <AdminAuditLogCard
          logs={auditLogs}
          title="Jejak Audit Seluruh Platform (Terbaru)"
          description="Aktivitas rekonsiliasi, pembekuan, dan penerbitan akses manual yang dilakukan tim operator."
        />
      </div>
    </div>
  );
}
