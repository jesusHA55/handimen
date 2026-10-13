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
