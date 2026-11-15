import { Suspense } from "react";
import Link from "next/link";
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

  const ceremonies = await getWeddingCeremonies(weddingId);
  const templates = await getCeremonyTemplates();
  const bantenItems = await getWeddingBantenItems(weddingId);
  const tasks = await getWeddingTasks(weddingId);
  const budgetItems = await getWeddingBudgetItems(weddingId);
  const { vendors, stats: vendorStats } = await getWeddingVendors(weddingId);
  const { guests, stats: guestStats } = await getWeddingGuests(weddingId);
  const { events: rundownEvents, stats: rundownStats } =
    await getWeddingRundown(weddingId);

  return (
    <div className="mx-auto max-w-[1460px] px-4 pt-6 pb-12 sm:px-6 lg:px-[30px]">
      {/* Topbar Header (Metronic Demo 10) */}
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.5px] text-[#18181b]">
            Ringkasan Pernikahan
          </h1>
          <nav
            className="flex items-center gap-2 text-[11px] text-[#65656f]"
            aria-label="Breadcrumb"
          >
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <span>{workspace.coupleNames}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#18181b]">Ringkasan</span>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            className="workspace-button"
          >
            <Settings className="h-3.5 w-3.5 text-[#65656f]" />
            <span>Pengaturan</span>
          </Link>
        </div>
      </header>

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
