"use client";

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
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Kanban,
  FileText,
  BadgeDollarSign,
  ArrowRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const isPreview = propIsPreview ?? workspaceCtx?.isPreview ?? (weddingId === "demo");
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
    setVendors(updated);
    setStats(calculateVendorStats(updated));

    startTransition(async () => {
      await updateVendorStatusAction(weddingId, vendorId, newStatus);
    });
  };

  const handleDelete = (vendorId: string) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus vendor ini?")) return;
    const nextVendors = vendors.filter((v) => v.id !== vendorId);
    setVendors(nextVendors);
    setStats(calculateVendorStats(nextVendors));

    startTransition(async () => {
      await deleteVendorAction(weddingId, vendorId);
    });
  };

  const handleExportCSV = () => {
    const csv = formatVendorsToCSV(vendors);
    downloadCSV(`vendor-${weddingId}.csv`, csv);
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
    !allSelected && filteredVendors.some((vendor) => selectedIds.has(vendor.id));

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
        badge={isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined}
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
              onClick={handleExportCSV}
              className="gap-1.5"
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

            <Button
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
            </Button>
          </>
        }
      />

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Rekanan
            </CardTitle>
            <Store className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVendors} Vendor
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {stats.bookedVendors} Dipesan
              </span>{" "}
              · {stats.prospectVendors} Prospek
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Penawaran (Quotes)
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-xl font-bold">
              {formatRupiah(stats.totalQuoteAmount)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Estimasi total awal rekanan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Biaya Disepakati
            </CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-xl font-bold">
              {formatRupiah(stats.totalAgreedAmount)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Nilai kontrak / pos anggaran
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Sudah Dibayarkan
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats.totalPaidAmount)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Akumulasi DP & pelunasan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Sisa Jatuh Tempo (Due)
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold ${
                stats.totalDueAmount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground"
              }`}
            >
              {formatRupiah(stats.totalDueAmount)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.totalDueAmount > 0
                ? "Wajib dilunasi sesuai termin"
                : "Semua lunas"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and View Controls */}
      <div className="border-border/60 bg-card/60 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder="Cari nama vendor, kontak, PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-xs shadow-xs"
          >
            <option value="all">Semua Kategori</option>
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-xs shadow-xs"
          >
            <option value="all">Semua Status</option>
            {Object.entries(VENDOR_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 border-t pt-2 sm:border-t-0 sm:pt-0">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-2.5 text-xs"
            title="Tampilan Kartu"
          >
            <LayoutGrid className="mr-1 h-3.5 w-3.5" />
            Kartu
          </Button>

          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 px-2.5 text-xs"
            title="Tampilan Tabel"
          >
            <List className="mr-1 h-3.5 w-3.5" />
            Tabel
          </Button>

          <Button
            variant={viewMode === "pipeline" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("pipeline")}
            className="h-8 px-2.5 text-xs"
            title="Papan Status (Pipeline)"
          >
            <Kanban className="mr-1 h-3.5 w-3.5" />
            Pipeline
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
            <Button
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
            </Button>
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
                      <select
                        value={vendor.status}
                        onChange={(e) =>
                          handleStatusChange(
                            vendor.id,
                            e.target.value as VendorStatus
                          )
                        }
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-xs focus:outline-hidden ${statusConfig.badgeClass}`}
                      >
                        {Object.entries(VENDOR_STATUS_CONFIG).map(
                          ([k, cfg]) => (
                            <option key={k} value={k}>
                              {cfg.label}
                            </option>
                          )
                        )}
                      </select>
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
                      {vendor.notes}
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
                    <Button
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
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vendor.id)}
                      className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "table" ? (
        /* Unified Metronic Inventory Table Card (Issue #116) */
        <div className="rounded-xl border border-[#e5e5e9] bg-white shadow-xs overflow-hidden dark:bg-card dark:border-border/80">
          {/* Row Selection Banner */}
          {selectedIds.size > 0 && (
            <div
              role="status"
              className="flex items-center justify-between border-b border-amber-200/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
            >
              <span className="font-medium">
                {selectedIds.size} vendor dipilih dari total {filteredVendors.length} hasil
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="font-medium underline hover:text-amber-950 dark:hover:text-amber-100"
              >
                Batalkan Pilihan
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Daftar Rekanan Vendor">
              <thead className="bg-[#f9f9fb] text-[#71717a] border-b border-[#f0f0f4] text-xs font-semibold dark:bg-muted/30 dark:border-border/60 dark:text-muted-foreground">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={toggleSelectAll}
                      aria-label="Pilih semua vendor pada filter ini"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-amber-600"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Vendor & Kategori</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Kontak & PIC</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Status Kerjasama</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-semibold">Penawaran</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-semibold">Disepakati</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-semibold">Terbayar</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-semibold">Sisa Tagihan</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f4] dark:divide-border/60">
                {filteredVendors.map((vendor) => {
                  const catInfo = getCategoryInfo(vendor.category);
                  const statusConfig = getStatusConfig(vendor.status);
                  const waLink = formatWhatsAppLink(vendor.phone);
                  const isSelected = selectedIds.has(vendor.id);

                  return (
                    <tr
                      key={vendor.id}
                      className={`hover:bg-[#f9f9fb]/60 dark:hover:bg-muted/20 transition-colors ${
                        isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="w-10 px-4 py-3.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(vendor.id)}
                          aria-label={`Pilih ${vendor.name}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-amber-600"
                        />
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <div className="text-sm font-semibold text-[#18181b] dark:text-foreground">
                          {vendor.name}
                        </div>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-[10px] h-5 font-normal ${catInfo.badgeClass}`}
                        >
                          {catInfo.name}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        {vendor.contactPerson && (
                          <div className="text-xs font-semibold text-[#18181b] dark:text-foreground">
                            {vendor.contactPerson}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
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
                            <span className="text-xs text-[#71717a] dark:text-muted-foreground">
                              {vendor.phone}
                            </span>
                          )}
                        </div>
                        {vendor.picName && (
                          <div className="text-[11px] text-[#71717a] dark:text-muted-foreground mt-0.5">
                            PIC Internal: {vendor.picName}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <select
                          value={vendor.status}
                          onChange={(e) =>
                            handleStatusChange(
                              vendor.id,
                              e.target.value as VendorStatus
                            )
                          }
                          className={`rounded-md border px-2 py-1 text-xs font-medium shadow-xs focus:outline-hidden ${statusConfig.badgeClass}`}
                          aria-label={`Ubah status ${vendor.name}`}
                        >
                          {Object.entries(VENDOR_STATUS_CONFIG).map(
                            ([k, cfg]) => (
                              <option key={k} value={k}>
                                {cfg.label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap tabular-nums text-xs font-medium text-[#71717a] dark:text-muted-foreground">
                        {formatRupiah(vendor.quoteAmount)}
                      </td>

                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap tabular-nums text-sm font-semibold text-[#18181b] dark:text-foreground">
                        {formatRupiah(vendor.agreedAmount)}
                      </td>

                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(vendor.paidAmount)}
                      </td>

                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap tabular-nums">
                        <span
                          className={`text-sm font-semibold ${
                            vendor.dueAmount > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-[#71717a] dark:text-muted-foreground"
                          }`}
                        >
                          {formatRupiah(vendor.dueAmount)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
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
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit Vendor"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(vendor.id)}
                            className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                            title="Hapus Vendor"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#f0f0f4] px-4 sm:px-6 py-3.5 text-xs text-[#71717a] dark:border-border/60 dark:text-muted-foreground">
            <span>
              Menampilkan <strong className="text-[#18181b] dark:text-foreground font-semibold">{filteredVendors.length}</strong> dari {vendors.length} vendor
            </span>
            {(Boolean(searchQuery.trim()) || selectedCategory !== "all" || selectedStatus !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-primary hover:underline font-medium"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-3 lg:grid-cols-6">
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
                className="bg-card/40 border-border/60 flex min-w-[260px] flex-col rounded-xl border p-3"
              >
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-xs font-bold">
                      {cfg.label}
                    </span>
                    <span className="bg-muted text-muted-foreground py-0.2 rounded-full px-1.5 text-[10px] font-semibold">
                      {colVendors.length}
                    </span>
                  </div>
                </div>

                <div className="max-h-[600px] flex-1 space-y-2.5 overflow-y-auto">
                  {colVendors.map((vendor) => {
                    const catInfo = getCategoryInfo(vendor.category);
                    const waLink = formatWhatsAppLink(vendor.phone);

                    return (
                      <div
                        key={vendor.id}
                        className="bg-background border-border/80 hover:border-border space-y-2 rounded-lg border p-3 shadow-xs"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${catInfo.badgeClass}`}
                        >
                          {catInfo.name}
                        </Badge>

                        <h4 className="text-foreground text-xs font-bold">
                          {vendor.name}
                        </h4>

                        <div className="text-muted-foreground space-y-0.5 text-[11px]">
                          {vendor.contactPerson && (
                            <div>Kontak: {vendor.contactPerson}</div>
                          )}
                          {vendor.picName && <div>PIC: {vendor.picName}</div>}
                        </div>

                        <div className="flex items-center justify-between border-t pt-1.5 text-[11px]">
                          <span className="text-muted-foreground">Quote:</span>
                          <span className="text-foreground font-semibold">
                            {formatRupiah(vendor.quoteAmount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Sisa:</span>
                          <span
                            className={`font-semibold ${
                              vendor.dueAmount > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {formatRupiah(vendor.dueAmount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t pt-1.5">
                          <div className="flex items-center gap-1">
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-emerald-600 hover:text-emerald-700"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </a>
                            )}
                            {vendor.phone && (
                              <a
                                href={`tel:${vendor.phone}`}
                                className="p-1 text-blue-600 hover:text-blue-700"
                                title="Telepon"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (isPreview) {
                                  triggerUpgrade();
                                  return;
                                }
                                setVendorToEdit(vendor);
                                setIsModalOpen(true);
                              }}
                              className="text-muted-foreground hover:text-foreground p-1 text-[10px]"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colVendors.length === 0 && (
                    <div className="text-muted-foreground/60 py-6 text-center text-[11px] italic">
                      Kosong
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
            window.location.reload();
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
