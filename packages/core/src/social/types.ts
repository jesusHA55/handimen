export interface FeedPost {
  id: string;
  authorId: string;
  body: string;
  listingId: string | null;
  cityId: string;
  visibility: "public" | "city" | "group" | "followers";
  reactionCount: number;
  commentCount: number;
  createdAt: string;
}

/** Both the in-memory demo repo and the Supabase implementation satisfy this. */
export interface SocialRepository {
  listFeed(): Promise<FeedPost[]>;
  reactionCount(postId: string): Promise<number>;
  hasLiked(postId: string, userId: string): Promise<boolean>;
  toggleLike(postId: string, userId: string): Promise<boolean>;
}
