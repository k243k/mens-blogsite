/**
 * レビュー評価スコアの定義。
 * 出典: docs/specs/mens-esthe-review_requirements.md §6.1, design-spec §7.4
 * 全指標 1.0〜5.0。
 */

/** スコア指標のキー（reviews テーブルのカラムに対応）。 */
export type ScoreKey =
  | "overall"
  | "sensual"
  | "cleanliness"
  | "service"
  | "distance"
  | "photoAccuracy"
  | "beginner"
  | "cost"
  | "revisit";

export type ScoreDefinition = {
  /** スコアキー。 */
  key: ScoreKey;
  /** 表示ラベル（日本語）。 */
  label: string;
  /** reviews テーブルのカラム名（snake_case）。 */
  column: string;
};

/** 9指標の定義一覧（表示順）。 */
export const SCORE_DEFINITIONS: readonly ScoreDefinition[] = [
  { key: "overall", label: "総合", column: "overall_score" },
  { key: "sensual", label: "色気", column: "sensual_score" },
  { key: "cleanliness", label: "清潔感", column: "cleanliness_score" },
  { key: "service", label: "接客", column: "service_score" },
  { key: "distance", label: "距離感", column: "distance_score" },
  { key: "photoAccuracy", label: "写真再現度", column: "photo_accuracy_score" },
  { key: "beginner", label: "初心者向け", column: "beginner_score" },
  { key: "cost", label: "コスパ", column: "cost_score" },
  { key: "revisit", label: "再訪度", column: "revisit_score" },
] as const;

/** スコアの最小値・最大値。 */
export const SCORE_MIN = 1.0;
export const SCORE_MAX = 5.0;

/**
 * スコアを表示用に整形する（小数1桁固定）。
 *
 * @param value スコア値（null可）。
 * @returns "4.6" 形式の文字列。未設定なら "—"。
 */
export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return value.toFixed(1);
}
