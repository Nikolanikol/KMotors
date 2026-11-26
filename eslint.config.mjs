import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Параметр с «_» — осознанно неиспользуемый (сигнатура совместимости).
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // служебные каталоги: worktrees Claude, отдельный Vite-проект, разовые раннеры, данные
      ".claude/**",
      "design-reference/**",
      "sql/**",
      "blog-drafts/**",
      "data/**",
    ],
  },
];

export default eslintConfig;
