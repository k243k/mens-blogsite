// output: export では静的化を明示する必要がある（Next 16）。
export const dynamic = "force-static";

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/reset-password"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
