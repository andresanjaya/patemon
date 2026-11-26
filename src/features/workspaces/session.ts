import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Share verified auth only within a React server render, never across requests.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getWorkspaceUser(weddingId: string) {
  if (weddingId === "demo") return null;
  return getCurrentUser();
}
