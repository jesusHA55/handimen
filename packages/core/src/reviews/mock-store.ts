import type { ListingsRepository } from "../listings/types";
import type { MockRequestsStore } from "../requests/mock-store";

import { SEED_REVIEWS } from "./seed";
import type { CreateReviewInput, Review, ReviewsRepository } from "./types";

/**
 * Two-way reviews, gated on a completed (returned) borrow — the same rule the
 * Postgres RLS policy enforces server-side.
 */
export class MockReviewsStore implements ReviewsRepository {
  private readonly reviews = new Map<string, Review>();

  constructor(
    private readonly listings: ListingsRepository,
    private readonly requests: MockRequestsStore,
    seed: Review[] = SEED_REVIEWS,
  ) {
    for (const review of seed) this.reviews.set(review.id, review);
  }

  async listForUser(userId: string): Promise<Review[]> {
    return [...this.reviews.values()]
      .filter((review) => review.revieweeId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listForRequest(requestId: string): Promise<Review[]> {
    return [...this.reviews.values()].filter((review) => review.requestId === requestId);
  }

  async hasReviewed(requestId: string, reviewerId: string): Promise<boolean> {
    return [...this.reviews.values()].some(
      (review) => review.requestId === requestId && review.reviewerId === reviewerId,
    );
  }

  async create(input: CreateReviewInput): Promise<Review> {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    const request = await this.requests.get(input.requestId);
    if (!request) throw new Error(`Request not found: ${input.requestId}`);
    if (request.status !== "returned") {
      throw new Error("You can only review a completed borrow.");
    }

    const isParticipant =
      input.reviewerId === request.requesterId || input.reviewerId === request.ownerId;
    if (!isParticipant) throw new Error("Only the two parties can review this borrow.");

    if (await this.hasReviewed(input.requestId, input.reviewerId)) {
      throw new Error("You have already reviewed this borrow.");
    }

    const revieweeId =
      input.reviewerId === request.requesterId ? request.ownerId : request.requesterId;

    const review: Review = {
      id: `review_${crypto.randomUUID()}`,
      requestId: input.requestId,
      reviewerId: input.reviewerId,
      revieweeId,
      rating: input.rating,
      comment: input.comment?.trim() ? input.comment.trim() : null,
      createdAt: new Date().toISOString(),
    };

    this.reviews.set(review.id, review);
    await this.listings.addReview(revieweeId, review.rating);
    return review;
  }
}
