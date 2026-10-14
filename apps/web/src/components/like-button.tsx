import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toggleLikeAction } from "@/lib/actions";

export function LikeButton({
  postId,
  count,
  liked,
  locale,
}: {
  postId: string;
  count: number;
  liked: boolean;
  locale: string;
}) {
  return (
    <form action={toggleLikeAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="postId" value={postId} />
      <Button type="submit" size="sm" variant={liked ? "default" : "ghost"}>
        <Heart className={liked ? "size-4 fill-current" : "size-4"} aria-hidden />
        {count}
      </Button>
    </form>
  );
}
