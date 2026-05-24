-- =============================================================================
-- Phase 3: ビルド用 view に shop / area の名前・slug を join（すべて無料公開情報）
-- ⚠️ 有料カラム（body / internal_memo 等）は一切含めない。published のみ。
-- =============================================================================

drop view if exists public_reviews_for_build;

create view public_reviews_for_build as
select
  r.id, r.slug, r.title,
  r.visit_date, r.price, r.course_minutes, r.summary, r.free_body,
  r.is_paid, r.is_pr, r.thumbnail_url, r.main_image_url,
  r.meta_title, r.meta_description, r.noindex, r.published_at,
  sh.slug as shop_slug, sh.name as shop_name,
  ar.slug as area_slug, ar.name as area_name,
  sc.overall_score, sc.sensual_score, sc.cleanliness_score, sc.service_score,
  sc.distance_score, sc.photo_accuracy_score, sc.beginner_score,
  sc.cost_score, sc.revisit_score
from reviews r
left join shops sh        on sh.id = r.shop_id
left join areas ar        on ar.id = r.area_id
left join review_scores sc on sc.review_id = r.id
where r.status = 'published';

grant select on public_reviews_for_build to anon, authenticated;
