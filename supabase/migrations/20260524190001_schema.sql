-- =============================================================================
-- Phase 1: スキーマ定義（11テーブル + index + updated_at トリガー）
-- 出典: docs/specs/database-design.md
-- ⚠️ 有料本文は reviews に持たせず review_paid_contents に物理分離する。
-- =============================================================================

-- updated_at 自動更新トリガー関数
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles（auth.users と1:1。ロール保持）
-- -----------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  role         text not null default 'user'
               check (role in ('user','writer','editor','admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- 新規 auth.users 作成時に profiles 行を自動生成
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- areas（地域マスタ）
-- -----------------------------------------------------------------------------
create table areas (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references areas(id) on delete set null,
  name          text not null,
  slug          text not null unique,
  description   text,
  meta_title    text,
  meta_description text,
  display_order integer not null default 0,
  status        text not null default 'published' check (status in ('published','private')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_areas_updated before update on areas
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- shops（店舗）
-- -----------------------------------------------------------------------------
create table shops (
  id             uuid primary key default gen_random_uuid(),
  area_id        uuid not null references areas(id) on delete restrict,
  name           text not null,
  slug           text not null unique,
  official_url   text,
  station        text,
  price_min      integer,
  price_max      integer,
  business_hours text,
  description    text,
  caution        text,
  status         text not null default 'published' check (status in ('published','private')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_shops_area on shops(area_id);
create trigger trg_shops_updated before update on shops
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- reviews（無料公開情報のみ。⚠️ 有料本文カラムは持たない）
-- -----------------------------------------------------------------------------
create table reviews (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete restrict,
  area_id        uuid not null references areas(id) on delete restrict,
  author_id      uuid references profiles(id) on delete set null,
  title          text not null,
  slug           text not null unique,
  visit_date     date,
  price          integer,
  course_minutes integer,
  summary        text,
  free_body      text not null,
  is_paid        boolean not null default false,
  is_pr          boolean not null default false,
  status         text not null default 'draft' check (status in ('draft','published','private')),
  thumbnail_url  text,
  main_image_url text,
  meta_title     text,
  meta_description text,
  noindex        boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_reviews_shop on reviews(shop_id);
create index idx_reviews_area on reviews(area_id);
create index idx_reviews_author on reviews(author_id);
create index idx_reviews_status_pub on reviews(status, published_at desc);
create trigger trg_reviews_updated before update on reviews
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- review_scores（reviewsと1:1・無料公開）
-- -----------------------------------------------------------------------------
create table review_scores (
  review_id            uuid primary key references reviews(id) on delete cascade,
  overall_score        numeric(2,1) check (overall_score between 1.0 and 5.0),
  sensual_score        numeric(2,1) check (sensual_score between 1.0 and 5.0),
  cleanliness_score    numeric(2,1) check (cleanliness_score between 1.0 and 5.0),
  service_score        numeric(2,1) check (service_score between 1.0 and 5.0),
  distance_score       numeric(2,1) check (distance_score between 1.0 and 5.0),
  photo_accuracy_score numeric(2,1) check (photo_accuracy_score between 1.0 and 5.0),
  beginner_score       numeric(2,1) check (beginner_score between 1.0 and 5.0),
  cost_score           numeric(2,1) check (cost_score between 1.0 and 5.0),
  revisit_score        numeric(2,1) check (revisit_score between 1.0 and 5.0)
);

-- -----------------------------------------------------------------------------
-- review_paid_contents（🔒 有料本文・物理分離）
-- -----------------------------------------------------------------------------
create table review_paid_contents (
  review_id        uuid primary key references reviews(id) on delete cascade,
  body             text not null,
  photo_gap        text,
  satisfaction     text,
  revisit_opinion  text,
  beginner_caution text,
  target_type      text,
  internal_memo    text,            -- 運営内部メモ（絶対公開しない）
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger trg_paid_updated before update on review_paid_contents
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- purchases（単品購入。冪等性のため provider id に unique）
-- -----------------------------------------------------------------------------
create table purchases (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  review_id           uuid not null references reviews(id) on delete cascade,
  amount              integer not null,
  currency            text not null default 'jpy',
  payment_provider    text not null default 'stripe',
  payment_status      text not null check (payment_status in ('paid','refunded','failed')),
  provider_payment_id text,         -- Stripe payment_intent_id
  provider_event_id   text,         -- Stripe event.id（webhook冪等性）
  created_at          timestamptz not null default now(),
  unique (user_id, review_id),                 -- 同一記事の二重購入防止
  unique (provider_payment_id),                -- payment_intent 単位の冪等性
  unique (provider_event_id)                   -- webhook event 単位の冪等性
);
create index idx_purchases_user on purchases(user_id);
create index idx_purchases_review on purchases(review_id);

-- -----------------------------------------------------------------------------
-- subscriptions（将来拡張）
-- -----------------------------------------------------------------------------
create table subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id) on delete cascade,
  status                   text not null check (status in ('active','canceled','past_due')),
  current_period_end       timestamptz,
  provider_subscription_id text unique,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index idx_subscriptions_user on subscriptions(user_id);
create trigger trg_subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- media_assets（画像メタ。MVPはプレースホルダー、構造のみ）
-- -----------------------------------------------------------------------------
create table media_assets (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid references reviews(id) on delete cascade,
  shop_id    uuid references shops(id) on delete cascade,
  kind       text not null check (kind in ('thumbnail','main','in_article','shop_hero')),
  url        text not null,
  alt        text,
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_media_review on media_assets(review_id);
create index idx_media_shop on media_assets(shop_id);

-- -----------------------------------------------------------------------------
-- rebuild_jobs（公開→再ビルドのジョブ状態）
-- -----------------------------------------------------------------------------
create table rebuild_jobs (
  id            uuid primary key default gen_random_uuid(),
  triggered_by  uuid references profiles(id) on delete set null,
  review_id     uuid references reviews(id) on delete set null,
  status        text not null default 'queued'
                check (status in ('queued','dispatched','building','succeeded','failed')),
  github_run_id text,
  message       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_rebuild_updated before update on rebuild_jobs
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- audit_logs（管理操作の監査）
-- -----------------------------------------------------------------------------
create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references profiles(id) on delete set null,
  action       text not null,
  target_table text,
  target_id    uuid,
  detail       jsonb,
  created_at   timestamptz not null default now()
);
create index idx_audit_actor on audit_logs(actor_id);
