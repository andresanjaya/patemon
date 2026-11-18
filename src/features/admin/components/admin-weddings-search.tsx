"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  searchAdminWeddingsAction,
  adminActivateManualPaymentAction,
} from "../actions";
import type { AdminWeddingSummary } from "../types";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await searchAdminWeddingsAction(query);
      if (res.success) {
        setWeddings(res.weddings);
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
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
          <Ban className="h-3 w-3" />
          Dicabut (Revoked)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        <ShieldAlert className="h-3 w-3" />
        Preview Gratis
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative max-w-lg flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama pasangan, slug, atau UUID wedding..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pr-24 pl-9 text-sm text-stone-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute top-1 right-1 bottom-1 rounded-md bg-stone-900 px-3 text-xs font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
          >
            {isSearching ? "Mencari..." : "Cari"}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <label
            htmlFor="admin-status-filter"
            className="text-xs font-medium text-stone-500"
          >
            Filter:
          </label>
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 shadow-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Semua Status ({weddings.length})</option>
            <option value="active">Akses Aktif</option>
            <option value="override">Pengecualian Admin</option>
            <option value="frozen">Dibekukan</option>
            <option value="unpaid">Preview Gratis</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 font-semibold tracking-wider text-stone-600 uppercase">
              <tr>
                <th className="px-4 py-3">Pasangan & Slug</th>
                <th className="px-4 py-3">Pemilik Akun</th>
                <th className="px-4 py-3">Wilayah & Tanggal</th>
                <th className="px-4 py-3">Status Lisensi</th>
                <th className="px-4 py-3">Riwayat Order</th>
                <th className="px-4 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredWeddings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    Tidak ada workspace wedding yang sesuai dengan kriteria
                    pencarian.
                  </td>
                </tr>
              ) : (
                filteredWeddings.map((w) => (
                  <tr
                    key={w.weddingId}
                    className="transition-colors hover:bg-amber-50/40"
                  >
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-semibold text-stone-900">
                        {w.coupleNames}
                      </div>
                      <div className="font-mono text-[11px] text-stone-500">
                        /{w.slug || w.weddingId.substring(0, 8)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-stone-800">
                        {w.ownerName || "Tidak ada profil"}
                      </div>
                      <div className="font-mono text-[11px] text-stone-500">
                        {w.ownerEmail || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-stone-600">
                      <div>{w.locationRegion || "Belum dipilih"}</div>
                      <div className="text-[11px] text-stone-400">
                        {w.prospectiveDate || "Tanggal belum pasti"}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">{getStatusBadge(w)}</td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-stone-800">
                        {w.totalOrders} Pesanan
                      </div>
                      {w.lastOrder && (
                        <div className="font-mono text-[11px] text-stone-500">
                          Terakhir: {w.lastOrder.status}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {w.licenseStatus === "unpaid" && !w.isFrozen && (
                          <button
                            type="button"
                            disabled={
                              isSearching && activatingWeddingId === w.weddingId
                            }
                            onClick={() =>
                              handleQuickActivate(w.weddingId, w.coupleNames)
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            title="Aktivasi langsung pembayaran manual 365 hari"
                          >
                            {isSearching && activatingWeddingId === w.weddingId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            <span>Aktifkan (365 Hari)</span>
                          </button>
                        )}
                        <Link
                          href={`/admin/weddings/${w.weddingId}`}
                          className="inline-flex items-center gap-1 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-stone-800"
                        >
                          <span>Kelola</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
