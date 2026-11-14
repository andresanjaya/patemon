import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import { CeremonyOnboardingWizard } from "@/features/ceremonies/components/ceremony-onboarding-wizard";
import { getCeremonyTemplates } from "@/features/ceremonies/queries";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";
import { createClient } from "@/lib/supabase/server";

interface OnboardingPageProps {
  params: Promise<{ weddingId: string }>;
}

async function OnboardingContent({ params }: OnboardingPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/onboarding`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const userWorkspaces = await getUserWorkspaces();
  const templates = await getCeremonyTemplates({
    applicability: workspace.marriageForm,
  });
  const existingCeremonies = await getWeddingCeremonies(weddingId);

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
      />

      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/workspace/${workspace.id}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Ringkasan Workspace</span>
          </Link>
        </div>

        <CeremonyOnboardingWizard
          workspace={workspace}
          templates={templates}
          existingCeremonies={existingCeremonies}
        />
      </div>
    </>
  );
}

function OnboardingSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl animate-pulse space-y-6 px-4 py-12">
      <div className="bg-muted h-10 w-48 rounded" />
      <div className="bg-muted h-64 rounded-xl" />
    </div>
  );
}

export default function CeremonyOnboardingPage({
  params,
}: OnboardingPageProps) {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingContent params={params} />
    </Suspense>
  );
}
