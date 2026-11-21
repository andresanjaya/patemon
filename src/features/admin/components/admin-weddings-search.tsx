"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { useRef, useState, useTransition } from "react";
import {
  Search,
  ChevronRight,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  searchAdminWeddingsAction,
  adminActivateManualPaymentAction,
  adminDeleteWorkspaceAction,
} from "../actions";
import type { AdminWeddingSummary } from "../types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TableDropdownFilter } from "@/components/ui/table-dropdown-filter";
import { TableActionDropdown } from "@/components/ui/table-action-dropdown";

interface AdminWeddingsSearchProps {
  initialWeddings: AdminWeddingSummary[];
}

export function AdminWeddingsSearch({
  initialWeddings,
}: AdminWeddingsSearchProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weddings, setWeddings] =
    useState<AdminWeddingSummary[]>(initialWeddings);
  const [activatingWeddingId, setActivatingWeddingId] = useState<string | null>(
    null
  );
  const [isSearching, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminWeddingSummary | null>(
    null
  );
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await searchAdminWeddingsAction(query);
        if (res.success) setWeddings(res.weddings);
        else setError(res.error || "Gagal mencari workspace.");
      } catch {
        setError("Gagal mencari workspace. Coba lagi.");
      }
    });
  };

  const handleDelete = (event: React.FormEvent) => {
    event.preventDefault();
    if (!deleteTarget || isSearching) return;
    setDeleteError("");
    startTransition(async () => {
      try {
        const res = await adminDeleteWorkspaceAction({
          weddingId: deleteTarget.weddingId,
          confirmation,
          reason,
        });
        if (!res.success) {
          setDeleteError(res.error || "Gagal menghapus workspace.");
          return;
        }
        setWeddings((current) =>
          current.filter((w) => w.weddingId !== deleteTarget.weddingId)
        );
        dialogRef.current?.close();
      } catch {
        setDeleteError("Gagal menghapus workspace. Coba lagi.");
      }
    });
  };

  const handleQuickActivate = (weddingId: string, coupleNames: string) => {
    if (
      !confirm(
        `Konfirmasi aktivasi pembayaran manual untuk "${coupleNames}"? Lisensi 365 hari akan segera diaktifkan.`
      )
    ) {
      return;
    }

    setActivatingWeddingId(weddingId);
    startTransition(async () => {
      const res = await adminActivateManualPaymentAction({
        weddingId,
        notes: `Quick activation via Master Admin weddings list for ${coupleNames}`,
      });
      setActivatingWeddingId(null);
      if (res.success) {
        // Refresh wedding search
        const refreshRes = await searchAdminWeddingsAction(query);
        if (refreshRes.success) {
          setWeddings(refreshRes.weddings);
        }
      } else {
        alert(res.error || "Gagal mengaktifkan workspace.");
      }
    });
  };

  const filteredWeddings = weddings.filter((w) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "frozen") return w.isFrozen;
    if (statusFilter === "active")
      return w.licenseStatus === "active" && !w.isFrozen;
    if (statusFilter === "unpaid")
      return w.licenseStatus === "unpaid" && !w.isFrozen;
    if (statusFilter === "override")
      return w.grantType === "manual_override" && !w.isFrozen;
    return true;
  });

  const getStatusBadge = (w: AdminWeddingSummary) => {
    if (w.isFrozen) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
          <Lock className="h-3 w-3" />
          Dibekukan
        </span>
      );
    }
    if (w.grantType === "manual_override" && w.licenseStatus === "active") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
          <ShieldCheck className="h-3 w-3" />
          Pengecualian Admin
        </span>
      );
    }
    if (w.licenseStatus === "active") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-3 w-3" />
          Akses Penuh Aktif
        </span>
      );
    }
    if (w.licenseStatus === "revoked") {
      return (
        <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#e9e9ed] bg-[#f4f4f7] px-2.5 py-1 text-xs font-semibold text-[#65656f]">
          <Ban className="h-3 w-3" />
          Dicabut (Revoked)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#ffe1b8] bg-[#fff4e5] px-2.5 py-1 text-xs font-semibold text-[#b36b00]">
        <ShieldAlert className="h-3 w-3" />
        Preview Gratis
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {/* Search and Filters */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <form
          onSubmit={handleSearch}
          className="flex max-w-lg flex-1 items-center gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <Input
              ref={searchRef}
              aria-label="Cari workspace berdasarkan nama pasangan, slug, atau UUID"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama pasangan, slug, atau UUID wedding..."
              className="border-border bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-lg border pr-3 pl-9 text-xs focus-visible:ring-2 focus-visible:outline-none"
            />
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-[#8c8c99]" />
          </div>
          <Button type="submit" disabled={isSearching} size="sm">
            {isSearching ? "Mencari..." : "Cari"}
          </Button>
        </form>

        <TableDropdownFilter
          label="Status Lisensi"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { id: "all", label: "Semua Status", count: weddings.length },
            { id: "active", label: "Akses Aktif" },
            { id: "override", label: "Pengecualian Admin" },
            { id: "frozen", label: "Dibekukan" },
            { id: "unpaid", label: "Preview Gratis" },
          ]}
        />
      </div>

      <Table aria-label="Daftar workspace wedding" className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Pasangan & Slug</TableHead>
            <TableHead scope="col">Pemilik Akun</TableHead>
            <TableHead scope="col">Wilayah & Tanggal</TableHead>
            <TableHead scope="col">Status Lisensi</TableHead>
            <TableHead scope="col">Riwayat Order</TableHead>
            <TableHead scope="col" className="text-right">
              Tindakan
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredWeddings.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-12 text-center"
              >
                Tidak ada workspace wedding yang sesuai dengan kriteria
                pencarian.
              </TableCell>
            </TableRow>
          ) : (
            filteredWeddings.map((w) => (
              <TableRow key={w.weddingId}>
                <TableCell>
                  <div className="text-foreground text-sm font-semibold">
                    {w.coupleNames}
                  </div>
                  <div className="font-mono text-[11px] text-[#8c8c99]">
                    /{w.slug || w.weddingId.substring(0, 8)}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="text-foreground font-medium">
                    {w.ownerName || "Tidak ada profil"}
                  </div>
                  <div className="font-mono text-[11px] text-[#8c8c99]">
                    {w.ownerEmail || "-"}
                  </div>
                </TableCell>

                <TableCell>
                  <div>{w.locationRegion || "Belum dipilih"}</div>
                  <div className="text-[11px] text-[#8c8c99]">
                    {w.prospectiveDate || "Tanggal belum pasti"}
                  </div>
                </TableCell>

                <TableCell>{getStatusBadge(w)}</TableCell>

                <TableCell>
                  <div className="text-foreground font-medium">
                    {w.totalOrders} Pesanan
                  </div>
                  {w.lastOrder && (
                    <div className="font-mono text-[11px] text-[#8c8c99]">
                      Terakhir: {w.lastOrder.status}
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {w.licenseStatus === "unpaid" && !w.isFrozen && (
                      <button
                        type="button"
                        disabled={
                          isSearching && activatingWeddingId === w.weddingId
                        }
                        onClick={() =>
                          handleQuickActivate(w.weddingId, w.coupleNames)
                        }
                        className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#1e8346] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#186f3b] disabled:opacity-50"
                        title="Aktivasi langsung pembayaran manual 365 hari"
                      >
                        {isSearching && activatingWeddingId === w.weddingId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>Aktifkan Akses</span>
                      </button>
                    )}
                    <TableActionDropdown
                      title="Tindakan Workspace"
                      triggerAriaLabel={`Tindakan untuk ${w.coupleNames}`}
                      items={[
                        {
                          label: "Kelola",
                          href: `/admin/weddings/${w.weddingId}`,
                          icon: <ChevronRight />,
                          disabled: isSearching,
                        },
                        {
                          label: "Hapus Workspace",
                          icon: <Trash2 />,
                          variant: "destructive",
                          disabled: isSearching,
                          onClick: () => {
                            setDeleteTarget(w);
                            setConfirmation("");
                            setReason("");
                            setDeleteError("");
                            dialogRef.current?.showModal();
                          },
                        },
                      ]}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-xs" aria-live="polite">
        Menampilkan {filteredWeddings.length} dari {weddings.length} workspace
        hasil pencarian (maksimal 50).
      </p>
      <dialog
        ref={dialogRef}
        aria-labelledby="admin-delete-workspace-title"
        aria-describedby="admin-delete-workspace-description"
        className="bg-card text-foreground fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-xl border p-6 shadow-xl backdrop:bg-black/50"
        onCancel={(event) => {
          if (isSearching) event.preventDefault();
        }}
        onClose={() => {
          setDeleteTarget(null);
          searchRef.current?.focus();
        }}
      >
        <form onSubmit={handleDelete} className="space-y-4">
          <h3
            id="admin-delete-workspace-title"
            className="text-lg font-semibold"
          >
            Hapus workspace {deleteTarget?.coupleNames}?
          </h3>
          <p
            id="admin-delete-workspace-description"
            className="text-muted-foreground text-sm"
          >
            Workspace akan disembunyikan dari daftar dan tidak dapat diakses
            anggotanya. Data terkait, akun pemilik, dan riwayat pembayaran tidak
            dihapus permanen. Pemulihan memerlukan bantuan operasional.
          </p>
          <p className="font-mono text-xs break-all">
            ID: {deleteTarget?.weddingId}
          </p>
          <Field>
            <FieldLabel htmlFor="admin-delete-confirmation">
              Ketik nama pasangan persis:{" "}
              <strong>{deleteTarget?.coupleNames}</strong>
            </FieldLabel>
            <Input
              id="admin-delete-confirmation"
              autoFocus
              required
              maxLength={500}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isSearching}
              className="border-border bg-background w-full rounded-lg border p-2"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="admin-delete-reason">
              Alasan penghapusan (minimal 10 karakter)
            </FieldLabel>
            <Textarea
              id="admin-delete-reason"
              required
              minLength={10}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={isSearching}
              className="border-border bg-background w-full rounded-lg border p-2"
            />
          </Field>
          {deleteError && (
            <p role="alert" className="text-sm text-rose-600">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSearching}
              onClick={() => dialogRef.current?.close()}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                isSearching ||
                !deleteTarget ||
                confirmation !== deleteTarget.coupleNames ||
                reason.trim().length < 10
              }
            >
              {isSearching ? "Menghapus..." : "Hapus Workspace"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
