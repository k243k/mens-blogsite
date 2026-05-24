"use client";

import { useEffect, useState } from "react";

import { PublishPanel } from "@/components/admin/PublishPanel";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { getReviewForEdit, updateReview } from "@/lib/repository/admin";
import type { ReviewFormValues } from "@/lib/admin/reviewSchema";

/**
 * 記事編集（A005）。
 * 静的export制約のため動的セグメント [id] でなくクエリ ?id= で対象を指定する。
 */
type LoadState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; id: string; values: ReviewFormValues };

export default function EditReviewPage() {
  // window 依存・非同期取得の結果は1つの state にまとめ、setState は async コールバック内のみ。
  const [load, setLoad] = useState<LoadState>({ phase: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("id");
    void (async () => {
      if (!id) {
        if (active) setLoad({ phase: "error", message: "対象の記事IDが指定されていません。" });
        return;
      }
      try {
        const v = await getReviewForEdit(id);
        if (!active) return;
        setLoad(
          v
            ? { phase: "ready", id, values: v }
            : { phase: "error", message: "記事が見つからない、または閲覧権限がありません。" },
        );
      } catch {
        if (active) setLoad({ phase: "error", message: "記事の読み込みに失敗しました。" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const reviewId = load.phase === "ready" ? load.id : null;

  async function handleSubmit(v: ReviewFormValues) {
    if (!reviewId) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateReview(reviewId, v);
      window.location.assign(`/admin/reviews/edit?id=${reviewId}&saved=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      setSubmitting(false);
    }
  }

  if (load.phase === "error") {
    return <p className="mx-auto max-w-[640px] px-5 py-16 text-center text-sm text-error">{load.message}</p>;
  }
  if (load.phase === "loading") {
    return <p className="mx-auto max-w-[640px] px-5 py-16 text-center text-sm text-ivory-500">読み込み中…</p>;
  }

  return (
    <>
      <div className="mx-auto max-w-[640px] px-5 pt-6">
        <h1 className="text-xl font-bold text-ivory-100">レビューを編集</h1>
        <div className="mt-5">
          <PublishPanel reviewId={load.id} />
        </div>
      </div>
      <ReviewForm defaultValues={load.values} onSubmit={handleSubmit} submitting={submitting} serverError={error} />
    </>
  );
}
