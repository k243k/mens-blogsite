import { PostCard } from "@/components/posts/PostCard";
import type { PostSummary } from "@/server/types/post";

export function PostListSection({
  title,
  description,
  posts,
  cta,
}: {
  title: string;
  description?: string;
  posts: PostSummary[];
  cta?: React.ReactNode;
}) {
  if (!posts.length) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-foreground/70">{description}</p> : null}
        </div>
        {cta}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
