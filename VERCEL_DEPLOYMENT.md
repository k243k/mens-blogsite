# Vercelデプロイメントガイド

このガイドでは、mens-blogsiteプロジェクトをVercelにデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（https://vercel.com）
- PostgreSQLデータベース（下記のいずれか）
  - Vercel Postgres
  - Supabase
  - Neon
  - その他のPostgreSQLサービス

## デプロイ手順

### 1. データベースのセットアップ

#### オプションA: Vercel Postgres（推奨）

1. Vercelダッシュボードで「Storage」タブを開く
2. 「Create Database」→「Postgres」を選択
3. データベース名を入力して作成
4. 「Connection String」をコピー（環境変数として使用）

#### オプションB: Supabase

1. https://supabase.com にアクセス
2. 新しいプロジェクトを作成
3. 「Settings」→「Database」で接続文字列を取得
4. 接続文字列の形式: `postgresql://[user]:[password]@[host]:[port]/[database]?pgbouncer=true`

#### オプションC: Neon

1. https://neon.tech にアクセス
2. 新しいプロジェクトを作成
3. 接続文字列をコピー

### 2. Vercelプロジェクトの作成

1. Vercelダッシュボードで「Add New」→「Project」を選択
2. GitHubリポジトリ（k243k/mens-blogsite）をインポート
3. 「Configure Project」画面で環境変数を設定

### 3. 環境変数の設定

Vercelダッシュボードの「Environment Variables」セクションで以下を設定：

#### 必須の環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DATABASE_URL` | PostgreSQL接続文字列 | `postgresql://user:pass@host:5432/dbname` |
| `AUTH_SECRET` | NextAuth用のランダムな秘密鍵 | `openssl rand -base64 32` で生成 |
| `NEXTAUTH_URL` | デプロイ後のURL | `https://your-app.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripeシークレットキー | `sk_test_...` または `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhookシークレット | `whsec_...` |

#### オプションの環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `STORAGE_DRIVER` | ストレージドライバー | `local` |
| `S3_BUCKET` | S3バケット名（S3使用時） | - |
| `S3_REGION` | S3リージョン（S3使用時） | - |
| `S3_ACCESS_KEY_ID` | S3アクセスキー（S3使用時） | - |
| `S3_SECRET_ACCESS_KEY` | S3シークレットキー（S3使用時） | - |
| `S3_PUBLIC_URL` | S3公開URL（S3使用時） | - |

### 4. ビルドコマンドの設定

Vercelは自動的に以下のコマンドを実行します：

```bash
# インストール（postinstallで prisma generate が実行される）
npm install

# ビルド
npm run build
```

### 5. データベースマイグレーションの実行

初回デプロイ後、以下の手順でデータベースを初期化します：

1. Vercelダッシュボードで「Settings」→「Functions」を開く
2. または、ローカルから以下のコマンドを実行：

```bash
# .envにDATABASE_URLを設定
DATABASE_URL="your-production-database-url" npx prisma migrate deploy

# シードデータの投入（オプション）
DATABASE_URL="your-production-database-url" npm run db:seed
```

### 6. Stripe Webhookの設定

1. Stripe Dashboard（https://dashboard.stripe.com）にログイン
2. 「Developers」→「Webhooks」を開く
3. 「Add endpoint」をクリック
4. Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
5. 「Select events」で以下のイベントを選択：
   - `checkout.session.completed`
6. Webhook署名シークレットをコピーして、`STRIPE_WEBHOOK_SECRET`環境変数に設定

### 7. デプロイの確認

1. Vercelが自動的にビルドとデプロイを開始
2. デプロイが完了したら、生成されたURLにアクセス
3. 動作確認：
   - トップページが表示される
   - `/login`で管理者ログインができる
   - `/admin`で管理画面にアクセスできる

## トラブルシューティング

### ビルドエラー: "Cannot find module '@prisma/client'"

**原因**: Prisma Clientが生成されていない

**解決策**: package.jsonに`postinstall`スクリプトが追加されているか確認

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### データベース接続エラー

**原因**: DATABASE_URLが正しく設定されていない、またはデータベースがアクセス不可

**解決策**:
1. Vercelの環境変数で`DATABASE_URL`が正しく設定されているか確認
2. データベースのホワイトリスト設定でVercelのIPアドレスを許可
3. 接続文字列の形式を確認（`postgresql://user:pass@host:5432/dbname`）

### Prismaマイグレーションエラー

**原因**: データベーススキーマが適用されていない

**解決策**:
```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

### Stripe Webhookが動作しない

**原因**: Webhook URLまたはシークレットが正しくない

**解決策**:
1. Stripe Dashboardで正しいURLが設定されているか確認
2. `STRIPE_WEBHOOK_SECRET`環境変数が正しいか確認
3. Vercelのログでエラーメッセージを確認

### 画像アップロードエラー（local storage使用時）

**原因**: Vercelのファイルシステムは読み取り専用

**解決策**: S3などのクラウドストレージに切り替え

```bash
STORAGE_DRIVER=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```

## 環境変数の生成コマンド

### AUTH_SECRETの生成

```bash
openssl rand -base64 32
```

または

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## デプロイ後のチェックリスト

- [ ] トップページ（`/`）が正常に表示される
- [ ] 管理者ログイン（`/login`）が機能する
- [ ] 管理画面（`/admin`）にアクセスできる
- [ ] 記事の作成・編集・削除ができる
- [ ] 有料記事の購入フローが動作する
- [ ] Stripe Webhookが正常に受信される
- [ ] 画像アップロードが機能する
- [ ] コメント機能が動作する（有効化している場合）

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
