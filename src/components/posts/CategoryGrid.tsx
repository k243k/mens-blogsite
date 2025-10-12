import Link from "next/link";

import type { CategorySummary } from "@/server/repositories/category-repository";

export function CategoryGrid({ categories }: { categories: CategorySummary[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="group flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-background/80 p-4 shadow-sm shadow-black/5 transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"
        >
          <span className="text-sm font-semibold text-foreground transition group-hover:text-emerald-500">
            {category.name}
          </span>
          <span className="text-xs text-foreground/60">{category.postCount} 記事</span>
        </Link>
      ))}
    </div>
  );
}
