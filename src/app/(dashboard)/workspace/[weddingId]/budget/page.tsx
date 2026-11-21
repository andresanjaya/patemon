import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceUser } from "@/features/workspaces/session";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { BudgetDashboard } from "@/features/budget/components/budget-dashboard";
import { getWeddingBudgetItems } from "@/features/budget/actions";

interface BudgetPageProps {
  params: Promise<{ weddingId: string }>;
}

async function BudgetPageContent({ params }: BudgetPageProps) {
  const { weddingId } = await params;
  const user = await getWorkspaceUser(weddingId);

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/budget`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const budgetItems = await getWeddingBudgetItems(weddingId);

  return (
    <div className="container mx-auto max-w-7xl p-6 lg:p-8">
      <BudgetDashboard
        weddingId={workspace.id}
        targetBudget={workspace.targetBudget}
        initialItems={budgetItems}
        userRole={role}
        workspaceName={workspace.coupleNames}
      />
    </div>
  );
}

function BudgetPageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted h-28 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-20 rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function BudgetPage({ params }: BudgetPageProps) {
  return (
    <Suspense fallback={<BudgetPageSkeleton />}>
      <BudgetPageContent params={params} />
    </Suspense>
  );
}
