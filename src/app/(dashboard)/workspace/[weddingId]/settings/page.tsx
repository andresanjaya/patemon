import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import { WorkspaceSettingsForm } from "@/features/workspaces/components/workspace-settings-form";
import { getWorkspaceMembers } from "@/features/members/actions";
import { WorkspaceMembersCard } from "@/features/members/components/workspace-members-card";
import { WorkspaceExportCard } from "@/features/exports/components/workspace-export-card";
import { createClient } from "@/lib/supabase/server";

interface SettingsPageProps {
  params: Promise<{ weddingId: string }>;
}

async function SettingsContent({ params }: SettingsPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/settings`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const userWorkspaces = await getUserWorkspaces();
  const members = await getWorkspaceMembers(weddingId);

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
      />

      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Section 1: Wedding Parameters Form */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Pengaturan Pawiwahan</CardTitle>
            <CardDescription className="text-xs">
              Perbarui judul, nama mempelai, bentuk adat perkawinan, wilayah
              dresta, dan target anggaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceSettingsForm workspace={workspace} userRole={role} />
          </CardContent>
        </Card>

        {/* Section 2: Family & Team Collaborators Management (Issue #33) */}
        <WorkspaceMembersCard
          weddingId={workspace.id}
          coupleNames={workspace.coupleNames}
          initialMembers={members}
          currentUserRole={role}
        />

        {/* Section 3: Offline Contingency & CSV Exports (Issue #34) */}
        <WorkspaceExportCard
          weddingId={workspace.id}
          coupleNames={workspace.coupleNames}
        />
      </div>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl animate-pulse space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-64 rounded-xl" />
      <div className="bg-muted h-72 rounded-xl" />
    </div>
  );
}

export default function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent params={params} />
    </Suspense>
  );
}
