/**
 * Supabase-backed repositories.
 *
 * Server-only by convention: everything runs through the RLS-bound client passed
 * in by the caller (never the service role), so the database decides what the
 * signed-in member may read and write.
 *
 * Swap-in point: `apps/web/src/lib/stores.ts` returns these instead of the
 * in-memory demo bundle. The interfaces live in `@handimen/core`.
 */

import {
  canTransitionPayment,
  isWithinRadius,
  type CreateListingInput,
  type CreateRequestInput,
  type CreateReviewInput,
  type CreateThreadInput,
  type Comment,
  type CreateCommentInput,
  type CreatePostInput,
  type FeedPost,
  type Listing,
  type ListingFilter,
  type ListingOwner,
  type ListingsRepository,
  type Message,
  type MessagesRepository,
  type PaymentIntentStatus,
  type RentalRequest,
  type RequestFilter,
  type RequestStatus,
  type RequestsStore,
  type Review,
  type ReviewsRepository,
  type SendMessageInput,
  type SocialRepository,
  type Thread,
  type ThreadPreview,
} from "@handimen/core";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];
type ProfileRow = Tables["profiles"]["Row"];
type ListingRow = Tables["listings"]["Row"];
type RequestRow = Tables["requests"]["Row"];
type ThreadRow = Tables["threads"]["Row"];
type MessageRow = Tables["messages"]["Row"];
type ReviewRow = Tables["reviews"]["Row"];
type PostRow = Tables["posts"]["Row"];
type PaymentStatus = Tables["transactions"]["Row"]["status"];

/** Joined shapes returned by the queries below. */
type ListingOwnerJoin = { owner: { display_name: string } | null };
type RequestJoins = {
  listing: { title: string } | null;
  transactions: { status: PaymentStatus }[] | null;
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const AVATARS = ["🙋", "👩‍🔧", "🧔", "👩‍🎨", "🧑‍🦱", "👩‍🌾", "🧑‍🔬", "👨‍🦰", "👩‍🦳", "🧑‍🎤"];

/** Placeholder avatar until members upload real photos. */
export function avatarFor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return AVATARS[hash % AVATARS.length] ?? "🙂";
}

function toOwner(row: ProfileRow): ListingOwner {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarEmoji: avatarFor(row.id),
    neighbourhood: row.neighbourhood ?? "",
    trustTier: row.id_verified ? 2 : row.phone_verified ? 1 : 0,
    emailVerified: row.email_verified,
    phoneVerified: row.phone_verified,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    completedHandoffs: row.completed_handoffs ?? 0,
    vouches: row.vouches ?? 0,
  };
}

