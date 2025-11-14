"use client";

import { useEffect, useState } from "react";

import type { TocItem } from "@/content/types";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-40% 0px -45% 0px",
        threshold: 0.1,
      },
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="目次" className="rounded-2xl border border-foreground/10 bg-background/70 p-4 text-sm shadow-sm shadow-black/5 dark:shadow-white/5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">Contents</p>
      <ol className="mt-3 flex flex-col gap-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id} className={`transition ${isActive ? "text-emerald-500" : "text-foreground/70"}`}>
              <a
                href={`#${item.id}`}
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold transition hover:text-emerald-500 ${
                  item.level === 2 ? "pl-2" : "pl-6"
                }`}
              >
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
