import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";

export const getToken = (): string | null =>
  Cookies.get(TOKEN_KEY) ?? null;

export const setToken = (token: string): void => {
  Cookies.set(TOKEN_KEY, token, { sameSite: "strict" });
};

export const removeToken = (): void => {
  Cookies.remove(TOKEN_KEY);
};

// Возвращает true если токен существует, но уже истёк.
// Если токена нет — возвращает false (proxy.ts обрабатывает этот случай сам).
export const isTokenExpired = (): boolean => {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
