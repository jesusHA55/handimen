"use client";

import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { createPostAction, type FormState } from "@/lib/actions";

const initialState: FormState = { ok: true };

export interface ComposerListing {
  id: string;
  title: string;
}

export function PostComposer({ listings }: { listings: ComposerListing[] }) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(createPostAction, initialState);

  // Remounting on success is what clears the textarea — no effect needed.
  return (
    <form
      key={state.postedAt ?? 0}
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      <input type="hidden" name="locale" value={locale} />

      <Textarea
        name="body"
        required
        maxLength={2000}
        placeholder={t("placeholder")}
        className="min-h-20 border-0 bg-transparent px-0 focus-visible:ring-0"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("visibility")}>
          <Select name="visibility" defaultValue="city">
            <option value="city">{t("visibilityCity")}</option>
            <option value="followers">{t("visibilityFollowers")}</option>
          </Select>
        </Field>

        {listings.length > 0 ? (
          <Field label={t("attach")}>
            <Select name="listingId" defaultValue="">
              <option value="">{t("attachNone")}</option>
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
      </div>

      {state.errorCode ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {t(`error.${state.errorCode}` as "error.post_empty")}
        </p>
      ) : null}

      <Button type="submit" size="sm" className="self-end" disabled={pending}>
        <Send className="size-4" aria-hidden />
        {pending ? t("publishing") : t("publish")}
      </Button>
    </form>
  );
}
