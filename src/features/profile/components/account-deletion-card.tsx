"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteAccountModal } from "./delete-account-modal";
import {
  checkAccountDeletionEligibilityAction,
  type DeletionEligibilityResult,
} from "../privacy-actions";

export function AccountDeletionCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [eligibility, setEligibility] =
    useState<DeletionEligibilityResult | null>(null);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setIsChecking(true);
    try {
      const result = await checkAccountDeletionEligibilityAction();
      setEligibility(result);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/30 bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 text-destructive flex h-10 w-10 items-center justify-center rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-destructive text-xl">
                Zona Bahaya: Hapus Akun & Data
              </CardTitle>
              <CardDescription className="text-xs">
                Hak penghapusan data pribadi (Right to Erasure) sesuai Pasal 28
                UU PDP
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Menghapus akun Anda akan membatalkan seluruh sesi, menghapus data
            profil, dan mencabut akses ke seluruh workspace pawiwahan. Jika Anda
            adalah satu-satunya Pemilik pada workspace yang sedang aktif, Anda
            harus menunjuk Pemilik pengganti terlebih dahulu.
          </p>

          <div className="border-destructive/15 flex items-center justify-between border-t pt-4">
            <span className="text-muted-foreground text-[11px]">
              Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleOpenModal}
              className="gap-2 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Hapus Akun Saya</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eligibility={eligibility}
        isChecking={isChecking}
      />
    </>
  );
}
