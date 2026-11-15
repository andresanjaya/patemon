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
}

export function BantenReviewModal({
  weddingId,
  isOpen,
  onClose,
  item,
  currentUserRole = "editor",
  onSuccess,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-background border-border w-full max-w-lg rounded-2xl border p-6 shadow-xl sm:p-7">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-foreground text-lg font-bold">
                Tinjauan Adat & Dresta Keluarga
              </h3>
              <p className="text-muted-foreground text-xs">
                Keputusan lokal untuk &apos;{item.name}&apos; pada pawiwahan ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive mb-4 rounded-lg border p-3 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Decision Selector */}
          <div className="space-y-2">
            <Label className="text-foreground text-xs font-semibold">
              Status Persetujuan Adat
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
                <span className="text-xs font-semibold">Disetujui Adat</span>
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
                <span className="text-xs font-semibold">Perlu Ditinjau</span>
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
                <span className="text-xs font-semibold">Perlu Revisi</span>
              </button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Catatan: Status tinjauan adat terpisah dari status pengadaan
              barang/jasa.
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
              Nama Peninjau / Praktisi Adat *
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
              className="text-xs"
              required
            />
            {reviewerType === "external_practitioner" && (
              <p className="text-muted-foreground text-[11px]">
                Label transparansi: Akan dicatat sebagai &quot;Dicatat oleh
                Anda&quot; untuk mencegah pemalsuan akun resmi.
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
              className="min-h-18 resize-none text-xs"
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
              className="text-xs"
            />
          </div>

          <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-lg border p-2.5 text-[11px]">
            <Info className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Keputusan ini hanya berlaku untuk pawiwahan keluarga Anda dan
              tidak memodifikasi pustaka katalog universal Patemon.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-2">
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
        </form>
      </div>
    </div>
  );
}
