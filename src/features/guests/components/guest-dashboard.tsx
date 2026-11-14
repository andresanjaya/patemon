"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Download,
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
  formatWhatsAppInviteLink,
  exportGuestsToCSV,
} from "../seeds";
import {
  updateGuestInvitationStatusAction,
  deleteGuestAction,
  importSampleGuestsAction,
} from "../actions";
import { GuestModal } from "./guest-modal";
import type { Guest, GuestStats, InvitationStatus } from "../types";

interface GuestDashboardProps {
  weddingId: string;
  coupleNames: string;
  prospectiveDate?: string | null;
  initialGuests: Guest[];
  initialStats: GuestStats;
}

export function GuestDashboard({
  weddingId,
  coupleNames,
  prospectiveDate,
  initialGuests,
  initialStats,
}: GuestDashboardProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [stats, setStats] = useState<GuestStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSide, setSelectedSide] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "grouped">(
    "table"
  );

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);

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
    if (!confirm("Apakah Anda yakin ingin menghapus nama tamu ini?")) return;
    const nextGuests = guests.filter((g) => g.id !== guestId);
    setGuests(nextGuests);
    setStats(calculateGuestStats(nextGuests));

    startTransition(async () => {
      await deleteGuestAction(weddingId, guestId);
    });
  };

  const handleImportSample = () => {
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

  const formattedDate = prospectiveDate
    ? new Date(prospectiveDate).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  return (
    <div className="space-y-8">
      {/* Title & Top Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Daftar Tamu & Undangan Pawiwahan
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola daftar undangan, pembagian keluarga dadia/banjar, estimasi
            porsi kehadiran (headcount), dan ekspor CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              setGuestToEdit(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tamu</span>
          </Button>
        </div>
      </div>

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
        /* Tabular View */
        <div className="border-border/60 bg-card overflow-x-auto rounded-xl border shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  Nama Tamu / Kepala Keluarga
                </th>
                <th className="px-4 py-3 font-semibold">Pihak</th>
                <th className="px-4 py-3 font-semibold">
                  Kelompok / Dadia / Banjar
                </th>
                <th className="px-4 py-3 text-center font-semibold">Pax</th>
                <th className="px-4 py-3 font-semibold">Status Undangan</th>
                <th className="px-4 py-3 font-semibold">Kontak & Undangan</th>
                <th className="px-4 py-3 font-semibold">Catatan Khusus</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {filteredGuests.map((guest) => {
                const statusConfig = getInvitationStatusConfig(
                  guest.invitationStatus
                );
                const waLink = formatWhatsAppInviteLink(
                  guest.phone,
                  guest.name,
                  coupleNames,
                  formattedDate
                );

                return (
                  <tr key={guest.id} className="hover:bg-muted/30 transition">
                    <td className="text-foreground px-4 py-3.5 font-bold">
                      {guest.name}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getGuestSideBadgeClass(guest.side)}`}
                      >
                        {formatGuestSideLabel(guest.side)}
                      </Badge>
                    </td>

                    <td className="text-muted-foreground px-4 py-3.5">
                      {guest.groupHousehold || "-"}
                    </td>

                    <td className="text-foreground px-4 py-3.5 text-center font-bold">
                      <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                        {guest.headcount}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
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
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                            title="Kirim Undangan via WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>Kirim WA</span>
                          </a>
                        )}
                        {guest.phone && (
                          <span className="text-muted-foreground text-[11px]">
                            {guest.phone}
                          </span>
                        )}
                        {!guest.phone && (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </div>
                    </td>

                    <td className="text-muted-foreground max-w-xs truncate px-4 py-3.5">
                      {guest.notes || "-"}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGuestToEdit(guest);
                            setIsModalOpen(true);
                          }}
                          className="h-7 w-7 p-0"
                          title="Edit Tamu"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(guest.id)}
                          className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
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
      ) : viewMode === "grid" ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuests.map((guest) => {
            const statusConfig = getInvitationStatusConfig(
              guest.invitationStatus
            );
            const waLink = formatWhatsAppInviteLink(
              guest.phone,
              guest.name,
              coupleNames,
              formattedDate
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

                  {guest.notes && (
                    <p className="bg-muted/40 text-muted-foreground line-clamp-2 rounded-lg p-2 text-xs">
                      {guest.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                        title="Kirim Undangan WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>Kirim WA</span>
                      </a>
                    )}
                    {guest.phone && !waLink && (
                      <span className="text-muted-foreground text-xs">
                        {guest.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
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
                    const waLink = formatWhatsAppInviteLink(
                      guest.phone,
                      guest.name,
                      coupleNames,
                      formattedDate
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
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span>Kirim WA</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
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
    </div>
  );
}
