import Link from "next/link";

/**
 * 共通フッター。
 * 出典: requirements §4.1（特商法・プライバシー・利用規約への導線）。
 */
const LEGAL = [
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-champagne-400/15 bg-night-900">
      <div className="mx-auto max-w-[var(--container-lg)] px-5 py-12">
        <p className="text-lg font-bold text-ivory-100">
          夜<span className="text-champagne-400">レビュー</span>
        </p>
        <p className="mt-2 max-w-md text-sm leading-7 text-ivory-500">
          メンズエステの店舗選びに役立つ体験レビュー。料金・雰囲気・清潔感・接客・写真とのギャップを記録します。
        </p>

        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-ivory-500 transition hover:text-ivory-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="mt-8 text-xs text-ivory-500">
          © {new Date().getFullYear()} 夜レビュー
        </p>
      </div>
    </footer>
  );
}
