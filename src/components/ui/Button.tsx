import Link from "next/link";
import type { ReactNode } from "react";

/**
 * ボタン / リンクボタン。
 * 出典: design-spec §7.2。Primary=ゴールド塗り / Secondary=ゴールド枠 / Ghost=透明。
 * href があれば <Link>、なければ <button> としてレンダリングする。
 */
type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
};

const BASE =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold tracking-wide transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne-400 hover:-translate-y-px";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(110deg,#e8c48f,#d2a679_55%,#a9784e)] text-night-950 shadow-[0_10px_30px_rgba(210,166,121,0.28)] hover:shadow-[0_14px_40px_rgba(210,166,121,0.42)] hover:brightness-105",
  secondary:
    "border border-champagne-400/40 text-ivory-100 hover:border-champagne-400/70 hover:bg-champagne-400/10",
  ghost: "text-ivory-300 hover:text-ivory-100",
};

export function Button({
  children,
  href,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
}: ButtonProps) {
  const cls = `${BASE} ${VARIANT[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
