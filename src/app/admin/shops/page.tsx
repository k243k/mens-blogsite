"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { EditorOnly } from "@/components/admin/EditorOnly";
import { getEditableShops, type AdminShopRow } from "@/lib/repository/admin";

/** 店舗一覧管理。 */
export default function AdminShopsPage() {
  return (
    <EditorOnly>
      <ShopsList />
    </EditorOnly>
  );
}

function ShopsList() {
  const [rows, setRows] = useState<AdminShopRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getEditableShops()
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
        <h1 className="text-2xl font-bold text-ivory-100">店舗管理</h1>
        <Link
          href="/admin/shops/new"
          className="rounded-full bg-champagne-400 px-4 py-2 text-sm font-bold text-night-950"
        >
          ＋ 新規
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-error">{error}</p>}
      {rows === null && !error && <p className="mt-6 text-sm text-ivory-500">読み込み中…</p>}
      {rows !== null && rows.length === 0 && (
        <p className="mt-6 text-sm text-ivory-500">店舗がまだありません。「＋ 新規」から追加してください。</p>
      )}

      {rows !== null && rows.length > 0 && (
        <ul className="mt-6 space-y-3">
          {rows.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-[var(--radius-input)] border border-champagne-400/15 bg-night-900 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ivory-100">{s.name}</p>
                <p className="mt-1 flex flex-wrap gap-2 text-xs text-ivory-500">
                  <Badge>{s.status === "published" ? "公開" : "非公開"}</Badge>
                  {s.areaName && <Badge>{s.areaName}</Badge>}
                  <span>/{s.slug}</span>
                </p>
              </div>
              <Link
                href={`/admin/shops/edit?id=${s.id}`}
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
