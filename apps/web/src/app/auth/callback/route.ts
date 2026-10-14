import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Magic-link / OAuth callback. Exchanges the one-time code for a session and
 * persists the auth cookies, then returns the user to the app.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectTo = url.searchParams.get("redirectTo") ?? "/";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const failure = new URL("/sign-in", url.origin);
      failure.searchParams.set("error", "exchange_failed");
      return NextResponse.redirect(failure);
    }
  }

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
