"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { getSafeRedirectFromUrl } from "@/lib/auth/redirect";

/**
 * パスワード再設定の着地ページ（CSR）。
 *
 * 流れ:
 *  1. 再設定メールのリンク（redirectTo=/reset-password）から来訪。
 *     URL ハッシュに recovery トークンが付き、detectSessionInUrl で一時セッションが張られる。
 *  2. PASSWORD_RECOVERY イベント or 既存セッションを検出したらフォームを表示。
 *  3. updateUser({ password }) で新パスワードを設定 → 元ページ（?redirect=）へ。
 *
 * 静的 export 維持のため API Routes は使わない。
 */
function ResetPasswordInner() {
  // null=判定中 / true=有効なリカバリ来訪 / false=トークン無し（直接アクセス等）
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    (async () => {
      // 再設定リンク経由ではトークンが URL ハッシュ（#access_token=...&type=recovery）に乗る。
      // detectSessionInUrl のタイミング/flowType に依存せず、明示的に setSession して確実に
      // リカバリセッションを張る。
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;
        if (!error && data.session) {
          // 機微なトークンをアドレスバーに残さない
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          setReady(true);
          return;
        }
      }

      // ハッシュが無い/既に処理済みのケース（PKCE 等）はセッション有無で判定。
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setReady((prev) => (prev === null ? Boolean(data.session) : prev));
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください。");
      return;
    }
    setSubmitting(true);
    const { error } = await getBrowserSupabase().auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError("再設定できませんでした。リンクの有効期限が切れている可能性があります。もう一度メールを送り直してください。");
      return;
    }
    setDone(true);
    const dest = getSafeRedirectFromUrl("/");
    setTimeout(() => window.location.assign(dest), 1200);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[420px] px-5 py-16">
        <h1 className="text-2xl font-bold text-ivory-100">新しいパスワードの設定</h1>

        {ready === null && (
          <p className="mt-4 text-sm text-ivory-500">確認中…</p>
        )}

        {ready === false && (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-7 text-ivory-300">
              再設定用リンクが無効か、有効期限が切れています。お手数ですが、もう一度パスワード再設定をお試しください。
            </p>
            <Link href="/login?mode=forgot" className="text-sm text-champagne-300 hover:underline">
              パスワード再設定をやり直す →
            </Link>
          </div>
        )}

        {ready === true && !done && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-xs font-bold text-ivory-300">
                新しいパスワード（8文字以上）
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
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
              {submitting ? "設定中..." : "パスワードを更新する"}
            </button>
          </form>
        )}

        {done && (
          <p className="mt-6 rounded-[var(--radius-input)] border border-champagne-400/40 bg-champagne-400/10 px-4 py-3 text-sm leading-6 text-ivory-100">
            パスワードを更新しました。元のページに戻ります…
          </p>
        )}

        <p className="mt-6 text-xs text-ivory-500">
          <Link href="/" className="hover:text-ivory-300">← トップに戻る</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
