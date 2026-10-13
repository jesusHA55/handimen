import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startThreadAction } from "@/lib/actions";

/** Server component: opens (or reuses) a conversation with the listing owner. */
export function StartThreadForm({
  ownerId,
  listingId,
  listingTitle,
  locale,
  label,
}: {
  ownerId: string;
  listingId: string;
  listingTitle: string;
  locale: string;
  label: string;
}) {
  return (
    <form action={startThreadAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="ownerId" value={ownerId} />
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="listingTitle" value={listingTitle} />
      <Button type="submit" variant="outline" size="sm" className="w-full">
        <MessageSquare className="size-4" aria-hidden />
        {label}
      </Button>
    </form>
  );
}
