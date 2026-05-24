/**
 * 画像未設定時のプレースホルダー。
 * 出典: design-spec §6.3, §15。黒〜ブラウン〜パープルの抽象グラデーション。
 */
type PlaceholderImageProps = {
  variant?: "hero" | "card" | "shop" | "lock";
  label?: string;
  className?: string;
};

const HEIGHT: Record<NonNullable<PlaceholderImageProps["variant"]>, string> = {
  hero: "min-h-[420px]",
  card: "h-52",
  shop: "h-64",
  lock: "h-48",
};

export function PlaceholderImage({
  variant = "card",
  label = "IMAGE PLACEHOLDER",
  className = "",
}: PlaceholderImageProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "relative overflow-hidden rounded-[var(--radius-card)] border border-champagne-400/15",
        "bg-gradient-to-br from-night-850 via-night-950 to-wine-700/40",
        HEIGHT[variant],
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(210,166,121,0.25),transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(93,58,120,0.22),transparent_35%)]" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-4 left-4 rounded-full border border-champagne-400/20 bg-black/30 px-3 py-1 text-[11px] tracking-[0.18em] text-ivory-300">
        {label}
      </div>
    </div>
  );
}
