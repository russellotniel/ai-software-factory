import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Generic auth context — /foundation:init replaces this file with
 * either the multi-tenant or single-tenant variant based on project config.
 */

export type AuthContext = {
  user: { id: string; email: string };
  role: string;
};

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return {
    user: { id: user.id, email: user.email! },
    role: "user",
  };
}
