import type { Point } from "../geo";
import type { ListingTerms } from "../trust/policy";
import type { ListingType } from "./categories";

export type ListingStatus = "draft" | "active" | "paused" | "lent" | "archived";
export type PriceUnit = "hour" | "day" | "week";

/** A community member as shown alongside listings. */
export interface ListingOwner {
  id: string;
  displayName: string;
  avatarEmoji: string;
  neighbourhood: string;
  trustTier: 0 | 1 | 2;
  emailVerified: boolean;
  phoneVerified: boolean;
  rating: number;
  reviewCount: number;
  completedHandoffs: number;
  vouches: number;
}

export interface Listing extends Point {
  id: string;
  ownerId: string;
  type: ListingType;
  terms: ListingTerms;
  category: string;
  title: string;
  description: string;
  /** Placeholder emoji art until real photo uploads land. */
  photos: string[];
  priceCents: number | null;
  priceUnit: PriceUnit | null;
  depositCents: number | null;
  cityId: string;
  groupId: string | null;
  status: ListingStatus;
  createdAt: string;
}

export interface ListingFilter {
  query?: string;
  category?: string;
  type?: ListingType;
  terms?: ListingTerms;
  near?: Point & { radiusMeters: number };
  ownerId?: string;
}

export interface CreateListingInput {
  ownerId: string;
  type: ListingType;
  terms: ListingTerms;
  category: string;
  title: string;
  description: string;
  priceCents?: number | null;
  priceUnit?: PriceUnit | null;
  depositCents?: number | null;
  lat: number;
  lng: number;
  photos?: string[];
  groupId?: string | null;
}
