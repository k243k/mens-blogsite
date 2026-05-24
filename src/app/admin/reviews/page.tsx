"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getEditableReviews, type AdminReviewRow } from "@/lib/repository/admin";

/** 記事一覧管理（A003）。 */
export default function AdminReviewsPage() {
  const [rows, setRows] = useState<AdminReviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getEditableReviews()
      .then((r) => {
        if (active) setRows(r);
      })
      .catch(() => {
        if (active) setError("一覧の取得に失敗しました。");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[var(--container-md)] px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ivory-100">記事管理</h1>
        <Link
          href="/admin/reviews/new"
          className="rounded-full bg-champagne-400 px-4 py-2 text-sm font-bold text-night-950"
        >
          ＋ 新規
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-error">{error}</p>}
      {rows === null && !error && <p className="mt-6 text-sm text-ivory-500">読み込み中…</p>}
      {rows !== null && rows.length === 0 && (
        <p className="mt-6 text-sm text-ivory-500">記事がまだありません。</p>
      )}

      {rows !== null && rows.length > 0 && (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-[var(--radius-input)] border border-champagne-400/15 bg-night-900 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ivory-100">{r.title}</p>
                <p className="mt-1 flex gap-2 text-xs text-ivory-500">
                  <Badge>{r.status}</Badge>
                  {r.isPaid && <Badge>有料</Badge>}
                  <span>/{r.slug}</span>
                </p>
              </div>
              <Link
                href={`/admin/reviews/edit?id=${r.id}`}
                className="ml-3 shrink-0 rounded-full border border-champagne-400/40 px-4 py-2 text-xs font-bold text-ivory-100"
              >
                編集
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-night-850 px-2 py-0.5 text-[11px] text-ivory-300">{children}</span>
  );
}
