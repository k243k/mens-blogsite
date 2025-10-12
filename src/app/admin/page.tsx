import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Admin Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold">管理ダッシュボード（準備中）</h1>
          <p className="mt-4 text-base text-foreground/70">
            認証基盤が整備されました。今後ここに記事管理・カテゴリ／タグ管理・設定画面などを実装していきます。
          </p>
        </div>
        <div className="grid gap-6 rounded-2xl border border-foreground/10 bg-background/80 p-6 shadow-lg shadow-black/5 dark:shadow-white/5 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">次のステップ</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li>・記事CRUDとMDXエディタの実装</li>
              <li>・画像アップロードと最適化</li>
              <li>・Stripeチェックアウトとの統合</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">現在のステータス</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li>・メール／パスワード認証が有効</li>
              <li>・管理者のみがアクセス可能</li>
              <li>・シードデータにデモアカウントを追加済み</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
