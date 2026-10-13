/**
 * Payments abstraction.
 *
 * The MVP ships a `MockProvider` that simulates the full lifecycle (including
 * escrow-style hold/release) so the UI and request flow are real. Phase 3 swaps
 * in a `StripeProvider` implementing this same interface — call sites never change.
 *
 * IMPORTANT: a mock payment validates the *flow*; it moves no money and creates
 * no real trust. See `@handimen/core/trust` for the actual MVP trust levers.
 */

export type PaymentProviderName = "mock" | "stripe";

/** Money is always in minor units (cents) to avoid float drift. */
export interface Money {
  /** Integer amount in minor units, e.g. 1250 = €12.50 */
  amount: number;
  /** ISO 4217 currency code. */
  currency: "EUR" | (string & {});
}

/** Escrow-style lifecycle: pending → authorized → captured → released/refunded. */
export type PaymentIntentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "released"
  | "refunded"
  | "cancelled"
  | "failed";

export interface PaymentIntent {
  id: string;
  provider: PaymentProviderName;
  status: PaymentIntentStatus;
  /** The borrow/rental request this payment funds. */
  requestId: string;
  /** Rental/booking price. */
  amount: Money;
  /** Refundable deposit held until the item is returned. */
  deposit: Money;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, string>;
}

export interface CreatePaymentIntentInput {
  requestId: string;
  amount: Money;
  deposit?: Money;
  metadata?: Record<string, string>;
}

export type PaymentEventType =
  | "payment.authorized"
  | "payment.captured"
  | "payment.released"
  | "payment.refunded"
  | "payment.failed";

export interface PaymentEvent {
  id: string;
  type: PaymentEventType;
  provider: PaymentProviderName;
  intentId: string;
  createdAt: string;
}

export interface PaymentsProvider {
  readonly name: PaymentProviderName;

  createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent>;
  authorize(intentId: string): Promise<PaymentIntent>;
  capture(intentId: string): Promise<PaymentIntent>;
  /** Release the held funds to the lender on successful return. */
  release(intentId: string): Promise<PaymentIntent>;
  /** Refund the borrower, fully or partially. */
  refund(intentId: string, amount?: Money): Promise<PaymentIntent>;
  cancel(intentId: string): Promise<PaymentIntent>;
  getIntent(intentId: string): Promise<PaymentIntent | null>;

  /** Verify + normalize an inbound provider webhook. */
  handleWebhook(payload: unknown, signature: string | null): Promise<PaymentEvent>;
}
