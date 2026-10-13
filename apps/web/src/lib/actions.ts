"use server";

import {
  CURRENT_USER_ID,
  getListingsRepository,
  getRequestsStore,
  getSocialRepository,
  listingGate,
  type ListingOwner,
  type ListingTerms,
  type ListingType,
  type TrustSignals,
} from "@handimen/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { localePath } from "@/lib/format";

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
  const listings = getListingsRepository();
  const owner = await listings.getOwner(CURRENT_USER_ID);

  const terms = (str(formData, "terms") || "free") as ListingTerms;
  const gate = listingGate(terms, toSignals(owner));
  if (!gate.allowed) {
    return { ok: false, errorCode: gate.reason ?? "not_allowed", requiresPhone: gate.requiresPhoneVerification };
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
  const lat = Number.parseFloat(str(formData, "lat")) || 41.4005;
  const lng = Number.parseFloat(str(formData, "lng")) || 2.1975;

  const listing = await listings.create({
    ownerId: CURRENT_USER_ID,
    type,
    terms,
    category,
    title,
    description,
    priceCents: terms === "rent" && priceEuros !== null ? priceEuros * 100 : null,
    priceUnit: (str(formData, "priceUnit") || "day") as "hour" | "day" | "week",
    depositCents: terms === "rent" && depositEuros !== null ? depositEuros * 100 : null,
    lat,
    lng,
  });

  revalidatePath("/", "layout");
  redirect(localePath(locale, `/listings/${listing.id}`));
}

export async function createRequestAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const listingId = str(formData, "listingId");
  const startDate = str(formData, "startDate");
  const endDate = str(formData, "endDate");

  const store = getRequestsStore();
  await store.create({
    listingId,
    requesterId: CURRENT_USER_ID,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    message: str(formData, "message") || undefined,
  });

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/requests"));
}

export async function advanceRequestAction(formData: FormData) {
  const locale = str(formData, "locale") || "es";
  const id = str(formData, "requestId");
  const action = str(formData, "requestAction");
  const store = getRequestsStore();

  if (action === "approve") await store.approve(id);
  else if (action === "decline") await store.decline(id);
  else if (action === "activate") await store.activate(id);
  else if (action === "return") await store.markReturned(id);
  else if (action === "cancel") await store.cancel(id);

  revalidatePath("/", "layout");
  redirect(localePath(locale, "/requests"));
}

export async function toggleLikeAction(formData: FormData) {
  const postId = str(formData, "postId");
  await getSocialRepository().toggleLike(postId, CURRENT_USER_ID);
  revalidatePath("/", "layout");
}

export async function verifyPhoneAction() {
  await getListingsRepository().verifyPhone(CURRENT_USER_ID);
  revalidatePath("/", "layout");
}
