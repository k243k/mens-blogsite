import { PrismaClient, PostStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin123!";

const categoryData = [
  { name: "キャリア", slug: "career" },
  { name: "健康", slug: "wellness" },
  { name: "ライフスタイル", slug: "lifestyle" },
  { name: "人間関係", slug: "relationships" },
];

const tagData = [
  { name: "メンタルヘルス", slug: "mental-health" },
  { name: "ワークライフバランス", slug: "work-life" },
  { name: "サウナ", slug: "sauna" },
  { name: "フィットネス", slug: "fitness" },
  { name: "恋愛", slug: "dating" },
  { name: "キャリアチェンジ", slug: "career-change" },
];

const postTemplates = [
  {
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
    categories: ["career"],
    tags: ["work-life", "career-change"],
    isPaid: false,
  },
  {
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
    categories: ["relationships"],
    tags: ["dating", "work-life"],
    isPaid: false,
  },
  {
    slug: "wellness-reset-routine",
    title: "テレワーク太りから抜け出した体幹リセットメソッド",
    excerpt: "コロナ禍で増えた体重を自宅トレーニングで戻すまでのステップ。",
    body: `# テレワーク太りから抜け出した体幹リセットメソッド

カロリー計算とトレーニングをシンプルに保つことで習慣化しました。

- 週3回のHIITで基礎代謝を向上
- タンパク質の摂取を体重1kgあたり1.5gに固定
- 夜はストレッチと入浴で睡眠の質を高める
`,
    categories: ["wellness"],
    tags: ["fitness"],
    isPaid: true,
  },
  {
    slug: "morning-sauna-refresh",
    title: "朝サウナと軽い断食で感じた集中力の変化",
    excerpt: "毎朝のサウナとプチ断食がメンタルに与えた影響を定点観測。",
    body: `# 朝サウナと軽い断食で感じた集中力の変化

サウナ → 丁寧な水分補給 → 軽い断食の順番で行うと、午前中の集中力が平均1.5倍に。心拍数の変化もGarminで計測しました。
`,
    categories: ["lifestyle"],
    tags: ["sauna", "mental-health"],
    isPaid: false,
  },
  {
    slug: "burnout-recovery",
    title: "燃え尽き症候群からの回復記録：産業医と歩んだ90日",
    excerpt: "会社のサポート制度を活かしながら心のリズムを取り戻した話。",
    body: `# 燃え尽き症候群からの回復記録

産業医との面談内容と、自宅でできるリカバリールーティンを紹介します。
`,
    categories: ["wellness"],
    tags: ["mental-health"],
    isPaid: true,
  },
  {
    slug: "remote-team-lead",
    title: "リモートチームで成果を出すための週次アジェンダ",
    excerpt: "オンライン主体のチームマネジメントで実践したアジェンダテンプレート。",
    body: `# リモートチームで成果を出すための週次アジェンダ

キックオフ、振り返り、メンタルチェックインの3部構成で問題の早期発見につながりました。
`,
    categories: ["career"],
    tags: ["work-life"],
    isPaid: false,
  },
  {
    slug: "second-career-design",
    title: "40代からのセカンドキャリア設計ワークショップ体験談",
    excerpt: "社外メンターと進めたキャリア再設計のプロセスと落とし穴。",
    body: `# 40代からのセカンドキャリア設計

自分の棚卸しとスキル転用の考え方をワークシート形式でまとめています。
`,
    categories: ["career"],
    tags: ["career-change"],
    isPaid: true,
  },
  {
    slug: "minimalist-home-refresh",
    title: "5畳のワークスペースを作るためのミニマリスト改造",
    excerpt: "狭いリビングに快適なワークスペースを作った家具と収納術。",
    body: `# 5畳のワークスペースを作るためのミニマリスト改造

デスク・チェア・照明の最適解と、配線を隠すテクニックを紹介します。
`,
    categories: ["lifestyle"],
    tags: ["work-life"],
    isPaid: false,
  },
  {
    slug: "communication-reset",
    title: "チームの雑談不足を解消した朝のスタンドアップ実験",
    excerpt: "オンライン雑談タイムをスムーズに回すためのファシリテーション。",
    body: `# チームの雑談不足を解消した朝のスタンドアップ実験

3人ずつのブレイクアウトで「昨晩の一枚」を共有し、コミュニケーションの温度を高めました。
`,
    categories: ["career"],
    tags: ["mental-health", "work-life"],
    isPaid: false,
  },
  {
    slug: "reset-sleep-habit",
    title: "寝つきの悪さを改善した3つのルーティン",
    excerpt: "就寝前のルーティンとガジェット活用で睡眠の質を底上げした記録。",
    body: `# 寝つきの悪さを改善した3つのルーティン

ルームライト・アロマ・ノート術の組み合わせで睡眠の質スコアが向上しました。
`,
    categories: ["wellness"],
    tags: ["mental-health"],
    isPaid: false,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.comment.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const categories = await Promise.all(
    categoryData.map((category) =>
      prisma.category.create({
        data: category,
      }),
    ),
  );

  const tags = await Promise.all(
    tagData.map((tag) =>
      prisma.tag.create({
        data: tag,
      }),
    ),
  );

  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const tagMap = new Map(tags.map((tag) => [tag.slug, tag]));

  const now = Date.now();

  for (const [index, template] of postTemplates.entries()) {
    const publishedAt = new Date(now - index * 1000 * 60 * 60 * 24);

    const post = await prisma.post.create({
      data: {
        slug: template.slug,
        title: template.title,
        excerpt: template.excerpt,
        body: template.body,
        author: { connect: { id: adminUser.id } },
        status: PostStatus.PUBLISHED,
        publishedAt,
        isPaid: template.isPaid,
        priceJPY: template.isPaid ? 980 : 0,
        readTime: 7 + index,
        commentsEnabled: index % 2 === 0,
      },
    });

    for (const categorySlug of template.categories) {
      const category = categoryMap.get(categorySlug);
      if (!category) continue;
      await prisma.postCategory.create({
        data: {
          postId: post.id,
          categoryId: category.id,
        },
      });
    }

    for (const tagSlug of template.tags) {
      const tag = tagMap.get(tagSlug);
      if (!tag) continue;
      await prisma.postTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      });
    }
  }

  await prisma.setting.createMany({
    data: [
      {
        key: "ads",
        value: {
          articleTop: "article-top",
          articleInline: "article-inline",
          articleBottom: "article-bottom",
        },
      },
      {
        key: "seo",
        value: {
          defaultTitle: "Men's Blogsite",
          defaultDescription: "男性向け体験談を丁寧に届けるメディア",
        },
      },
      {
        key: "affiliate",
        value: {
          utmSource: "mens-blogsite",
          partnerId: "demo",
        },
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
