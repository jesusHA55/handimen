import type { PaymentIntentStatus } from "../payments/types";

export type RequestStatus =
  | "pending"
  | "approved"
  | "active"
  | "returned"
  | "declined"
  | "cancelled";

export interface RentalRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  requesterId: string;
  ownerId: string;
  status: RequestStatus;
  message: string | null;
  startDate: string;
  endDate: string;
  /** Null for free borrows. */
  agreedPriceCents: number | null;
  agreedDepositCents: number | null;
  /** Mock payment intent id (Stripe later) — null for free borrows. */
  paymentIntentId: string | null;
  paymentStatus: PaymentIntentStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestInput {
  listingId: string;
  requesterId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

export interface RequestFilter {
  requesterId?: string;
  ownerId?: string;
  listingId?: string;
}
