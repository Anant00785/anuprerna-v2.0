import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ─── Migration debt ratchet ────────────────────────────────────────────
  // The `lint` script here was `next lint`, which Next 16 removed — it parsed
  // "lint" as a directory name and exited 1 without ever linting a file. So
  // this app has never been linted, and switching to the ESLint CLI surfaced
  // 448 errors at once. As of 2026-08-12, after --fix:
  //   364 x no-explicit-any          (the port from the Angular Weave admin)
  //    59 x react-hooks/set-state-in-effect
  //     6 x react-hooks/immutability
  //     6 x react-hooks/purity
  // Blocking CI on these today leaves lint permanently red, which trains
  // everyone to ignore it. They are warnings HERE ONLY: visible, countable,
  // not a wall.
  //
  // A ratchet, not an amnesty — the counts only go down. Clear a file's
  // warnings when you touch it. The react-hooks rules point at real bugs
  // (state set during render/effect), so fix those in preference to the
  // `any`s. Tracked in docs/KNOWN-GAPS.md.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
]);

export default eslintConfig;
