"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarHeart,
  Plus,
  Sparkles,
  Clock,
  MapPin,
  User,
  Search,
  Calendar,
  X,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { ProvenanceBadge } from "./provenance-badge";
import {
  createCustomCeremonyAction,
  updateCeremonyStatusAction,
} from "../actions";
import { PreviewBadge } from "@/features/preview/preview-badge";
import { useWorkspace } from "@/features/workspaces/context/workspace-context";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";
import type { CeremonyTemplate, WeddingCeremony } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";

interface CeremonyOverviewGridProps {
  weddingId: string;
  initialCeremonies: WeddingCeremony[];
  templates: CeremonyTemplate[];
  userRole: WorkspaceRole;
  isPreview?: boolean;
  workspaceName?: string;
}

export function CeremonyOverviewGrid({
  weddingId,
  initialCeremonies,
  templates,
  userRole,
  isPreview: propIsPreview,
  workspaceName,
}: CeremonyOverviewGridProps) {
  const router = useRouter();
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

  const canEdit = isPreview || userRole === "owner" || userRole === "editor";

  const [items, setItems] = useState<WeddingCeremony[]>(initialCeremonies);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("all");
  // Retained for batch actions and test contract compatibility
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // New ceremony form state
  const [newTitle, setNewTitle] = useState("");
  const [newPhase, setNewPhase] = useState("Puncak Acara");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPic, setNewPic] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleToggleStatus = async (ceremony: WeddingCeremony) => {
    if (isPreview) {
      triggerUpgrade();
      return;
    }
    if (!canEdit) return;

    const nextStatus: WeddingCeremony["status"] =
      ceremony.status === "draft"
        ? "confirmed"
        : ceremony.status === "confirmed"
          ? "completed"
          : "draft";

    setItems((prev) =>
      prev.map((c) => (c.id === ceremony.id ? { ...c, status: nextStatus } : c))
    );

    await updateCeremonyStatusAction(ceremony.id, weddingId, nextStatus);
    router.refresh();
  };

  const handleAddCeremony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!newTitle.trim()) {
      setErrorMsg("Nama prosesi upacara wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const res = await createCustomCeremonyAction(weddingId, {
      title: newTitle,
      phase: newPhase,
      scheduledDate: newDate || null,
      startTime: newStartTime || null,
      endTime: newEndTime || null,
      location: newLocation || null,
      personInCharge: newPic || null,
      customNotes: newNotes || null,
    });

    setLoading(false);

    if (res.success) {
      const addedCeremony: WeddingCeremony = {
        id: res.ceremonyId || "ceremony-" + Date.now(),
        weddingId,
        title: newTitle,
        phase: newPhase,
        scheduledDate: newDate || null,
        startTime: newStartTime || null,
        endTime: newEndTime || null,
        location: newLocation || null,
        personInCharge: newPic || null,
        customNotes: newNotes || null,
        orderIndex: items.length + 1,
        status: "draft",
      };

      setItems((prev) => [...prev, addedCeremony]);

      // Reset
      setNewTitle("");
      setNewDate("");
      setNewStartTime("");
      setNewEndTime("");
      setNewLocation("");
      setNewPic("");
      setNewNotes("");
      setIsModalOpen(false);
      router.refresh();
    } else {
      setErrorMsg(res.message || "Gagal menambahkan prosesi.");
    }
  };

  // Stats
  const totalCount = items.length;
  const completedCount = items.filter((c) => c.status === "completed").length;
  const confirmedCount = items.filter((c) => c.status === "confirmed").length;
  const draftCount = items.filter((c) => c.status === "draft").length;

  // Filter
  const filteredItems = items.filter((item) => {
    const matchesPhase =
      selectedPhase === "Semua" ||
      (item.phase || "Puncak Acara").toLowerCase() ===
        selectedPhase.toLowerCase();
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location &&
        item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.personInCharge &&
        item.personInCharge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPhase && matchesStatus && matchesSearch;
  });

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedPhase !== "Semua" ||
    statusFilter !== "all";

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

  const getStatusBadge = (status: WeddingCeremony["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-700">
            Selesai
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="secondary" className="text-primary text-[10px]">
            Terkonfirmasi
          </Badge>
        );
      case "skipped":
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground text-[10px]"
          >
            Dilewati
          </Badge>
        );
      case "draft":
      default:
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

  return (
    <div className="space-y-6">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Rangkaian Upacara Adat"
        badge={isPreview ? <PreviewBadge onClick={triggerUpgrade} /> : undefined}
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspaceName || workspaceCtx?.workspace?.coupleNames || "Pawiwahan",
          weddingId,
          "Rencana Upacara"
        )}
        actions={
          <>
            {isPreview ? (
              <Button
                variant="outline"
                size="sm"
                onClick={triggerUpgrade}
                className="gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span>Panduan Onboarding</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/workspace/${weddingId}/onboarding`}>
                  <Sparkles className="h-4 w-4" />
                  <span>Panduan Onboarding</span>
                </Link>
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  if (isPreview) {
                    triggerUpgrade();
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Upacara</span>
              </Button>
            )}
          </>
        }
      />

      {/* Summary Stats Card */}
      <div className="border-border bg-card/60 rounded-2xl border p-5 shadow-xs sm:p-6">
        <p className="text-muted-foreground max-w-2xl text-xs sm:text-sm">
          Kelola jadwal, lokasi, penanggung jawab (PIC), rundown jam-demi-jam,
          dan kebutuhan banten untuk setiap prosesi pawiwahan.
        </p>

        {/* Stats Grid */}
        <div className="border-border/60 mt-5 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">Total Prosesi</span>
            <p className="text-foreground text-xl font-bold">{totalCount}</p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">
              Selesai Dilaksanakan
            </span>
            <p className="text-xl font-bold text-emerald-600">
              {completedCount}
            </p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">
              Terkonfirmasi Siap
            </span>
            <p className="text-primary text-xl font-bold">{confirmedCount}</p>
          </div>
          <div className="bg-card border-border/80 rounded-xl border p-3">
            <span className="text-muted-foreground text-xs">Dalam Rencana</span>
            <p className="text-muted-foreground text-xl font-bold">
              {draftCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main List Container (Metronic Inventory Layout) */}
      <div className="rounded-xl border border-[#e5e5e9] bg-white shadow-xs overflow-hidden dark:bg-card dark:border-border/80">
        {/* Top Toolbar inside Card (Metronic Filter Bar) */}
        <div className="p-4 border-b border-[#f0f0f4] dark:border-border/60 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-card">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Cari upacara, lokasi, PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            {/* Phase Dropdown Filter (Replacing Tab Pills as requested) */}
            <TableDropdownFilter
              label="Fase Upacara"
              options={[
                { id: "Semua", label: "Semua Fase", count: items.length },
                {
                  id: "Persiapan",
                  label: "Persiapan",
                  count: items.filter((i) => (i.phase || "").toLowerCase() === "persiapan").length,
                },
                {
                  id: "Puncak Acara",
                  label: "Puncak Acara",
                  count: items.filter((i) => (i.phase || "").toLowerCase() === "puncak acara").length,
                },
                {
                  id: "Pasca Pawiwahan",
                  label: "Pasca Pawiwahan",
                  count: items.filter((i) => (i.phase || "").toLowerCase() === "pasca pawiwahan").length,
                },
              ]}
              value={selectedPhase}
              onChange={setSelectedPhase}
              defaultAllId="Semua"
            />

            {/* Status Dropdown Filter */}
            <TableDropdownFilter
              label="Status"
              options={[
                { id: "all", label: "Semua Status", count: items.length },
                {
                  id: "draft",
                  label: "Dalam Rencana (Draf)",
                  count: items.filter((i) => i.status === "draft").length,
                },
                {
                  id: "confirmed",
                  label: "Terkonfirmasi",
                  count: items.filter((i) => i.status === "confirmed").length,
                },
                {
                  id: "completed",
                  label: "Selesai",
                  count: items.filter((i) => i.status === "completed").length,
                },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              defaultAllId="all"
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedPhase("Semua");
                  setStatusFilter("all");
                }}
                className="text-muted-foreground hover:text-foreground h-9 text-xs"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Row Selection Banner (Compatibility) */}
        {selectedIds.size > 0 && (
          <div
            role="status"
            className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 border-b border-amber-200/60 dark:border-amber-800/40"
          >
            <span className="font-medium">
              {selectedIds.size} upacara dipilih
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs text-amber-900 hover:bg-amber-100/60 dark:text-amber-200 dark:hover:bg-amber-900/40"
            >
              Batal Pilihan
            </Button>
          </div>
        )}

        {/* Ceremony Table */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center p-6">
            <div className="bg-primary/10 text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-xl mb-3">
              <CalendarHeart className="h-6 w-6" />
            </div>
            <h3 className="text-foreground text-base font-bold">
              Tidak Ada Upacara Ditemukan
            </h3>
            <p className="text-muted-foreground mx-auto max-w-sm text-xs mt-1">
              {items.length === 0
                ? "Mulai dengan panduan onboarding adat atau tambahkan upacara kustom secara mandiri."
                : "Tidak ada prosesi yang cocok dengan kata kunci pencarian atau filter fase saat ini."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedPhase("Semua");
                  setStatusFilter("all");
                }}
                className="mt-4 text-xs"
              >
                Reset Filter
              </Button>
            )}
            {items.length === 0 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button size="sm" asChild>
                  <Link href={`/workspace/${weddingId}/onboarding`}>
                    Buka Panduan Onboarding
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="table-metronic-wrapper overflow-x-auto rounded-xl border border-[#e9e9ed] bg-white shadow-2xs dark:border-border/80 dark:bg-card">
            <table className="table-metronic w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Daftar Rangkaian Upacara Adat Pawiwahan
              </caption>
              <thead>
                <tr className="border-b border-[#e9e9ed] bg-[#f9f9fb] dark:bg-muted/40 text-xs font-semibold text-[#65656f] dark:text-muted-foreground">
                  <th scope="col" className="w-12 px-3 py-3 text-center font-mono border-b border-r border-[#e9e9ed] dark:border-border/80">
                    No
                  </th>
                  <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
                    Upacara & Fase
                  </th>
                  <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
                    Jadwal & Jam WITA
                  </th>
                  <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
                    Lokasi & PIC
                  </th>
                  <th scope="col" className="px-4 py-3 border-b border-r border-[#e9e9ed] dark:border-border/80">
                    Status
                  </th>
                  <th scope="col" className="w-16 px-4 py-3 text-right border-b border-[#e9e9ed] dark:border-border/80">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9e9ed] dark:divide-border/80">
                {filteredItems.map((ceremony, idx) => {
                  const template = templates.find(
                    (t) => t.id === ceremony.templateId
                  );

                  return (
                    <tr
                      key={ceremony.id || idx}
                      className="transition-colors hover:bg-[#fbfbfd] dark:hover:bg-muted/20"
                    >
                      <td className="px-3 py-3.5 text-center align-middle font-mono text-xs text-[#71717a] dark:text-muted-foreground font-semibold border-b border-r border-[#e9e9ed] dark:border-border/80">
                        {ceremony.orderIndex || idx + 1}
                      </td>
                      <td className="px-4 py-3.5 align-middle border-b border-r border-[#e9e9ed] dark:border-border/80">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/workspace/${weddingId}/ceremonies/${ceremony.id}`}
                            className="font-semibold text-sm text-[#18181b] dark:text-foreground hover:text-[hsl(32_90%_36%)] transition-colors"
                          >
                            {ceremony.title}
                          </Link>
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 font-normal"
                          >
                            {ceremony.phase || "Puncak Acara"}
                          </Badge>
                          {template && (
                            <ProvenanceBadge
                              status={template.validationStatus}
                              sourceUrl={template.sourceUrl}
                            />
                          )}
                        </div>
                        {ceremony.customNotes && (
                          <p className="mt-0.5 text-xs text-[#71717a] dark:text-muted-foreground line-clamp-1">
                            {ceremony.customNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap text-xs text-[#71717a] dark:text-muted-foreground border-b border-r border-[#e9e9ed] dark:border-border/80">
                        {ceremony.scheduledDate ? (
                          <div className="flex items-center gap-1.5 font-medium text-[#18181b] dark:text-foreground">
                            <Calendar className="text-primary h-3.5 w-3.5" />
                            {new Date(ceremony.scheduledDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                        ) : (
                          <span>Belum dijadwalkan</span>
                        )}
                        {(ceremony.startTime || ceremony.endTime) && (
                          <div className="flex items-center gap-1 text-[11px] text-[#71717a] dark:text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {ceremony.startTime || "--:--"} -{" "}
                            {ceremony.endTime || "Selesai"} WITA
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-xs text-[#71717a] dark:text-muted-foreground border-b border-r border-[#e9e9ed] dark:border-border/80">
                        {ceremony.location ? (
                          <div className="flex items-center gap-1 text-[#18181b] dark:text-foreground">
                            <MapPin className="text-primary h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {ceremony.location}
                            </span>
                          </div>
                        ) : (
                          <span className="italic">Lokasi belum diatur</span>
                        )}
                        {ceremony.personInCharge && (
                          <div className="flex items-center gap-1 text-[11px] mt-0.5 text-[#71717a] dark:text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" />
                            <span>PIC: {ceremony.personInCharge}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap border-b border-r border-[#e9e9ed] dark:border-border/80">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ceremony)}
                          disabled={!canEdit}
                          className="cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
                          title={canEdit ? "Ubah status prosesi" : undefined}
                        >
                          {getStatusBadge(ceremony.status)}
                        </button>
                      </td>
                      <td className="w-16 px-4 py-3.5 align-middle whitespace-nowrap text-right border-b border-[#e9e9ed] dark:border-border/80">
                        <TableActionDropdown
                          items={[
                            {
                              label: "Detail & Rundown",
                              icon: <ArrowRight className="h-3.5 w-3.5" />,
                              href: `/workspace/${weddingId}/ceremonies/${ceremony.id}`,
                            },
                            {
                              label: "Ubah Status",
                              icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                              onClick: () => handleToggleStatus(ceremony),
                              disabled: !canEdit,
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
        )}

        {/* Table Footer */}
        <div className="border-t border-[#f0f0f4] dark:border-border/60 px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs text-[#71717a] dark:text-muted-foreground">
          <span>
            Menampilkan {filteredItems.length} prosesi upacara dari total {items.length}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedPhase("Semua");
                setStatusFilter("all");
              }}
              className="font-medium text-[hsl(32_90%_36%)] hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Add Custom Ceremony Modal: Metronic 2-Panel Layout */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-xs">
          <div
            className="bg-card border-border/80 flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ceremony-modal-title"
          >
            {/* Metronic Header */}
            <div className="px-6 py-4 border-b border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-white dark:bg-card">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <CalendarHeart className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="ceremony-modal-title"
                    className="text-[#18181b] dark:text-foreground text-lg font-bold"
                  >
                    Tambah Upacara Kustom
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Tambahkan rangkaian prosesi upacara adat Bali khusus sesuai dresta keluarga Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup"
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body: 2-Panel Metronic Layout */}
            <form onSubmit={handleAddCeremony} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {errorMsg && (
                  <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Panel (~2/3): Title, Location, PIC, Notes */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-semibold">
                        Nama Prosesi Upacara <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Contoh: Mebyakala / Natab Banten"
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="location" className="text-xs font-semibold">
                          Lokasi Pelaksanaan
                        </Label>
                        <Input
                          id="location"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          placeholder="Contoh: Merajan Gede Purusa"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pic" className="text-xs font-semibold">
                          Penanggung Jawab (PIC)
                        </Label>
                        <Input
                          id="pic"
                          value={newPic}
                          onChange={(e) => setNewPic(e.target.value)}
                          placeholder="Contoh: Jero Mangku / Tetua"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs font-semibold">
                        Catatan Tambahan
                      </Label>
                      <Textarea
                        id="notes"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Catatan busana, banten, atau pengingat keluarga..."
                        rows={3}
                        className="text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Right Panel (~1/3): Phase, Date, WITA Time, Info */}
                  <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:border-l lg:border-[#f0f0f4] dark:lg:border-border/60 lg:pl-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="phase" className="text-xs font-semibold">
                        Fase Pelaksanaan
                      </Label>
                      <select
                        id="phase"
                        value={newPhase}
                        onChange={(e) => setNewPhase(e.target.value)}
                        className="border-input bg-background text-foreground h-9 w-full rounded-md border px-2.5 text-xs"
                      >
                        <option value="Persiapan">Persiapan</option>
                        <option value="Puncak Acara">Puncak Acara</option>
                        <option value="Pasca Pawiwahan">Pasca Pawiwahan</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs font-semibold">
                        Tanggal Acara
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="start" className="text-xs font-semibold">
                          Mulai (WITA)
                        </Label>
                        <Input
                          id="start"
                          type="time"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="end" className="text-xs font-semibold">
                          Selesai (WITA)
                        </Label>
                        <Input
                          id="end"
                          type="time"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#f0f0f4] dark:border-border/60 bg-[#f9f9fb] dark:bg-muted/20 p-3.5 space-y-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Integrasi Linimasa Adat
                      </span>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Prosesi baru akan otomatis tersinkron ke modul Rundown dan dapat dikaitkan dengan kebutuhan sarana banten.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Metronic Footer */}
              <div className="px-6 py-3.5 border-t border-[#f0f0f4] dark:border-border/60 flex items-center justify-between shrink-0 bg-[#fbfbfd] dark:bg-card">
                <span className="text-xs text-muted-foreground">
                  Prosesi baru akan dicatat pada rangkaian upacara
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" disabled={loading} className="text-xs">
                    {loading ? "Menyimpan..." : "Tambah Prosesi"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
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
