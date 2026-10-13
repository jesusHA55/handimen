import { CURRENT_USER_ID, getListingsRepository, getMessagesStore } from "@handimen/core";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { MessageComposer } from "@/components/message-composer";
import { TrustBadge } from "@/components/trust-badge";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ locale: string; threadId: string }>;
}) {
  const { locale, threadId } = await params;
  setRequestLocale(locale);

  const store = getMessagesStore();
  const thread = await store.getThread(threadId);
  if (!thread) notFound();

  const isParticipant =
    thread.participantA === CURRENT_USER_ID || thread.participantB === CURRENT_USER_ID;
  if (!isParticipant) notFound();

  // Reading the thread clears its unread messages (mock read receipts).
  await store.markRead(threadId, CURRENT_USER_ID);

  const [messages, t] = await Promise.all([
    store.listMessages(threadId),
    getTranslations("messages"),
  ]);

  const otherId =
    thread.participantA === CURRENT_USER_ID ? thread.participantB : thread.participantA;
  const other = await getListingsRepository().getOwner(otherId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/messages"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToInbox")}
      </Link>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <span className="grid size-10 place-items-center rounded-full bg-muted text-xl" aria-hidden>
          {other?.avatarEmoji ?? "🙂"}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{other?.displayName ?? "?"}</span>
            {other ? <TrustBadge tier={other.trustTier} /> : null}
          </div>
          {thread.listingId ? (
            <Link
              href={`/listings/${thread.listingId}`}
              className="truncate text-xs text-muted-foreground hover:underline"
            >
              {t("about")}: {thread.listingTitle}
            </Link>
          ) : null}
        </div>
      </div>

      <ul className="flex flex-col gap-3 py-2">
        {messages.map((message) => {
          const mine = message.senderId === CURRENT_USER_ID;
          return (
            <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-card-foreground",
                )}
              >
                <p className="whitespace-pre-line">{message.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[11px]",
                    mine ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {formatRelativeTime(message.createdAt, locale)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <MessageComposer threadId={thread.id} />
    </div>
  );
}
