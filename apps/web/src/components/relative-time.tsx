"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";

import { formatDate, formatRelativeTime } from "@/lib/format";

const subscribe = () => () => {};
// Deliberately derived from `window`, not a bare `true`: if React ever evaluates
// the snapshot during a server pass, this still reports "not client" instead of
// letting the relative-time formatter reach `Date.now()`.
const getSnapshot = () => typeof window !== "undefined";
const getServerSnapshot = () => false;

/**
 * "3 hours ago", rendered safely on a prerendered page.
 *
 * `formatRelativeTime` reads `Date.now()`, which Cache Components rejects during
 * prerender — and a frozen shell would show a stale "3 hours ago" anyway. So the
 * server (and the first hydration pass) renders a deterministic absolute date,
 * and the relative string replaces it once we're on the client.
 */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const locale = useLocale();
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {isClient ? formatRelativeTime(iso, locale) : formatDate(iso, locale)}
    </time>
  );
}
