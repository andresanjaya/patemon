"use client";

import { confirmAction } from "@/components/ui/action-confirmation";

import { runAction } from "@/components/ui/action-feedback";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Check, X, Loader2, CalendarHeart } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_CONFIG, type PendingInvitation } from "../types";
import {
  acceptWorkspaceInvitationAction,
  declineWorkspaceInvitationAction,
} from "../actions";

interface PendingInvitationsBannerProps {
  initialInvitations: PendingInvitation[];
}

export function PendingInvitationsBanner({
  initialInvitations,
}: PendingInvitationsBannerProps) {
  const [invitations, setInvitations] =
    useState<PendingInvitation[]>(initialInvitations);
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const handleAccept = async (id: string) => {
    setLoadingId(id);
    const result = await runAction(
      () => acceptWorkspaceInvitationAction(id),
      "Undangan diterima. Ruang kerja kini dapat diakses."
    );
    if (result.success) {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      router.refresh();
    }
    setLoadingId(null);
  };

  const handleDecline = async (id: string) => {
    if (
      !(await confirmAction({
        title: "Tolak undangan kolaborasi?",
        description: "Apakah Anda yakin ingin menolak undangan ini?",
        confirmLabel: "Tolak undangan",
        destructive: false,
      }))
    )
      return;
    setLoadingId(id);
    const result = await runAction(
      () => declineWorkspaceInvitationAction(id),
      "Undangan berhasil ditolak."
    );
    if (result.success)
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    setLoadingId(null);
  };

  return (
    <Card className="border-primary/40 from-primary/5 via-card to-card bg-gradient-to-r shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="text-primary h-4 w-4" />
          <CardTitle className="text-foreground text-base font-semibold">
            Undangan Kolaborasi Menunggu Konfirmasi ({invitations.length})
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Anda diundang oleh keluarga untuk bergabung membantu perencanaan
          pawiwahan berikut:
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {invitations.map((inv) => {
          const cfg = ROLE_CONFIG[inv.role];
          const isLoading = loadingId === inv.id;

          return (
            <div
              key={inv.id}
              className="border-border/80 bg-background/80 flex flex-col justify-between gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarHeart className="text-primary h-4 w-4" />
                  <span className="text-foreground text-sm font-bold">
                    {inv.coupleNames}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${cfg.badgeClass}`}
                  >
                    Peran: {cfg.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground pl-6 text-xs leading-normal">
                  {cfg.description}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(inv.id)}
                  disabled={isLoading}
                  className="h-8 text-xs"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Tolak
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv.id)}
                  disabled={isLoading}
                  className="h-8 gap-1.5 text-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Terima Undangan
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
