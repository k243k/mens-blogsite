import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next@16 はネイティブ flat config を直接エクスポートする
// （FlatCompat でラップすると循環参照エラーになる）。
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "supabase/functions/**",
    ],
  },
];

export default eslintConfig;
