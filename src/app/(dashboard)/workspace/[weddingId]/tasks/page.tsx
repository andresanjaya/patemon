import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { TaskDashboard } from "@/features/checklist/components/task-dashboard";
import {
  getWeddingTasks,
  getCeremonyOptions,
} from "@/features/checklist/actions";

interface TasksPageProps {
  params: Promise<{ weddingId: string }>;
}

async function TasksPageContent({ params }: TasksPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/tasks`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const tasks = await getWeddingTasks(weddingId);
  const ceremonyOptions = await getCeremonyOptions(weddingId);

  return (
    <div className="container mx-auto max-w-7xl p-6 lg:p-8">
      <TaskDashboard
        weddingId={workspace.id}
        initialTasks={tasks}
        ceremonyOptions={ceremonyOptions}
        userRole={role}
      />
    </div>
  );
}

function TasksPageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted h-28 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-20 rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function TasksPage({ params }: TasksPageProps) {
  return (
    <Suspense fallback={<TasksPageSkeleton />}>
      <TasksPageContent params={params} />
    </Suspense>
  );
}
