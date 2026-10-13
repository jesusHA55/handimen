import { describe, expect, it } from "vitest";

import { InvalidPaymentTransitionError, PaymentNotFoundError } from "./errors";
import { createMockPaymentsProvider } from "./mock-provider";

const EUR = (amount: number) => ({ amount, currency: "EUR" as const });

describe("MockPaymentsProvider", () => {
  it("runs the happy path: pending → authorized → captured → released", async () => {
    const provider = createMockPaymentsProvider();

    const intent = await provider.createIntent({
      requestId: "req_1",
      amount: EUR(1250),
      deposit: EUR(5000),
    });
    expect(intent.status).toBe("pending");
    expect(intent.amount).toEqual(EUR(1250));
    expect(intent.deposit).toEqual(EUR(5000));

    expect((await provider.authorize(intent.id)).status).toBe("authorized");
    expect((await provider.capture(intent.id)).status).toBe("captured");
    expect((await provider.release(intent.id)).status).toBe("released");
  });

  it("supports refund after capture", async () => {
    const provider = createMockPaymentsProvider();
    const intent = await provider.createIntent({ requestId: "req_2", amount: EUR(100) });
    await provider.authorize(intent.id);
    await provider.capture(intent.id);
    expect((await provider.refund(intent.id)).status).toBe("refunded");
  });

  it("rejects illegal transitions", async () => {
    const provider = createMockPaymentsProvider();
    const intent = await provider.createIntent({ requestId: "req_3", amount: EUR(100) });
    await expect(provider.release(intent.id)).rejects.toBeInstanceOf(
      InvalidPaymentTransitionError,
    );
  });

  it("throws for unknown intents", async () => {
    const provider = createMockPaymentsProvider();
    await expect(provider.authorize("nope")).rejects.toBeInstanceOf(PaymentNotFoundError);
  });

  it("defaults deposit to zero and validates money", async () => {
    const provider = createMockPaymentsProvider();
    const intent = await provider.createIntent({ requestId: "req_4", amount: EUR(0) });
    expect(intent.deposit).toEqual(EUR(0));

    await expect(
      provider.createIntent({ requestId: "req_5", amount: { amount: 1.5, currency: "EUR" } }),
    ).rejects.toThrow();
  });
});
