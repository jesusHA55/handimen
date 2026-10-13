import { describe, expect, it } from "vitest";

import { MockMessagesStore } from "./mock-store";

function store() {
  return new MockMessagesStore();
}

describe("MockMessagesStore", () => {
  it("lists the demo user's threads, newest activity first", async () => {
    const previews = await store().listThreads("profile_you");
    expect(previews).toHaveLength(2);
    expect(previews[0]?.thread.id).toBe("thread_seed_marta");
    expect(previews[0]?.otherParticipantId).toBe("profile_marta");
  });

  it("reports unread messages for the recipient", async () => {
    const messages = store();
    expect(await messages.unreadCount("profile_you")).toBe(1);
    expect(await messages.unreadCount("profile_marta")).toBe(0);
  });

  it("marks a thread read", async () => {
    const messages = store();
    await messages.markRead("thread_seed_marta", "profile_you");
    expect(await messages.unreadCount("profile_you")).toBe(0);
  });

  it("appends a message and bumps the thread's updated time", async () => {
    const messages = store();
    const before = await messages.getThread("thread_seed_marta");

    const sent = await messages.sendMessage({
      threadId: "thread_seed_marta",
      senderId: "profile_you",
      body: "  Nos vemos el sábado  ",
    });

    expect(sent.body).toBe("Nos vemos el sábado");
    const after = await messages.getThread("thread_seed_marta");
    expect((after?.updatedAt ?? "") >= (before?.updatedAt ?? "")).toBe(true);
    expect(await messages.listMessages("thread_seed_marta")).toHaveLength(4);
  });

  it("rejects empty messages and outsiders", async () => {
    const messages = store();
    await expect(
      messages.sendMessage({ threadId: "thread_seed_marta", senderId: "profile_you", body: "   " }),
    ).rejects.toThrow(/empty/i);

    await expect(
      messages.sendMessage({
        threadId: "thread_seed_marta",
        senderId: "profile_nuria",
        body: "hola",
      }),
    ).rejects.toThrow(/not part/i);
  });

  it("reuses an existing thread between the same two people", async () => {
    const messages = store();
    const existing = await messages.getOrCreateThread({
      participantA: "profile_you",
      participantB: "profile_marta",
      context: { listingId: "listing_taladro_you" },
    });
    expect(existing.id).toBe("thread_seed_marta");
  });

  it("creates a new thread when there is none", async () => {
    const messages = store();
    const thread = await messages.getOrCreateThread({
      participantA: "profile_you",
      participantB: "profile_jordi",
      context: { listingId: "listing_proyector", listingTitle: "Proyector Full HD + pantalla" },
    });
    expect(thread.participantB).toBe("profile_jordi");

    const previews = await messages.listThreads("profile_you");
    expect(previews).toHaveLength(3);
  });

  it("refuses a self-thread", async () => {
    await expect(
      store().getOrCreateThread({ participantA: "profile_you", participantB: "profile_you" }),
    ).rejects.toThrow(/yourself/i);
  });
});
