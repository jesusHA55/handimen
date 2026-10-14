"use server";

import {
  listingGate,
  type ListingOwner,
  type ListingTerms,
  type ListingType,
  type PostVisibility,
  type TrustSignals,
} from "@handimen/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { localePath } from "@/lib/format";
import { getStores } from "@/lib/stores";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface FormState {
  ok: boolean;
  errorCode?: string;
  requiresPhone?: boolean;
  requiresId?: boolean;
  /** Bumped on a successful post so the composer can remount and clear. */
  postedAt?: number;
}

function toSignals(owner: ListingOwner | null): TrustSignals {
  return {
    emailVerified: owner?.emailVerified ?? false,
    phoneVerified: owner?.phoneVerified ?? false,
    idVerified: owner?.trustTier === 2,
    completedHandoffs: owner?.completedHandoffs ?? 0,
    vouches: owner?.vouches ?? 0,
  };
}

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function intOrNull(formData: FormData, key: string): number | null {
  const raw = str(formData, key);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/** Writes need a member; send visitors to sign-in and come back. */
async function requireUserId(locale: string): Promise<string> {
  const { userId } = await getStores();
  if (!userId) redirect(localePath(locale, "/sign-in"));
  return userId;
}

export async function createListingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = str(formData, "locale") || "es";
  const { listings, owner } = await getStores();
  const userId = await requireUserId(locale);

  const terms = (str(formData, "terms") || "free") as ListingTerms;
  const priceEuros = intOrNull(formData, "priceEuros");
  const depositEuros = intOrNull(formData, "depositEuros");
  const depositCents = terms === "rent" && depositEuros !== null ? depositEuros * 100 : null;

  // The gate depends on price, so parse the numbers before checking it.
  const gate = listingGate({ terms, depositCents }, toSignals(owner));
  if (!gate.allowed) {
    return {
      ok: false,
      errorCode: gate.reason ?? "not_allowed",
      requiresPhone: gate.requiresPhoneVerification,
      requiresId: gate.requiresIdentityVerification,
    };
  }

  const type = (str(formData, "type") || "tool") as ListingType;
  const title = str(formData, "title");
  const description = str(formData, "description");
  const category = str(formData, "category") || "power_tools";
  if (title.length < 3 || !description) {
    return { ok: false, errorCode: "invalid_fields" };
  }

  const listing = await listings.create({
    ownerId: userId,
    type,
    terms,
    category,
    title,
    description,
    priceCents: terms === "rent" && priceEuros !== null ? priceEuros * 100 : null,
    priceUnit: (str(formData, "priceUnit") || "day") as "hour" | "day" | "week",
    depositCents,
    lat: Number.parseFloat(str(formData, "lat")) || 41.4005,
    lng: Number.parseFloat(str(formData, "lng")) || 2.1975,
  });

  revalidatePath("/", "layout");
  redirect(localePath(locale, `/listings/${listing.id}`));
}

export async function createRequestAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { listings, requests, messages } = await getStores();
  const userId = await requireUserId(locale);

  const listingId = str(formData, "listingId");
  const request = await requests.create({
    listingId,
    requesterId: userId,
    startDate: new Date(str(formData, "startDate")).toISOString(),
    endDate: new Date(str(formData, "endDate")).toISOString(),
    message: str(formData, "message") || undefined,
  });

  // Open a conversation with the owner so the two can arrange the handoff.
  const listing = await listings.get(listingId);
  if (listing) {
    await messages.getOrCreateThread({
      participantA: userId,
      participantB: listing.ownerId,
      context: { listingId: listing.id, listingTitle: listing.title, requestId: request.id },
    });
  }

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/requests"));
}

export async function advanceRequestAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { requests } = await getStores();
  await requireUserId(locale);

  const id = str(formData, "requestId");
  const action = str(formData, "requestAction");

  if (action === "approve") await requests.approve(id);
  else if (action === "decline") await requests.decline(id);
  else if (action === "activate") await requests.activate(id);
  else if (action === "return") await requests.markReturned(id);
  else if (action === "cancel") await requests.cancel(id);

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/requests"));
}

export async function toggleLikeAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { social } = await getStores();
  const userId = await requireUserId(locale);

  await social.toggleLike(str(formData, "postId"), userId);
  revalidatePath("/", "layout");
}

// --- Bulletin board -------------------------------------------------------

export async function createPostAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = str(formData, "locale") || "es";
  const { social } = await getStores();
  const userId = await requireUserId(locale);

  const body = str(formData, "body");
  if (!body) return { ok: false, errorCode: "post_empty" };

  const visibility = (str(formData, "visibility") || "city") as PostVisibility;

  await social.createPost({
    authorId: userId,
    body,
    visibility,
    listingId: str(formData, "listingId") || null,
  });

  revalidatePath("/", "layout");
  return { ok: true, postedAt: Date.now() };
}

