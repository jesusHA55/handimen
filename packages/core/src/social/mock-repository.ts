import { POBLENOU_CITY_ID } from "../listings/seed";

import type { FeedPost } from "./types";

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const SEED_POSTS: FeedPost[] = [
  {
    id: "post_1",
    authorId: "profile_marta",
    body: "¿Alguien tiene un nivel láser? Necesito colgar unos cuadros y no me fío de mi pulso. 🙃",
    listingId: null,
    cityId: POBLENOU_CITY_ID,
    visibility: "city",
    reactionCount: 4,
    commentCount: 2,
    createdAt: hoursAgo(3),
  },
  {
    id: "post_2",
    authorId: "profile_sam",
    body: "Acabo de subir mi bici de carga al barrio. ¡Que no os dé miedo pedírmela para la compra del sábado!",
    listingId: "listing_bici_cargo",
    cityId: POBLENOU_CITY_ID,
    visibility: "city",
    reactionCount: 11,
    commentCount: 5,
    createdAt: hoursAgo(7),
  },
  {
    id: "post_3",
    authorId: "profile_nuria",
    body: "Gracias a Jordi por dejarme el proyector para el cine de verano en la azotea. Repetimos seguro. 🍿",
    listingId: "listing_proyector",
    cityId: POBLENOU_CITY_ID,
    visibility: "city",
    reactionCount: 18,
    commentCount: 3,
    createdAt: hoursAgo(26),
  },
  {
    id: "post_4",
    authorId: "profile_ainhoa",
    body: "Busco escalera para pintar el pasillo este finde. Devuelvo con un brownie casero de propina. 🍫",
    listingId: null,
    cityId: POBLENOU_CITY_ID,
    visibility: "city",
    reactionCount: 7,
    commentCount: 4,
    createdAt: hoursAgo(40),
  },
];

/**
 * In-memory social feed. Likes are tracked per user so the demo "like" button
 * behaves like the real thing.
 */
export class MockSocialRepository {
  private readonly posts = new Map<string, FeedPost>();
  private readonly likes = new Map<string, Set<string>>();

  constructor(posts: FeedPost[] = SEED_POSTS) {
    for (const post of posts) this.posts.set(post.id, post);
  }

  async listFeed(): Promise<FeedPost[]> {
    return [...this.posts.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async reactionCount(postId: string): Promise<number> {
    const post = this.posts.get(postId);
    if (!post) return 0;
    const extra = this.likes.get(postId);
    if (!extra) return post.reactionCount;
    return post.reactionCount + extra.size;
  }

  async hasLiked(postId: string, userId: string): Promise<boolean> {
    return this.likes.get(postId)?.has(userId) ?? false;
  }

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const set = this.likes.get(postId) ?? new Set<string>();
    const liked = set.has(userId);
    if (liked) set.delete(userId);
    else set.add(userId);
    this.likes.set(postId, set);
    return !liked;
  }
}

const globalStore = globalThis as unknown as { __handimenSocial?: MockSocialRepository };

export function getSocialRepository(): MockSocialRepository {
  globalStore.__handimenSocial ??= new MockSocialRepository();
  return globalStore.__handimenSocial;
}
