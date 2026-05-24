"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { buildSameOriginUrl, safeInternalPath } from "@/lib/auth/redirect";

/**
 * 認証画面（CSR / Supabase Auth）。
 * 静的 export 維持のため API Routes は使わず、ブラウザから auth クライアントを呼ぶ。
 *
 * 3 モードを 1 画面で切り替える:
 *  - login   : signInWithPassword（既存挙動・admin ログインもこれ）
 *  - signup  : signUp（確認メール必須。完了後 emailRedirectTo で元ページへ）
 *  - forgot  : resetPasswordForEmail（/reset-password へ再設定リンクを送る）
 *
 * リダイレクト先は ?redirect= の同一サイト内パスのみ（オープンリダイレクト防止）。
 * 生のクエリ値は使わず safeInternalPath を通した値だけを遷移・メールリンクに使う。
 */
type Mode = "login" | "signup" | "forgot";

const MODE_LABEL: Record<Mode, string> = {
  login: "ログイン",
  signup: "新規登録",
  forgot: "パスワード再設定",
};

function LoginInner() {
  const searchParams = useSearchParams();
  // 認証後の戻り先（同一サイト内パスのみ）。クエリ値はそのまま使わず必ず安全化する。
  const dest = safeInternalPath(searchParams.get("redirect"), "/");

  const [mode, setMode] = useState<Mode>(() => {
    const m = searchParams.get("mode");
    return m === "signup" || m === "forgot" ? m : "login";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    const supabase = getBrowserSupabase();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError("メールアドレスまたはパスワードが正しくありません。");
          return;
        }
        window.location.assign(dest);
        return;
      }

      if (mode === "signup") {
        if (password.length < 8) {
          setError("パスワードは8文字以上で設定してください。");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: buildSameOriginUrl(dest) },
        });
        if (error) {
          setError("登録できませんでした。入力内容をご確認のうえ、しばらくして再度お試しください。");
          return;
        }
        // 確認メール必須設定では session=null。自動確認なら session が返る。
        if (data.session) {
          window.location.assign(dest);
          return;
        }
        setNotice(
          "確認メールを送信しました。メール内のリンクを開くと登録が完了し、元のページに戻ります。（迷惑メールフォルダもご確認ください）",
        );
        return;
      }

      // forgot
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildSameOriginUrl(`/reset-password?redirect=${encodeURIComponent(dest)}`),
      });
      if (error) {
        setError("送信できませんでした。しばらくして再度お試しください。");
        return;
      }
      setNotice(
        "パスワード再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。（迷惑メールフォルダもご確認ください）",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const showPassword = mode !== "forgot";
  const submitLabel = submitting
    ? "送信中..."
    : mode === "login"
      ? "ログイン"
      : mode === "signup"
        ? "登録して本音を読む"
        : "再設定メールを送る";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[420px] px-5 py-16">
        <h1 className="text-2xl font-bold text-ivory-100">{MODE_LABEL[mode]}</h1>
        <p className="mt-2 text-sm text-ivory-300">
          {mode === "login" && "本音レビューを読むにはログインしてください。"}
          {mode === "signup" && "アカウントを作成すると、購入した本音レビューがいつでも読めます。"}
          {mode === "forgot" && "登録済みのメールアドレスに再設定用リンクを送ります。"}
        </p>

        {/* モード切替タブ */}
        <div className="mt-6 flex gap-1 rounded-full border border-champagne-400/20 bg-night-900 p-1 text-xs font-bold">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                mode === m ? "bg-champagne-400 text-night-950" : "text-ivory-300 hover:text-ivory-100"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

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

          {showPassword && (
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-ivory-300">
                パスワード{mode === "signup" && "（8文字以上）"}
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-[var(--radius-input)] border border-champagne-400/20 bg-night-850 px-4 py-3 text-sm text-ivory-100 outline-none focus:border-champagne-400/60"
              />
            </div>
          )}

          {error && (
            <p className="rounded-[var(--radius-input)] border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-[var(--radius-input)] border border-champagne-400/40 bg-champagne-400/10 px-4 py-3 text-sm leading-6 text-ivory-100">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-champagne-400 px-5 py-3 text-sm font-bold text-night-950 shadow-card transition hover:bg-champagne-300 disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </form>

        {mode === "signup" && (
          <p className="mt-4 text-xs leading-6 text-ivory-500">
            登録すると
            <Link href="/terms" className="text-champagne-300 hover:underline">利用規約</Link>
            および
            <Link href="/privacy" className="text-champagne-300 hover:underline">プライバシーポリシー</Link>
            に同意したものとみなします。
          </p>
        )}

        <div className="mt-6 space-y-2 text-xs text-ivory-500">
          {mode !== "forgot" && (
            <p>
              <button type="button" onClick={() => switchMode("forgot")} className="hover:text-ivory-300">
                パスワードをお忘れですか？
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              <button type="button" onClick={() => switchMode("login")} className="hover:text-ivory-300">
                ← ログインに戻る
              </button>
            </p>
          )}
          <p>
            <Link href="/" className="hover:text-ivory-300">← トップに戻る</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
