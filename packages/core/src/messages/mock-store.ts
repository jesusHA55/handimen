import { SEED_THREADS } from "./seed";
import type {
  CreateThreadInput,
  Message,
  MessagesRepository,
  SendMessageInput,
  Thread,
  ThreadPreview,
} from "./types";

function otherParticipant(thread: Thread, userId: string): string {
  return thread.participantA === userId ? thread.participantB : thread.participantA;
}

/**
 * Async messaging (no realtime yet — the plan calls for async). Threads are
 * deduplicated per participant pair + listing so "Message" never spams new ones.
 */
export class MockMessagesStore implements MessagesRepository {
  private readonly threads = new Map<string, Thread>();
  private readonly messages = new Map<string, Message>();

  constructor(seed = SEED_THREADS) {
    for (const entry of seed) {
      this.threads.set(entry.thread.id, entry.thread);
      for (const seeded of entry.messages) {
        const id = `message_${crypto.randomUUID()}`;
        this.messages.set(id, {
          id,
          threadId: entry.thread.id,
          senderId: seeded.senderId,
          body: seeded.body,
          readAt: seeded.read ? new Date().toISOString() : null,
          createdAt: new Date(Date.now() - seeded.minutesAgo * 60 * 1000).toISOString(),
        });
      }
    }
  }

  private messagesFor(threadId: string): Message[] {
    return [...this.messages.values()]
      .filter((message) => message.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listThreads(userId: string): Promise<ThreadPreview[]> {
    return [...this.threads.values()]
      .filter((thread) => thread.participantA === userId || thread.participantB === userId)
      .map((thread) => {
        const threadMessages = this.messagesFor(thread.id);
        const lastMessage = threadMessages.at(-1) ?? null;
        const unreadCount = threadMessages.filter(
          (message) => message.senderId !== userId && message.readAt === null,
        ).length;
        return {
          thread,
          otherParticipantId: otherParticipant(thread, userId),
          lastMessage,
          unreadCount,
        };
      })
      .sort((a, b) => b.thread.updatedAt.localeCompare(a.thread.updatedAt));
  }

  async getThread(threadId: string): Promise<Thread | null> {
    return this.threads.get(threadId) ?? null;
  }

  async listMessages(threadId: string): Promise<Message[]> {
    return this.messagesFor(threadId);
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const thread = this.threads.get(input.threadId);
    if (!thread) throw new Error(`Thread not found: ${input.threadId}`);
    if (input.senderId !== thread.participantA && input.senderId !== thread.participantB) {
      throw new Error("You are not part of this conversation.");
    }
    const body = input.body.trim();
    if (!body) throw new Error("Message cannot be empty.");

    const now = new Date().toISOString();
    const message: Message = {
      id: `message_${crypto.randomUUID()}`,
      threadId: input.threadId,
      senderId: input.senderId,
      body,
      readAt: null,
      createdAt: now,
    };

    this.messages.set(message.id, message);
    this.threads.set(thread.id, { ...thread, updatedAt: now });
    return message;
  }

  async markRead(threadId: string, userId: string): Promise<void> {
    for (const [id, message] of this.messages) {
      if (message.threadId === threadId && message.senderId !== userId && message.readAt === null) {
        this.messages.set(id, { ...message, readAt: new Date().toISOString() });
      }
    }
  }

  async getOrCreateThread(input: CreateThreadInput): Promise<Thread> {
    if (input.participantA === input.participantB) {
      throw new Error("You cannot message yourself.");
    }

    const listingId = input.context?.listingId ?? null;
    const existing = [...this.threads.values()].find(
      (thread) =>
        (thread.participantA === input.participantA && thread.participantB === input.participantB) ||
        (thread.participantA === input.participantB && thread.participantB === input.participantA),
    );
    if (existing && (!listingId || existing.listingId === listingId)) {
      return existing;
    }

    const now = new Date().toISOString();
    const thread: Thread = {
      id: `thread_${crypto.randomUUID()}`,
      listingId,
      listingTitle: input.context?.listingTitle ?? null,
      requestId: input.context?.requestId ?? null,
      participantA: input.participantA,
      participantB: input.participantB,
      createdAt: now,
      updatedAt: now,
    };
    this.threads.set(thread.id, thread);
    return thread;
  }

  async unreadCount(userId: string): Promise<number> {
    const previews = await this.listThreads(userId);
    return previews.reduce((total, preview) => total + preview.unreadCount, 0);
  }
}
