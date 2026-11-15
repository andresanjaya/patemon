import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { CeremonyDetailHeader } from "@/features/ceremonies/components/ceremony-detail-header";
import { CeremonyRundownManager } from "@/features/ceremonies/components/ceremony-rundown-manager";
import { CeremonyBantenManager } from "@/features/ceremonies/components/ceremony-banten-manager";
import { getCeremonyById } from "@/features/ceremonies/actions";

interface CeremonyDetailPageProps {
  params: Promise<{ weddingId: string; ceremonyId: string }>;
}

async function CeremonyDetailContent({ params }: CeremonyDetailPageProps) {
  const { weddingId, ceremonyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(
      `/login?redirectTo=/workspace/${weddingId}/ceremonies/${ceremonyId}`
    );
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const ceremony = await getCeremonyById(weddingId, ceremonyId);

  if (!ceremony) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      {/* Main Ceremony Header & Metadata */}
      <CeremonyDetailHeader
        weddingId={workspace.id}
        ceremony={ceremony}
        userRole={role}
      />

      {/* 2-column or stacked grid for Rundown & Banten management */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Section 1: Rundown Jam-demi-Jam */}
        <CeremonyRundownManager
          weddingId={workspace.id}
          ceremonyId={ceremony.id}
          initialEvents={ceremony.rundownEvents}
          userRole={role}
          scheduledDate={ceremony.scheduledDate}
        />

        {/* Section 2: Kebutuhan Banten & Sarana */}
        <CeremonyBantenManager
          weddingId={workspace.id}
          ceremonyId={ceremony.id}
          initialItems={ceremony.ritualItems}
          userRole={role}
        />
      </div>
    </div>
  );
}

function CeremonyDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-8 w-48 rounded-lg" />
      <div className="bg-muted h-64 rounded-2xl" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-muted h-96 rounded-2xl" />
        <div className="bg-muted h-96 rounded-2xl" />
      </div>
    </div>
  );
}

export default function CeremonyDetailPage({
  params,
}: CeremonyDetailPageProps) {
  return (
    <Suspense fallback={<CeremonyDetailSkeleton />}>
      <CeremonyDetailContent params={params} />
    </Suspense>
  );
}
