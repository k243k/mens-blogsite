# メンズエステ体験レビューサイト アーキテクチャ設計書

**作成日:** 2026-05-24
**ステータス:** 設計確定（社長承認済み・実装着手前）
**対象リポジトリ:** `mens-blogsite`（既存静的ブログを本仕様にリメイク）
**関連仕様:** `docs/specs/mens-esthe-review_requirements.md` / `docs/specs/mens-esthe-review_design-spec.md`

---

## 0. このドキュメントの位置づけ

要件定義書・デザイン設計書を受けて、**「静的書き出し × Supabase × 固定費0円」**という制約下で
どう実装するかの技術アーキテクチャを確定する。手戻り防止のため、実装着手前に本書で全体を固める
（教訓: `_logs/failures/_cross/2026-04-06_設計前実装による手戻りコスト.md`）。

---

## 1. 確定構成

| レイヤー | 採用技術 | 固定費 |
|---------|---------|--------|
| フロント | Next.js 15（App Router）+ TypeScript + Tailwind CSS v4、**`output: "export"`（完全静的書き出し）** | 0円 |
| 配信 | **GitHub Pages**（現状の `jiisan-estet.com` を継続）。困難なら **Cloudflare Pages Free** へ移行可能な構造 | 0円 |
| DB / 認証 / ストレージ | **Supabase Free**（PostgreSQL / Auth / Storage） | 0円 |
| サーバーレス処理 | **Supabase Edge Functions**（Stripe連携・公開トリガー・有料本文配信） | 0円 |
| 決済 | **Stripe**（Checkout）。固定費なし、成立時のみ国内カード 3.6% | 売れた時だけ |
| フォーム / バリデーション | React Hook Form + Zod | 0円 |

**不採用（明確に依存しない）:**
- ❌ Vercel（Hobbyは商用利用不可、Proは月$20）
- ❌ Next.js API Routes（静的書き出しと両立しない／サーバー常駐に依存）
- ❌ サーバー常駐機能全般

