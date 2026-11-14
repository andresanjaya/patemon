import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import { RundownDashboard } from "@/features/rundown/components/rundown-dashboard";
import { getWeddingRundown } from "@/features/rundown/actions";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";

interface RundownPageProps {
  params: Promise<{ weddingId: string }>;
}

async function RundownPageContent({ params }: RundownPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/rundown`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const userWorkspaces = await getUserWorkspaces();
  const ceremonies = await getWeddingCeremonies(weddingId);
  const { events, stats } = await getWeddingRundown(weddingId);

  const ceremonyOptions = ceremonies.map((c) => ({
    id: c.id,
    customTitle: c.title,
  }));

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
      />

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RundownDashboard
          weddingId={workspace.id}
          coupleNames={workspace.coupleNames}
          prospectiveDate={workspace.prospectiveDate}
          ceremonies={ceremonyOptions}
          initialEvents={events}
          initialStats={stats}
        />
      </main>
    </>
  );
}

function RundownPageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-28 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-14 rounded-xl" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function RundownPage({ params }: RundownPageProps) {
  return (
    <Suspense fallback={<RundownPageSkeleton />}>
      <RundownPageContent params={params} />
    </Suspense>
  );
}
