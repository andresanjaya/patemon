"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flower2,
  Plus,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Hammer,
  Edit3,
  Trash2,
  Package,
  CalendarHeart,
  AlertTriangle,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { KeenthemesMetricSummary } from "@/components/ui/keenthemes-metric-summary";
import { formatRupiah } from "@/features/workspaces/validation";
import { downloadCSV } from "@/lib/csv-export";
import { formatBantenToCSV } from "@/features/exports/formatters";
import { BantenItemModal } from "./banten-item-modal";
import { CatalogPickerModal } from "./catalog-picker-modal";
import { BantenReviewModal } from "./banten-review-modal";
import { deleteBantenItemAction, updateBantenStatusAction } from "../actions";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import type {
  BantenAcquisitionStatus,
  BantenItem,
  BantenReviewStatus,
  RitualCatalogItem,
  SourcingMethod,
} from "../types";
import type { WeddingCeremony } from "@/features/ceremonies/types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface BantenPlannerDashboardProps {
  weddingId: string;
  initialItems: BantenItem[];
  catalog: RitualCatalogItem[];
  ceremonies: WeddingCeremony[];
  userRole: WorkspaceRole;
  isPreview?: boolean;
  workspaceName?: string;
}

export function BantenPlannerDashboard({
  weddingId,
  initialItems,
  catalog,
  ceremonies,
  userRole,
  isPreview: propIsPreview,
  workspaceName,
}: BantenPlannerDashboardProps) {
  const router = useRouter();
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

  const canEdit = isPreview || userRole === "owner" || userRole === "editor";

  const [items, setItems] = useState<BantenItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
  const [selectedReviewStatus, setSelectedReviewStatus] =
    useState<string>("Semua");
  const [selectedMethod, setSelectedMethod] = useState<string>("Semua");
  const [selectedCeremony, setSelectedCeremony] = useState<string>("Semua");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<"ceremony" | "method" | "flat">(
    "ceremony"
  );

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BantenItem | null>(null);
  const [reviewingItem, setReviewingItem] = useState<BantenItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Summary Metrics (Procurement)
  const totalCount = items.length;
  const readyCount = items.filter((i) => i.status === "ready").length;
  const makingCount = items.filter((i) => i.status === "making").length;
  const orderedCount = items.filter((i) => i.status === "ordered").length;
  const neededCount = items.filter((i) => i.status === "needed").length;

  // Review & Consensus Metrics (Adat & Dresta)
  const approvedCount = items.filter(
    (i) => i.reviewStatus === "approved"
  ).length;
  const needsReviewCount = items.filter(
    (i) => i.reviewStatus === "needs_review" || !i.reviewStatus
  ).length;
  const needsRevisionCount = items.filter(
    (i) => i.reviewStatus === "needs_revision"
  ).length;

  const totalEstimatedCost = items.reduce(
    (sum, i) => sum + (Number(i.estimatedPrice) || 0),
    0
  );
  const totalActualCost = items.reduce(
    (sum, i) => sum + (Number(i.actualPrice) || 0),
    0
  );

  const handleToggleStatus = async (item: BantenItem) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!canEdit) return;

    const statusCycle: BantenAcquisitionStatus[] = [
      "needed",
      "ordered",
      "making",
      "ready",
      "not_needed",
    ];
    const currentIndex = statusCycle.indexOf(item.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
    );

    await updateBantenStatusAction(weddingId, item.id, nextStatus);
    router.refresh();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!canEdit) return;

    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setDeletingId(null);
    await deleteBantenItemAction(weddingId, itemId);
    router.refresh();
  };

  const handleExportCSV = () => {
    const csv = formatBantenToCSV(items);
    downloadCSV(`banten-${weddingId}.csv`, csv);
  };

  const getStatusBadge = (status: BantenAcquisitionStatus) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Siap
          </Badge>
        );
      case "making":
        return (
          <Badge className="bg-amber-600 text-[10px] text-white hover:bg-amber-700">
            <Hammer className="mr-1 h-3 w-3" /> Sedang Dibuat
          </Badge>
        );
      case "ordered":
        return (
          <Badge className="bg-blue-600 text-[10px] text-white hover:bg-blue-700">
            <Clock className="mr-1 h-3 w-3" /> Dipesan
          </Badge>
        );
      case "not_needed":
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground text-[10px]"
          >
            Tidak Diperlukan
          </Badge>
        );
      case "needed":
      default:
        return (
          <Badge
            variant="secondary"
            className="text-[10px] text-amber-800 dark:text-amber-300"
          >
            <AlertCircle className="mr-1 h-3 w-3" /> Dibutuhkan
          </Badge>
        );
    }
  };

  const getSourcingBadge = (method: SourcingMethod) => {
    switch (method) {
      case "purchased_package":
        return (
          <Badge
            variant="outline"
            className="border-blue-200 text-[10px] text-blue-600 dark:border-blue-900"
          >
            Beli Paket Serati
          </Badge>
        );
      case "self_made":
        return (
          <Badge
            variant="outline"
            className="border-emerald-200 text-[10px] text-emerald-600 dark:border-emerald-900"
          >
            Ngayah Keluarga
          </Badge>
        );
      case "family_assigned":
        return (
          <Badge
            variant="outline"
            className="border-purple-200 text-[10px] text-purple-600 dark:border-purple-900"
          >
            Tugas Keluarga
          </Badge>
        );
      case "vendor_order":
        return (
          <Badge
            variant="outline"
            className="border-orange-200 text-[10px] text-orange-600 dark:border-orange-900"
          >
            Pesan Vendor
          </Badge>
        );
      default:
        return null;
    }
  };

  const getReviewStatusBadge = (status?: BantenReviewStatus) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="border border-emerald-300 bg-emerald-100 text-[10px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Disetujui Adat
          </Badge>
        );
      case "needs_revision":
        return (
          <Badge className="border border-rose-300 bg-rose-100 text-[10px] text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="mr-1 h-3 w-3 text-rose-600 dark:text-rose-400" />
            Perlu Revisi
          </Badge>
        );
      case "needs_review":
      default:
        return (
          <Badge className="border border-amber-300 bg-amber-100 text-[10px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <AlertCircle className="mr-1 h-3 w-3 text-amber-600 dark:text-amber-400" />
            Perlu Ditinjau
          </Badge>
        );
      case "draft":
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground text-[10px]"
          >
            Draft
          </Badge>
        );
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesStatus =
      selectedStatus === "Semua" || item.status === selectedStatus;
    const matchesReviewStatus =
      selectedReviewStatus === "Semua" ||
      (item.reviewStatus || "draft") === selectedReviewStatus;
    const matchesMethod =
      selectedMethod === "Semua" || item.sourcingMethod === selectedMethod;
    const matchesCeremony =
      selectedCeremony === "Semua" ||
      (selectedCeremony === "umum" && !item.ceremonyId) ||
      item.ceremonyId === selectedCeremony;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assigneeName &&
        item.assigneeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes &&
        item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ceremonyTitle &&
        item.ceremonyTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      matchesStatus &&
      matchesReviewStatus &&
      matchesMethod &&
      matchesCeremony &&
      matchesSearch
    );
  });

  // Group items
  const isAllSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(item.id));
  const isSomeSelected =
    filteredItems.some((item) => selectedIds.has(item.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredItems.forEach((item) => next.add(item.id));
      setSelectedIds(next);
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

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatus !== "Semua" ||
    selectedReviewStatus !== "Semua" ||
    selectedMethod !== "Semua" ||
    selectedCeremony !== "Semua";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("Semua");
    setSelectedReviewStatus("Semua");
    setSelectedMethod("Semua");
    setSelectedCeremony("Semua");
  };

  const renderBantenTable = (tableItems: BantenItem[]) => (
    <div className="table-metronic-wrapper dark:border-border/80 dark:bg-card overflow-x-auto rounded-none border-y border-[#e9e9ed] bg-white shadow-2xs">
      <table className="table-metronic w-full border-collapse text-left text-sm">
        <caption className="sr-only">Daftar Banten & Sarana Ritual</caption>
        <thead className="dark:bg-card sticky top-0 z-10 bg-[#f9f9fb] shadow-2xs backdrop-blur-xs">
          <tr className="dark:text-muted-foreground text-xs font-semibold text-[#65656f]">
            <th
              scope="col"
              className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
            >
              Sarana & Upacara
            </th>
            <th
              scope="col"
              className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
            >
              Kategori & Pengadaan
            </th>
            <th
              scope="col"
              className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
            >
              Tinjauan Adat
            </th>
            <th
              scope="col"
              className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
            >
              Kesiapan
            </th>
            <th
              scope="col"
              className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3"
            >
              PIC / Penyedia
            </th>
            <th
              scope="col"
              className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3 text-right"
            >
              Biaya
            </th>
            <th
              scope="col"
              className="dark:border-border/80 w-16 border-b border-[#e9e9ed] px-4 py-3 text-right"
            >
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="dark:divide-border/80 divide-y divide-[#e9e9ed]">
          {tableItems.map((item) => {
            return (
              <tr
                key={item.id}
                className="dark:hover:bg-muted/20 transition-colors hover:bg-[#fbfbfd]"
              >
                <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                      {item.name}
                    </span>
                    <span className="dark:text-muted-foreground text-xs text-[#65656f]">
                      ({item.quantity} {item.unit})
                    </span>
                    {item.ceremonyTitle && (
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] font-normal"
                      >
                        <CalendarHeart className="text-primary mr-1 h-3 w-3" />
                        {item.ceremonyTitle}
                      </Badge>
                    )}
                  </div>
                  {item.notes && (
                    <p className="dark:text-muted-foreground mt-0.5 line-clamp-1 text-xs text-[#65656f]">
                      {item.notes}
                    </p>
                  )}
                  {item.reviewerName && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Ditinjau oleh {item.reviewerName}</span>
                    </div>
                  )}
                </td>
                <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal capitalize"
                    >
                      {item.category || "Umum"}
                    </Badge>
                    {getSourcingBadge(item.sourcingMethod)}
                  </div>
                </td>
                <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size={null}
                    type="button"
                    onClick={() => {
                      setReviewingItem(item);
                      setIsReviewModalOpen(true);
                    }}
                    title="Klik untuk membuka riwayat tinjauan adat"
                  >
                    {getReviewStatusBadge(item.reviewStatus)}
                  </Button>
                </td>
                <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size={null}
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    disabled={!canEdit}
                    title={
                      canEdit
                        ? "Klik untuk mengubah status kesiapan"
                        : undefined
                    }
                  >
                    {getStatusBadge(item.status)}
                  </Button>
                </td>
                <td className="dark:text-muted-foreground dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle text-xs whitespace-nowrap text-[#65656f]">
                  {item.assigneeName ? (
                    <span className="dark:text-foreground font-medium text-[#18181b]">
                      {item.assigneeName}
                    </span>
                  ) : (
                    <span className="italic">Belum ada PIC</span>
                  )}
                </td>
                <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle whitespace-nowrap tabular-nums">
                  <div className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                    {item.estimatedPrice > 0
                      ? formatRupiah(item.estimatedPrice)
                      : "-"}
                  </div>
                  {item.actualPrice > 0 && (
                    <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Realisasi: {formatRupiah(item.actualPrice)}
                    </div>
                  )}
                </td>
                <td className="dark:border-border/80 w-16 border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle whitespace-nowrap">
                  <TableActionDropdown
                    items={[
                      {
                        label: "Tinjau Adat",
                        icon: (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        ),
                        onClick: () => {
                          setReviewingItem(item);
                          setIsReviewModalOpen(true);
                        },
                      },
                      {
                        label: "Edit Banten",
                        icon: <Edit3 className="h-3.5 w-3.5" />,
                        disabled: !canEdit,
                        onClick: () => {
                          if (isPreview) {
                            triggerUpgrade();
                            return;
                          }
                          setEditingItem(item);
                          setIsItemModalOpen(true);
                        },
                      },
                      {
                        label: "Hapus Banten",
                        icon: <Trash2 className="h-3.5 w-3.5" />,
                        variant: "destructive",
                        disabled: !canEdit,
                        onClick: () => {
                          if (isPreview) {
                            triggerUpgrade();
                            return;
                          }
                          setDeletingId(item.id);
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
  );

  return (
    <div className="space-y-6">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Banten & Sarana Ritual"
        badge={
          isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined
        }
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspaceName || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Banten & Sarana"
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
              onClick={() => setIsCatalogModalOpen(true)}
              className="gap-1.5"
            >
              <BookOpen className="h-4 w-4" />
              <span>Pilih dari Katalog</span>
            </Button>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  if (isPreview) {
                    triggerUpgrade();
                    return;
                  }
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Banten</span>
              </Button>
            )}
          </>
        }
      />

      {/* Summary Stats Bar: Keenthemes Compact Metric Standard with Clickable Filter */}
      <KeenthemesMetricSummary
        headlineLabel="Total Estimasi Biaya Banten"
        headlineValue={formatRupiah(totalEstimatedCost)}
        subHeadline={
          totalActualCost > 0
            ? `Realisasi: ${formatRupiah(totalActualCost)}`
            : "Sinkronisasi estimasi biaya ritual"
        }
        breakdownTitle={`${totalCount} Total Sarana Banten & Upakara`}
        activeItemId={
          selectedStatus !== "Semua"
            ? selectedStatus
            : selectedReviewStatus !== "Semua"
              ? selectedReviewStatus
              : null
        }
        onItemClick={(key) => {
          if (
            key === "ready" ||
            key === "making" ||
            key === "ordered" ||
            key === "needed"
          ) {
            setSelectedStatus((prev) => (prev === key ? "Semua" : key));
            setSelectedReviewStatus("Semua");
          } else if (key === "approved") {
            setSelectedReviewStatus((prev) =>
              prev === "approved" ? "Semua" : "approved"
            );
            setSelectedStatus("Semua");
          } else if (key === "needs_review") {
            setSelectedReviewStatus((prev) =>
              prev === "needs_review" ? "Semua" : "needs_review"
            );
            setSelectedStatus("Semua");
          }
        }}
        items={[
          {
            id: "ready",
            label: "Siap di Lokasi",
            value: readyCount,
            color: "bg-emerald-500",
          },
          {
            id: "making",
            label: "Sedang Dibuat",
            value: makingCount,
            color: "bg-amber-500",
          },
          {
            id: "ordered",
            label: "Dipesan Serati",
            value: orderedCount,
            color: "bg-blue-500",
          },
          {
            id: "needed",
            label: "Belum Dipesan",
            value: neededCount,
            color: "bg-zinc-400",
          },
          {
            id: "approved",
            label: "Disetujui Adat",
            value: approvedCount,
            color: "bg-emerald-600",
          },
          {
            id: "needs_review",
            label: "Perlu Tinjauan",
            value: needsReviewCount + needsRevisionCount,
            color: "bg-rose-500",
          },
        ]}
      />

      {/* Cultural Guardrail Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="leading-relaxed">
          <p className="font-semibold">Pedoman Adat & Fleksibilitas Dresta</p>
          <p className="mt-0.5 text-amber-700 dark:text-amber-300">
            Penetapan jenis dan jumlah banten disesuaikan dengan dresta
            keluarga, desa kala patra, dan arahan serati banten atau
            pemangku/sulinggih setempat. Patemon tidak menetapkan aturan kaku
            yang bersifat dogmatis.
          </p>
        </div>
      </div>

      {/* Unified Main List Container (Metronic Inventory Layout) */}
      <div className="dark:bg-card dark:border-border/80 overflow-hidden rounded-xl border border-[#e5e5e9] bg-white shadow-xs">
        {/* Top Toolbar inside Card */}
        <div className="dark:border-border/60 dark:bg-card flex flex-col gap-3 border-b border-[#f0f0f4] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Cari banten, serati, upacara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <TableDropdownFilter
              label="Kesiapan"
              options={[
                { id: "Semua", label: "Semua Kesiapan", count: items.length },
                {
                  id: "needed",
                  label: "Dibutuhkan",
                  count: items.filter((i) => i.status === "needed").length,
                },
                {
                  id: "ordered",
                  label: "Dipesan",
                  count: items.filter((i) => i.status === "ordered").length,
                },
                {
                  id: "making",
                  label: "Sedang Dibuat",
                  count: items.filter((i) => i.status === "making").length,
                },
                {
                  id: "ready",
                  label: "Siap",
                  count: items.filter((i) => i.status === "ready").length,
                },
                {
                  id: "not_needed",
                  label: "Tidak Diperlukan",
                  count: items.filter((i) => i.status === "not_needed").length,
                },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              defaultAllId="Semua"
            />

            {/* Review Status Filter */}
            <TableDropdownFilter
              label="Tinjauan Adat"
              options={[
                {
                  id: "Semua",
                  label: "Semua Tinjauan Adat",
                  count: items.length,
                },
                {
                  id: "approved",
                  label: "Disetujui Adat",
                  count: items.filter((i) => i.reviewStatus === "approved")
                    .length,
                },
                {
                  id: "needs_review",
                  label: "Perlu Ditinjau",
                  count: items.filter((i) => i.reviewStatus === "needs_review")
                    .length,
                },
                {
                  id: "needs_revision",
                  label: "Perlu Revisi",
                  count: items.filter(
                    (i) => i.reviewStatus === "needs_revision"
                  ).length,
                },
                {
                  id: "draft",
                  label: "Draft",
                  count: items.filter((i) => i.reviewStatus === "draft").length,
                },
              ]}
              value={selectedReviewStatus}
              onChange={setSelectedReviewStatus}
              defaultAllId="Semua"
            />

            {/* Sourcing Method Filter */}
            <TableDropdownFilter
              label="Pengadaan"
              options={[
                { id: "Semua", label: "Semua Pengadaan", count: items.length },
                {
                  id: "purchased_package",
                  label: "Beli Paket Serati",
                  count: items.filter(
                    (i) => i.sourcingMethod === "purchased_package"
                  ).length,
                },
                {
                  id: "self_made",
                  label: "Ngayah Keluarga",
                  count: items.filter((i) => i.sourcingMethod === "self_made")
                    .length,
                },
                {
                  id: "family_assigned",
                  label: "Tugas Keluarga",
                  count: items.filter(
                    (i) => i.sourcingMethod === "family_assigned"
                  ).length,
                },
                {
                  id: "vendor_order",
                  label: "Pesan Vendor",
                  count: items.filter(
                    (i) => i.sourcingMethod === "vendor_order"
                  ).length,
                },
              ]}
              value={selectedMethod}
              onChange={setSelectedMethod}
              defaultAllId="Semua"
            />

            {/* Ceremony Filter */}
            <TableDropdownFilter
              label="Prosesi"
              options={[
                { id: "Semua", label: "Semua Prosesi", count: items.length },
                {
                  id: "umum",
                  label: "Kebutuhan Umum",
                  count: items.filter((i) => !i.ceremonyId).length,
                },
                ...ceremonies.map((c) => ({
                  id: c.id,
                  label: c.title,
                  count: items.filter((i) => i.ceremonyId === c.id).length,
                })),
              ]}
              value={selectedCeremony}
              onChange={setSelectedCeremony}
              defaultAllId="Semua"
            />

            {/* Group By Dropdown Filter */}
            <TableDropdownFilter
              label="Kelompokkan"
              options={[
                { id: "ceremony", label: "Berdasarkan Upacara" },
                { id: "method", label: "Berdasarkan Pengadaan" },
                { id: "flat", label: "Semua Item (Datar)" },
              ]}
              value={groupBy}
              onChange={(val) => setGroupBy(val as typeof groupBy)}
              defaultAllId="ceremony"
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 text-xs"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="dark:border-border/60 mt-2 flex w-full flex-wrap items-center gap-1.5 border-t border-[#f0f0f4] pt-2.5 text-xs">
              <span className="text-muted-foreground mr-1 text-[11px]">
                Filter aktif:
              </span>
              {searchQuery.trim() && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Pencarian: &quot;{searchQuery}&quot;
                  <Button
                    variant="ghost"
                    size={null}
                    type="button"
                    onClick={() => setSearchQuery("")}
                  >
                    ✕
                  </Button>
                </span>
              )}
              {selectedStatus !== "Semua" && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Kesiapan:{" "}
                  {getStatusBadge(selectedStatus as BantenAcquisitionStatus)}
                  <Button
                    variant="ghost"
                    size={null}
                    type="button"
                    onClick={() => setSelectedStatus("Semua")}
                  >
                    ✕
                  </Button>
                </span>
              )}
              {selectedReviewStatus !== "Semua" && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Tinjauan:{" "}
                  {getReviewStatusBadge(
                    selectedReviewStatus as BantenReviewStatus
                  )}
                  <Button
                    variant="ghost"
                    size={null}
                    type="button"
                    onClick={() => setSelectedReviewStatus("Semua")}
                  >
                    ✕
                  </Button>
                </span>
              )}
              {selectedMethod !== "Semua" && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Pengadaan:{" "}
                  {getSourcingBadge(selectedMethod as SourcingMethod)}
                  <Button
                    variant="ghost"
                    size={null}
                    type="button"
                    onClick={() => setSelectedMethod("Semua")}
                  >
                    ✕
                  </Button>
                </span>
              )}
              {selectedCeremony !== "Semua" && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Upacara:{" "}
                  {ceremonies.find((c) => c.id === selectedCeremony)?.title ||
                    "Khusus"}
                  <Button
                    variant="ghost"
                    size={null}
                    type="button"
                    onClick={() => setSelectedCeremony("Semua")}
                  >
                    ✕
                  </Button>
                </span>
              )}
              <Button
                variant="link"
                size={null}
                type="button"
                onClick={resetFilters}
                className="ml-1 text-[11px] font-medium"
              >
                Hapus Semua
              </Button>
            </div>
          )}
        </div>

        {/* Row Selection Banner */}
        {selectedIds.size > 0 && (
          <div
            role="status"
            className="flex items-center justify-between border-b border-amber-200/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <span className="font-medium">
              {selectedIds.size} sarana banten dipilih
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs"
            >
              Batal Pilihan
            </Button>
          </div>
        )}

        {/* Main Content List / Grouped View */}
        {filteredItems.length === 0 ? (
          <div className="p-6 py-12 text-center">
            <Flower2 className="text-muted-foreground/60 mx-auto mb-3 h-10 w-10" />
            <h3 className="text-foreground text-base font-bold">
              Belum Ada Banten Terdaftar
            </h3>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
              {items.length === 0
                ? "Tambahkan banten baru atau pilih paket banten kanonik dari katalog pustaka adat."
                : "Tidak ada banten yang cocok dengan filter atau kata kunci saat ini."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-4 text-xs"
              >
                Reset Filter
              </Button>
            )}
            {items.length === 0 && (
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="gap-1.5"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Buka Katalog Banten</span>
                </Button>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingItem(null);
                      setIsItemModalOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Banten Manual</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : groupBy === "ceremony" ? (
          // Group by Ceremony
          <div className="dark:divide-border/60 divide-y divide-[#f0f0f4]">
            {Array.from(
              new Set(
                filteredItems.map((i) => i.ceremonyTitle || "Kebutuhan Umum")
              )
            ).map((groupTitle) => {
              const groupItems = filteredItems.filter(
                (i) => (i.ceremonyTitle || "Kebutuhan Umum") === groupTitle
              );

              return (
                <div key={groupTitle} className="space-y-0">
                  <div className="dark:bg-muted/20 dark:border-border/60 flex items-center justify-between border-b border-[#f0f0f4] bg-[#fcfcfd] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <CalendarHeart className="text-primary h-4 w-4" />
                      <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
                        {groupTitle}
                      </h3>
                      <Badge variant="outline" className="h-5 text-[10px]">
                        {groupItems.length} Sarana
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                      Total:{" "}
                      {formatRupiah(
                        groupItems.reduce(
                          (sum, i) => sum + (Number(i.estimatedPrice) || 0),
                          0
                        )
                      )}
                    </span>
                  </div>

                  {renderBantenTable(groupItems)}
                </div>
              );
            })}
          </div>
        ) : groupBy === "method" ? (
          // Group by Sourcing Method
          <div className="dark:divide-border/60 divide-y divide-[#f0f0f4]">
            {[
              { key: "purchased_package", title: "Beli Paket Serati Banten" },
              { key: "self_made", title: "Buat Sendiri / Ngayah Keluarga" },
              { key: "family_assigned", title: "Tugas Keluarga Tertentu" },
              { key: "vendor_order", title: "Pesan Vendor Khusus" },
            ].map((method) => {
              const groupItems = filteredItems.filter(
                (i) => i.sourcingMethod === method.key
              );
              if (groupItems.length === 0) return null;

              return (
                <div key={method.key} className="space-y-0">
                  <div className="dark:bg-muted/20 dark:border-border/60 flex items-center justify-between border-b border-[#f0f0f4] bg-[#fcfcfd] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Package className="text-primary h-4 w-4" />
                      <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
                        {method.title}
                      </h3>
                      <Badge variant="outline" className="h-5 text-[10px]">
                        {groupItems.length} Sarana
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                      Total:{" "}
                      {formatRupiah(
                        groupItems.reduce(
                          (sum, i) => sum + (Number(i.estimatedPrice) || 0),
                          0
                        )
                      )}
                    </span>
                  </div>

                  {renderBantenTable(groupItems)}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat List
          renderBantenTable(filteredItems)
        )}

        {/* Table Footer */}
        <div className="dark:border-border/60 dark:text-muted-foreground flex items-center justify-between border-t border-[#f0f0f4] px-4 py-3.5 text-xs text-[#71717a] sm:px-6">
          <span>
            Menampilkan {filteredItems.length} dari {items.length} sarana banten
          </span>
          {hasActiveFilters && (
            <Button
              variant="link"
              size={null}
              type="button"
              onClick={resetFilters}
              className="font-medium"
            >
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Item Modal (Create/Edit) */}
      <BantenItemModal
        weddingId={weddingId}
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        ceremonies={ceremonies}
      />

      {/* Catalog Picker Modal */}
      <CatalogPickerModal
        weddingId={weddingId}
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        catalog={catalog}
        ceremonies={ceremonies}
        isPreview={isPreview}
        onPreviewUpgrade={triggerUpgrade}
      />

      {/* Banten Review Modal */}
      <BantenReviewModal
        weddingId={weddingId}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewingItem(null);
        }}
        item={reviewingItem}
        currentUserRole={userRole}
        isPreview={isPreview}
        onPreviewUpgrade={triggerUpgrade}
        onSuccess={(updated) => {
          setItems((prev) =>
            prev.map((i) => (i.id === updated.id ? updated : i))
          );
          router.refresh();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-xl">
            <h3 className="text-foreground text-lg font-bold">
              Hapus Item Banten?
            </h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Apakah Anda yakin ingin menghapus sarana upakara ini dari daftar
              rencana?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingId(null)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteItem(deletingId)}
              >
                Hapus Banten
              </Button>
            </div>
          </div>
        </div>
      )}

      <UpgradePromptModal
        isOpen={isLocalUpgradeOpen}
        onClose={() => setIsLocalUpgradeOpen(false)}
        weddingId={weddingId}
      />
    </div>
  );
}
