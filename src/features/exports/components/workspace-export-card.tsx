"use client";

import { runAction } from "@/components/ui/action-feedback";

import dynamic from "next/dynamic";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileArchive,
  Flower2,
  CalendarDays,
  CheckSquare,
  Coins,
  Store,
  Users,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Receipt,
  FileText,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCSV, downloadJSON } from "@/lib/csv-export";
import {
  formatBantenToCSV,
  formatTasksToCSV,
  formatBudgetItemsToCSV,
  formatPaymentsToCSV,
  formatVendorsToCSV,
  formatRundownToCSV,
  formatGuestsToCSV,
} from "../formatters";
import {
  getWorkspaceFullExportAction,
  type WorkspaceExportPayload,
} from "../actions";

const OfflinePackModal = dynamic(() =>
  import("./offline-pack-modal").then((module) => module.OfflinePackModal)
);

interface WorkspaceExportCardProps {
  weddingId: string;
  coupleNames: string;
  isPreview?: boolean;
}

export function WorkspaceExportCard({
  weddingId,
  coupleNames,
  isPreview: propIsPreview,
}: WorkspaceExportCardProps) {
  const isPreview = propIsPreview ?? weddingId === "demo";
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [cachedData, setCachedData] = useState<WorkspaceExportPayload | null>(
    null
  );
  const [activeExport, setActiveExport] = useState<string | null>(null);

  // Helper to slugify couple names for safe filenames
  const safeSlug =
    coupleNames
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "pawiwahan";

  // Ensure data is loaded
  const loadData = async (): Promise<WorkspaceExportPayload | null> => {
    if (cachedData) return cachedData;
    setIsLoading(true);
    try {
      const res = await runAction(
        () => getWorkspaceFullExportAction(weddingId),
        false
      );
      if (res.success && res.data) {
        setCachedData(res.data);
        return res.data;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBanten = async () => {
    setActiveExport("banten");
    try {
      const data = await loadData();
      if (!data) return;
      const csv = formatBantenToCSV(data.banten);
      void runAction(
        async () => {
          downloadCSV(`patemon-banten-${safeSlug}.csv`, csv);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const handleExportRundown = async () => {
    setActiveExport("rundown");
    try {
      const data = await loadData();
      if (!data) return;
      const csv = formatRundownToCSV(data.rundown);
      void runAction(
        async () => {
          downloadCSV(`patemon-rundown-hari-h-${safeSlug}.csv`, csv);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const handleExportTasks = async () => {
    setActiveExport("tasks");
    try {
      const data = await loadData();
      if (!data) return;
      const csv = formatTasksToCSV(data.tasks);
      void runAction(
        async () => {
          downloadCSV(`patemon-tugas-checklist-${safeSlug}.csv`, csv);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const handleExportBudget = async () => {
    setActiveExport("budget");
    try {
      const data = await loadData();
      if (!data) return;
      const csv = formatBudgetItemsToCSV(data.budget);
      void runAction(
        async () => {
          downloadCSV(`patemon-anggaran-${safeSlug}.csv`, csv);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const handleExportPayments = async () => {
    setActiveExport("payments");
    try {
      const data = await loadData();
      if (!data) return;
      const csv = formatPaymentsToCSV(data.budget);
      void runAction(
        async () => {
          downloadCSV(`patemon-riwayat-pembayaran-${safeSlug}.csv`, csv);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const handleExportVendors = async () => {
    setActiveExport("vendors");
    try {
      const data = await loadData();
      if (!data) return;
      const csv = formatVendorsToCSV(data.vendors);
      void runAction(
        async () => {
          downloadCSV(`patemon-vendor-kontrak-${safeSlug}.csv`, csv);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const handleExportGuests = async () => {
    setActiveExport("guests");
    try {
      const data = await loadData();
      if (!data) return;
      const csv = formatGuestsToCSV(data.guests);
      void runAction(
        async () => {
          downloadCSV(`patemon-daftar-tamu-${safeSlug}.csv`, csv);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const handleExportAllJSON = async () => {
    setActiveExport("all_json");
    try {
      const data = await loadData();
      if (!data) return;
      void runAction(
        async () => {
          downloadJSON(`patemon-arsip-lengkap-${safeSlug}.json`, data);
          return { success: true };
        },
        {
          variant: "info",
          message: "Berkas siap diunduh. Periksa daftar unduhan browser Anda.",
        }
      );
    } finally {
      setActiveExport(null);
    }
  };

  const exportOptions = [
    {
      id: "banten",
      title: "Banten & Sarana Ritual",
      description:
        "Daftar kebutuhan banten per upacara, status pengadaan, PIC keluarga, dan estimasi biaya",
      icon: Flower2,
      countLabel: cachedData ? `${cachedData.banten.length} sarana` : undefined,
      onExport: handleExportBanten,
    },
    {
      id: "rundown",
      title: "Jadwal Rundown Hari-H Panitia",
      description:
        "Susunan acara kronologis dengan waktu WITA, lokasi, koordinator, dan kesiapan banten",
      icon: CalendarDays,
      countLabel: cachedData
        ? `${cachedData.rundown.length} segmen`
        : undefined,
      onExport: handleExportRundown,
    },
    {
      id: "tasks",
      title: "Daftar Tugas & Checklist Keluarga",
      description:
        "Rincian tugas persiapan, prioritas, PIC, dan batas waktu pelaksanaan",
      icon: CheckSquare,
      countLabel: cachedData ? `${cachedData.tasks.length} tugas` : undefined,
      onExport: handleExportTasks,
    },
    {
      id: "budget",
      title: "Buku Pos Anggaran",
      description:
        "Alokasi biaya per pos pengeluaran, realisasi, dan penanggung jawab pembayaran",
      icon: Coins,
      countLabel: cachedData ? `${cachedData.budget.length} pos` : undefined,
      onExport: handleExportBudget,
    },
    {
      id: "payments",
      title: "Riwayat Transaksi Pembayaran",
      description:
        "Rekap pencatatan pembayaran cicilan, DP vendor, dan pelunasan bertanggal",
      icon: Receipt,
      countLabel: cachedData
        ? `${cachedData.budget.reduce((acc, i) => acc + (i.payments?.length || 0), 0)} transaksi`
        : undefined,
      onExport: handleExportPayments,
    },
    {
      id: "vendors",
      title: "Daftar Vendor & Kontak",
      description:
        "Kontak PIC vendor, status pemesanan, nilai kontrak, dan sisa kewajiban pembayaran",
      icon: Store,
      countLabel: cachedData
        ? `${cachedData.vendors.length} vendor`
        : undefined,
      onExport: handleExportVendors,
    },
    {
      id: "guests",
      title: "Daftar Tamu & Kehadiran",
      description:
        "Daftar nama undangan, pihak keluarga, kelompok/dadia/banjar, dan status RSVP",
      icon: Users,
      countLabel: cachedData
        ? `${cachedData.guests.length} undangan`
        : undefined,
      onExport: handleExportGuests,
    },
  ];

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">
              Pusat Ekspor & Kontingensi Offline
            </CardTitle>
            <CardDescription className="text-xs">
              Unduh salinan data perencanaan berformat CSV (Excel) dan cadangan
              arsip untuk pegangan panitia
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cultural Contingency Notice */}
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="leading-relaxed">
              <p className="font-semibold">
                Kesiapan Kontingensi Lapangan di Bali (Mode Offline & Cetak A4)
              </p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                Sinyal seluler di lokasi banjar, puri, atau pura pedalaman kerap
                mengalami kendala saat upacara berlangsung. Simpan paket hari-H
                mandiri (HTML) untuk dibuka tanpa kuota internet atau cetak PDF
                A4.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            disabled={isPreview}
            onClick={() => {
              if (isPreview) return;
              setIsOfflineModalOpen(true);
            }}
            className="shrink-0 gap-1.5 text-xs"
            title={isPreview ? "Fitur dinonaktifkan pada Mode Demo" : undefined}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paket Hari-H Offline & Cetak</span>
          </Button>
        </div>

        {/* Modular CSV Export Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exportOptions.map((opt) => {
            const Icon = opt.icon;
            const isCurrentExporting = activeExport === opt.id;
            return (
              <div
                key={opt.id}
                className="border-border/80 bg-card hover:border-primary/40 flex flex-col justify-between rounded-xl border p-4 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-md">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="text-foreground text-sm font-semibold">
                        {opt.title}
                      </h4>
                    </div>
                    {opt.countLabel && (
                      <Badge variant="secondary" className="text-[10px]">
                        {opt.countLabel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div className="pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={isPreview ? undefined : opt.onExport}
                    disabled={isPreview || isLoading || isCurrentExporting}
                    title={
                      isPreview
                        ? "Ekspor CSV dinonaktifkan pada Mode Demo"
                        : undefined
                    }
                  >
                    {isCurrentExporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Mengekspor...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Unduh CSV (Excel)</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Backup JSON Box */}
        <div className="border-border/80 bg-muted/20 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileArchive className="text-primary h-4 w-4" />
              <h4 className="text-foreground text-sm font-semibold">
                Cadangan Lengkap Workspace (JSON)
              </h4>
            </div>
            <p className="text-muted-foreground text-xs">
              Arsipkan seluruh data upacara, banten, anggaran, rundown, vendor,
              dan tamu dalam 1 file JSON terstruktur.
            </p>
          </div>

          <Button
            variant="default"
            size="sm"
            className="shrink-0 gap-2 text-xs"
            onClick={isPreview ? undefined : handleExportAllJSON}
            disabled={isPreview || isLoading || activeExport === "all_json"}
            title={
              isPreview
                ? "Cadangan JSON dinonaktifkan pada Mode Demo"
                : undefined
            }
          >
            {activeExport === "all_json" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menyiapkan Arsip...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Cadangan JSON</span>
              </>
            )}
          </Button>
        </div>

        {/* Privacy & Security Guarantee */}
        <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            File CSV dienkripsi karakter UTF-8 BOM untuk mencegah distorsi tanda
            aksara Bali dan formula injection pada aplikasi spreadsheet.
          </span>
        </div>
      </CardContent>

      {/* Offline Pack Modal */}
      {isOfflineModalOpen && (
        <OfflinePackModal
          weddingId={weddingId}
          coupleNames={coupleNames}
          isOpen={isOfflineModalOpen}
          onClose={() => setIsOfflineModalOpen(false)}
        />
      )}
    </Card>
  );
}
