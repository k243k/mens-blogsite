import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ブラウザ（CSR）用 Supabase クライアント。
 *
 * 用途: ログイン・購入判定・有料本文の RPC 呼び出し・管理画面の CRUD。
 *
 * セキュリティ方針（docs/architecture.md §2 必須条件13）:
 * - ここで使うのは anon key のみ。service_role key は絶対に使わない。
 * - service_role / Stripe secret / GitHub token は Edge Functions の Secrets 専用。
 * - 有料本文は直接テーブルを引かず、RLS + RPC（get_review_paid_content）経由で取得する。
 *
 * 静的ビルド（output: export）でモジュール読み込み時にクラッシュしないよう、
 * 呼び出し時に遅延初期化する。
 */
let cached: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (cached) {
    return cached;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase の環境変数が未設定です（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください）。",
    );
  }

  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cached;
}
