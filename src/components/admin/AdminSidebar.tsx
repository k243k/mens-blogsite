"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/posts", label: "記事" },
  { href: "/admin/comments", label: "コメント" },
  { href: "/admin/settings", label: "設定" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-foreground/10 bg-background/95 p-6 shadow-sm shadow-black/5 dark:shadow-white/5 lg:flex">
      <nav className="flex w-full flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Admin</p>
          <h1 className="text-xl font-semibold text-foreground">Men&apos;s Blogsite</h1>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                    active
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400 dark:text-emerald-300"
                      : "border-transparent text-foreground/70 hover:border-foreground/15 hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {active ? <span aria-hidden>•</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
