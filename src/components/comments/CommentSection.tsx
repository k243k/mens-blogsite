"use client";

import { useEffect, useState } from "react";

import type { Comment } from "@/server/types/comment";
import { CommentList } from "@/components/comments/CommentList";

export function CommentSection({ postId, enabled }: { postId: string; enabled: boolean }) {
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/comments?postId=${postId}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json().catch(() => ({}))) as {
          comments?: Array<{ id: string; postId: string; body: string; status: string; createdAt: string }>;
        };
        setComments((data.comments ?? []).map(deserializeComment));
      } finally {
        setLoading(false);
      }
    };
    run().catch(console.error);
  }, [postId, enabled]);

  if (!enabled) {
    return null;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!body.trim()) {
      setStatus("コメントを入力してください。");
      return;
    }
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) {
        setStatus(data.error ?? "現在コメントを受け付けていません。");
        return;
      }
      setBody("");
      setStatus(data.message ?? "コメントが送信されました。（ダミー）");
      if (data.comment) {
        setComments((prev) => [deserializeComment(data.comment), ...prev]);
      }
    } catch (error) {
      console.error(error);
      setStatus("送信中にエラーが発生しました。");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-foreground/10 bg-background/80 p-6 shadow-sm shadow-black/5 dark:shadow-white/5">
      <div>
        <h2 className="text-lg font-semibold">コメント（ベータ版）</h2>
        <p className="text-sm text-foreground/60">現在コメントはモデレーション待ちとなり、実際には公開されません。</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
          placeholder="体験談や感想をお寄せください（ダミーフォーム）"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "送信中..." : "コメントを送信"}
        </button>
      </form>
      {status ? <p className="text-xs text-foreground/70">{status}</p> : null}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">最近のコメント</h3>
        {loading ? (
          <p className="text-xs text-foreground/50">読み込み中...</p>
        ) : (
          <CommentList comments={comments} />
        )}
      </div>
    </section>
  );
}

function deserializeComment(comment: { id: string; postId: string; body: string; status: string; createdAt: string }): Comment {
  return {
    id: comment.id,
    postId: comment.postId,
    body: comment.body,
    status: (comment.status ?? "PENDING") as Comment["status"],
    createdAt: new Date(comment.createdAt),
  };
}
