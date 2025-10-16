import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { PurchaseButton } from "@/components/checkout/PurchaseButton";
import AdSlot from "@/components/ads/AdSlot";
import { PostCard } from "@/components/posts/PostCard";
import { TableOfContents } from "@/components/posts/TableOfContents";
import { CommentSection } from "@/components/comments/CommentSection";
import { formatDate, formatPriceJPY } from "@/lib/format";
import { getServerContainer } from "@/server/get-container";
import { renderMdxContent } from "@/server/utils/mdx";
import type { PostDetail } from "@/server/types/post";

export const revalidate = 60;
export const dynamicParams = true;

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function buildPreview(body: string, fallback: string) {
  const segments = body.split(/\n{2,}/).filter(Boolean);
  if (segments.length === 0) {
    return fallback;
  }

  return segments.slice(0, 3).join("\n\n");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const {
    repositories: { post },
  } = getServerContainer();
  const summary = await post.findPublishedBySlug((await params).slug);

  if (!summary) {
    return {
      title: "記事が見つかりません",
    };
  }

  const url = `${getBaseUrl()}/posts/${summary.slug}`;
  const images = summary.coverImage ? [{ url: summary.coverImage }] : undefined;

  return {
    title: `${summary.title} | Men's Blogsite`,
    description: summary.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: summary.title,
      description: summary.excerpt,
      url,
      type: "article",
      tags: summary.tags.map((tag) => tag.name),
      publishedTime: summary.publishedAt?.toISOString(),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: summary.title,
      description: summary.excerpt,
      images,
    },
  } satisfies Metadata;
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: { status?: string; session_id?: string };
}) {
  const container = getServerContainer();
  const detail = await container.services.content.getPostDetail((await params).slug);

  if (!detail) {
    notFound();
  }

  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  if (
    searchParams?.status === "success" &&
    searchParams.session_id &&
    session?.user &&
    container.services.checkout
  ) {
    await container.services.checkout.confirmSession(searchParams.session_id, session.user.id);
  }

  const settings = await container.services.settings.getAll();
  const commentsSetting = settings.find((setting) => setting.key === "comments");
  const siteCommentsEnabled = Boolean(
    commentsSetting &&
      commentsSetting.value &&
      typeof commentsSetting.value === "object" &&
      (commentsSetting.value as { enabled?: boolean }).enabled,
  );

  let hasAccess = !detail.post.isPaid;
  if (detail.post.isPaid && session?.user) {
    const ownership = await container.services.ownership.checkOwnership(session.user.id, (await params).slug);
    hasAccess = ownership.hasAccess;
  }

  const source = hasAccess ? detail.post.body : buildPreview(detail.post.body, detail.post.excerpt);
  const { content, headings } = await renderMdxContent(source);

  const priceLabel = formatPriceJPY(detail.post.priceJPY);
  const baseUrl = getBaseUrl();
  const metadataJsonLd = buildArticleJsonLd(detail.post, baseUrl);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadataJsonLd) }}
      />
      <article className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 lg:flex-row">
        <div className="flex-1 space-y-10">
          <header className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-500">{formatDate(detail.post.publishedAt)}</p>
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">{detail.post.title}</h1>
            <p className="text-pretty text-base text-foreground/70">{detail.post.excerpt}</p>
            <div className="flex flex-wrap gap-3 text-xs text-foreground/60">
              <span>{detail.post.readTime}分で読了</span>
              <span className="h-1 w-1 rounded-full bg-foreground/30" aria-hidden />
              <span>{detail.post.categories.map((category) => category.name).join(" / ")}</span>
            </div>
          </header>

          <AdSlot id="article-top" className="h-24" />

          <div className="prose prose-zinc max-w-none prose-headings:scroll-mt-24 prose-p:leading-relaxed dark:prose-invert">
            {content}
          </div>

          {hasAccess ? (
            <AdSlot id="article-bottom" className="h-24" />
          ) : (
            <section className="rounded-3xl border border-foreground/10 bg-foreground/5 p-6">
              <h2 className="text-lg font-semibold">全文を読むには</h2>
              <p className="mt-2 text-sm text-foreground/70">
                この先は有料コンテンツです。{isAuthenticated ? "購入手続き後、すぐに全文が表示されます。" : "まずは管理画面で使用するアカウントでログインしてください。"}
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <PurchaseButton
                    postId={detail.post.id}
                    priceLabel={priceLabel}
                    successUrl={`${baseUrl}/posts/${detail.post.slug}?status=success`}
                    cancelUrl={`${baseUrl}/posts/${detail.post.slug}?status=cancel`}
                  />
                ) : (
                  <LinkButton href={`/login?callbackUrl=${encodeURIComponent(`/posts/${detail.post.slug}`)}`}>
                    ログインして購入する
                  </LinkButton>
                )}
              </div>
            </section>
          )}

          <CommentSection
            postId={detail.post.id}
            enabled={siteCommentsEnabled && detail.post.commentsEnabled}
          />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">関連記事</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {detail.related.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {!detail.related.length ? <p className="text-sm text-foreground/60">関連する記事はまだありません。</p> : null}
            </div>
          </section>
        </div>

        <aside className="flex w-full max-w-md flex-col gap-6">
          {hasAccess ? <TableOfContents items={headings} /> : null}
          <section className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">執筆者</h2>
            <p className="mt-2 text-base font-semibold">{detail.post.author.name ?? detail.post.author.email}</p>
            <p className="mt-1 text-sm text-foreground/60">Men&apos;s Blogsite 編集部</p>
          </section>
          <section className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">次に読む</h2>
            <nav className="mt-3 space-y-3 text-sm text-foreground/70">
              {detail.adjacent.previous ? (
                <Link href={`/posts/${detail.adjacent.previous.slug}`} className="block rounded-lg border border-foreground/10 p-3 transition hover:border-emerald-400 hover:text-emerald-500">
                  ← {detail.adjacent.previous.title}
                </Link>
              ) : null}
              {detail.adjacent.next ? (
                <Link href={`/posts/${detail.adjacent.next.slug}`} className="block rounded-lg border border-foreground/10 p-3 transition hover:border-emerald-400 hover:text-emerald-500">
                  → {detail.adjacent.next.title}
                </Link>
              ) : null}
              {!detail.adjacent.previous && !detail.adjacent.next ? <p>ほかの記事も順次公開予定です。</p> : null}
            </nav>
          </section>
        </aside>
      </article>
    </main>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-emerald-400 hover:text-emerald-500"
    >
      {children}
    </Link>
  );
}

function buildArticleJsonLd(post: PostDetail, baseUrl: string) {
  const url = `${baseUrl}/posts/${post.slug}`;
  const image = post.coverImage ? [post.coverImage] : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    author: {
      '@type': 'Person',
      name: post.author.name ?? post.author.email,
    },
    url,
    mainEntityOfPage: url,
    isAccessibleForFree: !post.isPaid,
  };
}
