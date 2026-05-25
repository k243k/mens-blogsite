"use client";

import { useState } from "react";

import { EditorOnly } from "@/components/admin/EditorOnly";
import { ShopForm } from "@/components/admin/ShopForm";
import { createShop } from "@/lib/repository/admin";
import type { ShopFormValues } from "@/lib/admin/shopSchema";

/** 店舗の新規作成。 */
export default function NewShopPage() {
  return (
    <EditorOnly>
      <NewShopInner />
    </EditorOnly>
  );
}

function NewShopInner() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ShopFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      await createShop(values);
      window.location.assign("/admin/shops");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-[640px] px-5 pt-6">
        <h1 className="text-xl font-bold text-ivory-100">店舗を追加</h1>
      </div>
      <ShopForm onSubmit={handleSubmit} submitting={submitting} serverError={error} />
    </>
  );
}
