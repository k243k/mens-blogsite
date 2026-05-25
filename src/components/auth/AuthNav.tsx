"use client";

import Link from "next/link";

import { signOut, useAuth } from "@/lib/auth/useAuth";

/**
 * ヘッダー右側の認証ナビ。
 * 未ログイン: ログインリンク / ログイン済み: ログアウト。
 */
export function AuthNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return <span className="text-sm text-ivory-500">…</span>;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-champagne-400/40 px-5 py-2 text-[13px] font-bold tracking-[0.08em] text-ivory-100 transition hover:border-champagne-400/70 hover:bg-champagne-400/10"
      >
        ログイン
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs tracking-wide text-ivory-500 sm:inline">{user.email}</span>
      <button
        type="button"
        onClick={() => {
          void signOut().then(() => window.location.assign("/"));
        }}
        className="rounded-full border border-champagne-400/40 px-5 py-2 text-[13px] font-bold tracking-[0.08em] text-ivory-100 transition hover:border-champagne-400/70 hover:bg-champagne-400/10"
      >
        ログアウト
      </button>
    </div>
  );
}
