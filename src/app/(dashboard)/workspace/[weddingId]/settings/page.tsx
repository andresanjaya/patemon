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

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
      />

      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Pengaturan Pawiwahan</CardTitle>
            <CardDescription>
              Perbarui judul, nama mempelai, bentuk adat perkawinan, wilayah
              dresta, dan target anggaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceSettingsForm workspace={workspace} userRole={role} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-64 rounded-lg" />
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
