"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  User,
  Users,
  BookOpen,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { submitBantenReviewAction } from "../actions";
import type { BantenItem, BantenReviewStatus, ReviewerType } from "../types";

interface BantenReviewModalProps {
  weddingId: string;
  isOpen: boolean;
  onClose: () => void;
  item: BantenItem | null;
  currentUserRole?: string | null;
  onSuccess: (updatedItem: BantenItem) => void;
  isPreview?: boolean;
  onPreviewUpgrade?: () => void;
}

export function BantenReviewModal({
  weddingId,
  isOpen,
  onClose,
  item,
  currentUserRole = "editor",
  onSuccess,
  isPreview,
  onPreviewUpgrade,
}: BantenReviewModalProps) {
  const [reviewStatus, setReviewStatus] = useState<BantenReviewStatus>(
    item?.reviewStatus || "needs_review"
  );
  const [reviewerType, setReviewerType] = useState<ReviewerType>(
    item?.reviewerType || "external_practitioner"
  );
  const [reviewerName, setReviewerName] = useState<string>(
    item?.reviewerName || ""
  );
  const [reviewNotes, setReviewNotes] = useState<string>(
    item?.reviewNotes || ""
  );
  const [sourceReference, setSourceReference] = useState<string>(
    item?.sourceReference || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !item) return null;

  const isViewer = currentUserRole === "viewer";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview && onPreviewUpgrade) {
      onPreviewUpgrade();
      return;
    }

    if (isViewer) {
      setError(
        "Akses hanya baca: Pengamat tidak dapat mencatat tinjauan adat."
      );
      return;
    }

    if (!reviewerName.trim()) {
      setError("Nama peninjau / praktisi wajib diisi.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await submitBantenReviewAction(weddingId, item.id, {
        reviewStatus,
        reviewerName: reviewerName.trim(),
        reviewerType,
        reviewNotes: reviewNotes.trim() || null,
        sourceReference: sourceReference.trim() || null,
      });

      if (!res.success) {
        setError(res.message || "Gagal menyimpan tinjauan adat.");
        return;
      }

      const updated: BantenItem = {
        ...item,
        reviewStatus,
        reviewerName: reviewerName.trim(),
        reviewerType,
        reviewNotes: reviewNotes.trim() || null,
        sourceReference: sourceReference.trim() || null,
        reviewedAt: new Date().toISOString(),
      };

      onSuccess(updated);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6">
      <div
        className="bg-card border-border/80 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="banten-review-modal-title"
      >
        {/* Metronic Header */}
        <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-b border-[#f0f0f4] bg-white px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="banten-review-modal-title"
                className="dark:text-foreground text-lg font-bold text-[#18181b]"
              >
                Tinjauan Adat & Dresta Keluarga
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Keputusan lokal adat pawiwahan untuk &lsquo;{item.name}&rsquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body: 2-Panel Metronic Layout */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {error && (
              <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-lg border p-3 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Panel (~2/3): Review Status & Decision Inputs */}
              <div className="space-y-4 lg:col-span-7 xl:col-span-8">
                {/* Status Decision Selector */}
                <div className="space-y-2">
                  <Label className="text-foreground text-xs font-semibold">
                    Status Persetujuan Adat{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewStatus("approved")}
                      disabled={isViewer}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                        reviewStatus === "approved"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "border-input bg-card text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold">
                        Disetujui Adat
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewStatus("needs_review")}
                      disabled={isViewer}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                        reviewStatus === "needs_review"
                          ? "border-amber-600 bg-amber-50 text-amber-900 shadow-xs dark:bg-amber-950/40 dark:text-amber-200"
                          : "border-input bg-card text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold">
                        Perlu Ditinjau
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewStatus("needs_revision")}
                      disabled={isViewer}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                        reviewStatus === "needs_revision"
                          ? "border-rose-600 bg-rose-50 text-rose-900 shadow-xs dark:bg-rose-950/40 dark:text-rose-200"
                          : "border-input bg-card text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                      <span className="text-xs font-semibold">
                        Perlu Revisi
                      </span>
                    </button>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Status tinjauan adat mencerminkan kesepakatan
                    tetua/pemangku, terpisah dari pengadaan logistik.
                  </p>
                </div>

                {/* Reviewer Category */}
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs font-semibold">
                    Kategori Peninjau
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewerType("external_practitioner")}
                      disabled={isViewer}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors ${
                        reviewerType === "external_practitioner"
                          ? "border-primary bg-primary/10 text-foreground font-medium"
                          : "border-input bg-card text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Users className="text-primary h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Praktisi Eksternal</p>
                        <p className="text-muted-foreground text-[10px]">
                          Pemangku, Serati, Tetua
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewerType("internal_member")}
                      disabled={isViewer}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-colors ${
                        reviewerType === "internal_member"
                          ? "border-primary bg-primary/10 text-foreground font-medium"
                          : "border-input bg-card text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <User className="text-primary h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Keluarga / Panitia</p>
                        <p className="text-muted-foreground text-[10px]">
                          Anggota Workspace
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Reviewer Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reviewerName"
                    className="text-foreground text-xs font-semibold"
                  >
                    Nama Peninjau / Praktisi Adat{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="reviewerName"
                    placeholder={
                      reviewerType === "external_practitioner"
                        ? "Contoh: Jero Mangku Griya Sanur / Serati Ibu Nyoman"
                        : "Contoh: Ida Bagus Made (Ketua Panitia)"
                    }
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    disabled={isViewer || isPending}
                    className="h-9 text-xs"
                    required
                  />
                  {reviewerType === "external_practitioner" && (
                    <p className="text-muted-foreground text-[11px]">
                      Label transparansi: Akan dicatat sebagai &quot;Dicatat
                      oleh Anda&quot; untuk mencegah pemalsuan akun resmi.
                    </p>
                  )}
                </div>

                {/* Review Notes / Local Dresta Decisions */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="reviewNotes"
                    className="text-foreground text-xs font-semibold"
                  >
                    Catatan Dresta & Kesepakatan Lokal
                  </Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder="Jelaskan kekhususan desa mawacara, kelengkapan sanggah cucuk, variasi tumpeng, atau arahan khusus..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    disabled={isViewer || isPending}
                    rows={3}
                    className="text-xs leading-relaxed"
                  />
                </div>

                {/* Source Reference */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sourceReference"
                    className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <BookOpen className="text-muted-foreground h-3.5 w-3.5" />
                    Sumber Rujukan / Lontar (Bila Ada)
                  </Label>
                  <Input
                    id="sourceReference"
                    placeholder="Contoh: Dresta Griya Sanur / Panduan PHDI / Lontar Dewa Yadnya"
                    value={sourceReference}
                    onChange={(e) => setSourceReference(e.target.value)}
                    disabled={isViewer || isPending}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Right Panel (~1/3): Context Metadata & Dresta Guidelines */}
              <div className="dark:lg:border-border/60 space-y-4 lg:col-span-5 lg:border-l lg:border-[#f0f0f4] lg:pl-6 xl:col-span-4">
                <div className="dark:border-border/60 dark:bg-muted/20 space-y-3 rounded-xl border border-[#f0f0f4] bg-[#f9f9fb] p-4">
                  <span className="text-muted-foreground block text-[11px] font-semibold tracking-wider uppercase">
                    Identitas Sarana Upakara
                  </span>

                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[11px]">
                      Nama Sarana:
                    </span>
                    <p className="text-foreground text-xs font-bold">
                      {item.name}
                    </p>
                  </div>

                  <div className="dark:border-border/40 grid grid-cols-2 gap-2 border-t border-[#f0f0f4] pt-1 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Kuantitas:
                      </span>
                      <span className="font-semibold">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Tingkatan:
                      </span>
                      <span className="font-semibold capitalize">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="dark:border-border/40 space-y-1 border-t border-[#f0f0f4] pt-1">
                    <span className="text-muted-foreground block text-[11px]">
                      Penanggung Jawab / Serati:
                    </span>
                    <p className="text-foreground text-xs font-medium">
                      {item.assigneeName || "Belum Ditugaskan"}
                    </p>
                  </div>
                </div>

                {/* Cultural Guideline Alert */}
                <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                    <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Panduan Dresta Keluarga</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                    Keputusan ini hanya berlaku untuk pawiwahan keluarga Anda
                    dan tidak memodifikasi pustaka katalog universal Patemon.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Metronic Footer */}
          <div className="dark:border-border/60 dark:bg-card flex shrink-0 items-center justify-between border-t border-[#f0f0f4] bg-[#fbfbfd] px-6 py-3.5">
            <span className="text-muted-foreground text-xs">
              {item.reviewedAt
                ? `Terakhir ditinjau: ${new Date(item.reviewedAt).toLocaleDateString("id-ID")}`
                : "Belum pernah ditinjau sebelumnya"}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isPending}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isViewer || isPending}
                className="gap-1.5 text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Tinjauan"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
