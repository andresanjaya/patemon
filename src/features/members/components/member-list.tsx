"use client";

import { useState } from "react";
import {
  Users,
  ShieldAlert,
  Trash2,
  Share2,
  Check,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkspaceRole } from "@/features/workspaces/types";
import { ROLE_CONFIG, type WorkspaceMember } from "../types";
import {
  updateWorkspaceMemberRoleAction,
  revokeWorkspaceMemberAction,
  deleteWorkspaceMemberAction,
} from "../actions";

interface MemberListProps {
  weddingId: string;
  coupleNames: string;
  members: WorkspaceMember[];
  currentUserRole: WorkspaceRole;
  onRefresh?: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (err: string) => void;
}

export function MemberList({
  weddingId,
  coupleNames,
  members,
  currentUserRole,
  onRefresh,
  onSuccess,
  onError,
}: MemberListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isCallerOwner = currentUserRole === "owner";

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    setLoadingId(memberId);
    try {
      const res = await updateWorkspaceMemberRoleAction({
        weddingId,
        memberId,
        role: newRole,
      });
      if (res.success) {
        onSuccess?.(res.message || "Peran berhasil diubah.");
        onRefresh?.();
      } else {
        onError?.(res.error || "Gagal mengubah peran.");
      }
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRevoke = async (memberId: string, memberEmail: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mencabut hak akses untuk ${memberEmail}? Pengguna tidak akan dapat melihat atau mengakses workspace ini lagi.`
      )
    ) {
      return;
    }

    setLoadingId(memberId);
    try {
      const res = await revokeWorkspaceMemberAction({
        weddingId,
        memberId,
      });
      if (res.success) {
        onSuccess?.(res.message || "Akses anggota berhasil dicabut.");
        onRefresh?.();
      } else {
        onError?.(res.error || "Gagal mencabut akses.");
      }
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Hapus undangan untuk ${memberEmail} secara permanen?`)) {
      return;
    }

    setLoadingId(memberId);
    try {
      const res = await deleteWorkspaceMemberAction({
        weddingId,
        memberId,
      });
      if (res.success) {
        onSuccess?.(res.message || "Anggota berhasil dihapus.");
        onRefresh?.();
      } else {
        onError?.(res.error || "Gagal menghapus anggota.");
      }
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCopyInviteLink = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const inviteUrl = `${origin}/workspaces`;
    const message = `Om Swastyastu. Anda diundang untuk bergabung ke persiapan pernikahan adat ${coupleNames} melalui aplikasi Patemon: ${inviteUrl}`;

    navigator.clipboard.writeText(message);
    setCopied(true);
    onSuccess?.(
      "Pesan & tautan undangan WhatsApp berhasil disalin ke clipboard!"
    );
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Bar */}
      <div className="border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Users className="text-primary h-4 w-4" />
          <span>
            Total:{" "}
            <strong className="text-foreground">
              {members.length} Anggota Terdaftar
            </strong>
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyInviteLink}
          className="border-primary/30 text-primary hover:bg-primary/5 gap-1.5 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span>Salin Undangan WhatsApp</span>
            </>
          )}
        </Button>
      </div>

      {/* Member List */}
      <div className="divide-border/60 border-border/80 bg-card divide-y overflow-hidden rounded-xl border">
        {members.map((m) => {
          const cfg = ROLE_CONFIG[m.role];
          const isLoading = loadingId === m.id;
          const isPending = m.status === "invited";
          const isRevoked = m.status === "revoked";

          // Initials for avatar
          const displayName = m.profile?.fullName || m.invitedEmail;
          const initials = displayName
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <div
              key={m.id}
              className={`flex flex-col justify-between gap-3 p-4 transition-colors sm:flex-row sm:items-center ${
                isRevoked ? "bg-muted/30 opacity-70" : "hover:bg-muted/10"
              }`}
            >
              {/* Member Info */}
              <div className="flex items-start gap-3 sm:items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    m.role === "owner"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : m.role === "editor"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {initials}
                </div>

                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground text-sm font-semibold">
                      {displayName}
                    </span>
                    {isRevoked ? (
                      <Badge
                        variant="outline"
                        className="border-rose-300 bg-rose-50 text-[10px] text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      >
                        Akses Dicabut
                      </Badge>
                    ) : isPending ? (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      >
                        <Clock className="mr-0.5 inline h-2.5 w-2.5" /> Menunggu
                        Konfirmasi
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" />{" "}
                        Aktif
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground font-mono text-xs">
                    {m.invitedEmail}
                  </p>
                </div>
              </div>

              {/* Actions & Role Control */}
              <div className="flex flex-wrap items-center gap-2.5 pl-13 sm:pl-0">
                {isLoading ? (
                  <div className="text-muted-foreground flex items-center gap-1.5 px-3 py-1 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : isCallerOwner && !isRevoked ? (
                  <>
                    {/* Role Dropdown */}
                    <select
                      value={m.role}
                      onChange={(e) =>
                        handleRoleChange(m.id, e.target.value as WorkspaceRole)
                      }
                      className="border-border bg-background text-foreground focus:ring-primary h-8 rounded-lg border px-2.5 text-xs font-medium focus:ring-1 focus:outline-hidden"
                    >
                      <option value="owner">Pemilik (Owner)</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Pengamat (Viewer)</option>
                    </select>

                    {/* Revoke Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(m.id, m.invitedEmail)}
                      className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                      title="Cabut Hak Akses"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span className="sr-only">Cabut Akses</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge
                      variant="outline"
                      className={`text-xs ${cfg.badgeClass}`}
                    >
                      {cfg.label}
                    </Badge>

                    {isCallerOwner && (isRevoked || isPending) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(m.id, m.invitedEmail)}
                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                        title="Hapus Dari Daftar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Hapus</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
