import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getWeddingWorkspace,
  getUserWorkspaces,
} from "@/features/workspaces/actions";
import { getWorkspaceEntitlement } from "@/features/payments/entitlements";
import { WorkspaceShell } from "@/features/workspaces/components/workspace-shell";
import {
  normalizeWorkspaceId,
  isValidWorkspaceId,
} from "@/features/workspaces/validation";

interface WorkspaceLayoutProps {
  params: Promise<{ weddingId: string }>;
  children: React.ReactNode;
}

export default async function WorkspaceLayout({
  params,
  children,
}: WorkspaceLayoutProps) {
  const { weddingId } = await params;

  // Sanitize weddingId: trim, decode URI, and replace accidental spaces with hyphens
  const normalizedId = normalizeWorkspaceId(weddingId);

  // Auto-redirect if URL contained space or unnormalized characters
  if (normalizedId !== weddingId) {
    redirect(`/workspace/${normalizedId}`);
  }

  // Reject malformed IDs before querying database to prevent Postgres 22P02 syntax errors
  if (!isValidWorkspaceId(normalizedId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && normalizedId !== "demo") {
    redirect(`/login?redirectTo=/workspace/${normalizedId}`);
  }

  // Fetch workspace, role, user workspaces, and entitlement concurrently in parallel
  const [{ workspace, role }, userWorkspaces, entitlement] = await Promise.all([
    getWeddingWorkspace(normalizedId),
    getUserWorkspaces(),
    getWorkspaceEntitlement(normalizedId, supabase),
  ]);

  if (!workspace || !role) {
    notFound();
  }

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
