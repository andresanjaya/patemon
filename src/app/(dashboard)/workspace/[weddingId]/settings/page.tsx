import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getWeddingWorkspace } from "@/features/workspaces/actions";
import { WorkspaceSettingsForm } from "@/features/workspaces/components/workspace-settings-form";
import { getWorkspaceMembers } from "@/features/members/actions";
import { WorkspaceMembersCard } from "@/features/members/components/workspace-members-card";
import { WorkspaceExportCard } from "@/features/exports/components/workspace-export-card";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import {
  getLatestOrderForWedding,
  getOrderHistoryForWedding,
} from "@/features/payments/orders";
import { LicenseStatusCard } from "@/features/payments/components/license-status-card";
import { getReminderPreferences } from "@/features/reminders/engine";
import { getReminderAuditLogsAction } from "@/features/reminders/actions";
import { ReminderSettingsCard } from "@/features/reminders/components/reminder-settings-card";
import { createClient } from "@/lib/supabase/server";

interface SettingsPageProps {
  params: Promise<{ weddingId: string }>;
}

async function SettingsContent({ params }: SettingsPageProps) {
  const { weddingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && weddingId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${weddingId}/settings`);
  }

  const { workspace, role } = await getWeddingWorkspace(weddingId);

  if (!workspace || !role) {
    notFound();
  }

  const members = await getWorkspaceMembers(weddingId);
  const entitlement = await getWorkspaceEntitlement(weddingId);
  const latestOrder = await getLatestOrderForWedding(weddingId);
  const orderHistory = await getOrderHistoryForWedding(weddingId);
  const reminderPreferences = await getReminderPreferences(weddingId, user?.id);
  const reminderLogs = await getReminderAuditLogsAction(weddingId);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6 lg:p-8">
      {/* Section 1: Wedding Parameters Form */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Pengaturan Pawiwahan</CardTitle>
          <CardDescription className="text-xs">
            Perbarui judul, nama mempelai, bentuk adat perkawinan, wilayah
            dresta, dan target anggaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceSettingsForm workspace={workspace} userRole={role} />
        </CardContent>
      </Card>

      {/* Section 2: Family & Team Collaborators Management (Issue #33) */}
      <WorkspaceMembersCard
        weddingId={workspace.id}
        coupleNames={workspace.coupleNames}
        initialMembers={members}
        currentUserRole={role}
        canInvite={entitlement.canInviteMembers}
      />

      {/* Section 3: Offline Contingency & CSV Exports (Issue #34) */}
      <WorkspaceExportCard
        weddingId={workspace.id}
        coupleNames={workspace.coupleNames}
      />

      {/* Section 4: Automated Deadline & Payment Reminders (Issue #84) */}
      <ReminderSettingsCard
        weddingId={workspace.id}
        preferences={reminderPreferences}
        initialLogs={reminderLogs}
        canEdit={role === "owner" || role === "editor"}
      />

      {/* Section 5: License & Entitlement Status (Issue #35, #36) */}
      <LicenseStatusCard
        entitlement={entitlement}
        weddingId={workspace.id}
        coupleNames={workspace.coupleNames}
        latestOrder={latestOrder}
        orderHistory={orderHistory}
      />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl animate-pulse space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-64 rounded-xl" />
      <div className="bg-muted h-72 rounded-xl" />
    </div>
  );
}

export default function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent params={params} />
    </Suspense>
  );
}
