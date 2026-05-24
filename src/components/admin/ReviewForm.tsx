"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  emptyReviewForm,
  reviewFormSchema,
  type ReviewFormValues,
} from "@/lib/admin/reviewSchema";
import { getAreaOptions, getShopOptions, type SelectOption } from "@/lib/repository/admin";
import { SCORE_DEFINITIONS } from "@/lib/scores";

const SCORE_OPTIONS = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

type Props = {
  defaultValues?: ReviewFormValues;
  onSubmit: (values: ReviewFormValues) => Promise<void>;
  submitting: boolean;
  serverError?: string | null;
};

/**
 * 記事作成・編集フォーム（スマホ最適化・1カラム・セクション分割）。
 * 有料本文フィールドは isPaid のときのみ入力。保存先の分離はリポジトリ層が担う。
 */
export function ReviewForm({ defaultValues, onSubmit, submitting, serverError }: Props) {
  const [areas, setAreas] = useState<SelectOption[]>([]);
  const [shops, setShops] = useState<SelectOption[]>([]);

  const {
    register,
    handleSubmit,
    // react-hook-form の watch は React Compiler でメモ化できない（既知）。CSRフォームでは許容。
    // eslint-disable-next-line react-hooks/incompatible-library
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: defaultValues ?? emptyReviewForm,
  });

  useEffect(() => {
    let active = true;
    Promise.all([getAreaOptions(), getShopOptions()]).then(([a, s]) => {
      if (!active) return;
      setAreas(a);
      setShops(s);
    });
    return () => {
      active = false;
    };
  }, []);

  const isPaid = watch("isPaid");
  const [validationError, setValidationError] = useState<string | null>(null);

  // 空文字・null・undefined はすべて null に。それ以外のみ数値化（Number(null)=0 の誤変換を防ぐ）。
  const numberSetAs = (v: unknown) =>
    v === "" || v === null || v === undefined ? null : Number(v);

  const onInvalid = (errs: Record<string, { message?: string }>) => {
    const fields = Object.entries(errs)
      .map(([k, e]) => `${k}: ${e?.message ?? "不正"}`)
      .join(" / ");
    setValidationError(`入力エラー: ${fields}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mx-auto max-w-[640px] px-5 pb-28 pt-6">
      {/* 基本情報 */}
      <Section title="基本情報">
        <Field label="店舗" error={errors.shopId?.message}>
          <select {...register("shopId")} className={inputCls}>
            <option value="">選択してください</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="エリア" error={errors.areaId?.message}>
          <select {...register("areaId")} className={inputCls}>
            <option value="">選択してください</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </Field>
        <Field label="タイトル" error={errors.title?.message}>
          <input type="text" {...register("title")} className={inputCls} />
        </Field>
        <Field label="slug（URL・英小文字/数字/ハイフン）" error={errors.slug?.message}>
          <input type="text" {...register("slug")} className={inputCls} placeholder="osaka-umeda-sample" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="料金（円）" error={errors.price?.message}>
            <input type="number" inputMode="numeric" {...register("price", { setValueAs: numberSetAs })} className={inputCls} />
          </Field>
          <Field label="コース時間（分）" error={errors.courseMinutes?.message}>
            <input type="number" inputMode="numeric" {...register("courseMinutes", { setValueAs: numberSetAs })} className={inputCls} />
          </Field>
        </div>
        <Field label="訪問日">
          <input type="date" {...register("visitDate")} className={inputCls} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ivory-100">
          <input type="checkbox" {...register("isPr")} className="h-4 w-4" />
          PR / 提供記事（記事上部にPR表記）
        </label>
      </Section>

      {/* スコア */}
      <Section title="スコア（9指標）">
        <div className="grid grid-cols-2 gap-3">
          {SCORE_DEFINITIONS.map((def) => (
            <Field key={def.key} label={def.label}>
              <select {...register(def.key, { setValueAs: numberSetAs })} className={inputCls}>
                <option value="">—</option>
                {SCORE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n.toFixed(1)}</option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </Section>

      {/* 無料本文 */}
      <Section title="無料本文（公開）">
        <Field label="一言結論" error={errors.summary?.message}>
          <textarea {...register("summary")} rows={2} className={inputCls} />
        </Field>
        <Field label="無料本文（Markdown可）" error={errors.freeBody?.message}>
          <textarea {...register("freeBody")} rows={8} className={inputCls} />
        </Field>
      </Section>

      {/* 画像（URLのみ） */}
      <Section title="画像（URL・任意。未入力ならプレースホルダー）">
        <Field label="サムネイルURL" error={errors.thumbnailUrl?.message}>
          <input type="url" {...register("thumbnailUrl")} className={inputCls} placeholder="https://..." />
        </Field>
        <Field label="メイン画像URL" error={errors.mainImageUrl?.message}>
          <input type="url" {...register("mainImageUrl")} className={inputCls} placeholder="https://..." />
        </Field>
      </Section>

      {/* 有料本文 */}
      <Section title="有料本文（review_paid_contents に分離保存）">
        <label className="flex items-center gap-2 text-sm text-ivory-100">
          <input type="checkbox" {...register("isPaid")} className="h-4 w-4" />
          有料記事にする（有料本文を設定）
        </label>

        {isPaid && (
          <div className="mt-4 space-y-4 rounded-[var(--radius-input)] border border-champagne-400/20 bg-night-900 p-4">
            <Field label="単品販売価格（円）" error={errors.unitPrice?.message}>
              <select
                {...register("unitPrice", { setValueAs: numberSetAs })}
                className={inputCls}
              >
                <option value="">選択してください</option>
                <option value="300">300円</option>
                <option value="500">500円</option>
                <option value="800">800円</option>
                <option value="1000">1,000円</option>
              </select>
            </Field>
            <Field label="有料本文（Markdown可）" error={errors.paidBody?.message}>
              <textarea {...register("paidBody")} rows={8} className={inputCls} />
            </Field>
            <Field label="写真とのギャップ"><textarea {...register("photoGap")} rows={2} className={inputCls} /></Field>
            <Field label="実際の満足度"><textarea {...register("satisfaction")} rows={2} className={inputCls} /></Field>
            <Field label="再訪したいか"><textarea {...register("revisitOpinion")} rows={2} className={inputCls} /></Field>
            <Field label="行く前の注意点"><textarea {...register("beginnerCaution")} rows={2} className={inputCls} /></Field>
            <Field label="この店が刺さる人"><textarea {...register("targetType")} rows={2} className={inputCls} /></Field>
          </div>
        )}
      </Section>

      {(serverError || validationError) && (
        <p className="mt-4 rounded-[var(--radius-input)] border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
          {serverError ?? validationError}
        </p>
      )}

      {/* 固定保存バー */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-champagne-400/20 bg-night-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] items-center gap-3 px-5 py-3">
          <button
            type="submit"
            onClick={() => setValue("status", "draft")}
            disabled={submitting}
            className="flex-1 rounded-full border border-champagne-400/40 px-5 py-3 text-sm font-bold text-ivory-100 disabled:opacity-60"
          >
            下書き保存
          </button>
          <button
            type="submit"
            onClick={() => setValue("status", "published")}
            disabled={submitting}
            className="flex-1 rounded-full bg-champagne-400 px-5 py-3 text-sm font-bold text-night-950 disabled:opacity-60"
          >
            {submitting ? "保存中…" : "公開する"}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "mt-1 w-full rounded-[var(--radius-input)] border border-champagne-400/20 bg-night-850 px-3 py-2.5 text-sm text-ivory-100 outline-none focus:border-champagne-400/60";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 border-b border-champagne-400/15 pb-2 text-sm font-bold tracking-wide text-champagne-300">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ivory-300">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-error">{error}</span>}
    </label>
  );
}
