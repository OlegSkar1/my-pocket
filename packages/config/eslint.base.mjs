// Общий базовый ESLint flat-config (@my-pocket).
// Наследуется в apps/* через `eslint.config.mjs`.
// Требует ESLint 9 (flat config), @eslint/js и typescript-eslint.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Игнорируется во всех воркспейсах, которые наследуют этот конфиг.
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**", "**/out/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Отключает ESLint-правила, конфликтующие с Prettier — всегда последним.
  prettier,
);
