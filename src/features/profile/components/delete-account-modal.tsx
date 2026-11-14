"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteUserAccountAction,
  type DeletionEligibilityResult,
} from "../privacy-actions";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibility: DeletionEligibilityResult | null;
  isChecking: boolean;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  eligibility,
  isChecking,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === "HAPUS AKUN";
  const isBlocked = !eligibility?.eligible;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await deleteUserAccountAction(confirmationInput);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal memproses penghapusan akun.");
        setIsDeleting(false);
        return;
      }

      router.push("/?deleted=true");
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kesalahan teknis saat menghapus akun.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div
        className="bg-background border-border relative w-full max-w-lg rounded-2xl border p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-md p-1 transition-colors"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="bg-destructive/10 text-destructive flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="delete-account-title"
              className="text-foreground text-lg font-bold"
            >
              Hapus Akun & Data Pribadi
            </h3>
            <p className="text-muted-foreground text-xs">
              Penghapusan permanen hak subjek data sesuai Pasal 28 UU PDP
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {errorMessage && (
            <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isChecking ? (
            <div className="space-y-2 py-8 text-center">
              <Loader2 className="text-primary mx-auto h-6 w-6 animate-spin" />
              <p className="text-muted-foreground text-xs">
                Memeriksa keterkaitan kepemilikan workspace...
              </p>
            </div>
          ) : isBlocked ? (
            /* Sole Owner Blocking Notice */
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Pendelegasian Pemilik (Owner) Diperlukan
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    Anda merupakan satu-satunya Pemilik (Owner) aktif pada
                    workspace berikut. Untuk melindungi koordinasi keluarga,
                    Anda wajib mengalihkan peran Pemilik ke anggota lain atau
                    menghapus workspace terlebih dahulu.
                  </p>
                </div>
              </div>

              <div className="border-border/80 bg-muted/20 space-y-2 rounded-xl border p-3">
                <span className="text-muted-foreground text-[11px] font-medium">
                  Workspace yang memerlukan delegasi:
                </span>
                <div className="space-y-1.5">
                  {eligibility?.soleOwnedWeddings.map((w) => (
                    <div
                      key={w.id}
                      className="bg-card border-border/60 flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                    >
                      <span className="text-foreground font-medium">
                        {w.coupleNames}
                      </span>
                      <Link
                        href={`/workspace/${w.id}/settings`}
                        className="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-medium"
                      >
                        <span>Kelola Anggota</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Eligible for Deletion */
            <div className="space-y-4">
              <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-xl border p-3.5 text-xs">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Peringatan: Tindakan ini permanen!
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Semua metadata profil, nomor telepon, dan hak akses Anda
                    pada workspace pawiwahan akan dicabut seketika. Anda tidak
                    dapat membatalkan aksi ini.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmationPhrase" className="text-xs">
                  Ketik{" "}
                  <strong className="text-destructive font-bold">
                    HAPUS AKUN
                  </strong>{" "}
                  untuk konfirmasi:
                </Label>
                <Input
                  id="confirmationPhrase"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="HAPUS AKUN"
                  className="font-mono text-xs"
                  disabled={isDeleting}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Batal
          </Button>

          {!isBlocked && !isChecking && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="gap-2 text-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menghapus Akun...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Akun Permanen</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
