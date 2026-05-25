"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * HERO 背景のクロスフェード・スライドショー（差し替え前提のサンプル）。
 * 数秒ごとに画像を切り替え、各画像に Ken Burns を掛けて常に動きを出す。
 * 本番画像（女の子の写真など）は public/samples/ を差し替えればそのまま反映される。
 */
const IMAGES = ["/samples/hero-2.jpg", "/samples/hero3.jpg", "/samples/hero4.jpg"];
const INTERVAL_MS = 4500;

export function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % IMAGES.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      {IMAGES.map((src, idx) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={idx === 0}
          sizes="100vw"
          className={`ken-burns object-cover object-center transition-opacity duration-[1600ms] ease-in-out ${
            idx === active ? "opacity-70" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
