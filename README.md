# Men's Blogsite

男性向け体験談を軸にした収益化可能なブログメディアのNext.jsアプリケーションです。現時点では基礎スキャフォールドに加えて、Prismaスキーマ・マイグレーション・シードデータ、NextAuthによるメール／パスワード認証の下準備を完了しています。

## セットアップ手順
1. 依存関係をインストール
   - `npm install`
2. 環境変数を設定
   - `.env.example` を `.env` にコピーし、`DATABASE_URL`・`AUTH_SECRET`・`NEXTAUTH_URL`・`STRIPE_SECRET_KEY`・`STRIPE_WEBHOOK_SECRET` を適切な値に変更
   - ストレージドライバを切り替える場合は `STORAGE_DRIVER`（`local` または `s3`）とS3関連の環境変数を設定
   - ストレージドライバを切り替える場合は `STORAGE_DRIVER` (`local` / `s3`) と S3関連の環境変数を設定
3. データベースを初期化
   - `npm run db:generate` — Prisma Client の生成
   - `npm run db:push` — スキーマをローカル開発DBへ反映 ※本番環境は `npm run db:migrate`
   - `npm run db:seed` — 初期データ投入（管理者アカウント、カテゴリ/タグ/記事10件）

## 実行コマンド
- `npm run dev` — 開発サーバーを起動（http://localhost:3000）
- `npm run build` — 本番ビルドの生成
- `npm run start` — 本番ビルドの起動確認
- `npm run lint` — ESLintによる静的解析
- `npm run db:migrate` — 本番/ステージングでマイグレーションを適用

## 初期データ
- 管理者アカウント: `admin@example.com` / `Admin123!`
- カテゴリ: キャリア / 健康 / ライフスタイル / 人間関係
- タグ: メンタルヘルスなど6種
- 記事: 公開済み10件（有料/無料を混在）

## 認証スキャフォールド
- NextAuth v5 + Prisma Adapter + Credentials Provider（メール／パスワード）
- `/login` でサインインフォームを提供
- `/admin` 配下はMiddlewareでADMINロールのみ許可（その他はトップへリダイレクト）
- 将来的なOAuth追加やEmailリンク認証に対応できるよう、NextAuth標準のテーブル構成を採用

## Prisma構成
- `prisma/schema.prisma` — 指定スキーマ（User/Post/Category/Tag/Purchase/Setting/Comment + NextAuth標準モデル）
- `prisma/migrations/20250101000000_init/` — 初期マイグレーションSQL
- `prisma/seed.ts` — bcryptハッシュ済みの管理者、カテゴリ/タグ、記事10件、設定値3件を投入

## バックエンド構成
- `src/server/repositories` — Prismaに依存するデータアクセス層。公開/管理で責務を分割。
- `src/server/services` — ドメインユースケースをカプセル化（検索、所有判定、チェックアウト、購入記録、管理投稿、設定など）。
- `src/server/adapters/stripe.ts` — Stripe SDKの抽象化。将来他社決済への差し替えも容易。
- `src/server/validators` — Zodスキーマを集約し、API間で再利用。
- `src/server/utils/mdx.ts` — MDXのレンダリングと目次生成を担うユーティリティ。
- APIルートはサービス層にのみ依存し、SOLID原則（特に単一責任/依存関係逆転）を意識した構造になっています。

## 公開UI
- `/` トップページは最新記事・人気記事・カテゴリグリッド・タグクラウドを表示。AdSlotによる広告プレースホルダと検索導線を用意。
- `/posts/[slug]` 記事詳細はMDXで本文をレンダリングし、目次のIntersection Observer、自動広告枠、関連記事・前後記事を掲載。課金記事は導入のみ表示し、購入ボタンからStripe Checkoutへ遷移。OGP/Twitterカード生成とArticle構造化データを出力し、コメント機能はサイト設定＋記事設定が有効な場合のみ表示。
- `/category/[slug]` `/tag/[slug]` はカテゴリ／タグごとの記事一覧とページネーションを提供。
- `/search` はキーワード・カテゴリ・タグを組み合わせたサーバーサイド検索画面。

## 管理UI
- 共通レイアウト（サイドバー＋ヘッダー）で `/admin` 配下の画面を統一。
- `/admin/posts` 記事一覧：公開ステータスフィルタ、ページネーション、公開URL・編集リンクを提供。
- `/admin/posts/new` `/admin/posts/[id]` 記事作成/編集フォーム：React Hook Form + Zod でバリデーション、MDX本文入力、カテゴリ/タグ複数選択、課金設定、予約公開、カバー画像アップロード（`/api/admin/media`）に対応。
- `/admin/settings` サイト設定フォーム：広告枠ID・SEOデフォルト・アフィリエイト共通パラメータ・コメントサイト設定をまとめて更新。
- `/admin/comments` コメント承認ダッシュボード（ダミー実装）。
- 管理画面にトースト通知を追加し、記事やサイト設定の保存結果を即時にフィードバック。

