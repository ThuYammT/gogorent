import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not configured.",
  );
}

if (!supabaseServerKey) {
  throw new Error(
    "Supabase server secret key is not configured.",
  );
}

export const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseServerKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );