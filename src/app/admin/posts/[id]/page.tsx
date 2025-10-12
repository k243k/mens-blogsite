import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { PostEditor } from "@/components/admin/PostEditor";
import { formatDate } from "@/lib/format";
import { getServerContainer } from "@/server/get-container";

function toInputDate(date: Date | null) {
  if (!date) return "";
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

export default async function AdminPostEditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const container = getServerContainer();
  const [post, categories, tags] = await Promise.all([
    container.services.adminPost.getEditable(params.id),
    container.services.content.listCategories(),
    container.services.content.listTags(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">記事を編集</h1>
          <p className="text-sm text-foreground/60">最終更新: {formatDate(post.updatedAt)}</p>
        </div>
        <a
          href={`/posts/${post.slug}`}
          className="inline-flex items-center justify-center rounded-full border border-foreground/15 px-5 py-2 text-sm text-foreground/70 transition hover:border-emerald-400 hover:text-emerald-500"
        >
          公開ページを確認
        </a>
      </div>
      <PostEditor
        mode="edit"
        authorId={post.author.id}
        categories={categories}
        tags={tags}
        initialValues={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          status: post.status,
          publishedAt: toInputDate(post.publishedAt),
          isPaid: post.isPaid,
          priceJPY: post.priceJPY,
          readTime: post.readTime,
          coverImage: post.coverImage ?? "",
          commentsEnabled: post.commentsEnabled,
          categoryIds: post.categoryIds,
          tagIds: post.tagIds,
        }}
      />
    </div>
  );
}