> 出典: [supabase.com/pricing](https://supabase.com/pricing) / [stripe.com/jp/pricing](https://stripe.com/jp/pricing) / [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby) / [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

---

## 2. 必須条件（MUST / 違反したら設計失敗）

本プロジェクトの実装は、以下の12条件を**すべて満たさなければならない**。

1. 公開ページは Next.js static export（`output: "export"`）で生成する。
2. 記事一覧・記事詳細・地域ページ・店舗ページは、**ビルド時に Supabase から取得して静的生成**する（`generateStaticParams`）。
3. **ビルド時に取得してよいのは無料公開情報のみ**（タイトル・無料本文・スコア・店舗基本情報・無料要約など）。
4. **有料本文・有料レビュー詳細・購入者限定情報は、静的HTML / JS / JSON に絶対に含めない。**
5. 有料本文は、**ログイン後・購入済み判定を通過したユーザーだけ**が Supabase RPC または Edge Function 経由で取得する。
6. 管理画面で「公開」したら、**Supabase Edge Function 経由で GitHub Actions の `workflow_dispatch` を起動**する。
7. **GitHub token はブラウザに置かず**、Supabase Edge Function の環境変数 / Secrets に置く。
8. GitHub Actions 再ビルド完了後に公開ページへ反映される仕様とする。
9. **即時反映ではなく、公開反映には数分かかる前提**で、管理画面に反映ステータス表示を入れる。
10. Vercel / Next.js API Routes / サーバー常駐機能には依存しない。
11. 画像は現段階ではプレースホルダーで実装し、後から AI 生成画像を差し替えられる構造にする。
12. GitHub Pages で難しければ Cloudflare Pages Free へ移行できる構造にしておく。
13. **Supabase `service_role` key を、クライアントコード・ブラウザ送出物・静的ビルド成果物に絶対に含めない**（Edge Functions の Secrets のみで保持）。ビルド時の Supabase アクセスは `anon` key + RLS で無料情報のみ。

### 2.1 有料本文の漏洩防止（最重要・多層防御）

条件4・5を構造的に担保するため、以下の多層防御を敷く。

- **第1層（物理分離）:** 有料本文を `reviews` 本体に持たせず、別テーブル **`review_paid_contents`** に分離する。
  ビルド時クエリは `reviews` と無料系テーブルしか触らないため、有料本文へ構造的に到達できない。
- **第2層（RLS）:** `review_paid_contents` には Row Level Security を設定し、
  **「当該記事を購入済みの本人」「著者」「admin」以外は SELECT 不可**にする。
- **第3層（RPC）:** クライアントは直接テーブルを引かず、RPC関数 `get_review_paid_content(p_review_id)` を呼ぶ。
  関数内で `auth.uid()` と `purchases` を照合し、権限がなければ本文を返さずロック用メタのみ返す。
- **第4層（ビルド分離）:** 静的生成のデータ取得関数は `review_paid_contents` を import すらしない
  （リポジトリ層で公開用クエリと有料用クエリのモジュールを分離）。

---

## 3. レンダリング戦略

| 領域 | 方式 | データ取得元 | SEO |
|------|------|------------|-----|
| トップ / 記事一覧 / 記事詳細（無料部分） / 地域 / 店舗 / ランキング | **静的生成（SSG）** | ビルド時に Supabase（無料情報のみ） | ◎ |
| 有料本文表示 | **CSR** | ログイン後 RPC `get_review_paid_content` | 不要（noindex領域） |
| ログイン / 会員登録 / マイページ | **CSR** | ブラウザから Supabase Auth | 不要 |
| 管理画面（ダッシュボード・CRUD・投稿フォーム） | **CSR（SPA的）** | ブラウザから Supabase（admin RLS） | noindex |
| Stripe Checkout 発行 / Webhook 受信 / 公開トリガー / 有料本文配信 | **Edge Functions** | サーバーレス | — |

### 3.1 公開反映フロー（条件6〜9）

```
[管理者が記事を「公開」]
        │
        ▼
[ブラウザ] reviews.status = 'published' に更新（Supabase）
        │
        ▼
[Edge Function: trigger-rebuild] を呼び出し
        │  └─ Secrets内のGitHub tokenでGitHub API叩く
        ▼
[GitHub Actions: workflow_dispatch] 起動
        │
        ▼
[再ビルド] ビルド時にSupabaseから公開記事を再取得 → static export
        │
        ▼
[GitHub Pages / Cloudflare Pages へデプロイ] → 数分後に公開反映
```

管理画面には「公開処理中（反映まで数分）」のステータスを表示する（条件9）。

---

## 4. ディレクトリ構造

```
mens-blogsite/
├─ next.config.ts                 # output: "export" 維持
├─ src/
│  ├─ app/
│  │  ├─ (public)/                # 静的生成される公開画面
│  │  │  ├─ page.tsx              # P001 トップ
│  │  │  ├─ reviews/page.tsx      # P002 記事一覧
│  │  │  ├─ reviews/[slug]/page.tsx   # P003 記事詳細（無料部分のみ静的）
│  │  │  ├─ areas/[areaSlug]/page.tsx # P004 地域別
│  │  │  ├─ shops/[shopSlug]/page.tsx # P005 店舗詳細
│  │  │  ├─ ranking/page.tsx      # P006 ランキング
│  │  │  └─ legal/{tokushoho,privacy,terms}/page.tsx
│  │  ├─ (auth)/                  # CSR
│  │  │  ├─ login/ signup/ mypage/
│  │  └─ admin/                   # CSR（SPA的、noindex）
│  │     ├─ login/ page.tsx       # A001
│  │     ├─ page.tsx              # A002 ダッシュボード
│  │     ├─ reviews/{,new,[id]/edit}/  # A003-A005
│  │     ├─ shops/ areas/ media/ users/ purchases/
│  ├─ components/
│  │  ├─ layout/   { Header, Footer, Container }
│  │  ├─ ui/       { Button, Badge, ScoreBadge, PlaceholderImage, SectionTitle, Input, Textarea, Select }
│  │  ├─ review/   { ReviewCard, ReviewGrid, ScoreGrid, PaidLockBox, ArticleHero, SummaryCard }
│  │  ├─ shop/     { ShopInfoCard, ShopHero }
│  │  ├─ area/     { AreaChips }
│  │  └─ admin/    { AdminLayout, ReviewForm, ScoreInput, ImageField }
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ client.ts             # ブラウザ用（anon key）
│  │  │  └─ build.ts              # ビルド時用（無料情報のみ取得・有料テーブル不参照）
│  │  ├─ repository/
│  │  │  ├─ reviews.public.ts     # 公開・無料クエリ（静的生成用）
│  │  │  ├─ reviews.paid.ts       # 有料本文RPC（CSR専用・ビルドからimport禁止）
│  │  │  ├─ shops.ts areas.ts purchases.ts
│  │  ├─ auth.ts                  # 認証ヘルパー
│  │  ├─ scores.ts                # スコア定義（9指標）
│  │  └─ design/tokens.ts         # カラー・サイズ定数
│  └─ styles/globals.css          # Tailwind v4 @theme でデザイントークン定義
├─ supabase/
│  ├─ migrations/                 # SQLスキーマ + RLS
│  └─ functions/
│     ├─ stripe-checkout/         # Checkoutセッション発行
│     ├─ stripe-webhook/          # 決済完了→purchases登録
│     ├─ trigger-rebuild/         # GitHub workflow_dispatch起動（token保持）
│     └─ get-paid-content/        # （RPCで足りない場合の予備）
├─ .github/workflows/deploy.yml   # workflow_dispatch対応の再ビルド&デプロイ
└─ docs/
   ├─ architecture.md             # 本書
   └─ specs/                      # 要件・デザイン仕様
```

> **注:** Tailwind は v4 採用済み。デザイン設計書の `tailwind.config.ts` 例ではなく、
> `globals.css` の `@theme` ブロックにデザイントークン（night/champagne/wine/ivory 等）を定義する。

---

## 5. データ設計（要件書 §8 準拠 + 有料分離）

要件書の5テーブル（reviews / shops / areas / users / purchases）に、有料本文分離テーブルを1つ追加。

### 5.1 テーブル一覧

| テーブル | 役割 | ビルド時取得 | RLS方針 |
|---------|------|:---:|--------|
| `areas` | 地域マスタ | ✅ | published を anon SELECT 可 |
| `shops` | 店舗 | ✅ | published を anon SELECT 可 |
| `reviews` | レビュー（**無料情報のみ**。有料本文は持たない） | ✅ | published を anon SELECT 可 |
| `review_paid_contents` | **有料本文（分離）** | ❌ **絶対不可** | 購入者本人 / 著者 / admin のみ SELECT |
| `users` | 会員（Supabase Auth と連携、role保持） | ❌ | 本人 / admin |
| `purchases` | 購入履歴 | ❌ | 本人 / admin |

- `reviews` から有料カラム（要件書の `paid_body`）を**外し**、`review_paid_contents.body` へ移設。
- 各スコア9指標（総合・色気・清潔感・接客・距離感・写真再現度・初心者向け・コスパ・再訪度）は `reviews` に保持（無料表示可）。
- `role`: guest / member / paid_member / writer / editor / admin（要件書 §7）。

### 5.2 権限マトリクス（要件書 §7.2 準拠）

| コンテンツ | guest | member | paid_member(購入済) | admin |
|---|:---:|:---:|:---:|:---:|
| 無料記事・有料記事の無料部分 | ✅ | ✅ | ✅ | ✅ |
| 有料記事の全文 | ❌ | 購入済のみ✅ | ✅ | ✅ |
| 管理画面 | ❌ | ❌ | ❌ | ✅ |

RLS と RPC で**サーバー側強制**する（クライアント判定だけに頼らない）。

---

## 6. 決済フロー（Stripe × Edge Functions）

```
[未購入ユーザーが「この店の本音を確認する」]
        │
        ▼
[Edge Function: stripe-checkout] Checkoutセッション発行（記事ID・ユーザーID付き）
        │
        ▼
[Stripe Checkout画面] でカード決済（1記事 300〜500円想定）
        │
        ▼
[Stripe Webhook] → [Edge Function: stripe-webhook] が受信
        │  └─ 署名検証 → purchases に paid で登録
        ▼
[次回以降] RPC get_review_paid_content が購入を検出 → 有料本文を返す
```

- 初期MVPは**ロックUI + DB設計 + 購入判定**まで完成させ、Stripe実接続は鍵を入れれば動く状態にする（要件書 §9.1）。
- 将来のサブスク（`subscriptions` テーブル追加）に拡張できる構造を維持。

### 6.1 Stripeコンプライアンス（重要）

Stripe は性的サービス・成人向け性的コンテンツを制限対象とする。**販売商品は「メンズエステ店舗の判断に役立つ有料レビュー」**と明確に位置づける。

- OK: 店舗レビュー / 体験談 / 料金 / 清潔感 / 接客 / 雰囲気 / 初心者向け / 写真とのギャップ / 再訪判断
- NG寄り（使わない）: 性的サービスの内容 / 性的満足を売りにした表現 / 過激な画像

> リスク詳細は実装フェーズ7前に `risk-compliance` で再評価する。

---

## 7. 実装フェーズ計画

| Phase | 内容 | 検証条件 | 外部依存 |
|:---:|------|---------|---------|
| **0** | 基盤: next.config（export維持）/ 依存追加 / Tailwind v4 テーマ / ディレクトリ / 旧ブログコード除去 | `npm run build` 成功・型エラー0 | なし |
| **1** | DBスキーマ + RLS + RPC + シードデータ（Supabase migrations） | ローカルSupabaseでRLSテスト通過（未購入で有料本文取得不可） | Supabase |
| **2** | デザインシステム + 共通UI（Header/Footer/Button/ScoreBadge/PlaceholderImage 等） | Storybook的に各UIが仕様の配色・角丸で表示 | なし |
| **3** | 公開画面（トップ/一覧/詳細無料部分/地域/店舗/ランキング）静的生成 | ビルド成果物に有料本文が**含まれないこと**をgrep検証 | Supabase(build) |
| **4** | 認証 + 有料ロックUI + 購入判定（CSR + RPC） | 未ログイン/未購入で有料本文が取得できないことをE2E検証 | Supabase |
| **5** | 管理画面（CRUD・スマホ投稿フォーム・スコア入力・下書き/公開） | スマホ幅で投稿〜下書き保存〜公開切替が動作 | Supabase |
| **6** | 公開反映（Edge Function → workflow_dispatch + deploy.yml改修） | 公開操作→数分後に静的反映、tokenがブラウザに露出しないこと | Supabase + GitHub |
| **7** | Stripe Checkout / Webhook（Edge Functions） | テストモードで購入→purchases登録→有料本文解放 | Supabase + Stripe |
| **8** | QA・受け入れ条件検証（要件書§13 / デザイン§17 全項目） | 全受け入れ条件 PASS | — |

- **Phase 0〜3 は外部サービスの実プロジェクト無しでも着手可能**（Supabaseはローカル/Dockerで開発可）。
- 社長操作が必要なポイント: Supabaseプロジェクト作成・GitHub token発行・Stripeアカウント（Phase 1/6/7開始時に依頼）。

### 7.1 🛑 停止ゲート（社長承認必須）

- **Phase 0 完了後 → Phase 1 着手前に必ず停止する。** 以下を社長に提示して承認を得る:
  1. DBテーブル一覧（全カラム・型・必須）
  2. RLSポリシー一覧（テーブルごとに誰が select/insert/update/delete 可か）
  3. RPC関数一覧（シグネチャ・内部の権限検証ロジック）
  4. 権限設計（guest〜admin × コンテンツのマトリクス）
- 上記の承認なしに Phase 1 のSQL実装・migration適用へ進まない。

---

## 8. セキュリティ受け入れ条件（実装完了の絶対ゲート）

以下が1つでもNGなら未完成とする。

- [ ] **`out/` 配下の全 .html / .js / .json を grep して、以下が1つも含まれない:**
  - [ ] 有料本文（`review_paid_contents.body`）が1文字も含まれない
  - [ ] Supabase `service_role` key が含まれない
  - [ ] GitHub token が含まれない
  - [ ] Stripe secret key（`sk_...` / webhook secret）が含まれない
- [ ] 未ログインユーザーが RPC を直接叩いても有料本文が返らない
- [ ] 未購入の member が有料本文を取得できない
- [ ] 購入判定がクライアント単独で完結せず、RPC または Edge Function 側で検証されている
- [ ] URL直打ちで非公開（draft/private）記事が公開側に出ない
- [ ] admin 以外が管理画面の書き込み操作をできない（RLSで拒否）
- [ ] TypeScript 型エラー 0 / 主要フォームに Zod バリデーション

---

## 9. 未確定事項（実装中に詰める）

- Supabaseプロジェクトを Free 本番1個で行くか、開発はローカル(Docker)にするか → Phase 1 で決定
- 配信は GitHub Pages 継続が第一候補。Actions のビルド時間 / 反映速度次第で Cloudflare Pages 検討
- 画像ストレージ（Supabase Storage か R2）は画像差し替えフェーズで決定（MVPはプレースホルダー）
</content>
</invoke>
