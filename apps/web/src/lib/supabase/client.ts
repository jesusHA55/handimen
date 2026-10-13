import { createBrowserSupabaseClient } from "@handimen/db";

/** Browser Supabase client for client components. */
export function getSupabaseBrowserClient() {
  return createBrowserSupabaseClient({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
