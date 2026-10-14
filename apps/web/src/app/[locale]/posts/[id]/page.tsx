import { ArrowLeft, Trash2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LikeButton } from "@/components/like-button";
import { TrustBadge } from "@/components/trust-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { addCommentAction, deleteCommentAction } from "@/lib/actions";
import { formatRelativeTime } from "@/lib/format";
import { getStores } from "@/lib/stores";

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const { social, listings, userId } = await getStores();
  const post = await social.getPost(id);
  if (!post) notFound();

  const [author, comments, liked] = await Promise.all([
    listings.getOwner(post.authorId),
    social.listComments(id),
    userId ? social.hasLiked(id, userId) : Promise.resolve(false),
  ]);

  const commenters = await listings.getOwners(comments.map((comment) => comment.authorId));
  const commenterMap = new Map(commenters.map((commenter) => [commenter.id, commenter]));

  const t = await getTranslations("feed");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToFeed")}
      </Link>

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

          <p className="whitespace-pre-line">{post.body}</p>

          {post.listingId ? (
            <p className="text-xs text-muted-foreground">
              {t("commentedOn")}{" "}
              <Link href={`/listings/${post.listingId}`} className="text-primary hover:underline">
                {t("attachedListing")}
              </Link>
            </p>
          ) : null}

          <LikeButton postId={post.id} count={post.reactionCount} liked={liked} locale={locale} />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          {t("comments")} · {comments.length}
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noComments")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {comments.map((comment) => {
              const commenter = commenterMap.get(comment.authorId);
              return (
                <li key={comment.id}>
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm" aria-hidden>
                      {commenter?.avatarEmoji ?? "🙂"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {commenter?.displayName ?? "?"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.createdAt, locale)}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-sm">{comment.body}</p>
                    </div>
                    {userId === comment.authorId ? (
                      <form action={deleteCommentAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="postId" value={post.id} />
                        <input type="hidden" name="commentId" value={comment.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {userId ? (
          <form action={addCommentAction} className="flex flex-col gap-2">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="postId" value={post.id} />
            <Textarea name="body" required maxLength={1000} placeholder={t("commentPlaceholder")} />
            <Button type="submit" size="sm" className="self-end">
              {t("comment")}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">{t("signInToPost")}</p>
        )}
      </section>
    </div>
  );
}
