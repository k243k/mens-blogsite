# 環境変数セットアップメモ

静的サイト化により、必須の環境変数はほとんどありません。

| 変数 | 用途 | 備考 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | OGP や sitemap のベース URL | 未設定の場合は `http://localhost:3000` が使われます |

開発時は `.env.local`（任意）に以下を記述すると便利です。

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

その他の API キーや DB 接続情報は不要です。追加で外部サービスと連携する際に、必要な環境変数を定義してください。
