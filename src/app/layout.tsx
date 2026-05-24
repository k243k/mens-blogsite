import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jiisan-estet.com";

export const metadata: Metadata = {
  title: {
    default: "夜に、外さないための本音レビュー",
    template: "%s | メンズエステ本音レビュー",
  },
  description:
    "料金、雰囲気、清潔感、写真とのギャップまで。行く前に知りたいメンズエステの本音を記録するレビューサイト。",
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} antialiased`}>{children}</body>
    </html>
  );
}
