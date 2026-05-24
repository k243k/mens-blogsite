/**
 * 公開反映（CSR専用）。
 *  1. publish_review RPC: status=published 化 + rebuild_jobs(queued) 登録（editor/admin のみ・RLS/RPCで保証）
 *  2. trigger-rebuild Edge Function: GitHub Actions を起動（token は Function の Secrets のみ）
 *
 * ⚠️ GitHub token / service_role はクライアントに出さない（Edge Function 内で処理）。
 */
import { getBrowserSupabase } from "@/lib/supabase/client";

export type RebuildStatus = "queued" | "dispatched" | "building" | "succeeded" | "failed";

export type RebuildJob = {
  id: string;
  status: RebuildStatus;
  githubRunId: string | null;
  message: string | null;
  createdAt: string;
};

/** 状態の表示ラベル（社長指定の語彙にマッピング）。 */
export function rebuildStatusLabel(status: RebuildStatus): string {
  switch (status) {
    case "queued":
      return "受付（待機中）";
    case "dispatched":
    case "building":
      return "実行中";
    case "succeeded":
      return "成功（反映済み）";
    case "failed":
      return "失敗";
  }
}

/**
 * 公開して反映をリクエストする。
 * @returns 作成された rebuild_jobs。
 */
export async function requestPublishAndRebuild(reviewId: string): Promise<RebuildJob> {
  const supabase = getBrowserSupabase();

  // 1) 公開 + ジョブ登録（権限は RPC/RLS 側で強制）
  const { data: job, error: rpcErr } = await supabase.rpc("publish_review", {
    p_review_id: reviewId,
  });
  if (rpcErr || !job) {
    throw new Error("公開処理に失敗しました（権限がない可能性があります）。");
  }
  const jobRow = Array.isArray(job) ? job[0] : job;

  // 2) 再ビルド起動（失敗してもジョブは queued のまま残る。詳細は晒さない）
  const { error: fnErr } = await supabase.functions.invoke("trigger-rebuild", {
    body: { reviewId, jobId: jobRow.id },
  });
  if (fnErr) {
    // Edge Function 側の詳細は伏せ、ジョブ状態で追跡させる
    return mapJob({ ...jobRow, status: "queued" });
  }
  return mapJob(jobRow);
}

/** 指定レビューの最新 rebuild_job を取得（管理者向けステータス表示用）。 */
export async function getLatestRebuildJob(reviewId: string): Promise<RebuildJob | null> {
  const { data, error } = await getBrowserSupabase()
    .from("rebuild_jobs")
    .select("id,status,github_run_id,message,created_at")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapJob(data);
}

function mapJob(r: {
  id: string;
  status: string;
  github_run_id?: string | null;
  message?: string | null;
  created_at: string;
}): RebuildJob {
  return {
    id: r.id,
    status: r.status as RebuildStatus,
    githubRunId: r.github_run_id ?? null,
    message: r.message ?? null,
    createdAt: r.created_at,
  };
}
