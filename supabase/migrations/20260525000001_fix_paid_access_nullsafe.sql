-- =============================================================================
-- 重大修正: get_review_paid_content の権限判定を NULL 安全にする。
--
-- 旧実装は `v_author = auth.uid()` が author_id NULL のとき NULL を返し、
-- v_allowed が NULL になり `if not v_allowed`(= not NULL = NULL) で例外がスキップされ、
-- **未購入ユーザーに有料本文が返る**バグがあった（author_id が NULL の公開記事で発現）。
-- 対策: author 比較を NULL 安全にし、許可判定を coalesce で厳格 boolean 化。
-- =============================================================================
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
       is_editor()                                              -- editor/admin
    or (v_author is not null and v_author = auth.uid())          -- 自著（NULL安全）
    or (v_status = 'published' and has_review_access(p_review_id)); -- 購入者/サブスク

  if coalesce(v_allowed, false) is not true then
    raise exception 'この記事の閲覧権限がありません' using errcode = '42501';
  end if;

  return query
    select c.body, c.photo_gap, c.satisfaction, c.revisit_opinion, c.beginner_caution, c.target_type
    from review_paid_contents c
    where c.review_id = p_review_id;
end;
$$;
