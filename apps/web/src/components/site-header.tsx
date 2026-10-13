"use client";

import { Compass, Map, Plus, User, Inbox } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface HeaderUser {
  displayName: string;
  avatarEmoji: string;
  trustTier: 0 | 1 | 2;
}

const NAV = [
  { href: "/explore", icon: Compass, key: "explore" },
  { href: "/map", icon: Map, key: "map" },
  { href: "/requests", icon: Inbox, key: "requests" },
] as const;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="size-9 object-contain"
          />
          <span className="hidden sm:inline">Handimen</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden md:inline">{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <Button size="sm" asChild>
            <Link href="/listings/new">
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t("newListing")}</span>
            </Link>
          </Button>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm hover:bg-muted"
            title={t("profile")}
          >
            <span aria-hidden>{user.avatarEmoji}</span>
            <span className="hidden lg:inline">{user.displayName}</span>
            <User className="size-3.5 text-muted-foreground lg:hidden" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
