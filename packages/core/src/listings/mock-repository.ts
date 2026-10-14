import { isWithinRadius } from "../geo";

import { CURRENT_USER_ID, POBLENOU_CITY_ID, SEED_LISTINGS, SEED_OWNERS } from "./seed";
import type {
  CreateListingInput,
  Listing,
  ListingFilter,
  ListingOwner,
  ListingStatus,
} from "./types";

export interface ListingsRepository {
  list(filter?: ListingFilter): Promise<Listing[]>;
  get(id: string): Promise<Listing | null>;
  getOwner(id: string): Promise<ListingOwner | null>;
  getOwners(ids: string[]): Promise<ListingOwner[]>;
  create(input: CreateListingInput): Promise<Listing>;
  setStatus(id: string, status: ListingStatus): Promise<Listing | null>;
  /** Mock Tier-1 verification toggle for the current demo user. */
  verifyPhone(ownerId: string): Promise<ListingOwner | null>;
  /** Mock Tier-2 identity verification toggle. */
  verifyIdentity(ownerId: string): Promise<ListingOwner | null>;
  /** Fold a new star rating into the owner's aggregate. */
  addReview(ownerId: string, rating: number): Promise<ListingOwner | null>;
  /** Bump a member's completed-handoff count. */
  incrementHandoffs(ownerId: string): Promise<ListingOwner | null>;
}

function matches(listing: Listing, filter: ListingFilter | undefined): boolean {
  if (!filter) return true;

  if (filter.category && listing.category !== filter.category) return false;
  if (filter.type && listing.type !== filter.type) return false;
  if (filter.terms && listing.terms !== filter.terms) return false;
  if (filter.ownerId && listing.ownerId !== filter.ownerId) return false;

  if (filter.query) {
    const needle = filter.query.trim().toLowerCase();
    const haystack = `${listing.title} ${listing.description}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  if (filter.near) {
    const { lat, lng, radiusMeters } = filter.near;
    if (!isWithinRadius({ lat: listing.lat, lng: listing.lng }, { lat, lng }, radiusMeters)) {
      return false;
    }
  }

  return true;
}

/**
 * In-memory listings repository.
 *
 * Mirrors the payments pattern: the demo runs entirely on mocks, and swapping in
 * a Supabase-backed implementation for Phase 1-remote is a drop-in change.
 */
export class MockListingsRepository implements ListingsRepository {
  private readonly listings = new Map<string, Listing>();
  private readonly owners = new Map<string, ListingOwner>();

  constructor(listings: Listing[] = SEED_LISTINGS, owners: ListingOwner[] = SEED_OWNERS) {
    for (const owner of owners) this.owners.set(owner.id, owner);
    for (const listing of listings) this.listings.set(listing.id, listing);
  }

  async list(filter?: ListingFilter): Promise<Listing[]> {
    return [...this.listings.values()]
      .filter((listing) => listing.status !== "archived")
      .filter((listing) => matches(listing, filter))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Listing | null> {
    return this.listings.get(id) ?? null;
  }

  async getOwner(id: string): Promise<ListingOwner | null> {
    return this.owners.get(id) ?? null;
  }

  async getOwners(ids: string[]): Promise<ListingOwner[]> {
    const unique = [...new Set(ids)];
    return unique
      .map((id) => this.owners.get(id))
      .filter((owner): owner is ListingOwner => Boolean(owner));
  }

  async create(input: CreateListingInput): Promise<Listing> {
    if (input.terms === "rent" && (input.priceCents ?? 0) <= 0) {
      throw new Error("Paid listings require a price.");
    }

    const listing: Listing = {
      id: `listing_${crypto.randomUUID()}`,
      ownerId: input.ownerId,
      type: input.type,
      terms: input.terms,
      category: input.category,
      title: input.title,
      description: input.description,
      photos: input.photos?.length ? input.photos : ["🔧"],
      priceCents: input.terms === "rent" ? (input.priceCents ?? null) : null,
      priceUnit: input.terms === "rent" ? (input.priceUnit ?? "day") : null,
      depositCents: input.terms === "rent" ? (input.depositCents ?? null) : null,
      lat: input.lat,
      lng: input.lng,
      cityId: POBLENOU_CITY_ID,
      groupId: input.groupId ?? null,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    this.listings.set(listing.id, listing);
    return listing;
  }

  async setStatus(id: string, status: ListingStatus): Promise<Listing | null> {
    const existing = this.listings.get(id);
    if (!existing) return null;
    const next = { ...existing, status };
    this.listings.set(id, next);
    return next;
  }

  async verifyPhone(ownerId: string): Promise<ListingOwner | null> {
    const owner = this.owners.get(ownerId);
    if (!owner) return null;
    const next: ListingOwner = { ...owner, phoneVerified: true, trustTier: owner.trustTier === 0 ? 1 : owner.trustTier };
    this.owners.set(ownerId, next);
    return next;
  }

  async verifyIdentity(ownerId: string): Promise<ListingOwner | null> {
    const owner = this.owners.get(ownerId);
    if (!owner) return null;
    // Identity is stronger than phone, so it satisfies both.
    const next: ListingOwner = { ...owner, phoneVerified: true, trustTier: 2 };
    this.owners.set(ownerId, next);
    return next;
  }

  async addReview(ownerId: string, rating: number): Promise<ListingOwner | null> {
    const owner = this.owners.get(ownerId);
    if (!owner) return null;
    const count = owner.reviewCount + 1;
    const average = (owner.rating * owner.reviewCount + rating) / count;
    const next: ListingOwner = {
      ...owner,
      reviewCount: count,
      rating: Math.round(average * 10) / 10,
    };
    this.owners.set(ownerId, next);
    return next;
  }

  async incrementHandoffs(ownerId: string): Promise<ListingOwner | null> {
    const owner = this.owners.get(ownerId);
    if (!owner) return null;
    const next: ListingOwner = { ...owner, completedHandoffs: owner.completedHandoffs + 1 };
    this.owners.set(ownerId, next);
    return next;
  }
}

export { CURRENT_USER_ID, POBLENOU_CITY_ID };
