import { describe, expect, it } from "vitest";

import { createDemoBundle } from "./bundle";

describe("createDemoBundle", () => {
  it("remaps the demo identity to the real user", async () => {
    const bundle = await createDemoBundle("auth-user-123", "Alicia");

    const mine = await bundle.listings.list({ ownerId: "auth-user-123" });
    expect(mine.length).toBeGreaterThan(0);

    const me = await bundle.listings.getOwner("auth-user-123");
    expect(me?.displayName).toBe("Alicia");

    // The placeholder identity must be gone.
    expect(await bundle.listings.getOwner("profile_you")).toBeNull();
  });

  it("makes the seeded incoming request point at the real user's listing", async () => {
    const bundle = await createDemoBundle("auth-user-123");
    const incoming = await bundle.requests.list({ ownerId: "auth-user-123" });

    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.requesterId).toBe("profile_marta");
    expect(incoming[0]?.paymentStatus).toBe("authorized");
  });

  it("remaps seeded threads so the inbox belongs to the real user", async () => {
    const bundle = await createDemoBundle("auth-user-123");
    const previews = await bundle.messages.listThreads("auth-user-123");

    expect(previews).toHaveLength(2);
    expect(await bundle.messages.unreadCount("auth-user-123")).toBe(1);
  });

  it("leaves other neighbours untouched", async () => {
    const bundle = await createDemoBundle("auth-user-123");
    const marta = await bundle.listings.getOwner("profile_marta");
    expect(marta?.displayName).toBe("Marta");
    expect(marta?.trustTier).toBe(1);
  });

  it("falls back to the seeded identity when no user is signed in", async () => {
    const bundle = await createDemoBundle("profile_you");
    const mine = await bundle.listings.list({ ownerId: "profile_you" });
    expect(mine.some((listing) => listing.id === "listing_taladro_you")).toBe(true);
  });
});
