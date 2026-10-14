import { describe, expect, it } from "vitest";

import {
  HIGH_VALUE_DEPOSIT_CENTS,
  listingGate,
  trustTier,
  type TrustSignals,
} from "./policy";

function signals(overrides: Partial<TrustSignals> = {}): TrustSignals {
  return {
    emailVerified: true,
    phoneVerified: false,
    idVerified: false,
    completedHandoffs: 0,
    vouches: 0,
    ...overrides,
  };
}

describe("listingGate", () => {
  it("blocks everything without a verified email", () => {
    const gate = listingGate({ terms: "free" }, signals({ emailVerified: false }));
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("verify_email");
  });

  it("allows free listings on email alone", () => {
    expect(listingGate({ terms: "free" }, signals()).allowed).toBe(true);
  });

  it("does not require a phone for a free first lend", () => {
    const gate = listingGate({ terms: "free" }, signals({ completedHandoffs: 0 }));
    expect(gate.allowed).toBe(true);
  });

  it("requires a phone for paid listings below the high-value deposit", () => {
    const gate = listingGate(
      { terms: "rent", depositCents: HIGH_VALUE_DEPOSIT_CENTS - 1 },
      signals(),
    );
    expect(gate.allowed).toBe(false);
    expect(gate.requiresPhoneVerification).toBe(true);
    expect(gate.reason).toBe("phone_required_for_paid");
  });

  it("allows a phone-verified member to post a paid listing", () => {
    const gate = listingGate(
      { terms: "rent", depositCents: 1_000 },
      signals({ phoneVerified: true }),
    );
    expect(gate.allowed).toBe(true);
  });

  it("requires identity at or above the high-value deposit", () => {
    const gate = listingGate(
      { terms: "rent", depositCents: HIGH_VALUE_DEPOSIT_CENTS },
      signals({ phoneVerified: true }),
    );
    expect(gate.allowed).toBe(false);
    expect(gate.requiresIdentityVerification).toBe(true);
    expect(gate.reason).toBe("id_required_for_high_deposit");
  });

  it("treats a verified identity as satisfying the phone requirement", () => {
    const gate = listingGate({ terms: "rent", depositCents: 500 }, signals({ idVerified: true }));
    expect(gate.allowed).toBe(true);
  });

  it("allows a no-deposit paid listing once the phone is verified", () => {
    expect(
      listingGate({ terms: "rent", depositCents: null }, signals({ phoneVerified: true })).allowed,
    ).toBe(true);
  });
});

describe("trustTier", () => {
  it("ranks identity above phone above email", () => {
    expect(trustTier(signals({ idVerified: true }))).toBe(2);
    expect(trustTier(signals({ phoneVerified: true }))).toBe(1);
    expect(trustTier(signals())).toBe(0);
  });
});
