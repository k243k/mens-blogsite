# 本番デプロイ手順書（Phase 6A）

**対象:** メンズエステ体験レビューサイト（mens-blogsite）
**前提:** 固定費0円構成（GitHub Pages + Supabase Free + Stripeは後続）。Vercel不使用。
**ステータス:** 実装・設定完了。**本番Secrets投入と実公開は社長の指示後に実施。**

---

## 0. 全体像

```
[管理者が記事編集画面で「公開してサイトに反映」]
   │  publish_review RPC（status=published + rebuild_jobs=queued）
   ▼
[Edge Function: trigger-rebuild]  ← Secrets: service_role / GitHub token
   │  GitHub Actions を workflow_dispatch で起動（job_id を inputs で渡す）
   │  rebuild_jobs = dispatched
   ▼
[GitHub Actions: deploy.yml]  ← Secrets: NEXT_PUBLIC_SUPABASE_*（anon）/ service_role
   │  npm run build（Supabaseから無料公開情報のみ取得）→ out/ → GitHub Pages
   │  完了後 rebuild_jobs = succeeded / failed（github_run_id 記録）
   ▼
[数分後] 公開ページに反映
```

---

## 1. Supabase 本番プロジェクト作成手順

1. https://supabase.com にログイン → **New project**（Free プラン）。
2. リージョンは `Northeast Asia (Tokyo)` 推奨。DBパスワードを控える。
3. プロジェクト作成後、**Project Settings → API** で以下を控える:
   - Project URL（`https://xxxx.supabase.co`）
   - `anon` public key（公開可）
   - `service_role` key（⚠️ 秘密。ブラウザに出さない）
4. ローカルのスキーマを本番へ反映:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push          # migrations/ を本番に適用
   ```
   ※ `seed.sql` は流さない（テストユーザー・テストデータのため）。
5. 管理者ユーザーを1人作成（Authentication → Add user）し、SQL で role を付与:
   ```sql
   update profiles set role = 'admin' where email = '<あなたの管理用メール>';
   ```

---

## 2. Supabase Secrets 設定項目（Edge Function 用）

`supabase secrets set` または Dashboard（Edge Functions → Secrets）で設定。
**いずれもブラウザ・NEXT_PUBLIC には絶対に置かない。**

| Secret 名 | 用途 | 例 |
|-----------|------|-----|
| `SUPABASE_URL` | Function から自身のDBへ | `https://xxxx.supabase.co`（自動注入される場合あり） |
| `SUPABASE_ANON_KEY` | JWT検証用 | anon key（自動注入される場合あり） |
| `SUPABASE_SERVICE_ROLE_KEY` | profiles/role確認・rebuild_jobs更新 | service_role key |
| `GITHUB_DISPATCH_TOKEN` | workflow_dispatch 起動 | GitHub PAT（下記） |
| `GITHUB_REPO` | 対象リポジトリ | `k243k/mens-blogsite` |
| `GITHUB_WORKFLOW_FILE` | （任意）workflow ファイル名 | `deploy.yml`（デフォルト） |
| `ALLOWED_ORIGIN` | （任意）CORS 制限 | `https://jiisan-estet.com` |

設定例:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxxx GITHUB_DISPATCH_TOKEN=ghp_xxxx GITHUB_REPO=k243k/mens-blogsite
supabase functions deploy trigger-rebuild
```

> `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` は Supabase が Edge Function に
> 自動注入する場合がある。注入されない環境のみ明示設定する。

---

## 3. GitHub Personal Access Token 作成手順

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**。
2. **Repository access**: `k243k/mens-blogsite` のみ。
3. **Permissions → Actions: Read and write**（workflow_dispatch 起動に必要）。
4. 有効期限を設定し、生成された `ghp_...` を控える。
5. このトークンは **Supabase Secrets の `GITHUB_DISPATCH_TOKEN` にのみ** 設定する（GitHub Secretsではない）。

---

## 4. GitHub Secrets 設定項目

リポジトリ → **Settings → Secrets and variables → Actions → New repository secret**。

| Secret 名 | 用途 | 公開性 |
|-----------|------|--------|
| `NEXT_PUBLIC_SITE_URL` | サイトURL（メタ/sitemap） | 公開URL |
| `NEXT_PUBLIC_SUPABASE_URL` | ビルド時データ取得 | 公開可 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ビルド時データ取得（RLSで無料情報のみ） | 公開可 |
| `SUPABASE_SERVICE_ROLE_KEY` | （任意）ビルド完了後の rebuild_jobs 更新 | ⚠️秘密 |

> `SUPABASE_SERVICE_ROLE_KEY` 未設定でもビルド・公開は動く（ジョブ状態の自動更新だけスキップ）。

---

## 5. GitHub Pages 設定手順

1. リポジトリ → **Settings → Pages**。
2. **Source: GitHub Actions** を選択。
3. カスタムドメイン: `jiisan-estet.com`（`CNAME` ファイルが配信物に含まれる）。
4. 初回は `main` への push で自動ビルド。以降は管理画面の「公開してサイトに反映」で workflow_dispatch 起動。

---

## 6. 本番反映前チェックリスト

- [ ] `supabase db push` でスキーマ適用済み（migrations 3本）
- [ ] 本番に管理者ユーザー作成＋ `role='admin'` 付与済み
- [ ] Supabase Secrets 設定済み（service_role / GitHub token / GITHUB_REPO）
- [ ] `supabase functions deploy trigger-rebuild` 済み
- [ ] GitHub Secrets 設定済み（NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SITE_URL）
- [ ] GitHub PAT は Actions: write 権限・対象リポのみ
- [ ] GitHub Pages の Source = GitHub Actions
- [ ] **out/ に有料本文・service_role・token・Stripe secret が含まれないことを確認**（`npm run build` 後 grep）
- [ ] RLSテスト（公開9 + 管理6）が全PASS
- [ ] 一般userで `/admin` と公開反映が拒否されることを確認

---

## 7. dry-run（本番Secrets無しでの動作確認）

ローカルで Edge Function の権限判定だけ確認できる:
```bash
supabase functions serve trigger-rebuild --no-verify-jwt   # ローカル確認用
# 別ターミナルで未ログイン/一般user/staff のJWTを付けて POST し、401/403/通過を確認
```
GitHub token 未設定時は `not_configured`(503) を返し、内部値は晒さない。
