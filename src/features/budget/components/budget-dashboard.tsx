"use client";

import { useState, useMemo, useTransition, Fragment } from "react";
import {
  Wallet,
  Plus,
  Sparkles,
  Search,
  DollarSign,
  TrendingUp,
  Receipt,
  Layers,
  Tag,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  CreditCard,
  Building,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { KeenthemesMetricSummary } from "@/components/ui/keenthemes-metric-summary";
import { downloadCSV } from "@/lib/csv-export";
import {
  formatBudgetItemsToCSV,
  formatPaymentsToCSV,
} from "@/features/exports/formatters";
import {
  BUDGET_CATEGORIES,
  getBudgetCategoryLabel,
  getBudgetItemStatusBadgeClass,
  getBudgetItemStatusLabel,
  calculateBudgetStats,
} from "../seeds";
import { BudgetItemModal } from "./budget-item-modal";
import { PaymentModal } from "./payment-modal";
import {
  deleteBudgetItemAction,
  deletePaymentAction,
  importStarterBudgetAction,
} from "../actions";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import { formatRupiah } from "@/features/workspaces/validation";
import type { BudgetItem, BudgetItemStatus, BudgetPayment } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface BudgetDashboardProps {
  weddingId: string;
  targetBudget: number;
  initialItems: BudgetItem[];
  userRole: WorkspaceRole;
  isPreview?: boolean;
  workspaceName?: string;
}

type GroupByMode = "category" | "status" | "paid_by" | "none";

export function BudgetDashboard({
  weddingId,
  targetBudget,
  initialItems,
  userRole,
  isPreview: propIsPreview,
  workspaceName,
}: BudgetDashboardProps) {
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

  const isReadOnly = !isPreview && userRole === "viewer";
  const [items, setItems] = useState<BudgetItem[]>(initialItems);
  const [, startTransition] = useTransition();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paidByFilter, setPaidByFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<GroupByMode>("category");

  // Row selection state for Metronic Inventory table (Issue #116)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Expanded payments accordion state (set of item ids)
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(
    new Set()
  );

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<BudgetItem | null>(null);
  const [paymentModalItem, setPaymentModalItem] = useState<BudgetItem | null>(
    null
  );

  // Compute unique sources of funds (paid_by)
  const uniquePaidBy = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.paidBy?.trim()) {
        set.add(item.paidBy.trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  // Compute accurate financial stats
  const stats = useMemo(() => {
    return calculateBudgetStats(items, targetBudget);
  }, [items, targetBudget]);

  const toggleExpandPayments = (itemId: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Delete line item
  const handleDeleteItem = (itemId: string) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (isReadOnly) return;
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus rincian pengeluaran ini?"
      )
    ) {
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== itemId));

    startTransition(async () => {
      await deleteBudgetItemAction(weddingId, itemId);
    });
  };

  // Delete individual payment
  const handleDeletePayment = (paymentId: string, budgetItemId: string) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (isReadOnly) return;
    if (!window.confirm("Hapus catatan pembayaran ini?")) {
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== budgetItemId) return item;
        const newPayments = item.payments.filter((p) => p.id !== paymentId);
        const newPaidAmount = newPayments.reduce((sum, p) => sum + p.amount, 0);
        const effectiveTotal =
          item.actualAmount > 0 ? item.actualAmount : item.plannedAmount;

        let nextStatus: BudgetItemStatus = item.status;
        if (item.status !== "canceled") {
          if (newPaidAmount >= effectiveTotal && effectiveTotal > 0) {
            nextStatus = "paid_full";
          } else if (newPaidAmount > 0) {
            nextStatus = "paid_partial";
          } else {
            nextStatus = "booked";
          }
        }

        return {
          ...item,
          payments: newPayments,
          paidAmount: newPaidAmount,
          status: nextStatus,
        };
      })
    );

    startTransition(async () => {
      await deletePaymentAction(weddingId, paymentId, budgetItemId);
    });
  };

  // Item saved callback
  const handleItemSaved = (savedItem: BudgetItem, isEdit: boolean) => {
    if (isEdit) {
      setItems((prev) =>
        prev.map((i) => (i.id === savedItem.id ? savedItem : i))
      );
    } else {
      setItems((prev) => [savedItem, ...prev]);
    }
  };

  // Payment saved callback
  const handlePaymentSaved = (newPayment: BudgetPayment) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== newPayment.budgetItemId) return item;
        const newPayments = [...item.payments, newPayment];
        const newPaidAmount = newPayments.reduce((sum, p) => sum + p.amount, 0);
        const effectiveTotal =
          item.actualAmount > 0 ? item.actualAmount : item.plannedAmount;

        let nextStatus: BudgetItemStatus = item.status;
        if (item.status !== "canceled") {
          nextStatus =
            newPaidAmount >= effectiveTotal ? "paid_full" : "paid_partial";
        }

        return {
          ...item,
          payments: newPayments,
          paidAmount: newPaidAmount,
          status: nextStatus,
        };
      })
    );
  };

  // Import starter templates
  const handleImportStarter = () => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (isReadOnly) return;
    startTransition(async () => {
      await importStarterBudgetAction(weddingId);
      window.location.reload();
    });
  };

  const handleExportBudgetCSV = () => {
    const csv = formatBudgetItemsToCSV(items);
    downloadCSV(`anggaran-${weddingId}.csv`, csv);
  };

  const handleExportPaymentsCSV = () => {
    const csv = formatPaymentsToCSV(items);
    downloadCSV(`transaksi-pembayaran-${weddingId}.csv`, csv);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q) || false;
        const matchesPaidBy = item.paidBy?.toLowerCase().includes(q) || false;
        const matchesCat = getBudgetCategoryLabel(item.category)
          .toLowerCase()
          .includes(q);
        if (!matchesTitle && !matchesNotes && !matchesPaidBy && !matchesCat) {
          return false;
        }
      }

      // Category
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Status
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Paid By
      if (paidByFilter !== "all" && item.paidBy !== paidByFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, categoryFilter, statusFilter, paidByFilter]);

  // Group filtered items
  const groupedItems = useMemo(() => {
    if (groupBy === "none") {
      const subtotal = filteredItems.reduce(
        (sum, i) =>
          sum + (i.actualAmount > 0 ? i.actualAmount : i.plannedAmount),
        0
      );
      return [
        {
          groupTitle: "Semua Rincian Anggaran",
          items: filteredItems,
          subtotal,
        },
      ];
    }

    if (groupBy === "category") {
      const map = new Map<string, BudgetItem[]>();
      BUDGET_CATEGORIES.forEach((cat) => map.set(cat.id, []));

      filteredItems.forEach((item) => {
        const catKey = item.category || "lainnya";
        if (!map.has(catKey)) {
          map.set(catKey, []);
        }
        map.get(catKey)!.push(item);
      });

      const groups: {
        groupTitle: string;
        categoryId: string;
        items: BudgetItem[];
        subtotal: number;
      }[] = [];
      map.forEach((catItems, catId) => {
        if (catItems.length > 0) {
          const subtotal = catItems.reduce(
            (sum, i) =>
              sum + (i.actualAmount > 0 ? i.actualAmount : i.plannedAmount),
            0
          );
          groups.push({
            groupTitle: getBudgetCategoryLabel(catId),
            categoryId: catId,
            items: catItems,
            subtotal,
          });
        }
      });
      return groups;
    }

    if (groupBy === "status") {
      const statuses: BudgetItemStatus[] = [
        "estimated",
        "booked",
        "paid_partial",
        "paid_full",
        "canceled",
      ];
      return statuses
        .map((st) => {
          const stItems = filteredItems.filter((i) => i.status === st);
          const subtotal = stItems.reduce(
            (sum, i) =>
              sum + (i.actualAmount > 0 ? i.actualAmount : i.plannedAmount),
            0
          );
          return {
            groupTitle: getBudgetItemStatusLabel(st),
            statusId: st,
            items: stItems,
            subtotal,
          };
        })
        .filter((g) => g.items.length > 0);
    }

    if (groupBy === "paid_by") {
      const map = new Map<string, BudgetItem[]>();
      filteredItems.forEach((item) => {
        const key = item.paidBy?.trim() || "Belum Ditentukan";
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(item);
      });

      const groups: {
        groupTitle: string;
        items: BudgetItem[];
        subtotal: number;
      }[] = [];
      map.forEach((pbItems, key) => {
        const subtotal = pbItems.reduce(
          (sum, i) =>
            sum + (i.actualAmount > 0 ? i.actualAmount : i.plannedAmount),
          0
        );
        groups.push({
          groupTitle: `Alokasi: ${key}`,
          items: pbItems,
          subtotal,
        });
      });
      return groups;
    }

    return [
      { groupTitle: "Daftar Anggaran", items: filteredItems, subtotal: 0 },
    ];
  }, [filteredItems, groupBy]);

  // Selection helpers
  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(item.id));
  const isIndeterminate =
    !allSelected && filteredItems.some((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
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
    setCategoryFilter("all");
    setStatusFilter("all");
    setPaidByFilter("all");
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    paidByFilter !== "all";

  const isOverBudget = stats.remainingBudget < 0;

  return (
    <div className="space-y-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Anggaran & Biaya"
        badge={
          isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined
        }
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspaceName || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Anggaran"
        )}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBudgetCSV}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor Pos Anggaran</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPaymentsCSV}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor Riwayat Pembayaran</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isReadOnly}
              onClick={() => {
                if (isReadOnly) return;
                handleImportStarter();
              }}
              className={`gap-1.5 text-xs ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
              title={
                isReadOnly
                  ? "Mode Hanya Lihat (View Only)"
                  : "Rekomendasi Anggaran Adat"
              }
            >
              <Sparkles className="text-primary h-3.5 w-3.5" />
              <span>Rekomendasi Anggaran Adat</span>
            </Button>

            <Button
              size="sm"
              disabled={isReadOnly}
              onClick={() => {
                if (isReadOnly) return;
                if (isPreview) {
                  triggerUpgrade();
                  return;
                }
                setItemToEdit(null);
                setIsItemModalOpen(true);
              }}
              className={`gap-1.5 text-xs ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
              title={
                isReadOnly
                  ? "Mode Hanya Lihat (View Only)"
                  : "Tambah Pos Anggaran"
              }
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Pos Anggaran</span>
            </Button>
          </>
        }
      />

      {/* Summary Stats Bar: Keenthemes Compact Metric Standard with Clickable Filter */}
      <KeenthemesMetricSummary
        headlineLabel="Total Rencana Anggaran"
        headlineValue={formatRupiah(stats.totalPlanned)}
        subHeadline={`Realisasi: ${formatRupiah(stats.totalActual)} • Sisa Tagihan: ${formatRupiah(stats.totalOutstanding)}`}
        breakdownTitle={`${stats.itemCount} Pos Pengeluaran Anggaran`}
        activeItemId={
          statusFilter === "paid_full"
            ? "paid"
            : statusFilter === "paid_partial"
              ? "outstanding"
              : null
        }
        onItemClick={(key) => {
          if (key === "paid") {
            setStatusFilter((prev) =>
              prev === "paid_full" ? "all" : "paid_full"
            );
          } else if (key === "outstanding") {
            setStatusFilter((prev) =>
              prev === "paid_partial" ? "all" : "paid_partial"
            );
          }
        }}
        items={[
          {
            id: "paid",
            label: "Telah Dibayar",
            value: formatRupiah(stats.totalPaid),
            color: "bg-emerald-500",
            barWeight: stats.totalPaid,
          },
          {
            id: "outstanding",
            label: "Sisa Tagihan",
            value: formatRupiah(stats.totalOutstanding),
            color: "bg-amber-500",
            barWeight: stats.totalOutstanding,
          },
          {
            label: isOverBudget ? "Defisit" : "Sisa Saldo",
            value: formatRupiah(Math.abs(stats.remainingBudget)),
            color: isOverBudget ? "bg-rose-500" : "bg-blue-500",
            barWeight: Math.max(stats.remainingBudget, 0),
          },
        ]}
      />

      {/* Unified Metronic Inventory Table Card (Issue #116) */}
      <div className="dark:bg-card dark:border-border/80 overflow-hidden rounded-xl border border-[#e5e5e9] bg-white shadow-xs">
        {/* Top Toolbar inside Card (Metronic Filter Bar) */}
        <div className="dark:border-border/60 dark:bg-card border-b border-[#f0f0f4] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Cari pengeluaran, vendor, catatan..."
                  className="h-9 pl-8 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <TableDropdownFilter
                label="Kategori"
                options={[
                  { id: "all", label: "Semua Kategori", count: items.length },
                  ...BUDGET_CATEGORIES.map((c) => ({
                    id: c.id,
                    label: c.label,
                    count: items.filter((i) => i.category === c.id).length,
                  })),
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                defaultAllId="all"
              />

              {/* Status Filter */}
              <TableDropdownFilter
                label="Status"
                options={[
                  { id: "all", label: "Semua Status", count: items.length },
                  {
                    id: "estimated",
                    label: "Estimasi Awal",
                    count: items.filter((i) => i.status === "estimated").length,
                  },
                  {
                    id: "booked",
                    label: "Dipesan / Deal",
                    count: items.filter((i) => i.status === "booked").length,
                  },
                  {
                    id: "paid_partial",
                    label: "DP / Cicilan",
                    count: items.filter((i) => i.status === "paid_partial")
                      .length,
                  },
                  {
                    id: "paid_full",
                    label: "Lunas",
                    count: items.filter((i) => i.status === "paid_full").length,
                  },
                  {
                    id: "canceled",
                    label: "Dibatalkan",
                    count: items.filter((i) => i.status === "canceled").length,
                  },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                defaultAllId="all"
              />

              {/* Paid By Filter */}
              {uniquePaidBy.length > 0 && (
                <TableDropdownFilter
                  label="Sumber Dana"
                  options={[
                    {
                      id: "all",
                      label: "Semua Sumber Dana",
                      count: items.length,
                    },
                    ...uniquePaidBy.map((pb) => ({
                      id: pb,
                      label: pb,
                      count: items.filter((i) => i.paidBy === pb).length,
                    })),
                  ]}
                  value={paidByFilter}
                  onChange={setPaidByFilter}
                  defaultAllId="all"
                />
              )}

              {/* Group By Filter */}
              <TableDropdownFilter
                label="Kelompokkan"
                options={[
                  { id: "category", label: "Berdasarkan Kategori" },
                  { id: "status", label: "Berdasarkan Status" },
                  { id: "paid_by", label: "Berdasarkan Sumber Dana" },
                  { id: "none", label: "Tanpa Pengelompokan" },
                ]}
                value={groupBy}
                onChange={(val) => setGroupBy(val as GroupByMode)}
                defaultAllId="category"
              />

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground hover:text-foreground h-9 text-xs"
                >
                  Reset Filter
                </Button>
              )}
            </div>
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
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-rose-500"
                  >
                    ✕
                  </button>
                </span>
              )}
              {categoryFilter !== "all" && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Kategori: {getBudgetCategoryLabel(categoryFilter)}
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className="hover:text-rose-500"
                  >
                    ✕
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Status:{" "}
                  {getBudgetItemStatusLabel(statusFilter as BudgetItemStatus)}
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="hover:text-rose-500"
                  >
                    ✕
                  </button>
                </span>
              )}
              {paidByFilter !== "all" && (
                <span className="dark:bg-muted text-foreground inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px]">
                  Alokasi: {paidByFilter}
                  <button
                    type="button"
                    onClick={() => setPaidByFilter("all")}
                    className="hover:text-rose-500"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 text-[11px] font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                Hapus Semua
              </button>
            </div>
          )}
        </div>

        {/* Row Selection Banner */}
        {selectedIds.size > 0 && (
          <div
            role="status"
            className="flex items-center justify-between border-b border-amber-200/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <span className="font-medium">
              {selectedIds.size} baris anggaran dipilih dari total{" "}
              {filteredItems.length} hasil
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

        {/* Empty State vs Metronic Table */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-foreground text-base font-semibold">
              {hasActiveFilters
                ? "Tidak ada pengeluaran yang sesuai filter"
                : "Belum Ada Rincian Anggaran"}
            </h3>
            <p className="text-muted-foreground mt-1 max-w-md text-xs">
              {hasActiveFilters
                ? "Coba ubah kata kunci pencarian atau reset filter untuk menampilkan semua data pengeluaran."
                : "Susun alokasi biaya pernikahan adat Bali Anda dengan memuat paket rekomendasi atau menambahkan rincian biaya sendiri."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {hasActiveFilters ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Reset Semua Filter
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnly}
                    onClick={() => {
                      if (isReadOnly) return;
                      handleImportStarter();
                    }}
                    className={`gap-1.5 ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
                    title={isReadOnly ? "Mode Hanya Lihat" : "Muat Rekomendasi"}
                  >
                    <Sparkles className="text-primary h-3.5 w-3.5" />
                    <span>Muat Rekomendasi Anggaran Adat</span>
                  </Button>
                  <Button
                    size="sm"
                    disabled={isReadOnly}
                    onClick={() => {
                      if (isReadOnly) return;
                      setItemToEdit(null);
                      setIsItemModalOpen(true);
                    }}
                    className={`gap-1.5 ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
                    title={
                      isReadOnly ? "Mode Hanya Lihat" : "Tambah Pengeluaran"
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Pengeluaran Sendiri</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="table-metronic-wrapper dark:border-border/80 dark:bg-card overflow-x-auto rounded-none border-y border-[#e9e9ed] bg-white shadow-2xs">
            <table
              className="table-metronic w-full text-left text-xs"
              aria-label="Daftar Pos Anggaran"
            >
              <thead className="dark:bg-card dark:text-muted-foreground sticky top-0 z-10 bg-[#f9f9fb] text-xs font-semibold text-[#65656f] shadow-2xs backdrop-blur-xs">
                <tr>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Pos Pengeluaran & Rincian
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Kategori & Alokasi
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                  >
                    Rencana Biaya
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
                {groupedItems.map((group, groupIdx) => (
                  <Fragment key={groupIdx}>
                    {groupBy !== "none" && (
                      <tr className="dark:bg-muted/40 dark:border-border/80 border-b border-[#e9e9ed] bg-[#f9f9fb]/80 text-xs font-semibold">
                        <td
                          colSpan={7}
                          className="dark:text-foreground px-4 py-2.5 text-[#18181b]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold">
                              <Tag className="text-primary h-3.5 w-3.5" />
                              {group.groupTitle} ({group.items.length})
                            </span>
                            {group.subtotal !== undefined && (
                              <span className="dark:text-muted-foreground text-xs font-normal text-[#65656f]">
                                Subtotal:{" "}
                                <strong className="dark:text-foreground font-semibold text-[#18181b] tabular-nums">
                                  {formatRupiah(group.subtotal)}
                                </strong>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {group.items.map((item) => {
                      const effectiveTotal =
                        item.actualAmount > 0
                          ? item.actualAmount
                          : item.plannedAmount;
                      const remaining = Math.max(
                        0,
                        effectiveTotal - item.paidAmount
                      );
                      const isExpanded = expandedItemIds.has(item.id);
                      const isSelected = selectedIds.has(item.id);
                      const percentPaid =
                        effectiveTotal > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (item.paidAmount / effectiveTotal) * 100
                              )
                            )
                          : 0;

                      return (
                        <Fragment key={item.id}>
                          <tr className="dark:hover:bg-muted/20 transition-colors hover:bg-[#fbfbfd]">
                            <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle">
                              <div className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                                {item.title}
                              </div>
                              {item.notes && (
                                <p className="dark:text-muted-foreground mt-0.5 line-clamp-1 text-xs text-[#65656f]">
                                  {item.notes}
                                </p>
                              )}
                              <div className="dark:text-muted-foreground mt-1 flex items-center gap-2 text-xs text-[#65656f]">
                                <Building className="text-primary h-3 w-3" />
                                <span>
                                  {item.quantity} {item.unit || "Paket"} @{" "}
                                  {formatRupiah(item.unitPrice)}
                                </span>
                              </div>
                            </td>

                            <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle whitespace-nowrap">
                              <div className="flex flex-col items-start gap-1">
                                <Badge
                                  variant="outline"
                                  className="h-5 text-[10px] font-normal"
                                >
                                  {getBudgetCategoryLabel(item.category)}
                                </Badge>
                                {item.paidBy && (
                                  <span className="dark:text-muted-foreground text-[11px] text-[#65656f]">
                                    Alokasi:{" "}
                                    <strong className="text-foreground">
                                      {item.paidBy}
                                    </strong>
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle whitespace-nowrap">
                              <Badge
                                variant="secondary"
                                className={`h-5 border text-[10px] font-medium ${getBudgetItemStatusBadgeClass(
                                  item.status
                                )}`}
                              >
                                {getBudgetItemStatusLabel(item.status)}
                              </Badge>
                            </td>

                            <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle whitespace-nowrap tabular-nums">
                              <span className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                                {formatRupiah(effectiveTotal)}
                              </span>
                            </td>

                            <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle whitespace-nowrap tabular-nums">
                              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatRupiah(item.paidAmount)}
                              </div>
                              <div className="dark:text-muted-foreground text-[11px] text-[#65656f]">
                                ({percentPaid}%)
                              </div>
                              {item.payments && item.payments.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandPayments(item.id)}
                                  className="text-primary mt-1 inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-medium hover:underline"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3" />
                                      <span>
                                        Tutup ({item.payments.length})
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3" />
                                      <span>
                                        Rincian ({item.payments.length})
                                      </span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>

                            <td className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle whitespace-nowrap tabular-nums">
                              <span
                                className={`text-sm font-semibold ${
                                  remaining > 0
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "dark:text-muted-foreground text-[#65656f]"
                                }`}
                              >
                                {formatRupiah(remaining)}
                              </span>
                            </td>

                            <td className="dark:border-border/80 w-16 border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle whitespace-nowrap">
                              <TableActionDropdown
                                items={[
                                  {
                                    label: "+ Bayar (Catat Pembayaran)",
                                    icon: <Receipt className="h-3.5 w-3.5" />,
                                    disabled: isReadOnly,
                                    onClick: () => {
                                      if (isReadOnly) return;
                                      if (isPreview) {
                                        triggerUpgrade();
                                        return;
                                      }
                                      setPaymentModalItem(item);
                                    },
                                  },
                                  {
                                    label: "Ubah Rincian",
                                    icon: <Edit2 className="h-3.5 w-3.5" />,
                                    disabled: isReadOnly,
                                    onClick: () => {
                                      if (isReadOnly) return;
                                      if (isPreview) {
                                        triggerUpgrade();
                                        return;
                                      }
                                      setItemToEdit(item);
                                      setIsItemModalOpen(true);
                                    },
                                  },
                                  {
                                    label: "Hapus Pos Anggaran",
                                    icon: <Trash2 className="h-3.5 w-3.5" />,
                                    variant: "destructive",
                                    disabled: isReadOnly,
                                    onClick: () => {
                                      if (isReadOnly) return;
                                      handleDeleteItem(item.id);
                                    },
                                  },
                                ]}
                              />
                            </td>
                          </tr>

                          {/* Expandable Payments Subrow */}
                          {isExpanded &&
                            item.payments &&
                            item.payments.length > 0 && (
                              <tr className="dark:bg-muted/20 bg-[#f9f9fb]">
                                <td
                                  colSpan={7}
                                  className="dark:border-border/60 border-b border-[#f0f0f4] px-6 py-3"
                                >
                                  <div className="space-y-2">
                                    <div className="dark:text-foreground flex items-center gap-1.5 text-xs font-semibold text-[#18181b]">
                                      <Receipt className="text-primary h-3.5 w-3.5" />
                                      <span>
                                        Riwayat Transaksi Pembayaran (
                                        {item.payments.length} transaksi)
                                      </span>
                                    </div>
                                    <div className="dark:divide-border/60 dark:border-border/60 dark:bg-card divide-y divide-[#f0f0f4] rounded-lg border border-[#f0f0f4] bg-white p-2 text-xs">
                                      {item.payments.map((p) => (
                                        <div
                                          key={p.id}
                                          className="flex flex-col justify-between gap-1.5 py-1.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                                        >
                                          <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                                                {formatRupiah(p.amount)}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="h-4 px-1 text-[10px]"
                                              >
                                                {p.paymentMethod || "Transfer"}
                                              </Badge>
                                              <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(
                                                  p.paymentDate
                                                ).toLocaleDateString("id-ID", {
                                                  day: "numeric",
                                                  month: "short",
                                                  year: "numeric",
                                                })}
                                              </span>
                                            </div>
                                            {p.recipient && (
                                              <p className="text-muted-foreground text-[11px]">
                                                Penerima: {p.recipient}
                                              </p>
                                            )}
                                            {p.notes && (
                                              <p className="text-muted-foreground/80 text-[11px] italic">
                                                &ldquo;{p.notes}&rdquo;
                                              </p>
                                            )}
                                          </div>

                                          {(!isReadOnly || isPreview) && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                handleDeletePayment(
                                                  p.id,
                                                  item.id
                                                )
                                              }
                                              className="text-muted-foreground hover:text-destructive h-6 w-6 self-end p-0 sm:self-center"
                                              title="Hapus pembayaran ini"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="dark:border-border/60 dark:text-muted-foreground flex flex-col items-center justify-between gap-3 border-t border-[#f0f0f4] px-4 py-3.5 text-xs text-[#71717a] sm:flex-row sm:px-6">
          <span>
            Menampilkan{" "}
            <strong className="dark:text-foreground font-semibold text-[#18181b]">
              {filteredItems.length}
            </strong>{" "}
            dari {items.length} pos pengeluaran
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-primary font-medium hover:underline"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Item Modal (Create & Edit) */}
      {isItemModalOpen && (
        <BudgetItemModal
          weddingId={weddingId}
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setItemToEdit(null);
          }}
          itemToEdit={itemToEdit}
          onSuccess={handleItemSaved}
        />
      )}

      {/* Payment Modal */}
      {paymentModalItem && (
        <PaymentModal
          weddingId={weddingId}
          isOpen={Boolean(paymentModalItem)}
          onClose={() => setPaymentModalItem(null)}
          item={paymentModalItem}
          onSuccess={handlePaymentSaved}
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
