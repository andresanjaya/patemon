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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/features/workspaces/validation";
import { downloadCSV } from "@/lib/csv-export";
import { formatBantenToCSV } from "@/features/exports/formatters";
import { BantenItemModal } from "./banten-item-modal";
import { CatalogPickerModal } from "./catalog-picker-modal";
import { deleteBantenItemAction, updateBantenStatusAction } from "../actions";
import type {
  BantenAcquisitionStatus,
  BantenItem,
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
}

export function BantenPlannerDashboard({
  weddingId,
  initialItems,
  catalog,
  ceremonies,
  userRole,
}: BantenPlannerDashboardProps) {
  const router = useRouter();
  const canEdit = userRole === "owner" || userRole === "editor";

  const [items, setItems] = useState<BantenItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
  const [selectedMethod, setSelectedMethod] = useState<string>("Semua");
  const [selectedCeremony, setSelectedCeremony] = useState<string>("Semua");
  const [groupBy, setGroupBy] = useState<"ceremony" | "method" | "flat">(
    "ceremony"
  );

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BantenItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Summary Metrics
  const totalCount = items.length;
  const readyCount = items.filter((i) => i.status === "ready").length;
  const makingCount = items.filter((i) => i.status === "making").length;
  const orderedCount = items.filter((i) => i.status === "ordered").length;
  const neededCount = items.filter((i) => i.status === "needed").length;

  const totalEstimatedCost = items.reduce(
    (sum, i) => sum + (Number(i.estimatedPrice) || 0),
    0
  );
  const totalActualCost = items.reduce(
    (sum, i) => sum + (Number(i.actualPrice) || 0),
    0
  );

  const handleToggleStatus = async (item: BantenItem) => {
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

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesStatus =
      selectedStatus === "Semua" || item.status === selectedStatus;
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

    return matchesStatus && matchesMethod && matchesCeremony && matchesSearch;
  });

  // Group items
  const renderItemCard = (item: BantenItem) => (
    <div
      key={item.id}
      className="border-border bg-card hover:border-primary/40 flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-xs transition-colors sm:flex-row sm:items-center"
    >
      <div className="flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-foreground text-sm font-bold sm:text-base">
            {item.name}
          </h4>
          <span className="text-muted-foreground text-xs">
            ({item.quantity} {item.unit})
          </span>
          <Badge variant="outline" className="text-[10px] capitalize">
            {item.category || "Umum"}
          </Badge>
          {getSourcingBadge(item.sourcingMethod)}
          <button
            type="button"
            onClick={() => handleToggleStatus(item)}
            disabled={!canEdit}
            className="cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
            title={canEdit ? "Klik untuk mengubah status pengadaan" : undefined}
          >
            {getStatusBadge(item.status)}
          </button>
        </div>

        {item.notes && (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {item.notes}
          </p>
        )}

        <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-0.5 text-xs">
          {item.ceremonyTitle && (
            <span className="text-primary flex items-center gap-1">
              <CalendarHeart className="h-3.5 w-3.5" />
              {item.ceremonyTitle}
            </span>
          )}
          {item.assigneeName && (
            <span>Penyedia / PIC: {item.assigneeName}</span>
          )}
          {(item.estimatedPrice > 0 || item.actualPrice > 0) && (
            <span className="text-foreground font-semibold">
              Est: {formatRupiah(item.estimatedPrice)}
              {item.actualPrice > 0 &&
                ` · Realisasi: ${formatRupiah(item.actualPrice)}`}
            </span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            className="h-8 w-8 p-0"
            title="Edit Banten"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingId(item.id)}
            className="hover:text-destructive text-muted-foreground h-8 w-8 p-0"
            title="Hapus Banten"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Banner & Summary Stats */}
      <div className="border-border bg-card/60 rounded-2xl border p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-foreground text-2xl font-bold sm:text-3xl">
              Perencana Banten & Sarana Ritual
            </h1>
            <p className="text-muted-foreground max-w-2xl text-xs sm:text-sm">
              Kelola daftar banten, perlengkapan upakara, pembagian tugas
              pembuatan (ngayah) atau pemesanan ke serati banten, serta
              sinkronisasi estimasi biaya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                  setEditingItem(null);
                  setIsItemModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Banten</span>
              </Button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="border-border/60 mt-5 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">Total Sarana</span>
            <p className="text-foreground text-xl font-bold">{totalCount}</p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">
              Siap di Lokasi
            </span>
            <p className="text-xl font-bold text-emerald-600">{readyCount}</p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">Sedang Dibuat</span>
            <p className="text-xl font-bold text-amber-600">{makingCount}</p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">
              Dipesan Serati
            </span>
            <p className="text-xl font-bold text-blue-600">{orderedCount}</p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">Belum Dipesan</span>
            <p className="text-xl font-bold text-amber-800 dark:text-amber-300">
              {neededCount}
            </p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">
              Estimasi / Realisasi
            </span>
            <p className="text-foreground text-sm font-bold sm:text-base">
              {formatRupiah(totalEstimatedCost)}
            </p>
            {totalActualCost > 0 && (
              <p className="text-muted-foreground text-[11px]">
                Realisasi: {formatRupiah(totalActualCost)}
              </p>
            )}
          </div>
        </div>
      </div>

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

      {/* Filters and Search Bar */}
      <div className="border-border bg-card/60 space-y-3 rounded-2xl border p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Cari banten, serati, upacara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="Semua">Semua Status</option>
              <option value="needed">Dibutuhkan</option>
              <option value="ordered">Dipesan</option>
              <option value="making">Sedang Dibuat</option>
              <option value="ready">Siap</option>
              <option value="not_needed">Tidak Diperlukan</option>
            </select>

            {/* Sourcing Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="Semua">Semua Pengadaan</option>
              <option value="purchased_package">Beli Paket Serati</option>
              <option value="self_made">Ngayah Keluarga</option>
              <option value="family_assigned">Tugas Keluarga</option>
              <option value="vendor_order">Pesan Vendor</option>
            </select>

            {/* Ceremony Filter */}
            <select
              value={selectedCeremony}
              onChange={(e) => setSelectedCeremony(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-2.5 text-xs"
            >
              <option value="Semua">Semua Prosesi</option>
              <option value="umum">Kebutuhan Umum</option>
              {ceremonies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* View Mode */}
            <div className="bg-muted/50 border-border/80 flex items-center rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => setGroupBy("ceremony")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  groupBy === "ceremony"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Grup Upacara
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("method")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  groupBy === "method"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Grup Pengadaan
              </button>
              <button
                type="button"
                onClick={() => setGroupBy("flat")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  groupBy === "flat"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content List / Grouped View */}
      {filteredItems.length === 0 ? (
        <div className="border-border bg-card/40 rounded-2xl border border-dashed py-12 text-center">
          <Flower2 className="text-muted-foreground/60 mx-auto h-10 w-10" />
          <h3 className="text-foreground mt-3 text-base font-bold">
            Belum Ada Banten Terdaftar
          </h3>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs">
            {items.length === 0
              ? "Tambahkan banten baru atau pilih paket banten kanonik dari katalog pustaka adat."
              : "Tidak ada banten yang cocok dengan filter atau kata kunci saat ini."}
          </p>
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
        </div>
      ) : groupBy === "ceremony" ? (
        // Group by Ceremony
        <div className="space-y-6">
          {Array.from(
            new Set(
              filteredItems.map((i) => i.ceremonyTitle || "Kebutuhan Umum")
            )
          ).map((groupTitle) => {
            const groupItems = filteredItems.filter(
              (i) => (i.ceremonyTitle || "Kebutuhan Umum") === groupTitle
            );

            return (
              <div key={groupTitle} className="space-y-3">
                <div className="border-border/60 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <CalendarHeart className="text-primary h-4 w-4" />
                    <h3 className="text-foreground text-sm font-bold tracking-wider uppercase">
                      {groupTitle}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {groupItems.length} Sarana
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold">
                    Total:{" "}
                    {formatRupiah(
                      groupItems.reduce(
                        (sum, i) => sum + (Number(i.estimatedPrice) || 0),
                        0
                      )
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupItems.map(renderItemCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : groupBy === "method" ? (
        // Group by Sourcing Method
        <div className="space-y-6">
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
              <div key={method.key} className="space-y-3">
                <div className="border-border/60 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="text-primary h-4 w-4" />
                    <h3 className="text-foreground text-sm font-bold tracking-wider uppercase">
                      {method.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {groupItems.length} Sarana
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold">
                    Total:{" "}
                    {formatRupiah(
                      groupItems.reduce(
                        (sum, i) => sum + (Number(i.estimatedPrice) || 0),
                        0
                      )
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupItems.map(renderItemCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat List
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map(renderItemCard)}
        </div>
      )}

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
    </div>
  );
}
