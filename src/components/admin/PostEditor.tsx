"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormSetValue } from "react-hook-form";
import { z } from "zod";

import type { CategorySummary } from "@/server/repositories/category-repository";
import type { TagSummary } from "@/server/repositories/tag-repository";
import { PostStatus } from "@prisma/client";

import { useAdminToast } from "@/components/admin/AdminToastProvider";

const formSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  slug: z.string().min(1, "スラッグを入力してください"),
  excerpt: z.string().min(1, "概要を入力してください"),
  body: z.string().min(1, "本文を入力してください"),
  status: z.nativeEnum(PostStatus),
  publishedAt: z.union([z.string().datetime(), z.literal(""), z.null()]).optional(),
  isPaid: z.boolean(),
  priceJPY: z.number().int().nonnegative(),
  readTime: z.number().int().min(1, "読了時間は1以上で設定してください"),
  coverImage: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  commentsEnabled: z.boolean().optional(),
  categoryIds: z.array(z.string()),
  tagIds: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

type PostEditorProps = {
  mode: "create" | "edit";
  authorId: string;
  categories: CategorySummary[];
  tags: TagSummary[];
  initialValues?: Partial<FormValues> & { id?: string };
};

export function PostEditor({ mode, authorId, categories, tags, initialValues }: PostEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { pushToast } = useAdminToast();

  const defaultValues: FormValues = {
    title: initialValues?.title ?? "",
    slug: initialValues?.slug ?? "",
    excerpt: initialValues?.excerpt ?? "",
    body: initialValues?.body ?? "",
    status: initialValues?.status ?? PostStatus.DRAFT,
    publishedAt: initialValues?.publishedAt ?? "",
    isPaid: initialValues?.isPaid ?? false,
    priceJPY: initialValues?.priceJPY ?? 0,
    readTime: initialValues?.readTime ?? 5,
    coverImage: initialValues?.coverImage ?? "",
    commentsEnabled: initialValues?.commentsEnabled ?? false,
    categoryIds: initialValues?.categoryIds ?? [],
    tagIds: initialValues?.tagIds ?? [],
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const isPaid = watch("isPaid");
  const status = watch("status");
  const selectedCategories = watch("categoryIds") ?? [];
  const selectedTags = watch("tagIds") ?? [];
  const coverImage = watch("coverImage") ?? "";

  const onSubmit = handleSubmit((values) => {
    setError(null);
    if (status === PostStatus.SCHEDULED && !values.publishedAt) {
      setError("予約公開には公開日時が必要です。");
      return;
    }

    startTransition(async () => {
      try {
        const payload = buildPayload(values, authorId, mode === "edit" ? initialValues?.id : undefined);
        const response = await fetch(mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${initialValues?.id}`, {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.error ?? "保存に失敗しました。");
          return;
        }

        pushToast(mode === "create" ? "記事を作成しました。" : "記事を更新しました。", "success");
        router.push("/admin/posts");
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("保存中にエラーが発生しました。");
        pushToast("保存中にエラーが発生しました。", "error");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground" htmlFor="title">
              タイトル
            </label>
            <input
              id="title"
              className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="例: 副業で学んだ時間術"
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground" htmlFor="slug">
              スラッグ
            </label>
            <input
              id="slug"
              className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              placeholder="first-side-job-story"
              {...register("slug")}
            />
            <FieldError message={errors.slug?.message} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground" htmlFor="excerpt">
              概要
            </label>
            <textarea
              id="excerpt"
              rows={3}
              className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              {...register("excerpt")}
            />
            <FieldError message={errors.excerpt?.message} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground" htmlFor="body">
              本文（MDX）
            </label>
            <textarea
              id="body"
              rows={18}
              className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-sm font-mono outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              {...register("body")}
            />
            <FieldError message={errors.body?.message} />
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">カバー画像</h2>
            <div className="mt-4 space-y-3 text-sm">
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleCoverUpload(event, setValue, setUploadError, setUploading)
                }
                disabled={uploading}
              />
              {uploadError ? <p className="text-xs text-rose-500">{uploadError}</p> : null}
              {uploading ? <p className="text-xs text-foreground/60">アップロード中...</p> : null}
              {coverImage ? (
                <div className="space-y-2">
                  <div className="relative h-40 w-full overflow-hidden rounded-xl">
                    <Image
                      src={coverImage}
                      alt="カバー画像プレビュー"
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, 100vw"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue("coverImage", "", { shouldDirty: true })}
                    className="rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/60 transition hover:border-rose-300 hover:text-rose-500"
                  >
                    画像を削除
                  </button>
                </div>
              ) : (
                <p className="text-xs text-foreground/50">アップロードした画像がここに表示されます。</p>
              )}
              <input type="hidden" {...register("coverImage")} />
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">公開設定</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center gap-3">
                <span className="w-24 text-foreground/60">ステータス</span>
                <select
                  className="flex-1 rounded-xl border border-foreground/15 bg-background px-3 py-2"
                  {...register("status")}
                >
                  <option value={PostStatus.DRAFT}>下書き</option>
                  <option value={PostStatus.PUBLISHED}>公開</option>
                  <option value={PostStatus.SCHEDULED}>予約</option>
                </select>
              </label>
              <label className="flex items-center gap-3">
                <span className="w-24 text-foreground/60">公開日時</span>
                <input
                  type="datetime-local"
                  className="flex-1 rounded-xl border border-foreground/15 bg-background px-3 py-2"
                  {...register("publishedAt")}
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-24 text-foreground/60">読了目安</span>
                <input
                  type="number"
                  min={1}
                  className="flex-1 rounded-xl border border-foreground/15 bg-background px-3 py-2"
                  {...register("readTime", { valueAsNumber: true })}
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-24 text-foreground/60">コメント</span>
                <input type="checkbox" className="h-4 w-4" {...register("commentsEnabled")} />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">課金設定</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" {...register("isPaid")} />
                <span>有料記事にする</span>
              </label>
              <label className="flex items-center gap-3">
                <span className="w-24 text-foreground/60">価格</span>
                <input
                  type="number"
                  min={0}
                  disabled={!isPaid}
                  className="flex-1 rounded-xl border border-foreground/15 bg-background px-3 py-2 disabled:bg-foreground/10"
                  {...register("priceJPY", { valueAsNumber: true })}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-background/80 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50">カテゴリ・タグ</h2>
            <fieldset className="mt-4 space-y-3 text-sm">
              <legend className="text-xs uppercase tracking-[0.2em] text-foreground/50">カテゴリ</legend>
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    value={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={(event) =>
                      handleMultiToggle(event, "categoryIds", category.id, selectedCategories, setValue)
                    }
                  />
                  <span>{category.name}</span>
                </label>
              ))}
              <FieldError message={errors.categoryIds?.message as string | undefined} />
            </fieldset>
            <fieldset className="mt-5 space-y-3 text-sm">
              <legend className="text-xs uppercase tracking-[0.2em] text-foreground/50">タグ</legend>
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    value={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onChange={(event) => handleMultiToggle(event, "tagIds", tag.id, selectedTags, setValue)}
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </fieldset>
          </div>
        </section>
      </div>

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-full border border-foreground/15 px-5 py-2 text-sm text-foreground/70 transition hover:border-emerald-400 hover:text-emerald-500"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "保存中..." : mode === "create" ? "作成する" : "更新する"}
        </button>
      </div>
    </form>
  );
}

function handleMultiToggle(
  event: ChangeEvent<HTMLInputElement>,
  key: "categoryIds" | "tagIds",
  value: string,
  current: string[],
  setValue: UseFormSetValue<FormValues>,
) {
  const selected = new Set(current ?? []);
  if (event.target.checked) {
    selected.add(value);
  } else {
    selected.delete(value);
  }
  setValue(key, Array.from(selected), { shouldDirty: true });
}

function buildPayload(values: FormValues, authorId: string, id?: string) {
  const publishedAt = values.publishedAt
    ? new Date(values.publishedAt).toISOString()
    : values.publishedAt === "" || values.publishedAt === null
    ? null
    : undefined;

  const coverImage = values.coverImage === "" ? null : values.coverImage;

  const base = {
    slug: values.slug,
    title: values.title,
    excerpt: values.excerpt,
    body: values.body,
    status: values.status,
    publishedAt,
    isPaid: values.isPaid,
    priceJPY: values.isPaid ? values.priceJPY : 0,
    readTime: values.readTime,
    coverImage,
    commentsEnabled: values.commentsEnabled ?? false,
    categoryIds: values.categoryIds,
    tagIds: values.tagIds,
  };

  if (id) {
    return {
      id,
      ...base,
    };
  }

  return {
    authorId,
    ...base,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-xs text-rose-500">{message}</p>;
}

async function handleCoverUpload(
  event: ChangeEvent<HTMLInputElement>,
  setValue: UseFormSetValue<FormValues>,
  setError: (value: string | null) => void,
  setUploading: (value: boolean) => void,
) {
  const file = event.target.files?.[0];
  if (!file) return;

  setError(null);

  if (!file.type.startsWith("image/")) {
    setError("画像ファイルを選択してください。");
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("5MB以下の画像を選択してください。");
    event.target.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  setUploading(true);

  try {
    const response = await fetch("/api/admin/media", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = mapUploadError(data.error);
      setError(message);
      return;
    }

    const data = (await response.json()) as { url: string };
    setValue("coverImage", data.url, { shouldDirty: true });
  } catch (error) {
    console.error(error);
    setError("アップロード中にエラーが発生しました。");
  } finally {
    setUploading(false);
    event.target.value = "";
  }
}

function mapUploadError(error?: string) {
  switch (error) {
    case "FILE_TOO_LARGE":
      return "5MB以下の画像を選択してください。";
    case "UNSUPPORTED_TYPE":
      return "対応していない画像形式です。";
    case "FILE_EMPTY":
      return "有効なファイルが選択されていません。";
    default:
      return error ?? "アップロードに失敗しました。";
  }
}
