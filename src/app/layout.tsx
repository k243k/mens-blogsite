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
      <head>
        {/* 見出し・ブランド用の明朝ディスプレイ。日本語グリフ込みで全デバイスに明朝を保証。
            Google が unicode-range で分割配信するため実使用文字分のみDLされる。 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${notoSansJP.variable} antialiased`}>{children}</body>
    </html>
  );
}
