import { describe, expect, it } from "vitest";

import { MockListingsRepository } from "../listings/mock-repository";
import { SEED_LISTINGS, SEED_OWNERS } from "../listings/seed";
import { MockRequestsStore } from "./mock-store";

function fresh() {
  const listings = new MockListingsRepository(SEED_LISTINGS, SEED_OWNERS);
  const requests = new MockRequestsStore(listings);
  return { listings, requests };
}

describe("MockListingsRepository", () => {
  it("filters by category and free-text query", async () => {
    const { listings } = fresh();
    const tools = await listings.list({ category: "power_tools" });
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every((l) => l.category === "power_tools")).toBe(true);

    const search = await listings.list({ query: "paella" });
    expect(search).toHaveLength(1);
    expect(search[0]?.id).toBe("listing_kit_paella");
  });

  it("filters by radius", async () => {
    const { listings } = fresh();
    const near = await listings.list({
      near: { lat: 41.4005, lng: 2.1975, radiusMeters: 150 },
    });
    expect(near.length).toBeLessThan(SEED_LISTINGS.length);
  });

  it("requires a price for paid listings", async () => {
    const { listings } = fresh();
    await expect(
      listings.create({
        ownerId: "profile_you",
        type: "tool",
        terms: "rent",
        category: "power_tools",
        title: "Sin precio",
        description: "…",
        priceCents: 0,
        lat: 41.4,
        lng: 2.19,
      }),
    ).rejects.toThrow();
  });

  it("creates a free listing without payment fields", async () => {
    const { listings } = fresh();
    const created = await listings.create({
      ownerId: "profile_you",
      type: "tool",
      terms: "free",
      category: "garden_outdoors",
      title: "Rastrillo",
      description: "Un rastrillo",
      lat: 41.4,
      lng: 2.19,
    });
    expect(created.priceCents).toBeNull();
    expect(created.status).toBe("active");
  });

  it("upgrades trust tier when phone is verified", async () => {
    const { listings } = fresh();
    const before = await listings.getOwner("profile_you");
    expect(before?.trustTier).toBe(0);
    const after = await listings.verifyPhone("profile_you");
    expect(after?.phoneVerified).toBe(true);
    expect(after?.trustTier).toBe(1);
  });
});

describe("MockRequestsStore escrow lifecycle", () => {
  it("runs authorize → capture → release for a paid rental", async () => {
    const { requests } = fresh();
    const request = await requests.create({
      listingId: "listing_bici_cargo",
      requesterId: "profile_you",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(request.status).toBe("pending");
    expect(request.paymentIntentId).not.toBeNull();
    expect(request.paymentStatus).toBe("authorized");
    expect(request.agreedPriceCents).toBe(1800);

    expect((await requests.activate(request.id)).paymentStatus).toBe("captured");
    const returned = await requests.markReturned(request.id);
    expect(returned.status).toBe("returned");
    expect(returned.paymentStatus).toBe("released");
  });

  it("creates a free borrow with no payment intent", async () => {
    const { requests } = fresh();
    const request = await requests.create({
      listingId: "listing_taladro",
      requesterId: "profile_you",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(request.paymentIntentId).toBeNull();
    expect(request.paymentStatus).toBeNull();
  });

  it("cancels the payment when a request is declined", async () => {
    const { requests } = fresh();
    const request = await requests.create({
      listingId: "listing_proyector",
      requesterId: "profile_you",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86_400_000).toISOString(),
    });
    const declined = await requests.decline(request.id);
    expect(declined.status).toBe("declined");
    expect(declined.paymentStatus).toBe("cancelled");
  });

  it("refuses to request your own listing", async () => {
    const { requests } = fresh();
    await expect(
      requests.create({
        listingId: "listing_taladro",
        requesterId: "profile_marta",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    ).rejects.toThrow();
  });
});
