// ESLint для фронтенда (Next.js). Наследует общий базовый конфиг
// и добавляет правила Next (core-web-vitals) через FlatCompat.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import baseConfig from "@my-pocket/config/eslint.base.mjs";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default [
  ...baseConfig,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
