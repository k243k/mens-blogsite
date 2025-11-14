import { SearchPageContent } from "@/components/search/SearchPageContent";
import { getAllPostSummaries, listCategories, listTags } from "@/content/api";

export const revalidate = 120;

export default function SearchPage() {
  const posts = getAllPostSummaries();
  const categories = listCategories(20);
  const tags = listTags(30);

  return <SearchPageContent posts={posts} categories={categories} tags={tags} />;
}