function toListing(row: ListingRow): Listing {
  return {
    id: row.id,
    ownerId: row.owner_id,
    type: row.type,
    terms: row.terms,
    category: row.category,
    title: row.title,
    description: row.description,
    photos: row.photos ?? [],
    priceCents: row.price_cents,
    priceUnit: row.price_unit,
    depositCents: row.deposit_cents,
    lat: row.pickup_lat ?? 41.4005,
    lng: row.pickup_lng ?? 2.1975,
    cityId: row.city_id ?? "",
    groupId: row.group_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toRequest(row: RequestRow & RequestJoins): RentalRequest {
  const payment = Array.isArray(row.transactions) ? row.transactions[0] : null;
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing?.title ?? "",
    requesterId: row.requester_id,
    ownerId: row.owner_id,
    status: row.status,
    message: row.message,
    startDate: row.start_date,
    endDate: row.end_date,
    agreedPriceCents: row.agreed_price_cents,
    agreedDepositCents: row.agreed_deposit_cents,
    paymentIntentId: row.payment_intent_id,
    paymentStatus: (payment?.status ?? null) as PaymentIntentStatus | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    requestId: row.request_id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function toThread(row: ThreadRow & { listing: { title: string } | null }): Thread {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing?.title ?? null,
    requestId: row.request_id,
    participantA: row.participant_a,
    participantB: row.participant_b,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function toPost(row: PostRow, reactionCount: number, commentCount: number): FeedPost {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    listingId: row.listing_id,
    cityId: row.city_id ?? "",
    visibility: row.visibility,
    reactionCount,
    commentCount,
    createdAt: row.created_at,
  };
}

function toComment(row: Tables["comments"]["Row"]): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** URL segments are strings; Postgres rejects them loudly if they aren't UUIDs. */
function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

async function fetchOwner(client: Client, id: string): Promise<ListingOwner | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await client.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toOwner(data) : null;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export function createListingsRepository(client: Client): ListingsRepository {
  return {
    async list(filter?: ListingFilter): Promise<Listing[]> {
      let query = client.from("listings").select("*").neq("status", "archived");

      if (filter?.category) query = query.eq("category", filter.category);
      if (filter?.type) query = query.eq("type", filter.type);
      if (filter?.terms) query = query.eq("terms", filter.terms);
      if (filter?.ownerId) query = query.eq("owner_id", filter.ownerId);

      if (filter?.query) {
        const needle = filter.query.replace(/[%,()]/g, " ").trim();
        if (needle) {
          query = query.or(`title.ilike.%${needle}%,description.ilike.%${needle}%`);
        }
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const listings = (data ?? []).map(toListing);

      if (filter?.near) {
        // Fine for a neighbourhood; ST_DWithin takes over as the dataset grows.
        const { lat, lng, radiusMeters } = filter.near;
        return listings.filter((listing) =>
          isWithinRadius({ lat: listing.lat, lng: listing.lng }, { lat, lng }, radiusMeters),
        );
      }

      return listings;
    },

    async get(id: string): Promise<Listing | null> {
      if (!isUuid(id)) return null;
      const { data, error } = await client.from("listings").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toListing(data) : null;
    },

    getOwner: (id) => fetchOwner(client, id),

    async getOwners(ids: string[]): Promise<ListingOwner[]> {
      const unique = [...new Set(ids)];
      if (unique.length === 0) return [];
      const { data, error } = await client.from("profiles").select("*").in("id", unique);
      if (error) throw error;
      return (data ?? []).map(toOwner);
    },

    async create(input: CreateListingInput): Promise<Listing> {
      const { data: city } = await client.from("cities").select("id").limit(1).maybeSingle();

      const { data, error } = await client
        .from("listings")
        .insert({
          owner_id: input.ownerId,
          type: input.type,
          terms: input.terms,
          category: input.category,
          title: input.title,
          description: input.description,
          photos: input.photos?.length ? input.photos : ["🔧"],
          price_cents: input.terms === "rent" ? (input.priceCents ?? null) : null,
          price_unit: input.terms === "rent" ? (input.priceUnit ?? "day") : null,
          deposit_cents: input.terms === "rent" ? (input.depositCents ?? null) : null,
          city_id: city?.id ?? null,
          group_id: input.groupId ?? null,
          pickup_location: `SRID=4326;POINT(${input.lng} ${input.lat})`,
          status: "active",
        })
        .select("*")
        .single();

      if (error) throw error;
      return toListing(data);
    },

    async setStatus(id, status): Promise<Listing | null> {
      const { data, error } = await client
        .from("listings")
        .update({ status })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data ? toListing(data) : null;
    },

    async verifyPhone(ownerId: string): Promise<ListingOwner | null> {
      const { error } = await client
        .from("profiles")
        .update({ phone_verified: true })
        .eq("id", ownerId);
      if (error) throw error;
      return fetchOwner(client, ownerId);
    },

    async verifyIdentity(ownerId: string): Promise<ListingOwner | null> {
      // Identity is stronger than phone, so it satisfies both.
      const { error } = await client
        .from("profiles")
        .update({ id_verified: true, phone_verified: true })
        .eq("id", ownerId);
      if (error) throw error;
      return fetchOwner(client, ownerId);
    },

    // Rating and handoff counters are owned by database triggers.
    addReview: (ownerId) => fetchOwner(client, ownerId),
    incrementHandoffs: (ownerId) => fetchOwner(client, ownerId),
  };
}

// ---------------------------------------------------------------------------
// Requests (+ the mock escrow ledger)
// ---------------------------------------------------------------------------

const REQUEST_SELECT = "*, listing:listings(title), transactions(status)";

export function createRequestsStore(client: Client): RequestsStore {
  async function transition(
    id: string,
    status: RequestStatus,
    payment?: PaymentIntentStatus,
  ): Promise<RentalRequest> {
    const { data, error } = await client
      .from("requests")
      .update({ status })
      .eq("id", id)
      .select(REQUEST_SELECT)
      .single();
    if (error) throw error;

    const row = data as unknown as RequestRow & RequestJoins;

    if (payment) {
      const current = (Array.isArray(row.transactions) ? row.transactions[0]?.status : null) ?? null;
      const from = (current ?? "authorized") as PaymentIntentStatus;
      if (canTransitionPayment(from, payment)) {
        const { error: paymentError } = await client
          .from("transactions")
          .update({ status: payment })
          .eq("request_id", id);
        if (paymentError) throw paymentError;
      }
    }

    const { data: refreshed } = await client
      .from("requests")
      .select(REQUEST_SELECT)
      .eq("id", id)
      .single();

    return toRequest((refreshed ?? data) as unknown as RequestRow & RequestJoins);
  }

  return {
    async list(filter: RequestFilter = {}): Promise<RentalRequest[]> {
      let query = client.from("requests").select(REQUEST_SELECT);
      if (filter.requesterId) query = query.eq("requester_id", filter.requesterId);
      if (filter.ownerId) query = query.eq("owner_id", filter.ownerId);
      if (filter.listingId) query = query.eq("listing_id", filter.listingId);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as (RequestRow & RequestJoins)[]).map(toRequest);
    },

    async get(id: string): Promise<RentalRequest | null> {
      if (!isUuid(id)) return null;
      const { data, error } = await client
        .from("requests")
        .select(REQUEST_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toRequest(data as unknown as RequestRow & RequestJoins) : null;
    },

    async create(input: CreateRequestInput): Promise<RentalRequest> {
      const { data: listing, error: listingError } = await client
        .from("listings")
        .select("id, owner_id, terms, price_cents, deposit_cents")
        .eq("id", input.listingId)
        .single();
      if (listingError) throw listingError;
      if (listing.owner_id === input.requesterId) {
        throw new Error("You cannot request your own listing.");
      }

      const isPaid = listing.terms === "rent";
      const priceCents = isPaid ? listing.price_cents : null;
      const depositCents = isPaid ? listing.deposit_cents : null;

      const { data, error } = await client
        .from("requests")
        .insert({
          listing_id: listing.id,
          requester_id: input.requesterId,
          owner_id: listing.owner_id,
          status: "pending",
          message: input.message ?? null,
          start_date: input.startDate,
          end_date: input.endDate,
          agreed_price_cents: priceCents,
          agreed_deposit_cents: depositCents,
        })
        .select(REQUEST_SELECT)
        .single();
      if (error) throw error;

      const row = data as unknown as RequestRow & RequestJoins;
      let paymentStatus: PaymentIntentStatus | null = null;

      if (isPaid && ((priceCents ?? 0) > 0 || (depositCents ?? 0) > 0)) {
        // Funds are "held" immediately (simulated). Phase 3 replaces this with a
        // real Stripe payment intent behind the same PaymentsProvider interface.
        const { error: paymentError } = await client.from("transactions").insert({
          request_id: row.id,
          provider: "mock",
          status: "authorized",
          amount_cents: priceCents ?? 0,
          deposit_cents: depositCents ?? 0,
        });
        if (paymentError) throw paymentError;
        paymentStatus = "authorized";
      }

      return { ...toRequest(row), paymentStatus };
    },

    approve: (id) => transition(id, "approved"),
    decline: (id) => transition(id, "declined", "cancelled"),
    activate: (id) => transition(id, "active", "captured"),
    markReturned: (id) => transition(id, "returned", "released"),
    cancel: (id) => transition(id, "cancelled", "cancelled"),
  };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function createReviewsRepository(
  client: Client,
  requests: RequestsStore,
): ReviewsRepository {
  return {
    async listForUser(userId: string): Promise<Review[]> {
      const { data, error } = await client
        .from("reviews")
        .select("*")
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toReview);
    },

    async listForRequest(requestId: string): Promise<Review[]> {
      const { data, error } = await client
        .from("reviews")
        .select("*")
        .eq("request_id", requestId);
      if (error) throw error;
      return (data ?? []).map(toReview);
    },

    async hasReviewed(requestId: string, reviewerId: string): Promise<boolean> {
      const { data, error } = await client
        .from("reviews")
        .select("id")
        .eq("request_id", requestId)
        .eq("reviewer_id", reviewerId)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },

    async create(input: CreateReviewInput): Promise<Review> {
      // Fail fast with a readable message; RLS enforces the same rule server-side.
      const request = await requests.get(input.requestId);
      if (!request) throw new Error("Borrow not found.");
      if (request.status !== "returned") {
        throw new Error("You can only review a completed borrow.");
      }
      if (input.reviewerId !== request.requesterId && input.reviewerId !== request.ownerId) {
        throw new Error("Only the two parties can review this borrow.");
      }
      if (await this.hasReviewed(input.requestId, input.reviewerId)) {
        throw new Error("You have already reviewed this borrow.");
      }

      const revieweeId =
        input.reviewerId === request.requesterId ? request.ownerId : request.requesterId;

      const { data, error } = await client
        .from("reviews")
        .insert({
          request_id: input.requestId,
          reviewer_id: input.reviewerId,
          reviewee_id: revieweeId,
          rating: input.rating,
          comment: input.comment?.trim() ? input.comment.trim() : null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return toReview(data);
    },
  };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export function createMessagesRepository(client: Client): MessagesRepository {
  const THREAD_SELECT = "*, listing:listings(title)";

  async function previews(userId: string): Promise<ThreadPreview[]> {
    const { data, error } = await client
      .from("threads")
      .select(THREAD_SELECT)
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const threads = (data as unknown as (ThreadRow & { listing: { title: string } | null })[]) ?? [];
    if (threads.length === 0) return [];

    const { data: messages, error: messageError } = await client
      .from("messages")
      .select("*")
      .in(
        "thread_id",
        threads.map((thread) => thread.id),
      )
      .order("created_at", { ascending: true });
    if (messageError) throw messageError;

    const byThread = new Map<string, Message[]>();
    for (const message of (messages ?? []).map(toMessage)) {
      const list = byThread.get(message.threadId) ?? [];
      list.push(message);
      byThread.set(message.threadId, list);
    }

    return threads.map((row) => {
      const thread = toThread(row);
      const threadMessages = byThread.get(thread.id) ?? [];
      return {
        thread,
        otherParticipantId:
          thread.participantA === userId ? thread.participantB : thread.participantA,
        lastMessage: threadMessages.at(-1) ?? null,
        unreadCount: threadMessages.filter(
          (message) => message.senderId !== userId && message.readAt === null,
        ).length,
      };
    });
  }

  return {
    listThreads: (userId) => previews(userId),

    async getThread(threadId: string): Promise<Thread | null> {
      if (!isUuid(threadId)) return null;
      const { data, error } = await client
        .from("threads")
        .select(THREAD_SELECT)
        .eq("id", threadId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? toThread(data as unknown as ThreadRow & { listing: { title: string } | null })
        : null;
    },

    async listMessages(threadId: string): Promise<Message[]> {
      const { data, error } = await client
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(toMessage);
    },

    async sendMessage(input: SendMessageInput): Promise<Message> {
      const body = input.body.trim();
      if (!body) throw new Error("Message cannot be empty.");

      const { data, error } = await client
        .from("messages")
        .insert({ thread_id: input.threadId, sender_id: input.senderId, body })
        .select("*")
        .single();
      if (error) throw error;

      await client
        .from("threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", input.threadId);

      return toMessage(data);
    },

    async markRead(threadId: string, userId: string): Promise<void> {
      const { error } = await client
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("thread_id", threadId)
        .neq("sender_id", userId)
        .is("read_at", null);
      if (error) throw error;
    },

    async getOrCreateThread(input: CreateThreadInput): Promise<Thread> {
      if (input.participantA === input.participantB) {
        throw new Error("You cannot message yourself.");
      }

      const listingId = input.context?.listingId ?? null;

      const { data: existing, error: existingError } = await client
        .from("threads")
        .select(THREAD_SELECT)
        .or(
          `and(participant_a.eq.${input.participantA},participant_b.eq.${input.participantB}),and(participant_a.eq.${input.participantB},participant_b.eq.${input.participantA})`,
        );
      if (existingError) throw existingError;

      const match = (
        existing as unknown as (ThreadRow & { listing: { title: string } | null })[] | null
      )?.find((row) => !listingId || row.listing_id === listingId);
      if (match) return toThread(match);

      const { data, error } = await client
        .from("threads")
        .insert({
          participant_a: input.participantA,
          participant_b: input.participantB,
          listing_id: listingId,
          request_id: input.context?.requestId ?? null,
        })
        .select(THREAD_SELECT)
        .single();
      if (error) throw error;
      return toThread(data as unknown as ThreadRow & { listing: { title: string } | null });
    },

    async unreadCount(userId: string): Promise<number> {
      const list = await previews(userId);
      return list.reduce((total, preview) => total + preview.unreadCount, 0);
    },
  };
}

// ---------------------------------------------------------------------------
// Social feed
// ---------------------------------------------------------------------------

export function createSocialRepository(client: Client, viewerId: string | null): SocialRepository {
  // Populated by listFeed so a single page render doesn't fan out into N queries.
  let cachedCounts: Map<string, number> | null = null;
  let cachedLikes: Set<string> | null = null;

  return {
    async listFeed(): Promise<FeedPost[]> {
      const { data, error } = await client
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const posts = (data ?? []) as PostRow[];
      const ids = posts.map((post) => post.id);
      const counts = new Map<string, number>();
      const commentCounts = new Map<string, number>();
      const likes = new Set<string>();

      if (ids.length > 0) {
        const [{ data: reactions }, { data: comments }] = await Promise.all([
          client.from("reactions").select("post_id, user_id").in("post_id", ids),
          client.from("comments").select("post_id").in("post_id", ids),
        ]);

        for (const reaction of reactions ?? []) {
          counts.set(reaction.post_id, (counts.get(reaction.post_id) ?? 0) + 1);
          if (viewerId && reaction.user_id === viewerId) likes.add(reaction.post_id);
        }
        for (const comment of comments ?? []) {
          commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) ?? 0) + 1);
        }
      }

      cachedCounts = counts;
      cachedLikes = likes;

      return posts.map((post) =>
        toPost(post, counts.get(post.id) ?? 0, commentCounts.get(post.id) ?? 0),
      );
    },

    async getPost(postId: string): Promise<FeedPost | null> {
      if (!isUuid(postId)) return null;
      const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const [{ count: reactions }, { count: comments }] = await Promise.all([
        client.from("reactions").select("post_id", { count: "exact", head: true }).eq("post_id", postId),
        client.from("comments").select("id", { count: "exact", head: true }).eq("post_id", postId),
      ]);

      return toPost(data, reactions ?? 0, comments ?? 0);
    },

    async createPost(input: CreatePostInput): Promise<FeedPost> {
      const body = input.body.trim();
      if (!body) throw new Error("Post cannot be empty.");

      const { data: city } = await client.from("cities").select("id").limit(1).maybeSingle();

      const { data, error } = await client
        .from("posts")
        .insert({
          author_id: input.authorId,
          body,
          visibility: input.visibility,
          listing_id: input.listingId ?? null,
          city_id: city?.id ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;

      cachedCounts = null;
      cachedLikes = null;
      return toPost(data, 0, 0);
    },

    async deletePost(postId: string, authorId: string): Promise<void> {
      const { error } = await client
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", authorId);
      if (error) throw error;
      cachedCounts = null;
      cachedLikes = null;
    },

    async listComments(postId: string): Promise<Comment[]> {
      if (!isUuid(postId)) return [];
      const { data, error } = await client
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(toComment);
    },

    async addComment(input: CreateCommentInput): Promise<Comment> {
      const body = input.body.trim();
      if (!body) throw new Error("Comment cannot be empty.");

      const { data, error } = await client
        .from("comments")
        .insert({ post_id: input.postId, author_id: input.authorId, body })
        .select("*")
        .single();
      if (error) throw error;
      return toComment(data);
    },

    async deleteComment(commentId: string, authorId: string): Promise<void> {
      const { error } = await client
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("author_id", authorId);
      if (error) throw error;
    },

    async reactionCount(postId: string): Promise<number> {
      if (cachedCounts?.has(postId)) return cachedCounts.get(postId) ?? 0;
      const { count, error } = await client
        .from("reactions")
        .select("post_id", { count: "exact", head: true })
        .eq("post_id", postId);
      if (error) throw error;
      return count ?? 0;
    },

    async hasLiked(postId: string, userId: string): Promise<boolean> {
      if (cachedLikes && viewerId === userId) return cachedLikes.has(postId);
      const { data, error } = await client
        .from("reactions")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },

    async toggleLike(postId: string, userId: string): Promise<boolean> {
      const { data: existing, error } = await client
        .from("reactions")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;

      if (existing) {
        const { error: deleteError } = await client
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (deleteError) throw deleteError;
        cachedCounts = null;
        cachedLikes = null;
        return false;
      }

      const { error: insertError } = await client
        .from("reactions")
        .insert({ post_id: postId, user_id: userId, kind: "like" });
      if (insertError) throw insertError;
      cachedCounts = null;
      cachedLikes = null;
      return true;
    },
  };
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------

export interface SupabaseStores {
  listings: ListingsRepository;
  requests: RequestsStore;
  reviews: ReviewsRepository;
  messages: MessagesRepository;
  social: SocialRepository;
}

export function createSupabaseStores(client: Client, viewerId: string | null): SupabaseStores {
  const listings = createListingsRepository(client);
  const requests = createRequestsStore(client);

  return {
    listings,
    requests,
    reviews: createReviewsRepository(client, requests),
    messages: createMessagesRepository(client),
    social: createSocialRepository(client, viewerId),
  };
}

export type { ListingOwnerJoin };
