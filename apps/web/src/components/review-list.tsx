"use client";

import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/format";

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  reviewerEmoji: string;
}

export function ReviewList({ items }: { items: ReviewItem[] }) {
  const t = useTranslations("review");
  const locale = useLocale();

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card>
            <CardContent className="flex flex-col gap-2 pt-5">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-muted" aria-hidden>
                  {item.reviewerEmoji}
                </span>
                <span className="text-sm font-medium">{item.reviewerName}</span>
                <span className="flex items-center gap-0.5 text-accent" aria-label={`${item.rating}/5`}>
                  {Array.from({ length: item.rating }, (_, index) => (
                    <Star key={index} className="size-3.5 fill-current" aria-hidden />
                  ))}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatRelativeTime(item.createdAt, locale)}
                </span>
              </div>
              {item.comment ? <p className="text-sm">{item.comment}</p> : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
