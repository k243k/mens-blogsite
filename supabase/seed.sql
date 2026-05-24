-- =============================================================================
-- ローカル検証用シードデータ（本番には流さない）
-- テストユーザー4種 + 地域/店舗/レビュー（公開paid・下書きpaid・無料）+ 購入1件
-- =============================================================================

-- role 変更を許可するため protect トリガーを一時停止（ローカルseedのみ）
alter table profiles disable trigger trg_protect_role;

-- --- テストユーザー（auth.users 直挿し。profiles はトリガーで自動生成） ---
-- ローカル検証用パスワードは全員 'password123'（bcrypt ハッシュ）。本番には流さない。
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','admin@test.local', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000d1','authenticated','authenticated','writer@test.local', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000b1','authenticated','authenticated','buyer@test.local', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-0000000000c1','authenticated','authenticated','nouser@test.local', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}');

-- GoTrue はトークン系カラムが NULL だとログイン時に 500 になる（NULL→string変換不可）。空文字で埋める。
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '')
where email like '%@test.local';

-- ロール設定
update profiles set role = 'admin'  where id = '00000000-0000-0000-0000-0000000000a1';
update profiles set role = 'writer' where id = '00000000-0000-0000-0000-0000000000d1';
-- buyer/nouser は default 'user'

alter table profiles enable trigger trg_protect_role;

-- --- 地域 ---
insert into areas (id, name, slug, status) values
  ('aaaa0000-0000-0000-0000-000000000001','梅田','umeda','published'),
  ('aaaa0000-0000-0000-0000-000000000002','難波','namba','published');

-- --- 店舗 ---
insert into shops (id, area_id, name, slug, station, price_min, price_max, status) values
  ('bbbb0000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000001','Lumiere 梅田','lumiere-umeda','梅田駅 徒歩5分',12000,22000,'published');

-- --- レビュー（①公開・有料 ②下書き・有料／writer著） ---
insert into reviews (id, shop_id, area_id, author_id, title, slug, free_body, is_paid, status, published_at) values
  ('11111111-1111-1111-1111-111111111111','bbbb0000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d1','梅田の隠れ家スパ（公開）','published-paid','無料本文です。', true, 'published', now()),
  ('22222222-2222-2222-2222-222222222222','bbbb0000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d1','下書きレビュー','draft-paid','下書きの無料本文。', true, 'draft', null);

-- ③admin著の公開記事（writer が他人の記事を編集できないことの検証用）
insert into reviews (id, shop_id, area_id, author_id, title, slug, free_body, is_paid, status, published_at) values
  ('33333333-3333-3333-3333-333333333333','bbbb0000-0000-0000-0000-000000000001','aaaa0000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1','admin著の公開記事','admin-owned','admin著の無料本文。', false, 'published', now());

-- --- スコア ---
insert into review_scores (review_id, overall_score, sensual_score, cleanliness_score, revisit_score) values
  ('11111111-1111-1111-1111-111111111111',4.6,4.8,4.4,4.7),
  ('22222222-2222-2222-2222-222222222222',4.0,4.0,4.0,4.0),
  ('33333333-3333-3333-3333-333333333333',4.2,4.2,4.2,4.2);

-- --- 有料本文（公開記事・下書き記事） ---
insert into review_paid_contents (review_id, body) values
  ('11111111-1111-1111-1111-111111111111','【有料】写真とのギャップは少なめ。再訪したい一軒。'),
  ('22222222-2222-2222-2222-222222222222','【有料・下書き】まだ非公開の本音。');

-- --- 購入（buyer が公開記事を購入済み） ---
insert into purchases (user_id, review_id, amount, payment_status, provider_payment_id, provider_event_id) values
  ('00000000-0000-0000-0000-0000000000b1','11111111-1111-1111-1111-111111111111',400,'paid','pi_seed_001','evt_seed_001');
