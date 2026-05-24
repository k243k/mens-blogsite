"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import { PaidLockBox } from "@/components/review/PaidLockBox";
import { useAuth } from "@/lib/auth/useAuth";
import { fetchPaidContent, type PaidContent, type PaidFetchResult } from "@/lib/repository/paid";

/**
 * 記事詳細の有料セクション（CSR）。
 *
 * 表示分岐:
 *  - 未ログイン            → ロックUI（ログイン導線）
 *  - ログイン済み未購入     → ロックUI（購入CTA・決済は後）
 *  - 購入済み / 自著 / staff → 有料本文を表示
 *
 * 購入判定はクライアントで purchases を見ず、RPC get_review_paid_content の
 * 成否のみで解除する（本文が返れば解除、返らなければロック）。
 * RPC 失敗時はエラー内容を表示せずロックにフォールバックする。
 */
export function PaidSection({ reviewId }: { reviewId: string }) {
  const { user, loading } = useAuth();
  // RPC 結果のみを状態に持つ（null=判定前）。setState は非同期コールバック内だけ。
  const [result, setResult] = useState<PaidFetchResult | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    fetchPaidContent(reviewId).then((r) => {
      if (active) setResult(r);
    });
    return () => {
      active = false;
    };
  }, [user, loading, reviewId]);

  // 認証確認中
  if (loading) {
    return <Checking />;
  }

  // 未ログイン
  if (!user) {
    const loginHref = `/login?redirect=${encodeURIComponent(
      typeof window !== "undefined" ? window.location.pathname : "/",
    )}`;
    return <PaidLockBox mode="guest" loginHref={loginHref} />;
  }

  // RPC 判定中
  if (result === null) {
    return <Checking />;
  }

  // ログイン済みだが本文が取れなかった（未購入など）
  if (!result.ok) {
    return <PaidLockBox mode="locked" />;
  }

  // 解除：有料本文を表示
  const content: PaidContent = result.content;
  return (
    <section className="rounded-[var(--radius-card)] border border-champagne-400/25 bg-night-850 p-8">
      <div className="flex items-center gap-2 text-champagne-300">
        <span aria-hidden="true">✓</span>
        <span className="text-xs font-bold tracking-[0.18em]">本音レビュー（購入済み）</span>
      </div>

      <div className="mt-5 space-y-4 text-[15px] leading-8 text-ivory-100 [&>p]:mb-4">
        <ReactMarkdown>{content.body}</ReactMarkdown>
      </div>

      <PaidDetail label="写真とのギャップ" value={content.photoGap} />
      <PaidDetail label="実際の満足度" value={content.satisfaction} />
      <PaidDetail label="再訪したいか" value={content.revisitOpinion} />
      <PaidDetail label="行く前の注意点" value={content.beginnerCaution} />
      <PaidDetail label="この店が刺さる人" value={content.targetType} />
    </section>
  );
}

function Checking() {
  return (
    <div className="rounded-[var(--radius-card)] border border-champagne-400/20 bg-night-900 p-8 text-center text-sm text-ivory-500">
      本音レビューを確認中…
    </div>
  );
}

function PaidDetail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="mt-5 border-t border-champagne-400/15 pt-4">
      <p className="text-xs font-bold tracking-[0.12em] text-champagne-400">{label}</p>
      <p className="mt-2 text-sm leading-7 text-ivory-100">{value}</p>
    </div>
  );
}
