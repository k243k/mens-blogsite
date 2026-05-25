"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { getBrowserSupabase } from "@/lib/supabase/client";
import { isStaffRole, type AppRole } from "@/lib/auth/useProfile";
import { safeInternalPath } from "@/lib/auth/redirect";

/**
 * 管理者専用ログイン画面（CSR / Supabase Auth）。
 *
 * 公開サイトの /login（読者向け・新規登録/再設定タブあり）とは分離した
 * ログイン専用画面。新規登録はここには置かない（管理権限は DB 側でしか
 * 付与できず、自己昇格は trg_protect_role で禁止されているため）。
 *
 * フロー:
 *  1. signInWithPassword でログイン
 *  2. profiles.role を確認し staff（writer/editor/admin）なら遷移先へ
 *  3. 一般 user 等で権限が無ければエラー表示＋signOut（管理画面に留まらせない）
 *
 * 遷移先は ?redirect= の同一サイト内パスのみ（既定 /admin・オープンリダイレクト防止）。
 */
function AdminLoginInner() {
  const searchParams = useSearchParams();
  const dest = safeInternalPath(searchParams.get("redirect"), "/admin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = getBrowserSupabase();

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !signInData.user) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        return;
      }

      // 管理権限の確認。
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", signInData.user.id)
        .maybeSingle();

      // 通信失敗・DB障害は「権限なし」と区別する（正規 staff を誤って弾かない）。
      // この場合はサインアウトせず再試行を促す。
      if (profileError) {
        setError("権限の確認に失敗しました。時間をおいて再度お試しください。");
        return;
      }

      // 確認できたうえで staff でなければ、ログイン状態を残さず弾く。
      if (!isStaffRole((profile?.role as AppRole) ?? null)) {
        await supabase.auth.signOut();
        setError("このアカウントには管理画面の利用権限がありません。");
        return;
      }

      window.location.assign(dest);
    } catch {
      setError("ログイン処理に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-[420px] px-5 py-16">
      <h1 className="text-2xl font-bold text-ivory-100">管理者ログイン</h1>
      <p className="mt-2 text-sm text-ivory-300">
        管理画面（writer / editor / admin）専用のログインです。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-ivory-300">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-input)] border border-champagne-400/20 bg-night-850 px-4 py-3 text-sm text-ivory-100 outline-none focus:border-champagne-400/60"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-bold text-ivory-300">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-input)] border border-champagne-400/20 bg-night-850 px-4 py-3 text-sm text-ivory-100 outline-none focus:border-champagne-400/60"
          />
        </div>

        {error && (
          <p className="rounded-[var(--radius-input)] border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-champagne-400 px-5 py-3 text-sm font-bold text-night-950 shadow-card transition hover:bg-champagne-300 disabled:opacity-60"
        >
          {submitting ? "ログイン中..." : "管理画面にログイン"}
        </button>
      </form>

      <div className="mt-6 text-xs text-ivory-500">
        <p>
          <Link href="/" className="hover:text-ivory-300">← 公開サイトへ</Link>
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  );
}
