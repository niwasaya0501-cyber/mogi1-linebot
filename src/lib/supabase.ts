import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

// サーバー専用(service role key)。ブラウザ側のコードから絶対にimportしないこと
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
