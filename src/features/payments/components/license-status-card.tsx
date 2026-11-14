"use client";

import { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  Clock,
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
import { UpgradePromptModal } from "./upgrade-prompt-modal";
import type { WorkspaceEntitlement } from "../types";

interface LicenseStatusCardProps {
  entitlement: WorkspaceEntitlement;
  weddingId: string;
  coupleNames?: string;
}

export function LicenseStatusCard({
  entitlement,
  weddingId,
  coupleNames,
}: LicenseStatusCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = () => {
    switch (entitlement.status) {
      case "active":
        return (
          <Badge className="bg-emerald-600 text-xs text-white">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Lisensi Aktif
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="border-blue-400 text-xs text-blue-700 dark:text-blue-300"
          >
            <Clock className="mr-1 h-3.5 w-3.5" />
            Arsip Baca-Saja
          </Badge>
        );
      case "free_preview":
      default:
        return (
          <Badge
            variant="secondary"
            className="text-xs text-amber-800 dark:text-amber-300"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Free Preview
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Lisensi & Hak Akses Pawiwahan
                </CardTitle>
                <CardDescription className="text-xs">
                  Status aktivasi fitur, hak kolaborasi keluarga, dan masa
                  berlaku workspace
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Info Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border-border/70 bg-card space-y-1 rounded-xl border p-3.5">
              <span className="text-muted-foreground text-[11px]">
                Paket Akses
              </span>
              <p className="text-foreground text-sm font-bold">
                {entitlement.planName}
              </p>
            </div>

            <div className="border-border/70 bg-card space-y-1 rounded-xl border p-3.5">
              <span className="text-muted-foreground text-[11px]">
                Tanggal Aktivasi
              </span>
              <p className="text-foreground text-sm font-semibold">
                {entitlement.grantedAt
                  ? new Date(entitlement.grantedAt).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : "Belum Diaktivasi"}
              </p>
            </div>

            <div className="border-border/70 bg-card space-y-1 rounded-xl border p-3.5">
              <span className="text-muted-foreground text-[11px]">
                Masa Berlaku
              </span>
              <p className="text-foreground text-sm font-semibold">
                {entitlement.validUntil
                  ? new Date(entitlement.validUntil).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : entitlement.status === "active"
                    ? "Seumur Hidup (Lifetime)"
                    : "Mode Pratinjau"}
              </p>
            </div>
          </div>

          {/* Capabilities Matrix */}
          <div className="border-border/70 bg-muted/20 space-y-3 rounded-xl border p-4">
            <span className="text-foreground text-xs font-semibold">
              Rincian Kapabilitas Workspace:
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-xs">
                {entitlement.canEdit ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span>
                  {entitlement.canEdit
                    ? "Edit & Simpan Data Aktif"
                    : "Mode Baca Saja (Terkunci)"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {entitlement.canInviteMembers ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span>
                  {entitlement.canInviteMembers
                    ? "Undang Tim Keluarga (Aktif)"
                    : "Undang Keluarga (Terkunci)"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Ekspor CSV & JSON (Selamanya)</span>
              </div>
            </div>
          </div>

          {/* Upgrade / Activation Callout if not active */}
          {!entitlement.isPaid && (
            <div className="border-border/80 from-primary/10 to-primary/10 flex flex-col gap-4 rounded-xl border bg-gradient-to-r via-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h4 className="text-foreground text-sm font-semibold">
                  Buka Akses Penuh Pawiwahan Anda
                </h4>
                <p className="text-muted-foreground text-xs">
                  Dapatkan hak mengundang keluarga, koordinasi vendor, dan
                  penyimpanan permanen hanya Rp 199.000 sekali bayar.
                </p>
              </div>

              <Button
                size="sm"
                className="shrink-0 gap-2 text-xs"
                onClick={() => setIsModalOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Aktivasi Sekarang</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradePromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weddingId={weddingId}
        coupleNames={coupleNames}
      />
    </>
  );
}
