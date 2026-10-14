import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SignInForm } from "@/components/sign-in-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const existing = await getCurrentUser();
  if (existing) redirect("/profile");

  const t = await getTranslations("signIn");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex items-center justify-between">
        <Image src="/logo.png" alt="" width={48} height={48} priority className="size-12 object-contain" />
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
