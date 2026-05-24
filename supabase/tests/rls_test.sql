-- =============================================================================
-- RLS テスト（必須チェック10-⑩）。seed 適用後に実行する。
-- 失敗時は raise exception で中断（CI/手動どちらでも検知可能）。
-- ロール偽装: set local role + request.jwt.claims(sub) で auth.uid()/auth.role() を再現。
-- =============================================================================
\set ON_ERROR_STOP on

\echo '--- Case 1: guest(anon) で有料本文が読めない ---'
begin;
  set local role anon;
  set local "request.jwt.claims" = '{"role":"anon"}';
  do $$
  declare c int;
  begin
    begin
      select count(*) into c from review_paid_contents;
    exception when insufficient_privilege then
      c := 0;  -- 権限拒否＝読めない＝OK
    end;
    if c <> 0 then raise exception 'FAIL case1: anon が有料本文を % 件取得した', c; end if;
    raise notice 'PASS case1: anon は有料本文0件';
  end $$;
rollback;

\echo '--- Case 2: 未購入 user で読めない ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
  do $$
  declare c int;
  begin
    select count(*) into c from review_paid_contents
      where review_id = '11111111-1111-1111-1111-111111111111';
    if c <> 0 then raise exception 'FAIL case2: 未購入userが有料本文を取得'; end if;
    raise notice 'PASS case2: 未購入userは0件';
  end $$;
rollback;

\echo '--- Case 3: 購入済み user で読める（公開記事） ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
  do $$
  declare c int;
  begin
    select count(*) into c from review_paid_contents
      where review_id = '11111111-1111-1111-1111-111111111111';
    if c <> 1 then raise exception 'FAIL case3: 購入済みuserが読めない (件数=%)', c; end if;
    raise notice 'PASS case3: 購入済みuserは読める';
  end $$;
rollback;

\echo '--- Case 4: 他人の購入では読めない / 下書き有料は購入者でも不可 ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
  do $$
  declare c int;
  begin
    -- buyer は下書き(2222)を購入していない＆非公開 → 0
    select count(*) into c from review_paid_contents
      where review_id = '22222222-2222-2222-2222-222222222222';
    if c <> 0 then raise exception 'FAIL case4: 購入者が下書き有料本文を取得'; end if;
    raise notice 'PASS case4: 下書き/未購入は不可';
  end $$;
rollback;

\echo '--- Case 5: writer が自分の記事の有料本文を読める（下書き含む） ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';
  do $$
  declare c int;
  begin
    select count(*) into c from review_paid_contents
      where review_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222');
    if c <> 2 then raise exception 'FAIL case5: 自著writerが自分の有料本文を読めない (件数=%)', c; end if;
    raise notice 'PASS case5: 自著writerは読める';
  end $$;
rollback;

\echo '--- Case 6: user は purchases を自作できない ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
  do $$
  begin
    begin
      insert into purchases (user_id, review_id, amount, payment_status)
      values ('00000000-0000-0000-0000-0000000000c1','11111111-1111-1111-1111-111111111111',1,'paid');
      raise exception 'FAIL case6: user が purchases を作成できてしまった';
    exception when insufficient_privilege then
      raise notice 'PASS case6: purchases 自作は拒否された';
    end;
  end $$;
rollback;

\echo '--- Case 7: user は profiles.role を変更できない ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
  do $$
  begin
    begin
      update profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000c1';
      raise exception 'FAIL case7: user が自分を admin に昇格できてしまった';
    exception when insufficient_privilege then
      raise notice 'PASS case7: role 変更は拒否された';
    end;
  end $$;
rollback;

\echo '--- Case 8(bonus): RPC get_review_paid_content の権限判定 ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
  do $$
  declare c int;
  begin
    begin
      select count(*) into c from get_review_paid_content('11111111-1111-1111-1111-111111111111');
      raise exception 'FAIL case8: 未購入userがRPCで有料本文を取得';
    exception when insufficient_privilege then
      raise notice 'PASS case8: 未購入userのRPCは拒否';
    end;
  end $$;
rollback;

\echo '--- Case 9(bonus): ビルド用viewは公開記事のみ＆有料カラム無し ---'
begin;
  set local role anon;
  set local "request.jwt.claims" = '{"role":"anon"}';
  do $$
  declare c int;
  begin
    -- seed の published 記事は 1111(writer) / 3333(admin) / 44444444(著者NULL) の3件（2222はdraft除外）
    select count(*) into c from public_reviews_for_build;
    if c <> 3 then raise exception 'FAIL case9: ビルドviewの公開記事数が想定外 (件数=%)', c; end if;
    -- 有料カラムが存在しないこと（情報スキーマで確認）
    if exists (
      select 1 from information_schema.columns
      where table_name = 'public_reviews_for_build'
        and column_name in ('body','internal_memo','paid_body')
    ) then
      raise exception 'FAIL case9: ビルドviewに有料カラムが含まれる';
    end if;
    raise notice 'PASS case9: ビルドviewは公開1件・有料カラム無し';
  end $$;
rollback;

\echo '--- Case 10(回帰): author_id NULL の公開有料記事を未購入userが読めない（NULL安全） ---'
begin;
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
  do $$
  declare c int;
  begin
    -- 直接テーブル（RLS）
    select count(*) into c from review_paid_contents where review_id = '44444444-4444-4444-4444-444444444444';
    if c <> 0 then raise exception 'FAIL case10: 未購入userがNULL著者記事の有料本文をテーブル取得'; end if;
    -- RPC（旧バグの本丸）
    begin
      select count(*) into c from get_review_paid_content('44444444-4444-4444-4444-444444444444');
      raise exception 'FAIL case10: 未購入userがNULL著者記事をRPCで取得（NULL安全バグ再発）';
    exception when insufficient_privilege then
      raise notice 'PASS case10: NULL著者の公開有料記事も未購入userは取得不可';
    end;
  end $$;
rollback;

\echo '======================== 全RLSテスト PASS ========================'
