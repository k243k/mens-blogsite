import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type AffiliateLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  trackingId?: string;
};

export function AffiliateLink({ href, trackingId, children, ...props }: AffiliateLinkProps) {
  const url = typeof href === "string" ? appendTrackingParams(href, trackingId) : href;

  return (
    <Link
      {...props}
      href={url}
      rel="sponsored noopener"
      target={props.target ?? "_blank"}
      className={`inline-flex items-center gap-2 font-semibold text-emerald-600 underline-offset-4 transition hover:underline ${props.className ?? ""}`.trim()}
    >
      {children}
    </Link>
  );
}

function appendTrackingParams(url: string, trackingId?: string) {
  try {
    const parsed = new URL(url);
    if (trackingId) {
      parsed.searchParams.set("aff_id", trackingId);
    }
    return parsed.toString();
  } catch (error) {
    console.warn("AffiliateLink: invalid URL", error);
    return url;
  }
}
