import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { PostEditor } from "@/components/admin/PostEditor";
import { getServerContainer } from "@/server/get-container";

export default async function AdminPostCreatePage() {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const container = getServerContainer();
  const [categories, tags] = await Promise.all([
    container.services.content.listCategories(),
    container.services.content.listTags(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">記事を作成</h1>
        <p className="text-sm text-foreground/60">必要な項目を入力し、ドラフト保存または公開ステータスを設定してください。</p>
      </div>
      <PostEditor
        mode="create"
        authorId={session.user.id}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
