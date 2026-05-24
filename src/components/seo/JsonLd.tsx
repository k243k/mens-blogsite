/**
 * 構造化データ（JSON-LD）を埋め込む。
 * 出典: requirements §10.3（Article / BreadcrumbList）。
 * ⚠️ 無料公開情報のみを渡す（有料本文は含めない）。
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // 静的生成時に文字列化。ユーザー入力ではなく自前データのみ。
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** パンくずの構造化データを生成する。 */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** 記事の構造化データを生成する（無料情報のみ）。 */
export function articleJsonLd(args: {
  title: string;
  description: string;
  url: string;
  datePublished: string | null;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.title,
    description: args.description,
    mainEntityOfPage: args.url,
    ...(args.datePublished ? { datePublished: args.datePublished } : {}),
  };
}
