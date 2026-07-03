# STATE
- 現在の工程: DIRECTION_APPROVAL（第1R 3案却下 → 第2R 案D「扉の先」提示済み・社長回答待ち）
- 制作対象: メンズエステ体験レビューサイト（mens-blogsite）
- 種別: 既存サイトのUI全面リニューアル（1からやり直しOK・大規模改修）
- 最終更新: 2026-07-03
- 次にやること: 社長が3案から選定 → CONTENT/WIREFRAME工程へ

## 工程チェックリスト
- [x] INTAKE（既存docs＋2026-07-03ヒアリングで完了）
- [x] BRAND（BRAND.md更新済み）
- [ ] CONTENT
- [ ] REFERENCES（参考サイトなし→3案視覚提示で代替）
- [x] DESIGN_PROPOSALS（3案FVモック作成・1440px目視評価済み）
- [ ] DIRECTION_APPROVAL  ← いまここ
- [ ] WIREFRAME
- [ ] WIREFRAME_APPROVAL
- [ ] FIRST_VIEW_IMPLEMENTATION
- [ ] FIRST_VIEW_REVIEW
- [ ] SECTION_IMPLEMENTATION
- [ ] RESPONSIVE_REVIEW
- [ ] FINAL_REVIEW
- [ ] COMPLETE

## 既知情報（既存docsより。再質問しない）
- 事業: メンズエステ体験レビューDB型サイト（体験談＋スコア＋有料本音レビュー）
- 目的: 読者が「この店に行くべきか」判断できる / 有料部分へ誘導
- CTA: エリアから探す / 高評価レビューを見る / 有料ロック解除（記事300〜500円想定）
- ターゲット: 店選びで失敗したくない男性・初心者
- 表現制限: 露骨な性的表現NG。雰囲気・清潔感・接客・料金・ギャップ中心
- 技術: Next.js + TS + Tailwind + Supabase、静的export、固定費0円方針
- 現デザイン: 黒×ベージュ×ゴールドの高級ナイト路線（design-spec準拠で実装済み）
- 画像: 実画像なし。プレースホルダー or AI生成差し替え前提

## 未解決の質問
- 現UIの具体的な不満点（何が「見にくい」のか）
- ダーク×ゴールド世界観の維持 or 転換可否
- 情報密度の好み（雑誌型 or DB型）
