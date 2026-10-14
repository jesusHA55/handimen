"use client";

import type { FeedPost, ListingOwner } from "@handimen/core";
import { MessageSquare, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { LikeButton } from "@/components/like-button";
import { TrustBadge } from "@/components/trust-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { deletePostAction } from "@/lib/actions";
import { formatRelativeTime } from "@/lib/format";

export function FeedPostCard({
  post,
  author,
  liked,
  isMine,
  locale,
}: {
  post: FeedPost;
  author: ListingOwner | null;
  liked: boolean;
  isMine: boolean;
  locale: string;
}) {
  const t = useTranslations("feed");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-muted" aria-hidden>
            {author?.avatarEmoji ?? "🙂"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{author?.displayName ?? "?"}</span>
            {author ? <TrustBadge tier={author.trustTier} /> : null}
          </div>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt, locale)}
          </span>
        </div>

        <p className="whitespace-pre-line text-sm">{post.body}</p>

        {post.listingId ? (
          <p className="text-xs text-muted-foreground">
            {t("commentedOn")}{" "}
            <Link href={`/listings/${post.listingId}`} className="text-primary hover:underline">
              {t("attachedListing")}
            </Link>
          </p>
        ) : null}

        <div className="flex items-center gap-1">
          <LikeButton postId={post.id} count={post.reactionCount} liked={liked} locale={locale} />

          <Button size="sm" variant="ghost" asChild>
            <Link href={`/posts/${post.id}`}>
              <MessageSquare className="size-4" aria-hidden />
              {post.commentCount}
            </Link>
          </Button>

          {isMine ? (
            <form
              action={deletePostAction}
              className="ml-auto"
              onSubmit={(event) => {
                if (!window.confirm(t("confirmDelete"))) event.preventDefault();
              }}
            >
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="postId" value={post.id} />
              <Button type="submit" size="sm" variant="ghost" aria-label={t("delete")}>
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </form>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
