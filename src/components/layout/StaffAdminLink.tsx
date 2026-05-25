"use client";

import Link from "next/link";

import { isStaffRole, useProfile } from "@/lib/auth/useProfile";

/**
 * 公開サイトのヘッダーに出す「管理画面」への導線。
 * staff（writer/editor/admin）でログイン中のときだけ表示する。
 * PC・スマホ両方で見えるようにし、URL 直打ちなしで /admin へ入れるようにする。
 */
export function StaffAdminLink() {
  const { role, loading, loadError } = useProfile();

  // 取得中は出さない。role 取得に失敗（loadError）したときは、正規 staff を
  // 締め出さないよう導線は残す（最終的な可否は /admin 側の AdminGuard + RLS で判定）。
  if (loading) {
    return null;
  }
  if (!isStaffRole(role) && !loadError) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="rounded-full bg-champagne-400 px-4 py-2 text-sm font-bold text-night-950 transition hover:bg-champagne-300"
    >
      管理画面
    </Link>
  );
}
