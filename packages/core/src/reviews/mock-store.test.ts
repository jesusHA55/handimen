import { describe, expect, it } from "vitest";

import { MockListingsRepository } from "../listings/mock-repository";
import { SEED_LISTINGS, SEED_OWNERS } from "../listings/seed";
import { MockRequestsStore } from "../requests/mock-store";
import { MockReviewsStore } from "./mock-store";

function fresh() {
  const listings = new MockListingsRepository(SEED_LISTINGS, SEED_OWNERS);
  const requests = new MockRequestsStore(listings);
  const reviews = new MockReviewsStore(listings, requests, []);
  return { listings, requests, reviews };
}

async function completedBorrow() {
  const ctx = fresh();
  const request = await ctx.requests.create({
    listingId: "listing_taladro",
    requesterId: "profile_you",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86_400_000).toISOString(),
  });
  await ctx.requests.approve(request.id);
  await ctx.requests.activate(request.id);
  await ctx.requests.markReturned(request.id);
  return { ...ctx, request };
}

describe("MockReviewsStore", () => {
  it("refuses a review before the borrow is returned", async () => {
    const { requests, reviews } = fresh();
    const request = await requests.create({
      listingId: "listing_taladro",
      requesterId: "profile_you",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86_400_000).toISOString(),
    });

    await expect(
      reviews.create({ requestId: request.id, reviewerId: "profile_you", rating: 5 }),
    ).rejects.toThrow(/completed borrow/i);
  });

  it("creates a review and folds it into the reviewee's rating", async () => {
    const { reviews, listings, request } = await completedBorrow();
    const before = await listings.getOwner("profile_marta");

    const review = await reviews.create({
      requestId: request.id,
      reviewerId: "profile_you",
      rating: 2,
      comment: "  Todo genial  ",
    });

    expect(review.revieweeId).toBe("profile_marta");
    expect(review.comment).toBe("Todo genial");

    const after = await listings.getOwner("profile_marta");
    expect(after?.reviewCount).toBe((before?.reviewCount ?? 0) + 1);
    expect(after?.rating).toBeLessThan(before?.rating ?? 5);
  });

  it("blocks a second review from the same reviewer", async () => {
    const { reviews, request } = await completedBorrow();
    await reviews.create({ requestId: request.id, reviewerId: "profile_you", rating: 5 });
    await expect(
      reviews.create({ requestId: request.id, reviewerId: "profile_you", rating: 3 }),
    ).rejects.toThrow(/already reviewed/i);
  });

  it("blocks reviewers who are not part of the borrow", async () => {
    const { reviews, request } = await completedBorrow();
    await expect(
      reviews.create({ requestId: request.id, reviewerId: "profile_nuria", rating: 5 }),
    ).rejects.toThrow(/two parties/i);
  });

  it("counts a handoff for both sides when the item is returned", async () => {
    const { listings } = await completedBorrow();
    expect((await listings.getOwner("profile_you"))?.completedHandoffs).toBe(1);
    expect((await listings.getOwner("profile_marta"))?.completedHandoffs).toBe(42);
  });
});
