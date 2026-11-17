"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Download,
  Upload,
  Search,
  MessageCircle,
  CheckCircle2,
  Send,
  Clock,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  FolderTree,
  Sparkles,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { GuestModal } from "./guest-modal";
import { GuestImportModal } from "./guest-import-modal";
import { GuestWhatsAppModal } from "./guest-whatsapp-modal";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import type { Guest, GuestStats, InvitationStatus } from "../types";

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
  const isPreview = propIsPreview ?? workspaceCtx?.isPreview ?? (weddingId === "demo");
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
    setGuests(updated);
    setStats(calculateGuestStats(updated));

    startTransition(async () => {
      await updateGuestInvitationStatusAction(weddingId, guestId, newStatus);
    });
  };

  const handleDelete = (guestId: string) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus nama tamu ini?")) return;
    const nextGuests = guests.filter((g) => g.id !== guestId);
    setGuests(nextGuests);
    setStats(calculateGuestStats(nextGuests));

    startTransition(async () => {
      await deleteGuestAction(weddingId, guestId);
    });
  };

  const handleImportSample = () => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    startTransition(async () => {
      await importSampleGuestsAction(weddingId);
      window.location.reload();
    });
  };

  const handleExportCSV = () => {
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

  const filteredHeadcount = filteredGuests.reduce((sum, g) => sum + g.headcount, 0);

  return (
    <div className="space-y-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Daftar Tamu & Undangan"
        badge={isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined}
        breadcrumbs={createWorkspaceBreadcrumbs(
          coupleNames || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Tamu"
        )}
        actions={
          <>
            {guests.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportSample}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Impor Contoh Tamu Bali</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              <span>Impor CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={guests.length === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Ekspor CSV</span>
            </Button>

            <Button
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
            </Button>
          </>
        }
      />

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Undangan
            </CardTitle>
            <Users className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalInvitations} KK / Grup
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Terdaftar dalam workspace
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Estimasi Total Pax
            </CardTitle>
            <Heart className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-2xl font-bold">
              {stats.totalHeadcount} Pax
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Porsi katering (tanpa declined)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Konfirmasi Hadir
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.confirmedHeadcount} Pax
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.confirmedInvitations} undangan pasti hadir
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Undangan Terkirim
            </CardTitle>
            <Send className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              {stats.sentInvitations} Undangan
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Fisik / digital tersampaikan
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Draft / Belum Kirim
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-2xl font-bold">
              {stats.draftInvitations} Draft
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {stats.declinedInvitations > 0
                ? `${stats.declinedInvitations} undangan berhalangan`
                : "Perlu konfirmasi pengiriman"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ringkasan Konsumsi & Katering (Issue #87) */}
      <div className="bg-card/70 border-border/80 rounded-2xl border p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
              Ringkasan Konsumsi & Katering
            </h3>
            <p className="text-muted-foreground text-[11px]">
              Alokasi porsi konsumsi berdasarkan status konfirmasi kehadiran
              RSVP
            </p>
          </div>
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
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder="Cari nama tamu, dadia, banjar, nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={selectedSide}
            onChange={(e) => setSelectedSide(e.target.value)}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-xs shadow-xs"
          >
            <option value="all">Semua Pihak</option>
            {GUEST_SIDES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-xs shadow-xs"
          >
            <option value="all">Semua Kelompok</option>
            {distinctGroups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-xs shadow-xs"
          >
            <option value="all">Semua Status</option>
            {Object.entries(INVITATION_STATUS_CONFIG).map(([k, cfg]) => (
              <option key={k} value={k}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 border-t pt-2 sm:border-t-0 sm:pt-0">
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
            variant={viewMode === "grouped" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grouped")}
            className="h-8 px-2.5 text-xs"
            title="Dikelompokkan per Dadia / Banjar"
          >
            <FolderTree className="mr-1 h-3.5 w-3.5" />
            Kelompok
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportSample}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Impor Contoh Tamu Bali</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setGuestToEdit(null);
                setIsModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tamu Baru</span>
            </Button>
          </div>
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
                {selectedIds.size} tamu dipilih dari total {filteredGuests.length} hasil
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
            <table className="w-full text-left text-xs" aria-label="Daftar Tamu dan Undangan">
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
                      aria-label="Pilih semua tamu pada filter ini"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-amber-600"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Nama Tamu / Kepala Keluarga</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Pihak</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Kelompok / Dadia / Banjar</th>
                  <th scope="col" className="px-4 py-3.5 text-center font-semibold">Pax</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Status Undangan</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Kontak & Undangan WA</th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">Catatan Khusus</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f4] dark:divide-border/60">
                {filteredGuests.map((guest) => {
                  const statusConfig = getInvitationStatusConfig(
                    guest.invitationStatus
                  );
                  const isSelected = selectedIds.has(guest.id);

                  return (
                    <tr
                      key={guest.id}
                      className={`hover:bg-[#f9f9fb]/60 dark:hover:bg-muted/20 transition-colors ${
                        isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="w-10 px-4 py-3.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(guest.id)}
                          aria-label={`Pilih ${guest.name}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-amber-600"
                        />
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <div className="text-sm font-semibold text-[#18181b] dark:text-foreground">
                          {guest.name}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 font-normal ${getGuestSideBadgeClass(guest.side)}`}
                        >
                          {formatGuestSideLabel(guest.side)}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 align-middle text-xs text-[#71717a] dark:text-muted-foreground whitespace-nowrap">
                        {guest.groupHousehold || "-"}
                      </td>

                      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                        <span className="bg-[#f0f0f4] dark:bg-muted text-[#18181b] dark:text-foreground font-semibold rounded-full px-2.5 py-0.5 text-xs">
                          {guest.headcount} Pax
                        </span>
                        {guest.invitationStatus === "confirmed" &&
                          typeof guest.rsvpAttendingCount === "number" && (
                            <span className="mt-0.5 block text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              Hadir: {guest.rsvpAttendingCount} Pax
                            </span>
                          )}
                      </td>

                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <select
                          value={guest.invitationStatus}
                          onChange={(e) =>
                            handleStatusChange(
                              guest.id,
                              e.target.value as InvitationStatus
                            )
                          }
                          className={`rounded-md border px-2 py-1 text-xs font-medium shadow-xs focus:outline-hidden ${statusConfig.badgeClass}`}
                          aria-label={`Ubah status ${guest.name}`}
                        >
                          {Object.entries(INVITATION_STATUS_CONFIG).map(
                            ([k, cfg]) => (
                              <option key={k} value={k}>
                                {cfg.label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isPreview) {
                                triggerUpgrade();
                                return;
                              }
                              setActiveWhatsAppGuest(guest);
                            }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#0d7366] bg-[#128C7E] px-2 py-1 text-[11px] font-semibold text-white shadow-xs transition-all hover:bg-[#075E54] active:scale-95"
                            title="Tinjau & Kirim Undangan via WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>Undangan WA</span>
                          </button>
                          {guest.phone ? (
                            <span className="text-xs text-[#71717a] dark:text-muted-foreground">
                              {guest.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[11px] italic">
                              (Belum ada nomor)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-middle text-xs text-[#71717a] dark:text-muted-foreground max-w-xs truncate">
                        {guest.notes || "-"}
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
                              setGuestToEdit(guest);
                              setIsModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit Tamu"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(guest.id)}
                            className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                            title="Hapus Tamu"
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
              Menampilkan <strong className="text-[#18181b] dark:text-foreground font-semibold">{filteredGuests.length}</strong> dari {guests.length} tamu (Total <strong className="text-[#18181b] dark:text-foreground font-semibold">{filteredHeadcount}</strong> Pax)
            </span>
            {(Boolean(searchQuery.trim()) || selectedSide !== "all" || selectedGroup !== "all" || selectedStatus !== "all") && (
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
      ) : viewMode === "grid" ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuests.map((guest) => {
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
                    <select
                      value={guest.invitationStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          guest.id,
                          e.target.value as InvitationStatus
                        )
                      }
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-xs focus:outline-hidden ${statusConfig.badgeClass}`}
                    >
                      {Object.entries(INVITATION_STATUS_CONFIG).map(
                        ([k, cfg]) => (
                          <option key={k} value={k}>
                            {cfg.label}
                          </option>
                        )
                      )}
                    </select>
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
                    <button
                      type="button"
                      onClick={() => {
                        if (isPreview) {
                          triggerUpgrade();
                          return;
                        }
                        setActiveWhatsAppGuest(guest);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                      title="Tinjau & Kirim Undangan WhatsApp"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span>Undangan WA</span>
                    </button>
                    {guest.phone && (
                      <span className="text-muted-foreground text-[11px]">
                        {guest.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
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
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(guest.id)}
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
                  {groupGuests.map((guest) => {
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
                          <select
                            value={guest.invitationStatus}
                            onChange={(e) =>
                              handleStatusChange(
                                guest.id,
                                e.target.value as InvitationStatus
                              )
                            }
                            className={`py-0.2 rounded border px-1.5 text-[10px] font-medium shadow-xs focus:outline-hidden ${statusConfig.badgeClass}`}
                          >
                            {Object.entries(INVITATION_STATUS_CONFIG).map(
                              ([k, cfg]) => (
                                <option key={k} value={k}>
                                  {cfg.label}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div className="flex items-center justify-between border-t pt-2">
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                if (isPreview) {
                                  triggerUpgrade();
                                  return;
                                }
                                setActiveWhatsAppGuest(guest);
                              }}
                              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
                              title="Tinjau & Kirim Undangan via WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span>Undangan WA</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (isPreview) {
                                  triggerUpgrade();
                                  return;
                                }
                                setGuestToEdit(guest);
                                setIsModalOpen(true);
                              }}
                              className="text-muted-foreground hover:text-foreground p-0.5 text-[10px]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(guest.id)}
                              className="text-destructive p-0.5 text-[10px] hover:underline"
                            >
                              Hapus
                            </button>
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
            window.location.reload();
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
      <UpgradePromptModal
        isOpen={isLocalUpgradeOpen}
        onClose={() => setIsLocalUpgradeOpen(false)}
        weddingId={weddingId}
      />
    </div>
  );
}
