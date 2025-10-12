import { getServerContainer } from "@/server/get-container";

export const revalidate = 3600;

export default async function sitemap() {
  const container = getServerContainer();
  const posts = await container.repositories.post.listPublishedPosts({ orderBy: "latest", limit: 1000 });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    ...posts.map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: post.publishedAt ?? new Date(),
    })),
  ];
}
