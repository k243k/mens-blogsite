import { formatScore, SCORE_DEFINITIONS } from "@/lib/scores";
import type { ReviewScores } from "@/lib/types";

/**
 * 9指標のスコアをグリッド表示する。
 * 出典: design-spec §8.3 ScoreGrid（モバイル2列 / PC3列）。
 */
export function ScoreGrid({ scores }: { scores: ReviewScores }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {SCORE_DEFINITIONS.map((def) => (
        <div
          key={def.key}
          className="rounded-[var(--radius-input)] border border-champagne-400/15 bg-night-850 px-4 py-3"
        >
          <p className="text-xs text-ivory-300">{def.label}</p>
          <p className="mt-1 text-xl font-bold text-champagne-300">
            {formatScore(scores[def.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
