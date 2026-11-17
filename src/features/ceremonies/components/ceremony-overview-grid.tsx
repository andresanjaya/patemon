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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location &&
        item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.personInCharge &&
        item.personInCharge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPhase && matchesSearch;
  });

  const hasActiveFilters = searchQuery.trim() !== "" || selectedPhase !== "Semua";

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
        {/* Top Toolbar inside Card */}
        <div className="p-4 border-b border-[#f0f0f4] dark:border-border/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-card">
          {/* Phase Tabs */}
          <div className="bg-muted/50 border-border/80 flex flex-wrap items-center gap-1 rounded-xl border p-1">
            {["Semua", "Persiapan", "Puncak Acara", "Pasca Pawiwahan"].map(
              (phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => setSelectedPhase(phase)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedPhase === phase
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {phase}
                </button>
              )
            )}
          </div>

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
        </div>

        {/* Row Selection Banner */}
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Daftar Rangkaian Upacara Adat Pawiwahan
              </caption>
              <thead>
                <tr className="border-b border-[#f0f0f4] bg-[#f9f9fb] dark:bg-muted/40 text-xs font-semibold text-[#71717a] dark:text-muted-foreground">
                  <th scope="col" className="w-12 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-[#d1d1d6] text-[hsl(32_90%_36%)] focus:ring-[hsl(32_90%_36%)] cursor-pointer"
                      aria-label="Pilih semua upacara pada filter ini"
                    />
                  </th>
                  <th scope="col" className="w-12 px-2 py-3 text-center font-mono">
                    No
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Upacara & Fase
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Jadwal & Jam WITA
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Lokasi & PIC
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f4] dark:divide-border/60">
                {filteredItems.map((ceremony, idx) => {
                  const template = templates.find(
                    (t) => t.id === ceremony.templateId
                  );
                  const isSelected = selectedIds.has(ceremony.id);

                  return (
                    <tr
                      key={ceremony.id || idx}
                      className={`transition-colors hover:bg-[#f9f9fb]/80 dark:hover:bg-muted/20 ${
                        isSelected ? "bg-[#f4f4f7] dark:bg-muted/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(ceremony.id)}
                          className="h-4 w-4 rounded border-[#d1d1d6] text-[hsl(32_90%_36%)] focus:ring-[hsl(32_90%_36%)] cursor-pointer"
                          aria-label={`Pilih upacara ${ceremony.title}`}
                        />
                      </td>
                      <td className="px-2 py-3.5 text-center align-middle font-mono text-xs text-[#71717a] dark:text-muted-foreground font-semibold">
                        {ceremony.orderIndex || idx + 1}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
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
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap text-xs text-[#71717a] dark:text-muted-foreground">
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
                      <td className="px-4 py-3.5 align-middle text-xs text-[#71717a] dark:text-muted-foreground">
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
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
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
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="gap-1.5 text-xs h-8"
                        >
                          <Link
                            href={`/workspace/${weddingId}/ceremonies/${ceremony.id}`}
                          >
                            <span>Detail & Rundown</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
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
            Menampilkan {filteredItems.length} dari {items.length} upacara
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedPhase("Semua");
              }}
              className="font-medium text-[hsl(32_90%_36%)] hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Add Custom Ceremony Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="border-border bg-card w-full max-w-lg rounded-2xl border p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-foreground text-lg font-bold">
                Tambah Upacara Kustom
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddCeremony} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Nama Prosesi Upacara *</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Mebyakala / Natab Banten"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phase">Fase Pelaksanaan</Label>
                  <select
                    id="phase"
                    value={newPhase}
                    onChange={(e) => setNewPhase(e.target.value)}
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                  >
                    <option value="Persiapan">Persiapan</option>
                    <option value="Puncak Acara">Puncak Acara</option>
                    <option value="Pasca Pawiwahan">Pasca Pawiwahan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Tanggal Acara</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Waktu Mulai</Label>
                  <Input
                    id="start"
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">Waktu Selesai</Label>
                  <Input
                    id="end"
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Contoh: Merajan Gede Purusa"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pic">Penanggung Jawab (PIC)</Label>
                  <Input
                    id="pic"
                    value={newPic}
                    onChange={(e) => setNewPic(e.target.value)}
                    placeholder="Contoh: Jero Mangku / Tetua"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Textarea
                  id="notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Catatan busana, banten, atau pengingat keluarga..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Tambah Prosesi"}
                </Button>
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
