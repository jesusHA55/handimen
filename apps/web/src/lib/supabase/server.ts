import { createServerSupabaseClient } from "@handimen/db";
import { cookies } from "next/headers";

/** Request-scoped Supabase client for server components, actions, and route handlers. */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerSupabaseClient(
    {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where cookies are read-only — safe to ignore.
        }
      },
    },
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  );
}
