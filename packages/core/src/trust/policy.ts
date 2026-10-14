/**
 * Trust policy — encodes the tiered verification rules.
 *
 *   Tier 0 (email)  — required for everything; free listings need no more.
 *   Tier 1 (phone)  — required for paid listings below the high-value deposit.
 *   Tier 2 (identity) — required for paid listings at or above that deposit.
 *
 * Identity verification implies phone: holding a verified ID is strictly stronger,
 * so it satisfies the phone requirement too.
 */

export type TrustTier = 0 | 1 | 2;

/** Deposits at or above this amount need identity verification. */
export const HIGH_VALUE_DEPOSIT_CENTS = 5_000; // €50

export interface TrustSignals {
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  completedHandoffs: number;
  vouches: number;
}

export type ListingTerms = "free" | "rent";

export interface ListingGateInput {
  terms: ListingTerms;
  /** Refundable deposit for paid listings, in minor units. */
  depositCents?: number | null;
}

export interface ListingGate {
  allowed: boolean;
  requiresPhoneVerification: boolean;
  requiresIdentityVerification: boolean;
  /** Human-readable key, localized on the client. */
  reason?: string;
}

const ALLOWED: ListingGate = {
  allowed: true,
  requiresPhoneVerification: false,
  requiresIdentityVerification: false,
};

export function trustTier(signals: TrustSignals): TrustTier {
  if (signals.idVerified) return 2;
  if (signals.phoneVerified) return 1;
  return 0;
}

export function isVetted(signals: TrustSignals): boolean {
  return trustTier(signals) >= 1 || signals.vouches >= 3;
}

export function listingGate(input: ListingGateInput, signals: TrustSignals): ListingGate {
  if (!signals.emailVerified) {
    return {
      allowed: false,
      requiresPhoneVerification: false,
      requiresIdentityVerification: false,
      reason: "verify_email",
    };
  }

  // Free lending only ever needs a verified email.
  if (input.terms !== "rent") return ALLOWED;

  const deposit = input.depositCents ?? 0;
  const phoneSatisfied = signals.phoneVerified || signals.idVerified;

  if (deposit >= HIGH_VALUE_DEPOSIT_CENTS) {
    if (!signals.idVerified) {
      return {
        allowed: false,
        requiresPhoneVerification: false,
        requiresIdentityVerification: true,
        reason: "id_required_for_high_deposit",
      };
    }
    return ALLOWED;
  }

  if (!phoneSatisfied) {
    return {
      allowed: false,
      requiresPhoneVerification: true,
      requiresIdentityVerification: false,
      reason: "phone_required_for_paid",
    };
  }

  return ALLOWED;
}
