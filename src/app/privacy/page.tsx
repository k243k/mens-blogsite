import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { OPERATOR, fieldValue } from "@/lib/legal/operator";

const contactEmail = fieldValue(OPERATOR.email, "問い合わせ用メールアドレス");

export const metadata = {
  title: "プライバシーポリシー",
  description: "夜レビューにおける個人情報・利用者情報の取り扱い方針。",
};

/**
 * プライバシーポリシー（静的ページ）。
 * 連絡先など個人情報に関わる箇所は {要社長確認} のまま。確定値は社長が入れる。
 */
type Section = { heading: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    heading: "1. 取得する情報",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>アカウント登録時のメールアドレス、および認証用のパスワード（暗号化して保管され、当方が平文を知ることはありません）。</li>
        <li>有料コンテンツ購入時の購入履歴（購入した記事・日時）。</li>
        <li>クレジットカード決済に関する情報。カード番号等の決済情報は決済代行事業者（Stripe）が処理し、当方のサーバーには保存されません。</li>
        <li>アクセスに伴い自動的に送信される情報（ブラウザの種類、Cookie 等）。</li>
      </ul>
    ),
  },
  {
    heading: "2. 利用目的",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>アカウントの認証およびログイン状態の維持。</li>
        <li>購入済みコンテンツの閲覧可否の判定。</li>
        <li>決済処理および不正利用の防止。</li>
        <li>お問い合わせへの対応。</li>
        <li>サービスの維持・改善。</li>
      </ul>
    ),
  },
  {
    heading: "3. 外部サービスへの提供",
    body: (
      <>
        <p>本サービスは以下の外部サービスを利用しており、目的の範囲で必要な情報を取り扱います。</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Supabase（認証・データベース基盤）：メールアドレス・購入履歴等の保管。</li>
          <li>Stripe（決済代行）：決済処理に必要な情報の処理。</li>
        </ul>
        <p className="mt-2">各サービスにおける取り扱いは、それぞれの事業者のプライバシーポリシーに従います。</p>
      </>
    ),
  },
  {
    heading: "4. Cookie の利用",
    body: (
      <p>
        ログイン状態の維持等のために Cookie および類似技術を利用します。ブラウザの設定で Cookie を無効にした場合、ログインを伴う機能がご利用いただけないことがあります。
      </p>
    ),
  },
  {
    heading: "5. 第三者提供",
    body: (
      <p>
        法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません（前項の外部サービスの利用を除く）。
      </p>
    ),
  },
  {
    heading: "6. 安全管理",
    body: (
      <p>
        取得した情報の漏えい・滅失・毀損の防止その他の安全管理のために、必要かつ適切な措置を講じます。有料コンテンツの本文は購入者のみが閲覧できるようアクセス制御を行っています。
      </p>
    ),
  },
  {
    heading: "7. 開示・訂正・削除",
    body: (
      <p>
        ご本人からの個人情報の開示・訂正・利用停止・削除のご請求には、ご本人であることを確認のうえ、法令に従い対応します。アカウントの削除をご希望の場合はお問い合わせ窓口までご連絡ください。
      </p>
    ),
  },
  {
    heading: "8. お問い合わせ窓口",
    body: (
      <p>
        本ポリシーに関するお問い合わせは、
        {contactEmail.pending ? (
          <span className="rounded bg-error/10 px-1 text-ivory-300">{contactEmail.text}</span>
        ) : (
          <span className="text-ivory-100">{contactEmail.text}</span>
        )}
        までご連絡ください。
      </p>
    ),
  },
  {
    heading: "9. 改定",
    body: (
      <p>
        本ポリシーの内容は、必要に応じて改定することがあります。重要な変更を行う場合は本サイト上で告知します。
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[var(--container-lg)] px-5 py-12">
        <h1 className="text-3xl font-bold text-ivory-100 sm:text-4xl">プライバシーポリシー</h1>
        <p className="mt-3 text-sm leading-7 text-ivory-300">
          夜レビュー（以下「本サービス」）における利用者情報の取り扱いについて、以下のとおり定めます。
        </p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-bold text-champagne-300">{s.heading}</h2>
              <div className="mt-2 text-sm leading-7 text-ivory-100">{s.body}</div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-ivory-500">
          関連：
          <Link href="/terms" className="text-champagne-300 hover:underline">利用規約</Link>
          {" / "}
          <Link href="/legal/tokushoho" className="text-champagne-300 hover:underline">特定商取引法に基づく表記</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
