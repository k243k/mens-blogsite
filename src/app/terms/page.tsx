import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { OPERATOR, fieldValue } from "@/lib/legal/operator";

const contactEmail = fieldValue(OPERATOR.email, "問い合わせ用メールアドレス");

export const metadata = {
  title: "利用規約",
  description: "夜レビューの利用規約。アカウント・有料コンテンツ・禁止事項・免責事項等。",
};

/**
 * 利用規約（静的ページ）。
 * 連絡先など個人情報に関わる箇所は {要社長確認} のまま。確定値は社長が入れる。
 */
type Section = { heading: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    heading: "第1条（適用）",
    body: (
      <p>
        本規約は、夜レビュー（以下「本サービス」）の提供条件および本サービスの運営者（以下「当方」）と利用者との間の権利義務関係を定めるものです。利用者は本規約に同意のうえ本サービスを利用するものとします。
      </p>
    ),
  },
  {
    heading: "第2条（年齢制限）",
    body: (
      <p>
        本サービスは成人向けの内容を含みます。<strong className="text-ivory-100">18歳未満の方は利用できません。</strong>利用者は自身が18歳以上であることを表明し、保証するものとします。
      </p>
    ),
  },
  {
    heading: "第3条（アカウント）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>有料コンテンツの購入・閲覧にはアカウント登録が必要です。</li>
        <li>利用者は登録情報を自己の責任で管理し、第三者に利用させてはなりません。</li>
        <li>登録情報の管理不十分・第三者の使用等による損害の責任は利用者が負うものとします。</li>
      </ul>
    ),
  },
  {
    heading: "第4条（有料コンテンツ）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>本サービスの一部レビューは有料です。価格は各記事に表示します。</li>
        <li>購入後ただちに閲覧可能となるデジタルコンテンツの性質上、購入手続き完了後の返品・返金・キャンセルはお受けできません。詳細は<Link href="/legal/tokushoho" className="text-champagne-300 hover:underline">特定商取引法に基づく表記</Link>をご確認ください。</li>
        <li>購入したコンテンツは、購入者本人の私的閲覧の範囲でのみ利用できます。</li>
      </ul>
    ),
  },
  {
    heading: "第5条（禁止事項）",
    body: (
      <>
        <p>利用者は、本サービスの利用にあたり以下の行為をしてはなりません。</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>法令または公序良俗に違反する行為。</li>
          <li>有料コンテンツの複製・転載・再配布・販売その他権利者の許諾なき利用。</li>
          <li>アカウントの第三者への貸与・共有・譲渡。</li>
          <li>不正アクセス、サーバー・システムへの過度な負荷、その他運営を妨害する行為。</li>
          <li>他の利用者・第三者・当方の権利または利益を侵害する行為。</li>
        </ul>
      </>
    ),
  },
  {
    heading: "第6条（コンテンツの性質・免責）",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>本サービスのレビューは執筆者個人の主観的な体験・感想であり、内容の正確性・有用性・特定目的への適合性を保証するものではありません。</li>
        <li>掲載店舗の営業状況・料金・サービス内容は変更される場合があります。最新の情報は各店舗にご確認ください。</li>
        <li>当方は、本サービスの利用により生じた損害について、当方の故意または重過失による場合を除き、責任を負わないものとします。</li>
      </ul>
    ),
  },
  {
    heading: "第7条（知的財産権）",
    body: (
      <p>
        本サービスに掲載される文章・画像等の著作権その他の権利は、当方または正当な権利者に帰属します。利用者は私的利用の範囲を超えてこれらを利用してはなりません。
      </p>
    ),
  },
  {
    heading: "第8条（サービスの変更・中断・終了）",
    body: (
      <p>
        当方は、利用者への事前の通知なく、本サービスの内容の変更・追加・中断・終了を行うことがあります。これにより利用者に生じた損害について、当方は責任を負わないものとします。
      </p>
    ),
  },
  {
    heading: "第9条（規約の変更）",
    body: (
      <p>
        当方は、必要と判断した場合、本規約を変更できるものとします。変更後の規約は本サイト上に掲示した時点から効力を生じます。
      </p>
    ),
  },
  {
    heading: "第10条（準拠法・裁判管轄）",
    body: (
      <p>
        本規約の解釈には日本法を準拠法とし、本サービスに関して紛争が生じた場合には、当方の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
      </p>
    ),
  },
  {
    heading: "第11条（お問い合わせ）",
    body: (
      <p>
        本規約に関するお問い合わせは、
        {contactEmail.pending ? (
          <span className="rounded bg-error/10 px-1 text-ivory-300">{contactEmail.text}</span>
        ) : (
          <span className="text-ivory-100">{contactEmail.text}</span>
        )}
        までご連絡ください。
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[var(--container-lg)] px-5 py-12">
        <h1 className="text-3xl font-bold text-ivory-100 sm:text-4xl">利用規約</h1>
        <p className="mt-3 text-sm leading-7 text-ivory-300">
          本規約は、夜レビュー（本サービス）の利用条件を定めるものです。ご利用の前にお読みください。
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
          <Link href="/privacy" className="text-champagne-300 hover:underline">プライバシーポリシー</Link>
          {" / "}
          <Link href="/legal/tokushoho" className="text-champagne-300 hover:underline">特定商取引法に基づく表記</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
