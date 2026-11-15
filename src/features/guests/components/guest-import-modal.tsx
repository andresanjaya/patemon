"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import {
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Guest } from "../types";
import type { CsvImportPreview } from "../csv-types";
import {
  generateGuestsCsvTemplate,
  parseAndValidateGuestsCsv,
  MAX_FILE_SIZE_BYTES,
  MAX_IMPORT_ROWS,
} from "../csv-parser";
import { batchImportGuestsAction } from "../actions";

interface GuestImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  existingGuests: Guest[];
  onImportSuccess?: (count: number) => void;
}

export function GuestImportModal({
  isOpen,
  onClose,
  weddingId,
  existingGuests,
  onImportSuccess,
}: GuestImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "valid" | "duplicate" | "invalid"
  >("all");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = generateGuestsCsvTemplate();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_tamu_patemon.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setImportResult(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setParseError("Ukuran file melebihi batas maksimal 2 MB.");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseAndValidateGuestsCsv(text, existingGuests);

        if (result.totalRows === 0) {
          setParseError("File CSV kosong atau tidak memiliki data baris tamu.");
          setPreview(null);
          return;
        }

        if (result.totalRows > MAX_IMPORT_ROWS) {
          setParseError(
            `File memiliki lebih dari ${MAX_IMPORT_ROWS} baris. Hanya ${MAX_IMPORT_ROWS} baris pertama yang akan diproses.`
          );
        }

        setPreview(result);
      } catch (err: unknown) {
        setParseError(
          err instanceof Error ? err.message : "Gagal membaca format CSV."
        );
        setPreview(null);
      }
    };
    reader.readAsText(selectedFile, "UTF-8");
  };

  const handleConfirmImport = () => {
    if (!preview) return;

    const rowsToImport = preview.rows
      .filter((r) => {
        if (r.status === "invalid") return false;
        if (skipDuplicates && r.status === "duplicate") return false;
        return true;
      })
      .map((r) => ({
        name: r.row.name,
        side: r.row.side,
        groupHousehold: r.row.groupHousehold,
        headcount: r.row.headcount,
        phone: r.row.phone,
        notes: r.row.notes,
      }));

    if (rowsToImport.length === 0) {
      setParseError(
        "Tidak ada tamu yang valid untuk diimpor berdasarkan filter saat ini."
      );
      return;
    }

    startTransition(async () => {
      const res = await batchImportGuestsAction(weddingId, rowsToImport, {
        skipDuplicates,
      });

      if (res.success) {
        setImportResult(res.message);
        if (onImportSuccess) {
          onImportSuccess(res.importedCount);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setParseError(res.message);
      }
    });
  };

  const filteredRows =
    preview?.rows.filter((r) => {
      if (activeFilter === "valid") return r.status === "valid";
      if (activeFilter === "duplicate") return r.status === "duplicate";
      if (activeFilter === "invalid") return r.status === "invalid";
      return true;
    }) || [];

  const eligibleCount = preview
    ? preview.rows.filter((r) => {
        if (r.status === "invalid") return false;
        if (skipDuplicates && r.status === "duplicate") return false;
        return true;
      }).length
    : 0;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-background border-border relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border shadow-2xl">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-bold">
                Impor Tamu dari CSV
              </h2>
              <p className="text-muted-foreground text-xs">
                Unggah daftar undangan keluarga dengan pratinjau cerdas dan
                deteksi duplikat.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Template Download Banner */}
          <div className="bg-muted/40 border-border flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <FileText className="text-primary mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-foreground text-xs font-semibold">
                  Gunakan Template Resmi CSV
                </p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Kolom: Nama Lengkap, Pihak (Mempelai Pria/Wanita),
                  Kelompok/Grup, Jumlah Hadir, Nomor HP, Catatan.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="shrink-0 gap-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh Template
            </Button>
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <label
              htmlFor="csv-file-upload"
              className="border-border hover:border-primary/50 bg-muted/10 group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors"
            >
              <Upload className="text-muted-foreground group-hover:text-primary mb-2 h-8 w-8 transition-colors" />
              <p className="text-foreground text-xs font-medium">
                {file ? file.name : "Klik atau seret file CSV ke sini"}
              </p>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Format UTF-8 .csv (maksimal 500 baris atau 2 MB)
              </p>
              <input
                id="csv-file-upload"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Parse or Validation Feedback */}
          {parseError && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {importResult && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{importResult}</span>
            </div>
          )}

          {/* Preview Section */}
          {preview && (
            <div className="space-y-4 pt-2">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="bg-card rounded-lg border p-3">
                  <span className="text-muted-foreground text-[11px]">
                    Total Baris
                  </span>
                  <div className="text-foreground text-lg font-bold">
                    {preview.totalRows}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Siap Diimpor
                  </span>
                  <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                    {preview.validCount}
                  </div>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    Duplikat
                  </span>
                  <div className="text-lg font-bold text-amber-800 dark:text-amber-200">
                    {preview.duplicateCount}
                  </div>
                </div>
                <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-3">
                  <span className="text-destructive text-[11px]">
                    Tidak Valid
                  </span>
                  <div className="text-destructive text-lg font-bold">
                    {preview.invalidCount}
                  </div>
                </div>
              </div>

              {/* Deduplication & Filter Controls */}
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="accent-primary h-4 w-4 rounded"
                  />
                  <span className="text-foreground font-medium">
                    Lewati tamu yang terdeteksi duplikat
                  </span>
                </label>

                {/* Filter Tabs */}
                <div className="bg-muted inline-flex rounded-lg p-0.5 text-xs">
                  {[
                    { id: "all", label: `Semua (${preview.totalRows})` },
                    { id: "valid", label: `Valid (${preview.validCount})` },
                    {
                      id: "duplicate",
                      label: `Duplikat (${preview.duplicateCount})`,
                    },
                    { id: "invalid", label: `Error (${preview.invalidCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          tab.id as "all" | "valid" | "duplicate" | "invalid"
                        )
                      }
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        activeFilter === tab.id
                          ? "bg-background text-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border-border max-h-56 overflow-y-auto rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 sticky top-0 font-semibold">
                    <tr className="border-border border-b">
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Nama Tamu</th>
                      <th className="px-3 py-2.5">Pihak</th>
                      <th className="px-3 py-2.5">Jumlah</th>
                      <th className="px-3 py-2.5">Telepon</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-muted-foreground py-6 text-center"
                        >
                          Tidak ada baris pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr
                          key={r.row.originalIndex}
                          className="hover:bg-muted/30"
                        >
                          <td className="text-muted-foreground px-3 py-2 font-mono text-[10px]">
                            {r.row.originalIndex}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {r.row.name || (
                              <span className="text-destructive font-italic">
                                (Kosong)
                              </span>
                            )}
                            {r.row.groupHousehold && (
                              <span className="text-muted-foreground block text-[10px]">
                                Grup: {r.row.groupHousehold}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[11px]">
                            {r.row.side === "groom"
                              ? "Pria"
                              : r.row.side === "bride"
                                ? "Wanita"
                                : "Bersama"}
                          </td>
                          <td className="px-3 py-2">{r.row.headcount} orang</td>
                          <td className="text-muted-foreground px-3 py-2 font-mono text-[11px]">
                            {r.row.phone || "-"}
                          </td>
                          <td className="px-3 py-2">
                            {r.status === "valid" ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/30 text-[10px] text-emerald-700"
                              >
                                Siap
                              </Badge>
                            ) : r.status === "duplicate" ? (
                              <Badge
                                variant="secondary"
                                className="bg-amber-50 text-[10px] text-amber-700"
                              >
                                Duplikat
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[10px]"
                              >
                                Error
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-border flex items-center justify-between border-t px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="text-xs"
          >
            Batal
          </Button>

          {preview && (
            <Button
              size="sm"
              onClick={handleConfirmImport}
              disabled={isPending || eligibleCount === 0}
              className="gap-2 text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5" />
                  Konfirmasi Impor ({eligibleCount} Tamu)
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
