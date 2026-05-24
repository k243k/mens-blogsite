-- =============================================================================
-- Phase 1: ヘルパー関数 / ロール保護 / ビルド用view / RLS / RPC
-- 必須チェック10項目（docs/specs/database-design.md §9）をすべて満たす。
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ヘルパー関数（RLS/RPC から利用。SECURITY DEFINER + search_path 固定）
--   いずれも引数で user を受けず auth.uid() で本人判定する（チェック2）。
-- -----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function is_editor()  -- editor または admin
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('editor','admin'));
$$;

create or replace function is_staff()   -- writer / editor / admin
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('writer','editor','admin'));
$$;

-- 有料アクセス権（購入済み or 有効サブスク）。auth.uid() 本人のみ判定（チェック2）。
create or replace function has_review_access(p_review_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from purchases p
      where p.user_id = auth.uid()
        and p.review_id = p_review_id
        and p.payment_status = 'paid'
    )
    or exists (
      select 1 from subscriptions s
      where s.user_id = auth.uid()
        and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end > now())
    );
$$;

grant execute on function is_admin(), is_editor(), is_staff(), has_review_access(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- profiles.role 自己昇格ブロック（チェック5）
--   role 変更は admin または service_role のみ。
-- -----------------------------------------------------------------------------
create or replace function protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if auth.role() = 'service_role' then
      return new;                       -- Edge Function 経由は許可
    end if;
    if not is_admin() then
      raise exception 'role の変更は管理者のみ可能です' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_protect_role before update on profiles
  for each row execute function protect_profile_role();

-- -----------------------------------------------------------------------------
-- reviews 公開操作の制限（チェック9）
--   status を 'published' に変えられるのは editor/admin または service_role のみ。
-- -----------------------------------------------------------------------------
create or replace function protect_review_publish()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    if auth.role() <> 'service_role' and not is_editor() then
      raise exception '記事の公開は編集者・管理者のみ可能です' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_protect_publish before update on reviews
  for each row execute function protect_review_publish();

-- -----------------------------------------------------------------------------
-- 静的ビルド用 view（チェック8）
--   ⚠️ 有料カラム（body/internal_memo 等）を絶対に含めない。published のみ。
--   security_invoker=on で下層テーブルの RLS を尊重（多層防御）。
-- -----------------------------------------------------------------------------
create view public_reviews_for_build
with (security_invoker = on) as
select
  r.id, r.slug, r.title, r.shop_id, r.area_id, r.author_id,
  r.visit_date, r.price, r.course_minutes, r.summary, r.free_body,
  r.is_paid, r.is_pr, r.thumbnail_url, r.main_image_url,
  r.meta_title, r.meta_description, r.noindex, r.published_at,
  sc.overall_score, sc.sensual_score, sc.cleanliness_score, sc.service_score,
  sc.distance_score, sc.photo_accuracy_score, sc.beginner_score,
  sc.cost_score, sc.revisit_score
from reviews r
left join review_scores sc on sc.review_id = r.id
where r.status = 'published';

grant select on public_reviews_for_build to anon, authenticated;

-- =============================================================================
-- RLS 有効化
-- =============================================================================
alter table profiles              enable row level security;
alter table areas                 enable row level security;
alter table shops                 enable row level security;
alter table reviews               enable row level security;
alter table review_scores         enable row level security;
alter table review_paid_contents  enable row level security;
alter table purchases             enable row level security;
alter table subscriptions         enable row level security;
alter table media_assets          enable row level security;
alter table rebuild_jobs          enable row level security;
alter table audit_logs            enable row level security;

-- =============================================================================
-- RLS ポリシー
-- =============================================================================

-- profiles: 本人 or admin
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());   -- role 変更自体は trigger でブロック

-- areas: published は全員 / 編集は editor
create policy areas_select on areas for select to anon, authenticated
  using (status = 'published' or is_editor());
create policy areas_write on areas for all to authenticated
  using (is_editor()) with check (is_editor());

-- shops: 同上
create policy shops_select on shops for select to anon, authenticated
  using (status = 'published' or is_editor());
create policy shops_write on shops for all to authenticated
  using (is_editor()) with check (is_editor());

-- reviews: published は全員 / 自著writer・editor は自分の下書きも閲覧 / 公開は trigger 制限
create policy reviews_select on reviews for select to anon, authenticated
  using (status = 'published' or author_id = auth.uid() or is_editor());
create policy reviews_insert on reviews for insert to authenticated
  with check (is_staff() and (author_id = auth.uid() or is_editor()));
create policy reviews_update on reviews for update to authenticated
  using (author_id = auth.uid() or is_editor())
  with check (author_id = auth.uid() or is_editor());
create policy reviews_delete on reviews for delete to authenticated
  using (is_editor());

-- review_scores: 親 reviews が読めるなら読める / 編集は自著・editor
create policy scores_select on review_scores for select to anon, authenticated
  using (exists (
    select 1 from reviews r where r.id = review_id
      and (r.status = 'published' or r.author_id = auth.uid() or is_editor())
  ));
