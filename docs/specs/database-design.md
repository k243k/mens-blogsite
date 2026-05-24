# メンズエステ体験レビューサイト DB設計書（Phase 1）

**作成日:** 2026-05-24
**ステータス:** 設計提示（実装着手前・社長承認待ち）
**対象DB:** Supabase PostgreSQL（Auth / RLS / RPC / Edge Functions）
**関連:** `docs/architecture.md` / `docs/specs/mens-esthe-review_requirements.md` §8

> ⚠️ 本書は **設計提示のみ**。SQL migration の適用・RLS作成・RPC作成・Edge Functions実装には
> まだ入らない。社長承認後に Phase 1 実装へ進む。

---

## 0. 設計の3大原則（社長レビュー観点）

| # | 原則 | どう担保するか |
|---|------|--------------|
| ① | **有料本文を `reviews` に混ぜない** | 有料本文は `review_paid_contents` に物理分離。`reviews` に有料本文カラムを一切持たせない |
| ② | **「購入者だけ読める」をDB側で保証** | `review_paid_contents` の RLS で `purchases`/`subscriptions` を照合。アプリ層の判定に依存しない |
| ③ | **静的ビルド取得は無料公開情報のみ** | ビルドは `anon` ロールで公開ビュー（`reviews`/`shops`/`areas`/`review_scores`）だけSELECT。有料テーブルは anon に対し RLS で全拒否 |

### 0.1 鍵・トークンの配置（絶対条件）

