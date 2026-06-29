import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts"
    ]
  }
]);

export default eslintConfig;
