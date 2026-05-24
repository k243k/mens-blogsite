import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { OPERATOR, disclosureValue, fieldValue, onRequestLabels } from "@/lib/legal/operator";

export const metadata = {
  title: "特定商取引法に基づく表記",
  description: "夜レビューの特定商取引法に基づく表記。販売事業者・料金・支払方法・提供時期・返品等の表示。",
};

/**
 * 特定商取引法に基づく表記（静的ページ）。
 *
 * ⚠️ 個人情報に関わる項目（販売事業者名・運営責任者・所在地・電話番号・連絡先）は
 *    src/lib/legal/operator.ts の単一ソースから取得する。未確定の間は {要社長確認} と
 *    赤表示される。実在の屋号・氏名・住所・番号を Claude が勝手に記載しない。
 */
type Row = { label: string; value: string; needsConfirm?: boolean };

const bizName = disclosureValue(OPERATOR.businessName, OPERATOR.businessNameMode, "屋号または氏名");
const respName = disclosureValue(OPERATOR.responsibleName, OPERATOR.responsibleNameMode, "運営責任者の氏名");
const addr = disclosureValue(OPERATOR.address, OPERATOR.addressMode, "所在地");
const tel = disclosureValue(OPERATOR.phone, OPERATOR.phoneMode, "電話番号");
const mail = fieldValue(OPERATOR.email, "問い合わせ用メールアドレス");
const onRequest = onRequestLabels();

const ROWS: Row[] = [
  { label: "販売事業者", value: bizName.text, needsConfirm: bizName.pending },
  { label: "運営責任者", value: respName.text, needsConfirm: respName.pending },
  { label: "所在地", value: addr.text, needsConfirm: addr.pending },
  { label: "電話番号", value: tel.text, needsConfirm: tel.pending },
  { label: "メールアドレス", value: mail.text, needsConfirm: mail.pending },
  {
    label: "販売価格",
    value:
      "各レビュー記事の購入ボタン付近に表示する金額（税込）。本サイトの本音レビューは1記事あたり300円〜1,000円（税込）です。",
  },
  {
    label: "商品代金以外の必要料金",
    value:
      "本コンテンツの閲覧・購入にあたり、お客様のインターネット接続料金・通信料金はお客様のご負担となります。決済手数料は当方が負担し、追加でご請求することはありません。",
  },
  {
    label: "支払方法",
    value: "クレジットカード決済（Stripe を利用したオンライン決済）。",
  },
  {
    label: "支払時期",
    value: "購入手続き完了時にお支払いが確定します。カードの引き落とし日は各カード会社の規定によります。",
  },
  {
    label: "商品の提供時期",
    value:
      "決済完了後、ただちに当該記事の本音レビュー（有料部分）をご購入アカウントで閲覧いただけます。配送を伴う物品の販売はありません。",
  },
  {
    label: "返品・キャンセル",
    value:
      "商品の性質上（購入後ただちに閲覧可能なデジタルコンテンツ）、購入手続き完了後の返品・返金・キャンセルはお受けできません。決済の二重請求など当方に起因する不具合があった場合は、メールにてご連絡ください。個別に対応いたします。",
  },
  {
    label: "動作環境",
    value:
      "最新版の主要ブラウザ（Google Chrome / Safari / Microsoft Edge / Firefox）。JavaScript および Cookie を有効にしてご利用ください。購入したコンテンツの閲覧にはアカウントへのログインが必要です。",
  },
  {
    label: "表現・商品に関する注意書き",
    value:
      "本サイトに掲載するレビューは執筆者個人の体験・感想に基づくものであり、効果・満足度・品質を保証するものではありません。掲載内容には主観的な評価が含まれます。本サイトは成人向けの内容を含みます。ご利用は18歳以上の方に限ります。法令および各店舗の規約を遵守してご利用ください。",
  },
];

export default function TokushohoPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[var(--container-lg)] px-5 py-12">
        <h1 className="text-3xl font-bold text-ivory-100 sm:text-4xl">特定商取引法に基づく表記</h1>
        <p className="mt-3 text-sm leading-7 text-ivory-300">
          特定商取引に関する法律第11条に基づき、以下のとおり表示します。
        </p>

        <dl className="mt-8 divide-y divide-champagne-400/15 rounded-[var(--radius-card)] border border-champagne-400/15 bg-night-900">
          {ROWS.map((row) => (
            <div key={row.label} className="grid gap-1 px-5 py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="text-sm font-bold text-champagne-300">{row.label}</dt>
              <dd className="text-sm leading-7 text-ivory-100">
                {row.needsConfirm ? (
                  <span className="rounded bg-error/10 px-1 text-ivory-300">{row.value}</span>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        {onRequest.length > 0 && (
          <p className="mt-6 text-xs leading-6 text-ivory-500">
            {onRequest.join("・")}は、ご請求があった場合に遅滞なく開示いたします。開示をご希望の場合は上記メールアドレスまでご連絡ください。
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
