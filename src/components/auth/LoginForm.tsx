"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(128, "パスワードは128文字以内で入力してください"),
});

type LoginInput = z.infer<typeof loginSchema>;

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: callbackUrl ?? "/admin",
    });

    if (!result) {
      setFormError("サインイン処理で予期せぬエラーが発生しました。");
      return;
    }

    if (result.error) {
      setFormError("メールアドレスまたはパスワードが正しくありません。");
      return;
    }

    router.push(result.url ?? callbackUrl ?? "/admin");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-6">
      <div>
        <label className="block text-sm font-semibold text-foreground" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-foreground/20 bg-background px-4 py-3 text-base outline-none transition focus:border-foreground/60 focus:ring-2 focus:ring-emerald-400"
          disabled={isSubmitting}
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p>
        ) : null}
      </div>
      <div>
        <label className="block text-sm font-semibold text-foreground" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-foreground/20 bg-background px-4 py-3 text-base outline-none transition focus:border-foreground/60 focus:ring-2 focus:ring-emerald-400"
          disabled={isSubmitting}
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p>
        ) : null}
      </div>
      {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
      <button
        type="submit"
        className="flex h-12 items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "サインイン中..." : "サインイン"}
      </button>
      <p className="text-center text-xs text-foreground/70">
        デモ用アカウント: admin@example.com / Admin123!
      </p>
    </form>
  );
}
