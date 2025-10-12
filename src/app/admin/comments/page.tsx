import { AdminCommentTable } from "@/components/comments/AdminCommentTable";
import { listComments } from "@/server/mock/comment-store";
import type { Comment } from "@/server/types/comment";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const comments = listComments().map((comment) => ({
    ...comment,
    createdAt: new Date(comment.createdAt),
  })) as Comment[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">コメント管理</h1>
        <p className="text-sm text-foreground/60">ダミー実装です。承認すると状態のみが更新されます。</p>
      </div>
      <AdminCommentTable initialComments={comments} />
    </div>
  );
}
