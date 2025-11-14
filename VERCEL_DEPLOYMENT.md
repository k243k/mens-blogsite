# Vercel デプロイ手順（静的サイト）

本プロジェクトは Next.js の静的エクスポート (`output: "export"`) を利用しています。Vercel ではビルド後の静的ファイルが自動でホスティングされるため、追加の設定はほとんど不要です。

## 1. プロジェクトのインポート

1. Vercel ダッシュボードで「New Project」→「Import Git Repository」。
2. 本リポジトリを選択し、フレームワークとして Next.js が検出されることを確認します。

## 2. ビルドコマンドと出力

- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Dir**: 自動設定（`.next` 配下が静的配信に変換されます）

追加の環境変数は不要です。`NEXT_PUBLIC_SITE_URL` を設定すると、OGP や sitemap の URL を本番用に揃えられます。

## 3. デプロイ後の確認

- `/`、`/posts/[slug]`、`/category/[slug]`、`/tag/[slug]`、`/search` が問題なく表示されることを確認してください。
- `/sitemap.xml` と `/robots.txt` が公開 URL を指しているかチェックします。

## 4. キャッシュ更新

コンテンツを変更した場合は、再デプロイまたは Vercel の「Redeploy」機能を利用してください。静的出力のため ISR や API 由来の再検証処理はありません。
