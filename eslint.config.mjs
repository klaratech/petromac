import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "**/.next/**",
      // Claude Code worktrees — local-only, gitignored, contain copies of
      // src/ that would otherwise be re-linted as duplicates.
      ".claude/**",
      "node_modules/**",
      "scripts/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  prettierConfig,
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "prefer-const": "error",
      "no-var": "error",
      "react/no-unescaped-entities": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  {
    files: ["next-env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    files: ["src/types/**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
