# メンズエステ体験レビューサイト デザイン設計書

## 1. デザイン概要

### 1.1 デザイン目的

メンズエステ体験レビューサイトとして、読者が「読みたい」「この店を確認したい」と感じる世界観を作る。

露骨なアダルトサイト風ではなく、高級感・夜・秘密・背徳感・艶っぽさを持つレビューサービスとして設計する。

### 1.2 デザインコンセプト

コンセプト：

> 夜に、外さないための本音レビュー。

キーワード：

- 夜
- 秘密
- 高級感
- 艶っぽさ
- 肌感
- 間接照明
- 静かな熱
- 会員制
- 本音レビュー
- 行く前の期待感

### 1.3 避けるデザイン

以下の方向性は避ける。

- 風俗サイト風の派手なバナー
- 原色ピンク中心
- 過剰な露出画像
- 安っぽいネオン
- 情報量が多すぎる掲示板風UI
- チラシのようなレイアウト
- 文字が小さすぎるデザイン
- スマホで押しにくいボタン

---

## 2. ブランドトーン

### 2.1 サイト印象

目指す印象：

- 大人っぽい
- 静かに艶っぽい
- 高級スパのような雰囲気
- 男性が夜に見たくなる
- 店選びの不安を消す
- 有料部分を読みたくなる
- 情報が整理されていて信頼できる

### 2.2 文章トーン

使用する言葉：

- 色気
- 艶っぽい
- 距離感
- 雰囲気
- 本音
- 再訪
- 初心者向け
- 写真とのギャップ
- 清潔感
- 失敗しないための判断材料

避ける言葉：

- 直接的な性的表現
- 違法性を連想させる言葉
- 下品な煽り
- 店舗や個人を攻撃する言葉
- 未成年を連想させる言葉

---

## 3. カラーパレット

### 3.1 メインカラー

高級感と艶っぽさを出すため、黒・ベージュ・ゴールド系を基調にする。

```css
--color-bg: #0D0B0A;
--color-surface: #181311;
--color-surface-soft: #241B18;
--color-border: #3A2C26;

--color-text: #F4E9DE;
--color-text-muted: #B8A79B;
--color-text-subtle: #7E6F66;

--color-primary: #D2A679;
--color-primary-hover: #E0B98B;
--color-primary-dark: #A9784E;

--color-accent-red: #8F1D2C;
--color-accent-purple: #5D3A78;

--color-lock: #D6A84F;
--color-error: #D95C5C;
--color-success: #6FAF7A;
```

### 3.2 使用ルール

- 背景は黒系
- カードは少し明るい黒茶系
- ボタンはゴールド系
- 強調ラベルには深紅またはゴールドを使う
- 本文は白ではなく、少し温かいアイボリー
- 補足テキストはベージュグレー
- 罫線は薄いブラウン

---

## 4. タイポグラフィ

### 4.1 フォント方針

日本語は読みやすさを優先する。

推奨：

```css
font-family:
  "Noto Sans JP",
  "Hiragino Sans",
  "Yu Gothic",
  system-ui,
  sans-serif;
```

英数字やロゴ周りは余裕があれば以下を検討する。

```css
font-family:
  "Inter",
  "Noto Sans JP",
  sans-serif;
```

### 4.2 サイズ

モバイル基準：

| 用途 | サイズ | 太さ |
|---|---:|---:|
| ヒーロー見出し | 32px | 700 |
| ページ見出し | 28px | 700 |
| セクション見出し | 22px | 700 |
| カードタイトル | 18px | 700 |
| 本文 | 15px〜16px | 400 |
| 補足 | 13px | 400 |
| ラベル | 12px | 600 |

PC基準：

| 用途 | サイズ | 太さ |
|---|---:|---:|
| ヒーロー見出し | 56px | 700 |
| ページ見出し | 40px | 700 |
| セクション見出し | 28px | 700 |
| カードタイトル | 20px | 700 |
| 本文 | 16px | 400 |

---

## 5. レイアウト方針

### 5.1 全体

- モバイルファースト
- 余白を広めに取る
- 背景は暗く、カードを浮かせる
- 角丸は大きめ
- 情報を詰め込みすぎない
- ファーストビューで世界観を出す
- CTAは常に押しやすくする

### 5.2 最大幅

```css
--container-sm: 640px;
--container-md: 960px;
--container-lg: 1120px;
```

