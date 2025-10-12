export const revalidate = 3600;

export default function robots() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
