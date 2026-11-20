import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { getWorkspaceActivityLogsAction } from "@/features/activity-logs/actions";
import { ActivityLogCard } from "@/features/activity-logs/components/activity-log-card";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";

interface HistoryPageProps {
  params: Promise<{ weddingId: string }>;
}

async function HistoryContent({ params }: HistoryPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/history`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);
  if (!workspace || !role) {
    notFound();
  }

  const initialLogs = (await getWorkspaceActivityLogsAction(weddingId)).data;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6 lg:p-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Riwayat Perubahan & Audit Trail"
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspace.coupleNames,
          workspace.id,
          "Riwayat"
        )}
      />

      <ActivityLogCard weddingId={workspace.id} initialData={initialLogs} />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="container mx-auto max-w-4xl animate-pulse space-y-6 p-6 lg:p-8">
      <div className="bg-muted h-10 w-48 rounded-md" />
      <div className="bg-muted h-96 rounded-xl" />
    </div>
  );
}

export default function WorkspaceHistoryPage({ params }: HistoryPageProps) {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryContent params={params} />
    </Suspense>
  );
}
