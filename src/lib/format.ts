export function formatDate(date: Date | string | null, options: Intl.DateTimeFormatOptions = {}) {
  if (!date) return "未設定";
  const instance = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(instance);
}

export function formatPriceJPY(price: number) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(price);
}
