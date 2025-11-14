import Link from "next/link";

import type { TagSummary } from "@/content/types";

export function TagCloud({ tags }: { tags: TagSummary[] }) {
  if (!tags.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tag/${tag.slug}`}
          className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/60 transition hover:border-emerald-400 hover:text-emerald-500"
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