## 公開API
- `GET /api/search` — クエリ・カテゴリ・タグで記事検索（ページネーション対応）。
- `GET /api/posts/[slug]/ownership` — 認証済みユーザーの購入有無を判定。
- `POST /api/checkout` — Stripe CheckoutセッションURLを生成（有料記事のみ）。
- `POST /api/stripe/webhook` — Checkout完了イベントから `Purchase` を登録。
- `POST /api/comments` — コメント送信用ダミーエンドポイント（現状はモデレーション待機を返す）。

## 管理API
- `GET/POST /api/admin/posts` — 投稿の一覧取得・新規作成。
- `GET/PATCH/DELETE /api/admin/posts/[id]` — 投稿の取得・更新・削除。
- `GET/PUT /api/admin/settings` — サイト全体設定の参照・更新。
- `POST /api/admin/media` — 画像アップロードエンドポイント。

## Stripe CLIによる検証例
1. `stripe login`
2. `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. ログイン済みで `/api/checkout` を叩き、レスポンスURLをブラウザで開く
4. 決済完了後、Webhook経由で `Purchase` レコードが作成されることを確認

## Stripe / S3 運用メモ
- 決済は `CheckoutService` 内で Stripe Price を再利用するため、記事価格を変更した際も既存 price を置き換える。
- Webhook は idempotency を `providerSessionId` で担保。再配信時も `upsert` で安全に処理される。
- `STRIPE_MOCK=true` を設定するとモックアダプタが動作し、E2E/ローカルで外部アクセスなく確認できる。
- S3 利用時は `STORAGE_DRIVER=s3` と併せてバケット名、認証情報、公開URLを環境変数で指定。`S3_FORCE_PATH_STYLE=true` を設定するとローカルエミュレータと接続しやすい。
- 重要操作（Webhook受信、価格更新）はログ出力されるようにし、本番ではログ集約基盤に転送することを推奨。

## 検証チェックリスト（現在の進捗）
- [ ] `.env` を設定し、PostgreSQLに接続できる
- [ ] `npm run db:push` が成功する
- [ ] `npm run db:seed` で管理者と初期データが投入される
- [ ] `npm run dev` がエラーなく起動し、トップページが表示される
- [ ] `/login` から管理者アカウントでサインインし、`/admin` にアクセスできる
- [ ] `npm run lint` が成功する
- [ ] `/posts/[slug]` で無料記事は全文、有料記事は導入のみ表示され、購入ボタンがStripe Checkoutに遷移する
- [ ] `/category/[slug]` `/tag/[slug]` `/search` で記事一覧のフィルタリングとページネーションが機能する
- [ ] `/admin/posts` / `/admin/posts/new` / `/admin/posts/[id]` で記事のCRUDが行える
- [ ] `/admin/settings` で設定値を更新するとAPI経由で `Setting` テーブルに反映される
- [ ] 画像アップロード（カバー画像）が `/api/admin/media` 経由で成功し、`public/uploads` または S3 に保存される
- [ ] `/sitemap.xml` と `/robots.txt` が想定どおり生成される
- [ ] Stripeモック（`STRIPE_MOCK=true`）で購入フローE2Eが成功する
- [ ] コメント設定（サイト設定＋記事個別設定）をONにするとコメントフォームと管理画面が動作する

今後はPrismaを用いたAPI実装、NextAuthの登録フロー拡張、Stripe Checkout連携、管理画面UIの構築などを段階的に進めます。
- [ ] 画像アップロード（カバー画像）が `/api/admin/media` 経由で成功し、`public/uploads` または S3 に保存される

## E2Eテスト
- Playwright を利用しています。初回は `npx playwright install` でブラウザを取得してください。
- `npm run test:e2e` で `PLAYWRIGHT_BASE_URL`（未指定時は `http://localhost:3000`）に対してテストを実行します。Stripe呼び出しは `STRIPE_MOCK=true` をサーバーに設定することでモックされます。
- パフォーマンス測定: `npm run test:lighthouse` でLighthouseスコアを取得（レポートは `reports/lighthouse/` に出力）。
- Playwrightにスモーク的な性能テスト（トップLCP目安）を追加済み。
