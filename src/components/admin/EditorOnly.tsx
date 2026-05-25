"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { isEditorRole, useProfile } from "@/lib/auth/useProfile";

/**
 * editor / admin のみ children を表示する表示ガード。
 * 店舗管理など、RLS で editor 限定の操作を含む画面に使う。
 * （最終的な権限保証は DB の RLS。ここは UI ガード。）
 */
export function EditorOnly({ children }: { children: ReactNode }) {
  const { role, loading, userId, loadError } = useProfile();

  if (loading) {
    return <Centered>読み込み中…</Centered>;
  }
  if (userId && loadError) {
    return (
      <Centered>
        <p className="text-ivory-100">権限の確認に失敗しました。</p>
        <p className="mt-2 text-sm text-ivory-500">通信状況をご確認のうえ、再読み込みしてください。</p>
      </Centered>
    );
  }
  if (!isEditorRole(role)) {
    return (
      <Centered>
        <p className="text-ivory-100">このページは editor / admin のみ利用できます。</p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-champagne-300 hover:text-champagne-400">
          ← ダッシュボードへ
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
