"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdminToast } from "@/components/admin/AdminToastProvider";

const settingsSchema = z.object({
  ads: z.object({
    articleTop: z.string().min(1, "記事上広告IDを入力してください"),
    articleInline: z.string().min(1, "本文内広告IDを入力してください"),
    articleBottom: z.string().min(1, "記事下広告IDを入力してください"),
  }),
  seo: z.object({
    defaultTitle: z.string().min(1, "デフォルトタイトルを入力してください"),
    defaultDescription: z.string().min(1, "デフォルト説明を入力してください"),
  }),
  affiliate: z.object({
    utmSource: z.string().min(1, "utm_sourceを入力してください"),
    partnerId: z.string().min(1, "パートナーIDを入力してください"),
  }),
  comments: z.object({
    enabled: z.boolean().default(false),
  }),
});

type SettingValues = z.infer<typeof settingsSchema>;

type SettingFormProps = {
  initialSettings: { key: string; value: unknown }[];
};

export function SettingForm({ initialSettings }: SettingFormProps) {
  const structured = useMemo<SettingValues>(() => {
    const ads = getValue(initialSettings, "ads", { articleTop: "", articleInline: "", articleBottom: "" });
    const seo = getValue(initialSettings, "seo", { defaultTitle: "", defaultDescription: "" });
    const affiliate = getValue(initialSettings, "affiliate", { utmSource: "", partnerId: "" });
    const cms = getValue(initialSettings, "comments", { enabled: false });

    return {
      ads,
      seo,
      affiliate,
      comments: cms,
    } satisfies SettingValues;
  }, [initialSettings]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: structured,
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { pushToast } = useAdminToast();

  const onSubmit = handleSubmit((values) => {
    setServerError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "bulk",
            value: values,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setServerError(data.error ?? "保存に失敗しました。");
          return;
        }

        pushToast("設定を保存しました。", "success");
        reset(values);
      } catch (error) {
        console.error(error);
        setServerError("保存処理中にエラーが発生しました。");
        pushToast("保存処理中にエラーが発生しました。", "error");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset className="grid gap-6 rounded-2xl border border-foreground/10 bg-background/80 p-6 shadow-sm shadow-black/5 dark:shadow-white/5 lg:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">広告設定</legend>
        <InputField
          label="記事上広告ID"
          error={errors.ads?.articleTop?.message}
          {...register("ads.articleTop")}
        />
        <InputField
          label="本文内広告ID"
          error={errors.ads?.articleInline?.message}
          {...register("ads.articleInline")}
        />
        <InputField
          label="記事下広告ID"
          error={errors.ads?.articleBottom?.message}
          {...register("ads.articleBottom")}
        />
      </fieldset>

      <fieldset className="grid gap-6 rounded-2xl border border-foreground/10 bg-background/80 p-6 shadow-sm shadow-black/5 dark:shadow-white/5">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">SEOデフォルト</legend>
        <InputField
          label="既定タイトル"
          error={errors.seo?.defaultTitle?.message}
          {...register("seo.defaultTitle")}
        />
        <TextareaField
          label="既定ディスクリプション"
          error={errors.seo?.defaultDescription?.message}
          {...register("seo.defaultDescription")}
        />
      </fieldset>

      <fieldset className="grid gap-6 rounded-2xl border border-foreground/10 bg-background/80 p-6 shadow-sm shadow-black/5 dark:shadow-white/5 lg:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">アフィリエイト</legend>
        <InputField
          label="utm_source"
          error={errors.affiliate?.utmSource?.message}
          {...register("affiliate.utmSource")}
        />
        <InputField
          label="パートナーID"
          error={errors.affiliate?.partnerId?.message}
          {...register("affiliate.partnerId")}
        />
      </fieldset>

      <fieldset className="rounded-2xl border border-foreground/10 bg-background/80 p-6 shadow-sm shadow-black/5 dark:shadow-white/5">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/50">コメント</legend>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4" {...register("comments.enabled")} />
          投稿でコメントを受け付ける（サイト設定）
        </label>
      </fieldset>

      {serverError ? <p className="text-sm text-rose-500">{serverError}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "保存中..." : "設定を保存"}
        </button>
      </div>
    </form>
  );
}

function InputField({ label, error, ...props }: { label: string; error?: string } & React.ComponentPropsWithoutRef<"input">) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      {label}
      <input
        className="rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
        {...props}
      />
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </label>
  );
}

function TextareaField({ label, error, ...props }: { label: string; error?: string } & React.ComponentPropsWithoutRef<"textarea">) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      {label}
      <textarea
        className="rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
        rows={4}
        {...props}
      />
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </label>
  );
}

function getValue<T>(settings: { key: string; value: unknown }[], key: string, fallback: T): T {
  const item = settings.find((setting) => setting.key === key);
  if (!item) return fallback;
  try {
    return item.value as T;
  } catch (error) {
    console.warn("Setting value parse failed", key, error);
    return fallback;
  }
}
