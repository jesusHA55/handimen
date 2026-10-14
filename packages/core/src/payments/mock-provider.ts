import {
  InvalidCurrencyError,
  InvalidPaymentTransitionError,
  PaymentNotFoundError,
} from "./errors";
import type {
  CreatePaymentIntentInput,
  Money,
  PaymentEvent,
  PaymentIntent,
  PaymentIntentStatus,
  PaymentProviderName,
  PaymentsProvider,
} from "./types";

const ZERO_EUR: Money = { amount: 0, currency: "EUR" };

/** Allowed lifecycle transitions. Enforced so the mock behaves like a real PSP. */
export const ALLOWED_TRANSITIONS: Record<PaymentIntentStatus, readonly PaymentIntentStatus[]> = {
  pending: ["authorized", "cancelled", "failed"],
  authorized: ["captured", "cancelled", "failed"],
  captured: ["released", "refunded"],
  released: ["refunded"],
  refunded: [],
  cancelled: [],
  failed: [],
};

/** Shared guard so persisted payment state uses the same rules as the provider. */
export function canTransitionPayment(
  from: PaymentIntentStatus,
  to: PaymentIntentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function assertValidMoney(money: Money, label: string): Money {
  if (!Number.isInteger(money.amount) || money.amount < 0) {
    throw new InvalidCurrencyError(`${label} must be a non-negative integer (minor units)`);
  }
  if (!money.currency || money.currency.length !== 3) {
    throw new InvalidCurrencyError(`${label} currency must be an ISO 4217 code`);
  }
  return money;
}

/**
 * In-memory payments provider. Simulates a real PSP — including escrow-style
 * hold/release — while moving no actual money. Swap for StripeProvider in Phase 3.
 *
 * Not durable: state lives in memory. Phase 1 wires intents to the `transactions`
 * table via the server layer; this class stays pure and testable.
 */
export class MockPaymentsProvider implements PaymentsProvider {
  readonly name: PaymentProviderName = "mock";

  private readonly intents = new Map<string, PaymentIntent>();

  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    const amount = assertValidMoney(input.amount, "amount");
    const deposit = assertValidMoney(input.deposit ?? ZERO_EUR, "deposit");
    const now = new Date().toISOString();

    const intent: PaymentIntent = {
      id: `mock_pi_${crypto.randomUUID()}`,
      provider: this.name,
      status: "pending",
      requestId: input.requestId,
      amount,
      deposit,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ?? {},
    };

    this.intents.set(intent.id, intent);
    return intent;
  }

  async authorize(intentId: string): Promise<PaymentIntent> {
    return this.transition(intentId, "authorized");
  }

  async capture(intentId: string): Promise<PaymentIntent> {
    return this.transition(intentId, "captured");
  }

  async release(intentId: string): Promise<PaymentIntent> {
    return this.transition(intentId, "released");
  }

  async refund(intentId: string, _amount?: Money): Promise<PaymentIntent> {
    // Partial refunds land with the real provider in Phase 3; the mock refunds in full.
    return this.transition(intentId, "refunded");
  }

  async cancel(intentId: string): Promise<PaymentIntent> {
    return this.transition(intentId, "cancelled");
  }

  async getIntent(intentId: string): Promise<PaymentIntent | null> {
    return this.intents.get(intentId) ?? null;
  }

  async handleWebhook(payload: unknown, _signature: string | null): Promise<PaymentEvent> {
    const data = (payload ?? {}) as { intentId?: unknown; type?: unknown };
    if (typeof data.intentId !== "string") {
      throw new InvalidCurrencyError("webhook payload missing intentId");
    }
    const type = typeof data.type === "string" ? data.type : "payment.authorized";
    return {
      id: `mock_evt_${crypto.randomUUID()}`,
      type: type as PaymentEvent["type"],
      provider: this.name,
      intentId: data.intentId,
      createdAt: new Date().toISOString(),
    };
  }

  private transition(intentId: string, to: PaymentIntentStatus): PaymentIntent {
    const current = this.intents.get(intentId);
    if (!current) throw new PaymentNotFoundError(intentId);

    if (!ALLOWED_TRANSITIONS[current.status].includes(to)) {
      throw new InvalidPaymentTransitionError(current.status, to);
    }

    const next: PaymentIntent = {
      ...current,
      status: to,
      updatedAt: new Date().toISOString(),
    };
    this.intents.set(intentId, next);
    return next;
  }
}

export function createMockPaymentsProvider(): PaymentsProvider {
  return new MockPaymentsProvider();
}
