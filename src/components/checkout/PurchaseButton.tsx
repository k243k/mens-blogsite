"use client";

import { useState, useTransition } from "react";

export function PurchaseButton({ postId, successUrl, cancelUrl, priceLabel }: { postId: string; successUrl: string; cancelUrl: string; priceLabel: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, successUrl, cancelUrl }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.error ?? "決済の開始に失敗しました。");
          return;
        }

        const data = (await response.json()) as { url?: string };
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError("決済URLを取得できませんでした。");
        }
      } catch (err) {
        console.error(err);
        setError("決済処理中にエラーが発生しました。");
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "決済ページへ移動中..." : `${priceLabel}で購入する`}
      </button>
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
