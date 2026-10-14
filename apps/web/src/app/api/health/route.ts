import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Connectivity probe: proves the server can reach Supabase with the anon key
 * and that Row Level Security lets public reads through.
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    const [cities, listings] = await Promise.all([
      supabase.from("cities").select("name", { count: "exact" }),
      supabase.from("listings").select("id", { count: "exact" }),
    ]);

    if (cities.error) {
      return NextResponse.json({ ok: false, step: "cities", error: cities.error.message }, { status: 500 });
    }
    if (listings.error) {
      return NextResponse.json({ ok: false, step: "listings", error: listings.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      cities: cities.count ?? 0,
      cityName: cities.data?.[0]?.name ?? null,
      listings: listings.count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
