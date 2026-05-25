import Image from "next/image";
import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { StaffAdminLink } from "@/components/layout/StaffAdminLink";

/**
 * 共通ヘッダー。
 * 出典: design-spec §7.1。半透明の黒・スクロールでblur・下線は薄いブラウン。
 */
const NAV = [
  { href: "/reviews", label: "最新レビュー" },
  { href: "/ranking", label: "ランキング" },
  { href: "/#areas", label: "エリアから探す" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-champagne-400/15 bg-night-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[var(--container-lg)] items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center" aria-label="外さない夜 トップへ">
          <Image
            src="/logo.png"
            alt="外さない夜"
            width={64}
            height={48}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* staff でログイン中なら PC・スマホ問わず管理画面へ入れる導線を出す */}
          <StaffAdminLink />

          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ivory-300 transition hover:text-ivory-100"
              >
                {item.label}
              </Link>
            ))}
            <AuthNav />
          </nav>

          {/* モバイル: 簡易メニュー（Phase 4 で開閉実装） */}
          <Link
            href="/reviews"
            className="rounded-full border border-champagne-400/40 px-4 py-2 text-sm font-bold text-ivory-100 md:hidden"
          >
            メニュー
          </Link>
        </div>
      </div>
    </header>
  );
}
