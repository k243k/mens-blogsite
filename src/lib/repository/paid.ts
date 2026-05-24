import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * 有料本文の取得（CSR専用）。
 *
 * ⚠️ 取得は RPC `get_review_paid_content` のみ。`review_paid_contents` を直接 select しない。
 * ⚠️ user_id はクライアントから渡さない。RPC 内の auth.uid() 判定に委ねる。
 * ⚠️ RPC 失敗時はエラー内容を一切返さず null を返す（情報漏洩防止）。
 */
export type PaidContent = {
  body: string;
  photoGap: string | null;
  satisfaction: string | null;
  revisitOpinion: string | null;
  beginnerCaution: string | null;
  targetType: string | null;
};

/** 取得結果。アクセス可否は本文の有無で表現する（理由は返さない）。 */
export type PaidFetchResult = { ok: true; content: PaidContent } | { ok: false };

export async function fetchPaidContent(reviewId: string): Promise<PaidFetchResult> {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.rpc("get_review_paid_content", {
    p_review_id: reviewId,
  });

  // 権限なし・未ログイン・その他いずれも、内容を出さずロック扱いにする。
  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return { ok: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    ok: true,
    content: {
      body: row.body,
      photoGap: row.photo_gap ?? null,
      satisfaction: row.satisfaction ?? null,
      revisitOpinion: row.revisit_opinion ?? null,
      beginnerCaution: row.beginner_caution ?? null,
      targetType: row.target_type ?? null,
    },
  };
}
