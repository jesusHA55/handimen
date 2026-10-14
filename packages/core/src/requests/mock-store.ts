import { createMockPaymentsProvider } from "../payments/mock-provider";
import type { PaymentsProvider } from "../payments/types";
import type { ListingsRepository } from "../listings/types";

import type { CreateRequestInput, RentalRequest, RequestFilter, RequestStatus } from "./types";

/**
 * In-memory requests store that drives the mock escrow lifecycle.
 *
 * Flow: create (authorize) → approve → active (capture) → returned (release),
 * or declined/cancelled (cancel). All payment movement is simulated by
 * MockPaymentsProvider — no real money, but the states are real.
 */
export class MockRequestsStore {
  private readonly requests = new Map<string, RentalRequest>();

  constructor(
    private readonly listings: ListingsRepository,
    private readonly payments: PaymentsProvider = createMockPaymentsProvider(),
  ) {}

  async list(filter: RequestFilter = {}): Promise<RentalRequest[]> {
    return [...this.requests.values()]
      .filter((request) => {
        if (filter.requesterId && request.requesterId !== filter.requesterId) return false;
        if (filter.ownerId && request.ownerId !== filter.ownerId) return false;
        if (filter.listingId && request.listingId !== filter.listingId) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<RentalRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async create(input: CreateRequestInput): Promise<RentalRequest> {
    const listing = await this.listings.get(input.listingId);
    if (!listing) throw new Error(`Listing not found: ${input.listingId}`);
    if (listing.ownerId === input.requesterId) {
      throw new Error("You cannot request your own listing.");
    }

    const now = new Date().toISOString();
    const id = `request_${crypto.randomUUID()}`;
    const isPaid = listing.terms === "rent";
    const priceCents = isPaid ? (listing.priceCents ?? 0) : null;
    const depositCents = isPaid ? (listing.depositCents ?? 0) : null;

    let paymentIntentId: string | null = null;
    let paymentStatus: RentalRequest["paymentStatus"] = null;

    if (isPaid && ((priceCents ?? 0) > 0 || (depositCents ?? 0) > 0)) {
      const intent = await this.payments.createIntent({
        requestId: id,
        amount: { amount: priceCents ?? 0, currency: "EUR" },
        deposit: { amount: depositCents ?? 0, currency: "EUR" },
        metadata: { listingId: listing.id },
      });
      const authorized = await this.payments.authorize(intent.id);
      paymentIntentId = authorized.id;
      paymentStatus = authorized.status;
    }

    const request: RentalRequest = {
      id,
      listingId: listing.id,
      listingTitle: listing.title,
      requesterId: input.requesterId,
      ownerId: listing.ownerId,
      status: "pending",
      message: input.message ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      agreedPriceCents: priceCents,
      agreedDepositCents: depositCents,
      paymentIntentId,
      paymentStatus,
      createdAt: now,
      updatedAt: now,
    };

    this.requests.set(id, request);
    return request;
  }

  private async transition(id: string, status: RequestStatus, payment?: "capture" | "release" | "cancel") {
    const current = this.requests.get(id);
    if (!current) throw new Error(`Request not found: ${id}`);

    let paymentStatus = current.paymentStatus;
    if (payment && current.paymentIntentId) {
      try {
        const intent =
          payment === "capture"
            ? await this.payments.capture(current.paymentIntentId)
            : payment === "release"
              ? await this.payments.release(current.paymentIntentId)
              : await this.payments.cancel(current.paymentIntentId);
        paymentStatus = intent.status;
      } catch {
        // Illegal transition for the current state — keep the mock resilient.
      }
    }

    const next: RentalRequest = {
      ...current,
      status,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };
    this.requests.set(id, next);
    return next;
  }

  approve(id: string) {
    return this.transition(id, "approved");
  }

  decline(id: string) {
    return this.transition(id, "declined", "cancel");
  }

  /** Hand-off: the borrower picks the item up. */
  activate(id: string) {
    return this.transition(id, "active", "capture");
  }

  /** Return: funds are released to the lender. */
  async markReturned(id: string) {
    const returned = await this.transition(id, "returned", "release");
    // Both sides complete a handoff, which feeds their reputation stats.
    await this.listings.incrementHandoffs(returned.requesterId);
    await this.listings.incrementHandoffs(returned.ownerId);
    return returned;
  }

  cancel(id: string) {
    return this.transition(id, "cancelled", "cancel");
  }
}
