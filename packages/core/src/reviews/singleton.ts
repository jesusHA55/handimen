import type { ListingsRepository } from "../listings/mock-repository";
import type { MockRequestsStore } from "../requests/mock-store";

import { MockReviewsStore } from "./mock-store";

const globalReviews = globalThis as unknown as { __handimenReviews?: MockReviewsStore };

export function getReviewsStore(
  listings: ListingsRepository,
  requests: MockRequestsStore,
): MockReviewsStore {
  globalReviews.__handimenReviews ??= new MockReviewsStore(listings, requests);
  return globalReviews.__handimenReviews;
}
