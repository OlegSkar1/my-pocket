// ESLint для фронтенда (Next.js). Наследует общий базовый конфиг
// и добавляет нативные flat-конфиги Next (eslint-config-next v16+).
import baseConfig from "@my-pocket/config/eslint.base.mjs";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...baseConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default config;
