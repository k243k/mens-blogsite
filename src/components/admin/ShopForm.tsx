"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { emptyShopForm, shopFormSchema, type ShopFormValues } from "@/lib/admin/shopSchema";
import { getAreaOptions, type SelectOption } from "@/lib/repository/admin";

type Props = {
  defaultValues?: ShopFormValues;
  onSubmit: (values: ShopFormValues) => Promise<void>;
  submitting: boolean;
  serverError?: string | null;
};

/** 店舗の作成・編集フォーム（1カラム・スマホ最適化）。 */
export function ShopForm({ defaultValues, onSubmit, submitting, serverError }: Props) {
  const [areas, setAreas] = useState<SelectOption[]>([]);
  const [areaError, setAreaError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: defaultValues ?? emptyShopForm,
  });

  useEffect(() => {
    let active = true;
    getAreaOptions()
      .then((a) => {
        if (active) setAreas(a);
      })
      .catch(() => {
        if (active) setAreaError("エリア一覧の取得に失敗しました。再読み込みしてください。");
      });
    return () => {
      active = false;
    };
  }, []);

  const [validationError, setValidationError] = useState<string | null>(null);
  const numberSetAs = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));

  const onInvalid = (errs: Record<string, { message?: string }>) => {
    const fields = Object.entries(errs)
      .map(([k, e]) => `${k}: ${e?.message ?? "不正"}`)
      .join(" / ");
    setValidationError(`入力エラー: ${fields}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mx-auto max-w-[640px] px-5 pb-28 pt-6">
      <Section title="基本情報">
        <Field label="店名" error={errors.name?.message}>
          <input type="text" {...register("name")} className={inputCls} />
        </Field>
        <Field label="slug（URL・英小文字/数字/ハイフン）" error={errors.slug?.message}>
          <input type="text" {...register("slug")} className={inputCls} placeholder="aromablanc-umeda" />
        </Field>
        <Field label="エリア" error={errors.areaId?.message ?? areaError ?? undefined}>
          <select {...register("areaId")} className={inputCls}>
            <option value="">選択してください</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </Field>
        <Field label="最寄駅" error={errors.station?.message}>
          <input type="text" {...register("station")} className={inputCls} placeholder="梅田駅 徒歩5分" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="料金（下限・円）" error={errors.priceMin?.message}>
            <input type="number" inputMode="numeric" {...register("priceMin", { setValueAs: numberSetAs })} className={inputCls} />
          </Field>
          <Field label="料金（上限・円）" error={errors.priceMax?.message}>
            <input type="number" inputMode="numeric" {...register("priceMax", { setValueAs: numberSetAs })} className={inputCls} />
          </Field>
        </div>
        <Field label="営業時間" error={errors.businessHours?.message}>
          <input type="text" {...register("businessHours")} className={inputCls} placeholder="12:00〜24:00" />
        </Field>
        <Field label="公式URL" error={errors.officialUrl?.message}>
          <input type="url" {...register("officialUrl")} className={inputCls} placeholder="https://..." />
        </Field>
      </Section>

      <Section title="紹介文・注意書き">
        <Field label="説明" error={errors.description?.message}>
          <textarea {...register("description")} rows={5} className={inputCls} />
        </Field>
        <Field label="注意書き" error={errors.caution?.message}>
          <textarea {...register("caution")} rows={3} className={inputCls} />
        </Field>
      </Section>

      <Section title="公開設定">
        <Field label="ステータス" error={errors.status?.message}>
          <select {...register("status")} className={inputCls}>
            <option value="published">公開（レビュー作成の選択肢に出る）</option>
            <option value="private">非公開</option>
          </select>
        </Field>
      </Section>

      {(serverError || validationError) && (
        <p className="mt-4 rounded-[var(--radius-input)] border border-error/40 bg-error/10 px-4 py-2 text-sm text-error">
          {serverError ?? validationError}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-champagne-400/20 bg-night-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] items-center gap-3 px-5 py-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-full bg-champagne-400 px-5 py-3 text-sm font-bold text-night-950 disabled:opacity-60"
          >
            {submitting ? "保存中…" : "保存する"}
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ivory-300">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-error">{error}</span>}
    </label>
  );
}
