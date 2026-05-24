"use client";

import { useState } from "react";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * ログイン画面（CSR / Supabase Auth）。
 * 静的export維持のため API Routes は使わず、ブラウザから signInWithPassword を呼ぶ。
 * 成功後は redirect クエリ（同一サイト内パスのみ）または トップへ戻す。
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await getBrowserSupabase().auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません。");
      return;
    }
    // 同一サイト内パスのみ許可（オープンリダイレクト防止）
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    const dest = redirect && redirect.startsWith("/") ? redirect : "/";
    window.location.assign(dest);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[420px] px-5 py-16">
        <h1 className="text-2xl font-bold text-ivory-100">ログイン</h1>
        <p className="mt-2 text-sm text-ivory-300">
          本音レビューを読むにはログインしてください。
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
            {submitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-xs text-ivory-500">
          <Link href="/" className="hover:text-ivory-300">← トップに戻る</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
