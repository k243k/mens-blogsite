import { Suspense } from "react";

import { SearchPageContent } from "@/components/search/SearchPageContent";
import { getAllPostSummaries, listCategories, listTags } from "@/content/api";

export const revalidate = 120;

export default function SearchPage() {
  const posts = getAllPostSummaries();
  const categories = listCategories(20);
  const tags = listTags(30);

  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent posts={posts} categories={categories} tags={tags} />
    </Suspense>
  );
}

function SearchPageFallback() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-24 pt-16">
        <div className="h-10 w-40 rounded-xl bg-foreground/10" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 rounded-2xl border border-foreground/10 bg-foreground/5" />
          ))}
        </div>
      </section>
    </main>
  );
}
