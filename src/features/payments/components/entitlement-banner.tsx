"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradePromptModal } from "./upgrade-prompt-modal";
import type { WorkspaceEntitlement } from "../types";

interface EntitlementBannerProps {
  entitlement: WorkspaceEntitlement;
  weddingId: string;
  coupleNames?: string;
}

export function WorkspaceEntitlementBanner({
  entitlement,
  weddingId,
  coupleNames,
}: EntitlementBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active workspace with plenty of time remaining does not need an intrusive banner
  if (entitlement.status === "active") {
    if (entitlement.daysRemaining !== null && entitlement.daysRemaining <= 14) {
      return (
        <div className="border-border/60 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-900 sm:px-6 dark:text-amber-200">
          <div className="container mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Masa aktif edit tersisa{" "}
                <strong>{entitlement.daysRemaining} hari</strong> sebelum
                beralih ke mode arsip baca-saja seumur hidup.
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Graceful Expired / Read-Only Mode (PRD 5.4)
  if (entitlement.status === "expired") {
    return (
      <div className="border-border/60 border-b bg-blue-500/10 px-4 py-2.5 text-xs text-blue-950 sm:px-6 dark:text-blue-200">
        <div className="container mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>Mode Arsip Pawiwahan (Baca-Saja):</strong> Masa persiapan
              telah selesai. Seluruh catatan upacara, banten, dan anggaran tetap
              tersimpan aman dan dapat diekspor ke CSV/JSON selamanya.
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-blue-400/40 text-[10px] text-blue-700 dark:text-blue-300"
          >
            Arsip Permanen
          </Badge>
        </div>
      </div>
    );
  }

  // Revoked
  if (entitlement.status === "revoked") {
    return (
      <div className="border-destructive/30 bg-destructive/10 text-destructive border-b px-4 py-2.5 text-xs sm:px-6">
        <div className="container mx-auto flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Akses ke workspace ini telah ditangguhkan. Hubungi tim dukungan
            Patemon jika ini merupakan kekeliruan.
          </span>
        </div>
      </div>
    );
  }

  // Free Preview / Unpaid Mode
  return (
    <>
      <div className="border-b border-[#f3d993] bg-[#fff9eb] px-4 py-2.5 text-xs text-[#78350f] sm:px-6">
        <div className="container mx-auto flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#fcd34d] bg-[#fef3c7] text-[#92400e]">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="leading-snug">
              <span className="font-bold text-[#78350f]">
                {entitlement.isDemo
                  ? "Mode Demo Interaktif"
                  : "Mode Free Preview"}
                :
              </span>{" "}
              <span className="font-medium text-[#92400e]">
                {entitlement.isDemo
                  ? "Jelajahi alur perencanaan upacara pernikahan Hindu Bali."
                  : "Buka fitur kolaborasi keluarga dan penugasan panitia pawiwahan."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-8 gap-1.5 rounded-full px-4 text-xs font-semibold shadow-xs"
            >
              <span>Aktifkan Akses Penuh (Rp 199.000)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <UpgradePromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weddingId={weddingId}
        coupleNames={coupleNames}
      />
    </>
  );
}
