"use client";

import Link from "next/link";

import { useProfile } from "@/lib/auth/useProfile";

/** 管理ダッシュボード（A002）。 */
export default function AdminDashboard() {
  const { email, role } = useProfile();

  return (
    <main className="mx-auto max-w-[var(--container-md)] px-5 py-10">
      <h1 className="text-2xl font-bold text-ivory-100">ダッシュボード</h1>
      <p className="mt-2 text-sm text-ivory-300">
        {email}（{role}）でログイン中。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/reviews/new"
          className="rounded-[var(--radius-card)] border border-champagne-400/25 bg-champagne-400/10 p-6 transition hover:border-champagne-400/50"
        >
          <p className="text-lg font-bold text-ivory-100">＋ 新しいレビューを書く</p>
          <p className="mt-1 text-sm text-ivory-300">スマホで質問に答える形式で作成。</p>
        </Link>
        <Link
          href="/admin/reviews"
          className="rounded-[var(--radius-card)] border border-champagne-400/15 bg-night-900 p-6 transition hover:border-champagne-400/35"
        >
          <p className="text-lg font-bold text-ivory-100">記事を管理する</p>
          <p className="mt-1 text-sm text-ivory-300">下書き・公開記事の編集。</p>
        </Link>
      </div>
    </main>
  );
}
