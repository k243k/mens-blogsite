import { Button } from "@/components/ui/Button";

/**
 * 有料ロックエリア。サイト内で最も目立たせる。
 * 出典: design-spec §7.5, §9.4。黒〜深紅グラデ + 上からぼかし + ゴールド枠。
 *
 * ⚠️ 有料本文はここに渡さない。未ログイン/未購入には文言とCTAのみ表示する。
 *    実本文は購入判定後に RPC 経由で取得し PaidSection 側で描画する。
 *
 * mode:
 *  - "guest"  : 未ログイン → ログイン導線
 *  - "locked" : ログイン済み未購入 → 購入CTA（決済はPhase 7・現状は準備中）
 */
const READABLE = [
  "写真とのギャップ",
  "実際の満足度",
  "再訪したいか",
  "初心者が注意すべき点",
  "この店が刺さる男性のタイプ",
];

type PaidLockBoxProps = {
  mode?: "guest" | "locked";
  loginHref?: string;
  signupHref?: string;
  unitPrice?: number | null;
  onPurchase?: () => void;
  purchasing?: boolean;
};

export function PaidLockBox({
  mode = "locked",
  loginHref = "/login",
  signupHref = "/login?mode=signup",
  unitPrice = null,
  onPurchase,
  purchasing = false,
}: PaidLockBoxProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[var(--radius-card)] border border-champagne-400/25 p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(13,11,10,0.95), rgba(143,29,44,0.35)), radial-gradient(circle at 30% 10%, rgba(210,166,121,0.22), transparent 40%)",
      }}
    >
      {/* ぼかした擬似本文（読めない雰囲気を出す装飾） */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-24 space-y-2 opacity-30 blur-[6px]">
        <div className="h-3 w-11/12 rounded bg-ivory-300/40" />
        <div className="h-3 w-10/12 rounded bg-ivory-300/40" />
        <div className="h-3 w-9/12 rounded bg-ivory-300/40" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 text-lock">
          <span aria-hidden="true">🔒</span>
          <span className="text-xs font-bold tracking-[0.18em]">PAID REVIEW</span>
        </div>

        <h2 className="mt-3 text-2xl font-bold text-ivory-100">ここから先は本音レビューです。</h2>
        <p className="mt-2 text-sm leading-7 text-ivory-300">
          写真とのギャップ、再訪判断、行く前に知るべき注意点を記録しています。
        </p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {READABLE.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-ivory-100">
              <span className="text-champagne-400">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {mode === "guest" ? (
            <>
              <Button variant="primary" href={signupHref}>無料登録して本音を読む</Button>
              <Button variant="secondary" href={loginHref}>ログイン</Button>
            </>
          ) : (
            <Button variant="primary" onClick={onPurchase}>
              {purchasing
                ? "決済ページへ移動中…"
                : unitPrice
                  ? `この店の本音を確認する（¥${unitPrice.toLocaleString()}）`
                  : "この店の本音を確認する"}
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-ivory-500">
          {mode === "guest"
            ? "※ 登録は無料です。本音レビューは記事ごとの単品購入制。購入済みの方はログインすると本文が表示されます。"
            : "※ 単品購入後、この記事の本音レビューがいつでも読めます。"}
        </p>
      </div>
    </section>
  );
}
