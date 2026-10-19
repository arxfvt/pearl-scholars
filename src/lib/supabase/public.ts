import { createClient } from "@supabase/supabase-js";

/** Cookie-free read-only client for public data (sitemap, metadata, share images). RLS still applies. */
export const createPublicClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
