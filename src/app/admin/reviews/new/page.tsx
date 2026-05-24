"use client";

import { useState } from "react";

import { ReviewForm } from "@/components/admin/ReviewForm";
import { createReview } from "@/lib/repository/admin";
import type { ReviewFormValues } from "@/lib/admin/reviewSchema";

/** 記事作成（A004）。 */
export default function NewReviewPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ReviewFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const id = await createReview(values);
      window.location.assign(`/admin/reviews/edit?id=${id}&saved=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-[640px] px-5 pt-6">
        <h1 className="text-xl font-bold text-ivory-100">新しいレビュー</h1>
      </div>
      <ReviewForm onSubmit={handleSubmit} submitting={submitting} serverError={error} />
    </>
  );
}
