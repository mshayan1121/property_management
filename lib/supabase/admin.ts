import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { env } from "@/lib/env";

/**
 * Server-only Supabase client with service role key.
 * Use only in Server Components, Server Actions, or Route Handlers.
 * Never expose to the client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
