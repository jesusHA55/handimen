import type { PaymentIntentStatus } from "./types";

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentError";
  }
}

export class PaymentNotFoundError extends PaymentError {
  constructor(intentId: string) {
    super(`Payment intent not found: ${intentId}`);
    this.name = "PaymentNotFoundError";
  }
}

export class InvalidPaymentTransitionError extends PaymentError {
  constructor(from: PaymentIntentStatus, to: PaymentIntentStatus) {
    super(`Illegal payment transition: ${from} → ${to}`);
    this.name = "InvalidPaymentTransitionError";
  }
}

export class InvalidCurrencyError extends PaymentError {
  constructor(reason: string) {
    super(`Invalid money value: ${reason}`);
    this.name = "InvalidCurrencyError";
  }
}