本文記事ページは読みやすさ重視で最大幅を狭める。

```css
.article-container {
  max-width: 760px;
}
```

一覧ページはカードグリッド。

```css
.grid-list {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

---

## 6. 画像方針

### 6.1 画像の役割

画像は直接的な説明ではなく、雰囲気を作るために使う。

主な画像用途：

- トップページのヒーロー背景
- 記事カードのサムネイル
- 店舗詳細のヘッダー画像
- 有料ロックエリアの背景
- 地域ページのイメージ画像

### 6.2 初期実装

現在は本番画像を入れない。

実装時は以下のいずれかにする。

1. グラデーション背景
2. ダークカラーのプレースホルダー
3. CSSだけのぼかし背景
4. `/public/placeholders/` 配下の仮画像
5. 画像URLがnullの場合は自動でプレースホルダーを表示

### 6.3 画像未設定時の表示

画像が未設定の場合、以下のようなプレースホルダーを表示する。

- 黒〜ブラウンのグラデーション
- 薄いゴールドの光
- 「No Image」ではなく、サイトの雰囲気に合う抽象背景
- 必要なら `IMAGE PLACEHOLDER` という小さな文字を表示

### 6.4 AI画像生成の方向性

後から差し込む画像は以下の方向性にする。

- 高級スパ
- 暗めの個室
- 間接照明
- オイル瓶
- 白いタオル
- カーテン
- 女性の手元
- 首筋や肩のシルエット
- 露骨な露出なし
- 成人風
- 非実在人物
- フォトリアル
- 黒・ベージュ・ゴールド基調

### 6.5 AI画像プロンプト例

英語：

```text
Luxury men’s spa review website hero image, dark moody private spa room, warm indirect lighting, massage oil bottle, soft white towels, elegant adult feminine silhouette in the background, sensual but not explicit, premium private lounge atmosphere, cinematic lighting, black and beige color palette, shallow depth of field, photorealistic, no nudity, no explicit sexual content
```

日本語：

```text
高級メンズエステのレビューサイト用メインビジュアル。暗めの個室、暖色の間接照明、オイル瓶、白いタオル、奥に成人女性の上品なシルエット。露骨な露出なし。高級感、背徳感、夜の雰囲気、黒とベージュ基調、映画のような照明、リアル写真風。
```

---

## 7. 共通コンポーネント

## 7.1 Header

### 目的

サイト内回遊とブランド認知。

### 要素

- ロゴ
- エリアから探す
- ランキング
- 最新レビュー
- ログイン
- メニューアイコン

### デザイン

- 背景は半透明の黒
- スクロール時にblur
- 下線は薄いブラウン
- モバイルではハンバーガーメニュー

### Tailwind例

```tsx
<header className="sticky top-0 z-50 border-b border-[#3A2C26]/70 bg-[#0D0B0A]/80 backdrop-blur-xl">
```

---

## 7.2 Button

### 種類

- Primary
- Secondary
- Ghost
- Lock CTA

### Primary

```tsx
className="
  rounded-full
  bg-[#D2A679]
  px-5
  py-3
  text-sm
  font-bold
  text-[#0D0B0A]
  shadow-lg
  shadow-black/30
  transition
  hover:bg-[#E0B98B]
"
```

### Secondary

```tsx
className="
  rounded-full
  border
  border-[#D2A679]/40
  px-5
  py-3
  text-sm
  font-bold
  text-[#F4E9DE]
  transition
  hover:bg-[#D2A679]/10
"
```

---

## 7.3 ReviewCard

### 目的

記事一覧でクリックされるカード。

### 表示項目

- サムネイル
- 地域ラベル
- 有料ラベル
- タイトル
- 店舗名
- 料金
- 総合評価
- 色気
- 清潔感
- 写真再現度
- 無料要約
- 投稿日

### デザイン

- 背景はダークブラウン
- 角丸大きめ
- 画像上に暗いグラデーション
- ラベルはゴールドまたは深紅
- スコアは小さなチップで表示
- 有料記事は鍵アイコンを表示

### レイアウト例

```text
[画像/グラデーション]
[大阪 / 梅田] [本音レビュー]
タイトル
店舗名・料金
総合 4.6 / 色気 4.8 / 清潔感 4.3
要約テキスト
```

---

## 7.4 ScoreBadge

### 目的

独自指標を見やすく表示する。

### 指標

- 総合
- 色気
- 清潔感
- 接客
- 距離感
- 写真再現度
- 初心者向け
- コスパ
- 再訪度

### 表示

```text
色気 4.8
清潔感 4.4
再訪度 4.6
```

### デザイン

- 背景は `#241B18`
- 文字はアイボリー
- 数値はゴールド
- 角丸pill型

---

## 7.5 PaidLockBox

### 目的

有料部分を読みたくさせる。

### 表示要素

- ロックアイコン
- 見出し
- 説明文
- 有料で読める内容リスト
- CTAボタン
- 背景のぼかし本文

### 文言例

見出し：

> ここから先は本音レビューです。

説明：

> 写真とのギャップ、再訪判断、行く前に知るべき注意点を記録しています。

リスト：

- 写真とのギャップ
- 実際の満足度
- 再訪したいか
- 初心者が注意すべき点
- この店が刺さる男性のタイプ

CTA：

- この店の本音を確認する
- 失敗する前に読む
- 今夜の判断材料を見る

### デザイン

- 背景は黒〜深紅のグラデーション
- 上からぼかしを重ねる
- ボタンはゴールド
- 枠線はゴールドの透明色

---

## 7.6 PlaceholderImage

### 目的

本番画像が未設定でもデザインを成立させる。

### 仕様

props：

```ts
type PlaceholderImageProps = {
  variant?: "hero" | "card" | "shop" | "lock";
  label?: string;
};
```

表示：

- hero：大きな抽象グラデーション
- card：カード用グラデーション
- shop：店舗詳細用
- lock：有料エリア用

Tailwindイメージ：

```tsx
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#241B18] via-[#0D0B0A] to-[#5D3A78]/40">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(210,166,121,0.25),transparent_35%)]" />
  <div className="absolute inset-0 bg-black/20" />
</div>
```

---

## 8. ページ別デザイン

## 8.1 トップページ

### 構成

1. Header
2. Hero
3. Search/Area shortcuts
4. LatestReviews
5. RankingPreview
6. BeginnerSection
7. PaidReviewCTA
8. Footer

### Hero

#### 要素

- 背景画像またはプレースホルダー
- 暗いオーバーレイ
- キャッチコピー
- サブコピー
- CTAボタン
- スコアカード風の装飾

#### 文言

```text
今夜、外したくないメンズエステ体験談。
```

```text
料金、雰囲気、清潔感、写真とのギャップまで。
行く前に知りたい本音を記録。
```

#### CTA

- エリアから探す
- 高評価レビューを見る

#### 画像欄

初期状態：

```text
画像未設定。PlaceholderImage variant="hero" を表示。
```

後から差し替え：

```text
AI生成した高級スパ風ビジュアルを設定。
```

---

## 8.2 記事一覧ページ

### 構成

1. Header
2. PageTitle
3. FilterBar
4. ReviewGrid
5. Pagination
6. Footer

### FilterBar

フィルター項目：

- エリア
- 料金帯
- 総合評価
- 初心者向け
- 再訪度
- 有料/無料

モバイルでは横スクロールチップにする。

---

## 8.3 記事詳細ページ

### 構成

1. Header
2. ArticleHero
3. SummaryCard
4. ScoreGrid
5. FreeBody
6. GoodBadPoints
7. PaidLockBox
8. ShopInfoCard
9. RelatedReviews
10. Footer

### ArticleHero

表示：

- 地域
- 店舗名
- タイトル
- 料金
- 訪問日
- メイン画像またはプレースホルダー

### SummaryCard

結論を強調する。

```text
結論：初心者でも入りやすく、雰囲気と清潔感のバランスが良い一軒。
```

### ScoreGrid

2列または3列で表示。

モバイル：

```text
総合 4.6
色気 4.8
清潔感 4.4
接客 4.5
写真再現度 4.0
再訪度 4.7
```

PC：

3列グリッド。

---

## 8.4 店舗詳細ページ

### 構成

1. Header
2. ShopHero
3. ShopInfo
4. AverageScores
5. ReviewList
6. RelatedAreas
7. Footer

### ShopHero

画像欄：

```text
画像未設定。PlaceholderImage variant="shop" を表示。
```

---

## 8.5 管理画面

### 基本方針

- スマホ投稿しやすい
- 入力項目をセクションで分ける
- 長文入力は大きなtextarea
- スコアはスライダーまたはselect
- 下書き保存ボタンを常時表示
- 入力途中で迷わないようにラベルを明確にする

### 管理画面カラー

公開画面と同じトーンでよいが、入力しやすさを優先する。

- 背景：暗色
- 入力欄：明るめの黒茶
- 枠線：ブラウン
- ラベル：アイボリー
- 補足：ベージュグレー
- 保存ボタン：ゴールド

### 記事作成フォーム構成

1. 基本情報
2. スコア
3. 無料本文
4. 有料本文
5. 画像
6. SEO
7. 公開設定

---

## 9. UI細部

### 9.1 角丸

```css
--radius-card: 24px;
--radius-button: 999px;
--radius-input: 16px;
```

### 9.2 シャドウ

暗色背景なので、強い影よりも境界線と光で浮かせる。

```css
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
```

### 9.3 罫線

```css
border-color: rgba(210, 166, 121, 0.18);
```

### 9.4 グラデーション

Hero：

```css
background:
  radial-gradient(circle at 20% 20%, rgba(210, 166, 121, 0.22), transparent 35%),
  radial-gradient(circle at 80% 30%, rgba(143, 29, 44, 0.22), transparent 30%),
  linear-gradient(135deg, #0D0B0A, #181311 55%, #0D0B0A);
```

PaidLockBox：

```css
background:
  linear-gradient(135deg, rgba(13, 11, 10, 0.95), rgba(143, 29, 44, 0.35)),
  radial-gradient(circle at 30% 10%, rgba(210, 166, 121, 0.22), transparent 40%);
```

---

## 10. レスポンシブ設計

### 10.1 ブレークポイント

Tailwind標準を使用する。

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

### 10.2 モバイル優先

モバイルでは以下を重視する。

- CTAは親指で押しやすい位置
- 横幅いっぱいのカード
- フィルターは横スクロールチップ
- Headerは最小限
- 本文は16px前後
- 行間は広め
- 有料CTAは大きく目立たせる

### 10.3 PC

PCでは以下を重視する。

- 余白を広くする
- カードを2〜3列表示
- 記事詳細は本文幅を絞る
- サイドバーは初期MVPでは不要

---

## 11. アニメーション

### 11.1 基本方針

派手すぎるアニメーションは不要。

使う場合：

- フェードイン
- ボタンhover
- カードhover
- ロックエリアの軽い光
- Headerのblur

### 11.2 hover

カード：

```css
transform: translateY(-2px);
border-color: rgba(210, 166, 121, 0.35);
```

ボタン：

```css
transform: translateY(-1px);
```

---

## 12. アクセシビリティ

- 背景が暗いため文字コントラストを確保する
- ボタンには明確な文言を入れる
- ラベルだけで意味が伝わるようにする
- フォーム入力欄にはlabelを設定する
- 画像にはaltを設定する
- 装飾画像は空altでもよい
- フォーカスリングを消さない

---

## 13. 実装用コンポーネント一覧

初期MVPで作るコンポーネント。

```text
components/
  layout/
    Header.tsx
    Footer.tsx
    Container.tsx
  ui/
    Button.tsx
    Badge.tsx
    ScoreBadge.tsx
    PlaceholderImage.tsx
    SectionTitle.tsx
    Input.tsx
    Textarea.tsx
    Select.tsx
  review/
    ReviewCard.tsx
    ReviewGrid.tsx
    ScoreGrid.tsx
    PaidLockBox.tsx
    ArticleHero.tsx
    SummaryCard.tsx
  shop/
    ShopInfoCard.tsx
    ShopHero.tsx
  area/
    AreaChips.tsx
  admin/
    AdminLayout.tsx
    ReviewForm.tsx
    ScoreInput.tsx
    ImageField.tsx
```

---

## 14. Tailwindテーマ例

`tailwind.config.ts` に以下を追加する。

```ts
theme: {
  extend: {
    colors: {
      night: {
        950: "#0D0B0A",
        900: "#181311",
        850: "#241B18",
        800: "#3A2C26",
      },
      champagne: {
        300: "#E0B98B",
        400: "#D2A679",
        500: "#A9784E",
      },
      wine: {
        700: "#8F1D2C",
      },
      ivory: {
        100: "#F4E9DE",
        300: "#B8A79B",
        500: "#7E6F66",
      },
    },
    borderRadius: {
      "3xl": "1.5rem",
      "4xl": "2rem",
    },
    boxShadow: {
      glow: "0 0 40px rgba(210,166,121,0.18)",
      card: "0 20px 60px rgba(0,0,0,0.35)",
    },
  },
}
```

---

## 15. 実装例：PlaceholderImage

```tsx
type PlaceholderImageProps = {
  variant?: "hero" | "card" | "shop" | "lock";
  label?: string;
};

export function PlaceholderImage({
  variant = "card",
  label = "IMAGE PLACEHOLDER",
}: PlaceholderImageProps) {
  const heightClass = {
    hero: "min-h-[420px]",
    card: "h-52",
    shop: "h-64",
    lock: "h-48",
  }[variant];

  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border border-champagne-400/15",
        "bg-gradient-to-br from-night-850 via-night-950 to-wine-700/40",
        heightClass,
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(210,166,121,0.25),transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(93,58,120,0.22),transparent_35%)]" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-4 left-4 rounded-full border border-champagne-400/20 bg-black/30 px-3 py-1 text-xs tracking-[0.18em] text-ivory-300">
        {label}
      </div>
    </div>
  );
}
```

---

## 16. 実装例：ReviewCard

```tsx
export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-champagne-400/15 bg-night-900 shadow-card transition hover:-translate-y-0.5 hover:border-champagne-400/35">
      <div className="relative">
        {review.thumbnailUrl ? (
          <img
            src={review.thumbnailUrl}
            alt={review.title}
            className="h-52 w-full object-cover"
          />
        ) : (
          <PlaceholderImage variant="card" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/20 to-transparent" />

        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-ivory-100 backdrop-blur">
            {review.areaName}
          </span>
          {review.isPaid && (
            <span className="rounded-full bg-champagne-400 px-3 py-1 text-xs font-bold text-night-950">
              本音レビュー
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ivory-100">
            {review.title}
          </h3>
          <p className="mt-2 text-sm text-ivory-300">
            {review.shopName}・{review.price?.toLocaleString()}円
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ScoreBadge label="総合" value={review.overallScore} />
          <ScoreBadge label="色気" value={review.sensualScore} />
          <ScoreBadge label="再訪" value={review.revisitScore} />
        </div>

        <p className="line-clamp-3 text-sm leading-7 text-ivory-300">
          {review.summary}
        </p>
      </div>
    </article>
  );
}
```

---

## 17. デザイン受け入れ条件

### 17.1 全体

- 黒・ベージュ・ゴールド基調になっている
- スマホで見やすい
- 記事カードが押したくなる見た目になっている
- 有料ロックエリアが目立つ
- 画像未設定でもデザインが崩れない
- 露骨なアダルトサイト風になっていない
- 高級感・夜・秘密・本音レビューの雰囲気がある

### 17.2 トップページ

- ファーストビューで世界観が伝わる
- CTAが2つ以上ある
- 最新レビューが見える
- 地域導線がある
- モバイルで縦に自然に読める

### 17.3 記事詳細

- 結論カードが目立つ
- スコアが見やすい
- 無料本文が読みやすい
- 有料部分への導線が強い
- 店舗情報が整理されている

### 17.4 管理画面

- スマホで入力しやすい
- セクションごとに入力できる
- 下書き保存しやすい
- スコア入力が簡単
- 無料本文と有料本文を分けて入力できる

---

## 18. Claude Codeへのデザイン実装指示

以下の方針でデザインを実装する。

```text
メンズエステ体験レビューサイトのデザインを実装してください。

デザイン方針：
- 黒、ベージュ、ゴールドを基調にする
- 高級感、夜、秘密、本音レビュー、艶っぽさを表現する
- 露骨なアダルトサイト風にはしない
- モバイルファースト
- カードは角丸大きめ
- 背景は暗く、カードを浮かせる
- CTAボタンはゴールド
- 有料ロックエリアは最も目立たせる
- 画像差し込み箇所は現時点では空欄またはPlaceholderImageで対応する
- 本番画像はまだ使わない
- 画像URLがない場合でもデザインが成立するようにする

作るコンポーネント：
- Header
- Footer
- Button
- Badge
- ScoreBadge
- PlaceholderImage
- ReviewCard
- ReviewGrid
- ScoreGrid
- PaidLockBox
- ArticleHero
- SummaryCard
- ShopInfoCard
- AreaChips
- AdminLayout
- ReviewForm

最優先：
- トップページ
- 記事一覧ページ
- 記事詳細ページ
- 管理画面の記事作成フォーム
```
