// =============================================================================
// Edge Function: trigger-rebuild
// 管理者の「サイトに反映」操作で GitHub Actions(workflow_dispatch) を起動する。
//
// セキュリティ（docs/architecture.md 必須条件6,7,13）:
//  - ブラウザからログイン済み JWT で呼ぶ（Authorization: Bearer <jwt>）。
//  - Function 内で profiles.role を確認し writer/editor/admin のみ実行可。
//  - GitHub token / service_role key は Secrets(Deno.env) のみ。レスポンスに含めない。
//  - 失敗時もトークンや内部詳細を返さない（status のみ）。
// =============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ status: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const GH_TOKEN = Deno.env.get("GITHUB_DISPATCH_TOKEN");
  const GH_REPO = Deno.env.get("GITHUB_REPO"); // 例: k243k/mens-blogsite
  const GH_WORKFLOW = Deno.env.get("GITHUB_WORKFLOW_FILE") ?? "deploy.yml";

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY || !GH_TOKEN || !GH_REPO) {
    // Secrets 未設定でも内部値は晒さず安全に失敗
    return json({ status: "not_configured" }, 503);
  }

  // 1) JWT 検証（ブラウザから渡された Authorization をそのまま使う）
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ status: "unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ status: "unauthorized" }, 401);
  const userId = userData.user.id;

  // 2) role 確認（service_role で profiles を参照。Function 内のみ）
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  // 公開反映（再ビルド起動）は editor/admin のみ。writer は記事作成・下書きまで。
  if (!profile || !["editor", "admin"].includes(profile.role)) {
    return json({ status: "forbidden" }, 403);
  }

  // 3) 入力
  let reviewId: string | null = null;
  let jobId: string | null = null;
  try {
    const body = await req.json();
    reviewId = body.reviewId ?? null;
    jobId = body.jobId ?? null;
  } catch {
    /* body 無しでも全体再ビルドは可能 */
  }

  // 4) GitHub Actions を workflow_dispatch で起動（token は Secrets のみ）
  const ghRes = await fetch(
    `https://api.github.com/repos/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "mens-blogsite-rebuild",
      },
      body: JSON.stringify({ ref: "main", inputs: jobId ? { job_id: jobId } : {} }),
    },
  );

  // 5) rebuild_jobs 更新（service_role）。詳細は晒さない。
  if (ghRes.ok) {
    if (jobId) {
      await admin.from("rebuild_jobs").update({ status: "dispatched" }).eq("id", jobId);
    }
    return json({ status: "dispatched" });
  }

  if (jobId) {
    await admin
      .from("rebuild_jobs")
      .update({ status: "failed", message: `dispatch failed (${ghRes.status})` })
      .eq("id", jobId);
  }
  return json({ status: "dispatch_failed" }, 502);
});
