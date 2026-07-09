import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses RLS — NEVER import into client
 * components or expose the returned client to the browser. All access is
 * expected to flow through lib/supabase/queries/* behind an authorization
 * check (lib/auth.ts).
 *
 * Typed loosely (no generated Database generic): rows are validated by casting
 * to the hand-authored types in ./types.ts at each query site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: SupabaseClient<any, "public", any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function supabaseAdmin(): SupabaseClient<any, "public", any> {
  if (cached) return cached;
  cached = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
