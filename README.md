# Men's Blogsite (Static)

Men's Blogsite は、男性向けの体験談コンテンツを心地よく読むための静的な Next.js サイトです。データは TypeScript で管理され、ビルド時にすべてのページが生成されるため、CDN などでそのまま配信できます。

## プロジェクト構成

- `src/content/` — 記事・カテゴリ・タグなどのスタティックデータと、それらを扱うユーティリティ。
- `src/components/` — 記事カードや目次などの UI コンポーネント。
- `src/lib/mdx.ts` — MDX をレンダリングし、目次を生成するヘルパー。
- `src/app/` — App Router ベースのページ。`output: "export"` によりビルド時に静的化されます。

## セットアップ

```bash
npm install
```

## 主なスクリプト

- `npm run dev` — 開発サーバーを起動します。
- `npm run build` — 静的ファイルを生成します（`.next` 配下）。
- `npm run start` — ビルド結果をローカルで確認します。
- `npm run lint` — ESLint を実行します。

## データの更新

- 記事・カテゴリ・タグは `src/content/data.ts` に定義されています。
- サマリー取得や検索などのロジックは `src/content/api.ts` にまとまっています。
- 検索ページはクライアントサイドでフィルタリングを行い、クエリパラメータを用いた絞り込みとページネーションに対応しています。

## ビルドとデプロイ

`next.config.ts` で `output: "export"` と `images.unoptimized: true` を設定しているため、`npm run build` のみで静的ファイル一式を生成できます。生成物は Vercel の Static Hosting や GitHub Pages、S3 など任意のホスティングサービスに配置可能です。

### GitHub Pages での公開

- `.github/workflows/deploy.yml` で GitHub Actions によるビルド&デプロイを自動化しています。`main` ブランチへ push するかワークフローを手動実行すると、`out/` に生成された静的ファイルが `gh-pages` 環境へ公開されます。
- リポジトリ設定の **Settings → Pages** で「Source: GitHub Actions」を選択し、必要であればカスタムドメイン (`jiisan-estet.com` など) を登録してください。
- `_next/` 配下のアセットが Jekyll によって無視されないよう、`public/.nojekyll` を配布物に含めています。

## カスタマイズのヒント

- 新しい記事を追加する場合は `src/content/data.ts` に追記してください。
- デザインの調整は `src/app/globals.css` およびコンポーネントを編集するだけで反映されます。
- OG タグや構造化データの出力は `src/app/posts/[slug]/page.tsx` で行っています。必要に応じてカスタマイズしてください。

## ライセンス

このリポジトリは MIT ライセンスで公開されています。
