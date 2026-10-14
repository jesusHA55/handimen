import { createAdminSupabaseClient } from "@handimen/db";

/**
 * Service-role client — bypasses RLS. SERVER ONLY.
 *
 * Only for operations that legitimately act on behalf of *another* member, which
 * RLS is designed to prevent. Currently that is exactly one thing: the demo
 * seeder, which needs a neighbour to be the requester on a listing the member
 * just created.
 *
 * Never use this for request-scoped reads — those go through `getStores()`, which
 * is RLS-bound. Anything added here should be reviewable as "admin action".
 */
export function getSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — the demo seeder needs it.");
  }

  return createAdminSupabaseClient(serviceRoleKey, {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
