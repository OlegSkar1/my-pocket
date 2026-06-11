export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  settings: "/settings",
  support: "/support",
} as const;

export const TOKEN_COOKIE = "access_token";

export const AUTH_PATHS = [ROUTES.login, ROUTES.register] as const;
