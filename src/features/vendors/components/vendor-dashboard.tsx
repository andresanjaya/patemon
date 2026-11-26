"use client";

import { WorkspaceActionButton } from "@/features/workspaces/components/workspace-action-button";

import { confirmAction } from "@/components/ui/action-confirmation";

import { getWeddingVendors } from "../actions";

import { runAction } from "@/components/ui/action-feedback";
import { withoutSourceReference } from "@/lib/notes";
import { cn } from "@/lib/utils";

import { TableStatusDropdown } from "@/components/ui/table-status-dropdown";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  Sparkles,
  Search,
  Phone,
  MessageCircle,
  ExternalLink,
  User,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Kanban,
  ArrowRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { KeenthemesMetricSummary } from "@/components/ui/keenthemes-metric-summary";
import { formatRupiah } from "@/features/workspaces/validation";
import { downloadCSV } from "@/lib/csv-export";
import { formatVendorsToCSV } from "@/features/exports/formatters";
import {
  VENDOR_CATEGORIES,
  VENDOR_STATUS_CONFIG,
  formatWhatsAppLink,
  getCategoryInfo,
  getStatusConfig,
  calculateVendorStats,
} from "../seeds";
import { updateVendorStatusAction, deleteVendorAction } from "../actions";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import { VendorModal } from "./vendor-modal";
import { VendorStarterModal } from "./vendor-starter-modal";
import type { Vendor, VendorStats, VendorStatus } from "../types";

interface VendorDashboardProps {
  weddingId: string;
  initialVendors: Vendor[];
  initialStats: VendorStats;
  isPreview?: boolean;
  workspaceName?: string;
}

