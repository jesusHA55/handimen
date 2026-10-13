import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/** Minimal cookie adapter so this package stays framework-agnostic (web now, RN later). */
export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options?: Record<string, unknown> }[]): void;
}

function assertConfig(config: Partial<SupabaseConfig>): SupabaseConfig {
  if (!config.url || !config.anonKey) {
    throw new Error(
      "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return { url: config.url, anonKey: config.anonKey };
}

/** For client components (browser). */
export function createBrowserSupabaseClient(config: Partial<SupabaseConfig> = {}) {
  const { url, anonKey } = assertConfig(config);
  return createBrowserClient<Database>(url, anonKey);
}

/** For server components / route handlers, with the request's cookie store. */
export function createServerSupabaseClient(
  cookies: CookieAdapter,
  config: Partial<SupabaseConfig> = {},
) {
  const { url, anonKey } = assertConfig(config);
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet) => cookies.setAll(cookiesToSet),
    },
  });
}

/**
 * Service-role client. SERVER ONLY — bypasses RLS.
 * Never import this into client components.
 */
export function createAdminSupabaseClient(serviceRoleKey: string, config: Partial<SupabaseConfig> = {}) {
  const { url } = assertConfig(config);
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type { Database } from "./database.types";
