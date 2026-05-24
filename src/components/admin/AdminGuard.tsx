"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { isStaffRole, useProfile } from "@/lib/auth/useProfile";

/**
 * 管理画面アクセス制御（表示側）。
 * writer/editor/admin のみ children を表示。未ログイン/一般userは拒否。
 * ※ 最終的な権限保証は DB の RLS。ここは UI ガード。
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { role, loading, userId } = useProfile();

  if (loading) {
    return <Centered>読み込み中…</Centered>;
  }

  if (!userId) {
    return (
      <Centered>
        <p className="text-ivory-100">管理画面にはログインが必要です。</p>
        <Link
          href="/login?redirect=/admin"
          className="mt-4 inline-block rounded-full bg-champagne-400 px-5 py-3 text-sm font-bold text-night-950"
        >
          ログイン
        </Link>
      </Centered>
    );
  }

  if (!isStaffRole(role)) {
    return (
      <Centered>
        <p className="text-ivory-100">このページにアクセスする権限がありません。</p>
        <p className="mt-2 text-sm text-ivory-500">writer / editor / admin のみ利用できます。</p>
        <Link href="/" className="mt-4 inline-block text-sm text-champagne-300 hover:text-champagne-400">
          ← トップへ
        </Link>
      </Centered>
    );
  }

  return <>{children}</>;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      {children}
    </div>
  );
}
