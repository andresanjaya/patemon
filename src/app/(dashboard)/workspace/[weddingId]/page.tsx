import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { notFound, redirect } from "next/navigation";
import { Settings, Calendar, FileText } from "lucide-react";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { getWeddingCeremonies } from "@/features/ceremonies/actions";
import { getCeremonyTemplates } from "@/features/ceremonies/queries";
import { getWeddingBantenItems } from "@/features/banten/actions";
import { getWeddingTasks } from "@/features/checklist/actions";
import { getWeddingBudgetItems } from "@/features/budget/actions";
import { getWeddingVendors } from "@/features/vendors/actions";
import { getWeddingGuests } from "@/features/guests/actions";
import { getWeddingRundown } from "@/features/rundown/actions";
import { OverviewDashboard } from "@/features/overview/components/overview-dashboard";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import { PreviewBadge } from "@/features/preview/preview-badge";
import {
  DashboardPageHeader,
  createWorkspaceBreadcrumbs,
} from "@/features/workspaces/components/dashboard-page-header";
import { normalizeWorkspaceId } from "@/features/workspaces/validation";
import { createClient } from "@/lib/supabase/server";
import { MasterDataReference } from "@/features/preview/master-data-reference";

interface WorkspacePageProps {
  params: Promise<{ weddingId: string }>;
}

async function WorkspaceContent({ params }: WorkspacePageProps) {
  const { weddingId } = await params;
  const normalizedId = normalizeWorkspaceId(weddingId);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && normalizedId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${normalizedId}`);
  }

  // Fetch workspace, ceremonies, templates, and all operational modules concurrently in parallel
  const [
    { workspace, role },
    ceremonies,
    templates,
    bantenItems,
    tasks,
    budgetItems,
    vendorsData,
    guestsData,
    rundownData,
    entitlement,
  ] = await Promise.all([
    getWeddingWorkspace(normalizedId),
    getWeddingCeremonies(normalizedId),
    getCeremonyTemplates(),
    getWeddingBantenItems(normalizedId),
    getWeddingTasks(normalizedId),
    getWeddingBudgetItems(normalizedId),
    getWeddingVendors(normalizedId),
    getWeddingGuests(normalizedId),
    getWeddingRundown(normalizedId),
    getWorkspaceEntitlement(normalizedId, supabase),
  ]);

  if (!workspace || !role) {
    notFound();
  }

  const { vendors, stats: vendorStats } = vendorsData;
  const { guests, stats: guestStats } = guestsData;
  const { events: rundownEvents, stats: rundownStats } = rundownData;
  const isPreview = !entitlement.isPaid || normalizedId === "demo";

  return (
    <div className="mx-auto max-w-[1460px] px-4 pt-6 pb-12 sm:px-6 lg:px-[30px]">
      {/* Topbar Header (Metronic Demo 10 - Issue #115) */}
      <DashboardPageHeader
        title="Ringkasan Pernikahan"
        badge={isPreview ? <PreviewBadge /> : undefined}
        breadcrumbs={createWorkspaceBreadcrumbs(
          workspace.coupleNames,
          workspace.id,
          "Ringkasan"
        )}
        actions={
          <>
            <span className="inline-flex min-h-[36px] items-center gap-2 rounded-[6px] border border-[#e9e9ed] bg-white px-3.5 text-[11px] font-semibold text-[#18181b]">
              <Calendar className="h-3.5 w-3.5 text-[#65656f]" />
              {workspace.prospectiveDate
                ? new Date(workspace.prospectiveDate).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "Dewasa Ayu Belum Ditentukan"}
            </span>

            <Link
              href={`/workspace/${workspace.id}/settings`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Settings className="h-3.5 w-3.5 text-[#65656f]" />
              <span>Pengaturan</span>
            </Link>
          </>
        }
      />

      {/* Overview Dashboard & Readiness Calculations (2:1 Column Grid) */}
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
        currentUserId={user?.id || (weddingId === "demo" ? "demo-u1" : null)}
      />

      {normalizedId === "demo" && <MasterDataReference />}

      {/* Notes & Special Reminders */}
      {workspace.notes && (
        <div className="workspace-card mt-8">
          <div className="workspace-card-header">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[hsl(32_90%_36%)]" />
              <h2 className="text-sm font-semibold text-[#18181b]">
                Catatan Khusus Pawiwahan
              </h2>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs whitespace-pre-wrap text-[#65656f]">
              {workspace.notes}
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Footer (Metronic Demo 10) */}
      <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-[#e9e9ed] pt-6 text-[10px] text-[#65656f] sm:flex-row sm:items-center">
        <span>Patemon · Ruang persiapan bersama keluarga</span>
        <span>Sistem Perencanaan Upacara Pawiwahan Bali</span>
      </footer>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="mx-auto max-w-[1460px] animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-[30px]">
      <div className="h-10 w-48 rounded bg-[#e9e9ed]" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-80 rounded-xl bg-[#e9e9ed] lg:col-span-2" />
        <div className="h-80 rounded-xl bg-[#e9e9ed] lg:col-span-1" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-[#e9e9ed] lg:col-span-2" />
        <div className="h-64 rounded-xl bg-[#e9e9ed] lg:col-span-1" />
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
