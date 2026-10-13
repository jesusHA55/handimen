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
