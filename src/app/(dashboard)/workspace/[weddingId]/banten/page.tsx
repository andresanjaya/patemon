import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import { BantenPlannerDashboard } from "@/features/banten/components/banten-planner-dashboard";
import { getWeddingBantenItems } from "@/features/banten/actions";
import { getRitualCatalog } from "@/features/banten/queries";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";

interface BantenPageProps {
  params: Promise<{ weddingId: string }>;
}

async function BantenPageContent({ params }: BantenPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/banten`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const userWorkspaces = await getUserWorkspaces();
  const bantenItems = await getWeddingBantenItems(weddingId);
  const catalog = await getRitualCatalog();
  const ceremonies = await getWeddingCeremonies(weddingId);

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
      />

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BantenPlannerDashboard
          weddingId={workspace.id}
          initialItems={bantenItems}
          catalog={catalog}
          ceremonies={ceremonies}
          userRole={role}
        />
      </main>
    </>
  );
}

function BantenPageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-44 rounded-2xl" />
      <div className="bg-muted h-16 rounded-2xl" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted h-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function BantenPage({ params }: BantenPageProps) {
  return (
    <Suspense fallback={<BantenPageSkeleton />}>
      <BantenPageContent params={params} />
    </Suspense>
  );
}
