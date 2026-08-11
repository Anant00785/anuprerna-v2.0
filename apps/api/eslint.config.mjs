import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Flat ESLint config (ESLint 9). Mirrors packages/config/eslint.base.mjs; self-contained.
export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["**/*.{spec,test}.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },

  // ─── Migration debt ratchet ────────────────────────────────────────────
  // apps/api is a direct port of the Java Loom backend (572 files, ~42.7k LOC
  // landed in one merge). It arrives with, as of 2026-08-12:
  //   306 x ban-ts-comment   (@ts-nocheck headers — 386 of 572 files)
  //   311 x no-explicit-any
  //   191 x no-unused-vars
  // Blocking CI on those today would leave lint permanently red, which trains
  // everyone to ignore it — the exact failure mode that let this repo ship
  // 45k LOC with no enforcement at all. So they are warnings HERE ONLY:
  // visible and countable, but not a wall.
  //
  // These are a ratchet, not an amnesty. The counts above only go down.
  // When a file is touched, clear its warnings; when a domain reaches zero,
  // promote it back to "error" with a `files:` override. Progress is tracked
  // in docs/KNOWN-GAPS.md. Do NOT add @ts-nocheck to a new file — new code is
  // held to the unmodified rules everywhere else in the monorepo.
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
);
