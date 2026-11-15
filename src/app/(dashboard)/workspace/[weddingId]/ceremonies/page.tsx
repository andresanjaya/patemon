import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { CeremonyOverviewGrid } from "@/features/ceremonies/components/ceremony-overview-grid";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";
import { getCeremonyTemplates } from "@/features/ceremonies/queries";

interface CeremoniesPageProps {
  params: Promise<{ weddingId: string }>;
}

async function CeremoniesContent({ params }: CeremoniesPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/ceremonies`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const ceremonies = await getWeddingCeremonies(weddingId);
  const templates = await getCeremonyTemplates();

  return (
    <div className="container mx-auto max-w-7xl p-6 lg:p-8">
      <CeremonyOverviewGrid
        weddingId={workspace.id}
        initialCeremonies={ceremonies}
        templates={templates}
        userRole={role}
      />
    </div>
  );
}

function CeremoniesSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-40 rounded-2xl" />
      <div className="bg-muted h-10 w-72 rounded-xl" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function CeremoniesPage({ params }: CeremoniesPageProps) {
  return (
    <Suspense fallback={<CeremoniesSkeleton />}>
      <CeremoniesContent params={params} />
    </Suspense>
  );
}
