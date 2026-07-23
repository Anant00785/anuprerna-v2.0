import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Flat ESLint config (ESLint 9). Mirrors packages/config/eslint.base.mjs; self-contained.
export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["**/*.{spec,test}.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
);
