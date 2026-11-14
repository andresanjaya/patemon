import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Sparkles,
  Settings,
  Calendar,
  MapPin,
  Heart,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { WorkspaceHeader } from "@/features/workspaces/components/workspace-header";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";
import { getCeremonyTemplates } from "@/features/ceremonies/queries";
import { getWeddingBantenItems } from "@/features/banten/actions";
import { getWeddingTasks } from "@/features/checklist/actions";
import { getWeddingBudgetItems } from "@/features/budget/actions";
import { getWeddingVendors } from "@/features/vendors/actions";
import { getWeddingGuests } from "@/features/guests/actions";
import { getWeddingRundown } from "@/features/rundown/actions";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import { OverviewDashboard } from "@/features/overview/components/overview-dashboard";
import { formatMarriageForm } from "@/features/workspaces/validation";
import { createClient } from "@/lib/supabase/server";

interface WorkspacePageProps {
  params: Promise<{ weddingId: string }>;
}

async function WorkspaceContent({ params }: WorkspacePageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const userWorkspaces = await getUserWorkspaces();
  const ceremonies = await getWeddingCeremonies(weddingId);
  const templates = await getCeremonyTemplates();
  const bantenItems = await getWeddingBantenItems(weddingId);
  const tasks = await getWeddingTasks(weddingId);
  const budgetItems = await getWeddingBudgetItems(weddingId);
  const { vendors, stats: vendorStats } = await getWeddingVendors(weddingId);
  const { guests, stats: guestStats } = await getWeddingGuests(weddingId);
  const { events: rundownEvents, stats: rundownStats } =
    await getWeddingRundown(weddingId);
  const entitlement = await getWorkspaceEntitlement(weddingId);

  return (
    <>
      <WorkspaceHeader
        workspace={workspace}
        userRole={role}
        userWorkspaces={userWorkspaces}
        entitlement={entitlement}
      />

      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Workspace Hero Banner */}
        <div className="border-border/60 from-primary/5 to-primary/10 rounded-2xl border bg-gradient-to-r via-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {formatMarriageForm(workspace.marriageForm)}
                </Badge>
                {workspace.locationRegion && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="mr-1 h-3 w-3" />
                    {workspace.locationRegion}
                  </Badge>
                )}
                {workspace.id === "demo" && (
                  <Badge className="bg-amber-500 text-xs text-white hover:bg-amber-600">
                    Mode Demo Pratinjau
                  </Badge>
                )}
              </div>

              <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                {workspace.coupleNames}
              </h1>

              {(workspace.groomName || workspace.brideName) && (
                <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Heart className="text-primary h-4 w-4" />
                  <span>
                    {workspace.groomName || "Mempelai Pria"} &{" "}
                    {workspace.brideName || "Mempelai Wanita"}
                  </span>
                </p>
              )}

              <p className="text-muted-foreground text-xs">
                {workspace.prospectiveDate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Rencana Hari Baik:{" "}
                    {new Date(workspace.prospectiveDate).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </span>
                ) : (
                  <span>Jadwal Dewasa Ayu belum ditentukan</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-start">
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/workspace/${workspace.id}/settings`}>
                  <Settings className="h-4 w-4" />
                  <span>Pengaturan</span>
                </Link>
              </Button>
              <Button size="sm" className="gap-1.5" asChild>
                <Link href={`/workspace/${workspace.id}/onboarding`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {ceremonies.length > 0
                      ? "Edit Rencana Adat"
                      : "Panduan Onboarding"}
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Dashboard & Readiness Calculations */}
        <OverviewDashboard
          workspace={workspace}
          userRole={role}
          ceremonies={ceremonies}
          templates={templates}
          bantenItems={bantenItems}
          tasks={tasks}
          budgetItems={budgetItems}
          vendors={vendors}
          vendorStats={vendorStats}
          guests={guests}
          guestStats={guestStats}
          rundownEvents={rundownEvents}
          rundownStats={rundownStats}
        />

        {/* Notes & Special Reminders */}
        {workspace.notes && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-primary h-4 w-4" />
                <CardTitle className="text-base">
                  Catatan Khusus Pawiwahan
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {workspace.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-12">
      <div className="bg-muted h-40 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-muted h-48 rounded-xl" />
        <div className="bg-muted h-48 rounded-xl" />
      </div>
      <div className="bg-muted h-64 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-muted h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <WorkspaceContent params={params} />
    </Suspense>
  );
}