create policy scores_write on review_scores for all to authenticated
  using (exists (select 1 from reviews r where r.id = review_id and (r.author_id = auth.uid() or is_editor())))
  with check (exists (select 1 from reviews r where r.id = review_id and (r.author_id = auth.uid() or is_editor())));

-- 🔒 review_paid_contents: anon ポリシーなし（＝全拒否） / authenticated は権限者のみ
--    購入者・サブスクは published のみ（チェック9）。自著writer・editor は status 問わず。
revoke all on review_paid_contents from anon;     -- 念押し（チェック1）
create policy paid_select on review_paid_contents for select to authenticated
  using (
    is_editor()
    or exists (select 1 from reviews r where r.id = review_id and r.author_id = auth.uid())
    or (
      exists (select 1 from reviews r where r.id = review_id and r.status = 'published')
      and has_review_access(review_id)
    )
  );
create policy paid_write on review_paid_contents for all to authenticated
  using (exists (select 1 from reviews r where r.id = review_id and (r.author_id = auth.uid() or is_editor())))
  with check (exists (select 1 from reviews r where r.id = review_id and (r.author_id = auth.uid() or is_editor())));

-- purchases: 本人 select のみ。insert/update/delete ポリシー無し＝service_role のみ書込（チェック6）
create policy purchases_select on purchases for select to authenticated
  using (user_id = auth.uid() or is_admin());

-- subscriptions: 本人 select のみ。書込は service_role のみ
create policy subscriptions_select on subscriptions for select to authenticated
  using (user_id = auth.uid() or is_admin());

-- media_assets: 公開分は全員 / 編集は editor
create policy media_select on media_assets for select to anon, authenticated
  using (is_public = true or is_editor());
create policy media_write on media_assets for all to authenticated
  using (is_editor()) with check (is_editor());

-- rebuild_jobs: staff のみ閲覧。書込は service_role / definer 関数
create policy rebuild_select on rebuild_jobs for select to authenticated
  using (is_staff());

-- audit_logs: admin のみ閲覧
create policy audit_select on audit_logs for select to authenticated
  using (is_admin());

-- =============================================================================
-- RPC（authenticated のみ。get_review_paid_content は核心）
-- =============================================================================

-- 有料本文取得（チェック2,3,4,9）
--   引数に user_id を取らない / auth.uid() で判定 / search_path固定 /
--   返却は最小限（internal_memo は返さない） / published判定込み
create or replace function get_review_paid_content(p_review_id uuid)
returns table (
  body text, photo_gap text, satisfaction text,
  revisit_opinion text, beginner_caution text, target_type text
)
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
  v_author uuid;
  v_allowed boolean;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です' using errcode = '28000';
  end if;

  select r.status, r.author_id into v_status, v_author
  from reviews r where r.id = p_review_id;
  if not found then
    raise exception '記事が見つかりません' using errcode = 'P0002';
  end if;

  v_allowed :=
       is_editor()                                   -- editor/admin
    or (v_author = auth.uid())                        -- 自著 writer
    or (v_status = 'published' and has_review_access(p_review_id));  -- 購入者/サブスク（公開記事のみ）

  if not v_allowed then
    raise exception 'この記事の閲覧権限がありません' using errcode = '42501';
  end if;

  return query
    select c.body, c.photo_gap, c.satisfaction, c.revisit_opinion, c.beginner_caution, c.target_type
    from review_paid_contents c
    where c.review_id = p_review_id;
end;
$$;

-- 自分の購入履歴
create or replace function get_my_purchases()
returns setof purchases
language sql stable security definer set search_path = public as $$
  select * from purchases where user_id = auth.uid();
$$;

-- 記事公開（editor/admin）。status更新 + 再ビルドjob登録（チェック9と連動）
create or replace function publish_review(p_review_id uuid)
returns rebuild_jobs
language plpgsql security definer set search_path = public as $$
declare
  v_job rebuild_jobs;
begin
  if not is_editor() then
    raise exception '記事の公開は編集者・管理者のみ可能です' using errcode = '42501';
  end if;

  update reviews
     set status = 'published',
         published_at = coalesce(published_at, now())
   where id = p_review_id;
  if not found then
    raise exception '記事が見つかりません' using errcode = 'P0002';
  end if;

  insert into rebuild_jobs (triggered_by, review_id, status)
  values (auth.uid(), p_review_id, 'queued')
  returning * into v_job;

  insert into audit_logs (actor_id, action, target_table, target_id)
  values (auth.uid(), 'review.publish', 'reviews', p_review_id);

  return v_job;
end;
$$;

-- 実行権限: anon/public から剥奪し、authenticated のみ（チェック3）
revoke execute on function get_review_paid_content(uuid) from anon, public;
revoke execute on function get_my_purchases()            from anon, public;
revoke execute on function publish_review(uuid)          from anon, public;
grant  execute on function get_review_paid_content(uuid) to authenticated;
grant  execute on function get_my_purchases()            to authenticated;
grant  execute on function publish_review(uuid)          to authenticated;
