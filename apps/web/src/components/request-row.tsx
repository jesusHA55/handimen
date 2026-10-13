"use client";

import type { RentalRequest } from "@handimen/core";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { advanceRequestAction } from "@/lib/actions";
import { formatCurrency, formatDate, type Locale } from "@/lib/format";

type Action = "approve" | "decline" | "activate" | "return" | "cancel";

function actionsFor(request: RentalRequest, role: "requester" | "owner"): {
  action: Action;
  variant: "default" | "outline" | "ghost";
}[] {
  if (role === "owner") {
    if (request.status === "pending") {
      return [
        { action: "approve", variant: "default" },
        { action: "decline", variant: "ghost" },
      ];
    }
    if (request.status === "approved") return [{ action: "activate", variant: "default" }];
    if (request.status === "active") return [{ action: "return", variant: "default" }];
    return [];
  }
  if (request.status === "pending") return [{ action: "cancel", variant: "ghost" }];
  return [];
}

const STATUS_VARIANT = {
  pending: "muted",
  approved: "default",
  active: "accent",
  returned: "default",
  declined: "muted",
  cancelled: "muted",
} as const;

export function RequestRow({
  request,
  role,
  locale,
}: {
  request: RentalRequest;
  role: "requester" | "owner";
  locale: Locale;
}) {
  const t = useTranslations("request");
  const actions = actionsFor(request, role);
  const paymentKey = request.paymentStatus ?? "none";

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Link
            href={`/listings/${request.listingId}`}
            className="font-medium hover:underline"
          >
            {request.listingTitle}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatDate(request.startDate, locale)} → {formatDate(request.endDate, locale)}
          </p>
          {request.message ? (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">“{request.message}”</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[request.status]}>{t(`status.${request.status}`)}</Badge>
          <Badge variant="outline">
            {t("payment.label")}: {t(`payment.${paymentKey}` as "payment.none")}
          </Badge>
          {request.agreedPriceCents ? (
            <span className="text-sm text-muted-foreground">
              {formatCurrency(request.agreedPriceCents, locale)}
            </span>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex gap-2">
            {actions.map(({ action, variant }) => (
              <form key={action} action={advanceRequestAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="requestAction" value={action} />
                <Button type="submit" size="sm" variant={variant}>
                  {t(`actions.${action}`)}
                </Button>
              </form>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
