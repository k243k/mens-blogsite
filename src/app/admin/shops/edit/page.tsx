"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EditorOnly } from "@/components/admin/EditorOnly";
import { ShopForm } from "@/components/admin/ShopForm";
import { deleteShop, getShopForEdit, updateShop } from "@/lib/repository/admin";
import type { ShopFormValues } from "@/lib/admin/shopSchema";

/** 店舗の編集（?id=）。 */
export default function EditShopPage() {
  return (
    <EditorOnly>
      <Suspense fallback={<Loading />}>
        <EditShopInner />
      </Suspense>
    </EditorOnly>
  );
}

function EditShopInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return <Loading text="店舗が見つかりません。" />;
  }
  // id をキーに再マウントし、?id= 切替時に前店舗の状態が残らないようにする。
  return <ShopEditor key={id} id={id} />;
}

function ShopEditor({ id }: { id: string }) {
  const [values, setValues] = useState<ShopFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getShopForEdit(id)
      .then((v) => {
        if (!active) return;
        if (!v) setNotFound(true);
        else setValues(v);
      })
      .catch(() => {
        if (active) setError("店舗の取得に失敗しました。");
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(v: ShopFormValues) {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateShop(id, v);
      window.location.assign("/admin/shops");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("この店舗を削除します。よろしいですか？")) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteShop(id);
      window.location.assign("/admin/shops");
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました。");
      setSubmitting(false);
    }
  }

  if (notFound) {
    return <Loading text="店舗が見つかりません。" />;
  }
  // 取得自体に失敗した場合は永続ローディングにせずエラーを出す。
  if (!values && error) {
    return <Loading text={error} />;
  }
  if (!values) {
    return <Loading />;
  }

  return (
    <>
      <div className="mx-auto flex max-w-[640px] items-center justify-between px-5 pt-6">
        <h1 className="text-xl font-bold text-ivory-100">店舗を編集</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="rounded-full border border-error/50 px-3 py-1.5 text-xs font-bold text-error disabled:opacity-60"
        >
          削除
        </button>
      </div>
      <ShopForm defaultValues={values} onSubmit={handleSubmit} submitting={submitting} serverError={error} />
    </>
  );
}

function Loading({ text = "読み込み中…" }: { text?: string }) {
  return <p className="mx-auto max-w-[640px] px-5 py-10 text-sm text-ivory-500">{text}</p>;
}
