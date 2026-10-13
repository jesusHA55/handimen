/**
 * Trust policy — encodes the tiered verification rules from the plan.
 *
 * Tier 0 (free): verified email + completed profile.
 * Tier 1 (costed): phone verification, required only to list a paid rental or
 *   for a user's first lend (keeps SMS spend inside the €10/month budget).
 * Tier 2 (Phase 3): ID verification for high-value rentals.
 */

export type TrustTier = 0 | 1 | 2;

export interface TrustSignals {
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  completedHandoffs: number;
  vouches: number;
}

export type ListingTerms = "free" | "rent";

export interface ListingGate {
  allowed: boolean;
  requiresPhoneVerification: boolean;
  /** Human-readable, localized on the client. */
  reason?: string;
}

export function trustTier(signals: TrustSignals): TrustTier {
  if (signals.idVerified) return 2;
  if (signals.phoneVerified) return 1;
  return 0;
}

export function isVetted(signals: TrustSignals): boolean {
  return trustTier(signals) >= 1 || signals.vouches >= 3;
}

export function listingGate(terms: ListingTerms, signals: TrustSignals): ListingGate {
  if (!signals.emailVerified) {
    return { allowed: false, requiresPhoneVerification: false, reason: "verify_email" };
  }

  if (terms === "rent" && !signals.phoneVerified) {
    return { allowed: false, requiresPhoneVerification: true, reason: "phone_required_for_paid" };
  }

  if (signals.completedHandoffs === 0 && !signals.phoneVerified) {
    return { allowed: false, requiresPhoneVerification: true, reason: "phone_required_first_lend" };
  }

  return { allowed: true, requiresPhoneVerification: false };
}
