-- =============================================================================
-- Phase 5 管理画面 RLSテスト（書き込み権限）。seed適用後に実行。
-- 一般userの作成拒否 / writer自著のみ / 他人編集拒否 / editor(admin)は可 を検証。
-- =============================================================================
\set ON_ERROR_STOP on

\echo '--- A: 一般user(nouser) は reviews を作成できない ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
  do $$
  begin
    begin
      insert into reviews (shop_id, area_id, author_id, title, slug, free_body, status)
      values ('bbbb0000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000001',
              '00000000-0000-0000-0000-0000000000c1','不正記事','hack-1','x','draft');
      raise exception 'FAIL A: 一般userが reviews を作成できた';
    exception when insufficient_privilege then
      raise notice 'PASS A: 一般userの reviews 作成は拒否';
    end;
  end $$;
rollback;

\echo '--- B: 一般user は review_paid_contents を作成できない ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
  do $$
  begin
    begin
      insert into review_paid_contents (review_id, body)
      values ('33333333-3333-3333-3333-333333333333','不正な有料本文');
      raise exception 'FAIL B: 一般userが有料本文を作成できた';
    exception when insufficient_privilege then
      raise notice 'PASS B: 一般userの有料本文作成は拒否';
    end;
  end $$;
rollback;

\echo '--- C: writer は自分の記事を作成できる（reviews + paid） ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
  do $$
  declare new_id uuid;
  begin
    insert into reviews (shop_id, area_id, author_id, title, slug, free_body, is_paid, status)
    values ('bbbb0000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-0000000000d1','writerの新記事','writer-new','本文', true, 'draft')
    returning id into new_id;
    insert into review_paid_contents (review_id, body) values (new_id, 'writerの有料本文');
    raise notice 'PASS C: writer は自著記事+有料本文を作成できた';
  end $$;
rollback;

\echo '--- D: writer は他人(admin著)の記事を編集できない ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
  do $$
  declare n int;
  begin
    update reviews set title = '乗っ取り' where id = '33333333-3333-3333-3333-333333333333';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL D: writerが他人の記事を更新できた（%行）', n; end if;
    raise notice 'PASS D: writerは他人の記事を更新できない（0行）';
  end $$;
rollback;

\echo '--- E: editor相当(admin) は他人の記事を編集できる ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
  do $$
  declare n int;
  begin
    update reviews set summary = '編集済み' where id = '11111111-1111-1111-1111-111111111111';
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'FAIL E: adminが他人の記事を更新できない（%行）', n; end if;
    raise notice 'PASS E: admin/editorは他人の記事を編集できる';
  end $$;
rollback;

\echo '--- F: reviews に有料本文カラムが存在しない（混入の構造的防止） ---'
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'reviews' and column_name in ('paid_body','paid_content','body')
  ) then
    raise exception 'FAIL F: reviews に有料本文カラムが存在する';
  end if;
  raise notice 'PASS F: reviews に有料本文カラムなし（物理分離）';
end $$;

\echo '======================== 管理RLSテスト 全PASS ========================'
