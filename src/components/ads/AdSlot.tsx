import type { HTMLAttributes } from "react";

type AdSlotProps = HTMLAttributes<HTMLDivElement> & {
  id: string;
};

/**
 * AdSenseなどの広告枠をラップするためのプレースホルダ。実装時にスクリプトを挿入する。
 */
export default function AdSlot({ id, className, ...props }: AdSlotProps) {
  return (
    <div
      data-ad-slot={id}
      className={`relative flex min-h-24 items-center justify-center rounded-lg border border-dashed border-foreground/20 bg-background/60 text-xs uppercase tracking-widest text-foreground/40 ${className ?? ""}`.trim()}
      {...props}
    >
      AD SLOT: {id}
    </div>
  );
}
