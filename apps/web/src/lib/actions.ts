"use server";

import {
  listingGate,
  type ListingOwner,
  type ListingTerms,
  type ListingType,
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

export async function createListingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = str(formData, "locale") || "es";
  const { listings, userId, owner } = await getStores();

  const terms = (str(formData, "terms") || "free") as ListingTerms;
  const gate = listingGate(terms, toSignals(owner));
  if (!gate.allowed) {
    return {
      ok: false,
      errorCode: gate.reason ?? "not_allowed",
      requiresPhone: gate.requiresPhoneVerification,
    };
  }

  const type = (str(formData, "type") || "tool") as ListingType;
  const title = str(formData, "title");
  const description = str(formData, "description");
  const category = str(formData, "category") || "power_tools";
  if (title.length < 3 || !description) {
    return { ok: false, errorCode: "invalid_fields" };
  }

  const priceEuros = intOrNull(formData, "priceEuros");
  const depositEuros = intOrNull(formData, "depositEuros");

  const listing = await listings.create({
    ownerId: userId,
    type,
    terms,
    category,
    title,
    description,
    priceCents: terms === "rent" && priceEuros !== null ? priceEuros * 100 : null,
    priceUnit: (str(formData, "priceUnit") || "day") as "hour" | "day" | "week",
    depositCents: terms === "rent" && depositEuros !== null ? depositEuros * 100 : null,
    lat: Number.parseFloat(str(formData, "lat")) || 41.4005,
    lng: Number.parseFloat(str(formData, "lng")) || 2.1975,
  });

  revalidatePath("/", "layout");
  redirect(localePath(locale, `/listings/${listing.id}`));
}

export async function createRequestAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { requests, listings, messages, userId } = await getStores();

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
  const { social, userId } = await getStores();
  await social.toggleLike(str(formData, "postId"), userId);
  revalidatePath("/", "layout");
}

export async function verifyPhoneAction() {
  const { listings, userId } = await getStores();
  await listings.verifyPhone(userId);
  revalidatePath("/", "layout");
}

export async function startThreadAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const { messages, userId } = await getStores();
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
  const { messages, userId } = await getStores();
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
  const { reviews, userId } = await getStores();
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

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
