"use client";

import { useState } from "react";

import { useAdminToast } from "@/components/admin/AdminToastProvider";
import type { Comment } from "@/server/types/comment";

const STATUS_LABEL: Record<Comment["status"], string> = {
  PENDING: "承認待ち",
  APPROVED: "公開",
  REJECTED: "非公開",
};

export function AdminCommentTable({ initialComments }: { initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const { pushToast } = useAdminToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: Comment["status"]) => {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = (await response.json().catch(() => ({}))) as { comment?: Comment; error?: string };
      if (!response.ok || !data.comment) {
        pushToast(data.error ?? "更新に失敗しました。", "error");
        return;
      }

      setComments((prev) =>
        prev.map((comment) => (comment.id === id ? { ...comment, status: data.comment!.status } : comment)),
      );
      pushToast("コメントのステータスを更新しました。", "success");
    } catch (error) {
      console.error(error);
      pushToast("更新中にエラーが発生しました。", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!comments.length) {
    return <p className="text-sm text-foreground/60">現在、承認待ちのコメントはありません。</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-foreground/5 text-xs uppercase tracking-widest text-foreground/60">
          <tr>
            <th className="px-4 py-3">本文</th>
            <th className="px-4 py-3">状態</th>
            <th className="px-4 py-3">投稿日時</th>
            <th className="px-4 py-3">アクション</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">
          {comments.map((comment) => (
            <tr key={comment.id} className="transition hover:bg-foreground/5">
              <td className="px-4 py-4 text-sm text-foreground/80">{comment.body}</td>
              <td className="px-4 py-4 text-xs">
                <span className="rounded-full bg-foreground/10 px-2 py-1 text-foreground/60">
                  {STATUS_LABEL[comment.status]}
                </span>
              </td>
              <td className="px-4 py-4 text-xs text-foreground/50">
                {comment.createdAt instanceof Date
                  ? comment.createdAt.toLocaleString("ja-JP")
                  : new Date(comment.createdAt).toLocaleString("ja-JP")}
              </td>
              <td className="px-4 py-4 text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(comment.id, "APPROVED")}
                    disabled={updatingId === comment.id}
                    className="rounded-full border border-emerald-300 px-3 py-1 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-60"
                  >
                    承認
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(comment.id, "REJECTED")}
                    disabled={updatingId === comment.id}
                    className="rounded-full border border-rose-300 px-3 py-1 text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    却下
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
