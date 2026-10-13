/**
 * Generated Supabase database types.
 *
 * ⚠️ PLACEHOLDER. Replace with real column types by running, from the repo root:
 *
 *   supabase start
 *   supabase db reset
 *   pnpm db:types        # supabase gen types typescript --local > packages/db/src/database.types.ts
 *
 * Table names below mirror `supabase/migrations`. Row/Insert/Update are
 * loosely typed until generation, so `.from("listings")` is checked by name but
 * not by column. `@handimen/api` (Zod) is the source of truth for field shapes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type LooseTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

export type Database = {
  public: {
    Tables: {
      profiles: LooseTable;
      cities: LooseTable;
      groups: LooseTable;
      group_members: LooseTable;
      listings: LooseTable;
      posts: LooseTable;
      reactions: LooseTable;
      comments: LooseTable;
      follows: LooseTable;
      requests: LooseTable;
      reviews: LooseTable;
      threads: LooseTable;
      messages: LooseTable;
      notifications: LooseTable;
      reports: LooseTable;
      blocks: LooseTable;
      transactions: LooseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
