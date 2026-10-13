"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { createReviewAction } from "@/lib/actions";

const RATINGS = [5, 4, 3, 2, 1] as const;

export function ReviewForm({ requestId }: { requestId: string }) {
  const t = useTranslations("review");
  const locale = useLocale();

  return (
    <form
      action={createReviewAction}
      className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="requestId" value={requestId} />

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{t("leaveTitle")}</h3>
        <p className="text-xs text-muted-foreground">{t("leaveSubtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field label={t("rating")}>
          <Select name="rating" defaultValue="5">
            {RATINGS.map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)}{" "}
                {value}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("comment")}>
          <Textarea name="comment" maxLength={1000} placeholder={t("commentPlaceholder")} />
        </Field>
      </div>

      <Button type="submit" size="sm" className="self-start">
        {t("submit")}
      </Button>
    </form>
  );
}
