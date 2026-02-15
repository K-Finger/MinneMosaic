import { createClient } from "@supabase/supabase-js";

// https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
// have users subscribe to database changes

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
