import { createClient } from "@/lib/supabase/server";

export async function getWorkspaceUser(weddingId: string) {
  if (weddingId === "demo") return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
