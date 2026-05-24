/**
 * 認証後リダイレクト先の安全化ヘルパー。
 *
 * オープンリダイレクト対策:
 *  - 同一サイト内の絶対パス（"/" 始まり）のみ許可する。
 *  - "//evil.com"（プロトコル相対）や "/\evil.com"、"://" を含む値は外部誘導に
 *    使えるため拒否し、フォールバック先（既定 "/"）に倒す。
 *
 * 使う側（login / signup / reset）はこの戻り値だけを遷移先・emailRedirectTo の
 * 組み立てに使う。生のクエリ値を直接 window.location へ渡さない。
 */
export function safeInternalPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  // 単一スラッシュ始まり、かつ二重スラッシュ/バックスラッシュ始まりでない
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  // スキーム混入（"http://" など）・空白・制御文字を弾く（ヘッダ/URL インジェクション対策）
  if (raw.includes("://")) return fallback;
  if (/\s/.test(raw)) return fallback;
  return raw;
}

/**
 * 現在の URL の ?redirect= を安全化して返す（ブラウザ専用）。
 */
export function getSafeRedirectFromUrl(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;
  const raw = new URLSearchParams(window.location.search).get("redirect");
  return safeInternalPath(raw, fallback);
}

/**
 * メール確認 / パスワード再設定リンク用の絶対 URL を、同一オリジン + 安全パスで組み立てる。
 * （Supabase は emailRedirectTo / redirectTo に絶対 URL を要求する）
 */
export function buildSameOriginUrl(path: string): string {
  const safe = safeInternalPath(path, "/");
  if (typeof window === "undefined") return safe;
  return `${window.location.origin}${safe}`;
}
