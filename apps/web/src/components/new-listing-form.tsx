"use client";

import { CATEGORIES, LISTING_TYPES } from "@handimen/core";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { createListingAction, verifyPhoneAction, type FormState } from "@/lib/actions";

const initialState: FormState = { ok: true };
const PRICE_UNITS = ["hour", "day", "week"] as const;

export function NewListingForm() {
  const t = useTranslations("newListing");
  const tCategories = useTranslations("categories");
  const tExplore = useTranslations("explore");
  const tListing = useTranslations("listing");
  const locale = useLocale();
  const [terms, setTerms] = useState<"free" | "rent">("free");
  const [state, formAction, pending] = useActionState(createListingAction, initialState);

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("fields.type")}>
            <Select name="type" defaultValue="tool">
              {LISTING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tExplore(`types.${type}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("fields.terms")}>
            <Select
              name="terms"
              value={terms}
              onChange={(event) => setTerms(event.target.value as "free" | "rent")}
            >
              <option value="free">{t("termsFree")}</option>
              <option value="rent">{t("termsRent")}</option>
            </Select>
          </Field>
        </div>

        <Field label={t("fields.category")}>
          <Select name="category" defaultValue="power_tools">
            {CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {tCategories(category.key)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("fields.title")}>
          <Input name="title" maxLength={120} required />
        </Field>

        <Field label={t("fields.description")}>
          <Textarea name="description" maxLength={2000} required />
        </Field>

        {terms === "rent" ? (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t("fields.price")}>
              <Input name="priceEuros" type="number" min={1} step={1} defaultValue={5} />
            </Field>
            <Field label={t("fields.priceUnit")}>
              <Select name="priceUnit" defaultValue="day">
                {PRICE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {tListing(`units.${unit}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("fields.deposit")}>
              <Input name="depositEuros" type="number" min={0} step={1} defaultValue={0} />
            </Field>
          </div>
        ) : null}

        <Field label={t("fields.pickup")} hint={t("pickupHint")}>
          <Input name="pickupLabel" placeholder="Rambla del Poblenou" />
        </Field>

        {state.errorCode ? (
          <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {t(`errors.${state.errorCode}` as "errors.invalid_fields")}
          </p>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {t("submit")}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/explore">{t("cancel")}</Link>
          </Button>
        </div>
      </form>

      {state.requiresPhone ? (
        <form action={verifyPhoneAction} className="rounded-lg border border-border bg-muted/40 p-4">
          <Button type="submit" variant="accent" size="sm">
            {t("verifyPhone")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