export async function deletePostAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { social } = await getStores();
  const userId = await requireUserId(locale);

  await social.deletePost(str(formData, "postId"), userId);
  revalidatePath("/", "layout");
  redirect(localePath(locale, "/"));
}

export async function addCommentAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { social } = await getStores();
  const userId = await requireUserId(locale);

  const postId = str(formData, "postId");
  const body = str(formData, "body");
  if (body) {
    await social.addComment({ postId, authorId: userId, body });
  }

  revalidatePath("/", "layout");
  redirect(localePath(locale, `/posts/${postId}`));
}

export async function deleteCommentAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { social } = await getStores();
  const userId = await requireUserId(locale);

  const postId = str(formData, "postId");
  await social.deleteComment(str(formData, "commentId"), userId);

  revalidatePath("/", "layout");
  redirect(localePath(locale, `/posts/${postId}`));
}

export async function verifyPhoneAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const redirectTo = str(formData, "redirectTo") || "/profile";

  const { listings, userId } = await getStores();
  if (!userId) redirect(localePath(locale, "/sign-in"));

  await listings.verifyPhone(userId);
  revalidatePath("/", "layout");
  redirect(localePath(locale, redirectTo));
}

export async function verifyIdentityAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const redirectTo = str(formData, "redirectTo") || "/profile";

  const { listings, userId } = await getStores();
  if (!userId) redirect(localePath(locale, "/sign-in"));

  // Demo stand-in for an ID document check (Stripe Identity in Phase 3).
  await listings.verifyIdentity(userId);
  revalidatePath("/", "layout");
  redirect(localePath(locale, redirectTo));
}

export async function startThreadAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { messages } = await getStores();
  const userId = await requireUserId(locale);

  const ownerId = str(formData, "ownerId");
  if (!ownerId) return;

  const thread = await messages.getOrCreateThread({
    participantA: userId,
    participantB: ownerId,
    context: {
      listingId: str(formData, "listingId") || null,
      listingTitle: str(formData, "listingTitle") || null,
    },
  });

  revalidatePath("/", "layout");
  redirect(localePath(locale, `/messages/${thread.id}`));
}

export async function sendMessageAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { messages } = await getStores();
  const userId = await requireUserId(locale);

  const threadId = str(formData, "threadId");
  const body = str(formData, "body");
  if (body) {
    await messages.sendMessage({ threadId, senderId: userId, body });
  }

  revalidatePath("/", "layout");
  redirect(localePath(locale, `/messages/${threadId}`));
}

export async function createReviewAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { reviews } = await getStores();
  const userId = await requireUserId(locale);

  const rating = Number.parseInt(str(formData, "rating"), 10);
  await reviews.create({
    requestId: str(formData, "requestId"),
    reviewerId: userId,
    rating: Number.isFinite(rating) ? rating : 5,
    comment: str(formData, "comment") || null,
  });

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/requests"));
}

/**
 * Gives a brand-new member something to look at: a starter listing plus an
 * incoming request from a neighbour, so the escrow lifecycle is demoable
 * without needing a second human.
 */
export async function seedDemoContentAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { client, listings, requests, messages } = await getStores();
  const userId = await requireUserId(locale);

  const existing = await listings.list({ ownerId: userId });
  if (existing.length > 0) {
    redirect(localePath(locale, "/profile"));
  }

  const listing = await listings.create({
    ownerId: userId,
    type: "tool",
    terms: "rent",
    category: "power_tools",
    title: "Taladro ligero Makita",
    description:
      "Taladro ligero con batería y cargador. Lo alquilo por días para trabajos pequeños en casa. Recogida en la Rambla.",
    priceCents: 1000,
    priceUnit: "day",
    depositCents: 3000,
    lat: 41.4002,
    lng: 2.1985,
    photos: ["🛠️"],
  });

  const { data: neighbour } = await client
    .from("profiles")
    .select("id")
    .neq("id", userId)
    .limit(1)
    .maybeSingle();

  if (neighbour) {
    const start = new Date(Date.now() + 86_400_000);
    const end = new Date(Date.now() + 4 * 86_400_000);

    await requests.create({
      listingId: listing.id,
      requesterId: neighbour.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      message: "¡Hola! ¿Lo tendrías libre este finde? Es para montar una estantería.",
    });

    await messages.getOrCreateThread({
      participantA: userId,
      participantB: neighbour.id,
      context: { listingId: listing.id, listingTitle: listing.title },
    });

    await messages.sendMessage({
      threadId: (
        await messages.getOrCreateThread({
          participantA: userId,
          participantB: neighbour.id,
          context: { listingId: listing.id, listingTitle: listing.title },
        })
      ).id,
      senderId: neighbour.id,
      body: "¡Buenas! Te acabo de enviar una solicitud para el taladro. ¿Te va bien el sábado por la mañana?",
    });
  }

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/requests"));
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
