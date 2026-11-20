import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
import { DashboardPageHeader } from "@/features/workspaces/components/dashboard-page-header";

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
      <div className="mx-auto max-w-[1460px] px-4 pt-6 pb-12 sm:px-6 lg:px-[30px]">
        <div className="workspace-card border-red-200 bg-red-50/50 p-8 text-center text-red-800">
          <h2 className="text-base font-bold">Workspace Tidak Ditemukan</h2>
          <p className="mt-1 text-xs text-red-600">
            {res.error ||
              `Workspace wedding dengan ID ${weddingId} tidak ditemukan dalam database.`}
          </p>
          <Link
            href="/admin"
            className={buttonVariants({
              variant: "outline",
              className: "mt-4 gap-1.5",
            })}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Admin</span>
          </Link>
        </div>
      </div>
    );
  }

  const { wedding, orders = [], grants = [], auditLogs = [] } = res;
  const activeGrant =
    grants.find((g) => g.status === "active") || grants[0] || null;

  return (
    <div className="mx-auto max-w-[1460px] space-y-6 px-4 pt-6 pb-12 sm:px-6 lg:px-[30px]">
      {/* Standard Metronic Page Header */}
      <DashboardPageHeader
        title={`Operasi Dukungan: ${wedding.coupleNames}`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            👑 Master Admin
          </span>
        }
        breadcrumbs={[
          { label: "Master Admin", href: "/admin" },
          { label: wedding.coupleNames, current: true },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${wedding.weddingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <span>Buka Workspace Pengguna</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#65656f]" />
            </Link>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline" })}
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#65656f]" />
              <span>Kembali</span>
            </Link>
          </div>
        }
      />

      {/* Account Info Card (Data Minimized: only operational profile) */}
      <div className="workspace-card p-5">
        <h3 className="border-border -mx-5 -mt-5 mb-5 flex items-center gap-1.5 border-b p-5 text-[11px] font-semibold tracking-wider text-[#65656f] uppercase">
          <User className="h-3.5 w-3.5 text-[#8c8c99]" />
          <span>Informasi Pemilik Akun (Profil Operasional)</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-4">
          <div>
            <span className="text-[#8c8c99]">Nama Akun:</span>
            <p className="mt-0.5 font-semibold text-[#18181b]">
              {wedding.ownerName || "Tidak ada profil"}
            </p>
          </div>
          <div>
            <span className="text-[#8c8c99]">Email Terdaftar:</span>
            <p className="mt-0.5 font-mono text-[#18181b]">
              {wedding.ownerEmail || "-"}
            </p>
          </div>
          <div>
            <span className="text-[#8c8c99]">Wilayah & Rencana:</span>
            <p className="mt-0.5 text-[#18181b]">
              {wedding.locationRegion || "Bali"} ·{" "}
              {wedding.prospectiveDate || "Belum pasti"}
            </p>
          </div>
          <div>
            <span className="text-[#8c8c99]">Dibuat Pada:</span>
            <p className="mt-0.5 font-mono text-[#65656f]">
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
