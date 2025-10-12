import type { ComponentProps } from "react";

import Image from "next/image";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

import AdSlot from "@/components/ads/AdSlot";
import { AffiliateLink } from "@/components/affiliate/AffiliateLink";

function ResponsiveImage(props: ComponentProps<typeof Image>) {
  const { className, alt = "", ...rest } = props;
  return <Image {...rest} alt={alt} className={`rounded-xl ${className ?? ""}`.trim()} />;
}

export const mdxComponents: MDXRemoteProps["components"] = {
  AdSlot,
  AffiliateLink,
  img: ResponsiveImage,
};
