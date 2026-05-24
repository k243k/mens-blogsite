import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { AdminGuard } from "@/components/admin/AdminGuard";

// 管理画面は検索エンジンにインデックスさせない。
export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-night-950">
      <header className="border-b border-champagne-400/15 bg-night-900">
        <div className="mx-auto flex max-w-[var(--container-md)] items-center justify-between px-5 py-4">
          <Link href="/admin" className="text-sm font-bold text-ivory-100">
            管理画面 <span className="text-champagne-400">夜レビュー</span>
          </Link>
          <Link href="/" className="text-xs text-ivory-500 hover:text-ivory-300">公開サイト →</Link>
        </div>
      </header>
      <AdminGuard>{children}</AdminGuard>
    </div>
  );
}
