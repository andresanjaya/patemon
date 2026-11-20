import {
  searchAdminWeddingsAction,
  getAdminAuditLogsAction,
  listAdminAccountsAction,
} from "@/features/admin/actions";
import { AdminWeddingsSearch } from "@/features/admin/components/admin-weddings-search";
import { AdminAuditLogCard } from "@/features/admin/components/admin-audit-log-card";
import { AdminAccountsTable } from "@/features/admin/components/admin-accounts-table";
import {
  DashboardPageHeader,
} from "@/features/workspaces/components/dashboard-page-header";
import { ShieldCheck, Key, Lock, Layers, RefreshCw } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [weddingsRes, auditRes, accountsRes] = await Promise.all([
    searchAdminWeddingsAction(),
    getAdminAuditLogsAction(15),
    listAdminAccountsAction(),
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
    <div className="mx-auto max-w-[1460px] px-4 pt-6 pb-12 sm:px-6 lg:px-[30px]">
      {/* Standard Metronic Page Header */}
      <DashboardPageHeader
        title="Pusat Lisensi & Kontrol Akses"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            👑 Master Admin
          </span>
        }
        breadcrumbs={[
          { label: "Master Admin", href: "/admin" },
          { label: "Daftar Lisensi & Workspace", current: true },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="workspace-button"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#65656f]" />
              <span>Muat Ulang</span>
            </Link>
          </div>
        }
      />

      {/* Metrics Grid (Metronic Demo 10 Cards) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="workspace-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#65656f] uppercase">
              Total Workspace
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f4f7] text-[#65656f]">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#18181b]">
            {weddings.length}
          </p>
          <span className="text-[11px] text-[#8c8c99]">
            Terdaftar dalam database
          </span>
        </div>

        {/* Metric 2 */}
        <div className="workspace-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#1e8346] uppercase">
              Lisensi Aktif Penuh
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f7ee] text-[#1e8346]">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#1e8346]">
            {totalActive}
          </p>
          <span className="text-[11px] text-[#8c8c99]">
            Order settled & manual grants
          </span>
        </div>

        {/* Metric 3 */}
        <div className="workspace-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#6e44ff] uppercase">
              Pengecualian Admin
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f0ff] text-[#6e44ff]">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#6e44ff]">
            {totalOverrides}
          </p>
          <span className="text-[11px] text-[#8c8c99]">
            Manual override aktif
          </span>
        </div>

        {/* Metric 4 */}
        <div className="workspace-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#c92a2a] uppercase">
              Workspace Dibekukan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#feecee] text-[#c92a2a]">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#c92a2a]">
            {totalFrozen}
          </p>
          <span className="text-[11px] text-[#8c8c99]">
            Sengketa / penegakan hak
          </span>
        </div>
      </div>

      {/* Main Workspace Search & Inventory Table */}
      <div className="space-y-6">
        <AdminAccountsTable initialResult={accountsRes} />
        <AdminWeddingsSearch initialWeddings={weddings} />

        {/* Platform Recent Audit Trail */}
        <div id="audit" className="pt-2">
          <AdminAuditLogCard
            logs={auditLogs}
            title="Jejak Audit Seluruh Platform (Terbaru)"
            description="Aktivitas rekonsiliasi pembayaran manual, pembekuan akun, dan aktivasi lisensi resmi oleh Master Admin."
          />
        </div>
      </div>
    </div>
  );
}
