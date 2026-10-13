import { CURRENT_USER_ID, getListingsRepository, getMessagesStore } from "@handimen/core";
import { MessageSquare } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/format";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("messages");
  const previews = await getMessagesStore().listThreads(CURRENT_USER_ID);

  const owners = await getListingsRepository().getOwners(
    previews.map((preview) => preview.otherParticipantId),
  );
  const ownerMap = new Map(owners.map((owner) => [owner.id, owner]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      {previews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {previews.map(({ thread, otherParticipantId, lastMessage, unreadCount }) => {
            const other = ownerMap.get(otherParticipantId);
            return (
              <li key={thread.id}>
                <Link href={`/messages/${thread.id}`} className="block">
                  <Card className="transition-colors hover:border-primary/50">
                    <CardContent className="flex items-start gap-3 pt-5">
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xl"
                        aria-hidden
                      >
                        {other?.avatarEmoji ?? "🙂"}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {other?.displayName ?? "?"}
                          </span>
                          {unreadCount > 0 ? (
                            <Badge variant="accent">{t("unread", { count: unreadCount })}</Badge>
                          ) : null}
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                            {lastMessage ? formatRelativeTime(lastMessage.createdAt, locale) : ""}
                          </span>
                        </div>

                        {thread.listingTitle ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {t("about")}: {thread.listingTitle}
                          </p>
                        ) : null}

                        {lastMessage ? (
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {lastMessage.senderId === CURRENT_USER_ID ? `${t("you")}: ` : ""}
                            {lastMessage.body}
                          </p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
