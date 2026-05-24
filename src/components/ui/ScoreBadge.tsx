import { formatScore } from "@/lib/scores";

/**
 * スコア表示チップ（pill型）。
 * 出典: design-spec §7.4。背景#241B18・ラベルはアイボリー・数値はゴールド。
 */
type ScoreBadgeProps = {
  label: string;
  value: number | null | undefined;
};

export function ScoreBadge({ label, value }: ScoreBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-night-850 px-3 py-1 text-xs">
      <span className="text-ivory-300">{label}</span>
      <span className="font-bold text-champagne-300">{formatScore(value)}</span>
    </span>
  );
}
