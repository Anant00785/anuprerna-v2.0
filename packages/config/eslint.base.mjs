import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Shared flat ESLint base (ESLint 9). Extend per package: `import base from "@anuprerna/config/eslint.base.mjs"`.
export default tseslint.config(
  { ignores: ["dist/**", ".next/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
