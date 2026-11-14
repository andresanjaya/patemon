"use client";

import { useState } from "react";
import { Users, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WorkspaceRole } from "@/features/workspaces/types";
import type { WorkspaceMember } from "../types";
import { getWorkspaceMembers } from "../actions";
import { MemberList } from "./member-list";
import { InviteMemberModal } from "./invite-member-modal";
import { UpgradePromptModal } from "@/features/payments/components/upgrade-prompt-modal";

interface WorkspaceMembersCardProps {
  weddingId: string;
  coupleNames: string;
  initialMembers: WorkspaceMember[];
  currentUserRole: WorkspaceRole;
  canInvite?: boolean;
}

export function WorkspaceMembersCard({
  weddingId,
  coupleNames,
  initialMembers,
  currentUserRole,
  canInvite = true,
}: WorkspaceMembersCardProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwner = currentUserRole === "owner";

  const handleInviteClick = () => {
    if (canInvite === false) {
      setIsUpgradeModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleRefresh = async () => {
    try {
      const updated = await getWorkspaceMembers(weddingId);
      setMembers(updated);
    } catch {
      // silently fallback to current state
    }
  };

  const handleSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    handleRefresh();
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="text-primary h-5 w-5" />
            <CardTitle className="text-xl">
              Anggota Keluarga & Tim Kolaborasi
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Atur hak akses (*owner*, *editor*, *viewer*) bagi mempelai, orang
            tua, panitia karya, dan serati
          </CardDescription>
        </div>

        {isOwner && (
          <Button
            size="sm"
            onClick={handleInviteClick}
            className="gap-1.5 self-start text-xs sm:self-center"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Undang Anggota</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2.5 rounded-lg border p-3 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Member List */}
        <MemberList
          weddingId={weddingId}
          coupleNames={coupleNames}
          members={members}
          currentUserRole={currentUserRole}
          onRefresh={handleRefresh}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </CardContent>

      <InviteMemberModal
        weddingId={weddingId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <UpgradePromptModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        weddingId={weddingId}
        coupleNames={coupleNames}
      />
    </Card>
  );
}
