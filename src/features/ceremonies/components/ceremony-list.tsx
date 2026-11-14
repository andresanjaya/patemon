"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarHeart,
  Settings2,
  Clock,
  MapPin,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ProvenanceBadge } from "./provenance-badge";
import { updateCeremonyStatusAction } from "../actions";
import type { CeremonyTemplate, WeddingCeremony } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface CeremonyListProps {
  weddingId: string;
  ceremonies: WeddingCeremony[];
  templates: CeremonyTemplate[];
  userRole: WorkspaceRole;
}

export function CeremonyList({
  weddingId,
  ceremonies,
  templates,
  userRole,
}: CeremonyListProps) {
  const [items, setItems] = useState<WeddingCeremony[]>(ceremonies);
  const canEdit = userRole === "owner" || userRole === "editor";

  const handleToggleStatus = async (ceremony: WeddingCeremony) => {
    if (!canEdit) return;

    const nextStatus: WeddingCeremony["status"] =
      ceremony.status === "draft"
        ? "confirmed"
        : ceremony.status === "confirmed"
          ? "completed"
          : "draft";

    // Optimistic update
    setItems((prev) =>
      prev.map((c) => (c.id === ceremony.id ? { ...c, status: nextStatus } : c))
    );

    await updateCeremonyStatusAction(ceremony.id, weddingId, nextStatus);
  };

  const getStatusBadge = (status: WeddingCeremony["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500 text-[10px] text-white hover:bg-emerald-600">
            Selesai
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="secondary" className="text-primary text-[10px]">
            Terkonfirmasi
          </Badge>
        );
      case "draft":
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground text-[10px]"
          >
            Rencana (Draft)
          </Badge>
        );
    }
  };

  // Group by phase
  const phases = ["Persiapan", "Puncak Acara", "Pasca Pawiwahan"];

  if (items.length === 0) {
    return (
      <Card className="border-dashed py-10 text-center">
        <CardContent className="space-y-4">
          <div className="bg-primary/10 text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
            <CalendarHeart className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Belum Ada Rencana Upacara</CardTitle>
            <CardDescription className="mx-auto max-w-md text-xs">
              Mulai susun tahapan prosesi perkawinan adat Bali dengan panduan
              rekomendasi dresta kami.
            </CardDescription>
          </div>
          {canEdit && (
            <Button asChild size="sm" className="gap-2">
              <Link href={`/workspace/${weddingId}/onboarding`}>
                <Sparkles className="h-4 w-4" />
                <span>Mulai Panduan Onboarding Upacara</span>
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight">
            Rangkaian Prosesi Upacara Adat
          </h3>
          <p className="text-muted-foreground text-xs">
            {items.length} tahapan prosesi terdaftar dalam jadwal pawiwahan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/workspace/${weddingId}/ceremonies`}>
              <CalendarHeart className="h-4 w-4" />
              <span>Daftar & Rundown Upacara</span>
            </Link>
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/workspace/${weddingId}/onboarding`}>
                <Settings2 className="h-4 w-4" />
                <span>Atur Ulang Rencana</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {phases.map((phase) => {
          const phaseItems = items.filter(
            (c) => c.phase === phase || (!c.phase && phase === "Puncak Acara")
          );

          if (phaseItems.length === 0) return null;

          return (
            <div key={phase} className="space-y-3">
              <div className="border-border/40 flex items-center gap-2 border-b pb-2">
                <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                  Fase {phase}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {phaseItems.length} Prosesi
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {phaseItems.map((ceremony, idx) => {
                  const template = templates.find(
                    (t) => t.id === ceremony.templateId
                  );

                  return (
                    <div
                      key={ceremony.id || idx}
                      className="border-border bg-card hover:border-primary/30 flex flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                          {ceremony.orderIndex || idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-foreground text-sm font-semibold">
                              {ceremony.title}
                            </h4>
                            {template && (
                              <ProvenanceBadge
                                status={template.validationStatus}
                                sourceUrl={template.sourceUrl}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(ceremony)}
                              disabled={!canEdit}
                              className="inline-flex cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
                              title={
                                canEdit
                                  ? "Klik untuk mengubah status"
                                  : undefined
                              }
                            >
                              {getStatusBadge(ceremony.status)}
                            </button>
                          </div>

                          {ceremony.customNotes && (
                            <p className="text-muted-foreground line-clamp-2 text-xs">
                              {ceremony.customNotes}
                            </p>
                          )}

                          <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                            {ceremony.scheduledDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(
                                  ceremony.scheduledDate
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {ceremony.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ceremony.location}
                              </span>
                            )}
                            {ceremony.personInCharge && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                PIC: {ceremony.personInCharge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:text-primary shrink-0 text-xs"
                        >
                          <Link
                            href={`/workspace/${weddingId}/ceremonies/${ceremony.id}`}
                          >
                            <span>Detail & Rundown</span>
                          </Link>
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="hover:text-primary shrink-0 text-xs"
                        >
                          <Link
                            href={`/workspace/${weddingId}/ceremonies/${ceremony.id}`}
                          >
                            <span>Detail & Rundown</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
