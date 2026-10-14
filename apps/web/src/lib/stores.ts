import { CURRENT_USER_ID, getDemoBundle, type ListingOwner } from "@handimen/core";

import { getCurrentUser, type CurrentUser } from "./auth";

export interface AppContext {
  /** Identity all data is keyed to: the real user id, or the demo identity. */
  userId: string;
  /** The Supabase user, or null when browsing signed out. */
  authUser: CurrentUser | null;
  signedIn: boolean;
  email: string | null;
  /** The active identity's profile record (drives the header + trust UI). */
  owner: ListingOwner | null;
  listings: Awaited<ReturnType<typeof getDemoBundle>>["listings"];
  requests: Awaited<ReturnType<typeof getDemoBundle>>["requests"];
  reviews: Awaited<ReturnType<typeof getDemoBundle>>["reviews"];
  messages: Awaited<ReturnType<typeof getDemoBundle>>["messages"];
  social: Awaited<ReturnType<typeof getDemoBundle>>["social"];
}

/**
 * Single entry point for app data.
 *
 * Today it returns the seeded demo layer keyed to the signed-in user. When the
 * Supabase repositories land, only this function changes — pages stay as they are.
 */
export async function getStores(): Promise<AppContext> {
  const authUser = await getCurrentUser();
  const userId = authUser?.id ?? CURRENT_USER_ID;

  const bundle = await getDemoBundle(userId, authUser?.displayName);
  const owner = await bundle.listings.getOwner(userId);

  return {
    ...bundle,
    userId,
    authUser,
    signedIn: authUser !== null,
    email: authUser?.email ?? null,
    owner,
  };
}
