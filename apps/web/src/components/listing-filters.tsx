"use client";

import { CATEGORIES, LISTING_TYPES } from "@handimen/core";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { localePath } from "@/lib/format";

export interface FilterDefaults {
  q?: string;
  category?: string;
  terms?: string;
  type?: string;
}

export function ListingFilters({
  locale,
  defaults,
}: {
  locale: string;
  defaults: FilterDefaults;
}) {
  const t = useTranslations("explore");
  const tCategories = useTranslations("categories");

  return (
    <form
      action={localePath(locale, "/explore")}
      method="get"
      className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <Label htmlFor="q">{t("search")}</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="q"
            name="q"
            defaultValue={defaults.q ?? ""}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">{t("category")}</Label>
        <Select id="category" name="category" defaultValue={defaults.category ?? ""}>
          <option value="">{t("anyCategory")}</option>
          {CATEGORIES.map((category) => (
            <option key={category.key} value={category.key}>
              {tCategories(category.key)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="terms">{t("terms")}</Label>
        <Select id="terms" name="terms" defaultValue={defaults.terms ?? ""}>
          <option value="">{t("anyTerms")}</option>
          <option value="free">{t("freeOnly")}</option>
          <option value="rent">{t("rentOnly")}</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">{t("type")}</Label>
        <Select id="type" name="type" defaultValue={defaults.type ?? ""}>
          <option value="">{t("anyType")}</option>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
        <Button type="submit" size="sm">
          {t("apply")}
        </Button>
        <Button type="button" size="sm" variant="ghost" asChild>
          <Link href="/explore">{t("reset")}</Link>
        </Button>
      </div>
    </form>
  );
}
