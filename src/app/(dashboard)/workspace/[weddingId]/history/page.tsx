import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { getWorkspaceActivityLogsAction } from "@/features/activity-logs/actions";
import { ActivityLogCard } from "@/features/activity-logs/components/activity-log-card";

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
      <div className="mb-2">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          Riwayat Perubahan & Audit Trail
        </h1>
        <p className="text-muted-foreground text-sm">
          Pusat pemantauan integritas data dan riwayat kolaborasi panitia{" "}
          {workspace.coupleNames}.
        </p>
      </div>

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
