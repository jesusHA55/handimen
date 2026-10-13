export interface Review {
  id: string;
  /** The completed borrow this review is attached to. */
  requestId: string;
  reviewerId: string;
  revieweeId: string;
  /** 1–5 stars. */
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CreateReviewInput {
  requestId: string;
  reviewerId: string;
  rating: number;
  comment?: string | null;
}
