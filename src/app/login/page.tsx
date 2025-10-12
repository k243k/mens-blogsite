import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const callbackUrl = searchParams?.callbackUrl;

  if (session?.user?.role === "ADMIN") {
    redirect(callbackUrl ?? "/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-20 text-foreground">
      <div className="w-full max-w-3xl rounded-3xl border border-foreground/10 bg-background/80 p-10 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-white/5">
        <div className="mx-auto mb-10 max-w-md text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Admin Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold">管理画面ログイン</h1>
          <p className="mt-4 text-sm text-foreground/70">
            認証済みの管理者アカウントでログインすると、記事や設定の管理画面にアクセスできます。
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
