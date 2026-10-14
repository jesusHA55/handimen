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

/** Both the in-memory demo store and the Supabase implementation satisfy this. */
export interface RequestsStore {
  list(filter?: RequestFilter): Promise<RentalRequest[]>;
  get(id: string): Promise<RentalRequest | null>;
  create(input: CreateRequestInput): Promise<RentalRequest>;
  approve(id: string): Promise<RentalRequest>;
  decline(id: string): Promise<RentalRequest>;
  activate(id: string): Promise<RentalRequest>;
  markReturned(id: string): Promise<RentalRequest>;
  cancel(id: string): Promise<RentalRequest>;
}
