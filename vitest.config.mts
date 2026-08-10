import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Расширение .mts обязательно: с .ts Vite грузит конфиг как CommonJS
// и ругается на ESM-синтаксис.
export default defineConfig({
  resolve: {
    alias: {
      // В KMotors алиас "@" указывает на ./src, а не на корень проекта.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.spec.ts"],
    environment: "node",
  },
});
