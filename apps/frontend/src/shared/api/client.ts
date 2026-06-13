import { env } from "@/shared/config";
import { getToken, removeToken } from "@/shared/lib";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      removeToken();
    }
    const body = await res
      .json()
      .catch(() => ({ message: "Неизвестная ошибка" }));
    const message: string = Array.isArray(body.message)
      ? (body.message[0] as string)
      : (body.message ?? "Неизвестная ошибка");
    throw new ApiError(res.status, message);
  }

  // 204 No Content и любые ответы с пустым телом — возвращаем undefined,
  // не пытаясь распарсить JSON (иначе "Unexpected end of JSON input").
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
