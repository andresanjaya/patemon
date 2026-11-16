"use client";

import { useState, useMemo, useTransition } from "react";
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
  const isPreview = propIsPreview ?? workspaceCtx?.isPreview ?? (weddingId === "demo");
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
        badge={isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined}
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

            {(!isReadOnly || isPreview) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportStarter}
                  className="gap-1.5 text-xs"
                >
                  <Sparkles className="text-primary h-3.5 w-3.5" />
                  <span>Rekomendasi Anggaran Adat</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    if (isPreview) {
                      triggerUpgrade();
                      return;
                    }
                    setItemToEdit(null);
                    setIsItemModalOpen(true);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Pos Anggaran</span>
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Top Financial KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Target Anggaran */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Target Anggaran
            </CardTitle>
            <Wallet className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {formatRupiah(stats.targetBudget)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Alokasi batas maksimal
            </p>
          </CardContent>
        </Card>

        {/* Total Rencana Biaya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Rencana Biaya
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600 sm:text-2xl dark:text-blue-400">
              {formatRupiah(stats.totalPlanned)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {stats.itemCount} pos pengeluaran
            </p>
          </CardContent>
        </Card>

        {/* Realisasi Komitmen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Realisasi Pengeluaran
            </CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold sm:text-2xl">
              {formatRupiah(stats.totalActual)}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Kontrak & kesepakatan vendor
            </p>
          </CardContent>
        </Card>

        {/* Telah Dibayar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Telah Dibayar (DP/Lunas)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-xl font-bold text-emerald-600 sm:text-2xl dark:text-emerald-400">
              {formatRupiah(stats.totalPaid)}
            </div>
            <p className="text-muted-foreground text-[11px]">
              Sisa tagihan:{" "}
              <strong className="text-rose-600 dark:text-rose-400">
                {formatRupiah(stats.totalOutstanding)}
              </strong>
            </p>
          </CardContent>
        </Card>

        {/* Sisa Saldo Anggaran */}
        <Card
          className={
            isOverBudget
              ? "col-span-2 border-rose-500/40 bg-rose-500/5 lg:col-span-1 dark:bg-rose-500/10"
              : "col-span-2 lg:col-span-1"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              {isOverBudget ? "Defisit Anggaran" : "Sisa Saldo Anggaran"}
            </CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${
                isOverBudget ? "text-rose-500" : "text-emerald-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold sm:text-2xl ${
                isOverBudget
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatRupiah(Math.abs(stats.remainingBudget))}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {isOverBudget
                ? "Melebihi target anggaran awal"
                : "Saldo aman di bawah target"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-4">
        {/* Filter Controls Bar */}
        <div className="bg-card border-border/60 space-y-3 rounded-xl border p-4 shadow-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Cari pengeluaran, vendor, catatan..."
                className="h-9 pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="all">Semua Kategori</option>
              {BUDGET_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="all">Semua Status</option>
              <option value="estimated">Estimasi Awal</option>
              <option value="booked">Dipesan / Deal</option>
              <option value="paid_partial">DP / Cicilan</option>
              <option value="paid_full">Lunas</option>
              <option value="canceled">Dibatalkan</option>
            </select>

            {/* Paid By Filter */}
            <select
              value={paidByFilter}
              onChange={(e) => setPaidByFilter(e.target.value)}
              className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="all">Semua Sumber Dana</option>
              {uniquePaidBy.map((pb) => (
                <option key={pb} value={pb}>
                  {pb}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  Reset Filter
                </Button>
              )}
            </div>

            {/* Group By Selector */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Layers className="h-3.5 w-3.5" /> Kelompokkan:
              </span>
              <div className="border-border/60 bg-muted/30 inline-flex rounded-md border p-0.5">
                <button
                  type="button"
                  onClick={() => setGroupBy("category")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    groupBy === "category"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Kategori
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy("status")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    groupBy === "status"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy("paid_by")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    groupBy === "paid_by"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sumber Dana
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy("none")}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    groupBy === "none"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Budget Item List */}
      {filteredItems.length === 0 ? (
        <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center">
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
              !isReadOnly && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImportStarter}
                    className="gap-1.5"
                  >
                    <Sparkles className="text-primary h-3.5 w-3.5" />
                    <span>Muat Rekomendasi Anggaran Adat</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setItemToEdit(null);
                      setIsItemModalOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Pengeluaran Sendiri</span>
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              {groupBy !== "none" && (
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <Tag className="text-primary h-3.5 w-3.5" />
                    <span>{group.groupTitle}</span>
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-[11px]"
                    >
                      {group.items.length}
                    </Badge>
                  </h3>
                  {group.subtotal !== undefined && (
                    <span className="text-muted-foreground text-xs font-medium">
                      Subtotal:{" "}
                      <strong className="text-foreground">
                        {formatRupiah(group.subtotal)}
                      </strong>
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-3">
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
                  const percentPaid =
                    effectiveTotal > 0
                      ? Math.min(
                          100,
                          Math.round((item.paidAmount / effectiveTotal) * 100)
                        )
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="border-border/60 bg-card hover:border-primary/40 space-y-3 rounded-xl border p-4 shadow-xs transition-colors"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground text-sm font-semibold">
                              {item.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="h-5 text-[10px] font-normal"
                            >
                              {getBudgetCategoryLabel(item.category)}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`h-5 border text-[10px] font-medium ${getBudgetItemStatusBadgeClass(
                                item.status
                              )}`}
                            >
                              {getBudgetItemStatusLabel(item.status)}
                            </Badge>
                          </div>

                          {item.notes && (
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              {item.notes}
                            </p>
                          )}

                          <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-1 text-xs">
                            <span className="text-foreground/80 inline-flex items-center gap-1">
                              <Building className="text-primary h-3 w-3" />
                              <span>
                                {item.quantity} {item.unit || "Paket"} @{" "}
                                {formatRupiah(item.unitPrice)}
                              </span>
                            </span>
                            {item.paidBy && (
                              <span className="text-foreground/80 inline-flex items-center gap-1">
                                <span>
                                  Alokasi: <strong>{item.paidBy}</strong>
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financial Figures & Actions */}
                        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
                          <div className="text-right">
                            <span className="text-muted-foreground block text-[11px]">
                              Total Biaya:
                            </span>
                            <span className="text-foreground text-base font-bold sm:text-lg">
                              {formatRupiah(effectiveTotal)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {(!isReadOnly || isPreview) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (isPreview) {
                                      triggerUpgrade();
                                      return;
                                    }
                                    setPaymentModalItem(item);
                                  }}
                                  className="border-primary/30 text-primary hover:bg-primary/5 h-7 gap-1 text-xs"
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                  <span>+ Bayar</span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (isPreview) {
                                      triggerUpgrade();
                                      return;
                                    }
                                    setItemToEdit(item);
                                    setIsItemModalOpen(true);
                                  }}
                                  className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
                                  title="Ubah Rincian"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                                  title="Hapus Rincian"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment Progress Bar */}
                      <div className="border-border/40 space-y-1.5 border-t pt-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <span>Terbayar:</span>
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(item.paidAmount)}
                            </strong>
                            <span className="text-[10px]">
                              ({percentPaid}%)
                            </span>
                          </span>

                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <span>Sisa Tagihan:</span>
                            <strong
                              className={
                                remaining > 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-muted-foreground"
                              }
                            >
                              {formatRupiah(remaining)}
                            </strong>
                          </span>
                        </div>

                        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percentPaid >= 100
                                ? "bg-emerald-500"
                                : "bg-primary"
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>

                        {/* Payment Transactions Accordion Toggle */}
                        {item.payments && item.payments.length > 0 && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleExpandPayments(item.id)}
                              className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  <span>
                                    Tutup Riwayat Pembayaran (
                                    {item.payments.length} transaksi)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" />
                                  <span>
                                    Lihat Riwayat Pembayaran (
                                    {item.payments.length} transaksi)
                                  </span>
                                </>
                              )}
                            </button>

                            {/* Expanded Payments List */}
                            {isExpanded && (
                              <div className="divide-border/40 border-border/60 bg-muted/20 mt-2 space-y-2 divide-y rounded-lg border p-2.5 text-xs">
                                {item.payments.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex flex-col justify-between gap-1.5 py-1.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
                                          handleDeletePayment(p.id, item.id)
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
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

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
