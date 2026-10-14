import { POBLENOU_CITY_ID } from "../listings/seed";

import { SEED_POSTS } from "./seed";
import type { FeedPost } from "./types";

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
