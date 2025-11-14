import type { Author, Category, Post, Tag } from "@/content/types";

export const authors: Author[] = [
  {
    id: "author-admin",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
];

export const categories: Category[] = [
  { id: "category-career", slug: "career", name: "キャリア" },
  { id: "category-wellness", slug: "wellness", name: "健康" },
  { id: "category-lifestyle", slug: "lifestyle", name: "ライフスタイル" },
  { id: "category-relationships", slug: "relationships", name: "人間関係" },
];

export const tags: Tag[] = [
  { id: "tag-mental-health", slug: "mental-health", name: "メンタルヘルス" },
  { id: "tag-work-life", slug: "work-life", name: "ワークライフバランス" },
  { id: "tag-sauna", slug: "sauna", name: "サウナ" },
  { id: "tag-fitness", slug: "fitness", name: "フィットネス" },
  { id: "tag-dating", slug: "dating", name: "恋愛" },
  { id: "tag-career-change", slug: "career-change", name: "キャリアチェンジ" },
];

export const posts: Post[] = [
  {
    id: "post-first-side-job-story",
    slug: "first-side-job-story",
    title: "初めての副業で学んだ、夜時間の有効活用術",
    excerpt: "本業と両立しながら副業を軌道に乗せるための思考法と時間術。",
    body: `import AdSlot from "@/components/ads/AdSlot";

# 初めての副業で学んだ、夜時間の有効活用術

副業を始めた当初は、夜時間をどう確保するかに苦労しました。

## スケジュールを30分単位で見直す

通勤時間や休憩時間にやるべきタスクを事前に決め、夜は制作時間に集中。**朝の準備**を前日に済ませることで、1日あたり90分を捻出できました。

<AdSlot id="article-top" />

## デジタル疲労を回避する習慣

ブルーライトカット眼鏡と20分ごとのストレッチで集中力を維持。また、週末の午前にだけ重いタスクを入れることで、睡眠時間を削らずに成果を出せました。
`,
    status: "published",
    publishedAt: "2024-12-10T09:00:00.000Z",
    readTime: 7,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["career"],
    tags: ["work-life", "career-change"],
    authorId: "author-admin",
    featured: true,
  },
  {
    id: "post-relationship-reset",
    slug: "relationship-reset",
    title: "結婚10年目のリセット習慣：小さな不満を溜めない仕組み",
    excerpt: "パートナーとの対話を再設計した日常ルーティンとツールの活用術。",
    body: `# 結婚10年目のリセット習慣

パートナーとの関係を長く良好に保つには、小さなズレをすばやく解消する場作りが欠かせません。

## 週1回の関係ミーティング

Googleカレンダーに共有予定を入れ、感謝と気付きを伝える時間を30分確保しました。

## ミニマムなTODO共有

Notionに家事と予定を整理し、お互いが無理なく動けるようにしています。
`,
    status: "published",
    publishedAt: "2024-12-05T09:00:00.000Z",
    readTime: 6,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["relationships"],
    tags: ["dating", "work-life"],
    authorId: "author-admin",
  },
  {
    id: "post-wellness-reset-routine",
    slug: "wellness-reset-routine",
    title: "テレワーク太りから抜け出した体幹リセットメソッド",
    excerpt: "コロナ禍で増えた体重を自宅トレーニングで戻すまでのステップ。",
    body: `# テレワーク太りから抜け出した体幹リセットメソッド

カロリー計算とトレーニングをシンプルに保つことで習慣化しました。

- 週3回のHIITで基礎代謝を向上
- タンパク質の摂取を体重1kgあたり1.5gに固定
- 夜はストレッチと入浴で睡眠の質を高める
`,
    status: "published",
    publishedAt: "2024-11-28T09:00:00.000Z",
    readTime: 8,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["wellness"],
    tags: ["fitness"],
    authorId: "author-admin",
  },
  {
    id: "post-morning-sauna-refresh",
    slug: "morning-sauna-refresh",
    title: "朝サウナと軽い断食で感じた集中力の変化",
    excerpt: "毎朝のサウナとプチ断食がメンタルに与えた影響を定点観測。",
    body: `# 朝サウナと軽い断食で感じた集中力の変化

サウナ → 丁寧な水分補給 → 軽い断食の順番で行うと、午前中の集中力が平均1.5倍に。心拍数の変化もGarminで計測しました。
`,
    status: "published",
    publishedAt: "2024-11-20T09:00:00.000Z",
    readTime: 5,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["lifestyle"],
    tags: ["sauna", "mental-health"],
    authorId: "author-admin",
  },
  {
    id: "post-burnout-recovery",
    slug: "burnout-recovery",
    title: "燃え尽き症候群からの回復記録：産業医と歩んだ90日",
    excerpt: "会社のサポート制度を活かしながら心のリズムを取り戻した話。",
    body: `# 燃え尽き症候群からの回復記録

産業医との面談内容と、自宅でできるリカバリールーティンを紹介します。
`,
    status: "published",
    publishedAt: "2024-11-12T09:00:00.000Z",
    readTime: 9,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["wellness"],
    tags: ["mental-health"],
    authorId: "author-admin",
  },
  {
    id: "post-remote-team-lead",
    slug: "remote-team-lead",
    title: "リモートチームで成果を出すための週次アジェンダ",
    excerpt: "オンライン主体のチームマネジメントで実践したアジェンダテンプレート。",
    body: `# リモートチームで成果を出すための週次アジェンダ

キックオフ、振り返り、メンタルチェックインの3部構成で問題の早期発見につながりました。
`,
    status: "published",
    publishedAt: "2024-11-04T09:00:00.000Z",
    readTime: 7,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["career"],
    tags: ["work-life"],
    authorId: "author-admin",
  },
  {
    id: "post-second-career-design",
    slug: "second-career-design",
    title: "40代からのセカンドキャリア設計ワークショップ体験談",
    excerpt: "社外メンターと進めたキャリア再設計のプロセスと落とし穴。",
    body: `# 40代からのセカンドキャリア設計

自分の棚卸しとスキル転用の考え方をワークシート形式でまとめています。
`,
    status: "published",
    publishedAt: "2024-10-28T09:00:00.000Z",
    readTime: 10,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["career"],
    tags: ["career-change"],
    authorId: "author-admin",
  },
  {
    id: "post-minimalist-home-refresh",
    slug: "minimalist-home-refresh",
    title: "5畳のワークスペースを作るためのミニマリスト改造",
    excerpt: "狭いリビングに快適なワークスペースを作った家具と収納術。",
    body: `# 5畳のワークスペースを作るためのミニマリスト改造

デスク・チェア・照明の最適解と、配線を隠すテクニックを紹介します。
`,
    status: "published",
    publishedAt: "2024-10-18T09:00:00.000Z",
    readTime: 6,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["lifestyle"],
    tags: ["work-life"],
    authorId: "author-admin",
  },
  {
    id: "post-communication-reset",
    slug: "communication-reset",
    title: "チームの雑談不足を解消した朝のスタンドアップ実験",
    excerpt: "オンライン雑談タイムをスムーズに回すためのファシリテーション。",
    body: `# チームの雑談不足を解消した朝のスタンドアップ実験

3人ずつのブレイクアウトで「昨晩の一枚」を共有し、コミュニケーションの温度を高めました。
`,
    status: "published",
    publishedAt: "2024-10-10T09:00:00.000Z",
    readTime: 5,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["career"],
    tags: ["mental-health", "work-life"],
    authorId: "author-admin",
  },
  {
    id: "post-reset-sleep-habit",
    slug: "reset-sleep-habit",
    title: "寝つきの悪さを改善した3つのルーティン",
    excerpt: "就寝前のルーティンとガジェット活用で睡眠の質を底上げした記録。",
    body: `# 寝つきの悪さを改善した3つのルーティン

ルームライト・アロマ・ノート術の組み合わせで睡眠の質スコアが向上しました。
`,
    status: "published",
    publishedAt: "2024-10-02T09:00:00.000Z",
    readTime: 6,
    isPaid: false,
    priceJPY: 0,
    coverImage: null,
    commentsEnabled: false,
    categories: ["wellness"],
    tags: ["mental-health"],
    authorId: "author-admin",
  },
];
