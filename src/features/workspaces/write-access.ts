import "server-only";
import type { createClient } from "@/lib/supabase/server";

export async function hasWorkspaceWriteAccess(
  client: Awaited<ReturnType<typeof createClient>>,
  weddingId: string,
  userId: string
): Promise<boolean> {
  const { data: member, error } = await client
    .from("wedding_members")
    .select("role, status")
    .eq("wedding_id", weddingId)
    .eq("user_id", userId)
    .maybeSingle();
  return (
    !error &&
    member?.status === "active" &&
    (member.role === "owner" || member.role === "editor")
  );
}
