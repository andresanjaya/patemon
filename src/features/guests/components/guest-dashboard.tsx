"use client";

import { WorkspaceActionButton } from "@/features/workspaces/components/workspace-action-button";

import { confirmAction } from "@/components/ui/action-confirmation";

import { getWeddingGuests } from "../actions";

import { runAction, notify } from "@/components/ui/action-feedback";

import dynamic from "next/dynamic";
import {
  TablePagination,
  useTablePagination,
} from "@/components/ui/table-pagination";

import { cn } from "@/lib/utils";
import { TableStatusDropdown } from "@/components/ui/table-status-dropdown";
import { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Download,
  Upload,
  Search,
  MessageCircle,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  FolderTree,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { KeenthemesMetricSummary } from "@/components/ui/keenthemes-metric-summary";
import {
  GUEST_SIDES,
  INVITATION_STATUS_CONFIG,
  formatGuestSideLabel,
  getGuestSideBadgeClass,
  getInvitationStatusConfig,
  calculateGuestStats,
  exportGuestsToCSV,
} from "../seeds";
import {
  updateGuestInvitationStatusAction,
  deleteGuestAction,
  importSampleGuestsAction,
} from "../actions";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import type { Guest, GuestStats, InvitationStatus } from "../types";

const GuestModal = dynamic(() =>
  import("./guest-modal").then((module) => module.GuestModal)
);
const GuestImportModal = dynamic(() =>
  import("./guest-import-modal").then((module) => module.GuestImportModal)
);
const GuestWhatsAppModal = dynamic(() =>
  import("./guest-whatsapp-modal").then((module) => module.GuestWhatsAppModal)
);
const UpgradePromptModal = dynamic(() =>
  import("@/features/payments/components/upgrade-prompt-modal").then(
    (module) => module.UpgradePromptModal
  )
);

interface GuestDashboardProps {
  weddingId: string;
  coupleNames: string;
  prospectiveDate?: string | null;
  initialGuests: Guest[];
  initialStats: GuestStats;
  isPreview?: boolean;
}

export function GuestDashboard({
  weddingId,
  coupleNames,
  prospectiveDate,
  initialGuests,
  initialStats,
  isPreview: propIsPreview,
}: GuestDashboardProps) {
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

  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [stats, setStats] = useState<GuestStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSide, setSelectedSide] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "grouped">(
    "table"
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeWhatsAppGuest, setActiveWhatsAppGuest] = useState<Guest | null>(
    null
  );

  const [, startTransition] = useTransition();

  const handleGuestSuccess = (savedGuest: Guest, isEdit: boolean) => {
    let nextGuests: Guest[];
    if (isEdit) {
      nextGuests = guests.map((g) => (g.id === savedGuest.id ? savedGuest : g));
    } else {
      nextGuests = [savedGuest, ...guests];
    }
    setGuests(nextGuests);
    setStats(calculateGuestStats(nextGuests));
  };

  const handleStatusChange = (guestId: string, newStatus: InvitationStatus) => {
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

    if (isPreview) {
      triggerUpgrade();
      return;
    }
    const updated = guests.map((g) => {
      if (g.id !== guestId) return g;
      return {
        ...g,
        invitationStatus: newStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    startTransition(async () => {
      const result = await runAction(
        () => updateGuestInvitationStatusAction(weddingId, guestId, newStatus),
        "Status undangan berhasil diperbarui."
      );
      if (!result.success) return;
      setGuests(updated);
      setStats(calculateGuestStats(updated));
    });
  };

  const handleDelete = async (guestId: string) => {
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (
      !(await confirmAction({
        title: "Hapus tamu ini?",
        description: "Apakah Anda yakin ingin menghapus nama tamu ini?",
        confirmLabel: "Hapus tamu",
        destructive: true,
      }))
    )
      return;
    const nextGuests = guests.filter((g) => g.id !== guestId);

    startTransition(async () => {
      const result = await runAction(
        () => deleteGuestAction(weddingId, guestId),
        "Tamu berhasil dihapus."
      );
      if (!result.success) return;
      setGuests(nextGuests);
      setStats(calculateGuestStats(nextGuests));
    });
  };

  const refreshGuests = async () => {
    const result = await runAction(
      async () => ({ success: true, data: await getWeddingGuests(weddingId) }),
      false
    );
    if (result.success) {
      setGuests(result.data.guests);
      setStats(result.data.stats);
    }
  };

  const handleImportSample = () => {
    if (workspaceCtx && !workspaceCtx.requestEdit()) return;

    if (isPreview) {
      triggerUpgrade();
      return;
    }
    startTransition(async () => {
      const result = await runAction(
        () => importSampleGuestsAction(weddingId),
        "Contoh tamu berhasil ditambahkan."
      );
      if (result.success) await refreshGuests();
    });
  };

  const handleExportCSV = () => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    const csvData = exportGuestsToCSV(guests);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `daftar-tamu-${weddingId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(
      "info",
      "Berkas tamu siap diunduh. Periksa daftar unduhan browser Anda."
    );
  };

  // Distinct groups for dropdown filter
  const distinctGroups = Array.from(
    new Set(guests.map((g) => g.groupHousehold).filter(Boolean) as string[])
  ).sort();

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      !searchQuery ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.groupHousehold &&
        g.groupHousehold.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.phone && g.phone.includes(searchQuery)) ||
      (g.notes && g.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSide = selectedSide === "all" || g.side === selectedSide;
    const matchesGroup =
      selectedGroup === "all" || g.groupHousehold === selectedGroup;
    const matchesStatus =
      selectedStatus === "all" || g.invitationStatus === selectedStatus;

    return matchesSearch && matchesSide && matchesGroup && matchesStatus;
  });

  const pagination = useTablePagination(
    filteredGuests,
    JSON.stringify([
      weddingId,
      viewMode,
      searchQuery,
      selectedSide,
      selectedGroup,
      selectedStatus,
    ])
  );

  // Selection helpers (Issue #116)
  const allSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((guest) => selectedIds.has(guest.id));
  const isIndeterminate =
    !allSelected && filteredGuests.some((guest) => selectedIds.has(guest.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGuests.map((guest) => guest.id)));
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
    setSelectedSide("all");
    setSelectedGroup("all");
    setSelectedStatus("all");
  };

  const filteredHeadcount = filteredGuests.reduce(
    (sum, g) => sum + g.headcount,
    0
  );

  return (
    <div className="space-y-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Daftar Tamu & Undangan"
        badge={
          isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined
        }
        breadcrumbs={createWorkspaceBreadcrumbs(
          coupleNames || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Tamu"
        )}
        actions={
          <>
            {guests.length === 0 && (
              <WorkspaceActionButton
                variant="outline"
                size="sm"
                onClick={handleImportSample}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Impor Contoh Tamu Bali</span>
              </WorkspaceActionButton>
            )}

            <WorkspaceActionButton
              variant="outline"
              size="sm"
              disabled={isPreview}
              onClick={() => {
                if (isPreview) {
                  triggerUpgrade();
                  return;
                }
                setIsImportModalOpen(true);
              }}
              className="gap-1.5"
              title={
                isPreview
                  ? "Impor CSV dinonaktifkan pada Mode Demo"
                  : "Impor daftar tamu dari file CSV"
              }
            >
              <Upload className="h-4 w-4" />
              <span>Impor CSV</span>
            </WorkspaceActionButton>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isPreview || guests.length === 0}
              className="gap-1.5"
              title={
                isPreview
                  ? "Ekspor CSV dinonaktifkan pada Mode Demo"
                  : "Ekspor daftar tamu ke CSV"
              }
            >
              <Download className="h-4 w-4" />
              <span>Ekspor CSV</span>
            </Button>

            <WorkspaceActionButton
              size="sm"
              onClick={() => {
                if (isPreview) {
                  triggerUpgrade();
                  return;
                }
                setGuestToEdit(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tamu</span>
            </WorkspaceActionButton>
          </>
        }
      />

      {/* Summary Stats Bar: Keenthemes Compact Metric Standard */}
      <KeenthemesMetricSummary
        headlineLabel="Estimasi Total Tamu"
        headlineValue={`${stats.totalHeadcount} Pax`}
        subHeadline={`${stats.totalInvitations} Kepala Keluarga / Undangan`}
        breakdownTitle={`${stats.totalHeadcount} Estimasi Kehadiran Tamu`}
        items={[
          {
            label: "Terkonfirmasi Hadir",
            value: `${stats.confirmedHeadcount} Pax`,
            color: "bg-emerald-500",
            barWeight: stats.confirmedHeadcount,
          },
          {
            label: "Undangan Terkirim",
            value: `${stats.sentInvitations} Undangan`,
            color: "bg-blue-500",
            barWeight: stats.sentInvitations,
          },
          {
            label: "Belum Dikirim",
            value: `${stats.draftInvitations} Draft`,
            color: "bg-amber-500",
            barWeight: stats.draftInvitations,
          },
        ]}
      />

      {/* Ringkasan Konsumsi & Katering (Issue #87) */}
      <div className="bg-card/70 border-border/80 rounded-2xl border p-4 shadow-xs">
        <div className="space-y-4">
          <header className="border-border -mx-4 -mt-4 border-b p-4">
            <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
              Ringkasan Konsumsi & Katering
            </h3>
            <p className="text-muted-foreground text-[11px]">
              Alokasi porsi konsumsi berdasarkan status konfirmasi kehadiran
              RSVP
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-4">
            <div className="rounded-lg bg-stone-100 px-3 py-1.5 text-center dark:bg-stone-800/60">
              <span className="text-muted-foreground block text-[10px]">
                Diundang
              </span>
              <span className="text-foreground font-bold">
                {stats.invitedHeadcount} Pax
              </span>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-50 px-3 py-1.5 text-center dark:bg-emerald-950/40">
              <span className="block text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                Terkonfirmasi Hadir
              </span>
              <span className="font-bold text-emerald-800 dark:text-emerald-200">
                {stats.confirmedHeadcount} Pax
              </span>
            </div>
            <div className="rounded-lg border border-sky-500/20 bg-sky-50 px-3 py-1.5 text-center dark:bg-sky-950/40">
              <span className="block text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                Belum Merespons
              </span>
              <span className="font-bold text-sky-800 dark:text-sky-200">
                {stats.pendingHeadcount} Pax
              </span>
            </div>
            <div className="rounded-lg border border-rose-500/20 bg-rose-50 px-3 py-1.5 text-center dark:bg-rose-950/40">
              <span className="block text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                Menolak / Berhalangan
              </span>
              <span className="font-bold text-rose-800 dark:text-rose-200">
                {stats.declinedHeadcount} Pax
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Breakdown Pills Bar */}
      <div className="border-border/60 bg-card/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold">
            Distribusi Porsi Tamu:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Purusa (Pria):</span>
            <span className="text-foreground font-bold">
              {stats.groomHeadcount} Pax
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
            <span className="text-muted-foreground">Pradana (Wanita):</span>
            <span className="text-foreground font-bold">
              {stats.brideHeadcount} Pax
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">Kedua Pihak / Rekan:</span>
            <span className="text-foreground font-bold">
              {stats.mutualHeadcount} Pax
            </span>
          </div>

          {stats.declinedHeadcount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Berhalangan:</span>
              <span className="font-medium text-rose-600 dark:text-rose-400">
                {stats.declinedHeadcount} Pax
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="border-border/60 bg-card/60 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Cari nama tamu, dadia, banjar, nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <TableDropdownFilter
            label="Pihak Tamu"
            options={[
              { id: "all", label: "Semua Pihak", count: guests.length },
              ...GUEST_SIDES.map((s) => ({
                id: s.id,
                label: s.label,
                count: guests.filter((g) => g.side === s.id).length,
              })),
            ]}
            value={selectedSide}
            onChange={setSelectedSide}
            defaultAllId="all"
          />

          {distinctGroups.length > 0 && (
            <TableDropdownFilter
              label="Kelompok / Banjar"
              options={[
                { id: "all", label: "Semua Kelompok", count: guests.length },
                ...distinctGroups.map((g) => ({
                  id: g,
                  label: g,
                  count: guests.filter((item) => item.groupHousehold === g)
                    .length,
                })),
              ]}
              value={selectedGroup}
              onChange={setSelectedGroup}
              defaultAllId="all"
            />
          )}

          <TableDropdownFilter
            label="Status Undangan"
            options={[
              { id: "all", label: "Semua Status", count: guests.length },
              ...Object.entries(INVITATION_STATUS_CONFIG).map(([k, cfg]) => ({
                id: k,
                label: cfg.label,
                count: guests.filter((g) => g.invitationStatus === k).length,
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
            variant={viewMode === "grouped" ? "secondary" : "ghost"}
            size={null}
            type="button"
            onClick={() => setViewMode("grouped")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all shadow-none",
              viewMode === "grouped"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Dikelompokkan per Dadia / Banjar"
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Kelompok</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredGuests.length === 0 ? (
        <div className="border-border/60 bg-card/30 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Users className="text-muted-foreground/50 mb-3 h-12 w-12" />
          <h3 className="text-foreground text-base font-semibold">
            {guests.length === 0
              ? "Belum ada daftar tamu tersimpan"
              : "Tidak ada tamu yang cocok dengan filter"}
          </h3>
          <p className="text-muted-foreground mt-1 max-w-md text-xs">
            {guests.length === 0
              ? "Tambahkan tamu undangan keluarga besar, krama banjar adat, dan sahabat atau impor contoh daftar tamu untuk simulasi headcount."
              : "Coba ubah kata kunci pencarian, filter pihak, atau filter status di atas."}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {guests.length === 0 && (
              <WorkspaceActionButton
                variant="outline"
                size="sm"
                onClick={handleImportSample}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Impor Contoh Tamu Bali</span>
              </WorkspaceActionButton>
            )}
            <WorkspaceActionButton
              size="sm"
              onClick={() => {
                setGuestToEdit(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tamu Baru</span>
            </WorkspaceActionButton>
          </div>
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
                {selectedIds.size} tamu dipilih dari total{" "}
                {filteredGuests.length} hasil
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
              className="table-responsive table-metronic w-full border-collapse text-left text-sm"
              aria-label="Daftar Tamu dan Undangan"
            >
              <caption className="sr-only">
                Daftar Tamu dan Undangan Pawiwahan
              </caption>
              <colgroup>
                {["5%", "35%", "16%", "10%", "15%", "14%", "5%"].map(
                  (width, index) => (
                    <col key={index} style={{ width }} />
                  )
                )}
              </colgroup>
              <thead>
                <tr className="dark:bg-muted/40 dark:text-muted-foreground border-b border-[#e9e9ed] bg-[#f9f9fb] text-xs font-semibold text-[#65656f]">
                  <th
                    scope="col"
                    className="dark:border-border/80 w-12 border-r border-b border-[#e9e9ed] px-3 py-3 text-center font-mono"
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Nama Tamu & Pihak
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Kelompok & Banjar
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-center font-semibold"
                  >
                    Pax
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Status Undangan
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 font-semibold"
                  >
                    Kontak & Undangan WA
                  </th>
                  <th
                    scope="col"
                    className="dark:border-border/80 border-b border-[#e9e9ed] px-4 py-3.5 text-right font-semibold"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="dark:divide-border/80 divide-y divide-[#e9e9ed]">
                {pagination.items.map((guest, idx) => {
                  const statusConfig = getInvitationStatusConfig(
                    guest.invitationStatus
                  );
                  const isSelected = selectedIds.has(guest.id);

                  return (
                    <tr
                      key={guest.id}
                      className={`dark:hover:bg-muted/20 transition-colors hover:bg-[#fbfbfd] ${
                        isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td
                        data-label="No"
                        className="dark:text-muted-foreground dark:border-border/80 border-r border-b border-[#e9e9ed] px-3 py-3.5 text-center align-middle font-mono text-xs font-semibold text-[#71717a]"
                      >
                        {pagination.start + idx}
                      </td>

                      <td
                        data-label="Nama Tamu &amp; Pihak"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="dark:text-foreground text-sm font-semibold text-[#18181b]">
                            {guest.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`h-5 whitespace-nowrap shrink-0 text-[10px] font-normal ${getGuestSideBadgeClass(guest.side)}`}
                          >
                            {formatGuestSideLabel(guest.side)}
                          </Badge>
                        </div>
                        {guest.notes && (
                          <p className="dark:text-muted-foreground mt-0.5 text-xs text-[#71717a]">
                            {guest.notes}
                          </p>
                        )}
                      </td>

                      <td
                        data-label="Kelompok &amp; Banjar"
                        className="dark:text-muted-foreground dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle text-xs text-[#65656f]"
                      >
                        {guest.groupHousehold || "-"}
                      </td>

                      <td
                        data-label="Pax"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 text-center align-middle"
                      >
                        <span className="dark:bg-muted dark:text-foreground inline-block rounded-md bg-[#f0f0f4] px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-[#18181b]">
                          {guest.headcount} Pax
                        </span>
                        {guest.invitationStatus === "confirmed" &&
                          typeof guest.rsvpAttendingCount === "number" && (
                            <span className="mt-0.5 block text-[10px] font-medium whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                              Hadir: {guest.rsvpAttendingCount} Pax
                            </span>
                          )}
                      </td>

                      <td
                        data-label="Status Undangan"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <TableStatusDropdown
                          value={guest.invitationStatus}
                          options={Object.entries(INVITATION_STATUS_CONFIG).map(
                            ([k, cfg]) => ({
                              value: k,
                              label: cfg.label,
                              badgeClass: cfg.badgeClass,
                            })
                          )}
                          ariaLabel={`Ubah status undangan ${guest.name}`}
                          onChange={(val) =>
                            handleStatusChange(
                              guest.id,
                              val as InvitationStatus
                            )
                          }
                          className={statusConfig.badgeClass}
                        />
                      </td>

                      <td
                        data-label="Kontak &amp; Undangan WA"
                        className="dark:border-border/80 border-r border-b border-[#e9e9ed] px-4 py-3.5 align-middle"
                      >
                        <div className="flex items-center gap-2">
                          <Button
                            size={null}
                            type="button"
                            onClick={() => {
                              if (isPreview) {
                                triggerUpgrade();
                                return;
                              }
                              setActiveWhatsAppGuest(guest);
                            }}
                            className="gap-1.5 px-2 py-1 text-[11px] font-semibold shadow-2xs whitespace-nowrap shrink-0"
                            title="Tinjau & Kirim Undangan via WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>Undangan WA</span>
                          </Button>
                          {guest.phone ? (
                            <span className="dark:text-muted-foreground text-xs whitespace-nowrap text-[#65656f]">
                              {guest.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px] italic whitespace-nowrap">
                              (Belum ada nomor)
                            </span>
                          )}
                        </div>
                      </td>

                      <td
                        data-label="Aksi"
                        className="dark:border-border/80 border-b border-[#e9e9ed] px-4 py-3.5 text-right align-middle"
                      >
                        <div className="flex items-center justify-end">
                          <TableActionDropdown
                            triggerAriaLabel={`Aksi untuk tamu ${guest.name}`}
                            items={[
                              {
                                label: "Edit Tamu",
                                icon: <Edit2 className="h-3.5 w-3.5" />,
                                onClick: () => {
                                  if (isPreview) {
                                    triggerUpgrade();
                                    return;
                                  }
                                  setGuestToEdit(guest);
                                  setIsModalOpen(true);
                                },
                              },
                              {
                                label: "Hapus Tamu",
                                icon: <Trash2 className="h-3.5 w-3.5" />,
                                variant: "destructive",
                                onClick: () => {
                                  return handleDelete(guest.id);
                                },
                              },
                            ]}
                          />
                        </div>
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
                {filteredGuests.length}
              </strong>{" "}
              dari {guests.length} tamu (Total{" "}
              <strong className="dark:text-foreground font-semibold text-[#18181b]">
                {filteredHeadcount}
              </strong>{" "}
              Pax)
            </span>
            {(Boolean(searchQuery.trim()) ||
              selectedSide !== "all" ||
              selectedGroup !== "all" ||
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
      ) : viewMode === "grid" ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagination.items.map((guest) => {
            const statusConfig = getInvitationStatusConfig(
              guest.invitationStatus
            );

            return (
              <div
                key={guest.id}
                className="border-border/60 hover:border-border bg-card flex flex-col justify-between rounded-xl border p-4 shadow-xs transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getGuestSideBadgeClass(guest.side)}`}
                    >
                      {formatGuestSideLabel(guest.side)}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-bold">
                        {guest.headcount} Pax
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-foreground text-base font-bold">
                      {guest.name}
                    </h3>
                    <p className="text-muted-foreground text-xs font-medium">
                      {guest.groupHousehold || "Umum"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-muted-foreground text-xs">
                      Status Undangan:
                    </span>
                    <TableStatusDropdown
                      value={guest.invitationStatus}
                      options={Object.entries(INVITATION_STATUS_CONFIG).map(
                        ([k, cfg]) => ({
                          value: k,
                          label: cfg.label,
                          badgeClass: cfg.badgeClass,
                        })
                      )}
                      ariaLabel={`Ubah status undangan ${guest.name}`}
                      onChange={(val) =>
                        handleStatusChange(guest.id, val as InvitationStatus)
                      }
                      className={statusConfig.badgeClass}
                    />
                  </div>

                  {guest.rsvpNotes && (
                    <p className="line-clamp-2 rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-800 italic dark:text-emerald-200">
                      &ldquo;{guest.rsvpNotes}&rdquo;
                    </p>
                  )}
                  {guest.notes && (
                    <p className="bg-muted/40 text-muted-foreground line-clamp-2 rounded-lg p-2 text-xs">
                      {guest.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size={null}
                      type="button"
                      onClick={() => {
                        if (isPreview) {
                          triggerUpgrade();
                          return;
                        }
                        setActiveWhatsAppGuest(guest);
                      }}
                      className="gap-1 px-2 py-1 text-xs"
                      title="Tinjau & Kirim Undangan WhatsApp"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>Undangan WA</span>
                    </Button>
                    {guest.phone && (
                      <span className="text-muted-foreground text-[11px]">
                        {guest.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <WorkspaceActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isPreview) {
                          triggerUpgrade();
                          return;
                        }
                        setGuestToEdit(guest);
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
                        return handleDelete(guest.id);
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
      ) : (
        /* Grouped by Household / Dadia / Banjar View */
        <div className="space-y-6">
          {Array.from(
            new Set(
              filteredGuests.map(
                (g) => g.groupHousehold || "Lainnya / Belum Dikelompokkan"
              )
            )
          ).map((groupName) => {
            const groupGuests = filteredGuests.filter(
              (g) =>
                (g.groupHousehold || "Lainnya / Belum Dikelompokkan") ===
                groupName
            );
            const pageGuests = groupGuests.filter((guest) =>
              pagination.items.some((item) => item.id === guest.id)
            );
            if (pageGuests.length === 0) return null;
            const groupPax = groupGuests.reduce(
              (sum, g) =>
                g.invitationStatus !== "declined" ? sum + g.headcount : sum,
              0
            );

            return (
              <div
                key={groupName}
                className="border-border/60 bg-card/40 space-y-4 rounded-xl border p-4"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <FolderTree className="text-primary h-4 w-4" />
                    <h3 className="text-foreground text-sm font-bold">
                      {groupName}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {groupGuests.length} Undangan
                    </Badge>
                  </div>

                  <div className="text-primary text-xs font-bold">
                    Total: {groupPax} Pax
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pageGuests.map((guest) => {
                    const statusConfig = getInvitationStatusConfig(
                      guest.invitationStatus
                    );

                    return (
                      <div
                        key={guest.id}
                        className="bg-background border-border/80 hover:border-border space-y-2 rounded-lg border p-3 text-xs shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-foreground font-bold">
                            {guest.name}
                          </span>
                          <span className="bg-primary/10 text-primary py-0.2 rounded px-1.5 text-[11px] font-bold">
                            {guest.headcount} Pax
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            {formatGuestSideLabel(guest.side)}
                          </span>
                          <TableStatusDropdown
                            value={guest.invitationStatus}
                            options={Object.entries(
                              INVITATION_STATUS_CONFIG
                            ).map(([k, cfg]) => ({
                              value: k,
                              label: cfg.label,
                              badgeClass: cfg.badgeClass,
                            }))}
                            ariaLabel={`Ubah status undangan ${guest.name}`}
                            onChange={(val) =>
                              handleStatusChange(
                                guest.id,
                                val as InvitationStatus
                              )
                            }
                            className={statusConfig.badgeClass}
                          />
                        </div>

                        <div className="flex items-center justify-between border-t pt-2">
                          <div>
                            <Button
                              variant="link"
                              size={null}
                              type="button"
                              onClick={() => {
                                if (isPreview) {
                                  triggerUpgrade();
                                  return;
                                }
                                setActiveWhatsAppGuest(guest);
                              }}
                              className="gap-1 text-[11px] font-medium"
                              title="Tinjau & Kirim Undangan via WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span>Undangan WA</span>
                            </Button>
                          </div>

                          <div className="flex items-center gap-1">
                            <WorkspaceActionButton
                              variant="ghost"
                              size={null}
                              type="button"
                              onClick={() => {
                                if (isPreview) {
                                  triggerUpgrade();
                                  return;
                                }
                                setGuestToEdit(guest);
                                setIsModalOpen(true);
                              }}
                              className="p-0.5 text-[10px]"
                            >
                              Edit
                            </WorkspaceActionButton>
                            <WorkspaceActionButton
                              variant="destructive"
                              size={null}
                              type="button"
                              onClick={() => {
                                return handleDelete(guest.id);
                              }}
                              className="p-0.5 text-[10px]"
                            >
                              Hapus
                            </WorkspaceActionButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TablePagination pagination={pagination} label="tamu" />

      {/* Guest Modal */}
      {isModalOpen && (
        <GuestModal
          weddingId={weddingId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setGuestToEdit(null);
          }}
          guestToEdit={guestToEdit}
          onSuccess={handleGuestSuccess}
        />
      )}

      {/* CSV Import Modal (Issue #85) */}
      {isImportModalOpen && (
        <GuestImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          weddingId={weddingId}
          existingGuests={guests}
          isPreview={isPreview}
          onPreviewUpgrade={triggerUpgrade}
          onImportSuccess={() => {
            void refreshGuests();
          }}
        />
      )}

      {/* WhatsApp Invite Modal (Issue #86) */}
      {activeWhatsAppGuest && (
        <GuestWhatsAppModal
          isOpen={!!activeWhatsAppGuest}
          onClose={() => setActiveWhatsAppGuest(null)}
          guest={activeWhatsAppGuest}
          weddingId={weddingId}
          context={{
            coupleNames,
            prospectiveDate,
            ceremonyLocation: "Bali",
          }}
          onStatusUpdated={(guestId, newStatus) => {
            handleStatusChange(guestId, newStatus);
            setActiveWhatsAppGuest((prev) =>
              prev ? { ...prev, invitationStatus: newStatus } : null
            );
          }}
        />
      )}

      {/* Fallback Upgrade Modal */}
      {isLocalUpgradeOpen && (
        <UpgradePromptModal
          isOpen={isLocalUpgradeOpen}
          onClose={() => setIsLocalUpgradeOpen(false)}
          weddingId={weddingId}
        />
      )}
    </div>
  );
}
