"use client";

import { Compass, Inbox, LogIn, LogOut, Map, MessageSquare, Plus, User } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { signOutAction } from "@/lib/actions";
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
  { href: "/messages", icon: MessageSquare, key: "messages" },
] as const;

export function SiteHeader({
  user,
  unreadCount = 0,
  signedIn = false,
  email = null,
}: {
  user: HeaderUser;
  unreadCount?: number;
  signedIn?: boolean;
  email?: string | null;
}) {
  const t = useTranslations("nav");
  const tSignIn = useTranslations("signIn");
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
            const showBadge = item.key === "messages" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden md:inline">{t(item.key)}</span>
                {showBadge ? (
                  <span className="grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {unreadCount}
                  </span>
                ) : null}
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

          {signedIn ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm hover:bg-muted"
                title={email ?? user.displayName}
              >
                <span aria-hidden>{user.avatarEmoji}</span>
                <span className="hidden lg:inline">{user.displayName}</span>
                <User className="size-3.5 text-muted-foreground lg:hidden" aria-hidden />
              </Link>
              <form action={signOutAction}>
                <Button type="submit" size="icon" variant="ghost" title={tSignIn("signOut")}>
                  <LogOut className="size-4" aria-hidden />
                </Button>
              </form>
            </div>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href="/sign-in">
                <LogIn className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t("signIn")}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
