import { getListingsRepository } from "../listings/mock-repository";
import { MockRequestsStore } from "./mock-store";

interface RequestBundle {
  store: MockRequestsStore;
  ready: Promise<void>;
}

const globalStore = globalThis as unknown as { __handimenRequests?: RequestBundle };

/**
 * Seeds one incoming request on the demo user's own listing so the full escrow
 * lifecycle (approve → capture → return → release) can be exercised in the UI.
 */
async function seedDemoRequest(store: MockRequestsStore): Promise<void> {
  const existing = await store.list();
  if (existing.length > 0) return;

  const start = new Date(Date.now() + 86_400_000);
  const end = new Date(Date.now() + 4 * 86_400_000);

  await store.create({
    listingId: "listing_taladro_you",
    requesterId: "profile_marta",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    message: "¡Hola! ¿Lo tendrías libre este finde? Es para montar una estantería.",
  });
}

function createBundle(): RequestBundle {
  const store = new MockRequestsStore(getListingsRepository());
  return { store, ready: seedDemoRequest(store) };
}

export function getRequestsStore(): MockRequestsStore {
  globalStore.__handimenRequests ??= createBundle();
  return globalStore.__handimenRequests.store;
}

/** Same store, but guaranteed to have finished seeding the demo request. */
export async function getRequestsStoreReady(): Promise<MockRequestsStore> {
  globalStore.__handimenRequests ??= createBundle();
  await globalStore.__handimenRequests.ready;
  return globalStore.__handimenRequests.store;
}
