export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface Thread {
  id: string;
  listingId: string | null;
  /** Denormalized for the inbox list. */
  listingTitle: string | null;
  requestId: string | null;
  participantA: string;
  participantB: string;
  createdAt: string;
  updatedAt: string;
}

/** A thread plus the bits the inbox needs, without extra lookups. */
export interface ThreadPreview {
  thread: Thread;
  otherParticipantId: string;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface ThreadContext {
  listingId?: string | null;
  listingTitle?: string | null;
  requestId?: string | null;
}

export interface CreateThreadInput {
  participantA: string;
  participantB: string;
  context?: ThreadContext;
}

export interface SendMessageInput {
  threadId: string;
  senderId: string;
  body: string;
}

/** The messaging contract — implemented by the Supabase layer and the demo layer. */
export interface MessagesRepository {
  listThreads(userId: string): Promise<ThreadPreview[]>;
  getThread(threadId: string): Promise<Thread | null>;
  listMessages(threadId: string): Promise<Message[]>;
  sendMessage(input: SendMessageInput): Promise<Message>;
  markRead(threadId: string, userId: string): Promise<void>;
  getOrCreateThread(input: CreateThreadInput): Promise<Thread>;
  unreadCount(userId: string): Promise<number>;
}
