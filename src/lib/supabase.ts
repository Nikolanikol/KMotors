import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Клиенты — синглтоны: клиент на каждый вызов утекал (~330 КБ на запрос,
// heap OOM под краулер-трафиком — та же утечка, что уронила caranalizer,
// фикс 31b841b там). Эти клиенты не работают с auth-сессиями (для сессий
// есть @supabase/ssr в lib/supabase/*), поэтому шарить их безопасно.
const NO_AUTH = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// Browser client — lazy, создаётся при первом обращении
// (избегает краша во время билда когда env переменных нет)
export function getSupabase() {
  browserClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NO_AUTH
  );
  return browserClient;
}

// Server client with service role (только для API routes)
export function createServerClient() {
  serverClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NO_AUTH
  );
  return serverClient;
}