| 秘密情報 | 置き場所 | 置いてはいけない場所 |
|---------|---------|---------------------|
| `service_role` key | Edge Functions の Secrets のみ | ❌ ブラウザ / ❌ `NEXT_PUBLIC_*` / ❌ 静的ビルド成果物 |
| `STRIPE_SECRET_KEY` / webhook secret | Edge Functions の Secrets のみ | ❌ 同上 |
| `GITHUB_DISPATCH_TOKEN` | Edge Functions の Secrets のみ | ❌ 同上 |
| `anon` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY`（公開可・RLS前提） | — |

---

## 1. DBテーブル一覧

| テーブル | 役割 | ビルド時取得(anon) | 有料/機密 |
|---------|------|:---:|:---:|
| `profiles` | 会員プロフィール（`auth.users` と1:1、ロール保持） | ❌ | 機密 |
| `areas` | 地域マスタ | ✅ | 公開 |
| `shops` | 店舗 | ✅ | 公開 |
| `reviews` | レビュー（**無料公開情報のみ**） | ✅ | 公開 |
| `review_scores` | 9指標スコア（reviewsと1:1・無料公開） | ✅ | 公開 |
| `review_paid_contents` | **有料本文（物理分離）** | ❌ **絶対不可** | 🔒有料 |
| `purchases` | 単品購入履歴 | ❌ | 機密 |
| `subscriptions` | サブスク（将来拡張） | ❌ | 機密 |
| `media_assets` | 画像メタ（MVPはプレースホルダー、構造のみ） | ✅(公開分) | 公開 |
| `rebuild_jobs` | 公開→再ビルドのジョブ状態（管理画面の反映ステータス用） | ❌ | 機密 |
| `audit_logs` | 管理操作の監査ログ | ❌ | 機密 |

> **設計判断:** `auth.users`（Supabase組み込み）はアプリから直接いじらず、`public.profiles` を1:1で作って
> `id = auth.users.id` で参照する（Supabase定石）。要件書の `users` テーブルは `profiles` に置き換え。
> スコアは `review_scores` に1:1分離（`reviews` 本体の肥大化回避＋スコア改定の独立性）。

---

## 2. カラム定義（DDLスケッチ）

> 型・制約の確認用スケッチ。実DDLはmigrationで確定（本書では適用しない）。

### 2.1 `profiles`
```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  role        text not null default 'user'
              check (role in ('user','writer','editor','admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```
> `guest` は未ログイン（`auth.uid()` が null）なので行を持たない。`purchaser` はロールでなく
> `purchases`/`subscriptions` の有無で動的判定する（§5 参照）。

### 2.2 `areas`
```sql
create table areas (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references areas(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  meta_title  text,
  meta_description text,
  display_order integer default 0,
  status      text not null default 'published' check (status in ('published','private')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### 2.3 `shops`
```sql
create table shops (
  id           uuid primary key default gen_random_uuid(),
  area_id      uuid not null references areas(id) on delete restrict,
  name         text not null,
  slug         text not null unique,
  official_url text,
  station      text,
  price_min    integer,
  price_max    integer,
  business_hours text,
  description  text,
  caution      text,
  status       text not null default 'published' check (status in ('published','private')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
```

### 2.4 `reviews`（⚠️ 有料本文を持たない）
```sql
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops(id) on delete restrict,
  area_id       uuid not null references areas(id) on delete restrict,
  author_id     uuid references profiles(id) on delete set null,
  title         text not null,
  slug          text not null unique,
  visit_date    date,
  price         integer,
  course_minutes integer,
  summary       text,              -- 一言結論（無料）
  free_body     text not null,     -- 無料本文（Markdown）
  -- ❌ paid_body はここに置かない（review_paid_contents に分離）
  is_paid       boolean not null default false,
  is_pr         boolean not null default false,
  status        text not null default 'draft' check (status in ('draft','published','private')),
  thumbnail_url text,
  main_image_url text,
  meta_title    text,
  meta_description text,
  noindex       boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

### 2.5 `review_scores`（reviewsと1:1・無料公開）
```sql
create table review_scores (
  review_id            uuid primary key references reviews(id) on delete cascade,
  overall_score        numeric(2,1) check (overall_score between 1.0 and 5.0),
  sensual_score        numeric(2,1),
  cleanliness_score    numeric(2,1),
  service_score        numeric(2,1),
  distance_score       numeric(2,1),
  photo_accuracy_score numeric(2,1),
  beginner_score       numeric(2,1),
  cost_score           numeric(2,1),
  revisit_score        numeric(2,1)
);
```

### 2.6 `review_paid_contents`（🔒 有料本文・物理分離）
```sql
create table review_paid_contents (
  review_id        uuid primary key references reviews(id) on delete cascade,
  body             text not null,   -- 有料本文（Markdown）
  photo_gap        text,            -- 写真とのギャップ
  satisfaction     text,            -- 実際の満足度
  revisit_opinion  text,            -- 再訪したいか
  beginner_caution text,            -- 行く前の注意点
  target_type      text,            -- この店が刺さる人
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

### 2.7 `purchases`
```sql
create table purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  review_id   uuid not null references reviews(id) on delete cascade,
  amount      integer not null,
  currency    text not null default 'jpy',
  payment_provider text not null default 'stripe',
  payment_status   text not null check (payment_status in ('paid','refunded','failed')),
  provider_payment_id text,
  created_at  timestamptz not null default now(),
  unique (user_id, review_id)        -- 同一記事の二重購入防止
);
```

### 2.8 `subscriptions`（将来拡張）
```sql
create table subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  status      text not null check (status in ('active','canceled','past_due')),
  current_period_end timestamptz,
  provider_subscription_id text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### 2.9 `media_assets`
```sql
create table media_assets (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid references reviews(id) on delete cascade,
  shop_id     uuid references shops(id) on delete cascade,
  kind        text not null check (kind in ('thumbnail','main','in_article','shop_hero')),
  url         text not null,
  alt         text,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);
```

### 2.10 `rebuild_jobs`（公開反映ステータス）
```sql
create table rebuild_jobs (
  id          uuid primary key default gen_random_uuid(),
  triggered_by uuid references profiles(id) on delete set null,
  review_id   uuid references reviews(id) on delete set null,
  status      text not null default 'queued'
              check (status in ('queued','dispatched','building','succeeded','failed')),
  github_run_id text,
  message     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

### 2.11 `audit_logs`
```sql
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,         -- 例: review.publish / review.update / purchase.refund
  target_table text,
  target_id   uuid,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
```

---

## 3. 権限ロールと判定

| ロール | 定義 | 判定方法 |
|--------|------|---------|
| `guest` | 未ログイン読者 | `auth.uid()` が null |
| `user` | ログイン済み読者 | `profiles.role = 'user'` |
| `purchaser` | 購入済み読者（**論理状態**） | `purchases`(該当review,paid) **または** `subscriptions`(active) が存在 |
| `writer` | 記事作成者 | `profiles.role = 'writer'` |
| `editor` | 編集者 | `profiles.role = 'editor'` |
| `admin` | 管理者 | `profiles.role = 'admin'` |

> `purchaser` は `profiles.role` に持たせない（記事単位の動的権限のため）。
> 判定用ヘルパー関数 `is_staff()`（writer/editor/admin）と `has_review_access(p_review_id)` を用意（§5）。

### 3.1 権限設計マトリクス

| 操作 / コンテンツ | guest | user | purchaser | writer | editor | admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 公開記事の無料部分（reviews/scores/shops/areas published） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 有料本文（review_paid_contents） | ❌ | ❌ | ✅(該当記事) | ✅(自著) | ✅ | ✅ |
| draft/private 記事の閲覧 | ❌ | ❌ | ❌ | ✅(自著) | ✅ | ✅ |
| reviews の作成 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| reviews の更新 | ❌ | ❌ | ❌ | ✅(自著) | ✅ | ✅ |
| reviews の公開（status→published） | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| shops / areas 管理 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| purchases 自分の履歴閲覧 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| purchases 全件 / 返金 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| profiles のロール変更 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| audit_logs 閲覧 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. RLSポリシー一覧

> 全テーブルで `enable row level security`。`anon` と `authenticated` の2ロールに対し定義。
> service_role はRLSをバイパス（Edge Functions専用）。

### 4.1 公開系（ビルド時 anon 取得対象）

| テーブル | SELECT | INSERT / UPDATE / DELETE |
|---------|--------|--------------------------|
| `areas` | `status = 'published'` を anon/auth 許可 | staff(editor/admin) のみ |
| `shops` | `status = 'published'` を anon/auth 許可 | staff のみ |
| `reviews` | `status = 'published'` を anon/auth 許可。**加えて** 自著(writer)・staff は自分の draft/private も SELECT 可 | writer:自著insert/update、editor/admin:全 |
| `review_scores` | 親 `reviews` が SELECT 可なら許可（published連動） | staff / 自著writer |
| `media_assets` | `is_public = true` かつ親が公開 | staff |

> **重要:** `reviews` には有料本文が無いので、anon が published 行を全カラムSELECTしても漏れない。

### 4.2 🔒 `review_paid_contents`（核心）

```sql
alter table review_paid_contents enable row level security;

-- anon は一切SELECT不可（ポリシーを作らない＝全拒否）

-- authenticated: 購入済み本人 / 自著writer / editor / admin のみ
create policy paid_select on review_paid_contents
for select to authenticated
using (
  has_review_access(review_id)        -- 購入 or サブスク（§5）
  or is_staff()                        -- editor/admin
  or exists (                          -- 自著 writer
    select 1 from reviews r
    where r.id = review_paid_contents.review_id
      and r.author_id = auth.uid()
  )
);

-- INSERT/UPDATE は staff / 自著writer のみ（select同様の条件）
```
> これにより「購入者だけ読める」が **DB側で強制**される。アプリのバグやAPI直叩きでも漏れない。

### 4.3 機密系

| テーブル | ポリシー |
|---------|---------|
| `profiles` | SELECT/UPDATE: 本人(`id = auth.uid()`) または admin。role変更は admin のみ（trigger or check） |
| `purchases` | SELECT: 本人 または admin。INSERT/UPDATE: **service_role のみ**（Webhook経由、§7） |
| `subscriptions` | SELECT: 本人 または admin。書き込み: service_role のみ |
| `rebuild_jobs` | SELECT: staff。INSERT/UPDATE: service_role（Edge Function）+ staffのqueue投入 |
| `audit_logs` | SELECT: admin。INSERT: service_role / staff操作時のtrigger |

---

## 5. RPC関数一覧

> `security definer` で定義し、内部で `auth.uid()` を参照して権限判定。
> クライアントはテーブル直アクセスでなく原則これらを経由。

| 関数 | シグネチャ | 役割 | 権限判定 |
|------|-----------|------|---------|
| `is_staff()` | `() returns boolean` | 呼出ユーザーが writer/editor/admin か | `profiles.role` 参照 |
| `has_review_access(p_review_id uuid)` | `returns boolean` | 該当記事の有料アクセス権があるか | `purchases`(paid) or `subscriptions`(active) |
| `get_review_paid_content(p_review_id uuid)` | `returns review_paid_contents` | **有料本文を返す（核心）** | 内部で `has_review_access` or 自著 or staff を確認。無ければ例外/空 |
| `get_my_purchases()` | `returns setof purchases` | 自分の購入履歴 | `user_id = auth.uid()` |
| `publish_review(p_review_id uuid)` | `returns rebuild_jobs` | 記事公開＋再ビルドjob登録 | editor/admin。`status='published'`化→`rebuild_jobs`に`queued`挿入→トリガー(§6) |

> **`get_review_paid_content` の流れ:**
> 1. `auth.uid()` が null → 即拒否（guest）
> 2. `has_review_access(p_review_id)` or 自著 or staff → false なら拒否（本文を返さない）
> 3. true → `review_paid_contents` の該当行を返す
>
> ※ RLSと二重防御。RPCを通さず直テーブルを叩いても §4.2 のRLSで拒否される。

---

## 6. 有料本文の取得フロー / GitHub再ビルドフロー

### 6.1 有料本文 取得フロー（条件4・5）

```
[詳細ページ(静的)] には有料本文が無い（PaidLockBoxの文言のみ）
        │  ログインユーザーが「本音を読む」クリック
        ▼
[ブラウザ(CSR)] supabase.rpc('get_review_paid_content', { p_review_id })
        │
        ▼
[Postgres] RPC(security definer) が auth.uid() と purchases/subscriptions を照合
        │   ├─ 権限なし → 本文を返さない（ロック継続）
        │   └─ 権限あり → review_paid_contents.body を返す
        ▼
[ブラウザ] 取得した本文を react-markdown で描画（静的成果物には残らない）
```

### 6.2 公開 → GitHub Actions 再ビルドフロー（条件6・7・8・9）

```
[管理者が記事を「公開」]
        │  supabase.rpc('publish_review', {p_review_id})
        ▼
[Postgres] reviews.status='published' + rebuild_jobs(status='queued') 挿入
        │  （DB Webhook もしくは管理画面が）
        ▼
[Edge Function: trigger-rebuild]  ← Secrets に GITHUB_DISPATCH_TOKEN 保持
        │  GitHub API: POST /repos/.../actions/workflows/deploy.yml/dispatches
        │  rebuild_jobs.status='dispatched' に更新
        ▼
[GitHub Actions(workflow_dispatch)] npm run build（ビルド時 anon で無料情報のみ取得）
        │  → out/ を GitHub Pages / Cloudflare Pages へデプロイ
        ▼
[数分後] 公開ページに反映。管理画面は rebuild_jobs.status を表示（queued→dispatched→succeeded）
```
> token はブラウザに出さず Edge Function Secrets のみ（条件7）。反映は即時でなく数分遅延前提（条件9）。

### 6.3 Stripe決済後の購入済み反映フロー（条件: 購入判定はサーバー側）

```
[未購入ユーザーが「この店の本音を確認する」]
        │
        ▼
[Edge Function: stripe-checkout]  ← Secrets: STRIPE_SECRET_KEY
        │  Checkoutセッション発行（metadata: user_id, review_id）
        ▼
[Stripe Checkout] カード決済
        │
        ▼
[Stripe Webhook → Edge Function: stripe-webhook]  ← Secrets: STRIPE_WEBHOOK_SECRET
        │  署名検証 → service_role で purchases(payment_status='paid') INSERT
        ▼
[次回以降] has_review_access が true → get_review_paid_content が本文を返す
```
> `purchases` への書き込みは **service_role(Edge Function)のみ**。クライアントは購入レコードを自作できない。

---

## 7. インデックス / 整合性（補足）

- `reviews(slug)` `shops(slug)` `areas(slug)` に unique。`reviews(status, published_at)` に複合index（一覧・新着用）。
- `purchases(user_id, review_id)` unique（二重購入防止）。`purchases(review_id)` index。
- `review_scores` `review_paid_contents` は `review_id` PK（1:1強制）。
- `updated_at` は trigger で自動更新。

---

## 8. 🛑 停止条件（本書のゴール）

本DB設計書の提示をもって **一旦停止**。以下には入らない:
- ❌ SQL migration の作成・適用
- ❌ Supabase 実プロジェクトへの反映
- ❌ RLS / RPC / Edge Functions の実装

社長レビューの通過判定（3点）:
1. ✅ 有料本文が `reviews` に混ざっていない（→ `review_paid_contents` 物理分離・§2.4/2.6）
2. ✅ 「購入者だけ読める」がDB側で保証（→ §4.2 RLS + §5 RPC 二重防御）
3. ✅ 静的ビルド取得が無料公開情報だけ（→ §4.1 anon は published の公開テーブルのみ・有料テーブルは全拒否）

ここが通れば、次に SQL migration 実装へ進む。

---

## 9. Phase 1 実装 必須チェック（社長承認条件・2026-05-24）

実装時、以下10項目を**すべて**満たす。

1. **`review_paid_contents` は RLS を有効化**：`enable row level security` 必須。**anon向けpolicyは作らない**（＝全拒否）。
2. **`get_review_paid_content()` は `user_id` を引数に取らない**：必ず `auth.uid()` で本人判定。クライアント渡しの user_id は信用しない。
3. **RPCは `authenticated` のみ execute 許可**：`revoke execute ... from anon, public; grant execute ... to authenticated;`。購入済み・有効サブスク・自著writer・staff のみ通す。
4. **`SECURITY DEFINER` 関数の注意**：RLSを迂回し得るため関数内で購入判定を**明示**。`set search_path = public` を指定。返すカラムは有料本文に必要な**最小限**だけ。
5. **`profiles.role` 自己変更不可**：user が自分で admin/writer/editor に昇格できない。role変更は service_role または admin専用RPCのみ（trigger でブロック）。
6. **`purchases` はクライアントから insert/update/delete 不可**：Stripe webhook / Edge Function の service_role のみ書込可。user は自分の履歴 select のみ。
7. **Stripe webhook 冪等性**：`provider_event_id`（event_id）/ `provider_payment_id`（payment_intent_id）に unique 制約。再送で二重購入レコードを作らない。
8. **静的ビルド用の取得元を固定**：`public_reviews_for_build` view を用意。結果に `paid_body`/`paid_content`/`internal_memo` を絶対含めない。
9. **published判定を全取得経路に**：非公開・下書き記事の有料本文を購入者が読めない。writer/editor/admin 以外は published のみ閲覧可。
10. **migration後に RLSテストSQL を作る**：①guestで有料本文不可 ②未購入userで不可 ③購入済みuserで可 ④他人の購入で不可 ⑤writerが自著を読める ⑥userがpurchasesを自作不可 ⑦userがprofiles.roleを変更不可。
