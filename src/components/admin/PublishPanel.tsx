"use client";

import { useEffect, useState } from "react";

import {
  getLatestRebuildJob,
  rebuildStatusLabel,
  requestPublishAndRebuild,
  type RebuildJob,
} from "@/lib/repository/publish";

/**
 * 公開反映パネル（editor/admin 想定）。
 * 「サイトに反映」→ publish_review RPC + trigger-rebuild Edge Function。
 * 反映は即時でなく数分かかる前提でステータスを表示する。
 */
export function PublishPanel({ reviewId }: { reviewId: string }) {
  const [job, setJob] = useState<RebuildJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLatestRebuildJob(reviewId).then((j) => {
      if (active) setJob(j);
    });
    return () => {
      active = false;
    };
  }, [reviewId]);

  async function onPublish() {
    setBusy(true);
    setError(null);
    try {
      const j = await requestPublishAndRebuild(reviewId);
      setJob(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "公開反映に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-champagne-400/25 bg-night-900 p-5">
      <h2 className="text-sm font-bold tracking-wide text-champagne-300">公開とサイト反映</h2>
      <p className="mt-2 text-xs leading-6 text-ivory-300">
        公開すると記事が「published」になり、サイト再ビルドが起動します。
        <br />
        反映には数分かかります（GitHub Actions のビルド完了後に公開ページへ反映）。
      </p>

      <button
        type="button"
        onClick={onPublish}
        disabled={busy}
        className="mt-4 rounded-full bg-champagne-400 px-5 py-2.5 text-sm font-bold text-night-950 disabled:opacity-60"
      >
        {busy ? "リクエスト中…" : "公開してサイトに反映"}
      </button>

      {job && (
        <div className="mt-4 rounded-[var(--radius-input)] border border-champagne-400/15 bg-night-850 px-4 py-3 text-sm">
          <p className="text-ivory-100">
            反映ステータス: <span className="font-bold text-champagne-300">{rebuildStatusLabel(job.status)}</span>
          </p>
          {job.githubRunId && <p className="mt-1 text-xs text-ivory-500">run id: {job.githubRunId}</p>}
          {job.status === "failed" && job.message && (
            <p className="mt-1 text-xs text-error">{job.message}</p>
          )}
          <p className="mt-1 text-xs text-ivory-500">
            ※ 最新状態はページ再読み込みで更新されます。
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </section>
  );
}
