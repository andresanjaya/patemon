"use client";
import { Button, buttonVariants } from "@/components/ui/button";

import { FieldLabel, FieldGroup, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
      {/* Search and Filters */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative max-w-lg flex-1">
          <FieldGroup className="gap-4">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama pasangan, slug, atau UUID wedding..."
              className="w-full rounded-[6px] border border-[#e9e9ed] bg-white py-2 pr-24 pl-9 text-[#18181b] shadow-xs focus:border-[#e07a1e] focus:outline-none"
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8c8c99]" />
            <Button
              size={null}
              type="submit"
              disabled={isSearching}
              className="absolute top-1 right-1 bottom-1 px-3 text-xs"
            >
              {isSearching ? "Mencari..." : "Cari"}
            </Button>
          </FieldGroup>
        </form>

        <Field orientation="horizontal" className="flex items-center gap-2">
          <FieldLabel
            htmlFor="admin-status-filter"
            className="font-medium text-[#65656f]"
          >
            Filter:
          </FieldLabel>
          <NativeSelect
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[6px] border border-[#e9e9ed] bg-white px-3 py-1.5 text-[#18181b] shadow-xs focus:border-[#e07a1e] focus:outline-none"
          >
            <option value="all">Semua Status ({weddings.length})</option>
            <option value="active">Akses Aktif</option>
            <option value="override">Pengecualian Admin</option>
            <option value="frozen">Dibekukan</option>
            <option value="unpaid">Preview Gratis</option>
          </NativeSelect>
        </Field>
      </div>

      {/* Table (Metronic Demo 10 Inventory Layout with Outlines) */}
      <div className="table-metronic-wrapper overflow-x-auto rounded-xl border border-[#e9e9ed] bg-white shadow-2xs">
        <table className="table-metronic w-full text-left text-xs">
          <thead className="bg-[#f9f9fb] text-[11px] font-semibold tracking-wider text-[#65656f] uppercase">
            <tr>
              <th className="border-r border-b border-[#e9e9ed] px-4 py-3">
                Pasangan & Slug
              </th>
              <th className="border-r border-b border-[#e9e9ed] px-4 py-3">
                Pemilik Akun
              </th>
              <th className="border-r border-b border-[#e9e9ed] px-4 py-3">
                Wilayah & Tanggal
              </th>
              <th className="border-r border-b border-[#e9e9ed] px-4 py-3">
                Status Lisensi
              </th>
              <th className="border-r border-b border-[#e9e9ed] px-4 py-3">
                Riwayat Order
              </th>
              <th className="border-b border-[#e9e9ed] px-4 py-3 text-right">
                Tindakan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9e9ed] font-sans">
            {filteredWeddings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#8c8c99]">
                  Tidak ada workspace wedding yang sesuai dengan kriteria
                  pencarian.
                </td>
              </tr>
            ) : (
              filteredWeddings.map((w) => (
                <tr
                  key={w.weddingId}
                  className="transition-colors hover:bg-[#fafafc]"
                >
                  <td className="border-r border-b border-[#e9e9ed] px-4 py-3.5">
                    <div className="text-sm font-semibold text-[#18181b]">
                      {w.coupleNames}
                    </div>
                    <div className="font-mono text-[11px] text-[#8c8c99]">
                      /{w.slug || w.weddingId.substring(0, 8)}
                    </div>
                  </td>

                  <td className="border-r border-b border-[#e9e9ed] px-4 py-3.5">
                    <div className="font-medium text-[#18181b]">
                      {w.ownerName || "Tidak ada profil"}
                    </div>
                    <div className="font-mono text-[11px] text-[#8c8c99]">
                      {w.ownerEmail || "-"}
                    </div>
                  </td>

                  <td className="border-r border-b border-[#e9e9ed] px-4 py-3.5 text-[#65656f]">
                    <div>{w.locationRegion || "Belum dipilih"}</div>
                    <div className="text-[11px] text-[#8c8c99]">
                      {w.prospectiveDate || "Tanggal belum pasti"}
                    </div>
                  </td>

                  <td className="border-r border-b border-[#e9e9ed] px-4 py-3.5">
                    {getStatusBadge(w)}
                  </td>

                  <td className="border-r border-b border-[#e9e9ed] px-4 py-3.5">
                    <div className="font-medium text-[#18181b]">
                      {w.totalOrders} Pesanan
                    </div>
                    {w.lastOrder && (
                      <div className="font-mono text-[11px] text-[#8c8c99]">
                        Terakhir: {w.lastOrder.status}
                      </div>
                    )}
                  </td>

                  <td className="border-b border-[#e9e9ed] px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {w.licenseStatus === "unpaid" && !w.isFrozen && (
                        <Button
                          size={null}
                          type="button"
                          disabled={
                            isSearching && activatingWeddingId === w.weddingId
                          }
                          onClick={() =>
                            handleQuickActivate(w.weddingId, w.coupleNames)
                          }
                          className="gap-1.5 px-3 py-1.5 text-xs font-semibold shadow-xs"
                          title="Aktivasi langsung pembayaran manual 365 hari"
                        >
                          {isSearching &&
                          activatingWeddingId === w.weddingId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Aktifkan Akses</span>
                        </Button>
                      )}
                      <Link
                        href={`/admin/weddings/${w.weddingId}`}
                        className={buttonVariants({
                          variant: "outline",
                          className: "text-xs font-semibold",
                        })}
                      >
                        <span>Kelola</span>
                        <ChevronRight className="h-3.5 w-3.5" />
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
  );
}
