import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceUser } from "@/features/workspaces/session";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { GuestDashboard } from "@/features/guests/components/guest-dashboard";
import { getWeddingGuests } from "@/features/guests/actions";

interface GuestsPageProps {
  params: Promise<{ weddingId: string }>;
}

async function GuestsPageContent({ params }: GuestsPageProps) {
  const { weddingId } = await params;
  const user = await getWorkspaceUser(weddingId);

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/guests`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const { guests, stats } = await getWeddingGuests(weddingId);

  return (
    <div className="container mx-auto max-w-7xl p-6 lg:p-8">
      <GuestDashboard
        weddingId={workspace.id}
        coupleNames={workspace.coupleNames}
        prospectiveDate={workspace.prospectiveDate}
        initialGuests={guests}
        initialStats={stats}
      />
    </div>
  );
}

function GuestsPageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-28 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-14 rounded-xl" />
      <div className="bg-muted h-96 rounded-xl" />
    </div>
  );
}

export default function GuestsPage({ params }: GuestsPageProps) {
  return (
    <Suspense fallback={<GuestsPageSkeleton />}>
      <GuestsPageContent params={params} />
    </Suspense>
  );
}
