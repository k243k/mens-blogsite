import { auth } from "@/auth";
import { formatDate } from "@/lib/format";

export async function AdminHeader() {
  const session = await auth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 bg-background/80 px-6 py-4 shadow-sm shadow-black/5 dark:shadow-white/5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">管理メニュー</p>
        <p className="text-sm text-foreground/60">{formatDate(new Date(), { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div className="flex items-center gap-3 rounded-full border border-foreground/15 bg-background px-4 py-2 text-sm text-foreground/70">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        <span>{session?.user?.email ?? "未ログイン"}</span>
      </div>
    </header>
  );
}
