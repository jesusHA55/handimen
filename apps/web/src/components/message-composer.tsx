"use client";

import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { sendMessageAction } from "@/lib/actions";

export function MessageComposer({ threadId }: { threadId: string }) {
  const t = useTranslations("messages");
  const locale = useLocale();

  return (
    <form action={sendMessageAction} className="flex flex-col gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="threadId" value={threadId} />
      <Textarea
        name="body"
        required
        maxLength={2000}
        placeholder={t("placeholder")}
        className="min-h-20"
      />
      <Button type="submit" size="sm" className="self-end">
        <Send className="size-4" aria-hidden />
        {t("send")}
      </Button>
    </form>
  );
}
