import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import { VendorDashboard } from "@/features/vendors/components/vendor-dashboard";
import { getWeddingVendors } from "@/features/vendors/actions";

interface VendorsPageProps {
  params: Promise<{ weddingId: string }>;
}

async function VendorsPageContent({ params }: VendorsPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/vendors`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const userWorkspaces = await getUserWorkspaces();
  const { vendors, stats } = await getWeddingVendors(weddingId);

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
      />

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <VendorDashboard
          weddingId={workspace.id}
          initialVendors={vendors}
          initialStats={stats}
        />
      </main>
    </>
  );
}

function VendorsPageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-28 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-16 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-muted h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function VendorsPage({ params }: VendorsPageProps) {
  return (
    <Suspense fallback={<VendorsPageSkeleton />}>
      <VendorsPageContent params={params} />
    </Suspense>
  );
}
