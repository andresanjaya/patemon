import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import { WorkspaceShell } from "@/features/workspaces/components/workspace-shell";

interface WorkspaceLayoutProps {
  params: Promise<{ weddingId: string }>;
  children: React.ReactNode;
}

export default async function WorkspaceLayout({
  params,
  children,
}: WorkspaceLayoutProps) {
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

  const [userWorkspaces, entitlement] = await Promise.all([
    getUserWorkspaces(),
    getWorkspaceEntitlement(weddingId),
  ]);

  return (
    <WorkspaceShell
      workspace={workspace}
      userRole={role}
      userWorkspaces={userWorkspaces}
      entitlement={entitlement}
      user={user}
    >
      {children}
    </WorkspaceShell>
  );
}
