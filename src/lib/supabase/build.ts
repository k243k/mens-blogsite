import { createClient } from "@supabase/supabase-js";

/**
 * ビルド時専用 Supabase クライアント（anon key）。
 *
 * ⚠️ anon ロールのため RLS で無料公開情報しか取得できない。
 *    有料テーブル（review_paid_contents）には構造的にアクセス不可。
 * ⚠️ service_role key は絶対にここで使わない（静的成果物に漏れる）。
 *
 * 静的生成（generateStaticParams / Server Component）から呼ぶ。
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です（.env.local を確認）。",
  );
}

export const buildClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
