import { POBLENOU_CITY_ID } from "../listings/seed";

import { SEED_POSTS } from "./seed";
import type {
  Comment,
  CreateCommentInput,
  CreatePostInput,
  FeedPost,
  SocialRepository,
} from "./types";

/**
 * In-memory social feed — kept as a reference implementation and test double
 * alongside the Supabase-backed repository the app actually uses.
 */
export class MockSocialRepository implements SocialRepository {
  private readonly posts = new Map<string, FeedPost>();
  private readonly likes = new Map<string, Set<string>>();
  private readonly comments = new Map<string, Comment[]>();

  constructor(posts: FeedPost[] = SEED_POSTS) {
    for (const post of posts) this.posts.set(post.id, post);
  }

  async listFeed(): Promise<FeedPost[]> {
    return [...this.posts.values()]
      .map((post) => this.withCounts(post))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPost(postId: string): Promise<FeedPost | null> {
    const post = this.posts.get(postId);
    return post ? this.withCounts(post) : null;
  }

  async createPost(input: CreatePostInput): Promise<FeedPost> {
    const body = input.body.trim();
    if (!body) throw new Error("Post cannot be empty.");

    const post: FeedPost = {
      id: `post_${crypto.randomUUID()}`,
      authorId: input.authorId,
      body,
      listingId: input.listingId ?? null,
      cityId: POBLENOU_CITY_ID,
      visibility: input.visibility,
      reactionCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.posts.set(post.id, post);
    return post;
  }

  async deletePost(postId: string, authorId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) return;
    if (post.authorId !== authorId) throw new Error("Only the author can delete this post.");
    this.posts.delete(postId);
    this.comments.delete(postId);
    this.likes.delete(postId);
  }

  async listComments(postId: string): Promise<Comment[]> {
    return [...(this.comments.get(postId) ?? [])].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  async addComment(input: CreateCommentInput): Promise<Comment> {
    const body = input.body.trim();
    if (!body) throw new Error("Comment cannot be empty.");

    const comment: Comment = {
      id: `comment_${crypto.randomUUID()}`,
      postId: input.postId,
      authorId: input.authorId,
      body,
      createdAt: new Date().toISOString(),
    };

    this.comments.set(input.postId, [...(this.comments.get(input.postId) ?? []), comment]);
    return comment;
  }

  async deleteComment(commentId: string, authorId: string): Promise<void> {
    for (const [postId, list] of this.comments) {
      const target = list.find((comment) => comment.id === commentId);
      if (!target) continue;
      if (target.authorId !== authorId) throw new Error("Only the author can delete this.");
      this.comments.set(
        postId,
        list.filter((comment) => comment.id !== commentId),
      );
      return;
    }
  }

  async reactionCount(postId: string): Promise<number> {
    const post = this.posts.get(postId);
    if (!post) return 0;
    return post.reactionCount + (this.likes.get(postId)?.size ?? 0);
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

  private withCounts(post: FeedPost): FeedPost {
    return {
      ...post,
      reactionCount: post.reactionCount + (this.likes.get(post.id)?.size ?? 0),
      commentCount: this.comments.get(post.id)?.length ?? post.commentCount,
    };
  }
}
