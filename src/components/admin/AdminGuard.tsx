"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isStaffRole, useProfile } from "@/lib/auth/useProfile";

/** 管理者ログイン画面。未ログインでも表示が必要なのでガード対象から除外する。 */
const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * 管理画面アクセス制御（表示側）。
 * writer/editor/admin のみ children を表示。未ログイン/一般userは拒否。
 * ※ 最終的な権限保証は DB の RLS。ここは UI ガード。
 *
 * admin/layout が /admin 配下すべてをこのガードで包むため、ログイン画面
 * （/admin/login）だけはここで素通りさせる（そうしないとログイン前に
 * 「ログインが必要です」が出てフォームが表示できない）。
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role, loading, userId, loadError } = useProfile();

  if (pathname === ADMIN_LOGIN_PATH) {
    return <>{children}</>;
  }

  if (loading) {
    return <Centered>読み込み中…</Centered>;
  }

  // 権限の取得自体に失敗した場合は「権限なし」と区別する。
  // 一時的なDB/通信障害で正規 staff を誤って締め出さないため、再読込を促す。
  if (userId && loadError) {
    return (
      <Centered>
        <p className="text-ivory-100">権限の確認に失敗しました。</p>
        <p className="mt-2 text-sm text-ivory-500">
          通信状況をご確認のうえ、ページを再読み込みしてください。
        </p>
      </Centered>
    );
  }

  if (!userId) {
    return (
      <Centered>
        <p className="text-ivory-100">管理画面にはログインが必要です。</p>
        <Link
          href={`/admin/login?redirect=${encodeURIComponent(pathname)}`}
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
