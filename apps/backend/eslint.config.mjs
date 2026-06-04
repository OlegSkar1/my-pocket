// ESLint для бэкенда (Nest.js). Наследует общий базовый конфиг.
import baseConfig from "@my-pocket/config/eslint.base.mjs";

export default [
  ...baseConfig,
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parserOptions: { sourceType: "commonjs" },
    },
    rules: {
      // Nest.js строится на декораторах, DI и пустых классах-модулях.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
];
