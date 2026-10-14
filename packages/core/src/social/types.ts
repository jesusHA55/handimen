export type PostVisibility = "public" | "city" | "group" | "followers";

export interface FeedPost {
  id: string;
  authorId: string;
  body: string;
  listingId: string | null;
  cityId: string;
  visibility: PostVisibility;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface CreatePostInput {
  authorId: string;
  body: string;
  visibility: PostVisibility;
  listingId?: string | null;
}

export interface CreateCommentInput {
  postId: string;
  authorId: string;
  body: string;
}

/** Both the in-memory demo repo and the Supabase implementation satisfy this. */
export interface SocialRepository {
  listFeed(): Promise<FeedPost[]>;
  getPost(postId: string): Promise<FeedPost | null>;
  createPost(input: CreatePostInput): Promise<FeedPost>;
  deletePost(postId: string, authorId: string): Promise<void>;

  listComments(postId: string): Promise<Comment[]>;
  addComment(input: CreateCommentInput): Promise<Comment>;
  deleteComment(commentId: string, authorId: string): Promise<void>;

  reactionCount(postId: string): Promise<number>;
  hasLiked(postId: string, userId: string): Promise<boolean>;
  toggleLike(postId: string, userId: string): Promise<boolean>;
}
