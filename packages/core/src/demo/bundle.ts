import { MockListingsRepository } from "../listings/mock-repository";
import { CURRENT_USER_ID, SEED_LISTINGS, SEED_OWNERS } from "../listings/seed";
import type { Listing, ListingOwner } from "../listings/types";
import { MockMessagesStore } from "../messages/mock-store";
import { SEED_THREADS, type SeedThread } from "../messages/seed";
import { MockRequestsStore } from "../requests/mock-store";
import { MockReviewsStore } from "../reviews/mock-store";
import { MockSocialRepository } from "../social/mock-repository";
import { SEED_POSTS } from "../social/seed";

export interface DemoBundle {
  userId: string;
  listings: MockListingsRepository;
  requests: MockRequestsStore;
  reviews: MockReviewsStore;
  messages: MockMessagesStore;
  social: MockSocialRepository;
}

/**
 * Builds a seeded demo dataset for one identity.
 *
 * The seed content is authored around `CURRENT_USER_ID` ("profile_you"); when a
 * real Supabase user is signed in we remap that placeholder to their id, so the
 * seeded listings, threads and request become theirs.
 *
 * This is the seam for the Supabase migration: `getStores()` in the web app can
 * return Supabase-backed repositories instead without touching any page.
 */
export async function createDemoBundle(
  userId: string,
  displayName?: string,
): Promise<DemoBundle> {
  const remap = (id: string): string => (id === CURRENT_USER_ID ? userId : id);

  const owners: ListingOwner[] = SEED_OWNERS.map((owner) =>
    owner.id === CURRENT_USER_ID
      ? { ...owner, id: userId, displayName: displayName?.trim() || owner.displayName }
      : owner,
  );

  const listings: Listing[] = SEED_LISTINGS.map((listing) => ({
    ...listing,
    ownerId: remap(listing.ownerId),
  }));

  const listingsRepo = new MockListingsRepository(listings, owners);
  const requests = new MockRequestsStore(listingsRepo);
  const reviews = new MockReviewsStore(listingsRepo, requests);
  const messages = new MockMessagesStore(seedThreads(userId));
  const social = new MockSocialRepository(
    SEED_POSTS.map((post) => ({ ...post, authorId: remap(post.authorId) })),
  );

  // A pending incoming request on the user's own listing, so the escrow
  // lifecycle (approve → capture → return → release) is demoable.
  const start = new Date(Date.now() + 86_400_000);
  const end = new Date(Date.now() + 4 * 86_400_000);
  await requests.create({
    listingId: "listing_taladro_you",
    requesterId: "profile_marta",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    message: "¡Hola! ¿Lo tendrías libre este finde? Es para montar una estantería.",
  });

  return { userId, listings: listingsRepo, requests, reviews, messages, social };
}

function seedThreads(userId: string): SeedThread[] {
  const remap = (id: string): string => (id === CURRENT_USER_ID ? userId : id);
  return SEED_THREADS.map((entry) => ({
    ...entry,
    thread: {
      ...entry.thread,
      participantA: remap(entry.thread.participantA),
      participantB: remap(entry.thread.participantB),
    },
  }));
}

const globalBundles = globalThis as unknown as {
  __handimenBundles?: Map<string, Promise<DemoBundle>>;
};

/** Cached per identity, so signing in/out switches the dataset cleanly. */
export function getDemoBundle(userId: string, displayName?: string): Promise<DemoBundle> {
  globalBundles.__handimenBundles ??= new Map();
  const key = `${userId}::${displayName ?? ""}`;
  const existing = globalBundles.__handimenBundles.get(key);
  if (existing) return existing;

  const created = createDemoBundle(userId, displayName);
  globalBundles.__handimenBundles.set(key, created);
  return created;
}
