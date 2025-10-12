import type { Comment } from "@/server/types/comment";

export function CommentList({ comments }: { comments: Comment[] }) {
  if (!comments.length) {
    return <p className="text-sm text-foreground/60">まだコメントはありません。</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-2xl border border-foreground/10 bg-background/80 p-4 shadow-sm">
          <p className="text-sm text-foreground/70">{comment.body}</p>
          <p className="mt-2 text-xs text-foreground/50">
            {comment.status === "PENDING" ? "承認待ち" : "公開"} — {comment.createdAt.toLocaleString("ja-JP")}
          </p>
        </li>
      ))}
    </ul>
  );
}