export function VendorDashboard({
  weddingId,
  initialVendors,
  initialStats,
  isPreview: propIsPreview,
  workspaceName,
}: VendorDashboardProps) {
  const workspaceCtx = useWorkspace();
  const isPreview =
    propIsPreview ?? workspaceCtx?.isPreview ?? weddingId === "demo";
  const [isLocalUpgradeOpen, setIsLocalUpgradeOpen] = useState(false);

  const triggerUpgrade = () => {
    if (workspaceCtx?.openUpgradeModal) {
      workspaceCtx.openUpgradeModal();
    } else {
      setIsLocalUpgradeOpen(true);
    }
  };

  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [stats, setStats] = useState<VendorStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table" | "pipeline">(
    "table"
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStarterOpen, setIsStarterOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);

  const [, startTransition] = useTransition();

  const handleVendorSuccess = (savedVendor: Vendor, isEdit: boolean) => {
    let nextVendors: Vendor[];
    if (isEdit) {
      nextVendors = vendors.map((v) =>
        v.id === savedVendor.id ? savedVendor : v
      );
    } else {
      nextVendors = [savedVendor, ...vendors];
    }
    setVendors(nextVendors);
    setStats(calculateVendorStats(nextVendors));
  };

  const handleStatusChange = (vendorId: string, newStatus: VendorStatus) => {
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

    if (isPreview) {
      triggerUpgrade();
      return;
    }
    const updated = vendors.map((v) => {
      if (v.id !== vendorId) return v;
      return {
        ...v,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    startTransition(async () => {
      const result = await runAction(
        () => updateVendorStatusAction(weddingId, vendorId, newStatus),
        "Status vendor berhasil diperbarui."
      );
      if (!result.success) return;
      setVendors(updated);
      setStats(calculateVendorStats(updated));
    });
  };

  const handleDelete = async (vendorId: string) => {
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (
      !(await confirmAction({
        title: "Hapus vendor ini?",
        description: "Apakah Anda yakin ingin menghapus vendor ini?",
        confirmLabel: "Hapus vendor",
        destructive: true,
      }))
    )
      return;
    const nextVendors = vendors.filter((v) => v.id !== vendorId);

    startTransition(async () => {
      const result = await runAction(
        () => deleteVendorAction(weddingId, vendorId),
        "Vendor berhasil dihapus."
      );
      if (!result.success) return;
      setVendors(nextVendors);
      setStats(calculateVendorStats(nextVendors));
    });
  };

  const handleExportCSV = () => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    const csv = formatVendorsToCSV(vendors);
    void runAction(
      async () => {
        downloadCSV(`vendor-${weddingId}.csv`, csv);
        return { success: true };
      },
      {
        variant: "info",
        message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
      }
    );
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contactPerson &&
        v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.picName &&
        v.picName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.notes && v.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || v.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || v.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Selection helpers (Issue #116)
  const allSelected =
    filteredVendors.length > 0 &&
    filteredVendors.every((vendor) => selectedIds.has(vendor.id));
  const isIndeterminate =
    !allSelected &&
    filteredVendors.some((vendor) => selectedIds.has(vendor.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVendors.map((vendor) => vendor.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
  };

  return (
    <div className="space-y-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Rekanan & Vendor Pernikahan"
        badge={
          isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined
        }
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspaceName || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Vendor"
        )}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isPreview}
              onClick={handleExportCSV}
              className="gap-1.5"
              title={
                isPreview
                  ? "Ekspor CSV dinonaktifkan pada Mode Demo"
                  : "Ekspor daftar vendor ke CSV"
              }
            >
              <Download className="h-4 w-4" />
              <span>Ekspor CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStarterOpen(true)}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Rekomendasi Vendor Bali</span>
            </Button>

            <WorkspaceActionButton
              size="sm"
              onClick={() => {
                if (isPreview) {
                  triggerUpgrade();
                  return;
                }
                setVendorToEdit(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Vendor</span>
            </WorkspaceActionButton>
          </>
        }
      />

      {/* Summary Stats Bar: Keenthemes Compact Metric Standard */}
      <KeenthemesMetricSummary
        headlineLabel="Total Komitmen Vendor"
        headlineValue={formatRupiah(stats.totalAgreedAmount)}
        subHeadline={`Dibayar: ${formatRupiah(stats.totalPaidAmount)} • Sisa Tagihan: ${formatRupiah(stats.totalDueAmount)}`}
        breakdownTitle={`${stats.totalVendors} Rekanan Vendor Terdaftar`}
        items={[
          {
            label: "Terbayar",
            value: formatRupiah(stats.totalPaidAmount),
            color: "bg-emerald-500",
            barWeight: stats.totalPaidAmount,
          },
          {
            label: "Sisa Tagihan",
            value: formatRupiah(stats.totalDueAmount),
            color: "bg-amber-500",
            barWeight: stats.totalDueAmount,
          },
          {
            label: "Penawaran Masuk",
            value: formatRupiah(stats.totalQuoteAmount),
            color: "bg-blue-500",
            barWeight: stats.totalQuoteAmount,
          },
        ]}
      />

      {/* Filter and View Controls */}
      <div className="border-border/60 bg-card/60 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Cari nama vendor, kontak, PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <TableDropdownFilter
            label="Kategori"
            options={[
              { id: "all", label: "Semua Kategori", count: vendors.length },
              ...VENDOR_CATEGORIES.map((cat) => ({
                id: cat.id,
                label: cat.name,
                count: vendors.filter((v) => v.category === cat.id).length,
              })),
            ]}
            value={selectedCategory}
            onChange={setSelectedCategory}
            defaultAllId="all"
          />

          <TableDropdownFilter
            label="Status Kerjasama"
            options={[
              { id: "all", label: "Semua Status", count: vendors.length },
              ...Object.entries(VENDOR_STATUS_CONFIG).map(([key, cfg]) => ({
                id: key,
                label: cfg.label,
                count: vendors.filter((v) => v.status === key).length,
              })),
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
            defaultAllId="all"
          />
        </div>

        <div className="border-border/80 bg-muted/30 inline-flex items-center rounded-lg border p-0.5 text-xs">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size={null}
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all shadow-none",
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Tampilan Tabel"
          >
            <List className="h-3.5 w-3.5" />
            <span>Tabel</span>
          </Button>

          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size={null}
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all shadow-none",
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Tampilan Kartu"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kartu</span>
          </Button>

          <Button
            variant={viewMode === "pipeline" ? "secondary" : "ghost"}
            size={null}
            type="button"
            onClick={() => setViewMode("pipeline")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all shadow-none",
              viewMode === "pipeline"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Papan Status (Pipeline)"
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Pipeline</span>
          </Button>
        </div>
      </div>

      {/* Main Content Areas */}
      {filteredVendors.length === 0 ? (
        <div className="border-border/60 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Store className="text-muted-foreground/50 mb-3 h-12 w-12" />
          <h3 className="text-foreground text-base font-semibold">
            {vendors.length === 0
              ? "Belum ada rekanan vendor terdaftar"
              : "Tidak ada vendor yang cocok dengan filter"}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs">
            {vendors.length === 0
              ? "Mulai dengan menambahkan vendor baru atau gunakan daftar rekomendasi vendor pawiwahan Bali untuk mempercepat persiapan."
              : "Coba ubah kata kunci pencarian, filter kategori, atau filter status di atas."}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {vendors.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStarterOpen(true)}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Lihat Rekomendasi Bali</span>
              </Button>
            )}
            <WorkspaceActionButton
              size="sm"
              onClick={() => {
                if (isPreview) {
                  triggerUpgrade();
                  return;
                }
                setVendorToEdit(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Vendor Baru</span>
            </WorkspaceActionButton>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => {
            const catInfo = getCategoryInfo(vendor.category);
            const statusConfig = getStatusConfig(vendor.status);
            const waLink = formatWhatsAppLink(
              vendor.phone,
              `Om Swastyastu ${vendor.contactPerson || vendor.name}, kami ingin berkoordinasi mengenai persiapan pernikahan adat di Patemon.`
            );

            return (
              <div
                key={vendor.id}
                className="border-border/60 hover:border-border bg-card flex flex-col justify-between rounded-xl border p-5 shadow-xs transition hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${catInfo.badgeClass}`}
                    >
                      {catInfo.name}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <TableStatusDropdown
                        value={vendor.status}
                        options={Object.entries(VENDOR_STATUS_CONFIG).map(
                          ([k, cfg]) => ({
                            value: k,
                            label: cfg.label,
                            badgeClass: cfg.badgeClass,
                          })
                        )}
                        ariaLabel={`Ubah status ${vendor.name}`}
                        onChange={(val) =>
                          handleStatusChange(vendor.id, val as VendorStatus)
                        }
                        className={statusConfig.badgeClass}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-foreground text-base font-bold tracking-tight">
                      {vendor.name}
                    </h3>
                    {vendor.contactPerson && (
                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <span>Kontak:</span>
                        <span className="text-foreground font-medium">
                          {vendor.contactPerson}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Contact Action Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                        title="Chat via WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {vendor.phone && (
                      <a
                        href={`tel:${vendor.phone}`}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60"
                        title="Telepon Langsung"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{vendor.phone}</span>
                      </a>
                    )}

                    {vendor.socialLink && (
                      <a
                        href={vendor.socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
                        title="Buka Media Sosial / Portofolio"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Portofolio</span>
                      </a>
                    )}
                  </div>

                  {/* PIC Keluarga */}
                  {vendor.picName && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <User className="text-primary h-3 w-3" />
                      <span>PIC:</span>
                      <span className="text-foreground font-medium">
                        {vendor.picName}
                      </span>
                    </div>
                  )}

                  {/* Notes / Agreements */}
                  {vendor.notes && (
                    <p className="bg-muted/40 text-muted-foreground line-clamp-2 rounded-lg p-2.5 text-xs">
                      {withoutSourceReference(vendor.notes)}
                    </p>
                  )}
                </div>

                {/* Financial Summary & Actions Bottom Block */}
                <div className="mt-4 space-y-3 border-t pt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        Penawaran:
                      </span>
                      <p className="text-foreground font-semibold">
                        {formatRupiah(vendor.quoteAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        Disepakati:
                      </span>
                      <p className="text-foreground font-semibold">
                        {formatRupiah(vendor.agreedAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        Terbayar:
                      </span>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(vendor.paidAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px]">
                        Sisa Tagihan:
                      </span>
                      <p
                        className={`font-semibold ${
                          vendor.dueAmount > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                        }`}
                      >
                        {formatRupiah(vendor.dueAmount)}
                      </p>
                    </div>
                  </div>

                  {vendor.linkedBudgetItems.length > 0 && (
                    <div className="text-muted-foreground bg-muted/20 flex items-center justify-between rounded px-2 py-1 text-[11px]">
                      <span>Tersinkron di Anggaran</span>
                      <Link
                        href={`/workspace/${weddingId}/budget`}
                        className="text-primary inline-flex items-center gap-0.5 font-medium hover:underline"
                      >
                        <span>Lihat Rincian</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 pt-1">
                    <WorkspaceActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isPreview) {
                          triggerUpgrade();
                          return;
                        }
                        setVendorToEdit(vendor);
                        setIsModalOpen(true);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit2 className="mr-1 h-3 w-3" />
                      Edit
                    </WorkspaceActionButton>
                    <WorkspaceActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        return handleDelete(vendor.id);
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Hapus
                    </WorkspaceActionButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "table" ? (
        /* Unified Metronic Inventory Table Card (Issue #116) */
        <div className="dark:bg-card dark:border-border/80 overflow-hidden rounded-xl border border-[#e5e5e9] bg-white shadow-xs">
          {/* Row Selection Banner */}
          {selectedIds.size > 0 && (
            <div
              role="status"
              className="flex items-center justify-between border-b border-amber-200/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <span className="font-medium">
                {selectedIds.size} vendor dipilih dari total{" "}
                {filteredVendors.length} hasil
              </span>
              <Button
                variant="link"
                size={null}
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="font-medium underline"
              >
                Batalkan Pilihan
              </Button>
            </div>
          )}

          <div className="table-responsive-wrapper table-metronic-wrapper dark:border-border/80 dark:bg-card rounded-none border-y border-[#e9e9ed] bg-white shadow-2xs">
            <table
              role="table"
              className="table-responsive table-metronic w-full text-left text-xs"
              aria-label="Daftar Rekanan Vendor"
            >
              <colgroup>
                {["25%", "16%", "14%", "10%", "10%", "10%", "10%", "5%"].map(
                  (width, index) => (
                    <col key={index} style={{ width }} />
                  )
                )}
              </colgroup>
              <thead>
                <tr className="dark:bg-muted/40 dark:text-muted-foreground border-b border-[#e9e9ed] bg-[#f9f9fb] text-xs font-semibold text-[#65656f]">
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Vendor & Kategori
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Kontak & PIC
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Status Kerjasama
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                  >
                    Penawaran
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                  >
                    Disepakati
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                  >
                    Terbayar
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                  >
                    Sisa Tagihan
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 w-16 border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="dark:divide-border/80 divide-y divide-[#e9e9ed]">
                {filteredVendors.map((vendor) => {
                  const catInfo = getCategoryInfo(vendor.category);
                  const statusConfig = getStatusConfig(vendor.status);
                  const waLink = formatWhatsAppLink(vendor.phone);

                  return (
                    <tr
                      key={vendor.id}
                      className="dark:hover:bg-muted/20 transition-colors hover:bg-[#fbfbfd]"
                    >
                      <td
                        data-label="Vendor &amp; Kategori"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <div className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                          {vendor.name}
                        </div>
                        <Badge
                          variant="outline"
                          className={`mt-1 h-5 text-[10px] font-normal ${catInfo.badgeClass}`}
                        >
                          {catInfo.name}
                        </Badge>
                      </td>

                      <td
                        data-label="Kontak &amp; PIC"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        {vendor.contactPerson && (
                          <div className="dark:text-foreground text-xs font-semibold text-[#18181b]">
                            {vendor.contactPerson}
                          </div>
                        )}
                        <div className="mt-0.5 flex items-center gap-2">
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {vendor.phone && (
                            <span className="dark:text-muted-foreground text-xs text-[#65656f]">
                              {vendor.phone}
                            </span>
                          )}
                        </div>
                        {vendor.picName && (
                          <div className="dark:text-muted-foreground mt-0.5 text-[11px] text-[#65656f]">
                            PIC Internal: {vendor.picName}
                          </div>
                        )}
                      </td>

                      <td
                        data-label="Status Kerjasama"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <TableStatusDropdown
                          value={vendor.status}
                          options={Object.entries(VENDOR_STATUS_CONFIG).map(
                            ([k, cfg]) => ({
                              value: k,
                              label: cfg.label,
                              badgeClass: cfg.badgeClass,
                            })
                          )}
                          ariaLabel={`Ubah status ${vendor.name}`}
                          onChange={(val) =>
                            handleStatusChange(vendor.id, val as VendorStatus)
                          }
                          className={statusConfig.badgeClass}
                        />
                      </td>

                      <td
                        data-label="Penawaran"
                        className="dark:text-muted-foreground dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle text-xs font-medium text-[#65656f] tabular-nums"
                      >
                        {formatRupiah(vendor.quoteAmount)}
                      </td>

                      <td
                        data-label="Disepakati"
                        className="dark:text-foreground dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle text-sm font-semibold text-[#18181b] tabular-nums"
                      >
                        {formatRupiah(vendor.agreedAmount)}
                      </td>

                      <td
                        data-label="Terbayar"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400"
                      >
                        {formatRupiah(vendor.paidAmount)}
                      </td>

                      <td
                        data-label="Sisa Tagihan"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle tabular-nums"
                      >
                        <span
                          className={`text-sm font-semibold ${
                            vendor.dueAmount > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "dark:text-muted-foreground text-[#65656f]"
                          }`}
                        >
                          {formatRupiah(vendor.dueAmount)}
                        </span>
                      </td>

                      <td
                        data-label="Aksi"
                        className="dark:border-border/80 w-16 border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle"
                      >
                        <TableActionDropdown
                          items={[
                            {
                              label: "Edit Rekanan Vendor",
                              icon: <Edit2 className="h-3.5 w-3.5" />,
                              onClick: () => {
                                if (isPreview) {
                                  triggerUpgrade();
                                  return;
                                }
                                setVendorToEdit(vendor);
                                setIsModalOpen(true);
                              },
                            },
                            {
                              label: "Hapus Vendor",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              variant: "destructive",
                              onClick: () => {
                                return handleDelete(vendor.id);
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="dark:border-border/60 dark:text-muted-foreground flex flex-col items-center justify-between gap-3 border-t border-[#f0f0f4] px-4 py-3.5 text-xs text-[#71717a] sm:flex-row sm:px-6">
            <span>
              Menampilkan{" "}
              <strong className="dark:text-foreground font-semibold text-[#18181b]">
                {filteredVendors.length}
              </strong>{" "}
              dari {vendors.length} vendor
            </span>
            {(Boolean(searchQuery.trim()) ||
              selectedCategory !== "all" ||
              selectedStatus !== "all") && (
              <Button
                variant="link"
                size={null}
                type="button"
                onClick={resetFilters}
                className="font-medium"
              >
                Reset Semua Filter
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Kanban Pipeline View (Keenthemes Metronic Style) */
        <div className="flex w-full gap-5 overflow-x-auto pb-6 pt-2 items-start">
          {(
            [
              "prospect",
              "contacted",
              "quoted",
              "booked",
              "completed",
              "canceled",
            ] as VendorStatus[]
          ).map((colStatus) => {
            const cfg = getStatusConfig(colStatus);
            const colVendors = filteredVendors.filter(
              (v) => v.status === colStatus
            );

            return (
              <div
                key={colStatus}
                className="w-80 min-w-[300px] shrink-0 flex flex-col bg-[#f9f9fb] dark:bg-card/40 rounded-xl p-3.5 border border-[#e9e9ed] dark:border-border/80 shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#e9e9ed] dark:border-border/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2.5 rounded-full shrink-0",
                        colStatus === "booked"
                          ? "bg-amber-500"
                          : colStatus === "completed"
                            ? "bg-emerald-500"
                            : colStatus === "canceled"
                              ? "bg-rose-400"
                              : colStatus === "quoted"
                                ? "bg-indigo-500"
                                : colStatus === "contacted"
                                  ? "bg-sky-500"
                                  : "bg-slate-400"
                      )}
                    />
                    <h3 className="text-xs font-semibold text-foreground tracking-wide">
                      {cfg.label}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-card border border-[#e9e9ed] dark:border-border/80 text-muted-foreground shadow-2xs">
                      {colVendors.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                  {colVendors.map((vendor) => {
                    const catInfo = getCategoryInfo(vendor.category);
                    const waLink = formatWhatsAppLink(vendor.phone);

                    return (
                      <div
                        key={vendor.id}
                        className="group bg-white dark:bg-card hover:bg-muted/10 rounded-lg border border-[#e5e5e9] dark:border-border/80 p-3.5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${catInfo.badgeClass}`}
                          >
                            {catInfo.name}
                          </Badge>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {vendor.paidAmount > 0 && vendor.dueAmount === 0
                              ? "Lunas"
                              : vendor.paidAmount > 0
                                ? "DP Terbayar"
                                : "Belum Bayar"}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {vendor.name}
                        </h4>

                        {(vendor.contactPerson || vendor.picName) && (
                          <div className="text-muted-foreground space-y-0.5 text-[11px]">
                            {vendor.contactPerson && (
                              <div className="truncate">
                                Kontak: {vendor.contactPerson}
                              </div>
                            )}
                            {vendor.picName && (
                              <div className="truncate">
                                PIC: {vendor.picName}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-[#f0f0f4] dark:border-border/60 pt-2 text-[11px]">
                          <span className="text-muted-foreground">
                            Kesepakatan:
                          </span>
                          <span className="text-foreground font-semibold">
                            {formatRupiah(vendor.quoteAmount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            Sisa Bayar:
                          </span>
                          <span
                            className={`font-semibold ${
                              vendor.dueAmount > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {formatRupiah(vendor.dueAmount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#f0f0f4] dark:border-border/60 pt-2">
                          <div className="flex items-center gap-1.5">
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {vendor.phone && (
                              <a
                                href={`tel:${vendor.phone}`}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40"
                                title="Telepon"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>

                          <WorkspaceActionButton
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              if (isPreview) {
                                triggerUpgrade();
                                return;
                              }
                              setVendorToEdit(vendor);
                              setIsModalOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs font-medium"
                          >
                            Kelola
                          </WorkspaceActionButton>
                        </div>
                      </div>
                    );
                  })}

                  {colVendors.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e5e5e9] dark:border-border/80 py-8 text-center text-xs text-muted-foreground/60">
                      <span className="italic">Tidak ada vendor</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor Create/Edit Modal */}
      {isModalOpen && (
        <VendorModal
          weddingId={weddingId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setVendorToEdit(null);
          }}
          vendorToEdit={vendorToEdit}
          onSuccess={handleVendorSuccess}
        />
      )}

      {/* Starter Bali Vendor Templates Modal */}
      {isStarterOpen && (
        <VendorStarterModal
          weddingId={weddingId}
          isOpen={isStarterOpen}
          onClose={() => setIsStarterOpen(false)}
          isPreview={isPreview}
          onPreviewUpgrade={triggerUpgrade}
          onSuccess={() => {
            // refresh data
            void runAction(
              async () => ({
                success: true,
                data: await getWeddingVendors(weddingId),
              }),
              false
            ).then((result) => {
              if (result.success) {
                setVendors(result.data.vendors);
                setStats(result.data.stats);
              }
            });
          }}
        />
      )}

      {/* Fallback Upgrade Modal */}
      <UpgradePromptModal
        isOpen={isLocalUpgradeOpen}
        onClose={() => setIsLocalUpgradeOpen(false)}
        weddingId={weddingId}
      />
    </div>
  );
}
