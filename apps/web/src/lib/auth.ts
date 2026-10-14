import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustTier: 0 | 1 | 2;
}

/**
 * Resolves the signed-in Supabase user from the request cookies.
 *
 * Returns null when signed out (and on any auth/network error) so callers can
 * fall back to the demo identity instead of crashing the page.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    const user = data.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email_verified, phone_verified, id_verified")
      .eq("id", user.id)
      .maybeSingle();

    const trustTier: 0 | 1 | 2 = profile?.id_verified
      ? 2
      : profile?.phone_verified
        ? 1
        : 0;

    return {
      id: user.id,
      email: user.email ?? null,
      displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Neighbour",
      emailVerified: profile?.email_verified ?? Boolean(user.email_confirmed_at),
      phoneVerified: profile?.phone_verified ?? false,
      trustTier,
    };
  } catch {
    return null;
  }
}
