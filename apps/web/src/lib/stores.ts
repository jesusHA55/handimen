import type { ListingOwner } from "@handimen/core";
import { createSupabaseStores, type SupabaseStores } from "@handimen/db/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@handimen/db";

import { getCurrentUser, type CurrentUser } from "./auth";
import { getSupabaseServerClient } from "./supabase/server";

export interface AppContext extends SupabaseStores {
  /** Raw RLS-bound client, for the occasional query a repository doesn't cover. */
  client: SupabaseClient<Database>;
  /** The signed-in member, or null when browsing signed out. */
  userId: string | null;
  authUser: CurrentUser | null;
  signedIn: boolean;
  email: string | null;
  /** The signed-in member's profile row, when there is one. */
  owner: ListingOwner | null;
}

/**
 * Single entry point for app data.
 *
 * Repositories are Supabase-backed and RLS-bound: the database — not the app —
 * decides what the current member can read and write. Signed-out visitors can
 * still browse (active listings and public profiles are publicly readable).
 */
export async function getStores(): Promise<AppContext> {
  const client = await getSupabaseServerClient();
  const authUser = await getCurrentUser();

  const userId = authUser?.id ?? null;
  const stores = createSupabaseStores(client, userId);
  const owner = userId ? await stores.listings.getOwner(userId) : null;

  return {
    ...stores,
    client,
    userId,
    authUser,
    signedIn: authUser !== null,
    email: authUser?.email ?? null,
    owner,
  };
}
