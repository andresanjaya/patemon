import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { CeremonyOnboardingWizard } from "@/features/ceremonies/components/ceremony-onboarding-wizard";
import { getCeremonyTemplates } from "@/features/ceremonies/queries";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";
import { createClient } from "@/lib/supabase/server";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import { Button } from "@/components/ui/button";

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

  const templates = await getCeremonyTemplates({
    applicability: workspace.marriageForm,
  });
  const existingCeremonies = await getWeddingCeremonies(weddingId);

  return (
    <div className="container mx-auto max-w-4xl p-6 lg:p-8">
      {/* Standard Dashboard Page Header (Issue #115) */}
      <DashboardPageHeader
        title="Panduan Onboarding Upacara"
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspace.coupleNames,
          workspace.id,
          "Panduan Onboarding"
        )}
        actions={
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/workspace/${workspace.id}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Ringkasan</span>
            </Link>
          </Button>
        }
      />

      <CeremonyOnboardingWizard
        workspace={workspace}
        templates={templates}
        existingCeremonies={existingCeremonies}
      />
    </div>
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
