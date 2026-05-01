/**
 * Server-side Supabase clients.
 *
 * - getSupabaseServerClient(): respects the user's auth cookie. Use in API
 *   routes / server components when you want RLS to apply as the logged-in user.
 * - getSupabaseAdminClient(): uses the SERVICE ROLE key, bypasses RLS. Use ONLY
 *   on the server, only for trusted operations (public form ingest, file
 *   uploads, scheduled jobs). NEVER import this from a "use client" file.
 */

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // Server components can't set cookies; the middleware handles refresh.
      },
      remove() {
        // ditto
      },
    },
  });
}

let cachedAdmin: SupabaseClient | null = null;
export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client",
    );
  }
  cachedAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdmin;
}
