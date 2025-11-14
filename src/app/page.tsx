import Link from "next/link";

import { PostListSection } from "@/components/posts/PostListSection";
import { CategoryGrid } from "@/components/posts/CategoryGrid";
import { TagCloud } from "@/components/posts/TagCloud";
import { getHomeContent } from "@/content/api";
import { formatDate } from "@/lib/format";

export const revalidate = 120;

export default function Home() {
  const { latest, popular, categories, tags } = getHomeContent();
  const featured = latest[0];
  const latestRest = latest.slice(1);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-20 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-500">Men&apos;s Stories</p>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
            男性のリアルな体験談を、読みやすく。キャリア・健康・人間関係まで、共感しやすいストーリーをお届けします。
          </h1>
          <p className="text-pretty text-base text-foreground/70">
            業界の最前線で働く人の副業術から、心と身体を整えるセルフケアまで。課題に直面したときの思考法を共有し、次の一歩を応援します。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-85"
            >
              記事を検索する
            </Link>
            <Link
              href="/category/career"
              className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-emerald-400 hover:text-emerald-500"
            >
              カテゴリ一覧を見る
            </Link>
          </div>
        </div>
        {featured ? (
          <Link
            href={`/posts/${featured.slug}`}
            className="group mt-6 w-full max-w-md rounded-3xl border border-foreground/10 bg-background/80 p-6 shadow-lg shadow-black/5 transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Latest</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground transition group-hover:text-emerald-500">
              {featured.title}
            </h2>
            <p className="mt-4 line-clamp-3 text-sm text-foreground/70">{featured.excerpt}</p>
            <div className="mt-5 flex items-center justify-between text-xs text-foreground/60">
              <span>{formatDate(featured.publishedAt)}</span>
              <span>{featured.readTime}分で読了</span>
            </div>
          </Link>
        ) : null}
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20">
        {latestRest.length ? (
          <PostListSection
            title="新着記事"
            description="最新の体験談を毎週更新。通勤やスキマ時間にどうぞ。"
            posts={latestRest}
            cta={
              <Link
                href="/search?q=&page=1"
                className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-emerald-400 hover:text-emerald-500"
              >
                すべて見る
              </Link>
            }
          />
        ) : null}

        <PostListSection
          title="よく読まれている記事"
          description="読了時間の長い人気コンテンツをピックアップ。"
          posts={popular}
        />

        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">カテゴリから探す</h2>
              <p className="mt-1 text-sm text-foreground/70">興味のある領域をクリックすると該当記事が表示されます。</p>
            </div>
            <Link
              href="/search"
              className="rounded-full border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-emerald-400 hover:text-emerald-500"
            >
              検索で絞り込む
            </Link>
          </div>
          <CategoryGrid categories={categories} />
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">タグクラウド</h2>
            <p className="mt-1 text-sm text-foreground/70">気になるテーマから新しい記事を見つけましょう。</p>
          </div>
          <TagCloud tags={tags} />
        </section>
      </section>
    </main>
  );
}
