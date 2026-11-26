// Есть ли у запроса cookie сессии Supabase.
//
// @supabase/ssr хранит сессию в cookie `sb-<ref>-auth-token` (ключ supabase-js:
// `sb-${hostname.split(".")[0]}-auth-token`), длинную — частями `….0`, `….1`, …
// (chunker.js: `${key}.${i}`). Без такой cookie `auth.getUser()` в сеть не ходит:
// `__loadSession` читает storage, получает null и возвращает AuthSessionMissingError
// локально, cookie при этом не трогает. Поэтому middleware пропускает вызов целиком.
//
// `sb-…-auth-token-code-verifier` (PKCE на время OAuth) сессией НЕ является:
// с одной этой cookie getUser тоже отвечает локально.

const SESSION_COOKIE = /^sb-.+-auth-token(?:\.(?:0|[1-9][0-9]*))?$/;

export function hasSupabaseSessionCookie(cookieNames: Iterable<string>): boolean {
  for (const name of cookieNames) {
    if (SESSION_COOKIE.test(name)) return true;
  }
  return false;
}
