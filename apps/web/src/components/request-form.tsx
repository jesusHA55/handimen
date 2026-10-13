"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { createRequestAction } from "@/lib/actions";

function toDateInput(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export function RequestForm({ listingId }: { listingId: string }) {
  const t = useTranslations("request");
  const locale = useLocale();

  return (
    <form action={createRequestAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="listingId" value={listingId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("startDate")}>
          <Input name="startDate" type="date" defaultValue={toDateInput(0)} required />
        </Field>
        <Field label={t("endDate")}>
          <Input name="endDate" type="date" defaultValue={toDateInput(1)} required />
        </Field>
      </div>

      <Field label={t("message")}>
        <Textarea name="message" maxLength={1000} placeholder={t("messagePlaceholder")} />
      </Field>

      <Button type="submit">{t("submit")}</Button>
    </form>
  );
}
