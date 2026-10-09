import type { User } from "@/types";

const BASE = import.meta.env.VITE_API_URL;

let accessToken: string | null = null;
export const setToken = (t: string | null) => {
  accessToken = t;
};
export const getToken = () => accessToken;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshing: Promise<User | null> | null = null;

// Ask the server for a new access token using the refresh cookie.
export function refresh(): Promise<User | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        accessToken = null;
        return null;
      }
      const data = await res.json();
      accessToken = data.accessToken;
      return data.user as User;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export async function http<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
  canRetry = true,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Token expired? Refresh once and retry the same request.
  if (res.status === 401 && canRetry && !path.startsWith("/auth/")) {
    if (await refresh()) return http<T>(path, options, false);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.error ?? "Request failed");
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
